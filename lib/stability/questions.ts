import type { StabilityAnswers, SafetyFlags } from "./types"

/* ── Assessment question model ──────────────────────────────────────────── */

export interface SQOption { label: string; value: number }
export interface SQuestion {
  id: keyof StabilityAnswers
  label: string
  help?: string
  options: SQOption[]
}
export interface SQSection {
  id: string
  title: string
  intro?: string
  questions: SQuestion[]
}

const FREQ4: SQOption[] = [
  { label: "Never", value: 0 },
  { label: "Occasionally", value: 1 },
  { label: "Often", value: 2 },
  { label: "Most days", value: 3 },
  { label: "Multiple times a day", value: 4 },
]
const LOWHIGH: SQOption[] = [
  { label: "Low", value: 0 },
  { label: "Some", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "High", value: 3 },
]
const NONEHIGH: SQOption[] = [
  { label: "None / rarely", value: 0 },
  { label: "A little", value: 1 },
  { label: "Moderate", value: 2 },
  { label: "A lot", value: 3 },
]

export const STABILITY_SECTIONS: SQSection[] = [
  {
    id: "bowel",
    title: "Bowel pattern",
    intro: "A picture of your usual routine.",
    questions: [
      { id: "bmFrequency", label: "How many bowel movements do you usually have?", options: [
        { label: "Fewer than every other day", value: 0 },
        { label: "About once a day", value: 1 },
        { label: "Two to three a day", value: 2 },
        { label: "Four or more a day", value: 3 },
      ] },
      { id: "predictable", label: "Are your bowel movements predictable?", options: [
        { label: "Rarely", value: 0 },
        { label: "Sometimes", value: 1 },
        { label: "Usually", value: 2 },
        { label: "Almost always", value: 3 },
      ] },
      { id: "rush", label: "Do you often need to rush to the toilet?", options: FREQ4 },
      { id: "toiletWorry", label: "Do you worry about finding a toilet when you leave home?", options: [
        { label: "Never", value: 0 }, { label: "Occasionally", value: 1 }, { label: "Often", value: 2 }, { label: "Most days", value: 3 }, { label: "Constantly", value: 4 },
      ] },
      { id: "confidenceImpact", label: "Do bowel issues affect your confidence or social life?", options: [
        { label: "Not at all", value: 0 }, { label: "A little", value: 1 }, { label: "Moderately", value: 2 }, { label: "Quite a lot", value: 3 }, { label: "A great deal", value: 4 },
      ] },
    ],
  },
  {
    id: "stool",
    title: "Stool quality",
    intro: "Which best matches your usual stool? (3–4 is typically ideal.)",
    questions: [
      { id: "usualStool", label: "Your usual stool type", options: [
        { label: "1 · Hard separate lumps", value: 1 },
        { label: "2 · Lumpy and firm", value: 2 },
        { label: "3 · Cracked, sausage-like", value: 3 },
        { label: "4 · Smooth, soft sausage", value: 4 },
        { label: "5 · Soft blobs, clear edges", value: 5 },
        { label: "6 · Mushy, ragged edges", value: 6 },
        { label: "7 · Watery, no solid pieces", value: 7 },
      ] },
    ],
  },
  {
    id: "urgency",
    title: "Urgency & control",
    questions: [
      { id: "urgencyFreq", label: "How often do you experience bowel urgency?", options: FREQ4 },
      { id: "accidentFreq", label: "How often do accidents or leakage happen?", options: [
        { label: "Never", value: 0 }, { label: "Rarely", value: 1 }, { label: "Occasionally", value: 2 }, { label: "Often", value: 3 }, { label: "Most days", value: 4 },
      ] },
      { id: "urgencySeverity", label: "When urgency happens, how severe is it?", options: [
        { label: "None", value: 0 }, { label: "Mild", value: 1 }, { label: "Noticeable", value: 2 }, { label: "Strong", value: 3 }, { label: "Very strong", value: 4 }, { label: "Extreme", value: 5 },
      ] },
      { id: "canDelay", label: "Can you usually delay going to the toilet?", options: [
        { label: "Not at all", value: 0 }, { label: "A minute or two", value: 1 }, { label: "Usually", value: 2 }, { label: "Easily", value: 3 },
      ] },
      { id: "urgencyAfterMeals", label: "Does urgency tend to happen after meals?", options: [
        { label: "Never", value: 0 }, { label: "Sometimes", value: 1 }, { label: "Often", value: 2 }, { label: "Almost always", value: 3 },
      ] },
    ],
  },
  {
    id: "food",
    title: "Food system",
    intro: "Roughly how a typical week looks.",
    questions: [
      { id: "vegVariety", label: "Variety of vegetables in a week", options: LOWHIGH },
      { id: "fruitVariety", label: "Variety of fruit in a week", options: LOWHIGH },
      { id: "legumes", label: "Beans, lentils & legumes", options: NONEHIGH },
      { id: "wholeGrains", label: "Whole grains (oats, brown rice…)", options: NONEHIGH },
      { id: "fermented", label: "Fermented foods (yoghurt, kefir, kimchi…)", options: NONEHIGH },
      { id: "ultraProcessed", label: "Ultra-processed foods", options: NONEHIGH },
      { id: "richMeals", label: "Rich / high-fat meals", options: NONEHIGH },
      { id: "sweeteners", label: "Artificial sweeteners", options: NONEHIGH },
      { id: "caffeine", label: "Caffeine (coffee, tea, energy drinks)", options: [
        { label: "None", value: 0 }, { label: "1–2 a day", value: 1 }, { label: "3–4 a day", value: 2 }, { label: "5+ a day", value: 3 },
      ] },
      { id: "alcohol", label: "Alcohol", options: NONEHIGH },
      { id: "dairy", label: "Dairy", options: NONEHIGH },
    ],
  },
  {
    id: "lifestyle",
    title: "Lifestyle",
    questions: [
      { id: "sleepQuality", label: "Sleep quality", options: [
        { label: "Poor", value: 0 }, { label: "Fair", value: 1 }, { label: "Good", value: 2 }, { label: "Great", value: 3 },
      ] },
      { id: "stress", label: "Stress level", options: [
        { label: "Low", value: 0 }, { label: "Mild", value: 1 }, { label: "Moderate", value: 2 }, { label: "High", value: 3 }, { label: "Very high", value: 4 },
      ] },
      { id: "movement", label: "Daily walking / movement", options: [
        { label: "Rarely", value: 0 }, { label: "Some days", value: 1 }, { label: "Most days", value: 2 }, { label: "Every day", value: 3 },
      ] },
      { id: "hydration", label: "Hydration through the day", options: LOWHIGH },
      { id: "recentAntibiotics", label: "Antibiotics in the last ~3 months?", options: [
        { label: "No", value: 0 }, { label: "Yes", value: 1 },
      ] },
      { id: "medicationChanges", label: "Recent medication changes?", options: [
        { label: "No", value: 0 }, { label: "Yes", value: 1 },
      ] },
    ],
  },
]

