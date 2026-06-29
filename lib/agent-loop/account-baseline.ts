/**
 * EatoBiotics Agent Loop — account baseline adapter.
 *
 * Builds a `FoodSystemBaseline` from the data the Account page already fetches from
 * the database (assessment score + sub-scores, with an analyses-averaged biotics
 * fallback). Unlike `readFoundationBaseline` (browser/localStorage), this is a pure,
 * server-safe function so the authenticated Account dashboard can derive the Twin's
 * immutable root from server data. Reuses the pure `buildBaseline()` and the existing
 * `normaliseSubScores()` so no scoring logic is duplicated.
 */

import { buildBaseline } from "./baseline"
import type { FoodSystemBaseline } from "./types"
import { normaliseSubScores } from "@/lib/assessment-scoring"
import type { FoundationKey } from "@/lib/assessment/registry"

export interface AccountBaselineInput {
  /** Defaults to "you" (the personal foundation). */
  foundationKey?: FoundationKey
  /** Overall Food System Score (0–100). Null when no assessment is complete. */
  score: number | null
  /** Band/profile label, e.g. "Strong Foundation". */
  profileType?: string | null
  /** Raw assessment sub-scores (any stored format — normalised here). */
  subScores?: Record<string, number> | null
  /** Fallback biotics averaged from recent analyses (pre/pro/post 0–100). */
  bioticsFallback?: { prebiotic: number; probiotic: number; postbiotic: number } | null
  strengths?: string[]
  priorities?: string[]
}

/**
 * Returns a baseline, or `null` when there isn't enough to build a meaningful one
 * (no score, or no biotics from either source) — the dashboard then shows a
 * "complete your baseline" prompt rather than a broken hero.
 */
export function buildBaselineFromAccount(input: AccountBaselineInput): FoodSystemBaseline | null {
  if (input.score == null) return null

  let biotics: { prebiotics: number; probiotics: number; postbiotics: number } | null = null
  if (input.subScores && Object.keys(input.subScores).length > 0) {
    const n = normaliseSubScores(input.subScores)
    biotics = { prebiotics: n.prebiotics, probiotics: n.probiotics, postbiotics: n.postbiotics }
  } else if (input.bioticsFallback) {
    biotics = {
      prebiotics: input.bioticsFallback.prebiotic,
      probiotics: input.bioticsFallback.probiotic,
      postbiotics: input.bioticsFallback.postbiotic,
    }
  }
  if (!biotics) return null

  return buildBaseline({
    foundationKey: input.foundationKey ?? "you",
    score: input.score,
    scoreLabel: input.profileType ?? "Food System",
    biotics,
    strengths: input.strengths ?? [],
    priorities: input.priorities ?? [],
  })
}
