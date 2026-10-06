/**
 * EatoBiotics — Twin → visual state mapper.
 *
 * A pure, deterministic function that turns the read-only `FoodSystemDigitalTwin`
 * into the handful of visual parameters the account's living Food System renders (glow
 * colours, particle density, pulse speed, "confidence" haze). Kept pure + free of
 * React so it is unit-testable and reused identically on server and client.
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { Momentum } from "@/lib/agent-loop/types"

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
  /*
   * ══ 0R-5 · `auraGradient` IS GONE FROM THIS CONTRACT ══════════════════════
   *
   * It read `auraGradientForBiotic(twin.biotics.strongest, confidence)` — the
   * member's STRONGEST Biotic choosing the colour of the glow around their
   * body figure. `strongest` is `argmax` over the three, so the colour was a
   * comparative personal Biotic verdict with no string attached to it, which is
   * why four claim sweeps walked past it. `P0-SCIENCE-04`.
   *
   * Two separate facts, both worth keeping written down:
   *
   *   1. This field had ZERO consumers. `twin-stage.tsx` imports the aura
   *      function and computes its own, so the one derived from `strongest`
   *      was never rendered. It is removed anyway — a field that carries a
   *      prohibited verdict is one `style={{ background: visual.auraGradient }}`
   *      away from being the defect again.
   *   2. The one that WAS rendered used `weakest`, in `twin-stage.tsx`.
   *      Repaired there.
   */
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
 * ══ 0R-5 · THE AURA IS KEYED ON A PALETTE TONE, NOT ON A BIOTIC ════════════
 *
 * This function was `auraGradientForBiotic(biotic: BioticKey, …)`, and that
 * SIGNATURE was the defect — not any one call site. While it accepted a
 * `BioticKey`, every caller was one argument away from the member's weakest or
 * strongest Biotic, and two of them already were.
 *
 * `AuraTone` is a name for a colour and nothing else. `twin.biotics.weakest` is
 * not a tone and cannot be passed as one, so the prohibited data-flow is
 * STRUCTURALLY unavailable rather than merely absent today — which is what the
 * 0R-5 brief asked for in place of a reworded call.
 *
 * ── NO NEW VISUAL LANGUAGE ────────────────────────────────────────────────
 *
 * The three gradients are byte-identical to the three this function already
 * produced. A hotspot the member TAPS still tints the stage exactly as before,
 * because `SYSTEM_HOTSPOTS` now declares a static `tone` beside the static
 * `biotic` data key Gate 3.6 left it. Nothing about the palette moved; only
 * what is allowed to choose within it.
 */
export type AuraTone = "lime" | "green" | "amber"

export function auraGradientForTone(tone: AuraTone, intensity = 0.6): string {
  const inner =
    tone === "amber"
      ? `rgba(245,197,24,${0.28 + 0.24 * intensity})`
      : tone === "green"
        ? `rgba(45,170,110,${0.28 + 0.24 * intensity})`
        : `rgba(168,224,99,${0.30 + 0.25 * intensity})`
  const mid =
    tone === "amber"
      ? `rgba(245,166,35,${0.16 + 0.16 * intensity})`
      : `rgba(245,197,24,${0.14 + 0.16 * intensity})`
  return `radial-gradient(circle, ${inner} 0%, ${mid} 44%, rgba(255,255,255,0) 72%)`
}

/**
 * The stage's resting aura, with nothing selected.
 *
 * A FIXED tone. This is the slot that used to hold
 * `auraGradientForBiotic(twin.biotics.weakest, …)`, so it is the one place
 * where "neutral presentation rather than a new visual language" has to be
 * stated explicitly: the glow is the brand's lime base at the Twin's
 * confidence, and it is the same for every member whatever their scores.
 */
export function restingAuraGradient(intensity = 0.6): string {
  return auraGradientForTone("lime", intensity)
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
    momentumLabel: MOMENTUM_LABEL[momentum],
  }
}
