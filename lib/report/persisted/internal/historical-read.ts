/**
 * Reading an already-persisted Report — Phase 4A-S4, frozen path.
 *
 * ══ WHAT THIS MODULE IS NOT ALLOWED TO KNOW ═════════════════════════════════
 *
 * Nothing live. Not the bank registry, not `SCIENCE_CONTRACT_VERSION`, not
 * `asAddonType`, not the permission registry, the content pack, the capability
 * registry or the composer. A Report that has been persisted was produced by a
 * build that no longer has to exist, and every one of those would eventually
 * answer a question about today instead of about the artifact.
 *
 * A guard asserts the import list; the reasoning is what the guard is for.
 *
 * ══ EVERY FAILURE IS A FULL STOP ════════════════════════════════════════════
 *
 * There is no repair anywhere below. A stored Report that fails its digest, its
 * canonical form, its producer identity or its binding to the seal is not
 * regenerated, not overwritten and not partially served — because each of those
 * would replace something a customer has already been given with something
 * assembled after the fact.
 */

import { reportDigest } from "../digest"
import { decodePersistedReportV1 } from "../decode-report"
import { serialisePersistedReport } from "../serialise-persisted"
import {
  decodeHistoricalFinalisationV1,
  decodeHistoricalSnapshotV1,
  decodeHistoricalStateV1,
  readHistoricalSealV1,
} from "../decode-consultation"
import { refuse, type EnsureReportResult } from "../outcomes"
import type { HistoricalConsultationFinalisationV1 } from "../types"

/** The `deep_assessments` columns this path reads. Nothing is written. */
export interface AssessmentRowForHistory {
  readonly id: unknown
  readonly questions: unknown
  readonly answers: unknown
  readonly consultation_finalisation?: unknown
  readonly consultation_handoff_id?: unknown
}

/** The `consultation_reports` row, exactly as stored. */
export interface PersistedReportRow {
  readonly consultation_handoff_id: unknown
  readonly assessment_id: unknown
  readonly canonical_report: unknown
  readonly canonical_report_sha256: unknown
}

/** Everything the historical path establishes, for the caller that needs it. */
export interface HistoricalSealContext {
  readonly handoffId: string
  readonly finalisation: HistoricalConsultationFinalisationV1
}

export type HistoricalSealResult =
  | { ok: true; context: HistoricalSealContext }
  | { ok: false; result: EnsureReportResult }

/**
 * Decode the sealed Consultation on v1's terms.
 *
 * Shared by the historical read and by the first-generation self-check, so the
 * Report about to be written is bound to the seal by the SAME rules that will
 * later be used to read it back. A Report that could be written but never read
 * is not a Report.
 */
export function resolveHistoricalSeal(row: AssessmentRowForHistory): HistoricalSealResult {
  const snapshot = decodeHistoricalSnapshotV1(row.questions)
  if (!snapshot.ok) {
    return { ok: false, result: refuse("historical-snapshot-malformed", "questions") }
  }

  const state = decodeHistoricalStateV1(row.answers)
  if (!state.ok) return { ok: false, result: refuse("state-unreadable", "answers") }

  const seal = readHistoricalSealV1(
    {
      consultation_finalisation: row.consultation_finalisation,
      consultation_handoff_id: row.consultation_handoff_id,
    },
    state.state,
  )
  if (seal.status === "incoherent") {
    return { ok: false, result: refuse("seal-incoherent", seal.detail) }
  }
  if (seal.status === "unsealed") {
    return { ok: false, result: refuse("not-finalised", "no seal on this Consultation") }
  }

  const finalisation = decodeHistoricalFinalisationV1(seal.finalisation, snapshot.snapshot)
  if (!finalisation.ok) {
    const reason =
      finalisation.reason === "unsupported-version"
        ? "historical-finalisation-unsupported-version"
        : finalisation.reason === "identity-mismatch"
          ? "historical-identity-mismatch"
          : "historical-finalisation-malformed"
    return { ok: false, result: refuse(reason, finalisation.reason) }
  }

  return {
    ok: true,
    context: { handoffId: seal.handoffId, finalisation: finalisation.finalisation },
  }
}

