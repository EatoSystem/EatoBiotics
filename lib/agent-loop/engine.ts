/**
 * EatoBiotics Agent Loop — the deterministic loop engine.
 *
 * Pure, immutable state transitions (no React / DB / network). A loop pass runs
 * Observe → Analyse → Recommend → Improve → Learn and returns a NEW session plus
 * an `AgentLoopResult`. Intelligence is delegated to a `LoopIntelligenceProvider`
 * (default: deterministic), so swapping in Claude/OpenAI later changes nothing
 * here. Mirrors the Claude Agent SDK shape: a turn carries usage, the result
 * carries the "what now".
 */

import { getScoreBand } from "@/lib/scoring"
import type {
  AgentLoopObservation,
  AgentLoopResult,
  AgentLoopSession,
  AgentLoopTurn,
  FoodSystemBaseline,
  FoodSystemMemory,
  FoodSystemScore,
  LoopControls,
  LoopProgress,
  LoopSystemKey,
  Momentum,
  ObservationKind,
  RecommendationOutcomeStatus,
} from "./types"
import { nextStage } from "./stages"
import { getSystem } from "./systems"
import { LOOP_DISCLAIMER } from "./safety"
import { deterministicProvider } from "./providers/deterministic"
import type { LoopIntelligenceProvider, ProviderContext } from "./providers/provider"

/* ── ids + small helpers ──────────────────────────────────────────────────── */

