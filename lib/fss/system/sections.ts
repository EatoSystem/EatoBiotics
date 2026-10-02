import { SECTION_COPY, SECTION_ORDER, type SectionId } from "@/lib/fss/presentation/system"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { FssDomain } from "@/lib/fss/questions/types"
import type { Recommendation, ReportedContext, ResolvedPriority } from "@/lib/fss/action/types"
import type { StoredAssessment, StoredScore } from "@/lib/fss/persistence/repository"
import type {
  MyFoodSystem,
  PlanResolution,
  PriorityResolution,
  ProgressFacts,
  ReportedItem,
  ResolvedAction,
  ReviewPoint,
} from "./types"

/* ════════════════════════════════════════════════════════════════════════
   THE SEVEN SECTIONS, AND WHAT EACH ONE IS ALLOWED TO SEE.

   ══ A SECTION RECEIVES A SLICE, NEVER THE AGGREGATE ═════════════════════════

   Every section declares a `select` that names its permitted slice of
   `MyFoodSystem`, and the shell passes the result of that selector — not the
   system. A section therefore CANNOT quietly reach for data it has no business
   in, because it was never handed it.

   That is a structural defence rather than a convention. A component that
   receives the whole aggregate is one `system.` away from rendering anything in
   it, and the thing it would reach for is always the thing that reads well.

   ══ BIOTICS RECEIVES `null`, AND THAT IS THE POINT ══════════════════════════

   `select: () => null`. Not a filtered slice, not an empty object — nothing.

   Biotics is the section most likely to go wrong, because it puts Prebiotics,
   Probiotics and Postbiotics on a surface that also shows a personal score, and
   a reader composes what is adjacent. The permanent product rule is: measure
   the food system we can observe, teach the biology accurately, and NEVER
   present the biology as personally measured when it isn't. That rule has been
   broken four times, in four different forms, and every previous fix was scoped
   to the form rather than the rule.

   So it has four defences and not one:
     · no aggregate access — it is passed nothing, so there is nothing to render
       personally;
     · no numeric field anywhere in its data;
     · no domain to Biotic mapping, which Gate 3 already refused;
     · it lives inside `CANDIDATE_ROOTS`, so `PERSONAL_BIOTIC_STATE`'s nine
       rules and `NO_PERSONAL_BIOTIC_NUMBER` run over it automatically.

   ══ `refuses` IS DATA SO A TEST CAN READ IT ═════════════════════════════════

   Each descriptor states what its section must not do, in a list a guard can
   iterate. A prose comment saying the same thing would be a comment; this is
   the thing `tests/unit/my-food-system.test.ts` checks the sections against.
   ════════════════════════════════════════════════════════════════════════ */

export interface SectionDescriptor<TSlice> {
  readonly id: SectionId
  readonly label: string
  readonly says: string
  /** The ONLY accessor. A section is handed this result, never the system. */
  readonly select: (system: MyFoodSystem) => TSlice
  /** What this section must not do. Iterated by a guard, not just read. */
  readonly refuses: readonly string[]
}

/* ── Today ─────────────────────────────────────────────────────────────── */

