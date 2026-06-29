/**
 * EatoBiotics Agent Loop — domain models.
 *
 * These are *business* models, not UI models. They are pure and
 * dependency-free (no React, Supabase, localStorage, or AI SDK imports) so the
 * loop engine stays unit-testable and SSR-safe, mirroring the conventions in
 * `lib/assessment-types.ts`.
 *
 * The Agent Loop is the product architecture; an AI provider (Claude, OpenAI, …)
 * is an *interchangeable execution engine* plugged in behind
 * `LoopIntelligenceProvider` (see `providers/provider.ts`). The whole system
 * works deterministically with no LLM.
 *
 * The product journey this models:
 *   Assess → Understand → Observe → Analyse → Recommend → Improve → Learn → Repeat
 */

import type { ScoreBand } from "@/lib/scoring"
import type { FoundationKey, AddonKey } from "@/lib/assessment/registry"

/* ── Stages ───────────────────────────────────────────────────────────────── */

/**
 * The eight loop stages. These represent *product state*, not AI prompts.
 * `repeat` is a transient marker that resolves back to `observe` for the next
 * interaction (see `stages.ts`).
 */
export type AgentLoopStage =
  | "assess"
  | "understand"
  | "observe"
  | "analyse"
  | "recommend"
  | "improve"
  | "learn"
  | "repeat"

/* ── Systems (foundations + specialised systems) ──────────────────────────── */

/** A specialised system always inherits a foundation; some are not built yet. */
export type SystemStatus = "live" | "planned"

/** The system a loop session runs for: the foundation itself, or a specialised add-on. */
export type LoopSystemKey = "foundation" | SpecialisedKey

/**
 * Specialised systems. The four `AddonKey`s are live today; the remaining four
 * are roadmap definitions (metadata only — never scored with fabricated data).
 */
export type SpecialisedKey =
  | AddonKey // "stability" | "glucose" | "mind" | "performance"
  | "recovery"
  | "longevity"
  | "sleep"
  | "heart"

export interface LoopConfig {
  /** The biotic this system leans on most — used to bias deterministic recommendations. */
  focusBiotic: BioticKey
  /** Short, non-diagnostic framing of what this loop pays attention to. */
  observes: string[]
}

export interface AddOnSystem {
  key: LoopSystemKey
  label: string
  kind: "foundation" | "specialised"
  status: SystemStatus
  /** All specialised systems require a completed You/Family baseline. */
  requiresFoundation: boolean
  loop: LoopConfig
  blurb: string
}

/* ── Biotics + scores ─────────────────────────────────────────────────────── */

export type BioticKey = "prebiotics" | "probiotics" | "postbiotics"

export interface BioticBand {
  score: number // 0–100
  label: string // e.g. "Strong", "Building"
}

/** The three-biotics profile, plus derived strongest/weakest. */
export interface BioticsScore {
  prebiotics: BioticBand
  probiotics: BioticBand
  postbiotics: BioticBand
  strongest: BioticKey
  weakest: BioticKey
}

export interface FoodSystemScore {
  value: number // 0–100
  band: ScoreBand
  label: string // band label, e.g. "Strong Foundation"
}

/* ── Baseline (the permanent parent of every interaction) ─────────────────── */

export interface FoodSystemBaseline {
  foundationKey: FoundationKey
  foodSystemScore: FoodSystemScore
  biotics: BioticsScore
  strengths: string[]
  gaps: string[]
  priorities: string[]
  createdAt: number
}

/* ── Observations (the Observe stage; extensible by union) ────────────────── */

export type ObservationKind =
  | "meal_photo"
  | "meal_description"
  | "food_diary"
  | "digestion"
  | "energy"
  | "cravings"
  | "sleep"
  | "activity"
  | "symptom"
  | "assessment_update"
  | "addon_assessment"

/**
 * A single user input. `value` is intentionally loose (string | number) so new
 * sources slot in without reshaping the model; richer payloads (e.g. detected
 * foods from a meal photo) live in `meta`.
 */
