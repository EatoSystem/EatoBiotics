import type { FssDomain } from "@/lib/fss/questions/types"

/* ════════════════════════════════════════════════════════════════════════
   Domain weights — an explicit versioned configuration.

   ── THERE ARE NO APPROVED WEIGHTS, AND NO PATH THAT PRETENDS OTHERWISE ────

   The founder's instruction is that no canonical FSS-v1 weights are selected
   yet, and specifically that 20/20/20/20/20 must not be chosen because it is
   tidy. That is the right call: equal weighting is a claim — that no domain
   matters more than another — and it needs a reviewer, not an aesthetic.

   So this module exports a weight SHAPE and one clearly-labelled fixture. It
   does not export approved weights, because none exist. The absence is
   enforced by `tests/unit/fss-engine.test.ts` rather than left to discipline:
   a test asserts that no export of this module is named as approved, and that
   the fixture cannot be used without an explicit non-production context.

   ── Why weights are configuration and not arithmetic ─────────────────────

   Today's model weights 40/20/40 because Prebiotics has six questions,
   Probiotics three and Postbiotics six. That is an artefact of question count,
   not a finding — and if a five-domain score simply averaged its domains, the
   same artefact would return in new clothes, because two of the five sit under
   Prebiotics.

   Weights are therefore declared, never emergent, and they carry a version.
   ════════════════════════════════════════════════════════════════════════ */

export type DomainWeights = Readonly<Record<FssDomain, number>>

/**
 * The only context in which fixture weights may be used.
 *
 * A required, explicitly-constructed token rather than a boolean flag: a
 * boolean invites `true` to be passed from somewhere that has not thought
 * about it, and a token named this cannot be passed by accident or read as
 * anything but what it is.
 */
export interface NonProductionFixtureContext {
  readonly __nonProductionFixture: "DEV_ONLY — not approved methodology"
  readonly reason: string
}

export function nonProductionFixture(reason: string): NonProductionFixtureContext {
  return { __nonProductionFixture: "DEV_ONLY — not approved methodology", reason }
}

/**
 * DEV ONLY. NOT APPROVED METHODOLOGY. NOT A RECOMMENDATION.
 *
 * These exist so the engine is executable — so tests can prove the arithmetic,
 * the missing-data rule and the withholding rule behave — and for no other
 * reason. The numbers are equal because the fixture needs SOME numbers and
 * equal ones make the arithmetic easiest to read in a test, NOT because equal
 * weighting is the proposal. Choosing them here would be exactly the decision
 * this gate refuses to make.
 *
 * `resolveWeights` will not accept them without a `NonProductionFixtureContext`.
 */
export const DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS: DomainWeights = {
  diversity: 0.2,
  plantsAndFibre: 0.2,
  fermentedFoods: 0.2,
  foodQuality: 0.2,
  mealRhythm: 0.2,
}

export class UnapprovedWeightsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnapprovedWeightsError"
  }
}

/**
 * The only way to obtain weights, and it refuses unless told what it is doing.
 *
 * There is no `resolveApprovedWeights`, no default parameter and no fallback.
 * A caller that wants to score something must either pass a fixture context —
 * which names itself as non-production in the type — or pass approved weights
 * that do not yet exist. That is the intended state: the engine is complete
 * and unusable in production, which is what "candidate" should mean in code
 * rather than only in a document.
 */
export function resolveWeights(
  weights: DomainWeights,
  context: NonProductionFixtureContext,
): DomainWeights {
  if (context?.__nonProductionFixture !== "DEV_ONLY — not approved methodology") {
    throw new UnapprovedWeightsError(
      "FSS-v1 weights are not approved. Scoring requires an explicit non-production fixture context. " +
        "If you are reading this because you want to score a real customer: the domain set has no named " +
        "scientific reviewer and no weight has a rationale. That is the blocker, not this function.",
    )
  }

  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  if (Math.abs(total - 1) > 1e-9) {
    throw new UnapprovedWeightsError(
      `Domain weights must sum to 1; got ${total}. A weight set that does not sum to 1 produces a score ` +
        `on a scale nobody declared.`,
    )
  }
  return weights
}
