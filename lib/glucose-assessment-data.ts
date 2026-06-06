// lib/glucose-assessment-data.ts
//
// EatoBetics (glucose) assessment — modelled on the EatoBiotics framework
// (lib/assessment-data.ts), but built around the Glucose Intelligence Lens.
//
// 15 questions across 3 glucose pillars (mirrors the 6/3/6 split):
//   Plate    (q1–q6)   — how meals are built: fibre, protein, carb quality, food order
//   Rhythm   (q7–q9)   — when & how regularly you eat: timing, spacing, late eating
//   Recovery (q10–q15) — the life around meals: movement, energy, sleep, stress
//
// Higher option value = more glucose-supportive. All copy is educational and
// avoids diagnose/treat/cure framing.

export type GlucosePillarKey = "plate" | "rhythm" | "recovery"

export interface GlucoseAnswerOption {
  label: string
  description: string
  value: number // 0–3 (0 = least supportive, 3 = most supportive)
}

export interface GlucoseQuestion {
  id: string // "g1"–"g15"
  pillar: GlucosePillarKey
  sectionTitle: string
  index: number // 1–15
  text: string
  type: "single"
  options: GlucoseAnswerOption[]
}

export interface GlucosePillarMeta {
  key: GlucosePillarKey
  label: string
  blurb: string
  icon: string // lucide icon name
  color: string // CSS variable
  gradient: string
}

