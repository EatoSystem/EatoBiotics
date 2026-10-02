import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { ComparisonVerdict } from "@/lib/fss/engine/compare"
import type { FssDomain } from "@/lib/fss/questions/types"
import { PRIORITY_MUST_NOT_MEAN } from "@/lib/fss/action/priority"
import {
  ACTION_SET_VERSION,
  CLAIM_CLASSES,
  type ActionCategory,
  type ClaimClass,
  type ContextConstraint,
  type TimeHorizon,
} from "@/lib/fss/action/types"
import type { ActionState } from "@/lib/fss/persistence/repository"
import type { WhatChanged } from "./changed"
import type { MyFoodSystem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   THE AI CONTEXT BOUNDARY — a ceiling, and an exact projection per intent.

   ══ CONTEXT IS CAPABILITY ═══════════════════════════════════════════════════

   If the declared intent does not require a fact, the model does not receive
   that fact. This is not privacy optimisation, and reading it as such is how
   it would get relaxed later.

   A model handed the score, every answer, all history, every observation,
   every recommendation and all four constraints will — eventually, on some
   question — synthesise a conclusion that no deterministic EatoBiotics
   component ever made. And it will look like EatoBiotics said it. Narrowing
   the context is therefore how the ONE DECISION ENGINE rule is enforced at the
   input, rather than hoped for at the output.

   ══ THE CEILING IS A TYPE AND IS NEVER CONSTRUCTED ══════════════════════════

   `FoodSystemAiContextCeiling` is the upper bound of what may EVER reach a
   model. It has no value, no builder and no literal anywhere — so "no code
   path hands the whole thing over" is not a rule somebody has to follow. There
   is nothing to hand over, and nothing to spread-then-delete.

   ══ ONE DECLARATION DRIVES THE TYPE, THE OBJECT AND THE TEST ════════════════

   `INTENT_FIELDS` is the contract. It is read three ways and written once:

     · the TYPE, via `Pick<Ceiling, (typeof INTENT_FIELDS)[I][number]>`;
     · the OBJECT, because the builder iterates it rather than listing fields;
     · the TEST, which pins each intent's key set by value.

   So subset-ness is true by construction — `Pick` cannot name a field the
   ceiling lacks, and `satisfies` refuses a key that is not a ceiling key — and
   the returned key set EQUALS the declared key set rather than resembling it.

   ══ EXACT, NOT SUBSET ══════════════════════════════════════════════════════

   The contract is equality in both directions. A missing required field is as
   much a failure as an undeclared extra one: subset-only validation silently
   drops grounding, and a model missing its grounding substitutes something.

   ══ WHAT IS STILL NOT HERE, AND WHY THE ABSENCE IS ITS CONTENT ══════════════

   No `systemPrompt`. No `instructions`. No `narrative`. No `summary`. No
   `tone`. No `persona`. Gate 4 argued this and it has not changed: a prompt
   field becomes a second source for methodology, because somebody wanting the
   model to behave writes the weights into it, or the band thresholds, or the
   selection rule, or a paraphrase of the claims boundary — none of it
   reviewed, all of it free to drift, in the one place nobody reads as product
   logic.

   And no score weights, no band thresholds, no domain-ranking algorithm and no
   independently encoded scientific claim. This layer carries VALUES AND
   VERSIONS THE ENGINE PRODUCED, plus VERDICTS IT REACHED, and nothing that
   tells a model what to say.

   ══ NO COMPARATIVE PROSE, EVER ══════════════════════════════════════════════

   The Gate 5 material enters as FACTS — `WhatChanged`, and the comparison
   verdict — never as `DOMAIN_CHANGE_COPY`'s fifteen sentences. Two reasons:

     `COMPARATIVE_COPY_REVIEW.state` is "pending", so feeding that copy to a
     model would run pending copy → model context → newly generated customer
     copy, and the review boundary would disappear through a door the
     CANDIDATE_ROOTS fence does not watch.

     And the block-level implication recorded in the H1 review — five
     directional sentences reading as corroboration of a moved score — must not
     be inherited. Facts carry no layout, so they carry no juxtaposition.
   ════════════════════════════════════════════════════════════════════════ */

/* ── The intents ───────────────────────────────────────────────────────── */

/**
 * The questions this layer can be asked. A CLOSED union, pinned by value.
 *
 * There is no `"raw"`, no `"all"`, and `undefined` is not accepted — a fourth
 * member is a visible diff and arrives with its own contract or not at all.
 */
export type AiIntent = "explain-current-priority" | "help-today-action" | "explain-what-changed"

export const AI_INTENTS: readonly AiIntent[] = [
  "explain-current-priority",
  "help-today-action",
  "explain-what-changed",
]

/* ── The parts ─────────────────────────────────────────────────────────── */

/** One domain's state, as a value with its class — never as a sentence. */
export interface AiDomainState {
  readonly domain: FssDomain
  readonly state: "scored" | "insufficient"
  readonly score: number | null
  readonly claimClass: Extract<ClaimClass, "observed-behaviour">
}

/**
 * The persisted priority, with the evidence that produced it.
 *
 * `rank` and `scoredDomainCount` are here so "the lowest of five" is
 * explainable WITHOUT shipping the other four domains' scores. The
 * deterministic system already ranked them; handing over all five invites the
 * model to rediscover the ranking, and a model that rediscovers a ranking is
 * one keystroke from disagreeing with it.
 */
export interface AiPriority {
  readonly priorityId: string
  readonly domain: FssDomain
  readonly domainScore: number
  readonly rank: number
  readonly scoredDomainCount: number
  /** The answered items behind it: a question asked, an option chosen. */
  readonly evidence: readonly {
    readonly questionId: string
    readonly question: string
    readonly answer: string
  }[]
  /** What a priority must never be taken to mean. Carried, not paraphrased. */
  readonly mustNotMean: readonly string[]
}

/** One action's identity and where the person stands on it. */
export interface AiAction {
  readonly actionId: string
  readonly recommendationId: string | null
  readonly category: ActionCategory
  readonly timeHorizon: TimeHorizon
  readonly state: ActionState
  /** False when the stored content could not be resolved. */
  readonly resolvable: boolean
}

/** The boundary, as data rather than as a sentence for a model to read. */
export interface AiClaimBoundary {
  /** The classes that exist. `biological-inference` is not one of them. */
  readonly availableClasses: readonly ClaimClass[]
  /** No class permits predicting an outcome, a timeframe or a benefit. */
  readonly noPredictedOutcome: true
  /** No personal Prebiotic, Probiotic or Postbiotic state, in any form. */
  readonly noPersonalBioticState: true
  /** Everything here is candidate methodology, pending scientific review. */
  readonly candidatePendingReview: true
}

/* ── The ceiling ───────────────────────────────────────────────────────── */

/**
 * Every field that may EVER reach a model. A TYPE, never instantiated.
 *
 * Widening this is not the same as granting it: a field here is only reachable
 * once some intent's `INTENT_FIELDS` entry names it.
 */
export interface FoodSystemAiContextCeiling {
  readonly systemId: string
  readonly scoreId: string
  readonly provenance: ScoreProvenance
  readonly systemModelVersion: string
  readonly actionSetVersion: string

  readonly scoreState: "scored" | "withheld"
  readonly score: number | null
  readonly completeness: number
  /** ALL FIVE domains. Reachable only by an intent that declares it. */
  readonly domains: readonly AiDomainState[]

  readonly priority: AiPriority
  readonly decisionsUnresolvable: boolean

  readonly observations: readonly { readonly question: string; readonly answer: string | null }[]
  /**
   * The constraints the person described as being IN THE WAY, and only those.
   *
   * `readFoodContext` already derives this `limiting` set deterministically, so
   * no AI-layer function decides what counts as "relevant context". Inventing
   * a relevance rule here would make this layer a decision engine by a quieter
   * name.
   */
  readonly limitingConstraints: readonly ContextConstraint[]
  readonly contextAnswered: boolean

  readonly todayAction: AiAction | null
  readonly actions: readonly AiAction[]

  /** Gate 5 facts. Never the fifteen comparative sentences. */
  readonly comparisonVerdict: ComparisonVerdict | null
  readonly whatChanged: WhatChanged | null
  readonly previousSystemId: string | null

  readonly claimBoundary: AiClaimBoundary
}

/* ── The contract ──────────────────────────────────────────────────────── */

/**
 * What each intent receives. THE one declaration.
 *
 * `satisfies` is what makes this safe: a key that is not a ceiling key fails
 * to compile here, so the lists cannot drift from the ceiling even silently.
 */
export const INTENT_FIELDS = {
  /*
   * Enough to explain the persisted choice: which priority, the evidence
   * behind it, its rank among the scored domains, and the boundary. NOT the
   * other four domain scores — see `AiPriority`.
   */
  "explain-current-priority": [
    "systemId",
    "provenance",
    "systemModelVersion",
    "priority",
    "decisionsUnresolvable",
    "claimBoundary",
  ],

  /*
   * Enough to make today's persisted action practical: what it is, what it
   * serves, and what is in the person's way. No score, no history, no domains.
   */
  "help-today-action": [
    "systemId",
    "priority",
    "todayAction",
    "actionSetVersion",
    "limitingConstraints",
    "contextAnswered",
    "claimBoundary",
  ],

  /*
   * The ANSWER Gate 5 reached, not the ingredients to reach another one. There
   * are no raw assessments here, so the comparison cannot be reconstructed.
   */
  "explain-what-changed": [
    "systemId",
    "previousSystemId",
    "provenance",
    "comparisonVerdict",
    "whatChanged",
    "claimBoundary",
  ],
} as const satisfies Record<AiIntent, readonly (keyof FoodSystemAiContextCeiling)[]>

/**
 * What each intent must NEVER receive — the reviewed statement of the limit.
 *
 * Redundant with `INTENT_FIELDS` by construction, and kept because redundancy
 * is the point: this is the list a reviewer reads, and a test asserts the two
 * never intersect. Widening an intent then fails against the thing somebody
 * actually agreed to.
 */
export const INTENT_DENIED = {
  "explain-current-priority": ["whatChanged", "comparisonVerdict", "domains", "observations", "actions"],
  "help-today-action": ["whatChanged", "comparisonVerdict", "domains", "score", "observations"],
  "explain-what-changed": ["observations", "domains", "priority", "todayAction", "actions"],
} as const satisfies Record<AiIntent, readonly (keyof FoodSystemAiContextCeiling)[]>

/** The exact object each intent produces. */
export type AiContextByIntent = {
  [I in AiIntent]: Pick<FoodSystemAiContextCeiling, (typeof INTENT_FIELDS)[I][number]>
}

/* ── The projection ───────────────────────────────────────────────────── */

/**
 * Build the exact context one intent is permitted.
 *
 * ── CONSTRUCTED POSITIVELY, NOT FILTERED ─────────────────────────────────
 *
 * Every field is assembled into one record and then the DECLARED keys are
 * copied out of it. The alternative — build everything and delete what is
 * denied — fails the first time somebody adds a ceiling field and forgets the
 * delete, and it fails silently, having already handed the field over.
 *
 * Copying out means an undeclared field is not omitted from the result: it was
 * never reachable. `INTENT_FIELDS[intent]` is the only thing that decides.
 *
 * ── PURE, FOR THE SAME REASON THE COMPOSER IS ────────────────────────────
 *
 * No clock, no store, no randomness. A context package that read a clock could
 * not be reproduced from a transcript, and an AI interaction nobody can
 * reproduce is one nobody can review.
 */
export function toAiContext<I extends AiIntent>(
  intent: I,
  input: {
    readonly system: MyFoodSystem
    /** Gate 5 facts, when the intent needs them. Absent is a valid state. */
    readonly changed?: WhatChanged
  },
): AiContextByIntent[I] {
  const { system, changed } = input

  const priority = aiPriority(system)
  const resolvedActions = system.actions

  /*
   * The whole ceiling as a local, which is the ONLY place a value of this
   * shape exists. It is not returned, not exported, and not reachable — the
   * copy below is the boundary.
   */
  const everything: FoodSystemAiContextCeiling = {
    systemId: system.systemId,
    scoreId: system.scoreId,
    provenance: system.score.provenance,
    systemModelVersion: system.review.state === "set" ? system.review.setUnderVersion : "",
    actionSetVersion: actionSetVersionOf(system),

    scoreState: system.score.state,
    score: typeof system.score.score === "number" ? system.score.score : null,
    completeness: system.score.completeness,
    domains: system.score.domains.map((d) => ({
      domain: d.domain as FssDomain,
      state: d.state === "scored" ? "scored" : "insufficient",
      score: typeof d.score === "number" ? d.score : null,
      claimClass: "observed-behaviour" as const,
    })),

    priority,
    decisionsUnresolvable:
      system.priorities.state !== "resolved" || system.plan.state === "unresolvable",

    observations: system.observations.map((o) => ({ question: o.question, answer: o.answer })),
    limitingConstraints: system.context.limiting,
    contextAnswered: system.context.answered,

    todayAction: todayAction(system),
    actions: resolvedActions.map(aiAction),

    comparisonVerdict:
      changed?.state === "available" ? changed.comparison.scoreVerdict : null,
    whatChanged: changed ?? null,
    previousSystemId:
      changed?.state === "available" ? changed.comparison.previousSystemId : null,

    claimBoundary: {
      availableClasses: CLAIM_CLASSES,
      noPredictedOutcome: true,
      noPersonalBioticState: true,
      candidatePendingReview: true,
    },
  }

  const out: Record<string, unknown> = {}
  for (const key of INTENT_FIELDS[intent] as readonly (keyof FoodSystemAiContextCeiling)[]) {
    out[key] = everything[key]
  }
  return out as AiContextByIntent[I]
}

/* ── Private assembly ─────────────────────────────────────────────────── */

function aiPriority(system: MyFoodSystem): AiPriority {
  if (system.priorities.state !== "resolved" || system.priorities.priorities.length === 0) {
    /*
     * An unresolvable or empty decision still produces a context, carrying
     * `decisionsUnresolvable: true` and a priority nothing can be bound to.
     * `ai-claims.ts` refuses a basis against it, which is the correct outcome:
     * the product does not explain a decision it cannot read back.
     */
    return {
      priorityId: "",
      domain: "diversity",
      domainScore: 0,
      rank: -1,
      scoredDomainCount: 0,
      evidence: [],
      mustNotMean: PRIORITY_MUST_NOT_MEAN,
    }
  }

  const top = system.priorities.priorities[0]
  return {
    priorityId: top.id,
    domain: top.sourceDomain,
    domainScore: top.domainScore,
    rank: 0,
    scoredDomainCount: system.score.domains.filter((d) => d.state === "scored").length,
    evidence: top.evidence.map((e) => ({
      questionId: e.questionId,
      question: e.question,
      answer: e.answer,
    })),
    mustNotMean: PRIORITY_MUST_NOT_MEAN,
  }
}

function todayAction(system: MyFoodSystem): AiAction | null {
  const today = system.actions.find((a) => a.timeHorizon === "today")
  return today ? aiAction(today) : null
}

function aiAction(a: MyFoodSystem["actions"][number]): AiAction {
  return {
    actionId: a.id,
    recommendationId: a.content.state === "resolved" ? a.content.recommendation.id : null,
    category: a.actionCategory,
    timeHorizon: a.timeHorizon,
    state: a.state,
    resolvable: a.content.state === "resolved",
  }
}

function actionSetVersionOf(system: MyFoodSystem): string {
  return system.plan.state === "unresolvable" ? system.plan.storedActionSetVersion : ACTION_SET_VERSION
}
