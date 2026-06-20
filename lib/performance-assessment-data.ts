/**
 * Performance add-on — assessment DATA (no React).
 *
 * Single source of truth for the 12 scored questions, the 4 pillar metadata
 * blocks, and the pillar→ids grouping. Also defines the NON-scored context
 * questions (sport, training frequency, session length, level, main goal) which
 * shape recommendations only — they MUST NEVER influence pillar scores.
 *
 * Ids are unchanged from the original inline assessment (e1–e3, b1–b3, r1–r3,
 * p1–p3) so the registry + localStorage stay compatible.
 */

export type PerformancePillarKey = "energy" | "build" | "recovery" | "protection"

export interface PerformanceAnswerOption {
  label: string
  description: string
  value: number
}

export interface PerformanceQuestion {
  id: string
  pillar: PerformancePillarKey
  text: string
  options: PerformanceAnswerOption[]
}

/* ─────────────────────────────────────────────────
   PILLAR METADATA (data only — no React / icons)
───────────────────────────────────────────────── */
export interface PerformancePillarMeta {
  label: string
  system: string
  color: string
  gradient: string
  strengthCopy: string
  opportunityCopy: string
  actionLow: string
  actionHigh: string
}

export const PERFORMANCE_PILLARS: Record<PerformancePillarKey, PerformancePillarMeta> = {
  energy: {
    label: "Energy",
    system: "FUEL",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    strengthCopy: "Your pre-training fuelling and carbohydrate strategy is working.",
    opportunityCopy: "Gaps in your fuelling strategy are limiting output and consistency.",
    actionLow:
      "Start with a planned pre-training meal — oats, banana, or rice 1–2 hours before. Track your energy levels for one week.",
    actionHigh:
      "Maintain your fuelling rhythm. Experiment with intra-session fuel (banana, rice cakes) for sessions over 90 minutes.",
  },
  build: {
    label: "Build",
    system: "DEVELOP",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    strengthCopy: "Your protein timing and variety are supporting muscle repair and development.",
    opportunityCopy: "Post-training protein gaps are slowing your adaptation and recovery.",
    actionLow:
      "Prioritise protein within 30–60 minutes of training. Eggs, Greek yogurt, salmon, or legumes — any quality source counts.",
    actionHigh:
      "Add a second protein-rich meal mid-day. Diversify your sources to include plant proteins (lentils, tofu) alongside animal proteins.",
  },
  recovery: {
    label: "Recovery",
    system: "RESET",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    strengthCopy: "Your recovery nutrition is helping you bounce back quickly and stay consistent.",
    opportunityCopy: "Slow recovery between sessions suggests your reset nutrition needs attention.",
    actionLow:
      "Add anti-inflammatory foods this week — berries with breakfast, oily fish twice, and greens at dinner. Notice any change in how you feel between sessions.",
    actionHigh:
      "Plan your rest-day nutrition deliberately. Prioritise colour, omega-3s, and hydration even when training load is low.",
  },
  protection: {
    label: "Protection",
    system: "PROTECT",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    strengthCopy:
      "Your food system health and immune resilience are keeping you available and consistent.",
    opportunityCopy:
      "Gaps in gut support are increasing your vulnerability to illness, fatigue, and GI discomfort.",
    actionLow:
      "Add one fermented food daily — Greek yogurt at breakfast is the easiest start. Your gut microbiome responds quickly to consistent input.",
    actionHigh:
      "Build variety into your probiotic sources — rotate between yogurt, kefir, kimchi, and sauerkraut across the week.",
  },
}

/** pillar → scored question ids. */
export const PERFORMANCE_PILLAR_IDS: Record<PerformancePillarKey, string[]> = {
  energy: ["e1", "e2", "e3"],
  build: ["b1", "b2", "b3"],
  recovery: ["r1", "r2", "r3"],
  protection: ["p1", "p2", "p3"],
}

