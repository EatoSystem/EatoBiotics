import type { Answers } from "@/lib/fss/engine/score"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { ActionCategory, TimeHorizon } from "@/lib/fss/action/types"
import type { FssDomain } from "@/lib/fss/questions/types"

/* ════════════════════════════════════════════════════════════════════════
   The persistence seam.

   ── The rule this exists to make structural ───────────────────────────────

   NO UI COMPONENT KNOWS WHICH BACKEND IS ACTIVE. If one does, the eventual
   move from local storage to Supabase stops being a substitution and becomes a
   product rewrite — and the whole reason for an interface here is that the
   move must be the former.

   ── Why local is the DEFAULT and not the fallback ─────────────────────────

   Agent sessions are read-only against production Supabase, and no FSS
   migration may be drafted before the domain set has scientific sign-off —
   writing the columns first creates pressure to keep them, and a column name is
   a methodology decision wearing a schema costume.

   So the candidate runtime persists locally and completely. The repository
   already does this twice — lib/stability/storage.ts and the Living Twin's
   twin_state — and both proved the same thing: a local-first feature is fully
   walkable, fully testable, and owes production nothing.

   ── What every record carries, and why the plan field is the load-bearing one ─

   A stored score carries its full provenance, because the live defect is
   scores that exist without a record of which method made them.

   A stored PLAN or ACTION additionally carries the priority and domain it came
   from and the methodology version in force when it was recommended. That is
   the field most easily dropped and the most expensive to lose: without it,
   nobody can reconstruct WHY EatoBiotics recommended something once the model
   has moved on. A recommendation whose reasoning cannot be reconstructed is not
   auditable, and this product's entire claim to care about its claims rests on
   being auditable.
   ════════════════════════════════════════════════════════════════════════ */

/** An assessment in progress or complete. */
export interface StoredAssessment {
  readonly id: string
  readonly assessmentVersion: string
  readonly questionSetVersion: string
  readonly answers: Answers
  readonly startedAt: string
  readonly completedAt?: string
}

/** A computed score, with the provenance that makes it interpretable. */
export interface StoredScore {
  readonly id: string
  readonly assessmentId: string
  readonly state: "scored" | "withheld"
  readonly score?: number
  readonly domains: readonly { readonly domain: string; readonly state: string; readonly score?: number }[]
  readonly completeness: number
  readonly provenance: ScoreProvenance
  readonly computedAt: string
}

/* ════════════════════════════════════════════════════════════════════════
   HUMAN STATE — the one category of information this product does not derive.

   Persist facts. Persist decisions. Persist human state. Derive explanations.

   A fact is what somebody answered. A decision is what EatoBiotics selected for
   them, under a named policy. Human state is the third thing and the only one
   neither of those can produce: whether the person intends to do it, did it, or
   chose not to.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Where a person stands on one action.
 *
 * ── Three states, and both terminal ones are reversible ───────────────────
 *
 * `planned` is the state an action is created in; `done` and `skipped` are
 * where a person puts it, and either can go back to `planned`. Nothing here is
 * a one-way door, because a person who marked the wrong row should not have to
 * live with it, and an irreversible transition in a self-tracking tool quietly
 * turns a record into a verdict.
 *
 * ── This NARROWED an existing union, and that is said out loud ────────────
 *
 * It was `"proposed" | "accepted" | "completed" | "dismissed"`. Two problems.
 * `proposed → accepted` is a two-step intent model nobody asked for, so every
 * surface would have had to decide what "accepted but not completed" looks
 * like. And `accepted` vs `completed` is the distinction a habit tracker is
 * built on, which is explicitly deferred.
 *
 * It was free to narrow for ONE reason: no row existed. `saveAction` had no
 * caller, the store is `localStorage`, and the route is fail-closed in
 * production — the same argument `lib/report/frozen-copy.ts` used while zero
 * Reports existed. THE ARGUMENT EXPIRES THE MOMENT A ROW IS WRITTEN. From Gate
 * 4 onwards, rows exist, and a future change to this union is a migration.
 *
 * ── What is NOT here, and why ─────────────────────────────────────────────
 *
 * No outcome. No benefit. No effect. No "improved". A completed action is a
 * thing a person reports having done, and this product cannot see what it did
 * inside them — so the record does not have a field in which to pretend
 * otherwise. `tests/unit/my-food-system.test.ts` refuses outcome vocabulary
 * anywhere near a transition.
 *
 * ── One naming hazard, said here so nobody has to rediscover it ───────────
 *
 * `StoredActionResolution.state` in `lib/fss/action/stored.ts` is ALSO called
 * `state` and means something completely different: whether the stored record
 * could be read back against the current catalogue at all
 * (`"resolved" | "unresolvable"`). The two appear within a few lines of each
 * other in the composer. They are different axes — one is where the PERSON
 * stands, one is whether the CONTENT still resolves — and an action can be
 * `done` and `unresolvable` at the same time.
 */
export type ActionState = "planned" | "done" | "skipped"

/** Every state, for a guard that must iterate them rather than guess. */
export const ACTION_STATES: readonly ActionState[] = ["planned", "done", "skipped"]

