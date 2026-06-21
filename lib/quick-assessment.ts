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

/* ── The three engines (pillars) ───────────────────────────────────────── */

export type QuickPillar = "prebiotics" | "probiotics" | "postbiotics"

export interface Engine {
  index: number
  label: string   // clinical name, shown in eyebrows/progress/reveal
  verb: string    // brand sub-descriptor (Feed/Seed/Produce)
  color: string
  blurb: string
}

export const ENGINES: Record<QuickPillar, Engine> = {
  prebiotics: {
    index: 1,
    label: "Prebiotics",
    verb: "Feed",
    color: "var(--icon-green)",
    blurb: "The fuel your whole system runs on.",
  },
  probiotics: {
    index: 2,
    label: "Probiotics",
    verb: "Seed",
    color: "var(--icon-teal)",
    blurb: "The living reinforcements you send in.",
  },
  postbiotics: {
    index: 3,
    label: "Postbiotics",
    verb: "Produce",
    color: "var(--icon-orange)",
    blurb: "What your gut gives back to you.",
  },
}

/* ── Scored questions ──────────────────────────────────────────────────── */

export interface QuickOption {
  label: string
  description: string
  value: number // 0–3, matching the full assessment scale
}

export interface QuickQuestion {
  id: string
  pillar: QuickPillar
  text: string
  subtitle: string
  options: QuickOption[]
}

/** 5 one-tap questions — 2 prebiotic, 1 probiotic, 2 postbiotic. */
export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    id: "diversity",
    pillar: "prebiotics",
    text: "Over a normal week, how alive is your plate?",
    subtitle: "Your gut bacteria thrive on the variety of plants you eat.",
    options: [
      { value: 0, label: "Same few staples", description: "A small, familiar rotation" },
      { value: 1, label: "Some variety", description: "A bit of range across the week" },
      { value: 2, label: "A broad range", description: "Lots of different plants and colours" },
      { value: 3, label: "Something new constantly", description: "I actively seek variety" },
    ],
  },
  {
    id: "fibre",
    pillar: "prebiotics",
    text: "How often does your gut get fed real fibre?",
    subtitle: "Plants, beans, whole grains, nuts, seeds — the fuel the whole system runs on.",
    options: [
      { value: 0, label: "Rarely", description: "Mostly refined or processed food" },
      { value: 1, label: "Some days", description: "A few times a week" },
      { value: 2, label: "Most days", description: "A fibre-rich meal most days" },
      { value: 3, label: "Nearly every meal", description: "It's the base of how I eat" },
    ],
  },
  {
    id: "fermented",
    pillar: "probiotics",
    text: "How often do living foods reach your gut?",
    subtitle: "Yoghurt, kefir, kimchi, sauerkraut, miso — they seed new life into your microbiome.",
    options: [
      { value: 0, label: "Almost never", description: "Not part of my routine" },
      { value: 1, label: "Now and then", description: "Occasionally" },
      { value: 2, label: "A few times a week", description: "A regular habit" },
      { value: 3, label: "Most days", description: "Living foods feature daily" },
    ],
  },
  {
    id: "rhythm",
    pillar: "postbiotics",
    text: "What's your daily eating rhythm like?",
    subtitle: "Your system produces more when it runs on a steady tide.",
    options: [
      { value: 0, label: "All over the place", description: "Meals happen whenever they happen" },
      { value: 1, label: "Loose", description: "Roughly regular on good days" },
      { value: 2, label: "Mostly steady", description: "Similar times most days" },
      { value: 3, label: "Like clockwork", description: "A dependable daily rhythm" },
    ],
  },
  {
    id: "recovery",
    pillar: "postbiotics",
    text: "Lately, what is your gut telling you?",
    subtitle: "When it's thriving it pays you back — steady energy, easy digestion, good mood.",
    options: [
      { value: 0, label: "It's struggling", description: "Bloated, sluggish, or off" },
      { value: 1, label: "Mixed signals", description: "Some good days, some not" },
      { value: 2, label: "Mostly good", description: "Comfortable and steady" },
      { value: 3, label: "Thriving", description: "Light and energised" },
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
