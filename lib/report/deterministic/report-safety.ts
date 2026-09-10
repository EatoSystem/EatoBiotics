import type { FoodGuidanceConstraints } from "@/lib/consultation/food-guidance"
import type { ConsultationAnswers } from "@/lib/consultation/types"

import { reportCapabilityEnabled } from "./capabilities"
import { STRUCTURAL_COPY } from "./content-pack"
import type { FoodSafetyState, ReportSafety } from "./report-types"

/**
 * Where the Report decides whether it may name a food — Phase 4A-S2.
 *
 * ══ THE Q17 CONTRADICTION ═══════════════════════════════════════════════════
 *
 * `deriveFoodGuidanceConstraints` (lib/consultation/food-guidance.ts) reads
 * exactly two questions: `environment.constraints` and
 * `environment.foodAvoidances`. It does not read
 * `environment.householdDifferingNeeds`.
 *
 * So a family who selects "Yes — allergies or intolerances" in Q17, and
 * nothing in Q16, produces a frozen `foodGuidance` with
 * `requiresSpecificAvoidance: false` and `unresolvedSpecificAvoidance: false`
 * — a food-safety state that reads as clear while the trusted answers say a
 * household allergy exists.
 *
 * Today that is harmless: no Report names a food. It stops being harmless the
 * moment `specificFoods` is enabled, and by then the seal will already have
 * been written. So the Report detects it now and FAILS CLOSED.
 *
 * ══ WHY NOT JUST FIX food-guidance.ts ══════════════════════════════════════
 *
 * Because that function's output is FROZEN INTO SEALED RECORDS. Changing what
 * it derives changes what a finalisation means, and finalisations already
 * written would then be read under a rule they were not made under. That is a
 * versioned Consultation-contract correction with its own activation
 * sequence — not something a Report-composition phase may do on the way past.
 *
 * This module is therefore an explicit, temporary COMPATIBILITY BOUNDARY: it
 * refuses to interpret contradictory inputs, and it says so in a typed state
 * rather than silently reconciling them. It is deliberately conservative in
 * one direction only — it can suppress, never permit.
 *
 * ── When the underlying correction lands ───────────────────────────────────
 * The contradiction becomes unreachable and this detector becomes dead code
 * that still passes. Removing it then is a deliberate act with its own review;
 * leaving it costs one comparison.
 */

/** The Q17 value that declares a household allergy or intolerance. */
export const HOUSEHOLD_ALLERGY_VALUE = "allergies"
export const HOUSEHOLD_DIFFERING_NEEDS_QUESTION_ID =
  "core_environment_household_differing_needs_v1"

/**
 * Does the household declare an allergy that the frozen food-safety state does
 * not reflect?
 *
 * Pure, and takes the trusted answers plus the frozen guidance — never the
 * mutable state, never the browser's answers.
 */
export function hasQ17SafetyContradiction(
  trustedAnswers: ConsultationAnswers,
  foodGuidance: FoodGuidanceConstraints,
): boolean {
  const raw = trustedAnswers[HOUSEHOLD_DIFFERING_NEEDS_QUESTION_ID]
  const declared = Array.isArray(raw) ? raw : []
  if (!declared.includes(HOUSEHOLD_ALLERGY_VALUE)) return false

  /*
   * A household allergy IS declared. The frozen guidance is consistent with it
   * only if it already treats this Consultation cautiously — either because
   * Q16 also named a safety constraint, or because an avoidance is unresolved.
   * If it does neither, the two disagree.
   */
  const alreadyCautious =
    foodGuidance.requiresSpecificAvoidance || foodGuidance.unresolvedSpecificAvoidance
  return !alreadyCautious
}

/**
 * The Report's food-safety position.
 *
 * Order matters and is fail-closed: a contradiction outranks everything, then
 * an unresolved avoidance, then a declined disclosure, then known constraints,
 * and only a positive declaration of "nothing to work around" reaches
 * `none-declared`.
 */
export function resolveReportSafety(
  trustedAnswers: ConsultationAnswers,
  foodGuidance: FoodGuidanceConstraints,
): ReportSafety {
  const reasons: string[] = []

  // The capability is checked first because it suppresses regardless of what
  // the customer said — an open specialist gate is not about this customer.
  if (!reportCapabilityEnabled("specificFoods")) {
    reasons.push("capability:specificFoods-disabled")
  }

  let state: FoodSafetyState
  let note: string | undefined

  if (hasQ17SafetyContradiction(trustedAnswers, foodGuidance)) {
    state = "contradictory"
    reasons.push("q17:household-allergy-not-in-frozen-food-guidance")
    // Deliberately the same customer-facing wording as an unresolved
    // avoidance. The customer does not need to know that two of our modules
    // disagree; they need to know we are keeping to general guidance.
    note = STRUCTURAL_COPY.unresolvedAvoidance
  } else if (foodGuidance.unresolvedSpecificAvoidance) {
    state = "unresolved-avoidance"
    reasons.push("avoidance:declared-but-unresolved")
    note = STRUCTURAL_COPY.unresolvedAvoidance
  } else if (foodGuidance.constraintsUndisclosed) {
    state = "undisclosed"
    reasons.push("constraints:undisclosed")
    note = STRUCTURAL_COPY.constraintsUndisclosed
  } else if (foodGuidance.declaredConstraints.length > 0 && !foodGuidance.declaresNoConstraints) {
    state = "constraints-known"
  } else if (foodGuidance.declaresNoConstraints) {
    state = "none-declared"
  } else {
    /*
     * Nothing declared, and not an affirmative "none" either. That is absence
     * of information, and absence of information is not a clearance — the same
     * rule `prefer-not-to-say` follows.
     */
    state = "undisclosed"
    reasons.push("constraints:absent")
    note = STRUCTURAL_COPY.constraintsUndisclosed
  }

  // Any state other than a clean known/none position also suppresses foods, on
  // top of whatever the capability says.
  if (state === "contradictory" || state === "unresolved-avoidance" || state === "undisclosed") {
    reasons.push(`state:${state}`)
  }

  return {
    state,
    note,
    specificFoodsSuppressed: reasons.length > 0,
    suppressionReasons: reasons,
  }
}

/**
 * May this Report name a specific food?
 *
 * One question, one answer, used by every caller — so "can we say broccoli"
 * has a single implementation rather than three that agree today.
 */
export function mayNameSpecificFoods(safety: ReportSafety): boolean {
  return !safety.specificFoodsSuppressed
}
