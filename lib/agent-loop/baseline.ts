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
import { toBioticsScore, type BioticsInput, BIOTIC_LABELS } from "./biotics"
import type { BioticsScore, FoodSystemBaseline, FoodSystemScore } from "./types"

export interface BaselineInput {
  foundationKey: FoundationKey
  /** Overall Food System Score, 0–100 (from the assessment). */
  score: number
  /** Band label, e.g. "Strong Foundation". */
  scoreLabel: string
  biotics: BioticsInput
  strengths: string[]
  priorities: string[]
  createdAt?: number
}

/** Gaps = biotics that are notably low — derived, food-first, non-diagnostic. */
function deriveGaps(biotics: BioticsScore): string[] {
  const gaps: string[] = []
  for (const k of ["prebiotics", "probiotics", "postbiotics"] as const) {
    if (biotics[k].score < 50) gaps.push(`${BIOTIC_LABELS[k]} appear lower than the others`)
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
    strengths: input.strengths,
    gaps: deriveGaps(biotics),
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
    strengths: summary.strengths,
    priorities: summary.priorities,
  })
}
