import { normaliseEmail, sameEmailIdentity } from "./email-identity"
import type { RecoveryIdentityDecision } from "./types"

/**
 * The recovery-identity matrix — Phase 4B-S1.
 *
 * ══ THE FAILURE THIS EXISTS TO PREVENT ══════════════════════════════════════
 *
 *   purchase → assessment email NULL → Consultation sealed → customer leaves
 *   → bootstrap never called → bootstrap window expires
 *   → no capability, no email, no account → PERMANENT LOCKOUT
 *
 * A customer locked out of a €49 artifact they paid for. The first design put
 * the fix in the capability bootstrap, which does not close it: the whole
 * failure is that bootstrap is never reached. Recovery identity must exist
 * BEFORE the window starts.
 *
 * So the invariant is enforced at the finalisation boundary instead:
 *
 *   NO newly sealed deterministic GUEST Consultation may have
 *   user_id IS NULL AND email IS NULL.
 *
 * It is free there. `app/api/consultation/finalise/route.ts` already retrieves
 * the settled Checkout Session for the settlement check and still holds it when
 * the seal is written, so this costs zero additional Stripe calls.
 *
 * ══ WHY THIS FUNCTION TOUCHES NO DATABASE ═══════════════════════════════════
 *
 * It decides, it does not act. The caller performs the write inside the SAME
 * conditional CAS update that writes the seal, which is what makes
 * "guest seal ⇒ durable recovery identity" atomic rather than two steps with a
 * gap. A version of this that did its own write would reintroduce the gap.
 *
 * ══ WHAT THE STRIPE ADDRESS MAY NEVER DO ════════════════════════════════════
 *
 * It may never overwrite an address the customer gave us, and it may never
 * become a second ownership proof. A person paying with a work card, a
 * partner's card or a PayPal-linked address is ordinary, not adversarial — so a
 * mismatch is recorded and otherwise ignored, and the seal proceeds. Refusing
 * to seal there would convert a benign mismatch into a guaranteed failure for
 * somebody who has already paid.
 *
 * ══ NOTHING HERE ISSUES A CAPABILITY ════════════════════════════════════════
 *
 * Recovery identity and the access credential have different lifecycles: one is
 * durable identity, the other is a rotatable secret. No capability state is
 * created inside Migration 48's immutable seal transaction.
 */

export interface RecoveryIdentityInput {
  /** `deep_assessments.user_id`, exactly as stored. */
  readonly userId: string | null
  /**
   * `deep_assessments.email`, exactly as stored and NOT pre-normalised.
   *
   * Passed raw so this function can tell an ABSENT address from an UNUSABLE
   * one. The two get the same decision — neither is a recovery identity — but
   * only one of them is worth waking somebody up about, and a caller that
   * normalised first would have thrown that difference away.
   *
   * An earlier version keyed the case split on this being non-null, justified
   * by the SQL predicate `email IS NULL` guarding the write. That predicate
   * does not exist and must not: the seal's `updated_at` CAS token serialises
   * against concurrent writers instead, and adding it would turn a benign
   * webhook arrival into a failed seal for somebody who has already paid. So
   * `SET email = :write` lands whether the column held NULL or junk, and the
   * reasoning that produced the gap was reasoning from a predicate we had
   * already decided not to write.
   */
  readonly assessmentEmail: string | null
  /**
   * The purchase-side candidate, normally from `canonicalPurchaseEmail()`.
   *
   * That helper normalises, and this field used to be DOCUMENTED as "already
   * normalised or null" — which is a precondition, not a guarantee. An
   * authority boundary that holds only while its callers are careful is not a
   * boundary: a direct caller passing `"not-an-email"` got a `proceed`
   * decision carrying an identity nobody can prove control of, which is the
   * exact lockout the case split exists to prevent.
   *
   * So the function normalises this itself, defensively, before any branch
   * looks at it. Passing an already-normalised value stays correct —
   * normalisation is idempotent — and passing a malformed one is now refused
   * rather than trusted.
   */
  readonly canonicalPurchaseEmail: string | null
}

