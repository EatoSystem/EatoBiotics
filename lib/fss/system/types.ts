import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { ComparisonVerdict } from "@/lib/fss/engine/compare"
import type { FssDomain } from "@/lib/fss/questions/types"
import type {
  ActionCategory,
  FoodSystemPlan,
  ReportedContext,
  ResolvedPriority,
  TimeHorizon,
} from "@/lib/fss/action/types"
import type { StoredActionResolution } from "@/lib/fss/action/stored"
import type {
  ActionState,
  StoredAssessment,
  StoredScore,
} from "@/lib/fss/persistence/repository"

/* ════════════════════════════════════════════════════════════════════════
   MY FOOD SYSTEM — the types.

   ══ THE ONE CONSTRAINT THIS FILE EXISTS TO HOLD ═════════════════════════════

   My Food System is a COMPOSITION OF TRUSTED OBJECTS, NOT A NEW GIANT RECORD.

   `MyFoodSystem` is a derived view, computed per render. Nothing writes it,
   nothing stores it, and there is no `saveMyFoodSystem`. It REFERENCES the
   objects that own their data — `StoredScore`, `StoredAssessment` — whole, and
   re-exports not one of their fields.

   So there is no `MyFoodSystem.score: number`, no `.priorityDomain`, no
   `.todayAction`. Wanting one of those means reading through to the object that
   owns it. That is not inconvenience for its own sake: a convenience field is a
   SECOND COPY, a second copy drifts, and the drift surfaces as two parts of one
   screen disagreeing about the same number.

   `MY_FOOD_SYSTEM_KEYS` pins the shape, so a convenience field cannot appear
   without a test saying so out loud.

   ══ FOUR CATEGORIES, AND THE THIRD IS THE ONE PEOPLE GET WRONG ══════════════

     Persist facts. Persist decisions. Persist human state. Derive explanations.

     FACTS          what was answered, what was calculated, what was reported
     DECISIONS      what EatoBiotics selected, under which policy version
     HUMAN STATE    planned · done · skipped
     DERIVED        every headline, sentence, count, relative date, explanation

   Everything in this file is the fourth category, assembled from the first
   three. Not one customer-visible sentence here is persisted anywhere, which is
   what lets reviewed copy change without the change being a data migration.

   ══ RESOLUTION, NOT SUBSTITUTION ════════════════════════════════════════════

   Three things can fail to resolve, and each has a state for it rather than a
   fallback:

     a priority decision whose POLICY version has moved
     a plan decision whose policy or CONTENT version has moved
     a review point set under a cadence this code no longer implements

   In every case the honest answer is "this was decided under a method that has
   moved", never today's answer presented as what somebody was told. That is the
   same refusal `resolveStoredAction` makes for one recommendation and
   `canCompare` makes for two scores, applied to the decision itself.
   ════════════════════════════════════════════════════════════════════════ */

/* ── What a stored decision resolves to ────────────────────────────────── */

/** Why a stored decision could not be read back. Never a silent substitution. */
export type DecisionRefusal =
  /** The selection policy has moved, so what was selected cannot be explained. */
  | "policy-version-moved"
  /** The reviewed catalogue has moved, so the wording shown cannot be recovered. */
  | "content-version-moved"
  /** A recorded catalogue id is no longer in the catalogue. */
  | "entry-withdrawn"
  /** A recorded domain is not among the stored score's domains. */
  | "domain-absent-from-score"
  /**
   * The records disagree with each other — a recommendation whose domain no
   * recorded priority covers, for instance. Not a version having moved: a set
   * of records that could not have been written together. Surfaced rather than
   * patched around, because a reader who papered over it would be guessing
   * which record to believe.
   */
  | "decision-inconsistent"

export type PriorityResolution =
  | { readonly state: "resolved"; readonly priorities: readonly ResolvedPriority[] }
  | {
      readonly state: "unresolvable"
      readonly reason: DecisionRefusal
      readonly storedSystemModelVersion: string
      /** What was selected, so a surface can still name it without explaining it. */
      readonly storedDomains: readonly FssDomain[]
    }
  /** No priority could be named at the time — a real outcome, not a failure. */
  | { readonly state: "none-selected" }

