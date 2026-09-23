import { stripe } from "@/lib/stripe-server"
import { isCheckoutSessionSettled } from "@/lib/paid-report-session"
import type { PurchasedAtResolver } from "@/lib/auth/reconcile-account"

/**
 * When the checkout behind a paid row actually happened — Step 7 review repair.
 *
 * ══ WHY STRIPE AND NOT A LOCAL COLUMN ══════════════════════════════════════
 *
 * Nothing in this database records when a purchase happened.
 * `deep_assessments.created_at` records when the ROW was first written, and
 * three different writers can win that race — the webhook (seconds after
 * settlement), the question generator, and the Consultation claimer. A buyer
 * whose webhook never ran and who opened the questionnaire ten days later has
 * a row stamped day 10 for a purchase made on day 0.
 *
 * So the purchase record is Stripe's own Checkout Session, and
 * `deep_assessments.stripe_session_id` is the durable key into it.
 *
 * ══ WHY `session.created` ══════════════════════════════════════════════════
 *
 *   • It exists on EVERY settled session, including a 100%-promo
 *     `no_payment_required` one — which has no PaymentIntent, so a charge
 *     timestamp could not express the contract on its own.
 *   • It is never later than settlement, and bounded before it: a Checkout
 *     Session expires 24h after creation, so one that settled did so within
 *     24h. The window granted is therefore between 29 and 30 days — never
 *     more than the 30 that were sold.
 *   • It is identical across every delivery, redelivery and later read, which
 *     is what makes repeated reconciliation idempotent.
 *
 * ══ IT FAILS CLOSED ════════════════════════════════════════════════════════
 *
 * Unsettled session, missing `created`, unknown session id, Stripe
 * unreachable — all return null, and `decideTrialActivation` then grants
 * nothing. The next sign-in tries again.
 *
 * It must never fall back to the row's timestamp or to the clock. Those are
 * the two defects this repair exists to remove, and a fallback would quietly
 * reinstate whichever one it chose.
 */
export const purchasedAtFromStripe: PurchasedAtResolver = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // The timestamp only qualifies if the checkout it belongs to actually
    // settled. An abandoned session has a `created` too.
    if (!isCheckoutSessionSettled(session)) return null

    return typeof session.created === "number"
      ? new Date(session.created * 1000).toISOString()
      : null
  } catch {
    return null
  }
}
