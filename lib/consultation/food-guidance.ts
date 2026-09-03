import {
  AVOIDANCE_CONSTRAINT_VALUES,
  FOOD_AVOIDANCES_QUESTION_ID,
  FOOD_CONSTRAINTS_QUESTION_ID,
  UNRESOLVED_AVOIDANCE_VALUES,
} from "./question-bank"
import { projectTrustedAnswers, type ConsultationCompletenessInput } from "./completeness"

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

  return {
    declaredConstraints,
    requiresSpecificAvoidance,
    knownAvoidances,
    unresolvedSpecificAvoidance,
  }
}
