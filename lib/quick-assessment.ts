/* ── Quick "Discover Your Food System Type" assessment ───────────────────
 *
 * A very short, client-scored quiz used by the pre-launch waitlist flow. It
 * asks 5 behavioural questions (mapped to the 3 Biotics pillars) and reuses the
 * REAL scoring engine in lib/assessment-scoring.ts so it lands one of the same
 * five profile types as the full assessment — one vocabulary, no new archetypes.
 *
 * Alongside the scored questions it captures a little segmentation context
 * (main goal, biggest food challenge, country, diet). That context is NOT
 * scored — it is stored on the lead and used to personalise the launch report.
 */

import {
  computeOverall,
  getProfile,
  getInsights,
  type SubScores,
  type AssessmentResult,
} from "./assessment-scoring"

/* ── Scored questions ──────────────────────────────────────────────────── */

export type QuickPillar = "prebiotics" | "probiotics" | "postbiotics"

export interface QuickOption {
  label: string
  description: string
  value: number // 0–3, matching the full assessment scale
}

export interface QuickQuestion {
  id: string
  pillar: QuickPillar
  text: string
  options: QuickOption[]
}

/** 5 one-tap questions — 2 prebiotic, 1 probiotic, 2 postbiotic. */
export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "diversity",
    pillar: "prebiotics",
    text: "How many different plant foods do you eat in a typical week?",
    options: [
      { value: 0, label: "1–5 plants", description: "A small set of familiar staples" },
      { value: 1, label: "6–12 plants", description: "Some variety across the week" },
      { value: 2, label: "13–20 plants", description: "A decent spread of categories" },
      { value: 3, label: "21 or more", description: "I actively seek variety every week" },
    ],
  },
  {
    id: "fibre",
    pillar: "prebiotics",
    text: "How often do your meals include fibre-rich whole foods — vegetables, legumes, wholegrains, nuts, or seeds?",
    options: [
      { value: 0, label: "Rarely", description: "Mostly refined or processed foods" },
      { value: 1, label: "Sometimes", description: "A few times a week" },
      { value: 2, label: "Often", description: "Most days have a fibre-rich meal" },
      { value: 3, label: "Almost always", description: "Whole foods are my foundation" },
    ],
  },
  {
    id: "fermented",
    pillar: "probiotics",
    text: "How often do you eat fermented or live foods — yoghurt, kefir, sauerkraut, kimchi, or miso?",
    options: [
      { value: 0, label: "Rarely or never", description: "Not part of my eating" },
      { value: 1, label: "Now and then", description: "Occasionally, not a habit" },
      { value: 2, label: "A few times a week", description: "A regular part of my week" },
      { value: 3, label: "Most days", description: "Live foods feature daily" },
    ],
  },
  {
    id: "rhythm",
    pillar: "postbiotics",
    text: "How consistent is your daily eating rhythm — roughly regular meal times?",
    options: [
      { value: 0, label: "All over the place", description: "Meals happen whenever they happen" },
      { value: 1, label: "Somewhat", description: "Loosely regular on good days" },
      { value: 2, label: "Mostly steady", description: "Similar times most days" },
      { value: 3, label: "Very consistent", description: "A dependable daily rhythm" },
    ],
  },
  {
    id: "recovery",
    pillar: "postbiotics",
    text: "How do you usually feel after meals — energy, digestion, and comfort?",
    options: [
      { value: 0, label: "Often off", description: "Bloated, sluggish, or uncomfortable" },
      { value: 1, label: "Mixed", description: "Some good meals, some not" },
      { value: 2, label: "Usually good", description: "Comfortable and steady most of the time" },
      { value: 3, label: "Consistently great", description: "Light, energised, and settled" },
    ],
  },
]

/* ── Context questions (segmentation — not scored) ─────────────────────── */

export interface QuickContextOption {
  label: string
  value: string
}

export const MAIN_GOAL_OPTIONS: QuickContextOption[] = [
  { value: "energy", label: "More energy" },
  { value: "digestion", label: "Better digestion" },
  { value: "weight", label: "Manage my weight" },
  { value: "immunity", label: "Stronger immunity" },
  { value: "longevity", label: "Long-term health" },
  { value: "mood", label: "Mood & focus" },
]

export const FOOD_CHALLENGE_OPTIONS: QuickContextOption[] = [
  { value: "time", label: "No time to cook" },
  { value: "cravings", label: "Cravings & snacking" },
  { value: "knowledge", label: "Not sure what to eat" },
  { value: "consistency", label: "Staying consistent" },
  { value: "variety", label: "Eating enough variety" },
  { value: "budget", label: "Cost of healthy food" },
]

export const DIET_OPTIONS: QuickContextOption[] = [
  { value: "omnivore", label: "Omnivore" },
  { value: "flexitarian", label: "Flexitarian" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "other", label: "Other" },
]

/* ── Scoring ───────────────────────────────────────────────────────────── */

/** Average a set of 0–3 answers onto a 0–100 pillar score. */
function pillarScore(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((s, v) => s + v, 0) / values.length
  return Math.round((avg / 3) * 100)
}

/** Build a SubScores object from the 5 quick answers. */
export function quickSubScores(answers: Record<string, number>): SubScores {
  const byPillar = (pillar: QuickPillar) =>
    QUICK_QUESTIONS.filter((q) => q.pillar === pillar).map((q) => answers[q.id] ?? 0)

  const prebiotics = pillarScore(byPillar("prebiotics"))
  const probiotics = pillarScore(byPillar("probiotics"))
  const postbiotics = pillarScore(byPillar("postbiotics"))

  return {
    prebiotics,
    probiotics,
    postbiotics,
    feed: prebiotics,
    seed: probiotics,
    heal: postbiotics,
  }
}

/**
 * Compute the full result from the 5 quick answers, reusing the real engine so
 * the returned profile is one of the five canonical types. Shape matches
 * AssessmentResult so downstream code (email, lead write) is consistent.
 */
export function computeQuickResult(answers: Record<string, number>): AssessmentResult {
  const subScores = quickSubScores(answers)
  const overall = computeOverall(subScores)
  const profile = getProfile(overall, subScores)
  const insights = getInsights(subScores)
  const nextActions = insights.slice(0, 3).map((i) => i.action)

  return {
    subScores,
    overall,
    profile,
    insights,
    nextActions,
    completedAt: Date.now(),
  }
}
