import { nextUpdatedAt } from "@/lib/assessment/cas-token"
import { asAddonType } from "@/lib/addon-types"
import {
  asFoundation,
  ownedPaidAssessmentFields,
  type PaidReportSummary,
} from "@/lib/paid-report-session"

import { resolveDeterministicInit } from "./session-init"
import {
  EMPTY_DETERMINISTIC_STATE,
  type DeterministicConsultationSnapshot,
} from "./session-envelope"

/**
 * Open or reuse a deterministic Consultation on a paid row — Phase 3C-C2B.
 *
 * ══ WHY THIS IS A SERVER MODULE, NOT COMPONENT CODE ═════════════════════════
 *
 * It writes. A browser that could construct the snapshot could choose the
 * foundation, the entitled lens and the bank the customer is questioned
 * against — the three things the whole deterministic architecture exists to
 * take out of the client's hands. Everything below derives from the settled
 * Stripe summary the caller has already resolved.
 *
 * ══ WHY IT MIRRORS `generate-deep-questions` ════════════════════════════════
 *
 * That route has claimed `questions` atomically since #227, and the claim is
 * the same claim: `stripe_session_id` is UNIQUE, so an `INSERT` that raises
 * 23505 and an `UPDATE … WHERE questions IS NULL` proved by `.select()` decide
 * one winner between them without a lock. Writing a second algorithm for the
 * other flow would be two answers to "who owns this row", which is precisely
 * the state that destroys a customer's session.
 *
 * The PURE half of the decision is `resolveDeterministicInit` — legacy vs
 * reuse vs initialise vs the three refusals — and is not restated here.
 *
 * ══ WHAT IT NEVER DOES ══════════════════════════════════════════════════════
 *
 * Never converts. A stored legacy array is returned as legacy and left exactly
 * as it is; a stored snapshot is reused, never rewritten to match a changed
 * context. Never forces: a lost race is re-read and the winner accepted.
 */

export type ConsultationClaim =
  /** A deterministic Consultation is now open on this row. */
  | { status: "deterministic"; snapshot: DeterministicConsultationSnapshot; claimed: boolean }
  /** The legacy questionnaire owns this row. Nothing was written. */
  | { status: "legacy" }
  /** Nothing safe to do. Never a fallback — the caller fails closed. */
  | {
      status: "refused"
      reason:
        /** Stored questions are present and neither format. */
        | "unreadable"
        /** Stored snapshot disagrees with the settled Stripe context. */
        | "context-conflict"
        /** Stored snapshot names a bank this build does not hold. */
        | "bank-unavailable"
        /** Unclaimed, but the row already carries another flow's work. */
        | "occupied"
        /** The database could not be read or written. */
        | "unavailable"
    }

