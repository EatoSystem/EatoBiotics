/**
 * EatoBiotics — Food System Digital Twin types.
 *
 * The Digital Twin is a *derived, read-only* projection of the user's living Food
 * System. It is NOT another assessment and NOT a persisted entity (in this phase).
 * It is built deterministically from an `AgentLoopSession` and is the single
 * object the UI, reports, and future AI providers consume.
 *
 * The immutable root is the `FoodSystemBaseline` (created from the You/Family
 * assessment). The Twin combines that baseline with everything that has enriched
 * it since: current score, biotics, observations, trends, progress, memory, the
 * active add-on, the loop stage, and the recommendation history.
 *
 * Pure + provider-agnostic by design.
 */

import type {
  AgentLoopObservation,
  AgentLoopRecommendation,
  AgentLoopStage,
  BioticsScore,
  FoodSystemBaseline,
  FoodSystemMemory,
  FoodSystemScore,
  LoopProgress,
  LoopSystemKey,
} from "../types"

export type TrendDirection = "up" | "down" | "steady"

export interface FoodSystemTrend {
  label: string
  direction: TrendDirection
  detail: string
}

/**
 * The living digital representation of "The Food System Inside You".
 * Stable interface: the same shape can later be backed by localStorage,
 * Supabase, or an AI provider without changing consumers.
 */
export interface FoodSystemDigitalTwin {
  /** Immutable root — the foundational assessment. */
  baseline: FoodSystemBaseline
  /** Latest known Food System Score (enriched by reassessments). */
  currentScore: FoodSystemScore
  /** Current three-biotics profile (today: from baseline; future: enriched by observations). */
  biotics: BioticsScore
  /** Everything observed so far — meals, symptoms, energy, sleep, activity, … */
  observations: AgentLoopObservation[]
  /** Directional read of how the Food System is moving. */
  trends: FoodSystemTrend[]
  /** The system this loop is running for (foundation or a specialised add-on). */
  activeSystem: LoopSystemKey
  /** Where the user is in the loop right now. */
  currentStage: AgentLoopStage
  /** The single next best action (latest recommendation), or null before any loop. */
  nextBestAction: AgentLoopRecommendation | null
  /** Full recommendation history (oldest → newest). */
  recommendations: AgentLoopRecommendation[]
  /** The Learn layer — what was done/ignored and outcomes. */
  memory: FoodSystemMemory
  /** The Improve layer — loops, score delta, momentum. */
  progress: LoopProgress
  updatedAt: number
}
