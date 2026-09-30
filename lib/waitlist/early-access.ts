/**
 * Staged access: 100 Systems, then 1,000 Systems.
 *
 * ══ WHY THIS NEEDS NO MIGRATION ═════════════════════════════════════════════
 *
 * The count already exists. `app/api/waitlist/count/route.ts` returns an exact
 * head-count of `leads` filtered to `assessment_type = "waitlist"`, and the
 * holding page already fetches it. Everything below is arithmetic on a number
 * the product was already computing.
 *
 * Who is in a cohort is a query, not a stored flag: waitlist leads ordered by
 * `created_at` ascending. That is derivable from data already written, so
 * nothing needs a new column — see `EARLY_ACCESS_COHORT_ORDER`.
 *
 * ══ THE LADDER ══════════════════════════════════════════════════════════════
 *
 * Access opens in stages so the product can be watched, corrected and
 * improved before it is scaled. `through` is CUMULATIVE — 1,000 Systems
 * INCLUDES the first 100, it does not sit after them. So signup number 100
 * closes 100 Systems, and numbers 101–1,000 are the rest of 1,000 Systems.
 *
 * Adding a rung is adding a row. Nothing else in the file knows how many
 * there are.
 *
 * ══ THE RACE, AND WHY IT IS A FOOTNOTE ══════════════════════════════════════
 *
 * Two people signing up at the same instant when 99 places are taken can both
 * be told they are inside, giving 101 systems in the first hundred. There is
 * no lock here
 * and there does not need to be: the offer is ACCESS, not a discount, so
 * honouring 101 costs nothing. A cap this cheap to honour does not justify the
 * durable allocator — or the migration — that avoiding it would need.
 *
 * What would NOT be acceptable is showing a number the product has not
 * actually counted. Hence the nullable returns below. Every function here
 * answers "I don't know" rather than guessing, and every caller is expected to
 * render nothing at all in that case.
 */

export interface Cohort {
  /** Stable id — safe to use as a key or an analytics property. */
  id: string
  /** What it is called in customer copy. */
  name: string
  /** CUMULATIVE: this cohort is full once the waitlist total reaches it. */
  through: number
}

/**
 * The rungs, in the order they open. Ascending `through`, always — a ladder
 * that is not sorted would open a later cohort before an earlier one filled.
 * `cohortLadderIsAscending()` proves it rather than trusting it.
 */
/*
 * The NAMES were "The First 100" and "The First Course". Both are retired:
 * the programme is 100 Systems, then 1,000 Systems, and later 10,000 — a
 * name that counts food systems rather than courses or memberships, and one
 * that extends without needing a new metaphor each time.
 *
 * The IDS DELIBERATELY DO NOT MOVE. `id` is sent as an analytics property
 * (see the waitlist_join event in food-system-experience.tsx), so renaming
 * it would silently split every signup already recorded from every signup
 * after it, for a cosmetic gain nobody outside this file can see. A stable
 * id whose value reads as history is doing exactly its job.
 */
export const COHORTS: readonly Cohort[] = [
  { id: "first-100", name: "100 Systems", through: 100 },
  { id: "first-course", name: "1,000 Systems", through: 1000 },
] as const

/**
 * The whole programme's size — the last rung. Used in copy about the future.
 *
 * Was `FIRST_COURSE_MEMBERS`. The value is unchanged; the name carried a
 * retired term into every file that imported it, which is how vocabulary
 * comes back.
 */
export const PROGRAMME_SYSTEMS = COHORTS[COHORTS.length - 1].through

/**
 * The first cohort's size.
 *
 * Derived, never re-typed: this used to be a standalone `= 100` and the ladder
 * now owns that number. Two literals would be two things to keep in step.
 */
export const EARLY_ACCESS_PLACES = COHORTS[0].through

/** The cohort is the EARLIEST signups. Ascending, never descending — newest
 *  first would invite exactly the wrong hundred people. */
export const EARLY_ACCESS_COHORT_ORDER = "created_at:asc" as const

/** True when every rung is larger than the one before it. */
export function cohortLadderIsAscending(ladder: readonly Cohort[] = COHORTS): boolean {
  return ladder.every((c, i) => i === 0 || c.through > ladder[i - 1].through)
}

export interface CohortState {
  /** The cohort a new signup would land in — or the last one, once full. */
  cohort: Cohort
  /** Its position in the ladder, 0-based. */
  index: number
  /** How many places this cohort holds on its own (not cumulative). */
  capacity: number
  /** How many of ITS places are taken. */
  claimed: number
  /** How many of ITS places are left. Never negative. */
  remaining: number
  /** Whether a new signup still lands inside this cohort. */
  isOpen: boolean
  /** Whether this is the last rung, so "next cohort" language is wrong. */
  isFinal: boolean
}

