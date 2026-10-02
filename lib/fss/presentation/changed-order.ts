/**
 * Re-exported so `lib/fss/system/changed.ts` can order constraints without
 * importing the plan's presentation module wholesale.
 *
 * `plan.ts` owns the decision and the reasoning; this is a pointer at it, not
 * a second copy — `tests/unit/my-food-system.test.ts` asserts the two are the
 * same array so a divergence cannot appear quietly.
 */
export { SPOKEN_ORDER } from "./plan"
