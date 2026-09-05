import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { nextUpdatedAt } from "@/lib/assessment/cas-token"
import {
  asAddonType,
} from "@/lib/addon-types"
import {
  asFoundation,
  isCheckoutSessionSettled,
  resolvePaidReportSummary,
} from "@/lib/paid-report-session"
import { resolveConsultationBank } from "@/lib/consultation/bank-registry"
import {
  readDeterministicConsultationSnapshot,
  readDeterministicConsultationState,
  sanitiseCandidateAnswers,
  snapshotIsResolvable,
  DETERMINISTIC_STATE_KIND,
  DETERMINISTIC_STATE_SCHEMA_VERSION,
  EMPTY_DETERMINISTIC_STATE,
  type DeterministicConsultationState,
} from "@/lib/consultation/session-envelope"
import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { validateAnswer } from "@/lib/consultation/validation"
import type { ConsultationAnswers, ConsultationContext } from "@/lib/consultation/types"

/**
 * One answer on a deterministic Consultation — Phase 3C-A.
 *
 * ══ WHY A SEPARATE ROUTE ════════════════════════════════════════════════════
 *
 * `save-deep-progress` owns legacy sessions and validates a question id against
 * the persisted `DeepQuestion[]` snapshot. Teaching it a second mode would give
 * one endpoint two notions of what a question is, two notions of what an answer
 * may be, and one shared body schema loose enough for both — and the failure
 * mode of that ambiguity is a legacy answer stored against a deterministic
 * session, which nothing downstream could detect. The two contracts stay
 * separate; the discriminator does the routing.
 *
 * What IS shared is the persistence discipline, because it was hard-won: one
 * changed answer per request, read-modify-write, compare-and-set on
 * `updated_at`, bounded retry, and never reporting a save the database did not
 * confirm. See the long note in `app/api/save-deep-progress/route.ts`.
 *
 * ══ AUTHORITY ══════════════════════════════════════════════════════════════
 *
 * The browser may assert exactly one thing: what the customer answered. The
 * foundation, the entitled lens, the bank and its fingerprint all come from the
 * settled Stripe session and the stored snapshot, and a request that disagrees
 * with either is refused rather than reconciled.
 *
 * ══ NOT ACTIVE ═════════════════════════════════════════════════════════════
 *
 * No live surface calls this in Phase 3C-A. Real paid customers remain on the
 * legacy flow, and the deterministic client is preview-only with no persistence
 * wired to it.
 */

