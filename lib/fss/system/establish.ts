import type { Answers, FoodSystemScore } from "@/lib/fss/engine/score"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { buildPlan } from "@/lib/fss/action/plan"
import { resolvePriorities } from "@/lib/fss/action/priority"
import { toStoredAction } from "@/lib/fss/action/stored"
import { ACTION_SET_VERSION, type FoodSystemPlan, type Recommendation } from "@/lib/fss/action/types"
import type {
  FoodSystemRepository,
  StoredAction,
  StoredAssessment,
  StoredFoodSystem,
  StoredScore,
} from "@/lib/fss/persistence/repository"
import { toStoredPlanDecision, toStoredPriorityDecision } from "./decisions"
import { newId } from "./identity"
import { validateFoodSystem, type SystemCheck } from "./validate"
import { SYSTEM_MODEL_VERSION } from "./version"

/* ════════════════════════════════════════════════════════════════════════
   ESTABLISHING A FOOD SYSTEM.

   ══ `system.current` IS THE COMMIT POINT ════════════════════════════════════

   `localStorage` has no transactions, so THE ORDER IS THE SAFETY PROPERTY.
   There is no clever alternative available at this layer; there is only writing
   things in an order where the last write is the one that makes everything
   before it real.

     1  persist / verify the assessment
     2  persist the score + provenance
     3  persist the priority and plan decision references
     4  persist the initial action states
     5  persist `StoredFoodSystem`
     6  validate referential integrity
     7  write `system.current`          ← nothing is current until this line

   If an earlier step fails, ORPHANED RECORDS MAY EXIST. That is the accepted
   cost and it is the right one: an orphan is invisible and harmless, while a
   pointer to a half-written system is a Food System that renders with a missing
   score. The application must never expose a half-created current system.

   ══ WHY EVERY WRITE HERE IS STRICT ══════════════════════════════════════════

   `lib/fss/persistence/local.ts` has two write behaviours. The lenient one
   swallows storage failures and is used for the assessment in progress, where
   losing answers is recoverable and crashing is not. Every write below uses the
   strict one, which throws `RepositoryWriteFailed`.

   The reason is step 7. A silent failure at step 2 followed by a successful
   step 7 produces exactly the state this ordering exists to prevent. An order
   whose steps can fail quietly is not an order.

   ══ STEP 1 VERIFIES BY READING BACK ═════════════════════════════════════════

   The assessment write is the one lenient write in the repository, so it cannot
   report failure. Step 1 therefore SAVES AND THEN READS BACK, and treats a
   read-back that does not match as a failed step. That also catches a store
   which accepts a write and discards it, which no exception would have.

   ══ THIS IS THE ONLY PLACE THE ENGINES ARE CALLED ═══════════════════════════

   `resolvePriorities` and `buildPlan` SELECT. Selection happens once, here, and
   is written down under `SYSTEM_MODEL_VERSION`. Every later read resolves the
   stored decision through `lib/fss/system/decisions.ts` and never re-selects.
   `tests/unit/my-food-system.test.ts` asserts the composer calls neither.
   ════════════════════════════════════════════════════════════════════════ */

/** Why establishment stopped, when it did. Never a partial success. */
export type EstablishFailure =
  | { readonly step: 1; readonly reason: "assessment-not-persisted" }
  | { readonly step: 2 | 3 | 4 | 5 | 7; readonly reason: "write-failed"; readonly cause: unknown }
  | { readonly step: 6; readonly reason: "validation-failed"; readonly failed: SystemCheck }

export type EstablishResult =
  | { readonly ok: true; readonly systemId: string; readonly scoreId: string }
  | { readonly ok: false; readonly failure: EstablishFailure }

/** Every recommendation in a plan, as the initial `planned` action set. */
function initialActions(args: {
  plan: FoodSystemPlan
  scoreId: string
  createdAt: string
}): readonly StoredAction[] {
  const { plan, scoreId, createdAt } = args
  const chosen: Recommendation[] = [...(plan.today ? [plan.today] : []), ...plan.thisWeek]
  /*
   * The thirty-day focus is deliberately NOT an action. It is one behaviour to
   * hold for a month, with a reassessment point — not something to tick, and
   * giving it a `done` state would turn a month into a checkbox.
   */
  return chosen.map((recommendation) =>
    toStoredAction({
      id: newId("action"),
      scoreId,
      recommendation,
      state: "planned",
      createdAt,
    }),
  )
}

