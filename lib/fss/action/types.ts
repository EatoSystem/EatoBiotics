import type { FssDomain } from "@/lib/fss/questions/types"
import type { ScoreProvenance } from "@/lib/fss/engine/provenance"

/* ════════════════════════════════════════════════════════════════════════
   The action model — Gate 3.

   FSS-v1 Candidate — Frozen for Scientific Review, Not Yet Scientifically
   Approved. Nothing in this module is production-active.

   ── The rule the whole layer exists to make structural ────────────────────

   A RECOMMENDATION IS NEVER JUST GENERATED TEXT. Every one carries, as data:

     source domain → the observed inputs → the priority → the action →
     its Feed/Seed/Rejuvenate category → why it was suggested →
     its time horizon → the class of claim its reason belongs to

   So "Add three different plant foods this week" is explainable as "your
   reported Diversity pattern is where your answers described the least", and
   is NOT explainable as "this will improve your microbiome" — because no
   field in here can carry the second sentence. That is the difference between
   a product that can be audited and one that cannot.

   ── What is deliberately ABSENT, and where to look for the absence ────────

   No Biotic. Not as a field, not as a key, not as an import. The engine
   already has this property (see `engine/score.ts`, which says so as an
   absence) and the action layer keeps it: Feed · Seed · Rejuvenate are what a
   person DOES, and `lib/pillars.ts` maps those same three words onto
   Prebiotics/Probiotics/Postbiotics, so importing it here would make an
   action a Biotic by import.

   No number on a category. See `categories.ts`.

   No horizon longer than thirty days. See `horizons.ts`.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Feed · Seed · Rejuvenate — ACTION categories, never score categories.
 *
 * ── Why these are properties of a RECOMMENDATION and not of a domain ──────
 *
 * There is no `Record<FssDomain, ActionCategory>` in this layer, and there must
 * not be one. Three reasons, in increasing order of how expensive they are:
 *
 *   1. The arithmetic does not work. Five domains, three categories, and
 *      `foodQuality` corresponds to no Biotic BY DESIGN — its own reviewed copy
 *      says it "sits beside the plant domains rather than inside them". Any
 *      total map has to invent an answer for it.
 *   2. A keyed lookup between two vocabularies is a live defect class HERE.
 *      `lib/report/food-swaps.ts` documents, in its own header, the bug where a
 *      pathway key did not match its map and twenty of twenty-five swaps were
 *      unreachable for ONE HUNDRED PERCENT of reports. A five-into-three map is
 *      that bug's next host.
 *   3. It would reattach the domains to the Biotics. Gate 2's whole argument is
 *      that the domains are the scored layer and the Biotics group and teach;
 *      a domain→action map plus `lib/pillars.ts`'s action→Biotic map composes
 *      straight back into domain→Biotic.
 *
 * So an action is Feed because of what it IS — giving the system more to work
 * with — not because of which domain surfaced it. A Food Quality priority can
 * honestly yield a Feed action or a Rejuvenate action, and nothing has to claim
 * Food Quality "is" a Biotic.
 */
export type ActionCategory = "feed" | "seed" | "rejuvenate"

/**
 * Today · This Week · 30 Days — a CADENCE FOR THE ACTION, never a schedule for
 * a result.
 *
 * ── The tension this type sits inside, stated so nobody has to rediscover it ─
 *
 * Three separate surfaces in this repository forbid attaching a timeframe to an
 * action, and they are right to:
 *
 *   components/assessment/result/one-free-action.tsx — "No 'raise your score
 *     by', no 'fix your gut', no timeframe: an action that arrives with a
 *     predicted outcome stops being something to try and becomes a claim to
 *     keep."
 *   lib/fss/presentation/domains.ts — "none predicts an outcome, none attaches
 *     a timeframe, and none promises that a change will raise a score."
 *   components/home/score-preview.tsx — records the repair where copy promised
 *     a change "could measurably shift your gut diversity within weeks", and
 *     only the guarantee was removed, not the advice.
 *
 * What makes all of that true alongside three horizons: a horizon here says
 * WHEN YOU DO IT, not when it works. "A spoonful most days this week" is a
 * cadence. "In a week you will feel steadier" is a prediction, and the claims
 * boundary refuses predictions outright.
 *
 * `horizons.ts` holds the rule and a guard enforces it.
 *
 * ── And why there is no ninety-day or one-year member ─────────────────────
 *
 * Because longitudinal work is not this gate, and a type is the cheapest place
 * for scope to leak. The only future-compatibility interface is
 * `ReassessmentPoint` below, which states a comparability rule rather than
 * computing a trend.
 */
export type TimeHorizon = "today" | "this-week" | "thirty-days"

/**
 * The four circumstances Your Food Context reports.
 *
 * `fc1` time and energy · `fc2` affordability · `fc3` access to fresh food ·
 * `fc4` kitchen and confidence.
 *
 * These shape the PLAN and reach the Score by no path at all — which is not a
 * nicety: scoring someone's circumstances means lowering a number because they
 * work nights or live in a food desert. The constitution puts it as "Your Food
 * Context may say that it shapes the Plan, and may never say anything that
 * lowers the Score."
 */
