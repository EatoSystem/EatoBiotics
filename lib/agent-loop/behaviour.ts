/**
 * EatoBiotics Agent Loop — the observable food pattern behind each Biotic.
 *
 * ══ WHY THIS MODULE EXISTS ═══════════════════════════════════════════════════
 *
 * The loop used to name a Biotic when it meant a food behaviour. It wrote
 * "Prebiotics remains your strongest area", "This fed your Prebiotics" and
 * "Your Postbiotics slipped 8 points this week" — and the last of those was
 * live on `/account`, numeric, directional and longitudinal, which is three
 * prohibited things in one sentence.
 *
 * None of them is a thing a questionnaire or a meal photo measures. What the
 * questions actually asked about is a FOOD PATTERN, and a food pattern is both
 * honest and actionable: it is the thing a person can change. So the loop names
 * the pattern, and the Biotics stay exactly where they belong — as the science
 * the product teaches.
 *
 * The rule, in one line: TEACH THE BIOTICS; MEASURE OBSERVABLE FOOD PATTERNS.
 *
 * ══ AND WHY IT INVENTS NO WORDING ════════════════════════════════════════════
 *
 * `lib/pillars.ts`'s `PILLAR_BEHAVIOUR` was built for this exact substitution
 * and its docblock says so. Retyping its three phrases here would create a
 * second place the product's behaviour vocabulary lives, free to drift from the
 * first — which is the defect `food-swaps.ts` documents and the reason
 * `lib/fss/action/categories.ts` reads its labels positionally rather than
 * retyping them. So this module TRANSLATES KEYS and nothing else.
 *
 * ══ THE THREE VOCABULARIES THIS RECONCILES ═══════════════════════════════════
 *
 * There were four keyings of the same three concepts before this module:
 *
 *   PILLAR_BEHAVIOUR   keyed by DISPLAY LABEL      "Prebiotics"
 *   BioticKey          the loop's own key          "prebiotics"
 *   patterns.ts        per-meal, SINGULAR          "prebiotic"
 *   BIOTIC_NAME        per-meal display label      "Prebiotics"
 *
 * A keyed lookup between two vocabularies that do not agree is the precise bug
 * `lib/report/food-swaps.ts` records, where a pathway-key mismatch made 20 of
 * 25 swaps unreachable for 100% of reports — silently, because a missing key
 * reads as "nothing to say". Hence `BEHAVIOUR_UNKNOWN` below, and hence the
 * test that asserts every key in all three vocabularies resolves.
 */

import { BIOTIC_LABELS } from "./biotics"
import { pillarBehaviour } from "@/lib/pillars"
import type { BioticKey } from "./types"

/**
 * What a sentence says when a key does not resolve.
 *
 * Explicit, and never an empty string. An empty string composes into "Your
 * looks steady, while looks like the greater opportunity" — a sentence that
 * has lost its subject and still renders, which is the worst available
 * failure because nothing crashes and nobody notices.
 */
export const BEHAVIOUR_UNKNOWN = "your food pattern"

/** The per-meal key shape used by `lib/account/patterns.ts` and `account-twin.ts`. */
export type MealBioticKey = "prebiotic" | "probiotic" | "postbiotic"

const MEAL_TO_LOOP: Record<MealBioticKey, BioticKey> = {
  prebiotic: "prebiotics",
  probiotic: "probiotics",
  postbiotic: "postbiotics",
}

/**
 * The observable food pattern behind a Biotic, for the loop's own key.
 *
 * Goes through the display label because that is how `PILLAR_BEHAVIOUR` is
 * keyed — the bridge the module docblock warns about, in one place so there is
 * one place to get it wrong.
 */
export function loopBehaviour(key: BioticKey): string {
  return pillarBehaviour(BIOTIC_LABELS[key]) ?? BEHAVIOUR_UNKNOWN
}

/** The same, for the singular per-meal key. */
export function mealBehaviour(key: MealBioticKey): string {
  return loopBehaviour(MEAL_TO_LOOP[key])
}
