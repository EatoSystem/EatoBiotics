import type { ConsultationFoundation, ConsultationQuestion, ConsultationSection } from "./types"

/**
 * The deterministic v1 Consultation bank — reviewed content, not runtime output.
 *
 * ══ NOT ACTIVE ══════════════════════════════════════════════════════════════
 *
 * Nothing here is asked of a paying customer yet. `/assessment/deep` still runs
 * the runtime-AI path. Phase 3B activates this for NEW sessions; Phase 3A
 * exists so that every question below can be read, argued with and rejected
 * first. See lib/consultation/types.ts for the contract and the reasoning.
 *
 * ══ WHAT THE FREE ASSESSMENT ALREADY KNOWS ══════════════════════════════════
 *
 * The free Food System Assessment asks fifteen questions (lib/assessment-data.ts):
 * plant variety (q1–q3), fibre and whole foods (q4–q6), fermented foods
 * (q7–q9), overall approach and rhythm consistency (q10–q12), and how someone
 * feels after eating, how often discomfort shows up, and how stable their
 * energy is (q13–q15).
 *
 * That set went WIDE. Every question below therefore had to answer: what does
 * this add that q1–q15 does not already have? Where it touches the same
 * construct it declares `freeAssessmentOverlap: "deeper"` and has to say, in
 * `deeperBecause`, what NEW information it collects — the bank validator
 * rejects the claim without the explanation. The pattern that keeps recurring
 * is that the free Assessment measures HOW MUCH or HOW OFTEN, and the
 * Consultation needs WHEN, WITH WHAT, and WHAT AROUND IT, because those are
 * what an action in the Report can actually attach to.
 *
 * Notably absent, and absent on purpose: there is no second plant-variety
 * question, no second fermented-foods question and no second "how often does
 * discomfort happen" question anywhere in this bank.
 *
 * ══ WHAT THIS BANK REFUSES TO ASK ═══════════════════════════════════════════
 *
 * No diagnoses. No medication names. No lab values, blood glucose, HbA1c,
 * blood pressure or weight targets. No family medical history. No stool
 * screening. No clinical mental-health or eating-disorder screening. No symptom
 * checklist. See the "Questions considered but rejected" section of
 * docs/phase-3a-consultation-question-bank-review.md for what was weighed and
 * declined, which is as much a part of the design as what is here.
 *
 * ══ FAMILY IS A HOUSEHOLD FOOD SYSTEM ═══════════════════════════════════════
 *
 * Family is NOT this bank with plural pronouns. Individual digestive signals
 * and individual energy shape are `you`-only — asking a household for an
 * aggregate of those produces a number that describes nobody.
 * Family instead gets its own questions about shared meals, mealtime reality,
 * the hardest moment of the day and differing needs, and shares the questions
 * that genuinely are household-level: cooking, shopping, constraints, the shape
 * of the week, recent change and intentions.
 */

/* ── Shared option sets ─────────────────────────────────────────────────────
 * Reused where the same scale genuinely applies. Not a house style: a question
 * that needs its own options has its own options. */

/**
 * The decline option, in the two forms the contract needs.
 *
 * On a `single` question every choice already excludes the others, so marking
 * one `exclusive` says nothing — the bank validator rejects it rather than let
 * a meaningless flag sit in a persisted contract looking load-bearing. On a
 * `multi` question the flag is the whole point: "Prefer not to say" alongside
 * three disclosures is not a declined question.
 */
const PREFER_NOT_TO_SAY = { label: "Prefer not to say", value: "prefer-not-to-say" } as const
const PREFER_NOT_TO_SAY_EXCLUSIVE = { ...PREFER_NOT_TO_SAY, exclusive: true } as const

