import { COMPARISON_LANGUAGE } from "@/lib/fss/engine/compare"
import { REASSESSMENT } from "@/lib/fss/action/catalogue"
import { isCurrentSystemModel } from "./version"
import type { ReviewPoint } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   WHEN REASSESSING WOULD MAKE SENSE.

   ══ THE HARDEST PERSISTENCE CASE IN GATE 4, AND WHY ═════════════════════════

   "Review again in 24 days" looks like the easiest thing in the product to
   derive: `establishedAt + REASSESSMENT.afterDays`. Storing the date would be a
   second copy of something already implied, and copies drift.

   But derive it from TODAY'S constant and this happens: the cadence changes
   from 30 days to 45, somebody opens a Food System established a week ago, and
   the date they are shown is not the date they were given. Nothing errored,
   nothing looked wrong, and the product quietly told them something different
   from what it told them before. That is the `legacy-unversioned` dishonesty
   one layer up — a number presented as current when the method behind it has
   moved.

   ══ SO: STORE THE VERSION ANCHOR, DERIVE THE DATE THROUGH IT ════════════════

   What is stored is `systemModelVersion`, on `StoredFoodSystem`. When it still
   resolves, the cadence it names is this code's cadence and the date is
   trustworthy. When it has moved, WE DO NOT KNOW what cadence was in force, so
   there is no date — and the honest output is a sentence saying the review
   point was set under a method that has moved.

   ══ WHY THE CADENCE RESOLVES THROUGH THE POLICY, NOT THE CATALOGUE ══════════

   `REASSESSMENT.afterDays` lives in `lib/fss/action/catalogue.ts`, next to the
   thirty-day horizon's reviewed copy. An earlier draft of this gate therefore
   hung the review point on `ACTION_SET_VERSION`. That was wrong: WHEN TO
   REASSESS is a policy decision, not catalogue content, and the constant's
   filename is a location rather than an argument. Reviewed wording changes
   often and selection policy rarely — hanging the policy on the content version
   would make every copy edit read as a policy change.

   ══ `rule`, NOT `methodChanged` ═════════════════════════════════════════════

   `COMPARISON_LANGUAGE.rule` is prospective: it says what a future comparison
   would be allowed to do. `methodChanged` is PAST TENSE and asserts a change
   between two results. Gate 3 shipped the past-tense sentence to somebody who
   had taken the assessment once, announcing a change between two results they
   did not have. That is the defect this line exists not to repeat.

   ══ NO CLOCK ═══════════════════════════════════════════════════════════════

   `dueAt` is ABSOLUTE. The relative phrase a person reads is formatted by the
   component from `dueAt` and `now`. Clock at the edge; this function is pure,
   and the same inputs give the same output forever.
   ════════════════════════════════════════════════════════════════════════ */

/** Days, as whole days, added to an ISO instant. */
function addDays(iso: string, days: number): string {
  const t = Date.parse(iso)
  if (Number.isNaN(t)) throw new Error(`review: "${iso}" is not a date`)
  return new Date(t + days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * Resolve the review point for a Food System.
 *
 * `establishedAt` rather than the score's `computedAt`: the review point is
 * part of the plan a person was given, and the plan was given when the system
 * was established. The two are normally the same instant; when they are not,
 * the system is the one that was shown.
 */
export function resolveReviewPoint(args: {
  establishedAt: string
  /** The policy version recorded on the Food System. */
  systemModelVersion: string
}): ReviewPoint {
  if (!isCurrentSystemModel(args.systemModelVersion)) {
    return {
      state: "unresolvable",
      setUnderVersion: args.systemModelVersion,
      comparabilityRule: COMPARISON_LANGUAGE.rule,
    }
  }

  return {
    state: "set",
    dueAt: addDays(args.establishedAt, REASSESSMENT.afterDays),
    afterDays: REASSESSMENT.afterDays,
    setUnderVersion: args.systemModelVersion,
    whatItCompares: REASSESSMENT.whatItCompares,
    comparabilityRule: REASSESSMENT.comparabilityRule,
  }
}

/**
 * Whole days from `now` until `dueAt`, for the component that says "in 24 days".
 *
 * THE CLOCK IS THE CALLER'S. `now` is a parameter, so the one place a real
 * `Date.now()` appears is the component, and every test states the day it is
 * pretending to be.
 *
 * Rounds UP, so a review point 23.2 days away reads as 24 rather than 23: a
 * person told "23 days" on a day that is really 24 away would find the date
 * arriving a day late, and rounding towards the longer wait is the direction
 * that never promises sooner than the truth.
 */
export function daysUntil(dueAt: string, now: Date): number {
  const ms = Date.parse(dueAt) - now.getTime()
  if (Number.isNaN(ms)) throw new Error(`review: "${dueAt}" is not a date`)
  return Math.ceil(ms / (24 * 60 * 60 * 1000))
}
