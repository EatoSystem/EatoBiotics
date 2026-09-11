import type { ReportCapability } from "./capabilities"

/**
 * The reviewed words — Phase 4A-S2.
 *
 * ══ WHY A PACK AND NOT PROSE IN THE COMPOSER ════════════════════════════════
 *
 * Because every customer-facing sentence in this Report is reviewed content,
 * and reviewed content needs a version. Wording lives here, keyed by question
 * and answer value; the composer selects, it never writes. Changing a word
 * changes `CONTENT_PACK_VERSION`, which travels in the Report's provenance, so
 * two Reports that read differently can always be told apart by more than
 * their dates.
 *
 * ══ EXHAUSTIVE, WITH NO DEFAULT ═════════════════════════════════════════════
 *
 * Every enumerated option value of every core question has an explicit
 * disposition: a reviewed template, or `null` meaning explicitly
 * no-proposition. There is deliberately no fallback string and no
 * "…" default: an implicit default is how an unreviewed sentence reaches a
 * paying customer. A test asserts coverage against the live bank in both
 * directions, so adding an option to the bank fails the build until somebody
 * decides what it says.
 *
 * ══ WHAT THE TEMPLATES MAY SAY ══════════════════════════════════════════════
 *
 * Science-adjudicated questions: never more than the contract's
 * `allowedInterpretation`. Product-operational questions: logistics and stated
 * preference only. Every template obeys `REPORT_COMPOSITION_BOUNDARY` — the
 * approved framings are "You told us", "You reported", "You notice", "You said
 * this tends to happen", "Based on the routines and constraints you
 * described"; the prohibited ones assert findings and are checked mechanically
 * in `buildProposition`.
 *
 * No named food appears anywhere in this pack while `specificFoods` is
 * disabled, and no Prebiotics/Probiotics/Postbiotics language appears while
 * `bioticsLanguage` is disabled. Both are additionally enforced at compose
 * time; the pack simply does not contain the words.
 */

/** Bumped by ANY wording change below. */
export const CONTENT_PACK_VERSION = "content-pack-v1" as const

/**
 * One reviewed line.
 *
 * `null` is a first-class disposition meaning "reviewed, and deliberately
 * silent" — distinguishable in the type from an option nobody has considered,
 * which the coverage guard rejects.
 */
export interface ContentTemplate {
  /** Stable, and carried into the proposition for provenance. */
  readonly templateId: string
  /** The customer-facing sentence. Never assembled from fragments at runtime. */
  readonly text: string
  /**
   * Capabilities these WORDS require, independently of where they land.
   *
   * A sentence that names a food needs the dietetic gate even if its target
   * would not have demanded one — the requirement belongs to what is being
   * said, not only to which section says it. Defence in depth against a future
   * template being moved to an ungated target and quietly becoming sayable.
   */
  readonly requiresCapabilities?: readonly ReportCapability[]
}

export type ContentDisposition = ContentTemplate | null

/** question id → answer value → disposition. */
export type QuestionContent = Readonly<Record<string, ContentDisposition>>

const t = (templateId: string, text: string): ContentTemplate => ({ templateId, text })

/** A template whose words name a broad food category. Always gated. */
const food = (templateId: string, text: string): ContentTemplate => ({
  templateId,
  text,
  requiresCapabilities: ["specificFoods"],
})

/* ══ Signals ═══════════════════════════════════════════════════════════════ */

const POST_MEAL_PATTERN: QuestionContent = {
  fullness: t("signals.postMealPattern.fullness", "You told us fullness that stays with you is the thing you tend to notice after eating."),
  bloating: t("signals.postMealPattern.bloating", "You told us bloating is the thing you tend to notice after eating."),
  dip: t("signals.postMealPattern.dip", "You told us a dip in energy is the thing you tend to notice after eating."),
  "lift-then-dip": t("signals.postMealPattern.liftThenDip", "You told us a lift and then a dip is the pattern you tend to notice after eating."),
  nothing: t("signals.postMealPattern.nothing", "You told us you don't particularly notice anything after eating."),
  // Reviewed and deliberately silent: naming the decline back to the customer
  // adds nothing and risks reading as a prompt to disclose.
  "prefer-not-to-say": null,
}

