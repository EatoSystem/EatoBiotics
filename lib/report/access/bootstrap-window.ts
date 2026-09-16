/**
 * The Stripe bootstrap window — Phase 4B-S1.
 *
 * ══ THE ONE THING STRIPE IS STILL ALLOWED TO DO ═════════════════════════════
 *
 * A settled Checkout Session may bootstrap or rotate a guest capability for a
 * short period after finalisation. It may NEVER authorise a Report read. S4
 * removed Stripe from the read path deliberately — a €49 deliverable must not
 * stop being readable because a third-party API is unreachable — and this does
 * not put it back.
 *
 * ══ WHY SIXTY MINUTES, AND WHY IT USED TO BE SEVENTY-TWO HOURS ══════════════
 *
 * The long window existed to prevent lockout: the fear that a customer past the
 * window had no way back. That fear is now unfounded. Every sealed guest
 * Consultation carries a durable recovery email before the window starts — see
 * `recovery-identity.ts` — so the permanent path back is magic-link sign-in.
 *
 * With the downside removed, only the cost remains, and the cost of a long
 * window is that a `cs_…` id sitting in browser history, a shared link or a log
 * line stays a key to health-derived content for three days. Sixty minutes
 * covers what bootstrap is actually for: the redirect straight after
 * finalisation, a retry after a lost response, a reload in the same sitting.
 * Everything later is served by the cookie, by the emailed durable capability,
 * or by signing in.
 *
 * ══ SERVER CLOCK ONLY ═══════════════════════════════════════════════════════
 *
 * `serverNow` is a parameter so this function stays pure and testable, NOT so a
 * caller can supply a time from somewhere else. It must come from the server
 * clock. A window that a request could influence is not a window.
 */

export const BOOTSTRAP_WINDOW_MS = 60 * 60 * 1000

export interface BootstrapWindowInput {
  /** `finalisedAt` from the immutable seal, as an ISO instant. */
  readonly finalisedAt: string
  /** The SERVER's current time. Never a client-supplied value. */
  readonly serverNow: Date
}

/**
 * Fail closed on everything it cannot prove.
 *
 * An unparseable `finalisedAt` is not "probably fine"; it is a seal this code
 * cannot reason about. A `finalisedAt` in the future is rejected for the same
 * reason and a sharper one: it would EXTEND the window, so accepting it would
 * make a clock problem — or a tampered timestamp — into longer-lived credential
 * minting rather than a shorter one.
 */
export function isWithinBootstrapWindow(input: BootstrapWindowInput): boolean {
  const finalised = Date.parse(input.finalisedAt)
  if (Number.isNaN(finalised)) return false

  const now = input.serverNow.getTime()
  if (Number.isNaN(now)) return false

  const elapsed = now - finalised
  if (elapsed < 0) return false

  // Inclusive at the boundary: a request landing on the exact millisecond is
  // inside the window, which is the reading a customer would expect and the one
  // that does not depend on scheduler jitter.
  return elapsed <= BOOTSTRAP_WINDOW_MS
}
