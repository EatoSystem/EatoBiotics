/**
 * The branch, and the only writer — Phase 4A-S4.
 *
 * ══ THE BRANCH IS TAKEN ON ROW PRESENCE, BEFORE ANY DECODING ════════════════
 *
 * A successful query that returns no row is the ONLY thing that may lead to
 * generation. A query that errored is not an absent Report — it is an unknown
 * one, and treating the two alike is how a second authority gets composed over
 * a first that was merely unreadable for a moment. `data ?? null` is the exact
 * shape of that mistake, which is why the error is checked first and separately
 * and why a sabotage case exists for collapsing them.
 *
 * A row that IS present never reaches generation, whatever state it is in. A
 * malformed persisted Report is a fault to investigate, not a vacancy to fill.
 *
 * ══ INSERT ONLY ═════════════════════════════════════════════════════════════
 *
 * No upsert, no update, no delete-and-retry. The database arbitrates the
 * singleton through its unique constraints, because two server invocations
 * cannot arbitrate it between themselves. The loser of a race re-reads the
 * winner and returns it — after validating it exactly as any other read, and
 * after comparing its own digest against the winner's, because under a
 * deterministic composer over an immutable seal those must agree.
 */

import { refuse, unavailable, type EnsureReportResult } from "../outcomes"
import {
  readPersistedReport,
  resolveHistoricalSeal,
  type AssessmentRowForHistory,
  type PersistedReportRow,
} from "./historical-read"
import { composeForFirstGeneration } from "./first-generation"

/** The narrow slice of a Supabase client this service uses. */
export interface ReportPersistenceClient {
  readAssessment(sessionId: string): Promise<
    { ok: true; row: AssessmentRowForHistory | null } | { ok: false; detail: string }
  >
  readReport(assessmentId: unknown): Promise<
    { ok: true; row: PersistedReportRow | null } | { ok: false; detail: string }
  >
  insertReport(input: {
    handoffId: string
    assessmentId: unknown
    canonicalText: string
    digest: string
  }): Promise<{ ok: true } | { ok: false; uniqueViolation: boolean; detail: string }>
}

export interface EnsureCoreInput {
  readonly sessionId: string
  readonly client: ReportPersistenceClient
}

export async function ensureReportWithDependencies(
  input: EnsureCoreInput,
): Promise<EnsureReportResult> {
  const { sessionId, client } = input

  const assessment = await client.readAssessment(sessionId)
  if (!assessment.ok) return unavailable(`assessment read failed: ${assessment.detail}`)
  const row = assessment.row
  if (!row) return refuse("assessment-not-found", "no assessment for this session")

  // A legacy array here is a legacy session. Not ours, and there is no safe
  // conversion — the deterministic snapshot is an object.
  if (Array.isArray(row.questions)) {
    return refuse("mode-conflict", "this session is not a deterministic Consultation")
  }

  /* ══ The branch ═════════════════════════════════════════════════════════ */
  const existing = await client.readReport(row.id)
  if (!existing.ok) return unavailable(`report read failed: ${existing.detail}`)

  if (existing.row) {
    const seal = resolveHistoricalSeal(row)
    if (!seal.ok) {
      /*
       * A Report exists and its parent is no longer coherently sealed. Not
       * "regenerate": a persisted Report whose seal cannot be read is a
       * contradiction the foreign key cannot express, and the only safe reading
       * of it is that something is wrong upstream.
       */
      if (
        seal.result.ok === false &&
        (seal.result.reason === "not-finalised" || seal.result.reason === "seal-incoherent")
      ) {
        return refuse("orphan-report", `a Report exists but the seal is ${seal.result.reason}`)
      }
      return seal.result
    }
    return readPersistedReport({ row, reportRow: existing.row, seal: seal.context })
  }

  /* ══ Confirmed absent: first generation ═════════════════════════════════ */
  const composed = composeForFirstGeneration(row)
  if (!composed.ok) return composed.result

  const written = await client.insertReport({
    handoffId: composed.composed.handoffId,
    assessmentId: row.id,
    canonicalText: composed.composed.canonicalText,
    digest: composed.composed.digest,
  })

  if (!written.ok && !written.uniqueViolation) {
    return unavailable(`report insert failed: ${written.detail}`)
  }

  /*
   * Both the winner and the loser re-read through the SAME historical path.
   *
   * The winner does it because a Report nobody can read back is not persisted
   * in any useful sense; the loser because the row it is about to return was
   * written by somebody else and deserves every check a stored Report gets.
   */
  const after = await client.readReport(row.id)
  if (!after.ok) return unavailable(`report re-read failed: ${after.detail}`)
  if (!after.row) {
    // Nothing is there after an insert that either succeeded or lost a race to
    // another insert. Something is arbitrating this table that we do not know
    // about; refusing is the only honest answer.
    return refuse("conflicting-authority", "no Report row after a completed insert")
  }

  const seal = resolveHistoricalSeal(row)
  if (!seal.ok) return seal.result

  const validated = readPersistedReport({ row, reportRow: after.row, seal: seal.context })
  if (!validated.ok) return validated

  if (after.row.canonical_report_sha256 !== composed.composed.digest) {
    /*
     * A deterministic composer over an immutable seal cannot produce two
     * different documents. An inequality here means the composer stopped being
     * deterministic, the seal changed under a write-once trigger, or two
     * handoffs collided — each severe, none of them a reason to overwrite the
     * row that got there first.
     */
    return refuse(
      "conflicting-authority",
      "the stored Report differs from the one this attempt composed",
    )
  }

  return { ...validated, outcome: written.ok ? "generated" : "existing" }
}
