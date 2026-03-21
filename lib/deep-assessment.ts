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

export interface DeepQuestion {
  id: string // "dq1", "dq2", ...
  type: DeepQuestionType
  pillar: DeepPillar
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
    type: "single",
    pillar: "diversity",
    text: "On a typical day, how many different plant foods do you eat across all your meals?",
    eduContext: "Plant diversity is the single strongest predictor of microbial richness.",
    options: [
      { label: "1–2 (same foods most days)", value: "1-2" },
      { label: "3–5 (moderate variety)", value: "3-5" },
      { label: "6–9 (quite varied)", value: "6-9" },
      { label: "10+ (very diverse)", value: "10+" },
    ],
    required: true,
  },
  {
    id: "dq2",
    type: "multi",
    pillar: "adding",
    text: "Which of these fermented foods do you eat at least once a week? Select all that apply.",
    eduContext: "Each different fermented food introduces different strains of beneficial bacteria.",
    options: [
      { label: "Yoghurt (live cultures)", value: "yoghurt" },
      { label: "Kefir", value: "kefir" },
      { label: "Kimchi or sauerkraut", value: "kimchi" },
      { label: "Miso", value: "miso" },
      { label: "Kombucha", value: "kombucha" },
      { label: "None of these regularly", value: "none" },
    ],
    required: true,
  },
  {
    id: "dq3",
    type: "slider",
    pillar: "lifestyle",
    text: "How would you rate your average stress level on a typical work day?",
    eduContext: "Chronic stress directly suppresses digestive enzyme output and gut motility.",
    min: 1,
    max: 10,
    minLabel: "Very low",
    maxLabel: "Extremely high",
    required: true,
  },
  {
    id: "dq4",
    type: "slider",
    pillar: "lifestyle",
    text: "On average, how many hours of sleep do you get per night?",
    eduContext: "Sleep is when your gut repairs its lining and your microbiome resets its rhythm.",
    min: 4,
    max: 10,
    minLabel: "4 hours",
    maxLabel: "10 hours",
    required: true,
  },
  {
    id: "dq5",
    type: "single",
    pillar: "feeding",
    text: "What does your typical breakfast look like?",
    options: [
      { label: "I usually skip breakfast", value: "skip" },
      { label: "Coffee or tea only", value: "coffee-only" },
      { label: "Something quick — toast, cereal, pastry", value: "quick" },
      { label: "A proper meal with protein and fibre", value: "proper" },
    ],
    required: true,
  },
  {
    id: "dq6",
    type: "yesno",
    pillar: "consistency",
    text: "Does your eating pattern change significantly at weekends compared to weekdays?",
    eduContext: "Weekend irregularity is one of the most common disruptors of microbiome circadian rhythm.",
    followUp: {
      condition: "yes",
      question: {
        id: "dq6a",
        type: "single",
        pillar: "consistency",
        text: "What tends to change most at weekends?",
        options: [
          { label: "Meal timing (eating much later or earlier)", value: "timing" },
          { label: "Alcohol consumption increases", value: "alcohol" },
          { label: "More processed / takeaway food", value: "processed" },
          { label: "Skipping meals or eating less", value: "skipping" },
        ],
        required: true,
      },
    },
    required: true,
  },
  {
    id: "dq7",
    type: "multi",
    pillar: "feeling",
    text: "Which of these do you experience regularly (at least once a week)?",
    options: [
      { label: "Bloating or gas after meals", value: "bloating" },
      { label: "Energy crash in the afternoon", value: "energy-crash" },
      { label: "Brain fog or poor concentration", value: "brain-fog" },
      { label: "Irregular digestion (loose or hard stools)", value: "irregular" },
      { label: "Cravings for sugar or carbs", value: "cravings" },
      { label: "None of these regularly", value: "none" },
    ],
    required: true,
  },
  {
    id: "dq8",
    type: "textarea",
    pillar: "feeding",
    text: "Describe what you typically eat for lunch on a workday. Be as specific as you like.",
    eduContext: "Lunch is often the most habitual meal — understanding it reveals a lot about your feeding patterns.",
    required: true,
  },
  {
    id: "dq9",
    type: "single",
    pillar: "diversity",
    text: "How often do you cook from scratch using whole ingredients (vegetables, legumes, grains)?",
    options: [
      { label: "Rarely — mostly ready meals or takeaway", value: "rarely" },
      { label: "1–2 times a week", value: "1-2x" },
      { label: "3–4 times a week", value: "3-4x" },
      { label: "Most days (5+)", value: "most" },
    ],
    required: true,
  },
  {
    id: "dq10",
    type: "single",
    pillar: "lifestyle",
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
]
