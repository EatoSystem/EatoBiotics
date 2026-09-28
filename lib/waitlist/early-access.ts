/**
 * The first 100 early-access places.
 *
 * ══ WHY THIS NEEDS NO MIGRATION ═════════════════════════════════════════════
 *
 * The count already exists. `app/api/waitlist/count/route.ts` returns an exact
 * head-count of `leads` filtered to `assessment_type = "waitlist"`, and the
 * holding page already fetches it for social proof. Everything below is
 * arithmetic on a number the product was already computing.
 *
 * Who the first 100 ARE is a query, not a stored flag: waitlist leads ordered
 * by `created_at` ascending, first 100. That is derivable from data already
 * written, so nothing needs a new column — see `EARLY_ACCESS_COHORT_ORDER`.
 *
 * ══ THE RACE, AND WHY IT IS A FOOTNOTE ══════════════════════════════════════
 *
 * Two people signing up at the same instant when 99 places are taken can both
 * be told they are inside, giving 101 founding members. There is no lock here
 * and there does not need to be: the offer is ACCESS, not a discount, so
 * honouring 101 costs nothing. A cap this cheap to honour does not justify the
 * durable allocator — or the migration — that avoiding it would need.
 *
 * What would NOT be acceptable is showing a number the product has not
 * actually counted. Hence the nullable return below.
 */

/** How many early-access places the campaign offers. One definition, shared by
 *  the holding page and the confirmation email so they cannot disagree. */
export const EARLY_ACCESS_PLACES = 100

/** The cohort is the EARLIEST signups. Ascending, never descending — newest
 *  first would invite exactly the wrong hundred people. */
export const EARLY_ACCESS_COHORT_ORDER = "created_at:asc" as const

export interface EarlyAccessState {
  /** Places taken, capped at the total on offer. */
  claimed: number
  /** Places left. Never negative. */
  remaining: number
  /** Whether a new signup still lands inside the first 100. */
  isOpen: boolean
}

/**
 * Turn a waitlist total into what the page should say.
 *
 * Returns `null` when the total is unknown — a failed fetch, an unconfigured
 * database, a malformed response. The page then says nothing about places,
 * rather than inventing scarcity. Manufactured numbers are the one failure
 * mode a campaign like this cannot come back from.
 */
export function earlyAccessState(total: number | null | undefined): EarlyAccessState | null {
  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return null

  const claimed = Math.min(Math.floor(total), EARLY_ACCESS_PLACES)
  const remaining = Math.max(EARLY_ACCESS_PLACES - Math.floor(total), 0)

  return { claimed, remaining, isOpen: remaining > 0 }
}

/**
 * The place a given signup took, 1-based, or null if it landed outside the
 * first 100.
 *
 * `totalBefore` is how many waitlist signups already existed. Kept separate
 * from `earlyAccessState` because the page asks "how many are left" while the
 * confirmation email asks "which one was I" — the same constant, two questions.
 */
export function earlyAccessPlace(totalBefore: number | null | undefined): number | null {
  if (typeof totalBefore !== "number" || !Number.isFinite(totalBefore) || totalBefore < 0) {
    return null
  }
  const place = Math.floor(totalBefore) + 1
  return place <= EARLY_ACCESS_PLACES ? place : null
}