/** Minimal PostgREST surface, so this is testable without a Supabase client. */
type ClaimClient = {
  from: (table: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface ClaimInput {
  supabase: ClaimClient
  sessionId: string
  /** Already resolved from the SETTLED checkout by the caller. */
  summary: PaidReportSummary
  now?: Date
}

const ATTEMPTS = 3

interface ObservedRow {
  questions?: unknown
  answers?: unknown
  report_json?: unknown
  updated_at?: string | null
}

export async function claimDeterministicConsultation(
  input: ClaimInput,
): Promise<ConsultationClaim> {
  const { supabase, sessionId, summary } = input

  const foundation = asFoundation(summary.foundationType) ?? "you"
  const entitledLens = asAddonType(summary.selectedAddon)

  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    let observed: ObservedRow | null
    try {
      const { data, error } = await supabase
        .from("deep_assessments")
        // `answers` and `report_json` are read for occupancy, not for content:
        // a row carrying either belongs to a flow that has already started.
        .select("questions, answers, report_json, updated_at")
        .eq("stripe_session_id", sessionId)
        .maybeSingle()
      if (error) {
        console.error("[consultation-claim] read error:", error.message)
        return { status: "refused", reason: "unavailable" }
      }
      observed = (data as ObservedRow) ?? null
    } catch (err) {
      console.error("[consultation-claim] read failed:", err)
      return { status: "refused", reason: "unavailable" }
    }

    /* ── The row exists ──────────────────────────────────────────────────── */

    if (observed) {
      const decision = resolveDeterministicInit({
        persistedQuestions: observed.questions,
        foundation,
        entitledLens,
        now: input.now,
      })

      if (decision.status === "legacy_session") return { status: "legacy" }
      if (decision.status === "reuse") {
        return { status: "deterministic", snapshot: decision.snapshot, claimed: false }
      }
      if (decision.status === "unreadable") return { status: "refused", reason: "unreadable" }
      if (decision.status === "context_conflict") {
        console.error(`[consultation-claim] stored ${decision.field} disagrees with Stripe: ${sessionId}`)
        return { status: "refused", reason: "context-conflict" }
      }
      if (decision.status === "bank_unavailable") {
        return { status: "refused", reason: "bank-unavailable" }
      }

      /*
       * `initialise`: no snapshot stored. That is necessary but not sufficient.
       *
       * A row with no questions but with answers, or with a Report, is not an
       * empty row — it is a session some other path has already worked on, and
       * historical rows legitimately carry a Report with no persisted question
       * set. Claiming one would put a deterministic snapshot on top of somebody
       * else's Consultation.
       */
      if (observed.answers != null || observed.report_json != null) {
        console.error(`[consultation-claim] refusing to claim an occupied row: ${sessionId}`)
        return { status: "refused", reason: "occupied" }
      }

      try {
        let q = supabase
          .from("deep_assessments")
          .update({
            questions: decision.snapshot,
            answers: EMPTY_DETERMINISTIC_STATE,
            status: "questions_generated",
            updated_at: nextUpdatedAt(observed.updated_at),
          })
          .eq("stripe_session_id", sessionId)
          // The claim itself. Only a row that still has no questions may be
          // claimed, so a legacy generator that installed first cannot be
          // overwritten however this request is timed.
          .is("questions", null)
        q = observed.updated_at == null ? q.is("updated_at", null) : q.eq("updated_at", observed.updated_at)

        const { data, error } = await q.select("stripe_session_id")
        if (error) {
          console.error("[consultation-claim] install error:", error.message)
          return { status: "refused", reason: "unavailable" }
        }
        if (data && data.length > 0) {
          return { status: "deterministic", snapshot: decision.snapshot, claimed: true }
        }
        // Zero rows: somebody claimed between the read and the write. Re-read
        // and accept whichever flow won — never force.
        continue
      } catch (err) {
        console.error("[consultation-claim] install failed:", err)
        return { status: "refused", reason: "unavailable" }
      }
    }

    /* ── No row yet ──────────────────────────────────────────────────────── */

    /*
     * The Stripe webhook creates the row, and the customer can arrive first.
     * `tier` and `free_scores` are NOT NULL with no default, so they are
     * supplied here — from the settled summary through the shared helper, so
     * whichever writer wins, the row says the same thing about what was bought.
     */
    const opening = resolveDeterministicInit({
      persistedQuestions: null,
      foundation,
      entitledLens,
      now: input.now,
    })
    // Structurally the only outcome for a null input; narrowing rather than
    // asserting, so a future change to the resolver cannot slip through.
    if (opening.status !== "initialise") return { status: "refused", reason: "unreadable" }

    try {
      const { error } = await supabase.from("deep_assessments").insert({
        stripe_session_id: sessionId,
        ...ownedPaidAssessmentFields(summary),
        email: summary.email ?? null,
        questions: opening.snapshot,
        answers: EMPTY_DETERMINISTIC_STATE,
        status: "questions_generated",
      })
      if (!error) {
        return { status: "deterministic", snapshot: opening.snapshot, claimed: true }
      }
      if (error.code !== "23505") {
        console.error("[consultation-claim] insert error:", error.message)
        return { status: "refused", reason: "unavailable" }
      }
      // Lost the insert race — `stripe_session_id` is UNIQUE, so somebody else
      // created it. Re-read and accept whichever mode they installed.
      continue
    } catch (err) {
      console.error("[consultation-claim] insert failed:", err)
      return { status: "refused", reason: "unavailable" }
    }
  }

  console.error(`[consultation-claim] could not converge in ${ATTEMPTS} attempts: ${sessionId}`)
  return { status: "refused", reason: "unavailable" }
}
