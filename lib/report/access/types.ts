/**
 * The authorisation and delivery vocabulary — Phase 4B-S1.
 *
 * ══ ZERO IMPORTS, ON PURPOSE ════════════════════════════════════════════════
 *
 * This is a leaf. Every other module in `lib/report/access/` may depend on it
 * and it depends on nothing, so no import here can ever drag a database client,
 * a payment SDK or a framework into the authority layer by accident.
 *
 * ══ WHAT THIS LAYER IS, AND WHAT IT IS NOT ══════════════════════════════════
 *
 * Phase 4A-S4 answers "what is the canonical Report for this sealed
 * Consultation". It deliberately does NOT answer "may you see it" — its own
 * contract says so. This layer answers the second question, and only that one.
 *
 * Nothing here is reachable. There is no route, no endpoint and no caller
 * outside the test suite through S1, S2 and S3; guards assert it. The customer
 * boundary is wired in 4B-S4's controlled activation change, after the schema
 * these types describe actually exists in production.
 */

/* ══ Proof ════════════════════════════════════════════════════════════════ */

/**
 * The two durable proofs a customer may present, and there is no third.
 *
 * ══ WHY STRIPE IS NOT ONE OF THEM ═══════════════════════════════════════════
 *
 * A settled checkout session proved payment BEFORE the Consultation could be
 * sealed, and that proof is immutable. Re-verifying it on every read would make
 * a €49 deliverable depend on a third-party API being reachable — the same
 * reasoning that removed Stripe from S4's service. A settled session may
 * bootstrap a capability inside a finite window (`bootstrap-window.ts`); it is
 * never a proof at read time.
 *
 * ══ WHY THE RAW SESSION ID IS NOT THE GUEST CREDENTIAL ══════════════════════
 *
 * `stripe_session_id` is a payment identity that also unlocks the live
 * consultation routes, and it travels in URLs, browser history and logs. A
 * credential that grants access to health-derived content needs its own
 * lifecycle — one that can be rotated and revoked without touching the
 * payment record. See `capability.ts`.
 */
export type ReportAccessProof =
  | {
      readonly kind: "account"
      readonly userId: string
      /**
       * Only ever consulted while the assessment's `user_id` is null. Once an
       * account owns a row, an email establishes nothing — see
       * `recovery-identity.ts` for why that asymmetry is load-bearing.
       */
      readonly verifiedEmail: string | null
    }
  | {
      readonly kind: "capability"
      /**
       * EVERY same-name cookie the request carried, not the first one.
       *
       * Cookies are path-scoped per Report, and a `Cookie` header carries no
       * path information — so a runtime that returns only the first match would
       * silently authorise against the wrong Report's credential, or fail to
       * find the right one. Taking the whole list makes the ambiguity this
       * layer's problem rather than the framework's.
       */
      readonly presented: readonly string[]
    }

/**
 * What authorisation produces. Resolved entirely server-side.
 *
 * `sessionId` is S4's internal locator and MUST NOT leave the server: it is not
 * in the URL, not in the cookie, and not in any response. It exists in this
 * shape only so the delivery service can call `ensurePersistedConsultationReport`
 * without the route ever having to know it.
 */
export interface AuthorisedReportAccess {
  readonly assessmentId: string
  readonly handoffId: string
  readonly sessionId: string
}

/* ══ What a customer is told ══════════════════════════════════════════════ */

/**
 * At most four external categories. There is no fifth, and no member of the
 * union is a passthrough of an internal reason.
 *
 * S4 defines thirty-five refusal reasons plus a retryable `unavailable`. Every
 * one of them is INTERNAL: they name banks, fingerprints, digests, producer
 * identities and canonical forms, and several would tell an unauthorised caller
 * that a particular assessment exists. `external-outcome.ts` maps all
 * thirty-six onto these four, exhaustively and with no default arm.
 */
export type ExternalReportCategory =
  | "report_not_found"
  | "report_not_ready"
  | "report_temporarily_unavailable"
  | "report_cannot_be_produced"