const ENERGY_SHAPE: QuestionContent = {
  steady: t("signals.energyShape.steady", "You reported your energy is fairly steady across the day."),
  "slow-start": t("signals.energyShape.slowStart", "You reported your energy is slow to start and builds later."),
  "afternoon-dip": t("signals.energyShape.afternoonDip", "You reported an afternoon dip in your energy."),
  variable: t("signals.energyShape.variable", "You reported your energy varies from day to day."),
  unpredictable: t("signals.energyShape.unpredictable", "You reported your energy is hard to predict."),
}

const SIGNALS_CONTEXT: QuestionContent = {
  // Atomic: each option covers two circumstances and the customer never said
  // which. The wording keeps them joined exactly as the option did.
  rushed: t("signals.context.rushed", "You said this tends to happen on days that are rushed or eaten on the go."),
  "large-late": t("signals.context.largeLate", "You said this tends to happen on days with a larger or later meal."),
  "stress-sleep": t("signals.context.stressSleep", "You said this tends to happen on days with more stress or less sleep."),
  "away-from-home": t("signals.context.awayFromHome", "You said this tends to happen on days you eat away from home."),
  "no-connection": t("signals.context.noConnection", "You told us you haven't noticed a connection to any particular kind of day."),
  "prefer-not-to-say": null,
}

const HOUSEHOLD_MEALTIME: QuestionContent = {
  relaxed: t("signals.householdMealtime.relaxed", "You told us mealtimes in your household are generally relaxed."),
  rushed: t("signals.householdMealtime.rushed", "You told us mealtimes in your household are usually rushed."),
  staggered: t("signals.householdMealtime.staggered", "You told us people in your household tend to eat at different times."),
  negotiated: t("signals.householdMealtime.negotiated", "You told us mealtimes in your household usually involve some negotiation."),
  varies: t("signals.householdMealtime.varies", "You told us mealtimes in your household vary a lot."),
}

const HOUSEHOLD_HARDEST_MOMENT: QuestionContent = {
  mornings: t("signals.householdHardestMoment.mornings", "You told us mornings are the hardest part of the day for your household."),
  midday: t("signals.householdHardestMoment.midday", "You told us the middle of the day is the hardest part for your household."),
  "after-school-work": t("signals.householdHardestMoment.afterSchoolWork", "You told us the stretch after school or work is the hardest part for your household."),
  evenings: t("signals.householdHardestMoment.evenings", "You told us evenings are the hardest part of the day for your household."),
  weekends: t("signals.householdHardestMoment.weekends", "You told us weekends are the hardest part for your household."),
  "none-stand-out": t("signals.householdHardestMoment.noneStandOut", "You told us no particular moment stands out as hardest for your household."),
}

const SETTLED_DAYS: QuestionContent = {
  "regular-meals": t("signals.settledDays.regularMeals", "You told us meals tend to be more regular on the days you experience as more settled."),
  // Action boundary: the customer's own report, never turned into eating less.
  "lighter-meals": t("signals.settledDays.lighterMeals", "You told us meals tend to be lighter or simpler on the days you experience as more settled."),
  "stress-sleep": t("signals.settledDays.stressSleep", "You told us there tends to be less stress or more sleep on the days you experience as more settled."),
  movement: t("signals.settledDays.movement", "You told us there tends to be more movement on the days you experience as more settled."),
  "cannot-tell": t("signals.settledDays.cannotTell", "You told us you can't tell a difference on the days you experience as more settled."),
}

/* ══ Rhythm ════════════════════════════════════════════════════════════════ */

const FIRST_MEAL: QuestionContent = {
  "within-hour": t("rhythm.firstMeal.withinHour", "You told us you usually eat within an hour of waking."),
  "one-to-three": t("rhythm.firstMeal.oneToThree", "You told us you usually eat one to three hours after waking."),
  "over-three": t("rhythm.firstMeal.overThree", "You told us you usually eat more than three hours after waking."),
  varies: t("rhythm.firstMeal.varies", "You told us when you first eat varies."),
  none: t("rhythm.firstMeal.none", "You told us you don't usually have a first meal as such."),
}