export interface TodaySlice {
  readonly focus: ResolvedPriority | null
  /** Exactly one action for the whole plan, or none. Never one per priority. */
  readonly today: Recommendation | null
  readonly weekTotal: number
  readonly weekRemaining: number
  /** Absent when the score was withheld. Not a zero. */
  readonly score: number | null
  readonly review: ReviewPoint
  /**
   * One reviewed sentence explaining the focus. The only prose beyond labels.
   *
   * ── IT IS `PRIORITY_COPY.explanation`, AND IT USED TO BE `whereYouAre` ────
   *
   * The plan for this gate specified `DOMAIN_PRESENTATION[d].whereYouAre`, on
   * the reasoning that it is one already-reviewed observed-behaviour sentence
   * about the focus domain. That was wrong, and only READING THE RENDERED
   * SCREEN showed why. On the all-2s sheet it produced:
   *
   *     YOUR FOCUS   Diversity: widen the range, not the amount
   *     …
   *     Your answers described a wide range of plant foods across a typical week.
   *
   * Both sentences are reviewed and both are true. Adjacent, they contradict
   * each other: the focus says widen the range, the insight says the range is
   * already wide. It happens because a tie at 67 makes Diversity the lowest of
   * five AND puts it in the top band of its own ladder — "lowest of five" and
   * "low" are different claims, and this screen had been putting them side by
   * side as though they agreed.
   *
   * `explanation` cannot contradict the focus, because it explains the RANKING
   * rather than describing the domain: "Of the five, this is where your answers
   * described the least — which usually makes it the most direct place to start
   * rather than the most important one." It also happens to be the sentence
   * that handles a tie honestly.
   *
   * `whereYouAre` is not lost: it is where it belongs, in My Food, next to the
   * domain it describes and beside the other four.
   */
  readonly insight: string | null
  /** Set when the stored decisions could not be read back. */
  readonly unresolved: PriorityResolution | PlanResolution | null
}

export const TODAY: SectionDescriptor<TodaySlice> = {
  id: "today",
  label: SECTION_COPY.today.label,
  says: SECTION_COPY.today.says,
  refuses: [
    "more than one action for today",
    "any outcome claim",
    "any band word for the score",
    "a second number beside the score",
    "a chart",
  ],
  select: (system) => {
    const priorities = system.priorities
    const focus = priorities.state === "resolved" ? (priorities.priorities[0] ?? null) : null
    const plan = system.plan

    /*
     * The week count is over the STORED ACTION STATES, not over the plan: the
     * plan says what was chosen, the actions say where the person stands. A
     * count taken from the plan would never move when somebody marked anything.
     */
    const week = system.actions.filter((a) => a.timeHorizon === "this-week")

    return {
      focus,
      today: plan.state === "resolved" ? plan.plan.today : null,
      weekTotal: week.length,
      weekRemaining: week.filter((a) => a.state === "planned").length,
      score: typeof system.score.score === "number" ? system.score.score : null,
      review: system.review,
      // `focus.explanation` IS `PRIORITY_COPY.explanation`, carried on the
      // priority rather than looked up again — so the sentence on Today is the
      // same object the priority was described with, not a second copy of it.
      insight: focus ? focus.explanation : null,
      unresolved:
        priorities.state === "unresolvable"
          ? priorities
          : plan.state === "unresolvable"
            ? plan
            : null,
    }
  },
}

/* ── Score ─────────────────────────────────────────────────────────────── */

export interface ScoreSlice {
  readonly score: StoredScore
  readonly provenance: ScoreProvenance
}

export const SCORE: SectionDescriptor<ScoreSlice> = {
  id: "score",
  label: SECTION_COPY.score.label,
  says: SECTION_COPY.score.says,
  refuses: [
    "new arithmetic",
    "any band word",
    "getScoreBand with the unregistered interpretation version",
    "a comparison with anything",
  ],
  select: (system) => ({ score: system.score, provenance: system.provenance }),
}

/* ── My Food ───────────────────────────────────────────────────────────── */

export interface MyFoodSlice {
  readonly assessment: StoredAssessment
  readonly domains: StoredScore["domains"]
  readonly observations: readonly ReportedItem[]
  readonly context: ReportedContext
  readonly contextItems: readonly ReportedItem[]
}

export const MY_FOOD: SectionDescriptor<MyFoodSlice> = {
  id: "my-food",
  label: SECTION_COPY["my-food"].label,
  says: SECTION_COPY["my-food"].says,
  refuses: [
    "any summary not traceable to an answered item",
    "a score for What You Notice",
    "a score for Food Context",
    "treating a constraint as a shortcoming",
  ],
  /*
   * What You Notice and My Context live HERE rather than as navigation tabs of
   * their own. They are things a person told us, read back inside the section
   * about what we understand — not two more destinations.
   */
  select: (system) => ({
    assessment: system.assessment,
    domains: system.score.domains,
    observations: system.observations,
    context: system.context,
    contextItems: system.contextItems,
  }),
}

