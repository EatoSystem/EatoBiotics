import { randomUUID } from "node:crypto"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { nextUpdatedAt } from "@/lib/assessment/cas-token"
import { asAddonType } from "@/lib/addon-types"
import { asFoundation, isCheckoutSessionSettled, resolvePaidReportSummary } from "@/lib/paid-report-session"
import {
  prepareConsultationFinalisation,
  readConsultationFinalisation,
} from "@/lib/consultation/finalisation"
import { readConsultationSeal } from "@/lib/consultation/seal"
import {
  readDeterministicConsultationSnapshot,
  readDeterministicStateSlot,
  snapshotIsResolvable,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"

/**
 * Seal a finished deterministic Consultation — Phase 3C-C2A.
 *
 * ══ THE ONE INVARIANT ═══════════════════════════════════════════════════════
 *
 *   ONE paid Consultation → ONE immutable trusted finalisation → ONE handoff.
 *
 * A refresh, a retry, a double-click and two tabs racing each other must all
 * end at the same handoff id and the same finalised time. Not "usually" — the
 * finalisation is the record a Report will be built from, and two of them for
 * one customer is two different accounts of what they said.
 *
 * ══ WHAT IT IS NOT ══════════════════════════════════════════════════════════
 *
 * Not a Report, and not the beginning of one. Nothing here calls a model, the
 * legacy Report generator, a PDF writer or an email sender, and no "generating"
 * state is invented to imply one is coming. The deliverable is a sealed record
 * and an id for it. Phase 4A will read that record; C2B will decide when a real
 * customer ever reaches this route, which today is never.
 *
 * ══ WHY IT IS ONE UPDATE ════════════════════════════════════════════════════
 *
 * Three facts become true together: the state is finished, this is what was
 * finished, and this is its name. Writing them in three calls would leave a
 * window in which a crash produces a Consultation that is sealed in one column
 * and still editable in another — and nothing downstream could tell which half
 * to believe. So it is a single conditional UPDATE, guarded on the observed
 * `updated_at` AND on both seal columns still being NULL.
 *
 * ══ WHY THE CUSTOMER'S BROWSER SENDS ONLY AN ID ═════════════════════════════
 *
 * Everything else is derived: the settled payment, the foundation, the entitled
 * lens, the bank, the answers, completeness, the food-safety state and the
 * time. A body field for any of those would be a way to CLAIM trust rather than
 * establish it, and the value of this record is that nothing in it came from
 * the client except the answers the client was asked for.
 */

const bodySchema = z
  .object({
    sessionId: z.string().trim().min(8).max(200),
  })
  /*
   * `.strict()`, so `trustedAnswers`, `finalisedAt`, `handoffId`, `foundation`,
   * `lens`, `bank`, `bankFingerprint`, `completeness`, `foodGuidance` or
   * `readyForReport` in the body is a 400 rather than a silently ignored key.
   *
   * Ignoring them would be safe exactly until someone read one. A refusal says
   * the browser has no vote here, and says it at the edge rather than in a
   * comment three files away.
   */
  .strict()

const ATTEMPTS = 3

function refuse(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status })
}