export function decideRecoveryIdentity(input: RecoveryIdentityInput): RecoveryIdentityDecision {
  /* ── A. An account already owns the row ──────────────────────────────────
   *
   * Account identity is durable and stronger than any address, so no email is
   * required. This is also why the asymmetry below matters: once `user_id` is
   * set, an email establishes nothing, including for the same person.
   */
  if (input.userId !== null) {
    return { case: "account-owner", seal: "proceed", write: null, alarm: null }
  }

  /* ── B. Guest, with a USABLE address already on the row ──────────────────
   *
   * The EatoBiotics assessment/purchase email is canonical when present, and is
   * never replaced because Stripe returned a different one.
   *
   * "Present" means usable, not merely non-null. A column holding `"n/a"` is
   * not an identity a customer can prove control of, and treating it as one
   * would satisfy the invariant on a technicality while leaving exactly the
   * lockout the invariant exists to prevent.
   */
  // Both sides, normalised once, before anything branches on either. Nothing
  // below may read `input.canonicalPurchaseEmail` again — see the field's
  // contract for why trusting it was the defect.
  const storedIdentity = normaliseEmail(input.assessmentEmail)
  const purchaseIdentity = normaliseEmail(input.canonicalPurchaseEmail)

  if (storedIdentity !== null) {
    // `sameEmailIdentity` rather than `===`: normalisation is idempotent, so it
    // is correct on already-normalised operands, and it keeps ONE definition of
    // what makes two addresses the same identity.
    //
    // Comparing against the raw value here was a live false positive, not just
    // a latent one: `sameEmailIdentity` returns false whenever either side
    // fails to normalise, so a usable stored address plus a malformed purchase
    // value computed `conflict = true` and paged somebody about two addresses
    // disagreeing when one of them was never an address.
    const conflict = purchaseIdentity !== null && !sameEmailIdentity(storedIdentity, purchaseIdentity)

    return {
      case: "assessment-email-canonical",
      seal: "proceed",
      write: null,
      alarm: conflict ? "identity-conflict" : null,
    }
  }

  /* ── C. Guest with no usable address, and a purchase that carries one ────
   *
   * Covers both shapes of "no stored identity": the column was NULL, or it held
   * something unparseable. Written by the caller in the successful seal CAS.
   *
   * Overwriting an unusable string is not dispossession. Nobody can prove
   * control of an unparseable address, so the write can take nothing from
   * anyone and strictly improves recoverability. It is still worth an alarm:
   * something upstream wrote garbage into an identity column, and the only
   * moment anybody is looking at it is now.
   */
  if (purchaseIdentity !== null) {
    return {
      case: "adopt-purchase-email",
      seal: "proceed",
      // The NORMALISED value is what gets written. A caller that handed us a
      // usable-but-unnormalised address does not get to decide the stored form
      // of an identity that later authorises a Report.
      write: purchaseIdentity,
      // Keyed on the RAW column, deliberately: this alarm distinguishes "the
      // column held junk and we discarded it" from "the column was NULL and
      // there was nothing to discard", and only the raw value carries that.
      alarm: input.assessmentEmail !== null ? "unusable-recovery-email" : null,
    }
  }

  /* ── D. Nothing usable, and nothing to adopt. Refuse rather than invent ──
   *
   * Sealing here would produce an immutable artifact with no way back to its
   * owner, and the seal is write-once, so it could not be repaired afterwards.
   * Reached by a guest whose column is NULL and by one whose column is junk —
   * a stored string that cannot be an address is not a reason to seal.
   */
  return { case: "no-recovery-identity", seal: "refuse", write: null, alarm: null }
}

/*
 * ══ THE GAP THAT USED TO BE DOCUMENTED HERE ═════════════════════════════════
 *
 * This module previously carried a note explaining that a non-null but
 * unusable `assessment.email` fell into case B, sealed, and left the guest
 * with no provable identity — and deferred the fix. That was wrong twice: a
 * known hole with a comment beside it is still a hole, and the reason given
 * (the SQL write predicate) was not a real constraint. Case C now absorbs it
 * and case D refuses when there is nothing to adopt, which needed no new case
 * and no change to the four frozen names.
 */
