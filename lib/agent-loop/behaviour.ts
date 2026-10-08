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

import { BIOTIC_LABELS, BIOTIC_FOOD_HINTS } from "./biotics"
import { pillarBehaviour } from "@/lib/pillars"
import type { BioticKey, BioticsSource } from "./types"

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

/* ═══════════════════════════════════════════════════════════════════════════
   THE THREE PHRASES ARE NOT GRAMMATICALLY UNIFORM, AND THAT IS LOAD-BEARING.

   `PILLAR_BEHAVIOUR` holds:

     Prebiotics   "plant variety and fibre"   a bare noun phrase, singular sense
     Probiotics   "fermented foods"           a bare noun phrase, PLURAL
     Postbiotics  "your eating rhythm"        ALREADY POSSESSIVE

   It is keyed for insight rows, where each phrase stands alone as a complete
   label and all three read correctly. Slotted into a template they do not.
   The first drafts of this repair produced, on the real functions:

     "Your your eating rhythm looks steady"       — a doubled possessive
     "fermented foods has room in your answers"   — subject–verb disagreement

   Neither is visible from the call site; both appeared the moment the provider
   was actually run and its strings printed. Same lesson as the Gate 3 context
   note, whose two colliding "and"s passed a unit test built on short fixtures
   and failed on the rendered page.

   So there are two rules, and the test file holds both:

     1. `loopBehaviour` returns the BARE phrase — a leading "your " is stripped,
        so a caller owns its own determiner and can write "your X" exactly once.
        This is a mechanical normalisation of reviewed copy, not new copy: no
        phrase is reworded, and `lib/pillars.ts` stays the only source.

     2. Every caller composes so that NO PHRASE IS THE SUBJECT OF A PRESENT-TENSE
        VERB. "fermented foods leads" and "fermented foods has" are both wrong
        and "plant variety and fibre lead" is wrong the other way, so there is no
        present-tense verb that fits all three. Past tense ("climbed", "slipped")
        and noun-phrase constructions ("One of your stronger patterns: X") are
        agreement-free and are what the callers use.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The observable food pattern behind a Biotic, for the loop's own key.
 *
 * Goes through the display label because that is how `PILLAR_BEHAVIOUR` is
 * keyed — the bridge the module docblock warns about, in one place so there is
 * one place to get it wrong. Returns the bare phrase; see the block above.
 */
export function loopBehaviour(key: BioticKey): string {
  const phrase = pillarBehaviour(BIOTIC_LABELS[key])
  if (!phrase) return BEHAVIOUR_UNKNOWN
  return phrase.replace(/^your\s+/i, "")
}

/* ═══════════════════════════════════════════════════════════════════════════
   A MEAL AND AN ASSESSMENT DO NOT MEASURE THE SAME THING, SO THERE ARE TWO.

   This was very nearly one function, and it would have been wrong. Mapping the
   per-meal key through `PILLAR_BEHAVIOUR` produced, on the real data:

     "Your best meals lean on eating rhythm"

   A meal has no eating rhythm. `PILLAR_BEHAVIOUR` describes what the
   ASSESSMENT asked about — q10–q12 are rhythm questions, so "your eating
   rhythm" is the right phrase for a `BioticKey`. A MEAL's third bucket is
   something else entirely. `lib/biotics-prompt.ts:35` defines it:

     "postbiotic: the postbiotic-SUPPORTING bucket — foods that give bacteria
      what they need to PRODUCE postbiotics: polyphenol-rich foods …
      resistant starch …"

   So a meal scores on polyphenol-rich and resistant-starch foods. Running the
   assessment's vocabulary over a meal key is a keyed lookup between two
   vocabularies that do not agree — which is precisely the defect
   `lib/report/food-swaps.ts` records in its own header, where a pathway-key
   mismatch made 20 of 25 swaps unreachable for 100% of reports. Silently,
   because a wrong-but-present value reads exactly like a right one.

   Two keyings, two sources, and neither invents wording:

     loopBehaviour   BioticKey        → PILLAR_BEHAVIOUR    what the questions asked
     mealBehaviour   MealBioticKey    → BIOTIC_FOOD_HINTS   what the meal was scored on

   `MEAL_TO_LOOP` survives for the places that genuinely need to cross over.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The food category a meal's sub-score was scored on.
 *
 * Takes the head of `BIOTIC_FOOD_HINTS` — everything before " like ", which is
 * where each hint turns from a category into examples. A mechanical extraction
 * rather than a retyping, so the three category names stay in one place and a
 * reviewed change to them travels here.
 *
 * All three results are bare plural noun phrases — "fibre-rich plants",
 * "fermented foods", "polyphenol-rich foods" — which is also why meal
 * sentences can use a present-tense verb where assessment sentences cannot.
 */
export function mealBehaviour(key: MealBioticKey): string {
  const hint = BIOTIC_FOOD_HINTS[MEAL_TO_LOOP[key]]
  if (!hint) return BEHAVIOUR_UNKNOWN
  return hint.split(" like ")[0]
}

const LOOP_TO_MEAL: Record<BioticKey, MealBioticKey> = {
  prebiotics: "prebiotic",
  probiotics: "probiotic",
  postbiotics: "postbiotic",
}

/**
 * The right phrase for where the number came from.
 *
 * The one function callers should reach for. Picking the vocabulary by hand at
 * each call site is how the two drift back apart, and the cost of getting it
 * wrong is a sentence that describes a dimension nobody measured — "your
 * eating rhythm" for a figure derived from meal sub-scores.
 */
export function behaviourFor(key: BioticKey, source: BioticsSource): string {
  return source === "meals" ? mealBehaviour(LOOP_TO_MEAL[key]) : loopBehaviour(key)
}
