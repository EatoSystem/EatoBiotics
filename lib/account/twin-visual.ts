/**
 * EatoBiotics — Twin → visual state mapper.
 *
 * A pure, deterministic function that turns the read-only `FoodSystemDigitalTwin`
 * into the handful of visual parameters the account's Living Twin renders (glow
 * colours, particle density, pulse speed, "confidence" haze). Kept pure + free of
 * React so it is unit-testable and reused identically on server and client.
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { BioticKey, Momentum } from "@/lib/agent-loop/types"

export interface TwinVisualState {
  /** Score shown in the ring (0–100). */
  ringScore: number
  /** How much the Twin "knows" the member (0–1) — drives brightness/sharpness. */
  confidence: number
  /** Rising-particle density (0–1). */
  particleDensity: number
  /** Aura pulse period in seconds (faster = more alive/improving). */
  pulseSec: number
  /** Momentum passthrough for labels. */
  momentum: Momentum
  /** CSS radial-gradient background for the aura, biased by biotic balance. */
  auraGradient: string
  /** Short human label for the momentum state. */
  momentumLabel: string
}

const MOMENTUM_LABEL: Record<Momentum, string> = {
  starting: "Getting to know you",
  steady: "Holding steady",
  improving: "Improving",
  stalled: "Needs attention",
}

/**
 * Bias the aura warmth by a biotic: prebiotics → lime/green, probiotics →
 * teal/green, postbiotics → yellow/orange. Always within the brand palette
 * (green → yellow → orange; never blue/purple). Exported so the lens switcher can
 * re-tint the Twin toward a specialised system's focus biotic.
 */
export function auraGradientForBiotic(biotic: BioticKey, intensity = 0.6): string {
  const inner =
    biotic === "postbiotics"
      ? `rgba(245,197,24,${0.28 + 0.24 * intensity})`
      : biotic === "probiotics"
        ? `rgba(45,170,110,${0.28 + 0.24 * intensity})`
        : `rgba(168,224,99,${0.30 + 0.25 * intensity})`
  const mid =
    biotic === "postbiotics"
      ? `rgba(245,166,35,${0.16 + 0.16 * intensity})`
      : `rgba(245,197,24,${0.14 + 0.16 * intensity})`
  return `radial-gradient(circle, ${inner} 0%, ${mid} 44%, rgba(255,255,255,0) 72%)`
}

export function twinVisualState(twin: FoodSystemDigitalTwin): TwinVisualState {
  const observations = twin.observations.length
  // Confidence saturates around ~12 logged signals.
  const confidence = Math.max(0.15, Math.min(1, observations / 12))
  const momentum = twin.progress.momentum

  const pulseSec =
    momentum === "improving" ? 3.4 : momentum === "stalled" ? 6.5 : 5

  return {
    ringScore: Math.round(twin.currentScore.value),
    confidence,
    particleDensity: confidence,
    pulseSec,
    momentum,
    auraGradient: auraGradientForBiotic(twin.biotics.strongest, confidence),
    momentumLabel: MOMENTUM_LABEL[momentum],
  }
}
