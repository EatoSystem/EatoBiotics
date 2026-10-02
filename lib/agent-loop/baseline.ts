/**
 * EatoBiotics Agent Loop — baseline adapter.
 *
 * Turns a completed You/Family foundation into the loop's `FoodSystemBaseline`
 * (the permanent parent of every interaction). The score, strengths, and
 * priorities come from the existing assessment registry — we never recompute
 * them here. `buildBaseline` is pure (unit-tested); `readFoundationBaseline`
 * is the browser glue that reads the registry + the raw foundation record for
 * the three-biotics sub-scores (which the registry summary doesn't carry).
 */

import { getScoreBand } from "@/lib/scoring"
import { getSummary } from "@/lib/assessment/registry"
import type { FoundationKey } from "@/lib/assessment/registry"
import type { SubScores } from "@/lib/assessment-scoring"
import { toBioticsScore, type BioticsInput } from "./biotics"
import { behaviourFor } from "./behaviour"
import type { BioticsScore, BioticsSource, FoodSystemBaseline, FoodSystemScore } from "./types"

export interface BaselineInput {
  foundationKey: FoundationKey
  /** Overall Food System Score, 0–100 (from the assessment). */
  score: number
  /** Band label, e.g. "Strong Foundation". */
  scoreLabel: string
  biotics: BioticsInput
  /** Required, not defaulted: a wrong answer here becomes a false sentence. */
  bioticsSource: BioticsSource
  strengths: string[]
  priorities: string[]
  createdAt?: number
}

/**
 * Gaps = the food patterns with room in the answers — food-first, non-diagnostic.
 *
 * ── GATE 3.6 ────────────────────────────────────────────────────
 *
 * This read "Postbiotics appear lower than the others" — a personal Biotic
 * state, threshold-gated. The 50 is UNCHANGED and is not touched by the
 * claims repair: it selects which pattern to mention, it does not score
 * anything and it is not customer-visible.
 */
function deriveGaps(biotics: BioticsScore, source: BioticsSource): string[] {
  const gaps: string[] = []
  const where = source === "meals" ? "your recent meals" : "your answers"
  for (const k of ["prebiotics", "probiotics", "postbiotics"] as const) {
    if (biotics[k].score < 50) gaps.push(`Room to grow in ${where}: ${behaviourFor(k, source)}`)
  }
  return gaps
}

export function buildBaseline(input: BaselineInput): FoodSystemBaseline {
  const biotics = toBioticsScore(input.biotics)
  const score: FoodSystemScore = {
    value: input.score,
    band: getScoreBand(input.score),
    label: input.scoreLabel,
  }
  return {
    foundationKey: input.foundationKey,
    foodSystemScore: score,
    biotics,
    bioticsSource: input.bioticsSource,
    strengths: input.strengths,
    gaps: deriveGaps(biotics, input.bioticsSource),
    priorities: input.priorities,
    createdAt: input.createdAt ?? Date.now(),
  }
}

/* ── Browser glue (reads existing assessment records) ──────────────────────── */

const FOUNDATION_LS: Record<FoundationKey, string> = {
  you: "eatobiotics-assessment",
  family: "eatobiotics-family-assessment",
}

function readSubScores(foundationKey: FoundationKey): BioticsInput | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(FOUNDATION_LS[foundationKey])
    if (!raw) return null
    const parsed = JSON.parse(raw) as { result?: { subScores?: SubScores } }
    const sub = parsed.result?.subScores
    if (!sub) return null
    return {
      prebiotics: sub.prebiotics ?? sub.feed ?? 0,
      probiotics: sub.probiotics ?? sub.seed ?? 0,
      postbiotics: sub.postbiotics ?? sub.heal ?? 0,
    }
  } catch {
    return null
  }
}

/**
 * Build a `FoodSystemBaseline` from a completed foundation, or `null` if that
 * foundation isn't complete. Browser-only (mirrors the registry/journey
 * localStorage-first convention).
 */
export function readFoundationBaseline(foundationKey: FoundationKey): FoodSystemBaseline | null {
  const summary = getSummary(foundationKey)
  const biotics = readSubScores(foundationKey)
  if (!summary || !biotics) return null
  return buildBaseline({
    foundationKey,
    score: summary.score,
    scoreLabel: summary.bandLabel,
    biotics,
    // The ASSESSMENT's three sub-scores, read from the stored record.
    bioticsSource: "assessment",
    strengths: summary.strengths,
    priorities: summary.priorities,
  })
}