const bodySchema = z
  .object({
    sessionId: z.string().trim().min(8).max(200),
    questionId: z.string().trim().min(1).max(120),
    // Shape only. What an answer MEANS is decided by the canonical validator
    // against the question it belongs to, never by this schema.
    value: z.union([z.number(), z.string().max(5000), z.array(z.string().max(200)).max(50)]).optional(),
    clear: z.literal(true).optional(),
    /** The customer moved past an optional question without answering it. */
    skipOptional: z.literal(true).optional(),
    /** Where the customer now is. Validated against applicability, not trusted. */
    currentQuestionId: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .refine((b) => b.clear === true || b.skipOptional === true || b.value !== undefined, {
    message: "either value, clear or skipOptional is required",
  })

const SAVE_ATTEMPTS = 3

function refuse(status: number, error: string) {
  return NextResponse.json({ error }, { status })
}

export async function PATCH(req: NextRequest) {
  const limit = rateLimit(`consultation-progress:${getClientIp(req)}`, 60, 10 * 60_000)
  if (!limit.allowed) {
    const { body: rlBody, init } = rateLimitResponse(limit)
    return NextResponse.json(rlBody, init)
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    // Never echoed: the payload carries a customer's answer.
    return refuse(400, "Invalid request body")
  }

  const { sessionId, questionId } = body

  const supabase = getSupabase()
  if (!supabase) {
    // Saying "ok" with nowhere to save is a lie the client cannot detect.
    return refuse(503, "Service unavailable")
  }

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
    // A Stripe fault is not a customer error, and proceeding without the
    // trusted context is the one thing this route must not do.
    return refuse(503, "Could not verify your session")
  }

  for (let attempt = 0; attempt < SAVE_ATTEMPTS; attempt++) {
    let row: { questions?: unknown; answers?: unknown; updated_at?: string | null } | null
    try {
      const { data, error } = await supabase
        .from("deep_assessments")
        .select("questions, answers, updated_at")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      if (error) {
        console.error("[consultation-progress] read error:", error.message)
        return refuse(503, "Could not save your progress")
      }
      row = (data as typeof row) ?? null
    } catch (err) {
      console.error("[consultation-progress] read failed:", err)
      return refuse(503, "Could not save your progress")
    }

    // This route never creates a row, exactly like the legacy one.
    if (!row) return refuse(404, "No assessment found for this session")

    // A legacy array here means this is a legacy session; it is not ours to
    // touch, and there is no safe conversion.
    if (Array.isArray(row.questions)) return refuse(409, "This session is not a deterministic Consultation")

    const snapshot = readDeterministicConsultationSnapshot(row.questions)
    if (!snapshot) return refuse(409, "This session is not ready")
    if (!snapshotIsResolvable(snapshot)) return refuse(409, "This Consultation cannot be resumed")

    // The stored session and the settled payment must agree. They can only
    // disagree if one of them was tampered with or a session was reused.
    if (snapshot.foundation !== trustedFoundation) return refuse(409, "This session is not ready")
    if (snapshot.entitledLens !== trustedLens) return refuse(409, "This session is not ready")

    const bank = resolveConsultationBank(snapshot.bankVersion)
    if (!bank) return refuse(409, "This Consultation cannot be resumed")

    const question = bank.find((q) => q.id === questionId)
    if (!question) return refuse(422, "Unknown question")

    const stored = readDeterministicConsultationState(row.answers) ?? EMPTY_DETERMINISTIC_STATE
    const { answers: candidates } = sanitiseCandidateAnswers(stored.candidateAnswers, snapshot.bankVersion)

    const context: ConsultationContext = {
      foundation: snapshot.foundation,
      lens: snapshot.entitledLens,
    }

    // Applicability is judged against the answers ALREADY stored, so a customer
    // cannot open a branch and answer its child in the same request.
    const applicableIds = new Set(
      resolveApplicableQuestions({ questions: bank, context, answers: candidates }).map((q) => q.id),
    )
    if (!applicableIds.has(questionId)) return refuse(422, "That question does not apply")

    const nextAnswers: ConsultationAnswers = { ...candidates }
    const touched = new Set(stored.touchedQuestionIds)
    const skipped = new Set(stored.skippedOptionalQuestionIds)

    if (body.clear) {
      delete nextAnswers[questionId]
      touched.delete(questionId)
    } else if (body.skipOptional) {
      if (question.required) return refuse(422, "That question is required")
      delete nextAnswers[questionId]
      skipped.add(questionId)
    } else {
      const validated = validateAnswer(question, body.value)
      if (validated.status !== "valid") return refuse(422, "That answer is not valid for this question")
      nextAnswers[questionId] = validated.value
      touched.add(questionId)
      // Answering an optional question un-skips it: the two states are
      // distinct, and a stale skip beside a real answer would misdescribe both.
      skipped.delete(questionId)
    }

    // A cursor is accepted only if it names a question that applies once this
    // delta is in place — otherwise the customer is left where the server can
    // actually put them, and resume repairs it.
    const proposedCursor = body.currentQuestionId
    const cursorAfter = resolveApplicableQuestions({
      questions: bank,
      context,
      answers: nextAnswers,
    }).map((q) => q.id)
    const currentQuestionId =
      proposedCursor !== undefined && proposedCursor !== null && cursorAfter.includes(proposedCursor)
        ? proposedCursor
        : (stored.currentQuestionId ?? questionId)

    const nextState: DeterministicConsultationState = {
      kind: DETERMINISTIC_STATE_KIND,
      schemaVersion: DETERMINISTIC_STATE_SCHEMA_VERSION,
      candidateAnswers: nextAnswers,
      touchedQuestionIds: [...touched],
      skippedOptionalQuestionIds: [...skipped],
      currentQuestionId,
      // Phase never advances here. `review` and `ready-for-report` are
      // Phase 3C-B's to set, and a route that could set them would be a
      // finalisation path built ahead of the review screen that gates it.
      phase: stored.phase === "questions" ? "questions" : stored.phase,
    }

    try {
      let q = supabase
        .from("deep_assessments")
        .update({ answers: nextState, updated_at: nextUpdatedAt(row.updated_at) })
        .eq("stripe_session_id", sessionId)
      q = row.updated_at == null ? q.is("updated_at", null) : q.eq("updated_at", row.updated_at)

      const { data, error } = await q.select("stripe_session_id")
      if (error) {
        console.error("[consultation-progress] write failed:", error.message)
        return refuse(503, "Could not save your progress")
      }
      if (data && data.length > 0) {
        return NextResponse.json({ ok: true, saved: questionId })
      }
      // Someone wrote between our read and our write: re-read and re-apply.
    } catch (err) {
      console.error("[consultation-progress] write exception:", err)
      return refuse(503, "Could not save your progress")
    }
  }

  console.error(`[consultation-progress] could not converge in ${SAVE_ATTEMPTS} attempts`)
  return refuse(503, "Could not save your progress")
}