const LONGEST_GAP: QuestionContent = {
  "under-4": t("rhythm.longestGap.under4", "You told us your longest gap between eating is usually under four hours."),
  "4-to-6": t("rhythm.longestGap.fourToSix", "You told us your longest gap between eating is usually four to six hours."),
  "6-to-8": t("rhythm.longestGap.sixToEight", "You told us your longest gap between eating is usually six to eight hours."),
  "over-8": t("rhythm.longestGap.overEight", "You told us your longest gap between eating is usually more than eight hours."),
  varies: t("rhythm.longestGap.varies", "You told us your longest gap between eating varies."),
}

const HOUSEHOLD_SHARED_MEALS: QuestionContent = {
  "most-days": t("rhythm.householdSharedMeals.mostDays", "You told us your household eats together most days."),
  "few-times-week": t("rhythm.householdSharedMeals.fewTimesWeek", "You told us your household eats together a few times a week."),
  weekends: t("rhythm.householdSharedMeals.weekends", "You told us your household eats together mainly at weekends."),
  rarely: t("rhythm.householdSharedMeals.rarely", "You told us your household rarely eats together."),
  never: t("rhythm.householdSharedMeals.never", "You told us your household doesn't eat together."),
}

const WEEK_SHAPE: QuestionContent = {
  same: t("rhythm.weekShape.same", "You told us your week is much the same throughout."),
  looser: t("rhythm.weekShape.looser", "You told us weekends are looser than weekdays."),
  "very-different": t("rhythm.weekShape.veryDifferent", "You told us weekends look very different from weekdays."),
  "weekdays-unpredictable": t("rhythm.weekShape.weekdaysUnpredictable", "You told us your weekdays themselves are unpredictable."),
  varies: t("rhythm.weekShape.varies", "You told us the shape of your week varies."),
}

const RECENT_CHANGE: QuestionContent = {
  schedule: t("rhythm.recentChange.schedule", "You told us a new job or a change of schedule has affected how you eat recently."),
  "move-travel": t("rhythm.recentChange.moveTravel", "You told us a house move or a lot of travel has affected how you eat recently."),
  caring: t("rhythm.recentChange.caring", "You told us caring responsibilities have affected how you eat recently."),
  // NO PROPOSITION. Health history: recapping it here would reintroduce what
  // the Science Contract removed when it adjudicated the antibiotics question
  // out of the bank. Held pending its own adjudication.
  "health-event": null,
  "cooking-change": t("rhythm.recentChange.cookingChange", "You told us a change in how much cooking happens at home has affected how you eat recently."),
  none: t("rhythm.recentChange.none", "You told us nothing much has changed recently."),
  "prefer-not-to-say": null,
}

const HOUSEHOLD_SEPARATE_REASON: QuestionContent = {
  schedules: t("rhythm.householdSeparateReason.schedules", "You told us different schedules are what most often makes eating together difficult."),
  tastes: t("rhythm.householdSeparateReason.tastes", "You told us different tastes are what most often makes eating together difficult."),
  space: t("rhythm.householdSeparateReason.space", "You told us space or the way the kitchen works is what most often makes eating together difficult."),
  "not-tried": t("rhythm.householdSeparateReason.notTried", "You told us your household hasn't really tried to change how you eat separately."),
  "works-better": t("rhythm.householdSeparateReason.worksBetter", "You told us eating separately works better for your household."),
  other: t("rhythm.householdSeparateReason.other", "You told us something else makes eating together difficult."),
}

/* ══ Environment ═══════════════════════════════════════════════════════════ */

const COOKING_FREQUENCY: QuestionContent = {
  "almost-all": t("environment.cookingFrequency.almostAll", "You told us almost all of your meals are cooked at home."),
  most: t("environment.cookingFrequency.most", "You told us most of your meals are cooked at home."),
  half: t("environment.cookingFrequency.half", "You told us about half of your meals are cooked at home."),
  few: t("environment.cookingFrequency.few", "You told us few of your meals are cooked at home."),
  "hardly-any": t("environment.cookingFrequency.hardlyAny", "You told us hardly any of your meals are cooked at home."),
}

