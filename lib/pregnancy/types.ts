/**
 * lib/pregnancy/types.ts — EatoBiotics Pregnancy Food System data model.
 *
 * A food-first, NON-diagnostic assessment of general-wellbeing food *patterns*
 * during pregnancy. It is NOT a medical device, screening, or diagnosis, and it
 * does not give trimester-specific medical/nutrient advice. Every surface points
 * pregnancy, birth, baby-feeding or health concerns to a qualified professional.
 * See components/systems/system-disclaimer.tsx + the red-flag box for framing.
 */

export type PregnancyBand =
  | "Building Foundations"
  | "Finding Rhythm"
  | "Well Nourished"
  | "Strong & Steady"

/* ── Assessment answers (all food / lifestyle behaviours — no symptoms) ───── */

/** Scored answers. Every field is a small ordinal scale; see
 *  lib/pregnancy/questions.ts for the option labels behind each value. */
export interface PregnancyAnswers {
  // A. Plant diversity (0 low … 3 high)
  vegVariety: number
  fruitVariety: number
  legumes: number
  wholeGrains: number
  fermented: number
  // B. Meal rhythm
  regularMeals: number   // 0 rarely … 3 almost always
  breakfast: number      // 0 rarely … 3 every day
  comfortEating: number  // 0 hard to eat … 3 can keep gentle foods going
  // C. Hydration
  hydration: number      // 0 low … 3 high
  // D. Nourishing variety
  proteinFoods: number   // 0 rarely … 3 most meals
  calciumFoods: number   // 0 rarely … 3 daily (dairy or fortified alternatives)
  varietyGroups: number  // 0 rarely … 3 most plates (different food groups together)
  // E. Gentle moderation (higher = more, i.e. worse)
  ultraProcessed: number // 0 none … 3 a lot
  sweetDrinks: number    // 0 none … 3 a lot
  caffeine: number       // 0 none · 1 1–2 · 2 3–4 · 3 5+ servings
}

/** Safety screen — any true value surfaces the red-flag → professional box.
 *  These NEVER produce a diagnosis; they only signpost to a professional. */
export interface PregnancySafetyFlags {
  bleeding: boolean
  severePain: boolean
  severeVomiting: boolean
  reducedMovements: boolean
  severeHeadacheVision: boolean
  fever: boolean
}

/* ── Score ──────────────────────────────────────────────────────────────── */

export interface PregnancyCategoryScores {
  plantDiversity: number    // /25
  mealRhythm: number        // /20
  hydration: number         // /15
  nourishingVariety: number // /20
  gentleModeration: number  // /20
}

export interface PregnancyScore {
  totalScore: number
  band: PregnancyBand
  categoryScores: PregnancyCategoryScores
  priorityFactors: string[]
  positiveFactors: string[]
  recommendedNextSteps: string[]
  redFlags: string[]
  createdAt: string
}

/** Stored assessment result (answers + flags + derived score). */
export interface PregnancyAssessment {
  answers: PregnancyAnswers
  flags: PregnancySafetyFlags
  score: PregnancyScore
}