function normaliseTotal(total: number | null | undefined): number | null {
  if (typeof total !== "number" || !Number.isFinite(total) || total < 0) return null
  return Math.floor(total)
}

/**
 * Which cohort is open, and how much of it is left.
 *
 * Returns `null` when the total is unknown — a failed fetch, an unconfigured
 * database, a malformed response. The page then says nothing about places,
 * rather than inventing scarcity. Manufactured numbers are the one failure
 * mode a campaign like this cannot come back from.
 *
 * When every rung is full it returns the LAST cohort with `isOpen: false`
 * rather than null, so a page can say "1,000 Systems is full" instead of
 * falling silent as though the count had failed. Those two states are
 * different and must not render the same.
 */
export function openCohort(
  total: number | null | undefined,
  /**
   * The ladder to read. Defaults to the real one; injectable ONLY so the
   * refusal below can be exercised. Without a parameter here the
   * `cohortLadderIsAscending` check is unreachable from any test — the shipped
   * ladder is ascending — so deleting it changed nothing observable and a
   * sabotage case walked straight through it. An unreachable guard is not a
   * guard.
   */
  ladder: readonly Cohort[] = COHORTS,
): CohortState | null {
  const t = normaliseTotal(total)
  if (t === null) return null
  if (ladder.length === 0 || !cohortLadderIsAscending(ladder)) return null

  const index = ladder.findIndex((c) => t < c.through)
  const isFull = index === -1
  const i = isFull ? ladder.length - 1 : index
  const cohort = ladder[i]
  const floor = i === 0 ? 0 : ladder[i - 1].through
  const capacity = cohort.through - floor

  const claimed = Math.min(Math.max(t - floor, 0), capacity)
  const remaining = isFull ? 0 : Math.max(cohort.through - t, 0)

  return {
    cohort,
    index: i,
    capacity,
    claimed,
    remaining,
    isOpen: !isFull && remaining > 0,
    isFinal: i === ladder.length - 1,
  }
}

/**
 * What the status line says — or null, meaning say nothing at all.
 *
 * Extracted from the component because a React element's decisions are not
 * reachable from vitest: deleting the null guard inside the component changed
 * no test, so "invent a number when nothing was counted" — the one failure
 * this campaign cannot come back from — was unguarded. The same repair the
 * founding-access deadline needed for the same reason.
 */
export function cohortLineText(cohort: CohortState | null): string | null {
  if (!cohort) return null
  if (cohort.isOpen) return `${cohort.remaining} of ${cohort.capacity} systems remaining`
  if (cohort.isFinal) {
    return `All ${PROGRAMME_SYSTEMS.toLocaleString("en-IE")} systems are taken — join the waitlist`
  }
  return "Full — the next cohort opens soon"
}

/**
 * The cohort's name inside a sentence.
 *
 * The name used to be a title — "The First 100" — so concatenating it produced
 * "Join The First 100", with a capital T mid-sentence. Storing a second lowercase
 * name would be two strings to keep in step, so the article is lowered here
 * and the title is left alone.
 */
export function cohortNameInSentence(cohort: Cohort): string {
  return cohort.name.replace(/^The /, "the ")
}

/**
 * One label, one source — for the 100 Systems CTA and the reveal's claim
 * button alike.
 *
 * Was "Join the First 100". "Add My System" says what the person is actually
 * doing and what the programme is counting, and it reads the same whether
 * they arrived from the section or from their own score. When every rung is
 * full there is no system to add, so it falls back to the waitlist.
 */
export function joinCtaLabel(cohort: CohortState | null): string {
  if (!cohort || !cohort.isOpen) return "Join the waitlist"
  return "Add My System"
}

export interface EarlyAccessPlace {
  /** 1-based position across the WHOLE programme, not within the cohort. */
  place: number
  /** The cohort that place falls in. */
  cohort: Cohort
}

/**
 * The place a given signup took, and which cohort it lands in.
 *
 * `totalBefore` is how many waitlist signups already existed. Kept separate
 * from `openCohort` because the page asks "how many are left" while the
 * confirmation email asks "which one was I" — the same ladder, two questions.
 *
 * Returns `null` past the final rung, or when the count was unavailable. The
 * place is numbered across the programme rather than within the cohort, so
 * member 137 is "#137 of 1,000 Systems" and not a second "#37".
 */
export function earlyAccessPlace(
  totalBefore: number | null | undefined,
): EarlyAccessPlace | null {
  const t = normaliseTotal(totalBefore)
  if (t === null) return null

  const place = t + 1
  const cohort = COHORTS.find((c) => place <= c.through)
  return cohort ? { place, cohort } : null
}