const WHO_PREPARES: QuestionContent = {
  me: t("environment.whoPrepares.me", "You told us you do most of the preparing."),
  shared: t("environment.whoPrepares.shared", "You told us preparing food is shared in your household."),
  "someone-else": t("environment.whoPrepares.someoneElse", "You told us someone else does most of the preparing."),
  varies: t("environment.whoPrepares.varies", "You told us who prepares food varies."),
}

const PLANNING: QuestionContent = {
  planned: t("environment.planning.planned", "You told us food is mostly planned in advance."),
  regular: t("environment.planning.regular", "You told us you do a regular shop."),
  "top-ups": t("environment.planning.topUps", "You told us you mostly top up as you go."),
  delivery: t("environment.planning.delivery", "You told us you mostly use delivery."),
  "someone-else": t("environment.planning.someoneElse", "You told us someone else handles the shopping."),
  varies: t("environment.planning.varies", "You told us how food arrives varies."),
}

const CONSTRAINTS: QuestionContent = {
  allergy: t("environment.constraints.allergy", "You told us there's an allergy to work around."),
  "medical-avoid": t("environment.constraints.medicalAvoid", "You told us there's a food you avoid for medical reasons."),
  "vegetarian-vegan": t("environment.constraints.vegetarianVegan", "You told us you eat vegetarian or vegan."),
  "religious-cultural": t("environment.constraints.religiousCultural", "You told us there are religious or cultural requirements to work around."),
  budget: t("environment.constraints.budget", "You told us budget is something to work around."),
  time: t("environment.constraints.time", "You told us time is something to work around."),
  dislikes: t("environment.constraints.dislikes", "You told us there are strong dislikes to work around."),
  none: t("environment.constraints.none", "You told us there's nothing in particular to work around."),
  "prefer-not-to-say": null,
}

const HOUSEHOLD_DIFFERING_NEEDS: QuestionContent = {
  tastes: t("environment.householdDifferingNeeds.tastes", "You told us people in your household have different tastes."),
  schedules: t("environment.householdDifferingNeeds.schedules", "You told us people in your household are on different schedules."),
  // Operational only, and additionally subject to the Q17 contradiction rule.
  allergies: t("environment.householdDifferingNeeds.allergies", "You told us someone in your household has an allergy or intolerance to work around."),
  "life-stage": t("environment.householdDifferingNeeds.lifeStage", "You told us people in your household need different amounts, or are at different life stages."),
  other: t("environment.householdDifferingNeeds.other", "You told us people in your household need something else that differs."),
  same: t("environment.householdDifferingNeeds.same", "You told us people in your household largely need the same things."),
  "prefer-not-to-say": null,
}

/**
 * Declared avoidances.
 *
 * Every line names a broad CATEGORY the customer asked not to be suggested —
 * which is the customer's own declaration repeated back, not a food the Report
 * is recommending. These are the only food words in the pack, they exist to
 * suppress rather than to suggest, and the whole section is additionally
 * behind `specificFoods`.
 */
const FOOD_AVOIDANCES: QuestionContent = {
  dairy: food("environment.foodAvoidances.dairy", "You asked us to leave out dairy."),
  eggs: food("environment.foodAvoidances.eggs", "You asked us to leave out eggs."),
  "fish-shellfish": food("environment.foodAvoidances.fishShellfish", "You asked us to leave out fish and shellfish."),
  nuts: food("environment.foodAvoidances.nuts", "You asked us to leave out nuts."),
  "wheat-gluten": food("environment.foodAvoidances.wheatGluten", "You asked us to leave out wheat and gluten."),
  soya: food("environment.foodAvoidances.soya", "You asked us to leave out soya."),
  sesame: food("environment.foodAvoidances.sesame", "You asked us to leave out sesame."),
  // Unresolved, not silent: the composer states that something is being worked
  // around without naming it. Never rendered as a clearance.
  other: null,
  "prefer-not-to-say": null,
}

/* ══ Intentions ════════════════════════════════════════════════════════════ */

const PRIMARY_FOCUS: QuestionContent = {
  energy: t("intentions.primaryFocus.energy", "You told us energy is what you most want to work on."),
  digestion: t("intentions.primaryFocus.digestion", "You told us digestion is what you most want to work on."),
  focus: t("intentions.primaryFocus.focus", "You told us focus is what you most want to work on."),
  recovery: t("intentions.primaryFocus.recovery", "You told us recovery is what you most want to work on."),
  consistency: t("intentions.primaryFocus.consistency", "You told us consistency is what you most want to work on."),
  variety: t("intentions.primaryFocus.variety", "You told us variety is what you most want to work on."),
  unsure: t("intentions.primaryFocus.unsure", "You told us you're not sure yet what you most want to work on."),
}