/**
 * A recommendation, as stored. Gate 2 declared this; Gate 3 completed it.
 *
 * ── IT STORES IDS AND VERSIONS, AND NEVER THE PROSE ───────────────────────
 *
 * The sentence a person was shown is reconstructed from the versioned
 * catalogue, not copied in here. That is the whole reason the two version
 * fields exist: a stored action whose `actionSetVersion` no longer resolves
 * must read as *recommended under a method that has moved*, rather than
 * silently showing today's wording for yesterday's recommendation.
 *
 * It is the same refusal `legacy-unversioned` makes for scores, one layer up,
 * and `lib/fss/action/stored.ts` is where it is enforced.
 *
 * ── WHY THERE ARE TWO VERSIONS AND NOT ONE ────────────────────────────────
 *
 * `provenance` says which METHOD scored the person. `actionSetVersion` says
 * which CONTENT recommended to them. Both are needed to reconstruct why
 * EatoBiotics said something, and they move independently — reviewed wording
 * can change without any arithmetic changing.
 *
 * The obvious move would be a sixth field on `ScoreProvenance`. It is refused:
 * that type's five fields are asserted by value in Gate 2's tests, and
 * widening it would change what every existing candidate score claims about
 * itself. The €49 Report reached the same conclusion independently, carrying
 * `composerVersion` and `contentPackVersion` beside its schema version rather
 * than inside it.
 *
 * ── AND WHY IT STILL HAS NO CALLER ────────────────────────────────────────
 *
 * Because Your Plan is deterministic from the answers, so nothing about it
 * needs storing, and nothing about a person's intent should be persisted
 * before anybody asked for it. The only thing that would genuinely belong here
 * is a person's own relationship to a recommendation — started, dismissed —
 * which no surface offers yet.
 *
 * `scoreId` also has no source yet: the walk holds its score in component
 * state and `saveScore` is likewise uncalled. Those two calls arrive together
 * or not at all; minting a `scoreId` for nothing would be half a feature.
 */
export interface StoredAction {
  readonly id: string
  readonly scoreId: string
  /** Which priority produced this, and from which domain. */
  readonly sourcePriority: string
  readonly sourceDomain: string
  /** The catalogue entry this was, so the prose is looked up and never copied. */
  readonly recommendationId: string
  /** Feed · Seed · Rejuvenate. Carried so a stored action is legible on its own. */
  readonly actionCategory: ActionCategory
  readonly timeHorizon: TimeHorizon
  /** The methodology in force when it was recommended — see the docblock. */
  readonly provenance: ScoreProvenance
  /** The content version in force when it was recommended. */
  readonly actionSetVersion: string
  readonly state: ActionState
  readonly createdAt: string
  /**
   * When the state last moved. Equals `createdAt` for an action nobody has
   * touched, so "never changed" and "changed at the moment it was created" are
   * the same fact rather than a null to interpret.
   */
  readonly changedAt: string
}

/* ════════════════════════════════════════════════════════════════════════
   DECISIONS — the category that is neither a fact nor a presentation.

   ── The question this answers ─────────────────────────────────────────────

   Suppose today `resolvePriorities()` selects Diversity and `buildPlan()`
   selects actions A, B and C. Six months from now the selection rule improves.
   Somebody opens the Food System they established today.
   WHAT SHOULD THEY SEE?

   Deriving afresh shows them Meal Rhythm and actions D, E and F — silently,
   with no record that anything moved, and with their own completed actions now
   attached to a plan they were never given. That is not a recalculation; it is
   a rewritten history that happens to be internally consistent.

   So a SELECTION IS A DECISION, and a decision is persisted. What stays derived
   is every explanation OF it: the headline, the rationale sentence, the
   evidence, the domain copy, the counts, the relative dates. Those regenerate
   from versioned inputs, and persisting them would make a copy edit a data
   migration.

   ── What a decision record may contain ────────────────────────────────────

   IDS, VERSIONS, RANKS AND TIMESTAMPS. Nothing else. No sentence, no label, no
   score, no evidence — the `tests/unit/fss-persistence.test.ts` no-prose test
   walks these two records and refuses any value that reads like a sentence.

   ── And why they are separate records rather than fields on the system ────

   Because they are keyed by `scoreId` rather than by the system, they are
   written at a different step of the establishment order, and two arrays on
   `StoredFoodSystem` would make the record whose entire job is to be small into
   the largest one in the store.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Which priority or priorities were selected, and under what policy.
 *
 * `selected` keeps the RANK ORDER the engine chose, because the first priority
 * is the one the thirty-day focus comes from — an order that re-sorted on read
 * would move the month's focus without moving anything visible.
 */
export interface StoredPriorityDecision {
  readonly scoreId: string
  /** The policy that made this selection. See `lib/fss/system/version.ts`. */
  readonly systemModelVersion: string
  readonly selected: readonly {
    readonly priorityId: string
    readonly sourceDomain: FssDomain
    /** 0-based, in the order the engine selected them. */
    readonly rank: number
  }[]
  readonly decidedAt: string
}

