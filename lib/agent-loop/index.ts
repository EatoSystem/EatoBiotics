/**
 * EatoBiotics Agent Loop — public surface.
 *
 * The loop is the product architecture; AI providers plug in behind
 * `LoopIntelligenceProvider`. Import from here, not from individual modules.
 * See `docs/agent-loop.md`.
 */

export * from "./types"
export * from "./stages"
export * from "./systems"
export * from "./biotics"
export * from "./baseline"
export * from "./safety"
export * from "./derive"
export * from "./twin"
export * from "./engine"
export {
  listSessions,
  getSession,
  saveSession,
  saveLoopResult,
  clearSessions,
  syncToServer,
} from "./storage"
export type { LoopIntelligenceProvider, ProviderContext } from "./providers/provider"
export { DeterministicProvider, deterministicProvider } from "./providers/deterministic"
