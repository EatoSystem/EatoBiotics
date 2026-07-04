/**
 * EatoBiotics — what-if score forecast (educational estimate, not a promise).
 *
 * Pure, deterministic 4-week projection: each enabled habit applies a
 * diminishing weekly gain to the biotic it feeds; the projected overall score
 * is the biotics mean pulled toward the current overall (so the model stays
 * humble). Never exceeds 100, never decreases. UI must surface the framing:
 * "an educational estimate from your current levels — not a promise, and not
 * medical advice."
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { BioticKey } from "@/lib/agent-loop/types"

export interface ForecastHabit {
  key: "fermented" | "plants" | "logging"
  label: string
  /** What it does, in the Twin's voice. */
  why: string
  targetBiotic: BioticKey | null
}

export const FORECAST_HABITS: ForecastHabit[] = [
  { key: "fermented", label: "One fermented food a day", why: "Live cultures lift my probiotic side fastest.", targetBiotic: "probiotics" },
  { key: "plants", label: "+5 different plants a week", why: "Variety feeds my prebiotic side.", targetBiotic: "prebiotics" },
  { key: "logging", label: "Log a meal every day", why: "Consistency compounds everything I learn.", targetBiotic: null },
]

export type HabitSelection = Partial<Record<ForecastHabit["key"], boolean>>

export interface Forecast {
  /** Weekly projected overall score, index 0 = now (5 points: now + 4 weeks). */
  weeks: number[]
  /** The 4-week projected score (last point). */
  projected: number
  /** Gain vs now. */
  gain: number
  /** Projected 4-week per-biotic levels — drives the preview figure's pathways. */
  biotics: { prebiotics: number; probiotics: number; postbiotics: number }
}

/** Weekly gain a biotic can absorb — larger when the level is low (diminishing returns). */
function weeklyGain(level: number): number {
  return Math.max(0.5, ((100 - level) / 100) * 6)
}

export function projectScore(twin: FoodSystemDigitalTwin, habits: HabitSelection): Forecast {
  const now = Math.round(twin.currentScore.value)
  const b = {
    prebiotics: twin.biotics.prebiotics.score,
    probiotics: twin.biotics.probiotics.score,
    postbiotics: twin.biotics.postbiotics.score,
  }
  // Daily logging doesn't feed one biotic — it multiplies how well the others land.
  const consistency = habits.logging ? 1.35 : 1

  const weeks = [now]
  for (let w = 1; w <= 4; w++) {
    if (habits.fermented) b.probiotics = Math.min(100, b.probiotics + weeklyGain(b.probiotics) * consistency)
    if (habits.plants) b.prebiotics = Math.min(100, b.prebiotics + weeklyGain(b.prebiotics) * consistency)
    // Postbiotics follow when the first two are fed (spillover at half rate).
    if (habits.fermented || habits.plants) {
      b.postbiotics = Math.min(100, b.postbiotics + weeklyGain(b.postbiotics) * 0.5 * consistency)
    }
    const bioticsMean = (b.prebiotics + b.probiotics + b.postbiotics) / 3
    // Pull the overall toward the biotics mean, but only ever upward from "now".
    const blended = now + Math.max(0, bioticsMean - (twin.biotics.prebiotics.score + twin.biotics.probiotics.score + twin.biotics.postbiotics.score) / 3) * 0.8
    weeks.push(Math.min(100, Math.round(blended)))
  }
  // Logging alone still earns a small, honest consistency gain.
  if (habits.logging && !habits.fermented && !habits.plants) {
    for (let w = 1; w <= 4; w++) weeks[w] = Math.min(100, now + w)
  }

  const projected = weeks[weeks.length - 1]
  return {
    weeks,
    projected,
    gain: projected - now,
    biotics: {
      prebiotics: Math.round(b.prebiotics),
      probiotics: Math.round(b.probiotics),
      postbiotics: Math.round(b.postbiotics),
    },
  }
}