let counter = 0
function genId(prefix: string): string {
  counter += 1
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`
}

function emptyMemory(): FoodSystemMemory {
  return { completed: [], ignored: [], outcomes: [], preferences: {} }
}

/* ── Session creation (Assess + Understand already done = baseline exists) ─── */

export class LoopError extends Error {}

export function createAgentLoopSession(
  baseline: FoodSystemBaseline,
  system: LoopSystemKey = "foundation",
  controls: LoopControls = {},
): AgentLoopSession {
  const meta = getSystem(system)
  // Inheritance rule: a specialised system can only run on a foundation baseline.
  if (meta.requiresFoundation && !baseline.foundationKey) {
    throw new LoopError(`${meta.label} requires a You or Family foundation first.`)
  }
  if (meta.status !== "live") {
    throw new LoopError(`${meta.label} is not available yet.`)
  }
  const now = Date.now()
  return {
    id: genId("loop"),
    foundationKey: baseline.foundationKey,
    system,
    baseline,
    // Baseline implies Assess + Understand are complete; the user can observe now.
    currentStage: "observe",
    turns: [],
    memory: emptyMemory(),
    controls,
    createdAt: now,
    updatedAt: now,
  }
}

/* ── Observations ─────────────────────────────────────────────────────────── */

export function makeObservation(
  kind: ObservationKind,
  value: string | number,
  meta?: Record<string, unknown>,
): AgentLoopObservation {
  return { id: genId("obs"), kind, value, meta, createdAt: Date.now() }
}

/* ── Current score / progress (pure) ──────────────────────────────────────── */

/** Latest known Food System Score: most recent assessment_update, else baseline. */
function currentScore(session: AgentLoopSession): FoodSystemScore {
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
  const scoreDelta = currentScore(session).value - session.baseline.foodSystemScore.value
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

/* ── The core loop pass ───────────────────────────────────────────────────── */

export interface LoopPass {
  session: AgentLoopSession
  result: AgentLoopResult
}

export async function runLoop(
  session: AgentLoopSession,
  observation: AgentLoopObservation,
  provider: LoopIntelligenceProvider = deterministicProvider,
): Promise<LoopPass> {
  const { controls } = session
  if (controls.allowedObservations && !controls.allowedObservations.includes(observation.kind)) {
    throw new LoopError(`Observation "${observation.kind}" is not allowed for this loop.`)
  }
  if (controls.maxTurns !== undefined && session.turns.length >= controls.maxTurns) {
    throw new LoopError("This loop has reached its turn limit.")
  }

  const ctx: ProviderContext = {
    system: session.system,
    baseline: session.baseline,
    history: session.turns,
    memory: session.memory,
  }

  const analysis = await provider.analyse(observation, ctx)
  const recommendation = await provider.recommend(analysis, ctx)

  // Build the session-with-this-observation so progress reflects it (Improve).
  const usage = { engine: provider.id }
  const provisionalTurn: AgentLoopTurn = {
    id: genId("turn"),
    stage: "learn",
    observation,
    analysis,
    recommendation,
    // result filled below once progress is known
    result: undefined as unknown as AgentLoopResult,
    usage,
    createdAt: Date.now(),
  }
  const withTurn: AgentLoopSession = {
    ...session,
    turns: [...session.turns, provisionalTurn],
  }

  const progress = calculateLoopProgress(withTurn)
  const score = currentScore(withTurn)
  const result: AgentLoopResult = {
    stage: "recommend",
    score,
    progress,
    recommendation,
    summary:
      `${analysis.rationale} Next: ${recommendation.action}`.trim(),
    usage,
  }

  const finalTurn: AgentLoopTurn = { ...provisionalTurn, result }
  const nextSession: AgentLoopSession = {
    ...session,
    turns: [...session.turns, finalTurn],
    // After Learn the loop returns to Observe, ready for the next interaction.
    currentStage: nextStage("learn"),
    updatedAt: Date.now(),
  }

  return { session: nextSession, result }
}

/** Convenience: foundation (Food System) loop. */
export function runFoodSystemLoop(
  session: AgentLoopSession,
  observation: AgentLoopObservation,
  provider?: LoopIntelligenceProvider,
): Promise<LoopPass> {
  return runLoop(session, observation, provider)
}

/** Convenience: a specialised add-on loop (inheritance already enforced at create). */
export function runAddOnLoop(
  session: AgentLoopSession,
  observation: AgentLoopObservation,
  provider?: LoopIntelligenceProvider,
): Promise<LoopPass> {
  if (session.system === "foundation") {
    return Promise.reject(new LoopError("runAddOnLoop requires a specialised system session."))
  }
  return runLoop(session, observation, provider)
}

/** Convenience: a meal observation in one call. */
export function runMealLoop(
  session: AgentLoopSession,
  meal: string,
  meta?: Record<string, unknown>,
  provider?: LoopIntelligenceProvider,
): Promise<LoopPass> {
  return runLoop(session, makeObservation("meal_description", meal, meta), provider)
}

/* ── Learn: record what the user did with a recommendation ─────────────────── */

export function recordOutcome(
  session: AgentLoopSession,
  recommendationId: string,
  status: RecommendationOutcomeStatus,
  note?: string,
): AgentLoopSession {
  const turn = session.turns.find((t) => t.recommendation?.id === recommendationId)
  const action = turn?.recommendation?.action ?? ""
  const memory: FoodSystemMemory = {
    ...session.memory,
    completed:
      status === "completed"
        ? [...new Set([...session.memory.completed, recommendationId])]
        : session.memory.completed,
    ignored:
      status === "ignored"
        ? [...new Set([...session.memory.ignored, recommendationId])]
        : session.memory.ignored,
    outcomes: [
      ...session.memory.outcomes,
      { recommendationId, action, status, note, at: Date.now() },
    ],
  }
  return { ...session, memory, updatedAt: Date.now() }
}

/* ── Summary ──────────────────────────────────────────────────────────────── */

export function generateLoopSummary(session: AgentLoopSession): string {
  const sys = getSystem(session.system)
  const progress = calculateLoopProgress(session)
  const latest = [...session.turns].reverse().find((t) => t.recommendation)?.recommendation
  if (!latest) {
    return (
      `Your ${sys.label} loop is ready. Your Food System Score is ` +
      `${session.baseline.foodSystemScore.value} (${session.baseline.foodSystemScore.label}). ` +
      `Add an observation to begin. ${LOOP_DISCLAIMER}`
    )
  }
  return (
    `Across ${progress.loopsCompleted} loop${progress.loopsCompleted === 1 ? "" : "s"}, your ` +
    `momentum is "${progress.momentum}". Current next step: ${latest.action} ${LOOP_DISCLAIMER}`
  )
}