export type PlanResolution =
  | { readonly state: "resolved"; readonly plan: FoodSystemPlan }
  | {
      readonly state: "unresolvable"
      readonly reason: DecisionRefusal
      readonly storedSystemModelVersion: string
      readonly storedActionSetVersion: string
    }
  | { readonly state: "none-selected" }

/* ── One action, with the person's state and the content's resolution ──── */

/**
 * A stored action, read back.
 *
 * ── Two different `state` fields, and they are different axes ─────────────
 *
 * `state` here is where the PERSON stands: planned, done, skipped.
 * `content.state` is whether the CONTENT still resolves: resolved,
 * unresolvable. An action can be `done` and `unresolvable` at once — somebody
 * did something, and the sentence they were given is no longer recoverable.
 *
 * ── There is no outcome field, and the absence is the design ──────────────
 *
 * No benefit, no effect, no improvement, no "this helped". Marking an action
 * done is a person reporting what they did; this product cannot see what it did
 * inside them, and a field for it would be an invitation to fill.
 */
export interface ResolvedAction {
  readonly id: string
  readonly state: ActionState
  readonly createdAt: string
  readonly changedAt: string
  readonly timeHorizon: TimeHorizon
  readonly actionCategory: ActionCategory
  /** The reviewed content, looked up by id and version — or the refusal. */
  readonly content: StoredActionResolution
}

/*
 * NOTE ON WHAT IS NOT ON `ResolvedAction`: there is no `sourceDomain`.
 *
 * `StoredAction.sourceDomain` is typed `string`, because a record read back out
 * of storage can hold anything and calling it an `FssDomain` would be this
 * code asserting something it has not checked. When the content RESOLVES, the
 * domain is available as a real `FssDomain` on
 * `content.recommendation.sourceDomain`, validated by having been found in the
 * catalogue. When it does not resolve, there is no domain we can stand behind —
 * and a field that offered one anyway would be the substitution this whole
 * layer refuses.
 */

/* ── The review point ──────────────────────────────────────────────────── */

/**
 * When reassessing would make sense.
 *
 * ── `dueAt` IS ABSOLUTE, AND THAT IS THE WHOLE POINT ──────────────────────
 *
 * "Review again in 24 days" needs a clock. `composeMyFoodSystem` is pure and
 * has none, so this carries the absolute date and the COMPONENT formats the
 * relative phrase from `dueAt` and `now`. Clock at the edge, purity preserved,
 * and the relative phrase never reaches a stored record or a test fixture.
 *
 * ── Why a moved policy yields no date at all ──────────────────────────────
 *
 * The cadence was 30 days under the policy that set this point. If the policy
 * later says 45, computing from today's constant would show a date the person
 * was never given — the `legacy-unversioned` dishonesty one layer up. We stored
 * the version, not the date, so when the version has moved the honest output is
 * no date and a sentence saying why.
 */
export type ReviewPoint =
  | {
      readonly state: "set"
      /** Absolute ISO date. The component makes it relative. */
      readonly dueAt: string
      readonly afterDays: number
      readonly setUnderVersion: string
      readonly whatItCompares: string
      readonly comparabilityRule: string
    }
  | {
      readonly state: "unresolvable"
      readonly setUnderVersion: string
      readonly comparabilityRule: string
    }

/* ── Progress ──────────────────────────────────────────────────────────── */

