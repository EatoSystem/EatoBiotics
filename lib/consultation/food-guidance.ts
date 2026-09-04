import {
  AVOIDANCE_CONSTRAINT_VALUES,
  FOOD_AVOIDANCES_QUESTION_ID,
  FOOD_CONSTRAINTS_QUESTION_ID,
  UNRESOLVED_AVOIDANCE_VALUES,
} from "./question-bank"
import { projectTrustedAnswers, type ConsultationCompletenessInput } from "./completeness"
import { constraintClass, declaresNoConstraints } from "./science-contract"

/**
 * Whether the Report is safe to name specific foods.
 *
 * ══ THE PROBLEM THIS EXISTS FOR ═════════════════════════════════════════════
 *
 * The Personal Food System Report recommends specific foods. The Consultation
 * asks whether anything must be worked around, and — only when someone says
 * there is an allergy or a medical avoidance — tries to find out what.
 *
 * That second question is optional, and it should stay optional. But it means
 * the Consultation can legitimately finish in a state where the customer has
 * said "there is a food I must avoid" and the system does not know which one:
 *
 *   · they declined the detail question entirely;
 *   · they chose "Something else, not listed here";
 *   · they chose "Prefer not to say".
 *
 * In all three the honest reading is the same: **an avoidance exists and is
 * unresolved.** The dangerous reading — and the one a Report generator would
 * reach by default, because the field is simply absent — is that there is
 * nothing to avoid.
 *
 * So the state is made explicit here rather than left to be inferred later.
 * This function does not suppress anything and does not touch the Report
 * generator; it is the small, testable fact that Phase 4A can act on.
 *
 * ══ WHAT IT DELIBERATELY IS NOT ═════════════════════════════════════════════
 *
 * Not a clinical safety engine. It does not reason about cross-reactivity,
 * severity, ingredients or substitutions, and it never asks the customer for
 * more than they offered. The safe behaviour when detail is missing is for the
 * Report to hold back specific suggestions — not for the Consultation to press
 * for disclosure. Data minimisation and safety point the same way here.
 *
 * ══ TRUSTED INPUT ONLY ══════════════════════════════════════════════════════
 *
 * It takes the completeness input and projects the trusted answers itself,
 * rather than accepting an answer map. A food-safety check reading unvalidated
 * answers — where a malformed constraint list could drop the very flag that
 * makes it cautious — is precisely the wrong place to be trusting.
 */

export interface FoodGuidanceConstraints {
  /** Everything the customer said the Report must work around. */
  declaredConstraints: readonly string[]
  /**
   * Constraints that require a specific food to be identified before specific
   * food guidance is safe — allergy and medical avoidance only.
   */
  safetyConstraints: readonly string[]
  /**
   * Constraints that shape suggestions without making an unnamed food unsafe:
   * vegetarian/vegan, religious or cultural, budget, time, dislikes.
   *
   * Separated from `safetyConstraints` because treating every declared
   * constraint as a safety constraint would suppress specific food guidance for
   * a vegetarian on a budget, and treating none of them as one would suppress
   * nothing at all. They may still be presented to the customer together.
   */
  practicalConstraints: readonly string[]
  /**
   * True ONLY where the customer affirmatively said there is nothing to work
   * around.
   *
   * `prefer-not-to-say` does not set this. Collapsing a declined disclosure
   * into "no constraint" converts silence into an affirmative safety claim,
   * which is the most consequential misreading available in this question — so
   * the two states are separate fields rather than one falsy value.
   */
  declaresNoConstraints: boolean
  /** True when the customer declined to disclose their constraints. */
  constraintsUndisclosed: boolean
  /**
   * True when a declared constraint means a specific food has to be identified
   * before specific food guidance is safe — an allergy or a medical avoidance.
   * A vegetarian, religious, budget or time constraint shapes suggestions
   * without making an unnamed food unsafe, so it does not set this.
   */
  requiresSpecificAvoidance: boolean
  /** Structured avoidances the Report can mechanically exclude. */
  knownAvoidances: readonly string[]
  /**
   * True when an avoidance is declared but not identified. Phase 4A should
   * read this as: do not name specific foods with confidence.
   */
  unresolvedSpecificAvoidance: boolean
}

/** Derive the food-guidance safety state from a Consultation's trusted answers. */
export function deriveFoodGuidanceConstraints(
  input: ConsultationCompletenessInput,
): FoodGuidanceConstraints {
  const trusted = projectTrustedAnswers(input)

  const rawConstraints = trusted[FOOD_CONSTRAINTS_QUESTION_ID]
  const declaredConstraints = Array.isArray(rawConstraints) ? rawConstraints : []

  const requiresSpecificAvoidance = declaredConstraints.some((c) =>
    AVOIDANCE_CONSTRAINT_VALUES.includes(c),
  )

  const rawAvoidances = trusted[FOOD_AVOIDANCES_QUESTION_ID]
  const avoidances = Array.isArray(rawAvoidances) ? rawAvoidances : []
  const knownAvoidances = avoidances.filter((v) => !UNRESOLVED_AVOIDANCE_VALUES.includes(v))

  // Unresolved only ever applies where an avoidance was actually declared. An
  // absent detail answer for someone with no allergy is not a safety state, it
  // is a question that was correctly never asked.
  const unresolvedSpecificAvoidance =
    requiresSpecificAvoidance &&
    (avoidances.length === 0 ||
      avoidances.some((v) => UNRESOLVED_AVOIDANCE_VALUES.includes(v)) ||
      knownAvoidances.length === 0)

  // Class membership, per the frozen Science Contract. `constraintClass` treats
  // an unrecognised value as `undisclosed` rather than absent — an unknown
  // constraint is information we do not have, not information that there is
  // nothing to work around.
  const safetyConstraints = declaredConstraints.filter((c) => constraintClass(c) === "safety")
  const practicalConstraints = declaredConstraints.filter((c) => constraintClass(c) === "practical")
  const constraintsUndisclosed = declaredConstraints.some((c) => constraintClass(c) === "undisclosed")

  return {
    declaredConstraints,
    safetyConstraints,
    practicalConstraints,
    declaresNoConstraints: declaresNoConstraints(declaredConstraints),
    constraintsUndisclosed,
    requiresSpecificAvoidance,
    knownAvoidances,
    unresolvedSpecificAvoidance,
  }
}
