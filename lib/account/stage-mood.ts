/**
 * EatoBiotics — TwinStage mood (pure, deterministic).
 *
 * Maps the local hour + today's engagement to the stage atmosphere so the
 * Twin feels different at dawn, midday, dusk and night, and visibly brighter
 * once it has been fed (a meal signal or a ritual tick today). Colours stay
 * inside the brand palette — greens/limes/teals/ambers only.
 */

export type StageMoodKey = "dawn" | "day" | "dusk" | "night"

export interface StageMood {
  key: StageMoodKey
  /** Top-left + right radial glow colours (rgba strings). */
  glowA: string
  glowB: string
  /** Multiplier applied to the aura opacity (fed = brighter, waiting = calmer). */
  auraMult: number
  /** Whether the rising particles should show at this mood. */
  particles: boolean
  /** Short mood line for the cockpit eyebrow, e.g. "evening · winding down". */
  line: string
}

export interface StageMoodInput {
  /** A meal signal or any ritual tick landed today. */
  fed: boolean
}

export function stageMoodKey(hour: number): StageMoodKey {
  if (hour >= 5 && hour < 11) return "dawn"
  if (hour >= 11 && hour < 17) return "day"
  if (hour >= 17 && hour < 22) return "dusk"
  return "night"
}

const MOODS: Record<StageMoodKey, Omit<StageMood, "auraMult" | "particles">> = {
  dawn: {
    key: "dawn",
    glowA: "rgba(245,197,24,0.16)", // warm morning amber
    glowB: "rgba(168,224,99,0.13)",
    line: "morning · a fresh start",
  },
  day: {
    key: "day",
    glowA: "rgba(168,224,99,0.14)", // full green daylight
    glowB: "rgba(45,170,110,0.16)",
    line: "daytime · in full flow",
  },
  dusk: {
    key: "dusk",
    glowA: "rgba(45,170,110,0.18)", // deeper evening teal
    glowB: "rgba(245,166,35,0.10)",
    line: "evening · winding down",
  },
  night: {
    key: "night",
    glowA: "rgba(45,170,110,0.10)", // dim, restful
    glowB: "rgba(168,224,99,0.07)",
    line: "night · resting and remembering",
  },
}

export function stageMood(hour: number, input: StageMoodInput): StageMood {
  const key = stageMoodKey(hour)
  const base = MOODS[key]
  // Fed = brighter presence; waiting = calmer. Night stays gentle either way.
  const fedMult = input.fed ? 1.15 : 0.8
  const nightDamp = key === "night" ? 0.75 : 1
  return {
    ...base,
    auraMult: Number((fedMult * nightDamp).toFixed(2)),
    particles: input.fed && key !== "night",
  }
}
