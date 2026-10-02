import { priorityIdFor } from "@/lib/fss/action/priority"
import type { ClaimClass } from "@/lib/fss/action/types"
import type { FssDomain } from "@/lib/fss/questions/types"
import type { MyFoodSystem } from "./types"

/* ════════════════════════════════════════════════════════════════════════
   CLAIM BINDINGS — what a statement is ABOUT, checked deterministically.

   ══ VALIDATE THE CLAIM BINDING. GUARD THE LANGUAGE SEPARATELY. ══════════════

   The first design of this module was a function that read arbitrary prose and
   decided whether it contradicted the persisted plan —
   `validatePlanExplanation({ persistedPriorityDomain, sentence })`. It was
   withdrawn in review, correctly, for two reasons:

     it would be a second miniature NLP engine, and this gate exists to have
     ONE decision engine;

     and worse, it would be a DECISION ENGINE DECIDING WHETHER A CLAIM IS
     ACCEPTABLE. A regex asked "does this prose secretly disagree with the
     plan?" is wrong in both directions and unfixable in either.

   So the direction is inverted. The explanation is STRUCTURED FIRST, and prose
   is generated from the structure. The model is not given free rein and then
   policed; it is given only the basis it is permitted to explain. That is the
   same move as the intent context contract, one level down: constrain the
   input rather than audit the output.

   The language layer still exists and is NOT this module. `assertClean` /
   `GENERATED_CLAIM_RULES` (tests/unit/agent-loop-claims.test.ts) and
   `PERSONAL_BIOTIC_STATE` (tests/unit/biotic-claims.test.ts) are the
   instruments that have caught every claim regression in this programme, and
   Gate 6.1 points them at the generated answer. They sit SEPARATE FROM, and
   SUBORDINATE TO, the binding validation here.

   ══ WHAT A BINDING CANNOT EXPRESS ══════════════════════════════════════════

   There is no `alternatives`, no `consideredDomains`, no `suggestedPriority`
   and no `confidence`. A basis has nowhere to nominate a different priority,
   so an appeal is not a thing the type can hold — and a key-set pin refuses
   one being added. The checks below are the backstop for a basis that arrived
   from somewhere else, deserialised.

   ══ IT INHERITS VERSION REFUSAL FOR FREE ═══════════════════════════════════

   A basis is validated against the COMPOSED view, so `resolvePriorityDecision`
   has already refused a decision whose `systemModelVersion` no longer
   resolves. No new anchor, and a basis cannot be built from a decision the
   product would not itself explain.
   ════════════════════════════════════════════════════════════════════════ */

/**
 * What a claim is about, structurally.
 *
 * A discriminated union from the start, so the other classes arrive as members
 * rather than as a redesign. Only `plan-explanation` is built now, because it
 * carries the invariant that matters: the AI may explain a decision and may
 * not appeal it.
 *
 * The shapes the others will take, declared so nobody has to re-derive them:
 * `system-fact` binds to the score it came from, and `practical-suggestion`
 * binds to the persisted action it implements.
 */
export type ClaimBasis = {
  readonly claimClass: Extract<ClaimClass, "plan-explanation">
  readonly priorityId: string
  readonly priorityDomain: FssDomain
  readonly evidenceIds: readonly string[]
  readonly actionId?: string
}

/** Every key a basis may carry, so a guard can refuse a seventh. */
export const CLAIM_BASIS_KEYS: readonly string[] = [
  "claimClass",
  "priorityId",
  "priorityDomain",
  "evidenceIds",
  "actionId",
]

/**
 * Why a binding was refused. Each names a DIFFERENT way to appeal a decision
 * while carrying ids that all look correct.
 */
export type BindingRefusal =
  /** `priorityId` and `priorityDomain` describe different priorities. */
  | "basis-internally-inconsistent"
  /** The product cannot read its own decision back, so it explains nothing. */
  | "decision-unresolvable"
  /** Not a priority this system selected at all. */
  | "not-a-selected-priority"
  /** Selected, but not the one being explained as the current focus. */
  | "not-the-current-priority"
  /** Evidence from a different domain than the priority's own. */
  | "evidence-outside-priority-domain"
  /** An action from a different plan. */
  | "action-outside-plan"