/**
 * Validate a stored Report against its storage, its producer and its seal.
 *
 * The order matters. Storage integrity first, because a Report whose bytes are
 * not the bytes that were written has nothing else worth checking; then the
 * document's own shape and producer; then the binding to this customer's seal.
 */
export function readPersistedReport(input: {
  row: AssessmentRowForHistory
  reportRow: PersistedReportRow
  seal: HistoricalSealContext
}): EnsureReportResult {
  const { row, reportRow, seal } = input

  /* ── Storage ──────────────────────────────────────────────────────────── */
  if (typeof reportRow.canonical_report !== "string" || reportRow.canonical_report.length === 0) {
    return refuse("persisted-report-malformed", "canonical_report is not text")
  }
  if (typeof reportRow.canonical_report_sha256 !== "string") {
    return refuse("persisted-report-malformed", "canonical_report_sha256 is not text")
  }
  if (reportDigest(reportRow.canonical_report) !== reportRow.canonical_report_sha256) {
    return refuse("digest-mismatch", "stored digest does not describe the stored bytes")
  }
  if (reportRow.assessment_id !== row.id) {
    return refuse("parent-mismatch", "the Report row belongs to another assessment")
  }
  if (reportRow.consultation_handoff_id !== seal.handoffId) {
    return refuse("handoff-mismatch", "the Report row names another handoff")
  }

  /* ── The document ─────────────────────────────────────────────────────── */
  let parsed: unknown
  try {
    parsed = JSON.parse(reportRow.canonical_report)
  } catch {
    return refuse("persisted-report-malformed", "stored text is not JSON")
  }

  const decoded = decodePersistedReportV1(parsed)
  if (!decoded.ok) {
    const reason =
      decoded.reason === "malformed"
        ? "persisted-report-malformed"
        : decoded.reason === "unsupported-schema"
          ? "persisted-report-unsupported-schema"
          : decoded.reason
    return refuse(reason, decoded.detail)
  }
  const { report, producer } = decoded

  // Canonical form: the object must re-serialise to exactly the bytes stored.
  // A storage layer that normalised the text, or an edit that kept a consistent
  // digest, both land here rather than being served.
  if (serialisePersistedReport(report) !== reportRow.canonical_report) {
    return refuse("canonical-form-mismatch", "stored text is not the canonical form of its content")
  }

  /* ── Producer entitlement ─────────────────────────────────────────────── */
  if (!producer.supportedEntitledLenses.includes(seal.finalisation.entitledLens)) {
    return refuse(
      "producer-lens-unsupported",
      `a "${String(seal.finalisation.entitledLens)}" seal is not something this producer could render`,
    )
  }

  /* ── Binding to the seal ──────────────────────────────────────────────── */
  const f = seal.finalisation
  const p = report.provenance
  const equalities: [string, unknown, unknown][] = [
    ["foundation", report.foundation, f.foundation],
    ["provenance.handoffId", p.handoffId, seal.handoffId],
    ["provenance.bankVersion", p.bankVersion, f.bankVersion],
    ["provenance.bankFingerprint", p.bankFingerprint, f.bankFingerprint],
    ["provenance.scienceContractVersion", p.scienceContractVersion, f.scienceContractVersion],
    ["provenance.finalisationVersion", p.finalisationVersion, f.finalisationVersion],
    ["provenance.finalisedAt", p.finalisedAt, f.finalisedAt],
  ]
  for (const [name, fromReport, fromSeal] of equalities) {
    if (fromReport !== fromSeal) {
      return refuse("report-finalisation-mismatch", `${name} disagrees with the sealed Consultation`)
    }
  }

  return { ok: true, outcome: "existing", report, handoffId: seal.handoffId }
}