/**
 * Which recommendations were selected for each horizon, and under what policy.
 *
 * Carries BOTH versions, for the reason `StoredAction` does: the policy decided
 * which entries to pick, the catalogue decided what those entries said, and
 * they move independently.
 *
 * `todayRecommendationId` is nullable and `thirtyDayFocusDomain` is nullable
 * because an empty plan is a real outcome — `buildPlan` returns one when no
 * priority can be named — and a record that could not represent it would force
 * the establishment path to invent something.
 */
export interface StoredPlanDecision {
  readonly scoreId: string
  readonly systemModelVersion: string
  readonly actionSetVersion: string
  readonly todayRecommendationId: string | null
  readonly thisWeekRecommendationIds: readonly string[]
  readonly thirtyDayFocusDomain: FssDomain | null
  readonly decidedAt: string
}

/**
 * A Food System: the identity that ties one assessment, one score and one set
 * of decisions together.
 *
 * ── Six fields, and the sixth is not padding ──────────────────────────────
 *
 * An earlier draft had five, with `actionSetVersion` doing double duty as the
 * policy anchor. That was wrong: reviewed wording changes often and selection
 * policy rarely, so hanging the policy on the content version makes every typo
 * fix read as a policy change. Both versions are here, and
 * `lib/fss/system/version.ts` argues the split at length.
 *
 * ── What is NOT here ──────────────────────────────────────────────────────
 *
 * No score, no domains, no priority, no plan, no copy, no counts and no review
 * date. This is a POINTER RECORD. My Food System is a composition of trusted
 * objects, and a record that copied their fields up would be a second,
 * drifting representation of all of them — which is the specific thing this
 * design exists to refuse.
 */
export interface StoredFoodSystem {
  readonly id: string
  readonly assessmentId: string
  readonly scoreId: string
  readonly establishedAt: string
  /** Policy: priority selection, plan construction, review cadence. */
  readonly systemModelVersion: string
  /** Content: the reviewed recommendation catalogue. */
  readonly actionSetVersion: string
}

/**
 * Everything the candidate product may persist.
 *
 * Deliberately narrow. A repository that can store anything becomes the place
 * things are stored without anybody deciding they should be.
 */
export interface FoodSystemRepository {
  readonly backend: "local" | "supabase"
  /** True when this backend may be written to in the current runtime. */
  readonly writable: boolean

  /* ── The assessment — the one LENIENT write ──────────────────────────────
   *
   * `saveAssessment` never throws on a storage failure. An assessment in
   * progress is saved on every answer, and a person twenty questions in should
   * not be shown an error because their browser is in private mode: losing the
   * answers is recoverable, crashing is not. Every OTHER write below is strict,
   * and `lib/fss/system/establish.ts` explains why the difference matters. */
  loadAssessment(id: string): Promise<StoredAssessment | null>
  saveAssessment(assessment: StoredAssessment): Promise<void>

  /* ── Everything below is STRICT: it throws `RepositoryWriteFailed` rather
   * than losing a write quietly. Establishing a Food System has an ORDER, and
   * an order whose steps can fail silently is not an order. */

  loadScore(id: string): Promise<StoredScore | null>
  saveScore(score: StoredScore): Promise<void>

  loadActions(scoreId: string): Promise<readonly StoredAction[]>
  saveAction(action: StoredAction): Promise<void>

  loadPriorityDecision(scoreId: string): Promise<StoredPriorityDecision | null>
  savePriorityDecision(decision: StoredPriorityDecision): Promise<void>

  loadPlanDecision(scoreId: string): Promise<StoredPlanDecision | null>
  savePlanDecision(decision: StoredPlanDecision): Promise<void>

  loadSystem(id: string): Promise<StoredFoodSystem | null>
  saveSystem(system: StoredFoodSystem): Promise<void>

  /* ── The pointer, separated from the record on purpose ───────────────────
   *
   * `saveSystem` writes the record. `setCurrentSystem` makes it CURRENT, and
   * nothing else does. They are two calls rather than one because the whole
   * safety property of establishment is that the pointer is written LAST:
   * `localStorage` has no transactions, so the order is the only guarantee
   * there is that a half-written Food System is never the current one. */
  loadCurrentSystemId(): Promise<string | null>
  setCurrentSystem(systemId: string): Promise<void>
  clearCurrentSystem(): Promise<void>
}

export class RepositoryWriteRefused extends Error {
  constructor(backend: string, reason: string) {
    super(`The ${backend} repository refused a write: ${reason}`)
    this.name = "RepositoryWriteRefused"
  }
}

/**
 * A write that was allowed, attempted, and did not happen.
 *
 * Distinct from `RepositoryWriteRefused`, which means the backend was never
 * going to accept it. This one means storage said no — quota, private mode,
 * blocked site data — and the caller must decide, because for the
 * establishment path the correct decision is to stop before writing the
 * pointer rather than to carry on and leave a half-created system current.
 */
export class RepositoryWriteFailed extends Error {
  constructor(
    readonly key: string,
    readonly cause?: unknown,
  ) {
    super(`The repository could not write "${key}". Storage is unavailable or full.`)
    this.name = "RepositoryWriteFailed"
  }
}
