/**
 * ══ WHAT STRIPE SAYS ABOUT THE NEXT CHARGE ═══════════════════════════════════
 *
 * `/account` and the cancel route both need one answer from a Stripe
 * subscription: will the member be charged again, and if not, until when does
 * the period they have paid for run?
 *
 * Under the API version this SDK pins (`stripe@20.4.1` → `2026-02-25.clover`;
 * `lib/stripe-server.ts` deliberately sets no `apiVersion`), the billing period
 * lives on each subscription ITEM (`items.data[].current_period_end`). The
 * SDK types give the subscription itself no `current_period_end`, so a
 * top-level value is not trusted here. That comes from the installed types,
 * not from a live payload. The end of a scheduled cancellation is the
 * top-level `cancel_at`.
 *
 * The webhook still reads the top-level field for `membership_expires_at`;
 * that is deliberately left for the PR 1 design, not changed here.
 *
 * "unknown" is a real answer, not an error to paper over: if we cannot tell
 * whether another charge is coming, the account page must not claim one is.
 */

export type RenewalState =
  /** Another charge is scheduled; the date is null if Stripe gave none. */
  | { kind: "renews"; nextBillingDate: string | null }
  /** No further charge; paid access runs until `accessUntil` (null if unknown). */
  | { kind: "ends"; accessUntil: string | null }
  | { kind: "unknown" }

function epochSeconds(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null
}

function iso(seconds: number | null): string | null {
  return seconds === null ? null : new Date(seconds * 1000).toISOString()
}

/** Earliest `current_period_end` across the subscription's items, in epoch seconds. */
function itemPeriodEnd(subscription: Record<string, unknown>): number | null {
  const items = (subscription.items as { data?: unknown } | undefined)?.data
  if (!Array.isArray(items)) return null
  const ends = items
    .map((item) => epochSeconds((item as Record<string, unknown> | null)?.current_period_end))
    .filter((end): end is number => end !== null)
  return ends.length > 0 ? Math.min(...ends) : null
}

export function renewalState(subscription: unknown): RenewalState {
  if (!subscription || typeof subscription !== "object") return { kind: "unknown" }
  const sub = subscription as Record<string, unknown>
  const periodEnd = itemPeriodEnd(sub)
  const cancelAt = epochSeconds(sub.cancel_at)

  if (sub.status === "canceled" || sub.cancel_at_period_end === true) {
    return { kind: "ends", accessUntil: iso(cancelAt ?? periodEnd) }
  }
  if (sub.cancel_at_period_end !== false) return { kind: "unknown" }

  // A dated cancellation (`cancel_at`) only rules out the next charge when it
  // falls within the current period. Without a period end we cannot tell.
  if (cancelAt !== null) {
    if (periodEnd === null) return { kind: "unknown" }
    if (cancelAt <= periodEnd) return { kind: "ends", accessUntil: iso(cancelAt) }
  }
  return { kind: "renews", nextBillingDate: iso(periodEnd) }
}
