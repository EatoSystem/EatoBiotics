import type { PregnancyAnswers, PregnancySafetyFlags } from "./types"

/* ── Assessment question model ──────────────────────────────────────────── */

export interface PQOption { label: string; value: number }
export interface PQuestion {
  id: keyof PregnancyAnswers
  label: string
  help?: string
  options: PQOption[]
}
export interface PQSection {
  id: string
  title: string
  intro?: string
  questions: PQuestion[]
}

const LOWHIGH: PQOption[] = [
  { label: "Low", value: 0 },
  { label: "Some", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "High", value: 3 },
]
const NONEHIGH: PQOption[] = [
  { label: "None / rarely", value: 0 },
  { label: "A little", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "A lot", value: 3 },
]
const RARELY_ALWAYS: PQOption[] = [
  { label: "Rarely", value: 0 },
  { label: "Sometimes", value: 1 },
  { label: "Usually", value: 2 },
  { label: "Almost always", value: 3 },
]

export const PREGNANCY_SECTIONS: PQSection[] = [
  {
    id: "plants",
    title: "Plant variety",
    intro: "Roughly how a typical week looks — no pressure to be perfect.",
    questions: [
      { id: "vegVariety", label: "Variety of vegetables in a week", options: LOWHIGH },
      { id: "fruitVariety", label: "Variety of fruit in a week", options: LOWHIGH },
      { id: "legumes", label: "Beans, lentils & legumes", options: NONEHIGH },
      { id: "wholeGrains", label: "Whole grains (oats, brown rice…)", options: NONEHIGH },
      { id: "fermented", label: "Fermented foods (yoghurt, kefir…)", options: NONEHIGH },
    ],
  },
  {
    id: "rhythm",
    title: "Meal rhythm",
    intro: "How steady your eating pattern feels day to day.",
    questions: [
      { id: "regularMeals", label: "Do you eat regular meals through the day?", options: RARELY_ALWAYS },
      { id: "breakfast", label: "Do you usually have something in the morning?", options: [
        { label: "Rarely", value: 0 }, { label: "Some days", value: 1 }, { label: "Most days", value: 2 }, { label: "Every day", value: 3 },
      ] },
      { id: "comfortEating", label: "When you feel off or queasy, can you still eat gentle foods regularly?", help: "Nausea is common — this is about keeping something gentle going, not forcing food.", options: [
        { label: "Very hard", value: 0 }, { label: "Sometimes", value: 1 }, { label: "Usually", value: 2 }, { label: "Yes, mostly", value: 3 },
      ] },
    ],
  },
  {
    id: "hydration",
    title: "Hydration",
    questions: [
      { id: "hydration", label: "Fluids (mostly water) through the day", options: LOWHIGH },
    ],
  },
  {
    id: "nourishing",
    title: "Nourishing variety",
    intro: "Variety across food groups supports general wellbeing.",
    questions: [
      { id: "proteinFoods", label: "Protein-containing foods (eggs, beans, fish, meat, tofu…)", options: [
        { label: "Rarely", value: 0 }, { label: "Some meals", value: 1 }, { label: "Most meals", value: 2 }, { label: "Every main meal", value: 3 },
      ] },
      { id: "calciumFoods", label: "Dairy or fortified alternatives (milk, yoghurt, fortified plant drinks)", options: RARELY_ALWAYS },
      { id: "varietyGroups", label: "Do your plates usually mix a few different food groups?", options: RARELY_ALWAYS },
    ],
  },
  {
    id: "moderation",
    title: "Gentle moderation",
    intro: "No food is off-limits here — this is just a gentle picture of balance.",
    questions: [
      { id: "ultraProcessed", label: "Ultra-processed foods", options: NONEHIGH },
      { id: "sweetDrinks", label: "Sugary / sweetened drinks", options: NONEHIGH },
      { id: "caffeine", label: "Caffeine (coffee, tea, cola, energy drinks)", options: [
        { label: "None", value: 0 }, { label: "1–2 a day", value: 1 }, { label: "3–4 a day", value: 2 }, { label: "5+ a day", value: 3 },
      ] },
    ],
  },
]

/* ── Safety screen — signposts to a professional; never a diagnosis ──────── */

export const PREGNANCY_SAFETY_QUESTIONS: { id: keyof PregnancySafetyFlags; label: string }[] = [
  { id: "bleeding", label: "Vaginal bleeding" },
  { id: "severePain", label: "Severe or persistent tummy pain" },
  { id: "severeVomiting", label: "Severe vomiting, or unable to keep fluids down" },
  { id: "reducedMovements", label: "A noticeable reduction in your baby's movements" },
  { id: "severeHeadacheVision", label: "A severe headache, vision changes, or sudden swelling" },
  { id: "fever", label: "A high temperature or feeling unwell with a fever" },
]

/* ── Defaults ───────────────────────────────────────────────────────────── */

export const DEFAULT_PREGNANCY_ANSWERS: PregnancyAnswers = {
  vegVariety: 1, fruitVariety: 1, legumes: 1, wholeGrains: 1, fermented: 1,
  regularMeals: 2, breakfast: 2, comfortEating: 2,
  hydration: 1,
  proteinFoods: 1, calciumFoods: 1, varietyGroups: 2,
  ultraProcessed: 1, sweetDrinks: 1, caffeine: 1,
}

export const DEFAULT_PREGNANCY_FLAGS: PregnancySafetyFlags = {
  bleeding: false, severePain: false, severeVomiting: false,
  reducedMovements: false, severeHeadacheVision: false, fever: false,
}

/** Sections + the safety screen (for the progress bar). */
export const TOTAL_PREGNANCY_STEPS = PREGNANCY_SECTIONS.length + 1

/* ── Answer-completeness validation (pure, unit-testable) ───────────────────
 * A user must explicitly answer every scored question before a score is shown —
 * no score may be derived from DEFAULT_PREGNANCY_ANSWERS alone. */

export function requiredPregnancyQuestionIds(): (keyof PregnancyAnswers)[] {
  return PREGNANCY_SECTIONS.flatMap((s) => s.questions.map((q) => q.id))
}

export function allPregnancyAnswered(answeredIds: string[]): boolean {
  const answered = new Set(answeredIds)
  return requiredPregnancyQuestionIds().every((id) => answered.has(id))
}
