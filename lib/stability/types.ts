/**
 * lib/stability/types.ts — EatoBiotics Stability™ data model.
 *
 * Educational, self-tracking gut-stability tool. NOT a medical device — it does
 * not diagnose, treat, or cure any condition. See components/stability/
 * MedicalDisclaimer.tsx for the user-facing framing.
 */

export type StoolType = 1 | 2 | 3 | 4 | 5 | 6 | 7

export type StabilityBand =
  | "High Instability"
  | "Moderate Instability"
  | "Improving Stability"
  | "Strong Stability"

/* ── Assessment answers ─────────────────────────────────────────────────── */

/** Scored assessment answers. Every field is a small ordinal scale; see
 *  lib/stability/questions.ts for the option labels behind each value. */
export interface StabilityAnswers {
  // A. Bowel pattern
  bmFrequency: number        // 0 fewer than every other day · 1 ~once/day · 2 two–three · 3 four+
  predictable: number        // 0 rarely · 1 sometimes · 2 usually · 3 almost always
  rush: number               // 0 never … 4 multiple times daily
  toiletWorry: number        // 0 never … 4 constantly
  confidenceImpact: number   // 0 not at all … 4 a great deal
  // B. Stool quality
  usualStool: StoolType      // Bristol-style 1–7 (3–4 = ideal)
  // C. Urgency & control
  urgencyFreq: number        // 0 never … 4 multiple times daily
  accidentFreq: number       // 0 never … 4 most days
  urgencySeverity: number    // 0 none … 5 extreme
  canDelay: number           // 0 not at all · 1 a minute or two · 2 usually · 3 easily
  urgencyAfterMeals: number  // 0 never · 1 sometimes · 2 often · 3 almost always
  // D. Food system
  vegVariety: number         // 0 low … 3 high
  fruitVariety: number
  legumes: number
  wholeGrains: number
  fermented: number
  ultraProcessed: number     // higher = more
  richMeals: number
  sweeteners: number
  caffeine: number           // 0 none · 1 1–2 · 2 3–4 · 3 5+ servings
  alcohol: number
  dairy: number
  // E. Lifestyle
  sleepQuality: number       // 0 poor … 3 great
  stress: number             // 0 low … 4 very high
  movement: number           // 0 rarely … 3 daily
  hydration: number          // 0 low … 3 high
  recentAntibiotics: number  // 0 no · 1 yes (last ~3 months)
  medicationChanges: number  // 0 no · 1 yes
}

/** Medical-safety screen — any true value surfaces the red-flag guidance. */
export interface SafetyFlags {
  blood: boolean
  weightLoss: boolean
  severePain: boolean
  suddenChange: boolean
  persistentDiarrhoea: boolean
  nightSymptoms: boolean
  fever: boolean
  blackStool: boolean
}

/* ── Score ──────────────────────────────────────────────────────────────── */

export interface StabilityCategoryScores {
  stoolStability: number   // /25
  urgencyControl: number   // /25
  foodSystem: number       // /20
  lifestyle: number        // /20
  consistency: number      // /10
}

export interface StabilityScore {
  totalScore: number
  band: StabilityBand
  categoryScores: StabilityCategoryScores
  topRiskFactors: string[]
  positiveFactors: string[]
  recommendedNextSteps: string[]
  redFlags: string[]
  createdAt: string
}

/** Stored assessment result (answers + flags + derived score). */
export interface StabilityAssessment {
  answers: StabilityAnswers
  flags: SafetyFlags
  score: StabilityScore
}

/* ── Daily tracker ──────────────────────────────────────────────────────── */

export interface BowelEvent {
  id: string
  time: string            // "HH:MM"
  stoolType: StoolType
  urgency: number         // 0–5
  accident: boolean
  pain: boolean
  bloating: boolean
  notes?: string
}

export interface StabilityDailyLog {
  date: string            // YYYY-MM-DD (one log per day)
  // Morning
  sleepQuality: number    // 1–10
  stress: number          // 1–10
  energy: number          // 1–10
  // Food
  meals?: string
  caffeine: number        // servings
  alcohol: number         // units
  water: number           // glasses
  dairy: boolean
  spicy: boolean
  richFatty: boolean
  sweeteners: boolean
  fibreRich: boolean
  fermented: boolean
  // Bowel events
  events: BowelEvent[]
  // Daily summary
  confidenceLeavingHouse: number // 1–10
  overallStability: number       // 1–10
  notes?: string
  updatedAt: string
}

/* ── Insights & report ──────────────────────────────────────────────────── */

export type InsightTone = "positive" | "watch" | "neutral"

export interface StabilityInsight {
  id: string
  text: string
  tone: InsightTone
}

export interface StabilityReportData {
  rangeDays: number
  logCount: number
  avgStability: number | null
  avgStabilityPrev: number | null
  bestDay: { date: string; stability: number } | null
  worstDay: { date: string; stability: number } | null
  commonStoolType: StoolType | null
  urgencyEpisodes: number
  accidentEpisodes: number
  accidentEpisodesPrev: number
  avgWater: number | null
  avgSleep: number | null
  avgStress: number | null
  insights: StabilityInsight[]
  focusNextMonth: string[]
}