/**
 * Establish a Food System from a completed assessment and its score.
 *
 * `now` is a parameter. The three timestamps written here — `computedAt`,
 * `decidedAt`, `establishedAt` — are all this one instant, which is true (they
 * happen in one act) and makes the records diffable in a test.
 */
export async function establishFoodSystem(args: {
  repo: FoodSystemRepository
  set: ResolvedQuestionSet
  answers: Answers
  score: FoodSystemScore
  assessment: StoredAssessment
  now: string
}): Promise<EstablishResult> {
  const { repo, set, answers, score, assessment, now } = args

  const scoreId = newId("score")
  const systemId = newId("system")

  /* ── 1 · the assessment, persisted and verified by read-back ──────────── */
  await repo.saveAssessment(assessment)
  const readBack = await repo.loadAssessment(assessment.id)
  if (
    !readBack ||
    readBack.id !== assessment.id ||
    readBack.questionSetVersion !== assessment.questionSetVersion ||
    Object.keys(readBack.answers).length !== Object.keys(assessment.answers).length
  ) {
    return { ok: false, failure: { step: 1, reason: "assessment-not-persisted" } }
  }

  /*
   * Selection happens here and nowhere else. Both engines are called once, on
   * this instant's inputs, and what they decided is what gets written down.
   */
  const priorities = resolvePriorities({ score, set, answers })
  const plan = buildPlan({ score, set, answers })

  const stored: StoredScore = {
    id: scoreId,
    assessmentId: assessment.id,
    state: score.state,
    ...(typeof score.score === "number" ? { score: score.score } : {}),
    domains: score.domains.map((d) => ({
      domain: d.domain,
      state: d.state,
      ...(d.state === "scored" ? { score: d.score } : {}),
    })),
    completeness: score.completeness,
    provenance: score.provenance,
    computedAt: now,
  }

  const actions = initialActions({ plan, scoreId, createdAt: now })

  const system: StoredFoodSystem = {
    id: systemId,
    assessmentId: assessment.id,
    scoreId,
    establishedAt: now,
    systemModelVersion: SYSTEM_MODEL_VERSION,
    actionSetVersion: ACTION_SET_VERSION,
  }

  /* ── 2-5 · every write strict, each step reporting its own number ─────── */
  const step = async (n: 2 | 3 | 4 | 5 | 7, run: () => Promise<void>): Promise<EstablishFailure | null> => {
    try {
      await run()
      return null
    } catch (cause) {
      return { step: n, reason: "write-failed", cause }
    }
  }

  let failure =
    (await step(2, () => repo.saveScore(stored))) ??
    (await step(3, async () => {
      await repo.savePriorityDecision(toStoredPriorityDecision({ scoreId, priorities, decidedAt: now }))
      await repo.savePlanDecision(toStoredPlanDecision({ scoreId, plan, decidedAt: now }))
    })) ??
    (await step(4, async () => {
      for (const action of actions) await repo.saveAction(action)
    })) ??
    (await step(5, () => repo.saveSystem(system)))
  if (failure) return { ok: false, failure }

  /* ── 6 · validate before committing, not after ────────────────────────── */
  const verdict = validateFoodSystem({
    system,
    assessment: readBack,
    score: stored,
    priorityDecision: await repo.loadPriorityDecision(scoreId),
    planDecision: await repo.loadPlanDecision(scoreId),
    actions: await repo.loadActions(scoreId),
  })
  if (!verdict.ok) {
    return { ok: false, failure: { step: 6, reason: "validation-failed", failed: verdict.failed } }
  }

  /* ── 7 · the commit point ─────────────────────────────────────────────── */
  failure = await step(7, () => repo.setCurrentSystem(systemId))
  if (failure) return { ok: false, failure }

  return { ok: true, systemId, scoreId }
}
