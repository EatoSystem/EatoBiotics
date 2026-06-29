/**
 * EatoBiotics Agent Loop — default deterministic provider.
 *
 * Rule-based analyse/recommend with NO AI and NO network. It reasons over the
 * baseline three-biotics profile, the focus biotic of the active system, and the
 * observation, producing exactly ONE food-first next action. This is the proof
 * that the loop is product-first: everything works before any LLM is connected.
 */

import type {
  AgentLoopAnalysis,
  AgentLoopObservation,
  AgentLoopRecommendation,
  BioticKey,
} from "../types"
import { BIOTIC_LABELS, BIOTIC_FOOD_HINTS } from "../biotics"
import { getSystem } from "../systems"
import { LOOP_DISCLAIMER } from "../safety"
import type { LoopIntelligenceProvider, ProviderContext } from "./provider"

const ID = "deterministic"

/** Which biotic an observation most relates to (best-effort, deterministic). */
function relatedBiotic(o: AgentLoopObservation): BioticKey | undefined {
  switch (o.kind) {
    case "cravings":
    case "energy":
      return "prebiotics"
    case "digestion":
    case "symptom":
      return "probiotics"
    case "sleep":
    case "activity":
      return "postbiotics"
    default:
      return undefined
  }
}

function rid(): string {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export class DeterministicProvider implements LoopIntelligenceProvider {
  readonly id = ID

  analyse(observation: AgentLoopObservation, ctx: ProviderContext): AgentLoopAnalysis {
    const { baseline, history } = ctx
    const weakest = baseline.biotics.weakest
    const strongest = baseline.biotics.strongest
    const related = relatedBiotic(observation)

    const priorObservations = history.filter((t) => t.observation).length
    const changes: string[] = []
    const trends: string[] = []
    const improving: string[] = []
    const needsAttention: string[] = []

    if (priorObservations === 0) {
      changes.push("This is your first observation against your baseline.")
    } else {
      changes.push(`Logged against ${priorObservations + 1} observations so far.`)
      trends.push(
        priorObservations >= 2
          ? "Enough history to start seeing patterns over time."
          : "A pattern will emerge as you add a few more observations.",
      )
    }

    improving.push(`${BIOTIC_LABELS[strongest]} remains your strongest area.`)
    needsAttention.push(
      `${BIOTIC_LABELS[weakest]} appears lower — a gentle place to focus next.`,
    )

    const rationale =
      `Your ${BIOTIC_LABELS[strongest]} look settled, while ${BIOTIC_LABELS[weakest]} ` +
      `appear lower. Small, repeatable food changes here tend to move your Food System Score most.`

    return {
      changes,
      trends,
      improving,
      needsAttention,
      relatedBiotic: related ?? weakest,
      rationale,
    }
  }

  recommend(analysis: AgentLoopAnalysis, ctx: ProviderContext): AgentLoopRecommendation {
    const { baseline, system, memory } = ctx
    const focus = getSystem(system).loop.focusBiotic
    // Bias toward the system's focus biotic, but if the baseline weakest differs
    // and is meaningfully low, prioritise the weakest (one action only).
    const weakest = baseline.biotics.weakest
    const target: BioticKey =
      baseline.biotics[weakest].score < baseline.biotics[focus].score ? weakest : focus

    const hint = BIOTIC_FOOD_HINTS[target]
    const baseAction = `Add one serving of ${hint} to two meals this week.`

    // Light "learn": if this exact action was ignored before, soften to a tiny step.
    const ignoredBefore = memory.outcomes.some(
      (o) => o.status === "ignored" && o.action === baseAction,
    )
    const action = ignoredBefore
      ? `Add one serving of ${hint} to a single meal this week.`
      : baseAction

    const why =
      analysis.rationale +
      ` Focusing on ${BIOTIC_LABELS[target]} supports the area with the most room to grow.`

    return {
      id: rid(),
      action,
      why,
      category: "food-first",
      targetBiotic: target,
      effort: ignoredBefore ? "tiny" : "small",
      disclaimer: LOOP_DISCLAIMER,
    }
  }
}

export const deterministicProvider = new DeterministicProvider()
