/**
 * EatoBiotics — Food System Digital Twin builder.
 *
 * `buildFoodSystemTwin(session)` is a pure, deterministic projection: given the
 * same session it always returns the same Twin. It derives everything from the
 * session (the baseline plus the loop history), reusing the shared `derive`
 * helpers so there is no duplicated scoring/progress logic and no import cycle
 * with the engine.
 */

import type { AgentLoopObservation, AgentLoopRecommendation, AgentLoopSession } from "../types"
import { currentFoodSystemScore, calculateLoopProgress } from "../derive"
import type { FoodSystemDigitalTwin, FoodSystemTrend } from "./twin-types"

function collectObservations(session: AgentLoopSession): AgentLoopObservation[] {
  return session.turns
    .map((t) => t.observation)
    .filter((o): o is AgentLoopObservation => Boolean(o))
}

function collectRecommendations(session: AgentLoopSession): AgentLoopRecommendation[] {
  return session.turns
    .map((t) => t.recommendation)
    .filter((r): r is AgentLoopRecommendation => Boolean(r))
}

function deriveTrends(session: AgentLoopSession): FoodSystemTrend[] {
  const progress = calculateLoopProgress(session)
  const observations = collectObservations(session)
  const trends: FoodSystemTrend[] = []

  // Score trend vs the immutable baseline.
  if (progress.scoreDelta !== 0) {
    trends.push({
      label: "Food System Score",
      direction: progress.scoreDelta > 0 ? "up" : "down",
      detail: `${progress.scoreDelta > 0 ? "+" : ""}${progress.scoreDelta} since your baseline`,
    })
  } else {
    trends.push({
      label: "Food System Score",
      direction: "steady",
      detail: "Holding at your baseline",
    })
  }

  // Engagement / momentum trend.
  trends.push({
    label: "Momentum",
    direction: progress.momentum === "improving" ? "up" : progress.momentum === "stalled" ? "down" : "steady",
    detail:
      observations.length === 0
        ? "Add an observation to start your loop"
        : `${observations.length} observation${observations.length === 1 ? "" : "s"} logged · ${progress.momentum}`,
  })

  return trends
}

export function buildFoodSystemTwin(session: AgentLoopSession): FoodSystemDigitalTwin {
  const recommendations = collectRecommendations(session)
  return {
    baseline: session.baseline,
    currentScore: currentFoodSystemScore(session),
    biotics: session.baseline.biotics,
    observations: collectObservations(session),
    trends: deriveTrends(session),
    activeSystem: session.system,
    currentStage: session.currentStage,
    nextBestAction: recommendations.length ? recommendations[recommendations.length - 1] : null,
    recommendations,
    memory: session.memory,
    progress: calculateLoopProgress(session),
    updatedAt: session.updatedAt,
  }
}