export type ContextConstraint = "time" | "cost" | "access" | "kitchen"

/**
 * How much a constraint is in the way, as the person described it.
 *
 * Three states rather than the raw 0–3, because the plan only ever asks one
 * question of them — may this action be offered — and a four-point scale would
 * invite a weighting nobody chose.
 */
export type ConstraintState = "limiting" | "workable" | "free"

/**
 * WHAT KIND OF STATEMENT a sentence is. Four members, and the missing one is
 * the point.
 *
 * ── Requirement 7, made unrepresentable rather than merely forbidden ──────
 *
 * The scientific boundary asks that four things stay clearly separated:
 * observable behaviour, general educational science, a personalised
 * recommendation, and biological inference — with the last unavailable. A
 * comment saying "do not make biological claims" is a hope. A union with no
 * member for them is a property of the code.
 *
 * So there is no `biological-inference`. A sentence that needed it has nowhere
 * to go, and ADDING one is a diff a reviewer cannot miss — which is exactly the
 * visibility that was wanted.
 *
 * The forms map onto the claims boundary's own table:
 *
 *   observed-behaviour           "Your answers described…"
 *   self-reported                "You reported…" / "You told us…"
 *   general-education            impersonal present, about food, not about you
 *   personalised-recommendation  "you could…" — an action, never its result
 */
export type ClaimClass =
  | "observed-behaviour"
  | "self-reported"
  | "general-education"
  | "personalised-recommendation"

/**
 * Every claim class, as values, so a guard can count them.
 *
 * A union is invisible at runtime, so "exactly four, and none of them
 * biological" could not otherwise be asserted — and an unasserted invariant in
 * this position is the whole defect class this engagement keeps finding.
 */
export const CLAIM_CLASSES: readonly ClaimClass[] = [
  "observed-behaviour",
  "self-reported",
  "general-education",
  "personalised-recommendation",
]

/**
 * Nothing in this layer is approved content.
 *
 * The same marker the seven draft questions carry, for the same reason: a
 * surface must be able to say so, and a reviewer must be able to grep for it.
 */
export type CandidateStatus = "candidate-pending-review"

/**
 * The action content's own version, and why it is NOT a sixth provenance field.
 *
 * A stored recommendation needs two versions: which method scored the person,
 * and which content recommended to them. `ScoreProvenance` carries the first
 * and its five fields are asserted by value in Gate 2's tests — widening it
 * would change what every existing candidate score claims about itself.
 *
 * So the content version travels beside it. The €49 Report reached the same
 * conclusion independently: `COMPOSER_VERSION` and `contentPackVersion` sit
 * alongside its schema version rather than inside it.
 */
export const ACTION_SET_VERSION = "actions-v1.0" as const

/* ── The priority ──────────────────────────────────────────────────────── */

/**
 * One answered item behind a priority — the "observed input" of the chain.
 *
 * This is what makes a recommendation explainable without inferring anything:
 * the reason points at a question that was asked and an answer that was given,
 * both quoted, neither interpreted. "Your answers described the least here" is
 * a statement about `value`; it is not a statement about a person's biology.
 */
export interface PriorityEvidence {
  readonly questionId: string
  /** Position in the resolved instrument, so evidence renders in asked order. */
  readonly order: number
  /** The item as asked. */
  readonly question: string
  /** The chosen option's label, as written. */
  readonly answer: string
  readonly value: 0 | 1 | 2 | 3
}

/**
 * How much of a domain was answered.
 *
 * COMPLETENESS, and deliberately not a confidence interval. The architecture
 * review is explicit about why: a CI "would imply sampling properties this
 * instrument does not have". This is a count of answers, said plainly.
 */
export interface PriorityConfidence {
  readonly answered: number
  readonly total: number
  /** `answered / total`, 0–1. */
  readonly completeness: number
}

/**
 * A priority — a practical starting point, and nothing stronger.
 *
 * ── The vocabulary this refuses, borrowed rather than reinvented ──────────
 *
 * `lib/report/deterministic/priority.ts` already worked this out for the €49
 * Report and refuses, by name: "a biological weakness · the root cause · the
 * highest risk · a treatment target · what is damaging their system · the
 * biggest physiological blocker". That module cannot be imported here — the
 * science contract's importer allow-list is pinned to five files under
 * `lib/report/` — so the refusals are transcribed as this layer's own rules and
 * enforced against this layer's own copy.
 *
 * The two priority engines stay philosophically distinct on purpose. The
 * Consultation's refuses arithmetic because its inputs are categories; this one
 * ranks because it has a candidate score to rank on.
 */
export interface ResolvedPriority {
  /** Stable across runs — derived from the domain, never from a counter. */
  readonly id: string
  readonly sourceDomain: FssDomain
  readonly domainScore: number
  /** The answered items this rests on, in asked order. */
  readonly evidence: readonly PriorityEvidence[]
  /** Why this domain and not another. Auditable; names a rank, not a cause. */
  readonly rationale: string
  /** The sentence a person reads. Reviewed copy, never composed here. */
  readonly explanation: string
  /** The reviewed headline for this domain as a priority. */
  readonly headline: string
  readonly confidence: PriorityConfidence
  readonly status: CandidateStatus
  readonly provenance: ScoreProvenance
}