/* ─────────────────────────────────────────────────
   SCORED QUESTIONS (12)
───────────────────────────────────────────────── */
export const PERFORMANCE_QUESTIONS: PerformanceQuestion[] = [
  // ── Energy ──────────────────────────────────
  {
    id: "e1",
    pillar: "energy",
    text: "Before a training session or competition, how consistently do you fuel your body?",
    options: [
      { label: "Always", description: "I eat a planned meal or snack 1–3 hours before", value: 3 },
      { label: "Usually", description: "Most of the time, but not always structured", value: 2 },
      { label: "Sometimes", description: "I eat when I remember or have time", value: 1 },
      { label: "Rarely", description: "I often train fasted or with no plan", value: 0 },
    ],
  },
  {
    id: "e2",
    pillar: "energy",
    text: "How often do complex carbohydrates (oats, rice, sweet potato, pasta) feature in your daily meals?",
    options: [
      { label: "Every day", description: "Deliberately — carbs are a foundation of my diet", value: 3 },
      { label: "Most days", description: "I eat them regularly but not every meal", value: 2 },
      { label: "A few times a week", description: "Inconsistent — depends on the day", value: 1 },
      { label: "Rarely", description: "I avoid carbs or don't think about them", value: 0 },
    ],
  },
  {
    id: "e3",
    pillar: "energy",
    text: "How does your energy hold up through a full training session, game, or competition?",
    options: [
      { label: "Strong throughout", description: "I rarely fade — energy is consistent", value: 3 },
      { label: "Mostly good", description: "Sometimes dips in the final third", value: 2 },
      { label: "Noticeable fatigue", description: "I struggle during longer or harder sessions", value: 1 },
      { label: "Crashes regularly", description: "My energy drops significantly during effort", value: 0 },
    ],
  },
  // ── Build ────────────────────────────────────
  {
    id: "b1",
    pillar: "build",
    text: "After training or competition, how consistently do you consume protein within 2 hours?",
    options: [
      { label: "Always", description: "It's a non-negotiable part of my routine", value: 3 },
      { label: "Usually", description: "I try, but don't always manage it", value: 2 },
      { label: "Sometimes", description: "Only if I'm hungry or it's convenient", value: 1 },
      { label: "Rarely", description: "I don't think about post-training nutrition", value: 0 },
    ],
  },
  {
    id: "b2",
    pillar: "build",
    text: "How varied are your protein sources across a typical week?",
    options: [
      { label: "Very varied", description: "Eggs, fish, meat, legumes, and dairy all feature", value: 3 },
      { label: "Reasonably varied", description: "3–4 different sources across the week", value: 2 },
      { label: "Limited", description: "I rely on 1–2 sources most of the time", value: 1 },
      { label: "Very limited", description: "I don't focus on protein diversity", value: 0 },
    ],
  },
  {
    id: "b3",
    pillar: "build",
    text: "Between training sessions, how intentional are you about supporting muscle repair through food?",
    options: [
      { label: "Very intentional", description: "I plan meals around recovery and rebuild", value: 3 },
      { label: "Somewhat", description: "I try when I remember to", value: 2 },
      { label: "Not very", description: "I eat normally without thinking about muscle repair", value: 1 },
      { label: "Not at all", description: "I hadn't considered this aspect", value: 0 },
    ],
  },
  // ── Recovery ─────────────────────────────────
  {
    id: "r1",
    pillar: "recovery",
    text: "How often do you include anti-inflammatory foods (berries, oily fish, leafy greens, turmeric) in your weekly meals?",
    options: [
      { label: "Daily", description: "They're a regular, intentional part of my plate", value: 3 },
      { label: "Several times a week", description: "I include them consistently but not daily", value: 2 },
      { label: "Occasionally", description: "Once or twice a week at most", value: 1 },
      { label: "Rarely or never", description: "I don't focus on these foods", value: 0 },
    ],
  },
  {
    id: "r2",
    pillar: "recovery",
    text: "After a hard training session or competition, how long before you feel fully ready to go again?",
    options: [
      { label: "24 hours or less", description: "I recover quickly and feel ready fast", value: 3 },
      { label: "24–48 hours", description: "Standard recovery — I'm ready by the next day", value: 2 },
      { label: "48–72 hours", description: "Recovery takes longer than I'd like", value: 1 },
      { label: "More than 72 hours", description: "Recovery is a persistent challenge for me", value: 0 },
    ],
  },
  {
    id: "r3",
    pillar: "recovery",
    text: "On rest days, how intentional are you about your nutrition?",
    options: [
      { label: "Very intentional", description: "I eat for recovery, not just convenience", value: 3 },
      { label: "Somewhat", description: "More relaxed, but I still eat reasonably well", value: 2 },
      { label: "Not really", description: "Rest days are when I eat whatever I want", value: 1 },
      { label: "Never considered it", description: "I hadn't thought about rest day nutrition", value: 0 },
    ],
  },
  // ── Protection ───────────────────────────────
  {
    id: "p1",
    pillar: "protection",
    text: "How often does illness, persistent fatigue, or injury interrupt your training?",
    options: [
      { label: "Rarely", description: "I stay available and consistent across seasons", value: 3 },
      { label: "Occasionally", description: "A few times per season", value: 2 },
      { label: "Regularly", description: "It's a pattern I've noticed over time", value: 1 },
      { label: "Frequently", description: "I struggle to string together consistent blocks", value: 0 },
    ],
  },
  {
    id: "p2",
    pillar: "protection",
    text: "How often do you include fermented or probiotic-rich foods (yogurt, kefir, kimchi, sauerkraut) in your diet?",
    options: [
      { label: "Daily", description: "A fermented food is part of my daily routine", value: 3 },
      { label: "Several times a week", description: "I include them regularly but not every day", value: 2 },
      { label: "Occasionally", description: "Now and then, without much intention", value: 1 },
      { label: "Rarely or never", description: "I don't typically eat fermented foods", value: 0 },
    ],
  },
  {
    id: "p3",
    pillar: "protection",
    text: "How does your gut feel during and after high-intensity training or competition?",
    options: [
      { label: "Great", description: "No GI issues at all — my gut is solid under pressure", value: 3 },
      { label: "Mostly fine", description: "Occasional discomfort but nothing major", value: 2 },
      { label: "Regular discomfort", description: "Bloating, cramps, or discomfort is common", value: 1 },
      { label: "Persistent problem", description: "GI issues are a significant challenge for me", value: 0 },
    ],
  },
]

