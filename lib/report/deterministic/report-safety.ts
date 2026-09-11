import type { FoodGuidanceConstraints } from "@/lib/consultation/food-guidance"
import type { ConsultationAnswers } from "@/lib/consultation/types"

import { reportCapabilityEnabled } from "./capabilities"
import { STRUCTURAL_COPY } from "./content-pack"
import type { FoodSafetyState, ReportSafety } from "./report-types"

/**
 * Where the Report decides whether it may name a food — Phase 4A-S2.
 *
 * ══ THE UNREPRESENTED HOUSEHOLD ALLERGY ═════════════════════════════════════
 *
 * `deriveFoodGuidanceConstraints` (lib/consultation/food-guidance.ts) reads
 * exactly two questions: `environment.constraints` and
 * `environment.foodAvoidances`. It does not read
 * `environment.householdDifferingNeeds`.
 *
 * So a family who selects "Yes — allergies or intolerances" in Q17 produces a
 * frozen `foodGuidance` that says nothing whatsoever about that declaration.
 * The trusted answers record a household allergy; the frozen safety state was
 * derived without ever seeing it.
 *
 * Today that is harmless: no Report names a food. It stops being harmless the
 * moment `specificFoods` is enabled, and by then the seal will already have
 * been written. So the Report detects it now and FAILS CLOSED.
 *
 * ══ WHY Q16 AND Q18 CANNOT RESOLVE IT ══════════════════════════════════════
 *
 * An earlier version of this module treated `requiresSpecificAvoidance` or
 * `unresolvedSpecificAvoidance` as already-cautious enough, and returned
 * "no contradiction" when either was set. That was wrong, and it was wrong in
 * the dangerous direction.
 *
 * Those flags come from Q16 and Q18 — different questions, answered about a
 * different scope. Q16 and Q18 are the customer's own constraints and
 * avoidances; Q17 is a statement that SOMEONE ELSE IN THE HOUSEHOLD has an
 * allergy or intolerance. There is no evidence the two describe the same
 * person, and none at all that they describe the same avoidance. A customer
 * who avoids dairy themselves, and whose child is allergic to peanuts, would
 * have had the peanut declaration silently absorbed by the dairy one.
 *
 * So the question this module asks is not "do two derivations disagree" — it
 * is "did the frozen guidance ever represent this declaration at all". The
 * answer, while C1 does not consume Q17, is always no.
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
 * Has the household declared an allergy the frozen food-safety state never saw?
 *
 * Unconditional by design: while `deriveFoodGuidanceConstraints` does not read
 * Q17, EVERY Q17 `allergies` answer is unrepresented, whatever Q16 and Q18
 * happen to contain. The frozen guidance is deliberately NOT consulted here —
 * taking it as an argument at all would invite the next reader to weigh it,
 * and weighing it is the defect this signature exists to prevent.
 *
 * Pure, and takes the trusted answers only — never the mutable state, never
 * the browser's answers.
 */
export function hasUnrepresentedHouseholdAllergy(
  trustedAnswers: ConsultationAnswers,
): boolean {
  const raw = trustedAnswers[HOUSEHOLD_DIFFERING_NEEDS_QUESTION_ID]
  const declared = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []
  return declared.includes(HOUSEHOLD_ALLERGY_VALUE)
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

  if (hasUnrepresentedHouseholdAllergy(trustedAnswers)) {
    /*
     * FIRST, and unconditionally. Nothing below may reclassify this into
     * `constraints-known` or `none-declared`: a Report that told a household
     * with a declared allergy that there is nothing to work around would be
     * wrong in the one place it cannot afford to be.
     */
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