export const GLUCOSE_PILLARS: Record<GlucosePillarKey, GlucosePillarMeta> = {
  plate: {
    key: "plate",
    label: "The Plate",
    blurb: "How your meals are built — fibre, protein, carbohydrate quality, and food order.",
    icon: "Salad",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  rhythm: {
    key: "rhythm",
    label: "Rhythm",
    blurb: "When and how regularly you eat — timing, spacing, and late-night meals.",
    icon: "Clock",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  recovery: {
    key: "recovery",
    label: "Recovery",
    blurb: "The life around your meals — movement, energy, sleep, and stress.",
    icon: "Activity",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
}

export const GLUCOSE_SECTION_COLORS: Record<string, string> = {
  "Plate — Building Better Meals": "var(--icon-green)",
  "Plate — Carbohydrate Quality": "var(--icon-lime)",
  "Rhythm — Timing & Spacing": "var(--icon-teal)",
  "Recovery — Movement & Energy": "var(--icon-yellow)",
  "Recovery — Sleep & Stress": "var(--icon-orange)",
}

export const GLUCOSE_QUESTIONS: GlucoseQuestion[] = [
  // ── PLATE (q1–q6) ──────────────────────────────────────────────
  {
    id: "g1",
    pillar: "plate",
    sectionTitle: "Plate — Building Better Meals",
    index: 1,
    text: "How often do your main meals include vegetables, salad, or other high-fibre foods?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Most of my meals are low in vegetables or fibre" },
      { value: 1, label: "Some meals", description: "Fibre shows up now and then, but not consistently" },
      { value: 2, label: "Most meals", description: "I usually have some vegetables or fibre on the plate" },
      { value: 3, label: "Almost every meal", description: "Fibre-rich foods are a deliberate part of most meals" },
    ],
  },
  {
    id: "g2",
    pillar: "plate",
    sectionTitle: "Plate — Building Better Meals",
    index: 2,
    text: "How often do your meals include a source of protein (e.g. eggs, fish, meat, beans, tofu, dairy)?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "Many meals are mostly carbohydrate with little protein" },
      { value: 1, label: "Sometimes", description: "Protein is there occasionally" },
      { value: 2, label: "Most meals", description: "I usually include a protein source" },
      { value: 3, label: "Every meal", description: "Protein anchors nearly every meal I eat" },
    ],
  },
  {
    id: "g3",
    pillar: "plate",
    sectionTitle: "Plate — Building Better Meals",
    index: 3,
    text: "When a meal has starch (rice, potato, bread, pasta), do you tend to eat vegetables or protein first?",
    type: "single",
    options: [
      { value: 0, label: "Never think about it", description: "I eat in no particular order" },
      { value: 1, label: "Occasionally", description: "Sometimes, but not on purpose" },
      { value: 2, label: "Often", description: "I usually start with the vegetables or protein" },
      { value: 3, label: "Almost always", description: "Saving starch for later in the meal is a habit" },
    ],
  },
  {
    id: "g4",
    pillar: "plate",
    sectionTitle: "Plate — Carbohydrate Quality",
    index: 4,
    text: "When you eat carbohydrates, what type are they most often?",
    type: "single",
    options: [
      { value: 0, label: "Mostly refined", description: "White bread, white rice, pastries, sugary foods" },
      { value: 1, label: "A mix, leaning refined", description: "More refined than whole, most days" },
      { value: 2, label: "A mix, leaning whole", description: "Often wholegrain, legumes, or minimally processed" },
      { value: 3, label: "Mostly whole & intact", description: "Wholegrains, legumes, and whole foods are the default" },
    ],
  },
  {
    id: "g5",
    pillar: "plate",
    sectionTitle: "Plate — Carbohydrate Quality",
    index: 5,
    text: "How often do you have sugary drinks, sweets, or refined snacks on their own (not part of a meal)?",
    type: "single",
    options: [
      { value: 0, label: "Several times a day", description: "Sugary drinks or snacks are a regular standalone habit" },
      { value: 1, label: "Most days", description: "At least one most days" },
      { value: 2, label: "A couple of times a week", description: "Occasionally, but not daily" },
      { value: 3, label: "Rarely", description: "I rarely have refined sugar on its own" },
    ],
  },
  {
    id: "g6",
    pillar: "plate",
    sectionTitle: "Plate — Carbohydrate Quality",
    index: 6,
    text: "Overall, how balanced are your typical plates?",
    type: "single",
    options: [
      { value: 0, label: "Mostly fast carbs", description: "Plates are dominated by refined starch or sugar" },
      { value: 1, label: "Carb-heavy", description: "Some balance, but carbohydrate usually leads" },
      { value: 2, label: "Fairly balanced", description: "Fibre, protein, and fat are usually present" },
      { value: 3, label: "Well balanced", description: "Most plates pair fibre, protein, and healthy fat with any carbs" },
    ],
  },

  // ── RHYTHM (q7–q9) ─────────────────────────────────────────────
  {
    id: "g7",
    pillar: "rhythm",
    sectionTitle: "Rhythm — Timing & Spacing",
    index: 7,
    text: "How regular are your meal times from day to day?",
    type: "single",
    options: [
      { value: 0, label: "Very irregular", description: "Meal times are all over the place" },
      { value: 1, label: "Somewhat irregular", description: "They shift a lot depending on the day" },
      { value: 2, label: "Fairly consistent", description: "Roughly the same times most days" },
      { value: 3, label: "Very consistent", description: "I eat at predictable times nearly every day" },
    ],
  },
  {
    id: "g8",
    pillar: "rhythm",
    sectionTitle: "Rhythm — Timing & Spacing",
    index: 8,
    text: "How often do you eat a meal or snack within about two hours of going to bed?",
    type: "single",
    options: [
      { value: 0, label: "Most nights", description: "Late-night eating is a regular pattern" },
      { value: 1, label: "A few nights a week", description: "It happens fairly often" },
      { value: 2, label: "Occasionally", description: "Now and then, not usually" },
      { value: 3, label: "Rarely", description: "I almost always finish eating well before bed" },
    ],
  },
  {
    id: "g9",
    pillar: "rhythm",
    sectionTitle: "Rhythm — Timing & Spacing",
    index: 9,
    text: "How often do you go long stretches without eating and then have a very large meal?",
    type: "single",
    options: [
      { value: 0, label: "Most days", description: "Skip, then overeat is my usual pattern" },
      { value: 1, label: "Often", description: "It happens several times a week" },
      { value: 2, label: "Sometimes", description: "Occasionally, but not the norm" },
      { value: 3, label: "Rarely", description: "I eat fairly evenly across the day" },
    ],
  },

  // ── RECOVERY (q10–q15) ─────────────────────────────────────────
  {
    id: "g10",
    pillar: "recovery",
    sectionTitle: "Recovery — Movement & Energy",
    index: 10,
    text: "How often do you move after meals — even a short walk?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "I usually sit or rest after eating" },
      { value: 1, label: "Sometimes", description: "Occasionally, when it fits" },
      { value: 2, label: "Most days", description: "I often walk or move after a meal" },
      { value: 3, label: "Daily", description: "A post-meal walk is a regular habit" },
    ],
  },
  {
    id: "g11",
    pillar: "recovery",
    sectionTitle: "Recovery — Movement & Energy",
    index: 11,
    text: "How do you usually feel in the one to two hours after eating?",
    type: "single",
    options: [
      { value: 0, label: "Crash or slump", description: "Tired, foggy, or sluggish after most meals" },
      { value: 1, label: "Variable", description: "Sometimes fine, sometimes a dip — hard to predict" },
      { value: 2, label: "Generally steady", description: "Usually comfortable, with the odd dip" },
      { value: 3, label: "Clear and steady", description: "I typically feel stable and focused after eating" },
    ],
  },
  {
    id: "g12",
    pillar: "recovery",
    sectionTitle: "Recovery — Movement & Energy",
    index: 12,
    text: "How often do you get strong cravings or sudden hunger between meals?",
    type: "single",
    options: [
      { value: 0, label: "Very often", description: "Cravings and sudden hunger drive a lot of my eating" },
      { value: 1, label: "Often", description: "Several times a week" },
      { value: 2, label: "Occasionally", description: "Now and then, but manageable" },
      { value: 3, label: "Rarely", description: "I rarely get strong between-meal cravings" },
    ],
  },
  {
    id: "g13",
    pillar: "recovery",
    sectionTitle: "Recovery — Sleep & Stress",
    index: 13,
    text: "How many hours of sleep do you typically get?",
    type: "single",
    options: [
      { value: 0, label: "Under 5 hours", description: "I'm regularly short on sleep" },
      { value: 1, label: "5–6 hours", description: "A bit less than I need most nights" },
      { value: 2, label: "6–7 hours", description: "Usually enough, most nights" },
      { value: 3, label: "7+ hours", description: "I consistently get a full night's sleep" },
    ],
  },
  {
    id: "g14",
    pillar: "recovery",
    sectionTitle: "Recovery — Sleep & Stress",
    index: 14,
    text: "How would you describe your typical stress levels?",
    type: "single",
    options: [
      { value: 0, label: "High most of the time", description: "I feel stretched or under pressure daily" },
      { value: 1, label: "Often elevated", description: "Stress is a frequent part of my week" },
      { value: 2, label: "Manageable", description: "Up and down, but mostly handled" },
      { value: 3, label: "Generally low", description: "I feel calm and in control most days" },
    ],
  },
  {
    id: "g15",
    pillar: "recovery",
    sectionTitle: "Recovery — Sleep & Stress",
    index: 15,
    text: "Overall, how steady, clear, and energised do you feel through the day?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "My energy and focus swing a lot through the day" },
      { value: 1, label: "Sometimes", description: "Some good stretches, some rough ones" },
      { value: 2, label: "Most days", description: "Generally steady, with the occasional off day" },
      { value: 3, label: "Almost always", description: "I feel consistently steady and clear" },
    ],
  },
]
