import { getSupabase } from "@/lib/supabase"

import { unavailable, type EnsureReportResult } from "./outcomes"
import {
  ensureReportWithDependencies,
  type ReportPersistenceClient,
} from "./internal/ensure-core"
import type { AssessmentRowForHistory, PersistedReportRow } from "./internal/historical-read"

/**
 * The production entry point — Phase 4A-S4.
 *
 * ══ ONE ARGUMENT, AND IT IS A LOCATOR ══════════════════════════════════════
 *
 * `sessionId` names a row. It is not evidence of anything, and this function
 * accepts nothing that could be mistaken for evidence: no Stripe session, no
 * finalisation, no handoff, no report, no digest, no foundation, no lens, no
 * database client. A caller cannot claim authority here, because there is no
 * parameter through which a claim could travel.
 *
 * ══ WHY STRIPE IS NOT HERE ══════════════════════════════════════════════════
 *
 * A seal exists only because `POST /api/consultation/finalise` verified the
 * checkout session was settled before writing it, and that proof is immutable.
 * Re-verifying it on every read would make a €49 deliverable depend on a
 * third-party API being reachable — and the earlier design's other candidate,
 * `paid_report_intents`, expires after thirty days by design. A Report that
 * stops being readable because a cache aged out is not persistence.
 *
 * ══ WHAT THIS IS NOT ════════════════════════════════════════════════════════
 *
 * NOT the customer authentication boundary. It answers "what is the canonical
 * Report for this sealed Consultation", not "may you see it". Phase 4B owns
 * authentication and authorisation and must establish both before calling this.
 * Nothing in S4 exposes it: there is no route, no server action and no caller
 * outside the test suite, and guards assert that.
 */
export async function ensurePersistedConsultationReport(input: {
  sessionId: string
}): Promise<EnsureReportResult> {
  const supabase = getSupabase()
  if (!supabase) return unavailable("database is not configured")

  const client: ReportPersistenceClient = {
    async readAssessment(sessionId) {
      try {
        const { data, error } = await supabase
          .from("deep_assessments")
          .select("id, questions, answers, consultation_finalisation, consultation_handoff_id")
          .eq("stripe_session_id", sessionId)
          .maybeSingle()
        // An error is NOT an absent row, and the two must not collapse into
        // `data ?? null` — see the branch rule in `internal/ensure-core.ts`.
        if (error) return { ok: false, detail: error.message }
        return { ok: true, row: (data as AssessmentRowForHistory | null) ?? null }
      } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : "read threw" }
      }
    },

    async readReport(assessmentId) {
      try {
        const { data, error } = await supabase
          .from("consultation_reports")
          .select("consultation_handoff_id, assessment_id, canonical_report, canonical_report_sha256")
          .eq("assessment_id", assessmentId as string)
          .maybeSingle()
        if (error) return { ok: false, detail: error.message }
        return { ok: true, row: (data as PersistedReportRow | null) ?? null }
      } catch (err) {
        return { ok: false, detail: err instanceof Error ? err.message : "read threw" }
      }
    },

    async insertReport({ handoffId, assessmentId, canonicalText, digest }) {
      try {
        // INSERT only. No upsert, no onConflict, no update path — the database
        // arbitrates the singleton, and a loser re-reads rather than writes.
        const { error } = await supabase.from("consultation_reports").insert({
          consultation_handoff_id: handoffId,
          assessment_id: assessmentId as string,
          canonical_report: canonicalText,
          canonical_report_sha256: digest,
        })
        if (!error) return { ok: true }
        return {
          ok: false,
          // Only a genuine unique violation is a race. Every other failure is
          // reported as itself, so a constraint we did not expect cannot be
          // mistaken for "somebody else got there first".
          uniqueViolation: (error as { code?: string }).code === "23505",
          detail: error.message,
        }
      } catch (err) {
        return {
          ok: false,
          uniqueViolation: false,
          detail: err instanceof Error ? err.message : "insert threw",
        }
      }
    },
  }

  return ensureReportWithDependencies({ sessionId: input.sessionId, client })
}
