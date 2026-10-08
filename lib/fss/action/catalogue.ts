import type { FssDomain } from "@/lib/fss/questions/types"
import { COMPARISON_LANGUAGE } from "@/lib/fss/engine/compare"
import type { CatalogueEntry, ReassessmentPoint } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   The candidate recommendation catalogue.

   FSS-v1 Candidate — Frozen for Scientific Review, Not Yet Scientifically
   Approved. Every entry carries `status: "candidate-pending-review"` when it
   is bound to a person, and no surface may present any of it as settled.

   ── Why the content is data and not strings in a component ────────────────

   Because a renderer that writes its own prose is the place unreviewed claims
   appear — nobody reviews a template literal. The same rule
   `DOMAIN_PRESENTATION` and the canonical Report renderer already run under.

   ── The sentence-level rules every line here obeys ────────────────────────

   From `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` §5. Each sentence makes exactly ONE
   move:

     measured food behaviour      "Your answers described…"   observed-behaviour
     self-reported observation    "You reported…"             self-reported
     scientific education         impersonal present          general-education
     what you could do            an action, never a result   personalised-recommendation
     biological inference         NOT AVAILABLE               no claim class exists

   And on top of those, specific to an ACTION layer:

     · NO PREDICTED OUTCOME. Not "you will feel", not "this improves", not
       "raises your score". §2 of the boundary refuses a prediction outright,
       and an action that arrives with a predicted outcome stops being
       something to try and becomes a claim to keep.
     · NO TIMEFRAME FOR A RESULT. `suggestedFrequency` is a cadence — how often
       to do it — and never a duration until an effect.
     · NO DEFICIENCY, DISEASE OR WEAKNESS. A priority is a practical starting
       point; see `PRIORITY_MUST_NOT_MEAN`.

   ── The three prohibited equivalences, and the two words to watch ─────────

   Fibre is never called a prebiotic. A fermented food is never called a
   probiotic and is never said to contain live microorganisms. No food is
   called a postbiotic. The word "prebiotic" does not appear in this file at
   all, which is the simplest way not to misuse it.

   "Seed" is the trap. The honest meaning is foods transformed by fermentation
   appearing in somebody's week — a behaviour they reported. It is NOT organisms
   establishing themselves in a person, and the claims guard refuses the verbs
   that would say so (`reseed`, `repopulate`, `colonise`, "seed new life").

   "Rejuvenate" has a named boundary: it must not mean producing or restoring
   anything microbial, nor repairing a person. Here it means renewing and
   protecting a pattern somebody described.

   ── Not every domain offers every category, and nothing pads the gap ──────

       diversity        Feed
       plantsAndFibre   Feed
       fermentedFoods   Seed
       foodQuality      Feed · Rejuvenate
       mealRhythm       Rejuvenate

   Forcing three categories per domain would mean inventing an action, and an
   invented action is exactly what a structured recommendation is supposed to
   make impossible. A test asserts at least one domain's set is genuinely
   incomplete, so "we do not pad" is a checked fact.

   ── `requires`, and the invariant that protects the most constrained ──────

   An entry declares the circumstances it needs. `requires: []` asks nothing of
   a person's time, money, access or kitchen, and EVERY DOMAIN HAS AT LEAST ONE
   — including at least one in each horizon it offers. A plan that goes silent
   on the person with the most constraints would be the worst failure available
   to this layer, so it is an invariant rather than an intention.

   ── Every entry must be reachable ─────────────────────────────────────────

   `lib/report/food-swaps.ts` documents, in its own header, the bug where a key
   mismatch left twenty of twenty-five authored swaps unreachable for one
   hundred percent of reports. Authored content that nothing can select is
   worse than no content, because it looks like coverage. A test walks every
   entry and proves some answer set reaches it.
   ════════════════════════════════════════════════════════════════════════ */