export interface AgentLoopObservation {
  id: string
  kind: ObservationKind
  /** Free-text or scalar reading (e.g. meal text, energy 1–5). */
  value: string | number
  /** Structured extras — e.g. `{ biotics: BioticBreakdown }` from a meal score. */
  meta?: Record<string, unknown>
  createdAt: number
}

/* ── Analysis (the Analyse stage) ─────────────────────────────────────────── */

export interface AgentLoopAnalysis {
  /** What changed vs baseline / recent history. */
  changes: string[]
  /** Directional trends detected across turns. */
  trends: string[]
  improving: string[]
  needsAttention: string[]
  /** The biotic this observation most relates to, when determinable. */
  relatedBiotic?: BioticKey
  /** Plain-language, food-focused explanation. */
  rationale: string
}

/* ── Recommendation (the Recommend stage — exactly ONE next action) ───────── */

export type RecommendationEffort = "tiny" | "small" | "moderate"

export interface AgentLoopRecommendation {
  id: string
  /** The single next action, phrased food-first and achievable. */
  action: string
  /** Why this, now — educational, non-medical. */
  why: string
  category: "food-first"
  targetBiotic?: BioticKey
  effort: RecommendationEffort
  /** Non-diagnostic disclaimer surfaced with the action. */
  disclaimer: string
}

/* ── Memory (the Learn layer — works without AI) ──────────────────────────── */

export type RecommendationOutcomeStatus = "completed" | "ignored"

export interface RecommendationOutcome {
  recommendationId: string
  action: string
  status: RecommendationOutcomeStatus
  /** Optional self-reported effect, e.g. "felt steadier energy". */
  note?: string
  at: number
}

export interface FoodSystemMemory {
  completed: string[] // recommendation ids
  ignored: string[] // recommendation ids
  outcomes: RecommendationOutcome[]
  /** Lightweight learned preferences, e.g. { dislikedActions: [...] }. */
  preferences: Record<string, unknown>
}

/* ── Progress (the Improve stage) ─────────────────────────────────────────── */

export type Momentum = "starting" | "steady" | "improving" | "stalled"

export interface LoopProgress {
  loopsCompleted: number
  /** Food System Score change vs baseline (can be negative). */
  scoreDelta: number
  completedActions: number
  ignoredActions: number
  momentum: Momentum
}

/* ── Turn + result (mirrors the Agent SDK turn/result shape) ──────────────── */

/**
 * Usage metadata mirroring the Claude Agent SDK result. Deterministic runs
 * record `engine: "deterministic"` with zero cost; real providers fill tokens/cost.
 */
export interface LoopUsage {
  engine: string // provider id, e.g. "deterministic", "claude"
  tokens?: number
  costCents?: number
}

export interface AgentLoopTurn {
  id: string
  stage: AgentLoopStage
  observation?: AgentLoopObservation
  analysis?: AgentLoopAnalysis
  recommendation?: AgentLoopRecommendation
  result: AgentLoopResult
  usage: LoopUsage
  createdAt: number
}

/** The final result of a loop pass — the "what now" the UI renders. */
export interface AgentLoopResult {
  stage: AgentLoopStage
  score: FoodSystemScore
  progress: LoopProgress
  recommendation: AgentLoopRecommendation
  summary: string
  usage: LoopUsage
}

/* ── Session ──────────────────────────────────────────────────────────────── */

/**
 * Agent-SDK-style controls carried on the session. Stubbed/enforced lightly now
 * (so budgets/permissions can be honoured later without reshaping the model).
 */
export interface LoopControls {
  maxTurns?: number
  /** Observation kinds this session is allowed to ingest (undefined = all). */
  allowedObservations?: ObservationKind[]
}

export interface AgentLoopSession {
  id: string
  foundationKey: FoundationKey
  system: LoopSystemKey
  baseline: FoodSystemBaseline
  currentStage: AgentLoopStage
  turns: AgentLoopTurn[]
  memory: FoodSystemMemory
  controls: LoopControls
  createdAt: number
  updatedAt: number
}
