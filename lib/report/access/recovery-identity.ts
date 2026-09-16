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
   * Rawness is load-bearing: the case split below has to agree with the SQL
   * predicate `email IS NULL` that guards the write. Deciding on a normalised
   * value would let this function choose "adopt the purchase email" for a row
   * whose column is non-null, and the CAS would then match zero rows and write
   * nothing while the decision said otherwise.
   */
  readonly assessmentEmail: string | null
  /** From `canonicalPurchaseEmail`, already normalised or null. */
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

  /* ── B. Guest, with an address already on the row ─────────────────────────
   *
   * The EatoBiotics assessment/purchase email is canonical when present, and is
   * never replaced because Stripe returned a different one.
   */
  if (input.assessmentEmail !== null) {
    const conflict =
      input.canonicalPurchaseEmail !== null &&
      normaliseEmail(input.assessmentEmail) !== null &&
      !sameEmailIdentity(input.assessmentEmail, input.canonicalPurchaseEmail)

    return {
      case: "assessment-email-canonical",
      seal: "proceed",
      write: null,
      alarm: conflict ? "identity-conflict" : null,
    }
  }

  /* ── C. Guest, no address on the row, but the purchase carries one ───────
   *
   * Written by the caller in the successful seal CAS. Note the predicate the
   * caller must NOT add: `AND email IS NULL`. Every concurrent writer of that
   * column bumps `updated_at`, so the seal's existing `updated_at` CAS token
   * already serialises against them, and the extra predicate would turn a
   * benign webhook arrival into a failed seal for a paying customer.
   */
  if (input.canonicalPurchaseEmail !== null) {
    return {
      case: "adopt-purchase-email",
      seal: "proceed",
      write: input.canonicalPurchaseEmail,
      alarm: null,
    }
  }

  /* ── D. Nothing. Refuse rather than invent ───────────────────────────────
   *
   * Sealing here would produce an immutable artifact with no way back to its
   * owner, and the seal is write-once, so it could not be repaired afterwards.
   */
  return { case: "no-recovery-identity", seal: "refuse", write: null, alarm: null }
}

/*
 * ══ A KNOWN NARROW GAP, RECORDED RATHER THAN PAPERED OVER ═══════════════════
 *
 * Case B is keyed on the RAW column being non-null, because that is what the
 * write predicate keys on. A stored address that is non-null but structurally
 * unusable — `normaliseEmail` returns null for it — therefore satisfies the
 * letter of the frozen invariant while not being verifiable in practice: the
 * guest has an email column, and no way to prove control of it.
 *
 * It is left as case B deliberately. Treating it as case C would promise a
 * write the SQL predicate cannot perform, and inventing a fifth case would
 * change a contract that has been frozen through three review rounds. The
 * decision belongs to 4B-S4, which owns the finalisation change, and it is
 * raised there rather than resolved quietly here.
 */