export const ACTION_CATALOGUE: readonly CatalogueEntry[] = [
  /* ── Diversity — Feed ─────────────────────────────────────────────────── */
  {
    id: "diversity-today-one-new",
    domain: "diversity",
    category: "feed",
    timeHorizon: "today",
    title: "One plant you have not had this week",
    practicalAction:
      "Pick one plant food you have not eaten in the past week and put it into a meal you were already going to have.",
    rationale:
      "Your answers described a narrower range of plant foods than of amounts, so adding one you do not usually eat changes the range rather than the portion.",
    suggestedFrequency: "Once, today.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "diversity-week-rotate",
    domain: "diversity",
    category: "feed",
    timeHorizon: "this-week",
    title: "Rotate instead of repeating",
    practicalAction:
      "Across this week, swap in three plant foods you do not usually buy, rather than more of the ones you already do.",
    rationale:
      "Range and amount are different things, and the range is the one your answers described least of.",
    suggestedFrequency: "Three swaps across the week.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "diversity-week-count-the-small",
    domain: "diversity",
    category: "feed",
    timeHorizon: "this-week",
    title: "Count the small ones",
    practicalAction:
      "Add herbs, seeds or a spoonful of tinned pulses to meals you are already making. Each one is a different plant.",
    rationale:
      "Herbs, seeds and pulses are plant foods, and they widen a week's range without changing what any meal is.",
    suggestedFrequency: "Most days, in whatever you are already cooking.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "diversity-week-shop-by-season",
    domain: "diversity",
    category: "feed",
    timeHorizon: "this-week",
    title: "Build the week around what is good now",
    practicalAction:
      "Let one shop decide: pick two or three plant foods that look best that week, then plan two meals around them.",
    rationale:
      "Your answers described returning to a familiar set, and letting the shop choose breaks a set more reliably than deciding in advance.",
    suggestedFrequency: "Once a week, at one shop.",
    claimClass: "observed-behaviour",
    requires: ["access", "cost"],
  },

  /* ── Plants & Fibre — Feed ────────────────────────────────────────────── */
  {
    id: "fibre-today-one-source",
    domain: "plantsAndFibre",
    category: "feed",
    timeHorizon: "today",
    title: "One fibre source, one meal",
    practicalAction:
      "Add one fibre-rich food to a meal you are already having today — oats, beans, lentils, or a handful of nuts.",
    rationale:
      "Your answers described fibre-rich plant food arriving unevenly, so the smallest change is to attach one to a meal that already happens.",
    suggestedFrequency: "Once, today.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "fibre-week-anchor-a-meal",
    domain: "plantsAndFibre",
    category: "feed",
    timeHorizon: "this-week",
    title: "Attach it to a meal that already happens",
    practicalAction:
      "Pick one meal you eat most days and give it a fixed fibre source: oats at breakfast, pulses in one dinner, nuts with lunch.",
    rationale:
      "A habit attached to a meal that already happens needs no new decision, which is usually what lets it survive a busy week.",
    suggestedFrequency: "The same meal, most days.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "fibre-week-tinned-and-frozen",
    domain: "plantsAndFibre",
    category: "feed",
    timeHorizon: "this-week",
    title: "Tinned and frozen count",
    practicalAction:
      "Keep tinned beans, lentils or chickpeas and frozen vegetables in, and add a portion to whatever you are already cooking.",
    rationale:
      "Tinned and frozen plant foods keep for months and cost less than fresh, so the amount of fibre in a week is not the part that has to be expensive.",
    suggestedFrequency: "Two or three meals across the week.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "fibre-week-widen-the-sources",
    domain: "plantsAndFibre",
    category: "feed",
    timeHorizon: "this-week",
    title: "Widen where it comes from",
    practicalAction:
      "Buy two sources you do not usually get — a different wholegrain, a pulse you have not cooked, a nut or seed you do not keep in.",
    rationale:
      "Your answers described a steady amount coming from a narrow set of sources.",
    suggestedFrequency: "Two new sources this week.",
    claimClass: "observed-behaviour",
    requires: ["cost"],
  },

  /* ── Fermented Foods — Seed ───────────────────────────────────────────── */
  {
    id: "fermented-today-a-spoonful",
    domain: "fermentedFoods",
    category: "seed",
    timeHorizon: "today",
    title: "A spoonful, beside something you are already eating",
    practicalAction:
      "Put a spoonful of yoghurt, kefir, kimchi, sauerkraut or miso beside a meal you are already having today.",
    rationale:
      "Your answers described fermented foods appearing rarely, and a spoonful beside an existing meal changes the pattern without changing the meal.",
    suggestedFrequency: "Once, today.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "fermented-week-small-and-regular",
    domain: "fermentedFoods",
    category: "seed",
    timeHorizon: "this-week",
    title: "Small and regular, not large and occasional",
    practicalAction:
      "Aim for a small amount on most days rather than a large amount once. A few spoonfuls is enough to make it a pattern.",
    rationale:
      "Regularity is the part your answers described least; the amount was not the gap.",
    suggestedFrequency: "A small amount, most days.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "fermented-week-one-you-like",
    domain: "fermentedFoods",
    category: "seed",
    timeHorizon: "this-week",
    title: "Start with the one you actually like",
    practicalAction:
      "Pick the single fermented food you would happily eat again, and keep that one in. Variety can come later.",
    rationale:
      "Foods transformed by fermentation differ widely in taste, and a pattern built on something unpleasant rarely lasts a week.",
    suggestedFrequency: "The same one, most days this week.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "fermented-week-rotate-a-few",
    domain: "fermentedFoods",
    category: "seed",
    timeHorizon: "this-week",
    title: "Rotate between a few",
    practicalAction:
      "Keep two or three different fermented foods in, and alternate them across the week.",
    rationale:
      "Fermentation is a family of processes rather than a single one, and different foods are made in different ways.",
    suggestedFrequency: "Alternating, across the week.",
    claimClass: "general-education",
    requires: ["cost", "access"],
  },

  /* ── Food Quality — Feed and Rejuvenate, no Seed ──────────────────────── */
  {
    id: "quality-today-one-swap",
    domain: "foodQuality",
    category: "feed",
    timeHorizon: "today",
    title: "One swap, today",
    practicalAction:
      "Take one ready-made item you were going to eat today and use its simplest whole version instead — plain yoghurt rather than flavoured, oats rather than a cereal bar.",
    rationale:
      "Your answers described a mix of home-prepared and ready-made food, so a single swap is a change that needs no planning.",
    suggestedFrequency: "Once, today.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "quality-week-easiest-meal",
    domain: "foodQuality",
    category: "rejuvenate",
    timeHorizon: "this-week",
    title: "Change the easiest meal, not the hardest",
    practicalAction:
      "Pick the one meal that would take least effort to make from whole ingredients, and make that one reliably. Leave the rest alone.",
    rationale:
      "One meal that reliably happens tends to hold better than an intention to change every meal.",
    suggestedFrequency: "The same meal, most days.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "quality-week-keep-the-shortcuts",
    domain: "foodQuality",
    category: "rejuvenate",
    timeHorizon: "this-week",
    title: "Keep the shortcuts that help",
    practicalAction:
      "Pre-chopped vegetables, tinned tomatoes, frozen herbs and bagged salad all start from whole ingredients. Use them rather than giving up on the meal.",
    rationale:
      "Starting from ingredients is about what the food is, not about how much work it took to get there.",
    suggestedFrequency: "Whenever it makes the difference between cooking and not.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "quality-week-cook-one-thing",
    domain: "foodQuality",
    category: "feed",
    timeHorizon: "this-week",
    title: "Cook one thing start to finish",
    practicalAction:
      "Pick one meal this week and make it from whole ingredients from start to finish, with no particular ambition about the rest.",
    rationale:
      "Your answers described mostly ready-made food, and one whole-ingredient meal is something you can repeat rather than a new routine.",
    suggestedFrequency: "Once this week.",
    claimClass: "observed-behaviour",
    requires: ["time", "kitchen"],
  },

  /* ── Meal Rhythm — Rejuvenate ─────────────────────────────────────────── */
  {
    id: "rhythm-today-protect-one",
    domain: "mealRhythm",
    category: "rejuvenate",
    timeHorizon: "today",
    title: "Protect today's meal that usually slips",
    practicalAction:
      "Decide now which meal today is most likely to be skipped, late or rushed — and give it a time.",
    rationale:
      "Your answers described a rhythm that holds on some days and slips on others, and naming the meal that slips is what makes it protectable.",
    suggestedFrequency: "Once, today.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "rhythm-week-one-fixed-point",
    domain: "mealRhythm",
    category: "rejuvenate",
    timeHorizon: "this-week",
    title: "One fixed point, then build out",
    practicalAction:
      "Choose a single meal to keep at roughly the same time every day this week. Let the others fall where they fall.",
    rationale:
      "A rhythm is easier to settle around one fixed point than across a whole schedule.",
    suggestedFrequency: "The same meal, at roughly the same time, daily.",
    claimClass: "general-education",
    requires: [],
  },
  {
    id: "rhythm-week-name-the-day",
    domain: "mealRhythm",
    category: "rejuvenate",
    timeHorizon: "this-week",
    title: "Name the day that breaks it",
    practicalAction:
      "Work out which day most often breaks your rhythm, and decide in advance what you will eat on that day.",
    rationale:
      "Your answers described meals being skipped, late or rushed, and that tends to concentrate on particular days rather than spreading evenly.",
    suggestedFrequency: "One day, planned in advance.",
    claimClass: "observed-behaviour",
    requires: [],
  },
  {
    id: "rhythm-week-something-ready",
    domain: "mealRhythm",
    category: "rejuvenate",
    timeHorizon: "this-week",
    title: "Have something ready for the meal that goes missing",
    practicalAction:
      "Make or portion something ahead for the meal you most often skip, so the decision is already taken when the day goes wrong.",
    rationale:
      "A meal that needs a decision late in a difficult day is the one most likely to be skipped.",
    suggestedFrequency: "Once, covering two or three meals.",
    claimClass: "general-education",
    requires: ["time", "kitchen"],
  },
]

