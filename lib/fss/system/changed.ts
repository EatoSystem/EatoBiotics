import type { Answers } from "@/lib/fss/engine/score"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import type { ContextConstraint } from "@/lib/fss/action/types"
import { readFoodContext } from "@/lib/fss/action/context"
import { SPOKEN_ORDER } from "@/lib/fss/presentation/changed-order"
import type { ActionState, FoodSystemRepository } from "@/lib/fss/persistence/repository"
import { ACTION_STATES } from "@/lib/fss/persistence/repository"
import { compareSystems, type ComparisonUnavailable, type FoodSystemComparison } from "./compare-systems"

/* ════════════════════════════════════════════════════════════════════════
   WHAT CHANGED — the facts, before anybody says anything about them.

   ══ THE DIVISION OF LABOUR WITH 2B ════════════════════════════════════════

     `compare-systems.ts`  may these two Food Systems be compared, and how?
     this module            what, factually, is different?
     `presentation/changed` what a reviewed sentence is allowed to say about it

   So this file HOLDS NO PROSE and decides NO comparability. It references the
   comparison WHOLE — the same "composition of trusted objects" rule
   `MyFoodSystem` runs under — and adds only the three classes 2b has no
   opinion about, because they are not scores: what the person noticed, what
   their circumstances were, and what they marked done.

   ══ CO-OCCURRENCE IS NOT CAUSATION ════════════════════════════════════════

   All three of these can be true of one period:

     an action was marked done · the score moved · an observation changed

   and the product may show them together. It may NEVER join them. There is no
   function here that takes actions and changes together and returns anything,
   the types carry no field in which a cause could be recorded, and the
   behavioural guard in `tests/unit/agent-loop-claims.test.ts` reads what the
   generators actually produce.

   ══ THE UNSCORED CLASSES BORROW 2B'S AUTHORITY RATHER THAN INVENT ONE ═════

   An observation has no provenance — nobody scored it — so there is nothing
   to version. But comparing two answers still requires that they answered THE
   SAME QUESTION, and a question set that moved makes "you answered differently"
   a comparison of two different questions.

   `canCompare` already refuses `different-question-set`, so a COMPARABLE score
   verdict is exactly the guarantee needed, and this module takes it rather than
   adding a sixth axis. That is conservative in one direction on purpose: a
   method change that happened to leave the question set alone declines the
   observation comparison too. One longitudinal truth system beats a more
   permissive second one.
   ════════════════════════════════════════════════════════════════════════ */

/* ── The three classes 2b does not cover ───────────────────────────────── */

/**
 * One What You Notice answer, across two assessments.
 *
 * ── NO DIRECTION FIELD, AND NO NUMBER ─────────────────────────────────────
 *
 * A changed answer about energy is a changed answer. Ranking two option labels
 * would require an ordinal model of each question that nobody has reviewed, and
 * the moment a `direction` existed here some surface would render it as an
 * outcome — "your energy improved" — which is the claim this product cannot
 * make from a questionnaire. The type has nowhere to put one.
 *
 * Both labels are carried verbatim so a surface can quote them. Quoting is the
 * strongest honest move available: the person sees what they said then and what
 * they say now, and EatoBiotics asserts no relation between the two.
 */
export interface ObservationChange {
  readonly questionId: string
  readonly order: number
  readonly question: string
  /** The option label chosen at the previous assessment, or null if skipped. */
  readonly previous: string | null
  readonly current: string | null
  readonly state: "same" | "different" | "newly-answered" | "no-longer-answered"
}

/**
 * One Food Context constraint, across two assessments.
 *
 * ── A CONSTRAINT CHANGING IS NEVER AN OUTCOME ─────────────────────────────
 *
 * Someone reporting that time is no longer in the way is a circumstance they
 * described differently. It is not evidence that anything improved, and it is
 * emphatically not something the product did. So there is no value, no score
 * and no direction here — three states and a name.
 *
 * Food Context reaches the Score by no path (`lib/fss/engine/score.ts` throws
 * if one does), and this type keeps that true of the comparison as well.
 */
export interface ContextChange {
  readonly constraint: ContextConstraint
  readonly state: "appeared" | "disappeared" | "unchanged"
}

/** What the person marked, counted. No outcome, no benefit, no effect. */
export interface ActionFacts {
  readonly planned: number
  readonly done: number
  readonly skipped: number
  /** `planned + done + skipped` — the denominator a sentence may quote. */
  readonly total: number
}

/* ── The aggregate ─────────────────────────────────────────────────────── */

export type WhatChanged =
  /** One system. Nothing to compare, and NOT a failure. */
  | { readonly state: "no-predecessor"; readonly currentSystemId: string }
  | {
      readonly state: "unavailable"
      readonly currentSystemId: string
      readonly failed: ComparisonUnavailable
    }
  | {
      readonly state: "available"
      /**
       * Referenced WHOLE. The score and domain facts are read THROUGH this,
       * never copied up — so there is exactly one place that decided whether
       * either may be shown, and no second copy to disagree with it.
       */
      readonly comparison: ComparableComparison
      /** Absent when the score verdict refused. Not empty — absent. */
      readonly observations?: readonly ObservationChange[]
      readonly context?: readonly ContextChange[]
      /** Always present: counting what somebody marked needs no permission. */
      readonly actions: ActionFacts
    }

