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
import { BIOTIC_FOOD_HINTS } from "../biotics"
import { behaviourFor } from "../behaviour"
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

    /*
     * ── GATE 3.6: THESE SENTENCES NAME A FOOD PATTERN, NOT A BIOTIC ──────
     *
     * They used to read "Prebiotics remains your strongest area" and "Your
     * Prebiotics look settled, while Postbiotics appear lower". The `why` built
     * from that rationale renders on /account, which is V1_CORE — so a paying
     * member was being told the state of their Postbiotics, which neither this
     * provider nor anything upstream of it measures.
     *
     * `baseline.biotics.strongest/weakest` is still what RANKS them, and that
     * is fine: it is a rank over the person's own answers, used to pick which
     * food pattern to talk about. What changed is that the rank is reported as
     * a pattern ("fermented foods") rather than as a Biotic ("Probiotics").
     *
     * Note the comparative is between the person's OWN patterns and carries no
     * outcome — "looks like the greater opportunity", never "will improve".
     */
    /*
     * `bioticsSource` decides BOTH the vocabulary and the attribution, because
     * on /account these numbers are averaged meal sub-scores and on the
     * foundation path they are assessment answers. Saying "your answers" for
     * the first, or "eating rhythm" for a meal bucket that measures
     * polyphenol-rich foods, is an unsupported claim about where a finding came
     * from — small, and exactly the kind this gate exists to remove.
     */
    const src = baseline.bioticsSource
    const described = src === "meals" ? "Your recent meals describe" : "Your answers described"

    improving.push(`One of your stronger patterns: ${behaviourFor(strongest, src)}.`)
    needsAttention.push(
      `The bigger opportunity right now: ${behaviourFor(weakest, src)}.`,
    )

    const rationale =
      `${described} ${behaviourFor(strongest, src)} as one of your steadier patterns, ` +
      `and ${behaviourFor(weakest, src)} as the greater opportunity. Small, repeatable ` +
      `food changes here are usually the most direct place to start.`

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
      ` Focusing on ${behaviourFor(target, baseline.bioticsSource)} is where there is the most room right now.`

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
