import type { EnsureReportRefusal, EnsureReportResult } from "@/lib/report/persisted/outcomes"

import type { ExternalReportCategory, ExternalReportOutcome } from "./types"

/**
 * Internal refusal → what the customer is told — Phase 4B-S1.
 *
 * ══ THE PROBLEM THIS SOLVES ═════════════════════════════════════════════════
 *
 * S4 answers with thirty-five refusal reasons plus a retryable `unavailable`.
 * Its own contract says every one of them is internal and none should reach a
 * browser as written, and it is right twice over: they name banks, fingerprints,
 * digests, producer identities and canonical forms, which is engine-room
 * vocabulary — and several of them would confirm to an unauthorised caller that
 * a particular assessment exists.
 *
 * ══ WHY A TOTAL RECORD AND NOT A SWITCH ═════════════════════════════════════
 *
 * A switch with a `default` arm accepts a thirty-sixth reason silently and
 * gives it whatever the default says. A total `Record<EnsureReportRefusal, …>`
 * cannot be constructed without every key, so adding a reason to S4 breaks this
 * build until somebody decides what a customer should be told about it. The
 * compiler is the exhaustiveness check; the test only proves the compiler was
 * not bypassed.
 *
 * ══ WHY TWO CATEGORIES SHARE A STATUS ═══════════════════════════════════════
 *
 * `report_not_ready` and `report_cannot_be_produced` are both 409. That is
 * deliberate, and the contract says so out loud: THE MACHINE CODE, NOT THE HTTP
 * STATUS, IS THE DISCRIMINATOR. 422 was considered and rejected — it describes a
 * request the server cannot process, and the request is perfectly well formed;
 * the defect is in stored server state. 500 was rejected because it frames a
 * permanent defect as a transient fault and invites exactly the retry that
 * cannot help.
 */

/**
 * Every `EnsureReportRefusal`, mapped. Thirty-five keys, no default arm.
 *
 * Only two reasons are `report_not_found`, and both are cases where there is
 * genuinely no deterministic Report to speak about: the row is absent, or it is
 * a legacy assessment rather than a deterministic Consultation. Everything else
 * that a customer could mistake for "not found" is an authorisation failure,
 * which never reaches this map — see `EXTERNAL_NOT_FOUND`.
 */
export const EXTERNAL_CATEGORY_BY_REFUSAL: Record<EnsureReportRefusal, ExternalReportCategory> = {
  /* ── There is no deterministic Report here ─────────────────────────────── */
  "assessment-not-found": "report_not_found",
  "mode-conflict": "report_not_found",

  /* ── The Consultation is not finished. The customer can change this ────── */
  "not-finalised": "report_not_ready",

  /* ── Everything else: a Report exists or should, and cannot be served ──── */
  "seal-incoherent": "report_cannot_be_produced",
  "state-unreadable": "report_cannot_be_produced",
  "historical-snapshot-malformed": "report_cannot_be_produced",
  "historical-finalisation-malformed": "report_cannot_be_produced",
  "historical-finalisation-unsupported-version": "report_cannot_be_produced",
  "historical-identity-mismatch": "report_cannot_be_produced",
  "orphan-report": "report_cannot_be_produced",
  "persisted-report-malformed": "report_cannot_be_produced",
  "persisted-report-unsupported-schema": "report_cannot_be_produced",
  "producer-identity-unknown": "report_cannot_be_produced",
  "producer-lens-unsupported": "report_cannot_be_produced",
  "question-authority-mismatch": "report_cannot_be_produced",
  "unknown-source-question": "report_cannot_be_produced",
  "provenance-incoherent": "report_cannot_be_produced",
  "cardinality-invalid": "report_cannot_be_produced",
  "role-invalid": "report_cannot_be_produced",
  "digest-mismatch": "report_cannot_be_produced",
  "canonical-form-mismatch": "report_cannot_be_produced",
  "handoff-mismatch": "report_cannot_be_produced",
  "parent-mismatch": "report_cannot_be_produced",
  "report-finalisation-mismatch": "report_cannot_be_produced",
  "generation-version-unsupported": "report_cannot_be_produced",
  "generation-identity-mismatch": "report_cannot_be_produced",
  "bank-unsupported": "report_cannot_be_produced",
  "bank-fingerprint-unsupported": "report_cannot_be_produced",
  "unsupported-answer-value": "report_cannot_be_produced",
  "lens-unsupported": "report_cannot_be_produced",
  "safety-contradiction": "report_cannot_be_produced",
  "no-authorised-content": "report_cannot_be_produced",
  "proposition-refused": "report_cannot_be_produced",
  "self-check-failed": "report_cannot_be_produced",
  "conflicting-authority": "report_cannot_be_produced",
}

const STATUS_BY_CATEGORY: Record<ExternalReportCategory, 404 | 409 | 503> = {
  report_not_found: 404,
  report_not_ready: 409,
  report_temporarily_unavailable: 503,
  report_cannot_be_produced: 409,
}

/**
 * Retryability is INHERITED from S4, never re-decided.
 *
 * S4 marks exactly one outcome `retryable: true`. Anything else advertised as
 * retryable would invite a customer, a client or a monitor to retry a state no
 * retry can change.
 */
function outcome(category: ExternalReportCategory): ExternalReportOutcome {
  return {
    category,
    status: STATUS_BY_CATEGORY[category],
    retryable: category === "report_temporarily_unavailable",
  }
}

/**
 * The single response for EVERY authorisation failure and every locator that
 * does not resolve.
 *
 * Unauthorised and nonexistent must be indistinguishable. If they were not, the
 * difference between the two responses would itself be an oracle: present a
 * handoff id, and the status tells you whether that Report exists. The uniform
 * 404 is the same discipline `app/api/account/pdf-url/route.ts:35-37` already
 * applies to the legacy PDF.
 */
export const EXTERNAL_NOT_FOUND: ExternalReportOutcome = outcome("report_not_found")

/** Infrastructure could not answer. The only retryable outcome there is. */
export const EXTERNAL_TEMPORARILY_UNAVAILABLE: ExternalReportOutcome = outcome(
  "report_temporarily_unavailable",
)

export function externalOutcomeForRefusal(reason: EnsureReportRefusal): ExternalReportOutcome {
  return outcome(EXTERNAL_CATEGORY_BY_REFUSAL[reason])
}

/**
 * The whole projection from an S4 failure, including its `unavailable` branch.
 *
 * Typed on the failure branches only. A successful result is not an outcome to
 * be mapped, and accepting one here would invite a caller to ask this module
 * what to tell a customer about a Report it should be rendering.
 */
export function externalOutcomeForFailure(
  failure: Extract<EnsureReportResult, { ok: false }>,
): ExternalReportOutcome {
  return failure.reason === "unavailable"
    ? EXTERNAL_TEMPORARILY_UNAVAILABLE
    : externalOutcomeForRefusal(failure.reason)
}