/** The three 2b states that have a predecessor to speak about. */
export type ComparableComparison = Extract<
  FoodSystemComparison,
  { state: "refused" | "score-only-comparable" | "fully-comparable" }
>

/* ── Building it ───────────────────────────────────────────────────────── */

export async function readWhatChanged(args: {
  repo: FoodSystemRepository
  set: ResolvedQuestionSet
  /** The system being VIEWED. Its `previousSystemId` picks the partner. */
  systemId: string
}): Promise<WhatChanged> {
  const { repo, set, systemId } = args

  const comparison = await compareSystems({ repo, systemId })
  if (comparison.state === "no-predecessor" || comparison.state === "unavailable") {
    return comparison
  }

  const current = await repo.loadSystem(comparison.currentSystemId)
  const previous = await repo.loadSystem(comparison.previousSystemId)
  if (!current || !previous) {
    return { state: "unavailable", currentSystemId: systemId, failed: "system-record-missing" }
  }

  /*
   * THE ACTIONS COUNTED ARE THE PREVIOUS SYSTEM'S, AND THAT IS THE WHOLE POINT.
   *
   * A's actions are the plan that was in force during the period being
   * compared — they are what the person marked while living between the two
   * assessments. B's actions were created moments ago by the reassessment, so
   * they are all still `planned`: counting those would show "0 of 9 done"
   * immediately after every reassessment and quietly erase the period's record.
   */
  const actions = countActions(await repo.loadActions(previous.scoreId))

  /*
   * The unscored classes need both answer sheets, and a score verdict that
   * guarantees the same question set. When it refused, they are ABSENT rather
   * than empty — an empty list says "nothing changed", which is a claim.
   */
  if (!comparison.scoreVerdict.comparable) {
    return { state: "available", comparison, actions }
  }

  const previousAssessment = await repo.loadAssessment(previous.assessmentId)
  const currentAssessment = await repo.loadAssessment(current.assessmentId)
  if (!previousAssessment || !currentAssessment) {
    return { state: "available", comparison, actions }
  }

  return {
    state: "available",
    comparison,
    observations: readObservationChanges(set, previousAssessment.answers, currentAssessment.answers),
    context: readContextChanges(set, previousAssessment.answers, currentAssessment.answers),
    actions,
  }
}

/* ── The counting, which is all this module does ───────────────────────── */

function countActions(actions: readonly { readonly state: ActionState }[]): ActionFacts {
  const of = (s: ActionState) => actions.filter((a) => a.state === s).length
  /*
   * Iterated from `ACTION_STATES` rather than written out, so a fourth state
   * cannot be added to the union and silently vanish from the total.
   */
  const total = ACTION_STATES.reduce((n, s) => n + of(s), 0)
  return { planned: of("planned"), done: of("done"), skipped: of("skipped"), total }
}

function labelFor(
  set: ResolvedQuestionSet,
  questionId: string,
  value: number | undefined,
): string | null {
  const q = set.questions.find((x) => x.id === questionId)
  return q?.options.find((o) => o.value === value)?.label ?? null
}

function readObservationChanges(
  set: ResolvedQuestionSet,
  before: Answers,
  after: Answers,
): readonly ObservationChange[] {
  return set.questions
    .filter((q) => q.contributes === "what-you-notice")
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q) => {
      const a = before[q.id]
      const b = after[q.id]
      const previous = labelFor(set, q.id, a)
      const current = labelFor(set, q.id, b)

      const state: ObservationChange["state"] =
        previous === null && current === null
          ? "same"
          : previous === null
            ? "newly-answered"
            : current === null
              ? "no-longer-answered"
              : a === b
                ? "same"
                : "different"

      return { questionId: q.id, order: q.order, question: q.text, previous, current, state }
    })
}

/**
 * Constraint states, across two assessments.
 *
 * Reuses `readFoodContext` on each answer sheet rather than re-deriving the
 * 0–3-to-state mapping, because a second copy of that mapping is how two
 * surfaces come to disagree about whether somebody is short of time.
 *
 * `appeared`/`disappeared` are about the `limiting` state only. A constraint
 * moving between `workable` and `free` is not something this product has any
 * business narrating, so it reads as `unchanged`.
 */
function readContextChanges(
  set: ResolvedQuestionSet,
  before: Answers,
  after: Answers,
): readonly ContextChange[] {
  const a = readFoodContext(set, before)
  const b = readFoodContext(set, after)

  /*
   * THE INSTRUMENT'S OWN ORDER, not alphabetical.
   *
   * Reading this rendered showed "access, cost, kitchen, time" — a list in an
   * order nothing else in the product uses. `plan.ts` already decided this
   * question and wrote down why; using a second order here would have been
   * two answers to one question.
   */
  return SPOKEN_ORDER.filter((c) => c in b.states).map((constraint) => {
    const was = a.states[constraint] === "limiting"
    const is = b.states[constraint] === "limiting"
    return {
      constraint,
      state: was === is ? "unchanged" : is ? "appeared" : "disappeared",
    }
  })
}