export type BindingVerdict =
  | { readonly bound: true }
  | { readonly bound: false; readonly because: BindingRefusal; readonly explain: string }

/**
 * May this basis be explained against this Food System?
 *
 * Deterministic and total. It reads ids and domains; it reads no prose, and
 * there is no sentence parameter for it to read.
 */
export function validateClaimBinding(args: {
  readonly system: MyFoodSystem
  readonly basis: ClaimBasis
}): BindingVerdict {
  const { system, basis } = args

  /*
   * 1 · INTERNALLY CONSISTENT. `priorityIdFor` is `priority:${domain}` and
   * total, so this is exact. Carrying both the id and the domain is deliberate
   * redundancy: a basis assembled from two sources can disagree with itself,
   * and catching that is better than silently deriving one from the other.
   */
  if (priorityIdFor(basis.priorityDomain) !== basis.priorityId) {
    return refuse(
      "basis-internally-inconsistent",
      `The basis names priority "${basis.priorityId}" and domain "${basis.priorityDomain}", ` +
        "which are not the same priority. It was assembled from two sources that disagree.",
    )
  }

  /*
   * 2 · THE DECISION IS READABLE. An unresolvable priority decision means the
   * product cannot reconstruct why it chose what it chose, and a product that
   * cannot reconstruct its reasoning does not get to explain it.
   */
  if (system.priorities.state !== "resolved") {
    return refuse(
      "decision-unresolvable",
      "This system's priority decision could not be read back under its own policy version, " +
        "so there is no persisted decision to explain.",
    )
  }

  const selected = system.priorities.priorities
  const index = selected.findIndex(
    (p) => p.id === basis.priorityId && p.sourceDomain === basis.priorityDomain,
  )

  /* 3 · IT IS A PRIORITY THIS SYSTEM ACTUALLY SELECTED. */
  if (index === -1) {
    return refuse(
      "not-a-selected-priority",
      `"${basis.priorityDomain}" is not among the priorities this Food System selected. ` +
        "Explaining it would be nominating a priority rather than explaining one.",
    )
  }

  /*
   * 4 · AND IT IS THE CURRENT FOCUS, NOT MERELY SELECTED.
   *
   * `selected` holds up to three. Binding to the rank-2 entry while the
   * sentence calls it "your current focus" is an appeal with entirely correct
   * ids, so membership is not enough — the RANK is part of the binding.
   */
  if (index !== 0) {
    return refuse(
      "not-the-current-priority",
      `"${basis.priorityDomain}" is selected at rank ${index}, not the current focus. ` +
        "Presenting it as the focus would reorder a persisted decision.",
    )
  }

  /*
   * 5 · EVERY EVIDENCE ITEM BELONGS TO THAT PRIORITY'S OWN DOMAIN.
   *
   * "Diversity is your focus because [evidence about Meal Rhythm]" has valid
   * ids throughout and is still an appeal — it argues for a different domain
   * under the right heading.
   */
  const ownEvidence = new Set(selected[0].evidence.map((e) => e.questionId))
  const foreign = basis.evidenceIds.filter((id) => !ownEvidence.has(id))
  if (foreign.length > 0) {
    return refuse(
      "evidence-outside-priority-domain",
      `Evidence ${foreign.join(", ")} does not belong to the ${basis.priorityDomain} priority. ` +
        "Evidence from another domain argues for another domain.",
    )
  }

  /* 6 · THE ACTION, IF NAMED, BELONGS TO THIS PLAN. */
  if (basis.actionId !== undefined) {
    const known = system.actions.some((a) => a.id === basis.actionId)
    if (!known) {
      return refuse(
        "action-outside-plan",
        `Action "${basis.actionId}" is not in this Food System's plan. A suggestion may describe ` +
          "how to carry out a persisted action, never substitute a different one.",
      )
    }
  }

  return { bound: true }
}

function refuse(because: BindingRefusal, explain: string): BindingVerdict {
  return { bound: false, because, explain }
}