/* ════════════════════════════════════════════════════════════════════════
   The thirty-day horizon — a behaviour to hold, per domain.

   ── Why this is not four more catalogue entries ───────────────────────────

   Because a month is not a fourth list of tips. Nothing in `ACTION_CATALOGUE`
   carries `timeHorizon: "thirty-days"`, deliberately and provably: the
   thirty-day horizon names ONE behaviour to keep, and the point of a month is
   finding out whether it survives an ordinary one.

   The €49 Report reached the same conclusion from a different direction — its
   four-week loop is four re-framings of ONE lever, with its own composer
   noting that "four actions is a list of tips". That loop is not reused here:
   it belongs to a different product with its own content-pack versioning and
   its own frozen copy, and importing it would couple two release trains while
   copying its strings would create a second source for reviewed wording.
   ════════════════════════════════════════════════════════════════════════ */

export interface ThirtyDayCopy {
  readonly behaviour: string
  readonly whyThisOne: string
}

export const THIRTY_DAY_FOCUS: Record<FssDomain, ThirtyDayCopy> = {
  diversity: {
    behaviour:
      "Keep widening the range rather than the amount: one plant food you do not usually eat each week, kept in if you liked it.",
    whyThisOne:
      "Range is what your answers described least of, and a month is long enough to find out which new foods you actually keep buying.",
  },
  plantsAndFibre: {
    behaviour: "Keep one fibre source attached to one meal you eat most days.",
    whyThisOne:
      "A single anchored habit is the one most likely to still be there in a month, and finding that out is what the month is for.",
  },
  fermentedFoods: {
    behaviour: "Keep a small amount of one fermented food in your week, on most days.",
    whyThisOne:
      "Your answers described regularity rather than amount as the gap, and regularity is only visible across weeks.",
  },
  foodQuality: {
    behaviour: "Keep the one meal you chose made from whole ingredients.",
    whyThisOne:
      "One reliable meal is a change you can hold, and a month is how you find out whether it survives an ordinary week.",
  },
  mealRhythm: {
    behaviour:
      "Keep the one fixed meal time you chose — including on the day that usually breaks it.",
    whyThisOne:
      "Your answers described a rhythm that slips unevenly, and the test of a fixed point is whether it holds on a bad week.",
  },
}

/**
 * Where a reassessment sits, and what it would be allowed to say.
 *
 * Computes nothing. The rule is taken from the Gate 2 comparison primitive
 * rather than restated, so there is one place that decides what two results may
 * be said about each other.
 *
 * ── It uses `rule`, and the first version used `methodChanged` ────────────
 *
 * That was wrong, and only reading the rendered page caught it.
 * `methodChanged` is PAST TENSE — "the way we calculate this changed between
 * these two results" — and it was being shown to somebody who had taken the
 * assessment once, announcing a change between two results they did not have.
 * A sentence asserting something that has not happened is exactly the class of
 * defect this layer exists to prevent, so it is worth the note: the test suite
 * was green, because every test asserted the two strings were EQUAL rather
 * than asking whether the sentence was true where it appeared.
 */
export const REASSESSMENT: ReassessmentPoint = {
  afterDays: 30,
  whatItCompares:
    "The answers you would give then, against the ones you gave today. Reported food patterns — not biology, and not a measure of health.",
  comparabilityRule: COMPARISON_LANGUAGE.rule,
}
