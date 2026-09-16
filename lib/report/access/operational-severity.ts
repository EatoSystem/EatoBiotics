import type { EnsureReportRefusal, EnsureReportResult } from "@/lib/report/persisted/outcomes"

import type { OperationalSeverity } from "./types"

/**
 * Internal refusal → what an OPERATOR is told — Phase 4B-S1.
 *
 * ══ WHY THIS IS A SECOND, ORTHOGONAL MAP ════════════════════════════════════
 *
 * Thirty-two internal reasons collapse onto one customer sentence,
 * `report_cannot_be_produced`. They are not equally interesting to the people
 * who keep this running.
 *
 *   lens-unsupported   the engine correctly declined to describe a lens the
 *                      deterministic bank holds no questions for. Paging on it
 *                      would be paging on correct behaviour.
 *   bank-unsupported   a deploy moved the bank under a seal that still names
 *                      the old one. Somebody should look, tomorrow.
 *   digest-mismatch    a stored artifact disagrees with its own hash. Somebody
 *                      should look now.
 *
 * An earlier draft of this layer called all thirty-two an integrity alarm. That
 * was wrong, and wrong in the direction that destroys alarms: a pager that fires
 * on correct behaviour is a pager people learn to ignore, and then the one that
 * mattered arrives at 3am and is swiped away with the others.
 *
 * ══ THE HARD RULE ═══════════════════════════════════════════════════════════
 *
 * SEVERITY NEVER REACHES A BROWSER, AND NEVER CHANGES WHAT THE CUSTOMER IS
 * TOLD. The two maps are computed from the same input and are otherwise
 * unrelated; nothing may make the response depend on this one. A customer who
 * could observe severity could enumerate the engine's internal state through a
 * channel the external contract was carefully built to close.
 *
 * ══ TOTAL RECORD, SAME REASONING AS THE EXTERNAL MAP ════════════════════════
 *
 * A thirty-sixth reason breaks this build rather than inheriting a severity by
 * default. "Inherits the wrong severity silently" is precisely how a new
 * integrity failure would ship classified as routine.
 */
export const OPERATIONAL_SEVERITY_BY_REFUSAL: Record<EnsureReportRefusal, OperationalSeverity> = {
  /* ══ A — expected / product refusal (7) ═══════════════════════════════════
   * Info-level, rate dashboard only. The engine declined correctly.
   */
  "assessment-not-found": "expected",
  /** A legacy assessment, not a deterministic Consultation. Ordinary. */
  "mode-conflict": "expected",
  "not-finalised": "expected",
  "lens-unsupported": "expected",
  "safety-contradiction": "expected",
  "no-authorised-content": "expected",
  "proposition-refused": "expected",

  /* ══ B — compatibility refusal (9) ════════════════════════════════════════
   * Warn-level, alert on rate. A version, fingerprint or identity moved under a
   * sealed artifact. A deploy changed something; nothing is corrupt.
   */
  "historical-finalisation-unsupported-version": "compatibility",
  "persisted-report-unsupported-schema": "compatibility",
  "producer-identity-unknown": "compatibility",
  "producer-lens-unsupported": "compatibility",
  "generation-version-unsupported": "compatibility",
  /**
   * Compatibility rather than integrity, which reads oddly until you see WHERE
   * it fires: the first-generation path, BEFORE anything is written. It means a
   * deploy moved the producer without updating the frozen identity tuple, and
   * the pre-persist check caught it. Nothing corrupt exists to alarm about.
   */
  "generation-identity-mismatch": "compatibility",
  "bank-unsupported": "compatibility",
  "bank-fingerprint-unsupported": "compatibility",
  /**
   * Not a product refusal: it means the bank's options moved under a seal that
   * still names that bank version. That is a compatibility fact about a deploy,
   * not the engine declining to say something.
   */
  "unsupported-answer-value": "compatibility",

  /* ══ C — integrity alarm (19) ═════════════════════════════════════════════
   * Page immediately. A stored artifact disagrees with itself or with frozen
   * authority — something that should be impossible has been written.
   */
  /**
   * Migration 48's `deep_assessments_seal_pair` and
   * `deep_assessments_seal_state_coherent` CHECKs make this state unwritable,
   * so observing it live means a constraint is missing or was bypassed. Same
   * reasoning for `state-unreadable` below.
   */
  "seal-incoherent": "integrity",
  "state-unreadable": "integrity",
  "historical-snapshot-malformed": "integrity",
  "historical-finalisation-malformed": "integrity",
  "historical-identity-mismatch": "integrity",
  "orphan-report": "integrity",
  "persisted-report-malformed": "integrity",
  /**
   * Within a KNOWN report-use version, a mismatch against the frozen record is
   * disagreement rather than drift — the version says which record applies, and
   * the document does not match it. Same for `unknown-source-question`, where a
   * stored Report cites a question the frozen authority does not hold.
   */
  "question-authority-mismatch": "integrity",
  "unknown-source-question": "integrity",
  "provenance-incoherent": "integrity",
  "cardinality-invalid": "integrity",
  "role-invalid": "integrity",
  "digest-mismatch": "integrity",
  "canonical-form-mismatch": "integrity",
  "handoff-mismatch": "integrity",
  "parent-mismatch": "integrity",
  "report-finalisation-mismatch": "integrity",
  /** The composer produced a Report that its own reader rejects. */
  "self-check-failed": "integrity",
  /** Two different Reports converged on one handoff. */
  "conflicting-authority": "integrity",
}

export function operationalSeverityForRefusal(reason: EnsureReportRefusal): OperationalSeverity {
  return OPERATIONAL_SEVERITY_BY_REFUSAL[reason]
}

/**
 * The full projection, including S4's retryable branch.
 *
 * `unavailable` is deliberately NOT a key of the Record above: it is not a
 * refusal, it is the absence of an answer, and giving it a row alongside
 * thirty-five judgements about content would blur the one distinction S4 spent
 * a repair round establishing.
 */
export function operationalSeverityForFailure(
  failure: Extract<EnsureReportResult, { ok: false }>,
): OperationalSeverity {
  return failure.reason === "unavailable"
    ? "infrastructure"
    : operationalSeverityForRefusal(failure.reason)
}
