/**
 * EatoBiotics Agent Loop — the intelligence provider seam.
 *
 * This is the one place AI plugs in. The loop engine depends ONLY on this
 * interface, never on a model SDK. The default is `DeterministicProvider`
 * (rule-based, no network). Later, a `ClaudeProvider` / `OpenAIProvider`
 * implements the same two methods and is swapped in by configuration — the
 * engine, domain models, and UI do not change.
 *
 * See `providers/README.md` for a worked example of adding a real provider.
 */

import type {
  AgentLoopAnalysis,
  AgentLoopObservation,
  AgentLoopRecommendation,
  AgentLoopTurn,
  FoodSystemBaseline,
  FoodSystemMemory,
  LoopSystemKey,
} from "../types"

export interface ProviderContext {
  /** Which system this loop runs for — lets a provider bias toward its focus biotic. */
  system: LoopSystemKey
  baseline: FoodSystemBaseline
  history: AgentLoopTurn[]
  memory: FoodSystemMemory
}

/**
 * Both methods may be sync or async so a deterministic provider stays sync while
 * a network-backed one returns a Promise. The engine awaits either.
 */
export interface LoopIntelligenceProvider {
  /** Stable id recorded in `LoopUsage.engine` (e.g. "deterministic", "claude"). */
  readonly id: string
  analyse(
    observation: AgentLoopObservation,
    ctx: ProviderContext,
  ): AgentLoopAnalysis | Promise<AgentLoopAnalysis>
  recommend(
    analysis: AgentLoopAnalysis,
    ctx: ProviderContext,
  ): AgentLoopRecommendation | Promise<AgentLoopRecommendation>
}