/* ── The recommendation ────────────────────────────────────────────────── */

/**
 * One piece of reviewed candidate content, before it belongs to anybody.
 *
 * Separated from `Recommendation` so the catalogue is pure content and a
 * recommendation is content BOUND to a result. That split is what lets the
 * stored record keep an id and a version instead of a sentence.
 */
export interface CatalogueEntry {
  readonly id: string
  readonly domain: FssDomain
  readonly category: ActionCategory
  /** A short name for the action. */
  readonly title: string
  /** What to actually do. An action, never its result. */
  readonly practicalAction: string
  /** Why this was suggested. Names the reported behaviour. */
  readonly rationale: string
  /** How often — the cadence, not a duration until an effect. */
  readonly suggestedFrequency: string
  readonly timeHorizon: TimeHorizon
  /** What class of statement `rationale` is. */
  readonly claimClass: ClaimClass
  /**
   * Circumstances this action needs in order to be reasonable.
   *
   * Empty means it asks nothing of the person's time, money, access or
   * kitchen. At least one such entry per domain is an invariant, because a
   * plan that goes silent on the most constrained person is the worst
   * available failure of this layer.
   */
  readonly requires: readonly ContextConstraint[]
}

/** A catalogue entry bound to one person's priority, with both versions. */
export interface Recommendation extends CatalogueEntry {
  readonly priorityId: string
  readonly sourceDomain: FssDomain
  readonly status: CandidateStatus
  readonly provenance: ScoreProvenance
  readonly actionSetVersion: typeof ACTION_SET_VERSION
}

/* ── The context, and the plan ─────────────────────────────────────────── */

/** Your Food Context, read back. Shapes selection; reaches the Score nowhere. */
export interface ReportedContext {
  readonly states: Readonly<Record<ContextConstraint, ConstraintState>>
  /** The constraints the person described as being in the way. */
  readonly limiting: readonly ContextConstraint[]
  /** False when Part 4 was skipped entirely — which is not the same as "no constraints". */
  readonly answered: boolean
}

/**
 * Where a reassessment would sit, and what it would be allowed to say.
 *
 * ── The only future-compatibility interface in this gate ──────────────────
 *
 * It computes no trend, stores no history and compares nothing. It exists
 * because the thirty-day horizon has to name a point at which reassessing makes
 * sense, and naming one without naming the comparability rule is how a product
 * ends up drawing a line through a methodology change.
 *
 * The rule itself is not restated here — `lib/fss/engine/compare.ts` already
 * refuses cross-version comparison and already holds the only permitted change
 * wording. This carries that module's answer rather than a second copy of it.
 */
export interface ReassessmentPoint {
  readonly afterDays: 30
  /** What a reassessment would compare — reported behaviour, not biology. */
  readonly whatItCompares: string
  /** The comparability rule, taken from the Gate 2 comparison primitive. */
  readonly comparabilityRule: string
}

/**
 * The thirty-day horizon: a behavioural focus and a reassessment point.
 *
 * NOT a list. Four actions is a list of tips, and the thing that makes a month
 * work is holding one behaviour long enough to find out whether it survives an
 * ordinary week.
 */
export interface ThirtyDayFocus {
  readonly sourcePriorityId: string
  readonly sourceDomain: FssDomain
  /** The behaviour to hold. */
  readonly behaviour: string
  /** Why this one, out of everything that could be held. */
  readonly whyThisOne: string
  readonly reassessment: ReassessmentPoint
  readonly claimClass: ClaimClass
  readonly status: CandidateStatus
}

/**
 * Your Plan.
 *
 * ── The four questions it answers, in this order ──────────────────────────
 *
 *   What matters most?            `priorities`, with their evidence
 *   What should I do?             `today`, `thisWeek`, `thirtyDays`
 *   Why this?                     each rationale, plus its priority's evidence
 *   How do I make it practical?   `practicalAction` + `suggestedFrequency`,
 *                                 already filtered by `context`
 *
 * ── No clock ──────────────────────────────────────────────────────────────
 *
 * There is no `createdAt`. The plan is a pure function of the answers, and a
 * timestamp would make it one of the few things in this layer that cannot be
 * compared byte-for-byte across two runs — which is the property the
 * determinism test depends on. `StoredAction` carries the clock, because a
 * person's relationship to an action genuinely happens at a time.
 */
export interface FoodSystemPlan {
  readonly actionSetVersion: typeof ACTION_SET_VERSION
  readonly provenance: ScoreProvenance
  readonly priorities: readonly ResolvedPriority[]
  /** Exactly one action for the whole plan, or none. Never one per priority. */
  readonly today: Recommendation | null
  /** A small set. Capped, because a long list is the thing this replaces. */
  readonly thisWeek: readonly Recommendation[]
  readonly thirtyDays: ThirtyDayFocus | null
  readonly context: ReportedContext
}

/** At most this many recommendations in the weekly set. */
export const THIS_WEEK_MAX = 3

/** At most this many priorities, however the selection is tuned. */
export const PRIORITY_MAX = 3
