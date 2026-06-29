/**
 * EatoBiotics Agent Loop — biotics adapter.
 *
 * Maps the existing three-biotics sub-scores (`lib/assessment-scoring.ts` →
 * `SubScores.prebiotics/probiotics/postbiotics`) into the loop's `BioticsScore`,
 * deriving the strongest and weakest biotic. Pure — no scoring logic is
 * duplicated here; we only translate and rank what the assessment already
 * computed.
 */

import type { BioticKey, BioticsScore, BioticBand } from "./types"

/** Minimal three-biotics input — structurally satisfied by `SubScores`. */
export interface BioticsInput {
  prebiotics: number
  probiotics: number
  postbiotics: number
}

/** Plain-language band for a single biotic (kept distinct from the overall ScoreBand). */
export function bioticLabel(score: number): string {
  if (score >= 80) return "Thriving"
  if (score >= 60) return "Strong"
  if (score >= 40) return "Building"
  if (score >= 20) return "Emerging"
  return "Getting started"
}

function band(score: number): BioticBand {
  return { score, label: bioticLabel(score) }
}

const ORDER: BioticKey[] = ["prebiotics", "probiotics", "postbiotics"]

export function toBioticsScore(input: BioticsInput): BioticsScore {
  const scores: Record<BioticKey, number> = {
    prebiotics: input.prebiotics,
    probiotics: input.probiotics,
    postbiotics: input.postbiotics,
  }

  // Strongest = highest; weakest = lowest. Ties resolve by ORDER so results are
  // stable/deterministic rather than dependent on object key iteration.
  let strongest: BioticKey = ORDER[0]
  let weakest: BioticKey = ORDER[0]
  for (const k of ORDER) {
    if (scores[k] > scores[strongest]) strongest = k
    if (scores[k] < scores[weakest]) weakest = k
  }

  return {
    prebiotics: band(scores.prebiotics),
    probiotics: band(scores.probiotics),
    postbiotics: band(scores.postbiotics),
    strongest,
    weakest,
  }
}

export const BIOTIC_LABELS: Record<BioticKey, string> = {
  prebiotics: "Prebiotics",
  probiotics: "Probiotics",
  postbiotics: "Postbiotics",
}

/** Educational, food-first one-liners — used by the deterministic provider + UI. */
export const BIOTIC_FOOD_HINTS: Record<BioticKey, string> = {
  prebiotics: "fibre-rich plants like oats, onions, garlic, and legumes",
  probiotics: "fermented foods like yoghurt, kefir, kimchi, or sauerkraut",
  postbiotics: "polyphenol-rich foods like berries, green tea, and extra-virgin olive oil",
}
