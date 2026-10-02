import type { Answers, FoodSystemScore } from "@/lib/fss/engine/score"
import { DOMAIN_SCHEMA_VERSION } from "@/lib/fss/questions/domain-schema"
import type { ResolvedQuestionSet } from "@/lib/fss/questions/types"
import { buildPlan } from "@/lib/fss/action/plan"
import { resolvePriorities } from "@/lib/fss/action/priority"
import { toStoredAction } from "@/lib/fss/action/stored"
import { ACTION_SET_VERSION, type FoodSystemPlan, type Recommendation } from "@/lib/fss/action/types"
import type {
  FoodSystemRepository,
  StoredAction,
  StoredAssessment,
  StoredAssessmentDraft,
  StoredFoodSystem,
  StoredScore,
} from "@/lib/fss/persistence/repository"
import { toStoredPlanDecision, toStoredPriorityDecision } from "./decisions"
import { abandonDraft } from "./draft"
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
 *
 * ══ IT CREATES. IT NEVER REWRITES WHAT CAME BEFORE. ═════════════════════════
 *
 * Called for the baseline AND for every reassessment, and the only difference
 * is `previousSystemId`. Nothing here reads, updates, re-keys or deletes a
 * record belonging to an earlier system — not the assessment, not the score,
 * not the decisions, not the actions, and not the earlier `StoredFoodSystem`
 * itself. The new record points BACK; the old one is never touched.
 *
 * That is what makes the chain safe to walk and the baseline safe to trust:
 * `tests/unit/my-food-system.test.ts` asserts every baseline record is
 * byte-identical after a second and a third system are established, which is
 * the defining invariant of longitudinal EatoBiotics.
 *
 * ══ THE ASSESSMENT ID IS MINTED HERE, FROM A DRAFT ══════════════════════════
 *
 * The caller passes the DRAFT. This mints the immutable assessment out of it.
 * Before Gate 5 the caller passed an assessment keyed by the literal
 * `"candidate"`, so a second one landed on the first one's record — and the
 * identity check could not see it, because `"candidate" === "candidate"`.
 */
export async function establishFoodSystem(args: {
  repo: FoodSystemRepository
  set: ResolvedQuestionSet
  answers: Answers
  score: FoodSystemScore
  /** The attempt this is being established from. Its `id` becomes the assessment's. */
  draft: StoredAssessmentDraft
  now: string
}): Promise<EstablishResult> {
  const { repo, set, answers, score, draft, now } = args

  const scoreId = newId("score")
  const systemId = newId("system")

  /*
   * The completed assessment: minted from the draft, immutable from here.
   *
   * `completedAt` is set exactly once, now. `startedAt` is the draft's, which
   * is the real one — the moment this attempt began, not the moment it ended.
   */
  const assessment: StoredAssessment = {
    id: draft.id,
    assessmentVersion: draft.assessmentVersion,
    questionSetVersion: draft.questionSetVersion,
    answers,
    startedAt: draft.startedAt,
    completedAt: now,
  }

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
    /*
     * Recorded AT WRITE TIME, which is the only moment it is knowable.
     *
     * The `domains` array above was composed under today's schema. Reading the
     * constant later and assuming it applied would be the backfill that
     * `LEGACY_UNVERSIONED` exists to refuse one layer down.
     */
    domainSchemaVersion: DOMAIN_SCHEMA_VERSION,
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
    /*
     * The link is taken from the DRAFT, not read fresh from the pointer here.
     *
     * The draft recorded which system this attempt was started against. If the
     * pointer had moved in between — two tabs, say — reading it now would
     * chain this system to one the person never saw, and the chain would claim
     * a lineage that did not happen.
     */
    previousSystemId: draft.previousSystemId,
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
    /*
     * The predecessor is RESOLVED here, not assumed.
     *
     * Validation refuses a non-baseline system whose predecessor is not there,
     * and this is the step that has to satisfy it — which means a reassessment
     * cannot be committed against a system that has vanished from storage
     * between the attempt starting and finishing. The chain is checked before
     * the pointer moves, not after somebody is already looking at it.
     */
    ...(system.previousSystemId !== null
      ? { previousSystem: await repo.loadSystem(system.previousSystemId) }
      : {}),
  })
  if (!verdict.ok) {
    return { ok: false, failure: { step: 6, reason: "validation-failed", failed: verdict.failed } }
  }

  /* ── 7 · the commit point ─────────────────────────────────────────────── */
  failure = await step(7, () => repo.setCurrentSystem(systemId))
  if (failure) return { ok: false, failure }

  /*
   * ── 8 · AND ONLY NOW IS THE DRAFT CLEARED ───────────────────────────────
   *
   * After the pointer, never before. Every earlier return in this function
   * leaves the draft exactly where it is, so a failed establishment leaves the
   * OLD system current and the attempt recoverable. Clearing it on a failure
   * path would discard somebody's answers to tidy up after ourselves.
   *
   * Its own step, and deliberately NOT one whose failure fails the
   * establishment: the system is already current and correct at this point. A
   * draft that survives is a stale record, which the loader reports and the
   * person can discard — strictly better than reporting a successful
   * establishment as a failure.
   */
  await abandonDraft({ repo, draftId: draft.id }).catch(() => {})

  return { ok: true, systemId, scoreId }
}
