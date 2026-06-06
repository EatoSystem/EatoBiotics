// lib/glucose-assessment-data.ts
//
// EatoBetics (glucose) assessment — modelled on the EatoBiotics framework
// (lib/assessment-data.ts), built around the Glucose Intelligence Lens.
//
// 1 context question (not scored) + 18 scored questions across 4 pillars:
//   Plate    (p1–p6)  — how meals are built: fibre, protein, carb quality, order
//   Rhythm   (r1–r3)  — when & how regularly you eat: timing, spacing, late meals
//   Strength (s1–s4)  — protein for muscle, resistance training, walking, movement
//   Recovery (e1–e5)  — the life around meals: energy, cravings, sleep, stress
//
// Higher option value = more glucose-supportive. Context answers personalise
// the report (e.g. GLP-1 medication → muscle-preserving focus). All copy is
// educational and avoids diagnose/treat/cure framing.

export type GlucosePillarKey = "plate" | "rhythm" | "strength" | "recovery"

export interface GlucoseAnswerOption {
  label: string
  description: string
  value: number // 0–3 (0 = least supportive, 3 = most supportive)
}

export interface GlucoseQuestion {
  id: string
  pillar: GlucosePillarKey | "context"
  sectionTitle: string
  index: number
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
  strength: {
    key: "strength",
    label: "Strength",
    blurb: "Protein for muscle, resistance training, and how much you walk and move.",
    icon: "Dumbbell",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  recovery: {
    key: "recovery",
    label: "Recovery",
    blurb: "The life around your meals — energy, cravings, sleep, and stress.",
    icon: "HeartPulse",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-lime))",
  },
}

// Scored question IDs per pillar — scoring sums only these.
export const GLUCOSE_PILLAR_IDS: Record<GlucosePillarKey, string[]> = {
  plate: ["p1", "p2", "p3", "p4", "p5", "p6"],
  rhythm: ["r1", "r2", "r3"],
  strength: ["s1", "s2", "s3", "s4"],
  recovery: ["e1", "e2", "e3", "e4", "e5"],
}

export const GLP1_QUESTION_ID = "ctx_glp1"

export const GLUCOSE_SECTION_COLORS: Record<string, string> = {
  "About You": "var(--icon-teal)",
  "Plate — Building Better Meals": "var(--icon-green)",
  "Plate — Carbohydrate Quality": "var(--icon-lime)",
  "Rhythm — Timing & Spacing": "var(--icon-teal)",
  "Strength — Muscle & Movement": "var(--icon-orange)",
  "Recovery — Energy, Sleep & Stress": "var(--icon-green)",
}

