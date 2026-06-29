/**
 * EatoBiotics Agent Loop — the stage state machine.
 *
 * Pure: order, transitions, and presentation metadata for the eight stages.
 * The engine drives transitions; the UI reads `STAGE_META` for labels.
 */

import type { AgentLoopStage } from "./types"

/** Canonical order of the loop. `repeat` resolves back to `observe`. */
export const STAGE_ORDER: AgentLoopStage[] = [
  "assess",
  "understand",
  "observe",
  "analyse",
  "recommend",
  "improve",
  "learn",
  "repeat",
]

/** User-facing labels (the seven the homepage shows; "repeat" loops to "observe"). */
export const STAGE_META: Record<
  AgentLoopStage,
  { label: string; meaning: string }
> = {
  assess: {
    label: "Assess",
    meaning: "Complete your You or Family foundation to set your Food System baseline.",
  },
  understand: {
    label: "Understand",
    meaning: "See your Food System Score and three-biotics profile — strengths and gaps.",
  },
  observe: {
    label: "Observe",
    meaning: "Add a meal, how you feel, or an assessment update.",
  },
  analyse: {
    label: "Analyse",
    meaning: "We compare what's new against your baseline and recent patterns.",
  },
  recommend: {
    label: "Recommend",
    meaning: "One clear, food-first next step — never a long list.",
  },
  improve: {
    label: "Improve",
    meaning: "Track movement against earlier loops and celebrate small wins.",
  },
  learn: {
    label: "Learn",
    meaning: "We remember what helped so future steps fit you better.",
  },
  repeat: {
    label: "Repeat",
    meaning: "Every meal, check-in, or assessment starts the loop again.",
  },
}

/**
 * Deterministic transition map. After `learn` the loop returns to `observe`
 * (we collapse the transient `repeat` marker into the next observable stage).
 */
const NEXT: Record<AgentLoopStage, AgentLoopStage> = {
  assess: "understand",
  understand: "observe",
  observe: "analyse",
  analyse: "recommend",
  recommend: "improve",
  improve: "learn",
  learn: "observe",
  repeat: "observe",
}

export function nextStage(stage: AgentLoopStage): AgentLoopStage {
  return NEXT[stage]
}

export function stageIndex(stage: AgentLoopStage): number {
  return STAGE_ORDER.indexOf(stage)
}

/** Is the foundation/understanding done, so the user can start observing? */
export function isLoopActive(stage: AgentLoopStage): boolean {
  return stageIndex(stage) >= stageIndex("observe")
}