const SIGNALS: ConsultationQuestion[] = [
  {
    id: "core_signals_post_meal_pattern_v1",
    answerField: "signals.postMealPattern",
    section: "signals",
    type: "single",
    foundations: ["you"],
    text: "When you notice something after eating, what do you tend to notice first?",
    supportText: "This is about what you notice, not about anything being wrong.",
    options: [
      { label: "Fullness or heaviness that lasts a while", value: "fullness" },
      { label: "Bloating or wind", value: "bloating" },
      { label: "Sleepiness or a dip in energy", value: "dip" },
      { label: "A lift, then a dip", value: "lift-then-dip" },
      { label: "Nothing in particular", value: "nothing" },
      PREFER_NOT_TO_SAY,
    ],
    required: true,
    sensitivity: "medium",
    scienceReview: "required",
    intent: "Names the one post-meal signal the Report should build its body-signal section around.",
    whyNeeded:
      "Heaviness, bloating and an energy dip each point at a different practical change; without knowing which one leads, the Report can only describe all three and commit to none.",
    reportTargets: ["systemSnapshot"],
    freeAssessmentOverlap: "deeper",
    freeAssessmentQuestionIds: ["q13"],
    deeperBecause:
      "q13 rates how someone feels after eating on a four-point scale from sluggish to energised. It cannot say WHICH signal they notice, so the report has a rating with no subject. This asks for the subject.",
  },
  {
    id: "core_signals_energy_shape_v1",
    answerField: "signals.energyShape",
    section: "signals",
    type: "single",
    foundations: ["you"],
    text: "Which of these best describes the shape of your energy on a typical day?",
    options: [
      { label: "Steady from morning to evening", value: "steady" },
      { label: "Slow to start, then steady", value: "slow-start" },
      { label: "Fine until an afternoon dip", value: "afternoon-dip" },
      { label: "Up and down through the day", value: "variable" },
      { label: "Hard to predict", value: "unpredictable" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "required",
    intent: "Places the Report's first action at a time of day the reader will actually be there for.",
    whyNeeded:
      "An action with no hour attached is not something anyone can do. Knowing the shape of the day is what turns a suggestion into a specific one.",
    reportTargets: ["priorityLever", "thirtyDayLoop"],
    freeAssessmentOverlap: "deeper",
    freeAssessmentQuestionIds: ["q15"],
    deeperBecause:
      "q15 scores how STABLE energy is. This asks WHEN it changes. A person scoring low on q15 because of a 3pm dip and a person scoring low because mornings are hard need actions at opposite ends of the day, and q15 cannot tell them apart.",
  },
  {
    id: "core_signals_context_v1",
    answerField: "signals.context",
    section: "signals",
    type: "multi",
    foundations: ["you"],
    text: "On the days you notice it most, which of these are usually also true?",
    options: [
      { label: "Meals were rushed or skipped", value: "rushed" },
      { label: "Meals were unusually large or late", value: "large-late" },
      { label: "Stress was high or sleep was short", value: "stress-sleep" },
      { label: "I was eating out, travelling or away from home", value: "away-from-home" },
      { label: "No clear connection", value: "no-connection", exclusive: true },
      PREFER_NOT_TO_SAY_EXCLUSIVE,
    ],
    required: true,
    sensitivity: "medium",
    scienceReview: "required",
    applicableWhen: {
      questionId: "core_signals_post_meal_pattern_v1",
      operator: "notEquals",
      values: ["nothing", "prefer-not-to-say"],
    },
    intent:
      "A customer-reported context that may be a practical place to start because it fits their day, without implying that the context caused the reported signal or that changing it will improve the signal.",
    whyNeeded:
      "This is the single most useful thing the free Assessment never asks. Something that shows up on rushed days and something that shows up when away from home lead to completely different first steps. Asked only of someone who reported noticing something: 'on the days you notice it most' is an incoherent question for a person who has just said there is nothing to notice, or who declined to say — the same exclusion boundary as the settled-days question.",
    reportTargets: ["priorityLever", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_signals_household_mealtime_v1",
    answerField: "signals.householdMealtime",
    section: "signals",
    type: "single",
    foundations: ["family"],
    text: "How do shared meals usually go in your household?",
    options: [
      { label: "Mostly relaxed", value: "relaxed" },
      { label: "Often rushed", value: "rushed" },
      { label: "Usually separate or staggered", value: "staggered" },
      { label: "Often a negotiation about what to eat", value: "negotiated" },
      { label: "It varies a lot", value: "varies" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Establishes what mealtimes are actually like, which sets what a household plan can realistically ask for.",
    whyNeeded:
      "A plan that assumes a calm shared table is unusable in a household where meals are staggered. This is the household equivalent of a signal, and it is about the food system, not about anyone's health.",
    reportTargets: ["familyContext", "systemSnapshot", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_signals_household_hardest_moment_v1",
    answerField: "signals.householdHardestMoment",
    section: "signals",
    type: "single",
    foundations: ["family"],
    text: "Which part of the day is hardest to get food right in your household?",
    options: [
      { label: "Mornings", value: "mornings" },
      { label: "Packed lunches or the middle of the day", value: "midday" },
      { label: "After school or after work", value: "after-school-work" },
      { label: "Evenings", value: "evenings" },
      { label: "Weekends", value: "weekends" },
      { label: "None of them stand out", value: "none-stand-out" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Points the household's first action at the moment that actually needs help.",
    whyNeeded:
      "Households do not need everything fixed; they need the one hard moment made easier. Without this the Report has to guess which one it is.",
    reportTargets: ["priorityLever", "familyContext", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_signals_settled_days_v1",
    answerField: "signals.settledDays",
    section: "signals",
    type: "single",
    foundations: ["you"],
    text: "On the days things feel more settled, what is usually different?",
    options: [
      { label: "Meals were more regular", value: "regular-meals" },
      { label: "Meals were lighter or simpler", value: "lighter-meals" },
      { label: "Less stress, or better sleep", value: "stress-sleep" },
      { label: "More movement", value: "movement" },
      { label: "I can't tell a difference", value: "cannot-tell" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "required",
    applicableWhen: {
      questionId: "core_signals_post_meal_pattern_v1",
      operator: "notEquals",
      values: ["nothing", "prefer-not-to-say"],
    },
    intent: "Lets the reader name their own lever, which the Report can then back rather than replace.",
    whyNeeded:
      "Someone who has already noticed that regular meals help does not need to be told to try regular meals — they need help protecting the thing they found. Asked only of people who reported noticing something, because it is meaningless otherwise.",
    reportTargets: ["priorityLever", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
]

const RHYTHM: ConsultationQuestion[] = [
  {
    id: "core_rhythm_first_meal_v1",
    answerField: "rhythm.firstMeal",
    section: "rhythm",
    type: "single",
    foundations: ["you"],
    text: "On a typical weekday, when do you have your first proper meal?",
    options: [
      { label: "Within an hour of waking", value: "within-hour" },
      { label: "One to three hours after waking", value: "one-to-three" },
      { label: "More than three hours after waking", value: "over-three" },
      { label: "It varies a lot", value: "varies" },
      { label: "I don't usually have a first meal", value: "none" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Anchors the day, so the 30-day loop can attach a change to a real, repeatable moment.",
    whyNeeded:
      "The first meal is the most repeatable one in most weeks, which makes it the cheapest place to put a change. The Report needs to know whether there is one.",
    reportTargets: ["thirtyDayLoop", "foodSystemMap", "foodTools"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_rhythm_longest_gap_v1",
    answerField: "rhythm.longestGap",
    section: "rhythm",
    type: "single",
    foundations: ["you"],
    text: "What is the longest you usually go between eating during the day?",
    supportText: "Gaps are one of the easier things to adjust, so it helps to know the shape of your day.",
    options: [
      { label: "Under four hours", value: "under-4" },
      { label: "Four to six hours", value: "4-to-6" },
      { label: "Six to eight hours", value: "6-to-8" },
      { label: "More than eight hours", value: "over-8" },
      { label: "It varies a lot", value: "varies" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Gives the Report the actual spacing of the day rather than a self-rating of it.",
    whyNeeded:
      "Spacing is the lever most often available when what someone eats is already reasonable, and it is the part of rhythm a reader can change without changing any food.",
    reportTargets: ["thirtyDayLoop", "priorityLever"],
    freeAssessmentOverlap: "deeper",
    freeAssessmentQuestionIds: ["q12"],
    deeperBecause:
      "q12 asks how OFTEN meals get skipped, rushed or eaten late. This asks how long the gap actually is. 'A few times a week' covers both a five-hour gap and a twelve-hour one, and only the second changes what the Report should suggest.",
  },
  {
    id: "core_rhythm_household_shared_meals_v1",
    answerField: "rhythm.householdSharedMeals",
    section: "rhythm",
    type: "single",
    foundations: ["family"],
    text: "How often does your household eat a main meal together?",
    options: [
      { label: "Most days", value: "most-days" },
      { label: "A few times a week", value: "few-times-week" },
      { label: "Mainly at weekends", value: "weekends" },
      { label: "Rarely", value: "rarely" },
      { label: "Never — we eat separately", value: "never" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Establishes whether the household has a shared meal to build on, or whether the plan has to work without one.",
    whyNeeded:
      "Every household food plan either builds on a shared meal or deliberately does not. Guessing wrong makes the whole plan unusable, and this is the household's central structural fact.",
    reportTargets: ["familyContext", "thirtyDayLoop", "systemSnapshot"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_rhythm_week_shape_v1",
    answerField: "rhythm.weekShape",
    section: "rhythm",
    type: "single",
    foundations: ["you", "family"],
    text: "How different are your weekends from your weekdays?",
    familyText: "How different are your household's weekends from its weekdays?",
    options: [
      { label: "Much the same", value: "same" },
      { label: "A little later or looser", value: "looser" },
      { label: "Very different", value: "very-different" },
      { label: "It's the weekdays that are unpredictable", value: "weekdays-unpredictable" },
      { label: "It varies too much to say", value: "varies" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Tells the 30-day loop which days it has to survive.",
    whyNeeded:
      "A four-week plan that only works Monday to Friday fails on day six. The shape of the difference decides whether the plan needs a weekend version.",
    reportTargets: ["thirtyDayLoop", "systemSnapshot"],
    freeAssessmentOverlap: "deeper",
    freeAssessmentQuestionIds: ["q11"],
    deeperBecause:
      "q11 scores how consistent the week is and mentions weekends inside its option text. This asks for the DIRECTION of the difference — including the case where weekdays are the unpredictable half, which q11's scale reads as simply inconsistent.",
  },
  {
    id: "core_rhythm_recent_change_v1",
    answerField: "rhythm.recentChange",
    section: "rhythm",
    type: "multi",
    foundations: ["you", "family"],
    text: "Has anything changed in the last few months that affected how you eat?",
    familyText: "Has anything changed in the last few months that affected how your household eats?",
    options: [
      { label: "A new job, or a change of schedule", value: "schedule" },
      { label: "A house move, or a lot of travel", value: "move-travel" },
      { label: "Caring responsibilities", value: "caring" },
      { label: "A health event, or a period of recovery", value: "health-event" },
      { label: "More or less cooking at home", value: "cooking-change" },
      { label: "Nothing much has changed", value: "none", exclusive: true },
      PREFER_NOT_TO_SAY_EXCLUSIVE,
    ],
    required: true,
    sensitivity: "medium",
    scienceReview: "not-required",
    intent: "Gives the Report the context that explains a pattern, and the only route by which history is asked for at all.",
    whyNeeded:
      "A pattern that started three months ago after a schedule change is a different thing from a lifelong one, and the Report's opening line is wrong if it treats them the same. This is history as context inside Rhythm — there is no Medical History section, and no separate history intake.",
    reportTargets: ["systemSnapshot", "educationModules", "priorityLever"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_rhythm_household_separate_reason_v1",
    answerField: "rhythm.householdSeparateReason",
    section: "rhythm",
    type: "single",
    foundations: ["family"],
    text: "What most often makes eating together difficult?",
    options: [
      { label: "Different schedules", value: "schedules" },
      { label: "Different tastes", value: "tastes" },
      { label: "Space, or the way the kitchen works", value: "space" },
      { label: "We haven't really tried to change it", value: "not-tried" },
      { label: "It works better this way for us", value: "works-better" },
      { label: "Something else", value: "other" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    applicableWhen: {
      questionId: "core_rhythm_household_shared_meals_v1",
      operator: "equals",
      values: ["rarely", "never"],
    },
    intent: "Decides whether the household plan should work towards a shared meal or work well without one.",
    whyNeeded:
      "Only asked of households that rarely eat together. 'It works better this way for us' is a real and complete answer — the Report should then stop trying to assemble everyone at a table and make the separate meals better instead.",
    reportTargets: ["familyContext", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
]

const ENVIRONMENT: ConsultationQuestion[] = [
  {
    id: "core_environment_cooking_frequency_v1",
    answerField: "environment.cookingFrequency",
    section: "environment",
    type: "single",
    foundations: ["you", "family"],
    text: "In a typical week, how many of your meals are cooked at home?",
    familyText: "In a typical week, how many of your household's meals are cooked at home?",
    options: [
      { label: "Almost all of them", value: "almost-all" },
      { label: "Most of them", value: "most" },
      { label: "About half", value: "half" },
      { label: "A few", value: "few" },
      { label: "Hardly any", value: "hardly-any" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Decides whether the Report's food suggestions should be recipes, assemblies or choices made elsewhere.",
    whyNeeded:
      "Recipe-shaped advice given to someone who cooks twice a week is advice they will not use. This is the single biggest determinant of whether the food section of the Report is usable at all.",
    reportTargets: ["foodTools", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_environment_who_prepares_v1",
    answerField: "environment.whoPrepares",
    section: "environment",
    type: "single",
    foundations: ["you", "family"],
    text: "Who usually decides and prepares the food you eat?",
    familyText: "Who usually decides and prepares food in your household?",
    options: [
      { label: "Mostly me", value: "me" },
      { label: "Shared with someone else", value: "shared", familyLabel: "Shared between us" },
      { label: "Mostly someone else", value: "someone-else" },
      { label: "It varies day to day", value: "varies" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Establishes how much of the Report the reader is actually in a position to act on alone.",
    whyNeeded:
      "Telling someone to change what is cooked, when they are not the person cooking, produces a Report about a life they do not have. It also changes what the Report should suggest: a conversation rather than a recipe.",
    reportTargets: ["foodTools", "familyContext", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_environment_planning_v1",
    answerField: "environment.planning",
    section: "environment",
    type: "single",
    foundations: ["you", "family"],
    text: "How does food usually get into the house?",
    familyText: "How does food usually get into your household?",
    options: [
      { label: "A planned shop, with a list", value: "planned" },
      { label: "A regular shop, without much planning", value: "regular" },
      { label: "Frequent top-up trips", value: "top-ups" },
      { label: "Mostly delivery or takeaway", value: "delivery" },
      { label: "Someone else handles it", value: "someone-else" },
      { label: "It varies, or another way", value: "varies" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Finds the point upstream of the plate where a change is cheapest to make.",
    whyNeeded:
      "Most of what someone eats is decided in a shop, not at a meal. A Report that never mentions how food arrives is intervening at the last and hardest possible moment.",
    reportTargets: ["foodTools", "thirtyDayLoop", "priorityLever"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_environment_constraints_v1",
    answerField: "environment.constraints",
    section: "environment",
    type: "multi",
    foundations: ["you", "family"],
    text: "Is there anything your Report needs to work around?",
    familyText: "Is there anything your household's Report needs to work around?",
    supportText: "This is so your Report doesn't suggest something that doesn't suit you.",
    familySupportText: "This is so your Report doesn't suggest something that doesn't suit your household.",
    options: [
      { label: "A food allergy", value: "allergy" },
      { label: "Foods avoided for medical reasons", value: "medical-avoid" },
      { label: "Vegetarian or vegan", value: "vegetarian-vegan" },
      { label: "Religious or cultural requirements", value: "religious-cultural" },
      { label: "A limited food budget", value: "budget" },
      { label: "Very little time to cook", value: "time" },
      { label: "Foods I simply don't like", value: "dislikes", familyLabel: "Foods we simply don't like" },
      { label: "Nothing in particular", value: "none", exclusive: true },
      PREFER_NOT_TO_SAY_EXCLUSIVE,
    ],
    required: true,
    sensitivity: "medium",
    scienceReview: "required",
    intent: "The safety and usability boundary for every food the Report suggests.",
    whyNeeded:
      "This Report recommends foods, so it has to know what not to recommend. Deliberately framed as what to work AROUND rather than as a medical intake: it asks for no diagnosis, no medication and no detail about a condition — only the constraint itself.",
    reportTargets: ["foodTools", "thirtyDayLoop", "familyContext"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_environment_household_differing_needs_v1",
    answerField: "environment.householdDifferingNeeds",
    section: "environment",
    type: "multi",
    foundations: ["family"],
    text: "Do different people in your household need different things from food?",
    options: [
      { label: "Yes — different tastes", value: "tastes" },
      { label: "Yes — different schedules", value: "schedules" },
      { label: "Yes — allergies or intolerances", value: "allergies" },
      { label: "Yes — different amounts, or different life stages", value: "life-stage" },
      { label: "Yes — something else", value: "other" },
      { label: "No — largely the same", value: "same", exclusive: true },
      PREFER_NOT_TO_SAY_EXCLUSIVE,
    ],
    required: true,
    sensitivity: "medium",
    scienceReview: "not-required",
    intent: "Captures the conflicting-needs problem that defines most household food systems.",
    whyNeeded:
      "Cooking for people who need different things is the hardest part of feeding a household, and a plan that ignores it is a plan for a household of identical people. Asks only THAT needs differ and in what broad way — never what anyone's condition is.",
    reportTargets: ["familyContext", "foodTools", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_environment_food_avoidances_v1",
    answerField: "environment.foodAvoidances",
    section: "environment",
    type: "multi",
    foundations: ["you", "family"],
    text: "So your Report doesn't suggest something unsuitable, which of these should it avoid?",
    familyText: "So your household's Report doesn't suggest something unsuitable, which of these should it avoid?",
    supportText:
      "Optional, and this list is not exhaustive. Whatever you choose, always check labels yourself as well.",
    options: [
      { label: "Milk or dairy", value: "dairy" },
      { label: "Eggs", value: "eggs" },
      { label: "Fish or shellfish", value: "fish-shellfish" },
      { label: "Nuts or peanuts", value: "nuts" },
      { label: "Wheat or gluten", value: "wheat-gluten" },
      { label: "Soya", value: "soya" },
      { label: "Sesame", value: "sesame" },
      // Deliberately NOT a resolution. It records that an avoidance exists
      // which this bank has not captured, and `deriveFoodGuidanceConstraints`
      // reads it as unresolved — so the Report holds back specific food
      // suggestions rather than assuming the list above was complete.
      { label: "Something else, not listed here", value: "other" },
      PREFER_NOT_TO_SAY_EXCLUSIVE,
    ],
    required: false,
    sensitivity: "high",
    scienceReview: "required",
    applicableWhen: {
      questionId: "core_environment_constraints_v1",
      operator: "includes",
      values: ["allergy", "medical-avoid"],
    },
    intent: "Turns a declared avoidance into something the food section can mechanically work around.",
    whyNeeded:
      "Only asked of someone who has already said there is an allergy or a medical avoidance, and optional even then. Named for avoidance rather than allergens because a food avoided for medical reasons is frequently not an allergen. Broad categories rather than free text, because a Report generator cannot reliably parse a sentence and a mis-parsed avoidance is the worst failure this product could have — and where the categories do not cover it, the answer says so rather than pretending to.",
    reportTargets: ["foodTools", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
]

const INTENTIONS: ConsultationQuestion[] = [
  {
    id: "core_intentions_primary_focus_v1",
    answerField: "intentions.primaryFocus",
    section: "intentions",
    type: "single",
    foundations: ["you", "family"],
    text: "If your Report could help with one thing first, what would it be?",
    familyText: "If your household's Report could help with one thing first, what would it be?",
    options: [
      { label: "Steadier energy", value: "energy" },
      { label: "More comfortable digestion", value: "digestion" },
      { label: "Clearer focus", value: "focus" },
      { label: "Better sleep and recovery", value: "recovery" },
      { label: "Eating more consistently", value: "consistency" },
      { label: "More variety in what I eat", value: "variety", familyLabel: "More variety in what we eat" },
      { label: "Something else, or I'm not sure yet", value: "unsure" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Chooses which of several defensible priorities the Report actually leads with.",
    whyNeeded:
      "The assessment can identify several things worth working on. Only the reader can say which one they will actually care about in four weeks, and a Report that leads with the wrong one is read once and closed.",
    reportTargets: ["priorityLever", "systemSnapshot", "thirtyDayLoop"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_intentions_barrier_v1",
    answerField: "intentions.barrier",
    section: "intentions",
    type: "single",
    foundations: ["you", "family"],
    text: "What has usually made change hard to keep going?",
    familyText: "What has usually made change hard for your household to keep going?",
    options: [
      { label: "Time", value: "time" },
      { label: "Cost", value: "cost" },
      { label: "Cooking for people with different needs", value: "different-needs" },
      { label: "Not knowing what to do", value: "unclear" },
      { label: "It tends to fade after a week or two", value: "fades" },
      { label: "Something else", value: "other" },
      { label: "Nothing in particular has got in the way", value: "none" },
    ],
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Shapes the 30-day loop around the thing that has actually stopped this person before.",
    whyNeeded:
      "Every plan meets the same barrier the last one did. A plan built for someone short of time and a plan built for someone who runs out of momentum look different, and the free Assessment never asks.",
    reportTargets: ["thirtyDayLoop", "priorityLever", "educationModules"],
    freeAssessmentOverlap: "none",
  },
  {
    id: "core_intentions_success_v1",
    answerField: "intentions.success",
    section: "intentions",
    type: "textarea",
    foundations: ["you", "family"],
    text: "In your own words, what would feel different if this worked?",
    familyText: "In your own words, what would feel different for your household if this worked?",
    maxLength: 600,
    required: false,
    sensitivity: "medium",
    scienceReview: "not-required",
    intent: "The one place the customer speaks in their own voice, for the Report's opening and closing.",
    whyNeeded:
      "A Report that can quote back what someone actually said is a different object from one assembled entirely from multiple choice. Optional, and the only free-text question in the bank — long-form typing is not the personalisation mechanism.",
    reportTargets: ["closingMissionPage", "systemSnapshot"],
    freeAssessmentOverlap: "none",
  },
]

/**
 * The v1 bank, in presentation order.
 *
 * Order is load-bearing in exactly one way: a question's applicability trigger
 * must appear BEFORE it. `validateConsultationBank` enforces that, which is
 * what lets the resolver settle in a single pass rather than iterating to a
 * fixed point.
 */
export const CONSULTATION_QUESTION_BANK: readonly ConsultationQuestion[] = [
  ...SIGNALS,
  ...RHYTHM,
  ...ENVIRONMENT,
  ...INTENTIONS,
]

/* ── Food-safety anchors ────────────────────────────────────────────────────
 * Named here rather than typed as string literals inside the food-guidance
 * helper, so renaming a question or a value cannot leave a safety check
 * silently pointing at nothing. */

/** The question that declares what the Report must work around. */
export const FOOD_CONSTRAINTS_QUESTION_ID = "core_environment_constraints_v1"

/** The adaptive question that tries to resolve WHAT to avoid. */
export const FOOD_AVOIDANCES_QUESTION_ID = "core_environment_food_avoidances_v1"

/**
 * Avoidance answers that record an avoidance without identifying it.
 *
 * `other` says "there is something, and it is not on your list". Treating it as
 * a resolution would be the exact failure this contract exists to prevent: the
 * Report would conclude the categories were exhaustive and recommend freely.
 * `prefer-not-to-say` is a declined disclosure, which is equally unresolved and
 * equally must not be overridden by asking harder.
 */
export const UNRESOLVED_AVOIDANCE_VALUES: readonly string[] = ["other", "prefer-not-to-say"]

/**
 * Constraint values that require a specific food to be identified before the
 * Report may make specific food suggestions.
 *
 * Read from the avoidance question's own applicability rule, so the trigger and
 * the safety check are the same list by construction. A vegetarian, religious,
 * budget or time constraint is NOT here — those shape suggestions, they do not
 * make an unidentified food unsafe.
 */
export const AVOIDANCE_CONSTRAINT_VALUES: readonly string[] =
  CONSULTATION_QUESTION_BANK.find((q) => q.id === FOOD_AVOIDANCES_QUESTION_ID)?.applicableWhen?.values ?? []

/** Every question a foundation could be asked, adaptive ones included. */
export function questionsForFoundation(
  foundation: ConsultationFoundation,
): readonly ConsultationQuestion[] {
  return CONSULTATION_QUESTION_BANK.filter((q) => q.foundations.includes(foundation))
}

/** The always-asked questions for a foundation — no applicability rule. */
export function baselineQuestionsForFoundation(
  foundation: ConsultationFoundation,
): readonly ConsultationQuestion[] {
  return questionsForFoundation(foundation).filter((q) => !q.applicableWhen)
}

/** The conditional questions for a foundation. */
export function adaptiveQuestionsForFoundation(
  foundation: ConsultationFoundation,
): readonly ConsultationQuestion[] {
  return questionsForFoundation(foundation).filter((q) => Boolean(q.applicableWhen))
}

/** One question by id, or `undefined`. */
export function findConsultationQuestion(id: string): ConsultationQuestion | undefined {
  return CONSULTATION_QUESTION_BANK.find((q) => q.id === id)
}

/** The customer-facing wording for a foundation. */
export function questionTextFor(q: ConsultationQuestion, foundation: ConsultationFoundation): string {
  return foundation === "family" && q.familyText ? q.familyText : q.text
}

/** The support line for a foundation, when the question has one. */
export function supportTextFor(
  q: ConsultationQuestion,
  foundation: ConsultationFoundation,
): string | undefined {
  return foundation === "family" && q.familySupportText ? q.familySupportText : q.supportText
}

/** An option's label for a foundation. */
export function optionLabelFor(
  option: { label: string; familyLabel?: string },
  foundation: ConsultationFoundation,
): string {
  return foundation === "family" && option.familyLabel ? option.familyLabel : option.label
}

/** Questions in one section, for a foundation. */
export function sectionQuestions(
  section: ConsultationSection,
  foundation: ConsultationFoundation,
): readonly ConsultationQuestion[] {
  return questionsForFoundation(foundation).filter((q) => q.section === section)
}