export const GLUCOSE_QUESTIONS: GlucoseQuestion[] = [
  // ── CONTEXT (not scored) ───────────────────────────────────────
  {
    id: GLP1_QUESTION_ID,
    pillar: "context",
    sectionTitle: "About You",
    index: 1,
    text: "Are you currently using — or considering — a GLP-1 medication (such as Ozempic, Wegovy, Mounjaro, or Saxenda)?",
    type: "single",
    options: [
      { value: 0, label: "No, not currently", description: "I'm not using or planning to use one" },
      { value: 1, label: "Considering it", description: "I'm thinking about it or in discussion with a clinician" },
      { value: 2, label: "Yes — recently started", description: "I've started within the last few months" },
      { value: 3, label: "Yes — for a while now", description: "I've been using one for several months or longer" },
    ],
  },

  // ── PLATE (p1–p6) ──────────────────────────────────────────────
  {
    id: "p1",
    pillar: "plate",
    sectionTitle: "Plate — Building Better Meals",
    index: 2,
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
    id: "p2",
    pillar: "plate",
    sectionTitle: "Plate — Building Better Meals",
    index: 3,
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
    id: "p3",
    pillar: "plate",
    sectionTitle: "Plate — Building Better Meals",
    index: 4,
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
    id: "p4",
    pillar: "plate",
    sectionTitle: "Plate — Carbohydrate Quality",
    index: 5,
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
    id: "p5",
    pillar: "plate",
    sectionTitle: "Plate — Carbohydrate Quality",
    index: 6,
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
    id: "p6",
    pillar: "plate",
    sectionTitle: "Plate — Carbohydrate Quality",
    index: 7,
    text: "Overall, how balanced are your typical plates?",
    type: "single",
    options: [
      { value: 0, label: "Mostly fast carbs", description: "Plates are dominated by refined starch or sugar" },
      { value: 1, label: "Carb-heavy", description: "Some balance, but carbohydrate usually leads" },
      { value: 2, label: "Fairly balanced", description: "Fibre, protein, and fat are usually present" },
      { value: 3, label: "Well balanced", description: "Most plates pair fibre, protein, and healthy fat with any carbs" },
    ],
  },

  // ── RHYTHM (r1–r3) ─────────────────────────────────────────────
  {
    id: "r1",
    pillar: "rhythm",
    sectionTitle: "Rhythm — Timing & Spacing",
    index: 8,
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
    id: "r2",
    pillar: "rhythm",
    sectionTitle: "Rhythm — Timing & Spacing",
    index: 9,
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
    id: "r3",
    pillar: "rhythm",
    sectionTitle: "Rhythm — Timing & Spacing",
    index: 10,
    text: "How often do you go long stretches without eating and then have a very large meal?",
    type: "single",
    options: [
      { value: 0, label: "Most days", description: "Skip, then overeat is my usual pattern" },
      { value: 1, label: "Often", description: "It happens several times a week" },
      { value: 2, label: "Sometimes", description: "Occasionally, but not the norm" },
      { value: 3, label: "Rarely", description: "I eat fairly evenly across the day" },
    ],
  },

  // ── STRENGTH (s1–s4) ───────────────────────────────────────────
  {
    id: "s1",
    pillar: "strength",
    sectionTitle: "Strength — Muscle & Movement",
    index: 11,
    text: "How often do your meals include enough protein to support muscle and strength (roughly a palm-sized portion — eggs, fish, meat, dairy, beans, or tofu)?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "I don't usually think about protein for muscle" },
      { value: 1, label: "Some meals", description: "A decent portion now and then" },
      { value: 2, label: "Most meals", description: "I usually get a solid protein portion" },
      { value: 3, label: "Every main meal", description: "I deliberately build each meal around enough protein" },
    ],
  },
  {
    id: "s2",
    pillar: "strength",
    sectionTitle: "Strength — Muscle & Movement",
    index: 12,
    text: "How often do you do resistance or strength activity (weights, resistance bands, or bodyweight exercises)?",
    type: "single",
    options: [
      { value: 0, label: "Never", description: "Strength training isn't part of my routine" },
      { value: 1, label: "Occasionally", description: "Every so often, but not regularly" },
      { value: 2, label: "1–2 times a week", description: "I fit in some resistance work weekly" },
      { value: 3, label: "3+ times a week", description: "Strength training is a consistent habit" },
    ],
  },
  {
    id: "s3",
    pillar: "strength",
    sectionTitle: "Strength — Muscle & Movement",
    index: 13,
    text: "On a typical day, how much do you walk or stay on your feet?",
    type: "single",
    options: [
      { value: 0, label: "Very little", description: "Mostly sitting through the day" },
      { value: 1, label: "A bit", description: "Some walking, but not much" },
      { value: 2, label: "A fair amount", description: "I'm up and moving regularly" },
      { value: 3, label: "A lot", description: "I'm active and on my feet most of the day" },
    ],
  },
  {
    id: "s4",
    pillar: "strength",
    sectionTitle: "Strength — Muscle & Movement",
    index: 14,
    text: "How often do you take a short walk after meals?",
    type: "single",
    options: [
      { value: 0, label: "Rarely", description: "I usually sit or rest after eating" },
      { value: 1, label: "Sometimes", description: "Occasionally, when it fits" },
      { value: 2, label: "Most days", description: "I often walk after a meal" },
      { value: 3, label: "Daily", description: "A post-meal walk is a regular habit" },
    ],
  },

  // ── RECOVERY (e1–e5) ───────────────────────────────────────────
  {
    id: "e1",
    pillar: "recovery",
    sectionTitle: "Recovery — Energy, Sleep & Stress",
    index: 15,
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
    id: "e2",
    pillar: "recovery",
    sectionTitle: "Recovery — Energy, Sleep & Stress",
    index: 16,
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
    id: "e3",
    pillar: "recovery",
    sectionTitle: "Recovery — Energy, Sleep & Stress",
    index: 17,
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
    id: "e4",
    pillar: "recovery",
    sectionTitle: "Recovery — Energy, Sleep & Stress",
    index: 18,
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
    id: "e5",
    pillar: "recovery",
    sectionTitle: "Recovery — Energy, Sleep & Stress",
    index: 19,
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
