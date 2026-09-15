/**
 * What `ensurePersistedConsultationReport` can answer — Phase 4A-S4.
 *
 * Refusals are values, never exceptions. "This Consultation is not finished"
 * and "the stored artifact disagrees with its own digest" are both ordinary
 * answers to a question, and throwing would make them indistinguishable from a
 * crash at the one boundary where the difference decides whether a customer is
 * shown a Report or an apology.
 *
 * Every reason below is INTERNAL. None is customer copy, and none should reach
 * a browser as written: 4B maps them onto at most four external categories —
 * not ready, not found, temporarily unavailable, cannot be produced. S4 exposes
 * no route, so nothing crosses that boundary here.
 */

import type { PersistedReportV1 } from "./types"

export type EnsureReportRefusal =
  /* ── Resolution, shared by both paths ────────────────────────────────── */
  | "assessment-not-found"
  | "mode-conflict"
  | "not-finalised"
  | "seal-incoherent"
  | "state-unreadable"
  /* ── Historical read. Every one of these means STOP, never regenerate ── */
  | "historical-snapshot-malformed"
  | "historical-finalisation-malformed"
  | "historical-finalisation-unsupported-version"
  | "historical-identity-mismatch"
  | "orphan-report"
  | "persisted-report-malformed"
  | "persisted-report-unsupported-schema"
  | "producer-identity-unknown"
  | "producer-lens-unsupported"
  | "question-authority-mismatch"
  | "unknown-source-question"
  | "provenance-incoherent"
  | "cardinality-invalid"
  | "role-invalid"
  | "digest-mismatch"
  | "canonical-form-mismatch"
  | "handoff-mismatch"
  | "parent-mismatch"
  | "report-finalisation-mismatch"
  /* ── First generation only ───────────────────────────────────────────── */
  | "generation-version-unsupported"
  | "generation-identity-mismatch"
  | "bank-unsupported"
  | "bank-fingerprint-unsupported"
  | "unsupported-answer-value"
  | "lens-unsupported"
  | "safety-contradiction"
  | "no-authorised-content"
  | "proposition-refused"
  | "self-check-failed"
  | "conflicting-authority"

export type EnsureReportResult =
  | {
      ok: true
      /** Whether this call composed the Report or found one already committed. */
      outcome: "generated" | "existing"
      report: PersistedReportV1
      handoffId: string
    }
  /**
   * Retryable. A database that could not be read is NOT a Consultation without
   * a Report, and the difference is the whole of §15: treating a read failure
   * as absence is how a second authority gets written over a first.
   */
  | { ok: false; retryable: true; reason: "unavailable"; detail: string }
  | { ok: false; retryable: false; reason: EnsureReportRefusal; detail: string }

export function refuse(reason: EnsureReportRefusal, detail: string): EnsureReportResult {
  return { ok: false, retryable: false, reason, detail }
}

export function unavailable(detail: string): EnsureReportResult {
  return { ok: false, retryable: true, reason: "unavailable", detail }
}
