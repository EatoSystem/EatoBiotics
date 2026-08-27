/**
 * The one definition of the age brackets we ask for, and of the age floor the
 * Terms of Service commit to.
 *
 * This list previously existed as six separate literal arrays — the two
 * assessment intros, the family intro, the waitlist Discover flow, the account
 * dashboard and account settings — and every one of them offered "Under 20" as
 * its lowest option. `app/terms/page.tsx` §2 says "You must be at least 16
 * years old to use the Service", so a 12-year-old could answer the health
 * questionnaire truthfully and be accepted. Splitting the bottom band into
 * "Under 16" and "16–19" is what makes that promise answerable: below the
 * split is a decision, not a range we have to guess at.
 *
 * Keep the label strings stable. They are persisted verbatim in
 * `leads.age_bracket` and `profiles.age_bracket`, so renaming one silently
 * reclassifies everyone already stored under it.
 */

/** The floor stated in the Terms of Service. */
export const MINIMUM_AGE = 16

/**
 * The bracket that means "below MINIMUM_AGE". Selecting it is a stop, not a
 * value we record: no lead row, no assessment, no checkout.
 */
export const UNDER_MINIMUM_AGE_BRACKET = "Under 16"

/** Every bracket offered, in display order. */
export const AGE_BRACKETS = [
  UNDER_MINIMUM_AGE_BRACKET,
  "16–19",
  "20–29",
  "30–39",
  "40–49",
  "50–59",
  "60+",
] as const

export type AgeBracket = (typeof AGE_BRACKETS)[number]

/**
 * True when a submitted bracket is below the age floor.
 *
 * Deliberately tolerant about its input: this runs on request bodies as well as
 * on form state, so it must give a straight answer for `undefined`, a number, or
 * a bracket string this build has never heard of. Only the exact stored label
 * counts as under-age; anything else is "not known to be under-age" and is left
 * to the caller's own validation.
 *
 * The hyphen matters. The bracket labels use an en dash (–), and a value typed
 * with an ASCII hyphen is a different string; that only affects the ranges, not
 * this check, but it is the reason callers should compare against AGE_BRACKETS
 * rather than against literals of their own.
 */
export function isUnderMinimumAge(value: unknown): boolean {
  return typeof value === "string" && value.trim() === UNDER_MINIMUM_AGE_BRACKET
}

/** The message shown wherever an under-16 selection is refused. */
export const UNDER_MINIMUM_AGE_MESSAGE =
  `EatoBiotics is for people aged ${MINIMUM_AGE} and over, so we can't continue with this assessment.`
