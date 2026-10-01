import type { Answers, FoodSystemScore } from "@/lib/fss/engine/score"
import { FSS_V1_PROVENANCE, type ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { ACTION_CATALOGUE, REASSESSMENT, THIRTY_DAY_FOCUS } from "./catalogue"
import { isOfferable, readFoodContext } from "./context"
import { resolvePriorities } from "./priority"
import {
  ACTION_SET_VERSION,
  THIS_WEEK_MAX,
  type CatalogueEntry,
  type FoodSystemPlan,
  type Recommendation,
  type ReportedContext,
  type ResolvedPriority,
  type ThirtyDayFocus,
  type TimeHorizon,
} from "./types"

/* ════════════════════════════════════════════════════════════════════════
   Your Plan.

   ── The four questions, and which field answers each ──────────────────────

     What matters most?            `priorities`, each with its evidence
     What should I do?             `today`, `thisWeek`, `thirtyDays`
     Why this?                     every rationale, plus its priority's evidence
     How do I make it practical?   `practicalAction` + `suggestedFrequency`,
                                   already filtered by `context`

   ── Deterministic, and that is a property not a preference ────────────────

   No AI, no randomness, and no clock. The same answers give a byte-identical
   plan on every run, which is what lets a test compare two plans directly —
   and what lets a reviewer reproduce exactly what a person was shown.

   AI IS NOT THE RECOMMENDATION AUTHORITY, and in this layer it is not present
   at all: nothing here calls a model, and an import fence proves it. A model
   may eventually help with wording inside reviewed bounds; it may not invent
   methodology, and the order matters — build the deterministic layer first, so
   there is something for a model to be held to.

   ── The three horizons, and the one rule they share ───────────────────────

     Today        EXACTLY ONE action for the whole plan, or none
     This Week    a small set, capped at THIS_WEEK_MAX
     30 Days      one behaviour to hold, and a reassessment point

   Today is one action for the PLAN, not one per priority. A plan that opens
   with three things to do today has not prioritised anything, which is the
   failure this whole layer is meant to replace.

   Every horizon says WHEN YOU DO IT and never when it works. See `horizons.ts`.
   ════════════════════════════════════════════════════════════════════════ */

/** Bind reviewed content to one person's priority. */
function bind(
  entry: CatalogueEntry,
  priority: ResolvedPriority,
  provenance: ScoreProvenance,
): Recommendation {
  return {
    ...entry,
    priorityId: priority.id,
    sourceDomain: priority.sourceDomain,
    status: "candidate-pending-review",
    provenance,
    actionSetVersion: ACTION_SET_VERSION,
  }
}

/** This priority's offerable entries for one horizon, in catalogue order. */
function offerable(
  priority: ResolvedPriority,
  horizon: TimeHorizon,
  context: ReportedContext,
): readonly CatalogueEntry[] {
  return ACTION_CATALOGUE.filter(
    (e) =>
      e.domain === priority.sourceDomain &&
      e.timeHorizon === horizon &&
      isOfferable(e.requires, context),
  )
}

/**
 * The weekly set — round-robin across the priorities, capped.
 *
 * ── Why round-robin rather than filling from the first priority ───────────
 *
 * Because with three tied priorities, taking three actions from the first one
 * would present a plan about one domain while claiming three mattered equally.
 * Round-robin gives each priority its first action before any gets a second,
 * so breadth when there are several and depth when there is one — which is the
 * behaviour the selection rule implies rather than a separate preference.
 *
 * Deterministic: catalogue order within a priority, priority order across
 * them, and `THIS_WEEK_MAX` stops it.
 */
function weeklySet(
  priorities: readonly ResolvedPriority[],
  context: ReportedContext,
  provenance: ScoreProvenance,
): readonly Recommendation[] {
  const queues = priorities.map((p) => ({ p, rest: [...offerable(p, "this-week", context)] }))
  const out: Recommendation[] = []

  let progressed = true
  while (out.length < THIS_WEEK_MAX && progressed) {
    progressed = false
    for (const q of queues) {
      if (out.length >= THIS_WEEK_MAX) break
      const next = q.rest.shift()
      if (!next) continue
      out.push(bind(next, q.p, provenance))
      progressed = true
    }
  }

  return out
}

/**
 * The month: one behaviour, and the point at which reassessing makes sense.
 *
 * Taken from the FIRST priority, because a month spent holding three things is
 * a month spent holding none. `whyThisOne` is reviewed copy per domain, and
 * nothing here composes a sentence.
 */
function thirtyDayFocus(priority: ResolvedPriority): ThirtyDayFocus {
  const copy = THIRTY_DAY_FOCUS[priority.sourceDomain]
  return {
    sourcePriorityId: priority.id,
    sourceDomain: priority.sourceDomain,
    behaviour: copy.behaviour,
    whyThisOne: copy.whyThisOne,
    reassessment: REASSESSMENT,
    /*
     * `whyThisOne` names what the person's answers described and what a month
     * is for finding out. It makes no claim about what holding the behaviour
     * will produce — which is why this is observed behaviour rather than a
     * recommendation with an outcome attached.
     */
    claimClass: "observed-behaviour",
    status: "candidate-pending-review",
  }
}

/**
 * Build Your Plan from a candidate result.
 *
 * Returns an empty plan — no today, no week, no month — when no priority can
 * be named at all. The surface must say so; an empty section reads as a bug,
 * and `PRIORITY_COPY.noneAvailable` is the sentence for it.
 */
export function buildPlan(args: {
  score: FoodSystemScore
  set: ResolvedQuestionSet
  answers: Answers
  provenance?: ScoreProvenance
}): FoodSystemPlan {
  const { score, set, answers } = args
  const provenance = args.provenance ?? score.provenance ?? FSS_V1_PROVENANCE

  const priorities = resolvePriorities({ score, set, answers, provenance })
  const context = readFoodContext(set, answers)

  const base = {
    actionSetVersion: ACTION_SET_VERSION,
    provenance,
    priorities,
    context,
  } as const

  if (priorities.length === 0) {
    return { ...base, today: null, thisWeek: [], thirtyDays: null }
  }

  /*
   * ONE action for today, across the whole plan.
   *
   * Taken from the first priority that has an offerable one. The fall-through
   * should never fire — every domain carries an unconditional Today entry and
   * a test holds that — but a plan whose opening action silently vanished
   * would be worse than one that looked somewhere else for it.
   */
  let today: Recommendation | null = null
  for (const p of priorities) {
    const candidate = offerable(p, "today", context)[0]
    if (candidate) {
      today = bind(candidate, p, provenance)
      break
    }
  }

  return {
    ...base,
    today,
    thisWeek: weeklySet(priorities, context, provenance),
    thirtyDays: thirtyDayFocus(priorities[0]),
  }
}
