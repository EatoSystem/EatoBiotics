import { stripe } from "@/lib/stripe-server"
import { isCheckoutSessionSettled } from "@/lib/paid-report-session"
import type { EntitlementAnchorResolver } from "@/lib/auth/reconcile-account"

/**
 * When the 30-day clock starts — Step 7, second repair.
 *
 * ══ WHAT THIS VALUE IS, AND WHAT IT IS NOT ══════════════════════════════════
 *
 * It is NOT the purchase time, and it is deliberately not named as one.
 *
 * Nothing in this system records when a payment settled. The first repair used
 * `deep_assessments.created_at`, which is when a ROW was written. The second
 * used `session.created`, which is when the buyer STARTED checkout — and a
 * buyer who finishes late would then be sold 30 days and given 29.
 *
 * So this returns the **latest moment at which the checkout could possibly
 * have settled**, chosen so the customer can never receive less than what was
 * sold. Over-granting slightly is a commercial decision; under-delivering is a
 * broken promise.
 *
 * ══ THE BOUND, AND WHY IT HOLDS ═════════════════════════════════════════════
 *
 * For one session, let c = `created`, x = `expires_at`, s = actual settlement.
 *
 * A Checkout Session accepts payment only while `status === "open"`. At x
 * Stripe moves an uncompleted session to `expired`; completing it moves it to
 * `complete`. Those states are mutually exclusive and terminal, so a session
 * observed as settled was completed at some s ≤ x. And s ≥ c trivially.
 *
 *     c ≤ s ≤ x
 *
 * Anchoring at x, the window ends at x + 30d, so:
 *
 *     access after settlement = x + 30d − s ≥ 30d          (since s ≤ x)
 *     over-grant              = x − s      ≤ x − c         (since s ≥ c)
 *
 * Stripe caps a session's lifetime at 24 hours (`expires_at` may be set
 * between 30 minutes and 24 hours after creation, default 24h), and
 * `app/api/checkout/route.ts` never sets it — so x − c is exactly 24h and the
 * over-grant is at most one day.
 *
 *   • card, settling immediately  → ~31 days, over-grant ≈ 24h
 *   • settled at the last instant → exactly 30 days, over-grant 0
 *   • `no_payment_required`       → identical
 *
 * `expires_at` is used rather than a charge timestamp precisely because of
 * that third case: a 100%-discount session has no PaymentIntent and no charge
 * at all, so a settlement time does not exist for it. This field always does.
 *
 * Deliberately NOT clamped to c + 24h. If Stripe ever lengthened the maximum
 * session lifetime, clamping would start under-granting — the exact failure
 * being removed. The over-grant tracks the session lifetime; the 30-day
 * guarantee holds whatever that lifetime is.
 *
 * ══ THE STATE THIS DOES NOT COVER ═══════════════════════════════════════════
 *
 * A delayed-notification method (SEPA, iDEAL, Bancontact, …) breaks s ≤ x: the
 * session completes at checkout and the payment settles days later. V1 does
 * not handle those at all — see the pinned behaviour in
 * tests/unit/v1-paid-journey.test.ts and runbook step R2, which decides whether
 * that becomes a launch blocker. If such a method is ever enabled, this bound
 * must be revisited as part of fixing it.
 */

/** Stripe's documented maximum Checkout Session lifetime. */
const MAX_SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000

/** The pure rule, so the webhook and the sign-in path cannot diverge. */
export function entitlementAnchorFromSession(session: {
  created?: number | null
  expires_at?: number | null
}): string | null {
  const expiresMs = typeof session.expires_at === "number" ? session.expires_at * 1000 : null
  const createdMs = typeof session.created === "number" ? session.created * 1000 : null

  // `expires_at` is the latest instant the session could have been completed.
  // Falling back to created + the documented maximum keeps it an upper bound
  // on settlement when the field cannot be read.
  const anchorMs = expiresMs ?? (createdMs !== null ? createdMs + MAX_SESSION_LIFETIME_MS : null)

  if (anchorMs === null || !Number.isFinite(anchorMs)) return null
  return new Date(anchorMs).toISOString()
}

/**
 * Resolve the anchor for a session id, from Stripe.
 *
 * Fails closed — unsettled session, unknown id, unreadable timestamps, Stripe
 * unreachable all return null and grant nothing. The next sign-in tries again.
 * It must never fall back to a row timestamp or to the clock.
 */
export const entitlementAnchorFromStripe: EntitlementAnchorResolver = async (sessionId) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // The anchor only qualifies for a checkout that actually settled. An
    // abandoned session has a `created` and an `expires_at` too.
    if (!isCheckoutSessionSettled(session)) return null

    return entitlementAnchorFromSession(session)
  } catch {
    return null
  }
}
