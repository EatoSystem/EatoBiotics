/**
 * Canonical meal-analysis contract. This is the shape every analyse surface
 * produces and the mobile app (Phase C) depends on — additions must be
 * additive; never rename/remove/retype an existing field.
 */

export interface AnalysisNutrition {
  calories: number
  protein: number
  carbs: number
  fat: number
  fibre: number
}

/** A single identified food and how confidently it was read (explainability). */
export interface AnalysisFood {
  name: string
  biotic: "prebiotic" | "probiotic" | "postbiotic" | "protein"
  confidence: "high" | "medium" | "low"
}

/** The parsed model result (pre-persistence — no id/created_at yet). */
export interface AnalysisResult {
  meal_name: string
  meal_type: string
  biotics_score: number
  prebiotic_score: number
  probiotic_score: number
  postbiotic_score: number
  quality_diversity: number
  quality_anti_inflammatory: number
  nutrition: AnalysisNutrition
  insight: string
  tags: string[]
  /** The "why" behind the score. Optional for back-compat with older callers. */
  foods?: AnalysisFood[]
}

/** Outcome of runAnalysis: a scored result, an honest refusal, or a failure. */
export type AnalysisOutcome =
  | { status: "ok"; result: AnalysisResult }
  | { status: "unreadable"; message: string }
  | { status: "error" }