/* ── Safety screen ──────────────────────────────────────────────────────── */

export const SAFETY_QUESTIONS: { id: keyof SafetyFlags; label: string }[] = [
  { id: "blood", label: "Blood in your stool" },
  { id: "blackStool", label: "Black or tarry stools" },
  { id: "weightLoss", label: "Unexplained weight loss" },
  { id: "severePain", label: "Severe abdominal pain" },
  { id: "suddenChange", label: "A new, sudden change in bowel habits" },
  { id: "persistentDiarrhoea", label: "Persistent diarrhoea" },
  { id: "nightSymptoms", label: "Symptoms that wake you at night" },
  { id: "fever", label: "Fever alongside bowel symptoms" },
]

/* ── Defaults ───────────────────────────────────────────────────────────── */

export const DEFAULT_ANSWERS: StabilityAnswers = {
  bmFrequency: 1, predictable: 1, rush: 1, toiletWorry: 1, confidenceImpact: 1,
  usualStool: 4,
  urgencyFreq: 1, accidentFreq: 0, urgencySeverity: 1, canDelay: 2, urgencyAfterMeals: 1,
  vegVariety: 1, fruitVariety: 1, legumes: 1, wholeGrains: 1, fermented: 1,
  ultraProcessed: 1, richMeals: 1, sweeteners: 0, caffeine: 1, alcohol: 1, dairy: 1,
  sleepQuality: 2, stress: 2, movement: 1, hydration: 1, recentAntibiotics: 0, medicationChanges: 0,
}

export const DEFAULT_FLAGS: SafetyFlags = {
  blood: false, weightLoss: false, severePain: false, suddenChange: false,
  persistentDiarrhoea: false, nightSymptoms: false, fever: false, blackStool: false,
}

/** Total number of scored questions (for the progress bar). */
export const TOTAL_STEPS = STABILITY_SECTIONS.length + 1 // sections + safety screen
