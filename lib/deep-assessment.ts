// ── Deep Assessment Types ──────────────────────────────────────────────────
// Used by: app/api/generate-deep-questions, components/assessment/deep/*

export type DeepQuestionType = "single" | "multi" | "slider" | "textarea" | "yesno"

export type DeepPillar =
  | "diversity"
  | "feeding"
  | "adding"
  | "consistency"
  | "feeling"
  | "lifestyle"

export type DeepSection = "symptoms" | "history" | "lifestyle" | "goals"

export interface DeepQuestion {
  id: string // "dq1", "dq2", ...
  type: DeepQuestionType
  pillar: DeepPillar
  /** Which consultation section this question belongs to — optional for backwards compat */
  section?: DeepSection
  text: string
  /** 1-sentence why this matters — shown below question text */
  eduContext?: string
  /** For single / multi */
  options?: Array<{ label: string; value: string }>
  /** For slider */
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  /** For yesno — injects a follow-up into the queue if condition matches */
  followUp?: { condition: "yes" | "no"; question: DeepQuestion }
  required: boolean
}

export type DeepAnswer = number | string | string[]
// number  = slider value OR single option index (as number string → keep as string)
// string  = single option value, yesno ("yes"|"no"), or textarea text
// string[] = multi-select values or rank order

export type DeepAnswers = Record<string, DeepAnswer>

// ── Fallback question bank ─────────────────────────────────────────────────
// Used when Claude question generation fails (after retry).
// Generic enough to work for any tier / score profile.

export const FALLBACK_DEEP_QUESTIONS: DeepQuestion[] = [
  {
    id: "dq1",
    type: "multi",
    pillar: "feeling",
    section: "symptoms",
    text: "Which of these do you experience regularly (at least once a week)?",
    eduContext: "These symptoms are your gut's way of communicating — each one points to a specific imbalance.",
    options: [
      { label: "Bloating or gas after meals", value: "bloating" },
      { label: "Energy crash in the afternoon", value: "energy-crash" },
      { label: "Brain fog or poor concentration", value: "brain-fog" },
      { label: "Irregular digestion (loose or hard stools)", value: "irregular" },
      { label: "Skin issues (acne, eczema, dullness)", value: "skin" },
      { label: "None of these regularly", value: "none" },
    ],
    required: true,
  },
  {
    id: "dq2",
    type: "slider",
    pillar: "feeling",
    section: "symptoms",
    text: "How would you rate your overall energy levels on a typical day?",
    eduContext: "Food system health is one of the biggest drivers of sustained daily energy.",
    min: 1,
    max: 10,
    minLabel: "Exhausted",
    maxLabel: "Full of energy",
    required: true,
  },
  {
    id: "dq3",
    type: "yesno",
    pillar: "feeling",
    section: "symptoms",
    text: "Do you notice your digestion or energy change significantly depending on what you eat?",
    eduContext: "Food sensitivity patterns are a key indicator of microbiome composition.",
    followUp: {
      condition: "yes",
      question: {
        id: "dq3a",
        type: "single",
        pillar: "feeling",
        section: "symptoms",
        text: "What tends to trigger the most noticeable reaction?",
        options: [
          { label: "Dairy products", value: "dairy" },
          { label: "Wheat or gluten-containing foods", value: "gluten" },
          { label: "High-fat or fried foods", value: "fat" },
          { label: "High-sugar foods or alcohol", value: "sugar" },
        ],
        required: true,
      },
    },
    required: true,
  },
  {
    id: "dq4",
    type: "yesno",
    pillar: "lifestyle",
    section: "history",
    text: "Have you taken antibiotics at any point in the last two years?",
    eduContext: "Antibiotics can reduce microbial diversity significantly — rebuilding after a course is one of the highest-impact gut interventions.",
    required: true,
  },
  {
    id: "dq5",
    type: "single",
    pillar: "consistency",
    section: "history",
    text: "How would you describe your relationship with food over the past few years?",
    options: [
      { label: "Fairly consistent — I eat roughly the same way", value: "consistent" },
      { label: "Some big changes — diet has shifted a lot", value: "shifting" },
      { label: "Lots of starts and stops — trying different approaches", value: "sporadic" },
      { label: "I've been deliberately improving my diet recently", value: "improving" },
    ],
    required: true,
  },
  {
    id: "dq6",
    type: "multi",
    pillar: "lifestyle",
    section: "history",
    text: "Have any of the following affected your food system health in the past? Select all that apply.",
    options: [
      { label: "A period of high or chronic stress", value: "stress" },
      { label: "A gut infection or food poisoning", value: "infection" },
      { label: "Significant weight change", value: "weight" },
      { label: "A major change in diet or location", value: "diet-change" },
      { label: "None of these", value: "none" },
    ],
    required: true,
  },
  {
    id: "dq7",
    type: "slider",
    pillar: "lifestyle",
    section: "lifestyle",
    text: "How would you rate your average stress level on a typical work day?",
    eduContext: "Chronic stress directly suppresses digestive enzyme output and gut motility.",
    min: 1,
    max: 10,
    minLabel: "Very low",
    maxLabel: "Extremely high",
    required: true,
  },
  {
    id: "dq8",
    type: "slider",
    pillar: "lifestyle",
    section: "lifestyle",
    text: "On average, how many hours of sleep do you get per night?",
    eduContext: "Sleep is when your gut repairs its lining and your microbiome resets its rhythm.",
    min: 4,
    max: 10,
    minLabel: "4 hours",
    maxLabel: "10 hours",
    required: true,
  },
  {
    id: "dq9",
    type: "single",
    pillar: "lifestyle",
    section: "lifestyle",
    text: "How often do you do moderate physical activity (walking, cycling, swimming, yoga, etc.)?",
    eduContext: "Regular movement directly increases microbiome diversity by promoting gut motility.",
    options: [
      { label: "Rarely or never", value: "never" },
      { label: "1–2 times a week", value: "1-2x" },
      { label: "3–4 times a week", value: "3-4x" },
      { label: "Daily", value: "daily" },
    ],
    required: true,
  },
  {
    id: "dq10",
    type: "single",
    pillar: "feeling",
    section: "goals",
    text: "What is your single most important goal for your gut and overall health right now?",
    options: [
      { label: "More consistent energy throughout the day", value: "energy" },
      { label: "Better digestion — less bloating, more regularity", value: "digestion" },
      { label: "Stronger immunity and fewer infections", value: "immunity" },
      { label: "Clearer skin or reduced inflammation", value: "skin" },
    ],
    required: true,
  },
  {
    id: "dq11",
    type: "textarea",
    pillar: "feeding",
    section: "goals",
    text: "In your own words, what does success look like for you in 3 months? What would feel different?",
    eduContext: "Your goal shapes the entire protocol we build for you.",
    required: true,
  },
]