/* ── Biotics ───────────────────────────────────────────────────────────── */

export const BIOTICS: SectionDescriptor<null> = {
  id: "biotics",
  label: SECTION_COPY.biotics.label,
  says: SECTION_COPY.biotics.says,
  refuses: [
    "the person's answers",
    "the person's score",
    "any number at all",
    "any domain to Biotic mapping",
    "a personal Prebiotic, Probiotic or Postbiotic state in any form",
  ],
  /** Nothing. See the header. */
  select: () => null,
}

/* ── My Plan ───────────────────────────────────────────────────────────── */

export interface MyPlanSlice {
  readonly plan: PlanResolution
  readonly priorities: PriorityResolution
  readonly actions: readonly ResolvedAction[]
  readonly context: ReportedContext
}

export const MY_PLAN: SectionDescriptor<MyPlanSlice> = {
  id: "my-plan",
  label: SECTION_COPY["my-plan"].label,
  says: SECTION_COPY["my-plan"].says,
  refuses: [
    "regenerating a recommendation's copy independently",
    "hiding an action whose content cannot be resolved",
    "an outcome for a completed action",
    "Feed, Seed or Rejuvenate as a score",
  ],
  select: (system) => ({
    plan: system.plan,
    priorities: system.priorities,
    actions: system.actions,
    context: system.context,
  }),
}

/* ── Progress ──────────────────────────────────────────────────────────── */

export interface ProgressSlice {
  readonly progress: ProgressFacts
  readonly review: ReviewPoint
}

export const PROGRESS: SectionDescriptor<ProgressSlice> = {
  id: "progress",
  label: SECTION_COPY.progress.label,
  says: SECTION_COPY.progress.says,
  refuses: [
    "any trend",
    "any delta",
    "a second score",
    "an improvement claim",
    "a number that moves when an action is marked",
  ],
  /*
   * It is given the counts and the review point and NOT the score. With one
   * score there is nothing to compare, and the surest way not to render a
   * comparison is not to be holding the thing one would be made from.
   */
  select: (system) => ({ progress: system.progress, review: system.review }),
}

/* ── Learn ─────────────────────────────────────────────────────────────── */

export interface LearnSlice {
  /** Domain KEYS only. No scores, no evidence, no answers. */
  readonly domains: readonly FssDomain[]
}

export const LEARN: SectionDescriptor<LearnSlice> = {
  id: "learn",
  label: SECTION_COPY.learn.label,
  says: SECTION_COPY.learn.says,
  refuses: [
    "personalised biological inference",
    "the person's score",
    "the person's answers",
    "a claim that reading something will change anything",
  ],
  select: (system) => ({
    domains:
      system.priorities.state === "resolved"
        ? system.priorities.priorities.map((p) => p.sourceDomain)
        : system.priorities.state === "unresolvable"
          ? system.priorities.storedDomains
          : [],
  }),
}

/* ── The registry ──────────────────────────────────────────────────────── */

/**
 * Every section, for navigation and for the guard that proves all seven are
 * covered. Typed as `unknown` on purpose: the shell iterates this for the tab
 * bar and each component takes its own typed descriptor, so nothing reads a
 * slice through this map and nothing can lose its type by doing so.
 */
export const SECTIONS: Record<SectionId, SectionDescriptor<unknown>> = {
  today: TODAY,
  score: SCORE,
  "my-food": MY_FOOD,
  biotics: BIOTICS,
  "my-plan": MY_PLAN,
  progress: PROGRESS,
  learn: LEARN,
}

/** The tab bar's order, from the one list that defines it. */
export const SECTION_LIST: readonly SectionDescriptor<unknown>[] = SECTION_ORDER.map(
  (id) => SECTIONS[id],
)
