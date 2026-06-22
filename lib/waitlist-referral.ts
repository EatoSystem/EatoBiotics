/* ── Waitlist referral / skip-the-line helpers ───────────────────────────
 * Pure logic for the "skip the line" mechanic. Each completed referral moves a
 * lead up REFERRAL_JUMP places; UNLOCK_THRESHOLD referrals unlocks a founding-
 * member reward. Kept separate + pure so it's unit-testable and shared by the
 * status API and any UI copy.
 */

/** Places a lead jumps up the queue per completed referral. */
export const REFERRAL_JUMP = 10

/** Referrals needed to unlock the founding-member reward. */
export const UNLOCK_THRESHOLD = 3

/**
 * Displayed waitlist position. `rawRank` is the lead's signup order (1 = first;
 * = number of waitlist leads created at or before this one). Referrals reduce
 * the number shown. Never below 1.
 */
export function waitlistPosition(rawRank: number, referralCount: number): number {
  return Math.max(1, Math.round(rawRank) - Math.max(0, referralCount) * REFERRAL_JUMP)
}