const BARRIER: QuestionContent = {
  time: t("intentions.barrier.time", "You told us time is what usually gets in the way."),
  cost: t("intentions.barrier.cost", "You told us cost is what usually gets in the way."),
  "different-needs": t("intentions.barrier.differentNeeds", "You told us different needs in the household are what usually get in the way."),
  unclear: t("intentions.barrier.unclear", "You told us not being sure what to do is what usually gets in the way."),
  fades: t("intentions.barrier.fades", "You told us starting well and then fading is what usually gets in the way."),
  other: t("intentions.barrier.other", "You told us something else usually gets in the way."),
  none: t("intentions.barrier.none", "You told us nothing in particular gets in the way."),
}

/* ══ The pack ══════════════════════════════════════════════════════════════ */

export const CONTENT_PACK: Readonly<Record<string, QuestionContent>> = {
  core_signals_post_meal_pattern_v1: POST_MEAL_PATTERN,
  core_signals_energy_shape_v1: ENERGY_SHAPE,
  core_signals_context_v1: SIGNALS_CONTEXT,
  core_signals_household_mealtime_v1: HOUSEHOLD_MEALTIME,
  core_signals_household_hardest_moment_v1: HOUSEHOLD_HARDEST_MOMENT,
  core_signals_settled_days_v1: SETTLED_DAYS,
  core_rhythm_first_meal_v1: FIRST_MEAL,
  core_rhythm_longest_gap_v1: LONGEST_GAP,
  core_rhythm_household_shared_meals_v1: HOUSEHOLD_SHARED_MEALS,
  core_rhythm_week_shape_v1: WEEK_SHAPE,
  core_rhythm_recent_change_v1: RECENT_CHANGE,
  core_rhythm_household_separate_reason_v1: HOUSEHOLD_SEPARATE_REASON,
  core_environment_cooking_frequency_v1: COOKING_FREQUENCY,
  core_environment_who_prepares_v1: WHO_PREPARES,
  core_environment_planning_v1: PLANNING,
  core_environment_constraints_v1: CONSTRAINTS,
  core_environment_household_differing_needs_v1: HOUSEHOLD_DIFFERING_NEEDS,
  core_environment_food_avoidances_v1: FOOD_AVOIDANCES,
  core_intentions_primary_focus_v1: PRIMARY_FOCUS,
  core_intentions_barrier_v1: BARRIER,
  // The textarea has no enumerated values. Its content is the customer's own
  // words, quoted by the composer — deliberately absent from the pack, because
  // a template for it would be us writing what they said.
  core_intentions_success_v1: {},
}

/**
 * The reviewed line for one answer value.
 *
 * `undefined` means the pack has no entry — a coverage failure the guard
 * catches — and is deliberately distinct from `null`, which means reviewed and
 * silent. Callers must not collapse the two.
 */
export function templateFor(questionId: string, value: string): ContentDisposition | undefined {
  const q = CONTENT_PACK[questionId]
  if (!q) return undefined
  return value in q ? q[value] : undefined
}

/* ══ The pack as an addressable authority ══════════════════════════════════ */

/**
 * A resolver that owns BOTH the words and what saying them costs.
 *
 * ══ WHY THE PACK IS ADDRESSABLE AND THE CALLER IS NOT TRUSTED ═══════════════
 *
 * `buildProposition` used to take `templateId`, `text` and the template's
 * capabilities as three independent arguments. A caller could therefore select
 * the reviewed words and pass no capabilities — "requirements can only be
 * added" is no protection when adding nothing is an option. Selecting a
 * sentence that names a food while omitting its gate was one dropped property
 * away.
 *
 * So the caller now names an IDENTITY — which pack, which question, which
 * value — and the resolver on the other side of that boundary establishes the
 * text and `requiresCapabilities` together. They cannot disagree because they
 * are never supplied separately. This is a runtime lookup, not a structural
 * type, so a forged object literal cannot stand in for a reviewed template.
 */
