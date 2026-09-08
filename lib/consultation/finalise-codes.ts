/**
 * The finalise route's refusal vocabulary — Phase 3C-C2B repair round.
 *
 * ══ WHY CODES EXIST AT ALL ══════════════════════════════════════════════════
 *
 * `POST /api/consultation/finalise` answers 409 to ten different situations,
 * and exactly ONE of them means the customer still has something to answer.
 * The others are trust and state refusals: a legacy row, a context that
 * disagrees with Stripe, unreadable stored state, an incoherent seal, a bank
 * this build cannot resolve, an active Review edit, a Consultation that is not
 * at Review yet.
 *
 * Classified by status alone, all ten became "Something in your Consultation
 * still needs an answer" — which sends someone hunting for a question that does
 * not exist, while the actual refusal goes unreported. So the wire carries a
 * machine-readable discriminator, and the browser classifies on THAT.
 *
 * ══ WHY THEY LIVE HERE AND NOT IN THE ROUTE ═════════════════════════════════
 *
 * The route writes them and the transport adapter reads them. A vocabulary
 * defined in one and re-typed in the other is a vocabulary that can drift, and
 * the failure mode of that drift is silent: an unrecognised code falls into the
 * refused bucket and the incomplete case simply stops working.
 *
 * ══ WHAT THEY ARE NOT ═══════════════════════════════════════════════════════
 *
 * Not customer copy — no code is ever displayed. Not diagnostics either: they
 * name a CATEGORY of refusal and carry no answers, no ids, no session state and
 * no server internals. The one code that carries extra fields is
 * `consultation_incomplete`, and those fields are the canonical outstanding
 * question ids the Review list already shows.
 */

export const FINALISE_CODES = {
  /** The stored questions are legacy, or a shape neither parser accepts. */
  MODE_CONFLICT: "consultation_mode_conflict",
  /** The stored snapshot disagrees with the settled Stripe session. */
  CONTEXT_CONFLICT: "consultation_context_conflict",
  /** Stored answers are present and will not parse. */
  STATE_UNREADABLE: "consultation_state_unreadable",
  /** Half-sealed, or sealed with an open cursor. Never repaired. */
  SEAL_INCOHERENT: "consultation_seal_incoherent",
  /** A seal exists but its payload is malformed or belongs elsewhere. */
  SEAL_UNREADABLE: "consultation_seal_unreadable",
  /** The bank this Consultation was answered against cannot be resolved. */
  BANK_UNAVAILABLE: "consultation_bank_unavailable",
  /**
   * The ONLY code that means the customer has something outstanding.
   *
   * Produced solely by the canonical builder's `incomplete` branch, which
   * re-derives completeness immediately before the write.
   */
  INCOMPLETE: "consultation_incomplete",
  /** They are part-way through editing an answer from the Review list. */
  REVIEW_EDIT_ACTIVE: "consultation_review_edit_active",
  /** They have not reached the Review list yet. */
  NOT_IN_REVIEW: "consultation_not_in_review",
  /** Malformed request body. */
  INVALID_REQUEST: "invalid_request",
  /** The checkout session is not settled. */
  PAYMENT_NOT_SETTLED: "payment_not_settled",
  /** No paid assessment for this session. */
  ASSESSMENT_NOT_FOUND: "assessment_not_found",
  /** The database could not be read or written. Retryable. */
  UNAVAILABLE: "consultation_unavailable",
} as const

export type FinaliseCode = (typeof FINALISE_CODES)[keyof typeof FINALISE_CODES]

/**
 * Does this response body mean the Consultation is genuinely unfinished?
 *
 * An ALLOW-LIST, deliberately, and the reason is the bug it replaces. A rule
 * shaped as "409 unless we recognise it as something else" treats every code
 * this build has not heard of as an incomplete Consultation — including codes a
 * newer server adds. Asking the opposite question means an unknown refusal is
 * reported as a refusal, which is both true and safe.
 */
export function isIncompleteRefusal(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as { code?: unknown }).code === FINALISE_CODES.INCOMPLETE
  )
}
