import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { nextUpdatedAt } from "@/lib/assessment/cas-token"
import { asAddonType } from "@/lib/addon-types"
import { asFoundation, isCheckoutSessionSettled, resolvePaidReportSummary } from "@/lib/paid-report-session"
import { resolveConsultationBank } from "@/lib/consultation/bank-registry"
import {
  readDeterministicConsultationSnapshot,
  readDeterministicStateSlot,
  sanitiseCandidateAnswers,
  snapshotIsResolvable,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import { readConsultationSeal } from "@/lib/consultation/seal"
import { validateConsultationAnswers } from "@/lib/consultation/completeness"
import type { ConsultationContext } from "@/lib/consultation/types"

/**
 * Enter Review — Phase 3C-B.
 *
 * ══ WHY THE SERVER OWNS THE TRANSITION ══════════════════════════════════════
 *
 * The browser may ASK to enter Review. It may not assert that the Consultation
 * is complete, and it may not set `phase` directly: a body carrying
 * `phase: "review"` that the server simply stored would make completeness a
 * client opinion, and the first thing to exploit it would not be an attacker
 * but an ordinary bug — an edit that opens a required branch while the client
 * still believes it is finished.
 *
 * So the client sends a session id and nothing else, and this route re-derives
 * everything: the settled payment, the trusted context, the stored snapshot,
 * the bank behind it, the sanitised candidate answers, and canonical
 * completeness. If something is outstanding it refuses and NAMES where to go
 * back to, so the customer is returned to a real question rather than told
 * "something is wrong".
 *
 * ══ THIS IS NOT FINALISATION ════════════════════════════════════════════════
 *
 * Entering Review writes exactly two fields: `phase` and a cleared cursor. It
 * creates no immutable snapshot, no handoff id, and no Report. `ready-for-report`
 * is never written here — a later phase owns finalisation, and completeness will
 * be checked again immediately before that handoff rather than trusted from
 * this moment.
 */

const bodySchema = z
  .object({
    // Deliberately the only field. Anything else would be a claim the customer's
    // browser is not entitled to make.
    sessionId: z.string().trim().min(8).max(200),
  })
  // `.strict()`, so a body carrying `phase`, `complete` or a list of "missing"
  // ids is REFUSED rather than quietly stripped. Stripping would be safe today
  // and dangerous the moment someone read one of those fields, and a refusal
  // says plainly that the browser does not get a vote on completeness.
  .strict()

const ATTEMPTS = 3

function refuse(status: number, error: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  const limit = rateLimit(`consultation-review:${getClientIp(req)}`, 30, 10 * 60_000)
  if (!limit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(limit)
    return NextResponse.json(rlBody, init)
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return refuse(400, "Invalid request body")
  }
  const { sessionId } = body

  const supabase = getSupabase()
  if (!supabase) return refuse(503, "Service unavailable")

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
    let row: {
      questions?: unknown
      answers?: unknown
      updated_at?: string | null
      consultation_finalisation?: unknown
      consultation_handoff_id?: unknown
    } | null
    try {
      const { data, error } = await supabase
        .from("deep_assessments")
        // The seal columns are read so Review cannot be re-entered on a
        // Consultation that has already been finalised.
        .select("questions, answers, updated_at, consultation_finalisation, consultation_handoff_id")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      if (error) {
        console.error("[consultation-review] read error:", error.message)
        return refuse(503, "Could not open your review")
      }
      row = (data as typeof row) ?? null
    } catch (err) {
      console.error("[consultation-review] read failed:", err)
      return refuse(503, "Could not open your review")
    }

    if (!row) return refuse(404, "No assessment found for this session")
    if (Array.isArray(row.questions)) {
      return refuse(409, "This session is not a deterministic Consultation")
    }

    const snapshot = readDeterministicConsultationSnapshot(row.questions)
    if (!snapshot) return refuse(409, "This session is not ready")
    if (!snapshotIsResolvable(snapshot)) return refuse(409, "This Consultation cannot be resumed")
    if (snapshot.foundation !== trustedFoundation) return refuse(409, "This session is not ready")
    if (snapshot.entitledLens !== trustedLens) return refuse(409, "This session is not ready")

    const bank = resolveConsultationBank(snapshot.bankVersion)
    if (!bank) return refuse(409, "This Consultation cannot be resumed")

    const slot = readDeterministicStateSlot(row.answers)
    if (slot.status === "unreadable") return refuse(409, "This Consultation state cannot be read")
    const stored = slot.state


    /*
     * A finalised Consultation is terminal — Phase 3C-C2A.
     *
     * The record has been sealed and handed off, so a mutation landing now
     * would change answers a frozen payload already describes: the row and the
     * finalisation would disagree, and the finalisation is the one a Report is
     * built from. There is deliberately no "reopen" — that is a product
     * decision nobody has taken, and inventing it here would take it.
     *
     * An INCOHERENT seal refuses for a different reason: something is present
     * that should not be, and writing through evidence we cannot explain is how
     * the explanation gets destroyed.
     *
     * This is inside the retry loop on purpose. A finalisation that lands
     * between this read and this write fails the CAS below, and the next pass
     * sees the seal and refuses — so a mutation cannot slip in after the seal
     * by having read before it.
     */
    const seal = readConsultationSeal(row, stored)
    if (seal.status !== "unsealed") {
      console.error(
        `[consultation-review] refusing mutation on a finalised Consultation ${sessionId}:`,
        seal.status === "sealed" ? "sealed" : seal.detail,
      )
      return refuse(409, "This Consultation has been finished and can no longer be changed")
    }

    const { answers } = sanitiseCandidateAnswers(stored.candidateAnswers, snapshot.bankVersion)
    const context: ConsultationContext = {
      foundation: snapshot.foundation,
      lens: snapshot.entitledLens,
    }

    const completeness = validateConsultationAnswers({ questions: bank, context, answers })

    if (!completeness.complete) {
      /*
       * Refused, with somewhere to go.
       *
       * A stale candidate answer to a closed branch does NOT block this: the
       * projection resolves applicability first, so an answer with no live
       * question behind it is simply not part of the verdict.
       */
      const firstQuestionId =
        completeness.applicableQuestionIds.find(
          (id) =>
            completeness.missingQuestionIds.includes(id) ||
            completeness.invalidQuestionIds.includes(id),
        ) ?? null

      return refuse(409, "Your Consultation is not finished yet", {
        firstQuestionId,
        missingQuestionIds: completeness.missingQuestionIds,
        invalidQuestionIds: completeness.invalidQuestionIds,
      })
    }

    const nextState: DeterministicConsultationState = {
      kind: DETERMINISTIC_STATE_KIND,
      schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
      candidateAnswers: answers,
      touchedQuestionIds: stored.touchedQuestionIds,
      skippedOptionalQuestionIds: stored.skippedOptionalQuestionIds,
      // The Review LIST has no current question. An edit sets the cursor back
      // while the phase stays `review`, which is what makes an interrupted edit
      // resumable without a second stored cursor.
      currentQuestionId: null,
      phase: "review",
    }

    try {
      let q = supabase
        .from("deep_assessments")
        .update({ answers: nextState, updated_at: nextUpdatedAt(row.updated_at) })
        .eq("stripe_session_id", sessionId)
      q = row.updated_at == null ? q.is("updated_at", null) : q.eq("updated_at", row.updated_at)

      const { data, error } = await q.select("stripe_session_id")
      if (error) {
        console.error("[consultation-review] write failed:", error.message)
        return refuse(503, "Could not open your review")
      }
      if (data && data.length > 0) {
        return NextResponse.json({ ok: true, phase: "review" as const })
      }
      // Someone wrote between our read and our write — re-read and re-check.
      // Completeness is re-evaluated on the next pass rather than assumed, so a
      // concurrent edit that opened a required branch still refuses.
    } catch (err) {
      console.error("[consultation-review] write exception:", err)
      return refuse(503, "Could not open your review")
    }
  }

  console.error(`[consultation-review] could not converge in ${ATTEMPTS} attempts`)
  return refuse(503, "Could not open your review")
}
