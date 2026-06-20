/**
 * Shared, dependency-free contracts for the EatoBiotics assessment suite.
 *
 * These types are pure (no React / localStorage / Supabase imports) so the
 * combined-result builder and disclaimers stay unit-testable and SSR-safe.
 *
 * The two foundations (You, Family) and the four add-ons (Mind, Glucose,
 * Stability, Performance) all normalise into the same summary shape; a final
 * report always = one foundation + an optional add-on.
 */

export type FoundationKey = "you" | "family"
export type AddonKey = "mind" | "glucose" | "stability" | "performance"
export type AssessmentKey = FoundationKey | AddonKey

/** How much history backs the score — surfaced on results so a one-off feels honest. */
export type ConfidenceLabel = "Snapshot" | "Pattern" | "Tracked"

/** One named sub-score, 0–100. */
export interface SubScore {
  key: string
  label: string
  score: number
}

/**
 * Minimal summary shape the combined-result builder consumes. The registry's
 * `AssessmentSummary` (`lib/assessment/registry.ts`) structurally satisfies this,
 * so the builder needs no localStorage dependency.
 */
export interface AssessmentSummaryLike {
  key: AssessmentKey
  kind: "foundation" | "addon"
  label: string
  scoreLabel: string
  score: number
  bandLabel: string
  bandDescription?: string
  strengths: string[]
  priorities: string[]
  details?: { label: string; text: string }[]
  sevenDay: string[]
  thirtyDay?: string[]
  /** Stability surfaces matched red-flag labels here; absent for everything else. */
  safetyFlags?: string[]
  /** Per-pillar numbers when the source provides them. */
  subscores?: SubScore[]
}

export interface FoundationResult {
  foundationType: FoundationKey
  score: number
  band: string
  subscores: SubScore[]
  strongestArea: string
  biggestOpportunity: string
  weeklyAction: string
  confidenceLabel: ConfidenceLabel
  educationalSummary: string
}

export interface AddonResult {
  addonType: AddonKey
  score: number
  band: string
  subscores: SubScore[]
  strongestArea: string
  biggestOpportunity: string
  weeklyAction: string
  /** Present (and prioritised) only when the add-on detected safety red flags. */
  safetyFlags?: string[]
  educationalSummary: string
}

export interface CombinedResult {
  reportTitle: string
  foundationResult: FoundationResult
  /** Null for a foundation-only report (no add-on layered on yet). */
  addonResult: AddonResult | null
  combinedSummary: string
  foundationInfluence: string
  first7Days: string[]
  next30Days: string[]
  disclaimer: string
}