/** The row this route reads. The two seal columns are Migration 48's. */
interface FinaliseRow {
  questions?: unknown
  answers?: unknown
  updated_at?: string | null
  consultation_finalisation?: unknown
  consultation_handoff_id?: unknown
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`consultation-finalise:${getClientIp(req)}`, 30, 10 * 60_000)
  if (!limit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(limit)
    return NextResponse.json(rlBody, init)
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    // Never echoed: a rejected body may carry a customer's answers.
    return refuse(400, "Invalid request body")
  }
  const { sessionId } = body

  const supabase = getSupabase()
  if (!supabase) return refuse(503, "Service unavailable")

  /* ── Stripe is the authority on who this is and what they bought ───────── */
  let trustedFoundation: "you" | "family"
  let trustedLens: ReturnType<typeof asAddonType>
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (!isCheckoutSessionSettled(session)) return refuse(402, "Payment is not settled")
    const summary = await resolvePaidReportSummary(session, supabase)
    if (!summary) return refuse(404, "No assessment found for this session")
    trustedFoundation = asFoundation(summary.foundationType) ?? "you"
    trustedLens = asAddonType(summary.selectedAddon)
  } catch {
    return refuse(503, "Could not verify your session")
  }

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    let row: FinaliseRow | null
    try {
      const { data, error } = await supabase
        .from("deep_assessments")
        .select("questions, answers, updated_at, consultation_finalisation, consultation_handoff_id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      if (error) {
        console.error("[consultation-finalise] read error:", error.message)
        return refuse(503, "Could not finish your Consultation")
      }
      row = (data as FinaliseRow) ?? null
    } catch (err) {
      console.error("[consultation-finalise] read failed:", err)
      return refuse(503, "Could not finish your Consultation")
    }

    if (!row) return refuse(404, "No assessment found for this session")

    // A legacy array here is a legacy session. It is not ours to seal, and
    // there is no safe conversion.
    if (Array.isArray(row.questions)) {
      return refuse(409, "This session is not a deterministic Consultation")
    }

    const snapshot = readDeterministicConsultationSnapshot(row.questions)
    if (!snapshot) return refuse(409, "This session is not ready")
    // The stored session and the settled payment must agree. Checked before the
    // seal is read, so a mismatched row cannot hand back a handoff either.
    if (snapshot.foundation !== trustedFoundation) return refuse(409, "This session is not ready")
    if (snapshot.entitledLens !== trustedLens) return refuse(409, "This session is not ready")

    const slot = readDeterministicStateSlot(row.answers)
    if (slot.status === "unreadable") return refuse(409, "This Consultation state cannot be read")
    const stored = slot.state

    /* ── The seal, adjudicated before anything is built ──────────────────── */

    /*
     * The shared reader, so this route and the two mutation routes cannot
     * disagree about what "sealed" means. Deliberately NOT re-checked against
     * the live bank registry: a sealed record whose bank has since been revised
     * is still the authority for its own handoff, and rebuilding it under
     * today's questions would replace what the customer finished with what
     * their session would mean now.
     */
    const seal = readConsultationSeal(row, stored)

    if (seal.status === "incoherent") {
      // Half-sealed, or sealed with an open cursor. Never repaired, never
      // overwritten, never given a second handoff: a partial seal is evidence
      // that something wrote outside this route, and guessing which half is
      // right is how one customer ends up with two finalisations. Identifiers
      // and stage only — never the payload.
      console.error(`[consultation-finalise] refusing incoherent seal for ${sessionId}: ${seal.detail}`)
      return refuse(409, "This Consultation cannot be finished")
    }

    if (seal.status === "sealed") {
      const persisted = readConsultationFinalisation(seal.finalisation, snapshot)
      if (!persisted.ok) {
        // Unreadable, or belonging to another session. The tempting repair —
        // build a fresh one from today's answers — is exactly what sealing
        // exists to prevent, so this refuses instead.
        console.error(
          `[consultation-finalise] stored finalisation rejected for ${sessionId}: ${persisted.reason}`,
        )
        return refuse(409, "This Consultation cannot be finished")
      }

      // Already done. No write, no second C1 call, no new id, no new time.
      return NextResponse.json({
        ok: true,
        phase: "ready-for-report" as const,
        handoffId: seal.handoffId,
        finalisedAt: persisted.finalisation.finalisedAt,
      })
    }

    /* ── A new seal ──────────────────────────────────────────────────────── */

    // Only NOW does the live bank matter. Answers given against a bank that has
    // drifted are not answers to today's questions, and adopting today's would
    // silently reinterpret them.
    if (!snapshotIsResolvable(snapshot)) return refuse(409, "This Consultation cannot be resumed")

    /*
     * The canonical builder, and the only way a finalisation is ever created.
     *
     * It re-runs completeness itself, immediately before producing the payload
     * — not Review's earlier verdict, not this route's. A concurrent edit is
     * precisely the case where an earlier verdict is still true and no longer
     * correct.
     *
     * Server time, injected per attempt. The timestamp belonging to the
     * successful commit is the one that becomes immutable; a losing attempt's
     * is discarded with the attempt.
     */
    const prepared = prepareConsultationFinalisation({
      snapshot,
      state: stored,
      finalisedAt: new Date(),
    })

    if (!prepared.ok) {
      switch (prepared.reason) {
        case "incomplete":
          // The canonical outstanding ids, as Review already returns them. No
          // interpretation added — just where to go back to.
          return refuse(409, "Your Consultation is not finished yet", {
            firstQuestionId: prepared.firstQuestionId ?? null,
            missingQuestionIds: prepared.missingQuestionIds ?? [],
            invalidQuestionIds: prepared.invalidQuestionIds ?? [],
          })
        case "review-edit-active":
          return refuse(409, "Finish the answer you are editing first")
        case "not-in-review":
          return refuse(409, "Your Consultation is not ready to finish")
        default:
          // bank-unavailable / bank-mismatch.
          return refuse(409, "This Consultation cannot be resumed")
      }
    }

    /*
     * The state that goes with the seal.
     *
     * Candidate answers are carried through UNTOUCHED. A closed branch's answer
     * is not pruned here, and the map is not rebuilt from the trusted
     * projection: the mutable state records everything the customer entered,
     * and the finalisation records what counts. Collapsing the two would
     * destroy an answer they never withdrew, in the one write that can never be
     * undone.
     */
    const nextState: DeterministicConsultationState = {
      ...stored,
      phase: "ready-for-report",
      currentQuestionId: null,
    }

    const handoffId = randomUUID()

    try {
      let q = supabase
        .from("deep_assessments")
        .update({
          answers: nextState,
          consultation_finalisation: prepared.finalisation,
          consultation_handoff_id: handoffId,
          updated_at: nextUpdatedAt(row.updated_at),
        })
        .eq("stripe_session_id", sessionId)
        // Nobody has written since we read...
        .is("consultation_finalisation", null)
        // ...and nobody has sealed it, even in a write that left `updated_at`
        // alone. Two independent guards because they fail for different
        // reasons: the token catches an ordinary edit, these catch a race
        // between two finalisers.
        .is("consultation_handoff_id", null)
      q = row.updated_at == null ? q.is("updated_at", null) : q.eq("updated_at", row.updated_at)

      const { data, error } = await q.select("stripe_session_id")
      if (error) {
        console.error("[consultation-finalise] write failed:", error.message)
        return refuse(503, "Could not finish your Consultation")
      }
      if (data && data.length > 0) {
        return NextResponse.json({
          ok: true,
          phase: "ready-for-report" as const,
          handoffId,
          finalisedAt: prepared.finalisation.finalisedAt,
        })
      }
      /*
       * Zero rows. Somebody wrote between the read and the write, and the loop
       * re-reads rather than forcing.
       *
       * If another finaliser won, the next pass finds a valid seal and returns
       * THEIR handoff — this attempt's id and timestamp are discarded and never
       * reach the database. If an ordinary edit won, the next pass re-derives
       * everything and lets the canonical builder decide whether the
       * Consultation is still finishable at all.
       */
    } catch (err) {
      console.error("[consultation-finalise] write exception:", err)
      return refuse(503, "Could not finish your Consultation")
    }
  }

  console.error(`[consultation-finalise] could not converge in ${ATTEMPTS} attempts`)
  return refuse(503, "Could not finish your Consultation")
}