/* ─────────────────────────────────────────────────
   CONTEXT QUESTIONS (NON-scored — shape recommendations only)
───────────────────────────────────────────────── */
export type PerformanceContextKey =
  | "sport"
  | "trainingFrequency"
  | "sessionDuration"
  | "level"
  | "mainGoal"

export interface PerformanceContextOption {
  label: string
  /** Stable machine value used by recommendation logic. */
  value: string
  description?: string
}

export interface PerformanceContextQuestion {
  id: PerformanceContextKey
  text: string
  helper?: string
  options: PerformanceContextOption[]
}

export const PERFORMANCE_CONTEXT_QUESTIONS: PerformanceContextQuestion[] = [
  {
    id: "sport",
    text: "What's your primary sport or training focus?",
    helper: "We tailor recommendations to the demands of your sport.",
    options: [
      { label: "Football / Soccer", value: "football" },
      { label: "Rugby", value: "rugby" },
      { label: "Running / Endurance", value: "endurance" },
      { label: "Cycling", value: "cycling" },
      { label: "Swimming", value: "swimming" },
      { label: "CrossFit / Strength", value: "strength" },
      { label: "GAA / Gaelic Games", value: "gaa" },
      { label: "Basketball", value: "basketball" },
      { label: "Tennis / Racket Sports", value: "racket" },
      { label: "General Fitness", value: "general" },
    ],
  },
  {
    id: "trainingFrequency",
    text: "How often do you train in a typical week?",
    options: [
      { label: "1–2 sessions", value: "1-2" },
      { label: "3–4 sessions", value: "3-4" },
      { label: "5–6 sessions", value: "5-6" },
      { label: "7+ sessions", value: "7+" },
    ],
  },
  {
    id: "sessionDuration",
    text: "How long is a typical session?",
    options: [
      { label: "Under 45 minutes", value: "<45" },
      { label: "45–90 minutes", value: "45-90" },
      { label: "90 minutes – 2 hours", value: "90-120" },
      { label: "Over 2 hours", value: ">120" },
    ],
  },
  {
    id: "level",
    text: "How would you describe your level?",
    options: [
      { label: "Beginner", value: "beginner", description: "New to structured training" },
      { label: "Recreational", value: "recreational", description: "Fitness-focused, train when you can" },
      { label: "Competitive", value: "competitive", description: "Train and compete regularly" },
      { label: "Elite", value: "elite", description: "Full-time / highest level athlete" },
    ],
  },
  {
    id: "mainGoal",
    text: "What's your main goal right now?",
    helper: "This shapes which actions we prioritise.",
    options: [
      { label: "Endurance", value: "endurance", description: "Sustain output for longer" },
      { label: "Strength", value: "strength", description: "Build power and muscle" },
      { label: "Recovery", value: "recovery", description: "Bounce back faster between sessions" },
      { label: "Body composition", value: "body_composition", description: "Lean up / change shape" },
      { label: "Match-day performance", value: "match_day", description: "Peak when it counts" },
    ],
  },
]

/** A captured set of context answers (all optional — context is non-scored). */
export type PerformanceContext = Partial<Record<PerformanceContextKey, string>>