export interface ContentPack {
  readonly id: string
  readonly version: string
  resolve(questionId: string, value: string): ContentDisposition | undefined
}

/** The id of the pack every production proposition resolves through. */
export const PRODUCTION_CONTENT_PACK_ID = CONTENT_PACK_VERSION

const PRODUCTION_PACK: ContentPack = {
  id: PRODUCTION_CONTENT_PACK_ID,
  version: CONTENT_PACK_VERSION,
  resolve: templateFor,
}

const PACKS = new Map<string, ContentPack>([[PRODUCTION_CONTENT_PACK_ID, PRODUCTION_PACK]])

/** The pack for an id, or `undefined`. No fallback to production. */
export function contentPackFor(packId: string): ContentPack | undefined {
  return PACKS.get(packId)
}

/** Reserved prefix. Only ids under it may be registered after module load. */
export const TEST_CONTENT_PACK_PREFIX = "test:"

/**
 * Register an additional pack, for tests only.
 *
 * ══ WHY THIS EXISTS, AND WHY IT IS NOT AN OVERRIDE ══════════════════════════
 *
 * Two of the three capabilities — `bioticsLanguage` and `safetyNetting` — have
 * no template in the production pack, because the pack deliberately does not
 * contain words their gates have not approved. Proving those gates only at a
 * helper would test a layer below the one that matters, so the tests need a
 * synthetic template that travels the REAL construction and admission path.
 *
 * It is not an override: it cannot replace the production pack (that id is
 * already taken and re-registration throws), it cannot be reached without a
 * caller naming its id explicitly, and a fixture question has no permission
 * record, so `buildProposition` refuses it in any production path regardless.
 *
 * The prefix is enforced here rather than documented, and a guard asserts no
 * module under app/, components/ or lib/ calls this function at all.
 */
export function registerTestContentPack(pack: ContentPack): void {
  if (!pack.id.startsWith(TEST_CONTENT_PACK_PREFIX)) {
    throw new Error(
      `refusing to register content pack "${pack.id}": ids must begin with "${TEST_CONTENT_PACK_PREFIX}"`,
    )
  }
  if (PACKS.has(pack.id)) throw new Error(`content pack "${pack.id}" is already registered`)
  PACKS.set(pack.id, pack)
}

/* ══ Fixed structural copy ═════════════════════════════════════════════════ */

/**
 * Section and loop wording that does not vary by answer.
 *
 * Here rather than in the composer for the same reason as everything else: it
 * is customer-facing, so it is reviewed, and it is versioned with the pack.
 */
/**
 * Template ids the composer may use with its own text.
 *
 * Exactly one today: the quotation, whose words are the CUSTOMER'S and which
 * therefore no pack could hold. Everything else customer-facing resolves
 * through a pack. The allow-list is checked at runtime so the structural path
 * cannot quietly become a general route into unreviewed content.
 */
export const STRUCTURAL_TEMPLATE_IDS = ["intentions.success.quotation"] as const

export type StructuralTemplateId = (typeof STRUCTURAL_TEMPLATE_IDS)[number]

export function isStructuralTemplateId(id: string): id is StructuralTemplateId {
  return (STRUCTURAL_TEMPLATE_IDS as readonly string[]).includes(id)
}

export const STRUCTURAL_COPY = {
  systemSnapshotTitle: "What you told us",
  priorityLeverTitle: "Where to start",
  thirtyDayLoopTitle: "Your next 30 days",
  constraintsTitle: "What this works around",
  familyTitle: "Your household",
  quotationLeadIn: "In your own words, this is what you said a good result would look like:",
  /** Shown when an avoidance exists but was not identified. Never a clearance. */
  unresolvedAvoidance:
    "You told us there's something to avoid, and we don't have enough detail to know what it is. This report keeps to general guidance because of that.",
  /** Shown when the customer declined to say. Never read as "nothing". */
  constraintsUndisclosed:
    "You preferred not to say whether there's anything to work around, so this report keeps to general guidance.",
  /** The four beats of the loop. Practical, not clinical. */
  loopBeats: ["Try", "Notice", "Adjust", "Repeat"] as const,
} as const
