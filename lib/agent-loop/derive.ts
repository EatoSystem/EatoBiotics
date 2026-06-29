/**
 * EatoBiotics Agent Loop — derived read helpers.
 *
 * Pure functions that project state out of an `AgentLoopSession`. They live here
 * (rather than in the engine) so both the engine and the Digital Twin builder can
 * reuse them without an import cycle. No React / DB / network / AI imports.
 */

import { getScoreBand } from "@/lib/scoring"
import type { AgentLoopSession, FoodSystemScore, LoopProgress, Momentum } from "./types"

/** Latest known Food System Score: most recent `assessment_update`, else baseline. */
export function currentFoodSystemScore(session: AgentLoopSession): FoodSystemScore {
  for (let i = session.turns.length - 1; i >= 0; i--) {
    const obs = session.turns[i].observation
    if (obs?.kind === "assessment_update" && typeof obs.meta?.score === "number") {
      const value = obs.meta.score as number
      return { value, band: getScoreBand(value), label: getScoreBand(value).label }
    }
  }
  return session.baseline.foodSystemScore
}

function momentumOf(
  loopsCompleted: number,
  scoreDelta: number,
  completed: number,
  ignored: number,
): Momentum {
  if (loopsCompleted === 0) return "starting"
  if (scoreDelta > 0) return "improving"
  if (ignored >= 2 && ignored > completed) return "stalled"
  return "steady"
}

export function calculateLoopProgress(session: AgentLoopSession): LoopProgress {
  const loopsCompleted = session.turns.filter((t) => t.recommendation).length
  const scoreDelta = currentFoodSystemScore(session).value - session.baseline.foodSystemScore.value
  const completedActions = session.memory.completed.length
  const ignoredActions = session.memory.ignored.length
  return {
    loopsCompleted,
    scoreDelta,
    completedActions,
    ignoredActions,
    momentum: momentumOf(loopsCompleted, scoreDelta, completedActions, ignoredActions),
  }
}