/**
 * What Progress is allowed to say, which is four facts and no fifth.
 *
 * ── `scoresAvailable` IS `1 | 2`, AND THE WIDENING IS THE DELIBERATE ACT ──
 *
 * It was the literal `1` through Gate 4, so that every trend, delta, arrow and
 * "since" was unavailable by construction rather than by discipline, and that
 * comment recorded that widening it would have to be "a deliberate, visible
 * act". This is that act, and it is as narrow as the evidence allows.
 *
 * `2` means THIS SCREEN HAS A PAIR TO SPEAK ABOUT, not that two scores exist
 * somewhere. Viewing C in a three-system chain still reads `2`, because the
 * pair is C and its immediate predecessor — the count describes what may be
 * compared here, and `previousSystemId` is what decides that.
 *
 * It is NOT `number`. A count that can be 7 invites a chart, and a chart over
 * seven assessments whose comparability was never checked pairwise is the
 * defect `canCompare` exists to refuse, drawn as a line.
 *
 * Note what it still does NOT carry: any delta. `scoresAvailable: 2` says a
 * comparison is possible to attempt; `WhatChanged` says whether it was
 * permitted and what came of it.
 *
 * ── Why `comparability` is here when no comparison exists ─────────────────
 *
 * Because they are different questions. `canCompare(p, p)` answers "could this
 * score EVER be compared" — and for a `legacy-unversioned` provenance the
 * answer is no, permanently, which is worth telling somebody. It does NOT mean
 * a comparison exists; `scoresAvailable` is the field that says that. Carrying
 * both means no surface can read `comparable: true` as "there is a trend".
 */
export interface ProgressFacts {
  readonly baselineEstablishedAt: string
  readonly scoresAvailable: 1 | 2
  readonly actionsPlanned: number
  readonly actionsDone: number
  readonly actionsSkipped: number
  readonly comparability: ComparisonVerdict
}

/* ── An unscored answer, read back ─────────────────────────────────────── */

/**
 * One What You Notice or Food Context answer, reflected back.
 *
 * `answer` is the OPTION LABEL the person chose, quoted and not interpreted,
 * and there is no numeric value here at all — these items reach the Score by no
 * path, and a number on this type would be the first step towards one.
 */
export interface ReportedItem {
  readonly questionId: string
  readonly order: number
  readonly question: string
  /** The chosen option's label, or null when it was not answered. */
  readonly answer: string | null
}

/* ── The aggregate ─────────────────────────────────────────────────────── */

export interface MyFoodSystem {
  readonly systemId: string
  readonly assessmentId: string
  readonly scoreId: string
  /** Referenced WHOLE. Read through it; nothing is copied up. */
  readonly score: StoredScore
  /** Referenced WHOLE. Read through it; nothing is copied up. */
  readonly assessment: StoredAssessment
  /** Resolved from the STORED decision, never re-selected. */
  readonly priorities: PriorityResolution
  /** Resolved from the STORED decision, never re-built. */
  readonly plan: PlanResolution
  /** Derived: what the person reported about circumstances. */
  readonly context: ReportedContext
  /** Derived: What You Notice, reflected back unscored. */
  readonly observations: readonly ReportedItem[]
  /**
   * Derived: Your Food Context, reflected back unscored.
   *
   * Beside `context` rather than inside it, because they answer different
   * questions. `context` is the CONSTRAINT STATES the action layer reads to
   * decide what is reasonable to suggest; this is WHAT THE PERSON SAID, quoted,
   * for the section that reads their answers back to them. One is an input to
   * selection, the other is a record of a conversation.
   */
  readonly contextItems: readonly ReportedItem[]
  /** Stored human state × the reviewed catalogue. */
  readonly actions: readonly ResolvedAction[]
  /** Derived, version-aware, absolute. */
  readonly review: ReviewPoint
  /** Counted. */
  readonly progress: ProgressFacts
  /** The provenance in force, read through from the score it belongs to. */
  readonly provenance: ScoreProvenance
}

/**
 * The aggregate's own keys, pinned.
 *
 * A test asserts `Object.keys(system).sort()` equals this, so adding
 * `MyFoodSystem.priorityDomain` as a convenience is a failing test rather than
 * a quiet second copy of something another object owns.
 */
export const MY_FOOD_SYSTEM_KEYS = [
  "actions",
  "assessment",
  "assessmentId",
  "context",
  "contextItems",
  "observations",
  "plan",
  "priorities",
  "progress",
  "provenance",
  "review",
  "score",
  "scoreId",
  "systemId",
] as const
