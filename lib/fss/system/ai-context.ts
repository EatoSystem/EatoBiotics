import type { ScoreProvenance } from "@/lib/fss/engine/provenance"
import type { FssDomain } from "@/lib/fss/questions/types"
import type { ActionCategory, ClaimClass, TimeHorizon } from "@/lib/fss/action/types"
import type { ActionState } from "@/lib/fss/persistence/repository"
import type { MyFoodSystem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   THE AI CONTEXT PACKAGE — INTERFACE ONLY.

   No implementation that runs, no prompt, no model call, and NO CALLER. A test
   asserts the absence of a caller, so "interface only" is checked rather than
   intended.

   ══ WHY SHIP A SHAPE WITH NOTHING BEHIND IT ═════════════════════════════════

   Because the reasoning is fresh now and will not be when somebody needs this.
   Gate 3 made the same move with `StoredAction` — declared the shape "while the
   reasoning is fresh rather than invented alongside the content" — and the part
   that would have been hardest to add later was the refusal, not the fields.

   The refusal here is the absence described below. Added later, beside a
   working prompt that already needs a system message, it would lose.

   ══ WHAT IS NOT IN THIS INTERFACE, AND WHY THE ABSENCE IS ITS CONTENT ═══════

   There is no `systemPrompt`. No `instructions`. No `narrative`. No
   `summary`. No `tone`. No `persona`.

   A prompt field would become a second source for methodology. Somebody
   assembling a context package wants the model to behave, so they write the
   weights into the prompt, or the band thresholds, or the selection rule, or a
   paraphrase of the claims boundary. None of it is reviewed, all of it is free
   to drift from the code that actually decides, and it lives in the one place
   nobody reads as product logic.

   So this interface carries VALUES AND VERSIONS THE ENGINE PRODUCED, and
   nothing that tells a model what to say. Whatever eventually turns this into
   a request must get its instructions from somewhere that is reviewed as
   content — the same place `ACTION_CATALOGUE` and `DOMAIN_PRESENTATION` come
   from — and not from a field on this type.

   ══ AND IT CARRIES THE CLAIM BOUNDARY AS DATA ═══════════════════════════════

   `claimBoundary` lists what each class of statement is allowed to be, from the
   values already in `ClaimClass`. Not as a sentence for a model to read: as the
   classification of what it is being handed, so a consumer that wants to
   generate prose about a domain state can see that the state is
   `observed-behaviour` and that `biological-inference` is not among the
   available classes at all.

   ══ IT IS DERIVED FROM `MyFoodSystem`, AND SO CARRIES NO DECISION ═══════════

   `toAiContext` takes the composed view. It cannot select, re-plan, or move an
   action, because the view it receives has already resolved all of that from
   the stored decisions. An AI layer that could re-decide would be the silent
   recalculation this gate exists to prevent, arriving by a different door.
   ════════════════════════════════════════════════════════════════════════ */

/** One domain's state, as a value with its class — never as a sentence. */
export interface AiDomainState {
  readonly domain: FssDomain
  readonly state: "scored" | "insufficient"
  readonly score: number | null
  readonly claimClass: Extract<ClaimClass, "observed-behaviour">
}

/** One priority, with the evidence that produced it. */
export interface AiPriority {
  readonly priorityId: string
  readonly domain: FssDomain
  readonly domainScore: number
  readonly rank: number
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

/**
 * Everything an AI layer may be told about one person's Food System.
 *
 * Deliberately narrow, and deliberately flat: a consumer cannot reach through
 * this into the aggregate, the question set, the repository or the catalogue.
 */
export interface FoodSystemAiContext {
  /* ── Identity and provenance ─────────────────────────────────────────── */
  readonly systemId: string
  readonly scoreId: string
  readonly provenance: ScoreProvenance
  /** The policy that made the decisions below. */
  readonly systemModelVersion: string
  /** The content version the recommendations came from. */
  readonly actionSetVersion: string

  /* ── Score state ─────────────────────────────────────────────────────── */
  readonly scoreState: "scored" | "withheld"
  readonly score: number | null
  readonly completeness: number
  readonly domains: readonly AiDomainState[]

  /* ── Decisions ───────────────────────────────────────────────────────── */
  readonly priorities: readonly AiPriority[]
  /** True when a stored decision could not be read back under its version. */
  readonly decisionsUnresolvable: boolean

  /* ── What the person reported, unscored ──────────────────────────────── */
  readonly observations: readonly { readonly question: string; readonly answer: string | null }[]
  readonly reportedConstraints: readonly string[]
  readonly contextAnswered: boolean

  /* ── Human state ─────────────────────────────────────────────────────── */
  readonly actions: readonly AiAction[]

  /* ── The boundary, as data ───────────────────────────────────────────── */
  readonly claimBoundary: {
    /** The classes of statement that exist. `biological-inference` is not one. */
    readonly availableClasses: readonly ClaimClass[]
    /** No class permits predicting an outcome, a timeframe or a benefit. */
    readonly noPredictedOutcome: true
    /** No personal Prebiotic, Probiotic or Postbiotic state, in any form. */
    readonly noPersonalBioticState: true
    /** Everything here is candidate methodology, pending scientific review. */
    readonly candidatePendingReview: true
  }
}

/**
 * Build the context package from a composed Food System.
 *
 * NOT CALLED ANYWHERE, and a guard asserts that. It exists so the shape is
 * agreed while the reasoning is fresh; Gate 6 is where something uses it, and
 * whatever that is will have to arrive past the absences documented above.
 *
 * It is also pure, for the same reason the composer is: a context package that
 * read a clock or a store could not be reproduced from a transcript, and an AI
 * interaction nobody can reproduce is one nobody can review.
 */
export function toAiContext(_system: MyFoodSystem): FoodSystemAiContext {
  throw new Error(
    "toAiContext is an interface, not an implementation. Gate 4 ships the shape and no caller; " +
      "writing a body here is a Gate 6 decision that needs its own review, because what it would " +
      "hand a model is methodology.",
  )
}