/**
 * The whole customer-visible payload, and deliberately a small one.
 *
 * No `detail`, no internal reason, no operational severity, no stack, no table
 * name. `requestId` is the only correlator, and it is meaningful to support
 * rather than to the customer — it lets a person quote a number that a log
 * search can find, without the response itself carrying anything about why.
 */
export interface ExternalReportOutcome {
  readonly category: ExternalReportCategory
  readonly status: 404 | 409 | 503
  /**
   * True only for `report_temporarily_unavailable`, and derived from S4's
   * `retryable` flag rather than decided here. A category that invites a retry
   * of a state no retry can fix is how a permanent failure becomes a support
   * queue.
   */
  readonly retryable: boolean
}

/* ══ What an operator is told ═════════════════════════════════════════════ */

/**
 * The SERVER-ONLY classification. It never reaches a browser, and it never
 * changes what the customer is told.
 *
 * ══ WHY THIS IS SEPARATE FROM THE EXTERNAL CATEGORY ═════════════════════════
 *
 * Thirty-two internal reasons collapse onto `report_cannot_be_produced`, and
 * they are not equally interesting. `lens-unsupported` is the engine correctly
 * declining to describe a lens the deterministic bank holds no questions for —
 * paging on it would be paging on correct behaviour. `digest-mismatch` means a
 * stored artifact disagrees with its own hash, which should be impossible.
 * One customer sentence, three very different nights.
 */
export type OperationalSeverity =
  /** The engine declined correctly. Info-level; rate dashboard only. */
  | "expected"
  /**
   * A version, fingerprint or identity moved under a sealed artifact. A deploy
   * changed something; nothing is corrupt. Warn-level, alert on rate.
   */
  | "compatibility"
  /**
   * A stored artifact disagrees with itself or with frozen authority. Page
   * immediately — every one of these means something that should be impossible
   * has been written.
   */
  | "integrity"
  /** The database or a dependency could not be reached. Alert on rate. */
  | "infrastructure"

/* ══ Recovery identity ════════════════════════════════════════════════════ */

/**
 * Which branch of the recovery-identity matrix a finalisation falls into.
 *
 * The matrix exists because of a failure case that a bootstrap-time backfill
 * could not close: purchase, seal, customer leaves, bootstrap never called,
 * window expires — no capability, no email, no account, and a customer
 * permanently locked out of an artifact they paid for. Recovery identity has to
 * exist BEFORE the window starts, not be created by entering it.
 */
export type RecoveryIdentityCase =
  /** An account already owns the row. No email is required. */
  | "account-owner"
  /** Guest with a USABLE assessment email already present. It stays canonical. */
  | "assessment-email-canonical"
  /**
   * Guest with no usable assessment email — the column was NULL, or held
   * something that cannot be an address — so the purchase email becomes the
   * recovery identity.
   */
  | "adopt-purchase-email"
  /** Guest with no usable identity of any kind. Nothing may be invented. */
  | "no-recovery-identity"

/**
 * What the finalisation boundary should do, decided without touching a database.
 *
 * `write` is the value to persist IN THE SAME conditional CAS update that
 * writes the seal, so that `guest seal ⇒ durable recovery identity` is atomic
 * rather than two steps with a gap in the middle.
 */
export interface RecoveryIdentityDecision {
  readonly case: RecoveryIdentityCase
  readonly seal: "proceed" | "refuse"
  /** Normalised, or null when nothing is to be written. */
  readonly write: string | null
  /**
   * Two things an operator should know about, neither of which changes the
   * seal decision.
   *
   * `identity-conflict` — the settled purchase email differs from the address
   *   the customer gave us. Recorded and otherwise ignored: it is not a second
   *   ownership proof, and it never overwrites what the customer gave us.
   *
   * `unusable-recovery-email` — the stored address could not be an address at
   *   all, so it was discarded in favour of the purchase email. Worth
   *   surfacing because it means something upstream wrote garbage into an
   *   identity column, and this is the one moment anybody is looking at it.
   */
  readonly alarm: "identity-conflict" | "unusable-recovery-email" | null
}
