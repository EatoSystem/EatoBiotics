import { describe, it, expect } from "vitest"

import type { ConsultationAnswers, ConsultationQuestion } from "@/lib/consultation/types"
import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { validateAnswer } from "@/lib/consultation/validation"
import {
  projectTrustedAnswers,
  trustedAnswersByField,
  validateConsultationAnswers,
} from "@/lib/consultation/completeness"
import { deriveFoodGuidanceConstraints } from "@/lib/consultation/food-guidance"

/**
 * Completeness and trusted-answer projection.
 *
 * These are the pure functions the submission route is intended to adopt in
 * Phase 3B/3C. Two properties carry most of the weight:
 *
 *   nothing is inferred — an unanswered slider is not the midpoint, an empty
 *   textarea is not an opinion, and an empty multi array is not "none";
 *
 *   nothing stale survives — an answer to a branch whose trigger has since
 *   changed is not merely deprioritised, it is absent from the projection.
 */

const you = { foundation: "you" } as const
const family = { foundation: "family" } as const

/** A complete, valid You submission. Individual tests break one thing at a time. */
function completeYouAnswers(): ConsultationAnswers {
  return {
    core_signals_post_meal_pattern_v1: "bloating",
    core_signals_energy_shape_v1: "afternoon-dip",
    core_signals_context_v1: ["rushed", "stress-sleep"],
    core_signals_settled_days_v1: "regular-meals",
    core_rhythm_first_meal_v1: "one-to-three",
    core_rhythm_longest_gap_v1: "6-to-8",
    core_rhythm_week_shape_v1: "looser",
    core_rhythm_recent_change_v1: ["schedule"],
    core_environment_cooking_frequency_v1: "most",
    core_environment_who_prepares_v1: "me",
    core_environment_planning_v1: "planned",
    core_environment_constraints_v1: ["time"],
    core_intentions_primary_focus_v1: "energy",
    core_intentions_barrier_v1: "time",
  }
}

function completeFamilyAnswers(): ConsultationAnswers {
  return {
    core_signals_household_mealtime_v1: "rushed",
    core_signals_household_hardest_moment_v1: "after-school-work",
    core_rhythm_household_shared_meals_v1: "most-days",
    core_rhythm_week_shape_v1: "very-different",
    core_rhythm_recent_change_v1: ["none"],
    core_environment_cooking_frequency_v1: "most",
    core_environment_who_prepares_v1: "shared",
    core_environment_planning_v1: "regular",
    core_environment_constraints_v1: ["budget"],
    core_environment_household_differing_needs_v1: ["tastes"],
    core_intentions_primary_focus_v1: "consistency",
    core_intentions_barrier_v1: "different-needs",
  }
}

/** A synthetic question, so validation rules can be tested away from content. */
function q(partial: Partial<ConsultationQuestion> & { id: string }): ConsultationQuestion {
  return {
    answerField: "signals.synthetic",
    section: "signals",
    type: "single",
    foundations: ["you"],
    text: "A synthetic question for testing answer validation",
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Exercises answer validation in isolation from real content.",
    whyNeeded: "Validation rules and question content fail in different ways and are tested separately.",
    reportTargets: ["systemSnapshot"],
    freeAssessmentOverlap: "none",
    ...partial,
  } as ConsultationQuestion
}

/* ══ Single ══════════════════════════════════════════════════════════════════ */

describe("single-choice answers", () => {
  const question = q({
    id: "core_signals_single_v1",
    options: [
      { label: "Alpha", value: "alpha" },
      { label: "Beta", value: "beta" },
    ],
  })

  it("accepts a declared option", () => {
    expect(validateAnswer(question, "alpha")).toEqual({ status: "valid", value: "alpha" })
  })

  it("treats an absent answer as missing, not invalid", () => {
    expect(validateAnswer(question, undefined).status).toBe("missing")
    expect(validateAnswer(question, null).status).toBe("missing")
    expect(validateAnswer(question, "   ").status).toBe("missing")
  })

  it("rejects a value the question does not offer", () => {
    expect(validateAnswer(question, "gamma").status).toBe("invalid")
    expect(validateAnswer(question, 3).status).toBe("invalid")
    expect(validateAnswer(question, ["alpha"]).status).toBe("invalid")
  })
})

/* ══ Multi ═══════════════════════════════════════════════════════════════════ */

describe("multi-choice answers", () => {
  const question = q({
    id: "core_signals_multi_v1",
    type: "multi",
    options: [
      { label: "Alpha", value: "alpha" },
      { label: "Beta", value: "beta" },
      { label: "None of these", value: "none", exclusive: true },
    ],
  })

  it("accepts several combinable values", () => {
    expect(validateAnswer(question, ["alpha", "beta"])).toEqual({
      status: "valid",
      value: ["alpha", "beta"],
    })
  })

  it("treats an empty selection as missing, never as 'none'", () => {
    // "None of these" is a choice the customer has to actually make. Inferring
    // it from an empty array would record an answer nobody gave.
    expect(validateAnswer(question, []).status).toBe("missing")
  })

  it("rejects an exclusive value combined with anything else", () => {
    const result = validateAnswer(question, ["none", "alpha"])
    expect(result.status).toBe("invalid")
    expect(result.status === "invalid" && result.reason).toMatch(/cannot be combined/)
  })

  it("accepts an exclusive value on its own", () => {
    expect(validateAnswer(question, ["none"]).status).toBe("valid")
  })

  it("rejects two exclusive values together", () => {
    const both = q({
      ...question,
      options: [
        { label: "Alpha", value: "alpha" },
        { label: "None", value: "none", exclusive: true },
        { label: "Prefer not to say", value: "prefer-not-to-say", exclusive: true },
      ],
    })
    expect(validateAnswer(both, ["none", "prefer-not-to-say"]).status).toBe("invalid")
  })

  it("rejects unknown values, duplicates and wrong shapes", () => {
    expect(validateAnswer(question, ["gamma"]).status).toBe("invalid")
    expect(validateAnswer(question, ["alpha", "alpha"]).status).toBe("invalid")
    expect(validateAnswer(question, "alpha").status).toBe("invalid")
    expect(validateAnswer(question, [1, 2]).status).toBe("invalid")
  })

  it("enforces a minimum selection count on a required question", () => {
    const two = q({ ...question, minSelections: 2 })
    expect(validateAnswer(two, ["alpha"]).status).toBe("invalid")
    expect(validateAnswer(two, ["alpha", "beta"]).status).toBe("valid")
  })

  it("exclusivity comes from the flag, not from the label", () => {
    const unflagged = q({
      ...question,
      options: [
        { label: "Alpha", value: "alpha" },
        { label: "None of these", value: "none" },
      ],
    })
    // Same label, no flag: the validator must not invent the rule.
    expect(validateAnswer(unflagged, ["none", "alpha"]).status).toBe("valid")
  })
})

/* ══ Slider ══════════════════════════════════════════════════════════════════ */

describe("slider answers", () => {
  const question = q({ id: "core_signals_slider_v1", type: "slider", min: 1, max: 10 })

  it("has no default — an absent answer is missing", () => {
    expect(validateAnswer(question, undefined).status).toBe("missing")
    // Notably NOT the midpoint. A slider that answers itself is the single
    // easiest way for a Report to describe someone who was never asked.
    expect(validateAnswer(question, undefined)).not.toHaveProperty("value")
  })

  it("accepts a value inside its bounds, including the ends", () => {
    for (const v of [1, 5, 10]) expect(validateAnswer(question, v)).toEqual({ status: "valid", value: v })
  })

  it("rejects a value outside its bounds", () => {
    for (const v of [0, 11, -3]) expect(validateAnswer(question, v).status).toBe("invalid")
  })

  it("rejects non-numbers and non-finite numbers", () => {
    // A numeric string is the interesting one: it survives JSON, looks like an
    // answer, and would coerce silently under a `<`/`>` comparison.
    for (const v of ["5", true, [], {}, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(validateAnswer(question, v).status, JSON.stringify(v)).toBe("invalid")
    }
  })

  it("refuses when the question declares no bounds", () => {
    const unbounded = q({ id: "core_signals_slider_v1", type: "slider" })
    expect(validateAnswer(unbounded, 5).status).toBe("invalid")
  })
})

/* ══ Textarea ════════════════════════════════════════════════════════════════ */

describe("free-text answers", () => {
  const question = q({ id: "core_signals_text_v1", type: "textarea", maxLength: 100, required: false })

  it("trims, and treats whitespace as no answer", () => {
    expect(validateAnswer(question, "  steadier mornings  ")).toEqual({
      status: "valid",
      value: "steadier mornings",
    })
    expect(validateAnswer(question, "     ").status).toBe("missing")
    expect(validateAnswer(question, "\n\t ").status).toBe("missing")
  })

  it("enforces the configured maximum", () => {
    expect(validateAnswer(question, "x".repeat(100)).status).toBe("valid")
    expect(validateAnswer(question, "x".repeat(101)).status).toBe("invalid")
  })

  it("a required textarea of whitespace is missing, so completeness fails", () => {
    const required = q({ ...question, required: true })
    expect(validateAnswer(required, "   ").status).toBe("missing")
  })
})

/* ══ Completeness ════════════════════════════════════════════════════════════ */

describe("completeness over the real bank", () => {
  it("a full You submission is complete", () => {
    const result = validateConsultationAnswers({ context: you, answers: completeYouAnswers() })
    expect(result.missingQuestionIds).toEqual([])
    expect(result.invalidQuestionIds).toEqual([])
    expect(result.complete).toBe(true)
  })

  it("a full Family submission is complete", () => {
    const result = validateConsultationAnswers({ context: family, answers: completeFamilyAnswers() })
    expect(result.missingQuestionIds).toEqual([])
    expect(result.invalidQuestionIds).toEqual([])
    expect(result.complete).toBe(true)
  })

  it("an empty submission names every required baseline question", () => {
    const result = validateConsultationAnswers({ context: you, answers: {} })
    expect(result.complete).toBe(false)
    expect(result.missingQuestionIds.length).toBe(12)
    // The one optional baseline question is not reported as missing.
    expect(result.missingQuestionIds).not.toContain("core_intentions_success_v1")
  })

  it("a missing required answer is reported, and blocks completeness", () => {
    const answers = completeYouAnswers()
    delete answers.core_rhythm_first_meal_v1
    const result = validateConsultationAnswers({ context: you, answers })
    expect(result.missingQuestionIds).toEqual(["core_rhythm_first_meal_v1"])
    expect(result.complete).toBe(false)
  })

  it("an invalid answer is reported separately from a missing one", () => {
    const answers = { ...completeYouAnswers(), core_rhythm_first_meal_v1: "whenever" }
    const result = validateConsultationAnswers({ context: you, answers })
    expect(result.invalidQuestionIds).toEqual(["core_rhythm_first_meal_v1"])
    expect(result.missingQuestionIds).toEqual([])
    expect(result.complete).toBe(false)
    expect(result.trustedAnswers.core_rhythm_first_meal_v1).toBeUndefined()
  })

  it("the optional free-text question never blocks completion", () => {
    const withText = { ...completeYouAnswers(), core_intentions_success_v1: "More settled mornings." }
    expect(validateConsultationAnswers({ context: you, answers: withText }).complete).toBe(true)
    expect(validateConsultationAnswers({ context: you, answers: completeYouAnswers() }).complete).toBe(true)
  })

  it("an applicable adaptive question that is required blocks completion", () => {
    const answers = completeYouAnswers()
    delete answers.core_signals_settled_days_v1
    const result = validateConsultationAnswers({ context: you, answers })
    expect(result.applicableQuestionIds).toContain("core_signals_settled_days_v1")
    expect(result.missingQuestionIds).toEqual(["core_signals_settled_days_v1"])
    expect(result.complete).toBe(false)
  })

  it("an inapplicable adaptive question does not block completion", () => {
    const answers = completeYouAnswers()
    answers.core_signals_post_meal_pattern_v1 = "nothing"
    delete answers.core_signals_settled_days_v1
    const result = validateConsultationAnswers({ context: you, answers })
    expect(result.applicableQuestionIds).not.toContain("core_signals_settled_days_v1")
    expect(result.complete).toBe(true)
  })

  it("an applicable but OPTIONAL adaptive question never blocks completion", () => {
    const answers = { ...completeYouAnswers(), core_rhythm_recent_change_v1: ["health-event"] }
    const result = validateConsultationAnswers({ context: you, answers })
    expect(result.applicableQuestionIds).toContain("core_rhythm_antibiotics_v1")
    expect(result.missingQuestionIds).toEqual([])
    expect(result.complete).toBe(true)
  })
})

/* ══ Trusted answer projection ═══════════════════════════════════════════════ */

describe("trusted answer projection", () => {
  it("drops a stale branch answer once its trigger changes", () => {
    // The failure this exists for: they answered the follow-up, then went back
    // and changed the trigger. Nothing errors — the Report is simply about
    // someone who does not exist.
    const answered = { ...completeYouAnswers(), core_signals_settled_days_v1: "lighter-meals" }
    expect(projectTrustedAnswers({ context: you, answers: answered })).toHaveProperty(
      "core_signals_settled_days_v1",
    )

    const changedMind = { ...answered, core_signals_post_meal_pattern_v1: "nothing" }
    const trusted = projectTrustedAnswers({ context: you, answers: changedMind })
    expect(trusted.core_signals_settled_days_v1).toBeUndefined()
    // And it is reported as dropped rather than silently vanishing.
    expect(
      validateConsultationAnswers({ context: you, answers: changedMind }).droppedQuestionIds,
    ).toContain("core_signals_settled_days_v1")
  })

  it("drops an answer to a question this foundation never asks", () => {
    const answers = {
      ...completeFamilyAnswers(),
      core_signals_post_meal_pattern_v1: "bloating",
      core_rhythm_first_meal_v1: "within-hour",
    }
    const trusted = projectTrustedAnswers({ context: family, answers })
    expect(trusted.core_signals_post_meal_pattern_v1).toBeUndefined()
    expect(trusted.core_rhythm_first_meal_v1).toBeUndefined()
  })

  it("drops an answer whose id was never in the bank", () => {
    const answers = {
      ...completeYouAnswers(),
      dq1: "legacy",
      mind_lens1: "steady",
      "'; drop table": "nonsense",
    }
    const trusted = projectTrustedAnswers({ context: you, answers })
    for (const key of Object.keys(trusted)) {
      expect(CONSULTATION_QUESTION_BANK.some((x) => x.id === key)).toBe(true)
    }
  })

  it("drops an answer that fails its own domain rules", () => {
    const answers = {
      ...completeYouAnswers(),
      core_environment_constraints_v1: ["none", "budget"], // exclusive + another
      core_intentions_primary_focus_v1: "world-peace", // not an option
    }
    const trusted = projectTrustedAnswers({ context: you, answers })
    expect(trusted.core_environment_constraints_v1).toBeUndefined()
    expect(trusted.core_intentions_primary_focus_v1).toBeUndefined()
  })

  it("invents nothing", () => {
    const trusted = projectTrustedAnswers({ context: you, answers: {} })
    expect(trusted).toEqual({})
  })

  it("does not mutate the answers it is given", () => {
    const answers = completeYouAnswers()
    const snapshot = JSON.stringify(answers)
    projectTrustedAnswers({ context: you, answers })
    expect(JSON.stringify(answers)).toBe(snapshot)
  })

  it("keys by semantic answer field for the future Report reader", () => {
    const byField = trustedAnswersByField({ context: you, answers: completeYouAnswers() })
    expect(byField["rhythm.longestGap"]).toBe("6-to-8")
    expect(byField["environment.cookingFrequency"]).toBe("most")
    expect(byField["intentions.primaryFocus"]).toBe("energy")
    // Question identity is not answer meaning, and the field map proves it.
    expect(byField.core_rhythm_longest_gap_v1).toBeUndefined()
  })

  it("an invalid trigger drops the child that depended on it", () => {
    // The two halves have to agree. If applicability read a malformed trigger
    // more permissively than the projection does, a customer could be ASKED a
    // question whose answer is then silently discarded — and the Report would
    // be built from a set nobody was ever shown.
    const answers = {
      ...completeYouAnswers(),
      core_rhythm_recent_change_v1: ["health-event", "not-a-real-option"],
      core_rhythm_antibiotics_v1: "recent",
    }
    const result = validateConsultationAnswers({ context: you, answers })

    expect(result.trustedAnswers.core_rhythm_recent_change_v1).toBeUndefined()
    expect(result.applicableQuestionIds).not.toContain("core_rhythm_antibiotics_v1")
    expect(result.trustedAnswers.core_rhythm_antibiotics_v1).toBeUndefined()
    expect(result.droppedQuestionIds).toContain("core_rhythm_antibiotics_v1")

    // And the required parent is reported invalid, so nothing completes on it.
    expect(result.invalidQuestionIds).toContain("core_rhythm_recent_change_v1")
    expect(result.complete).toBe(false)
  })

  it("a trusted projection is always itself complete-consistent", () => {
    // Re-validating the projection must not discover new invalid answers:
    // whatever survived is, by construction, valid for a live question.
    const answers = { ...completeYouAnswers(), core_intentions_primary_focus_v1: "not-real" }
    const trusted = projectTrustedAnswers({ context: you, answers })
    const second = validateConsultationAnswers({ context: you, answers: trusted })
    expect(second.invalidQuestionIds).toEqual([])
  })
})

/* ══ Food-guidance safety ════════════════════════════════════════════════════
 *
 * The Report recommends specific foods. The Consultation can legitimately end
 * with the customer having said "there is a food I must avoid" while the
 * system does not know which one — they declined the detail question, chose
 * "something else", or preferred not to say. The dangerous default is that an
 * absent field reads as "nothing to avoid".
 *
 * These tests pin the state, not a behaviour: nothing is suppressed in Phase
 * 3A. `unresolvedSpecificAvoidance` is the fact Phase 4A acts on. */

describe("food-guidance constraints", () => {
  const withConstraints = (constraints: string[], avoidances?: string[]): ConsultationAnswers => ({
    ...completeYouAnswers(),
    core_environment_constraints_v1: constraints,
    ...(avoidances ? { core_environment_food_avoidances_v1: avoidances } : {}),
  })

  it("no allergy or medical avoidance means no unresolved safety state", () => {
    const r = deriveFoodGuidanceConstraints({ context: you, answers: completeYouAnswers() })
    expect(r.requiresSpecificAvoidance).toBe(false)
    expect(r.unresolvedSpecificAvoidance).toBe(false)
    expect(r.knownAvoidances).toEqual([])
  })

  it.each([
    ["vegetarian or vegan", "vegetarian-vegan"],
    ["religious or cultural", "religious-cultural"],
    ["budget", "budget"],
    ["time", "time"],
    ["dislikes", "dislikes"],
    ["nothing in particular", "none"],
  ])("an ordinary %s constraint never becomes an unresolved allergy state", (_label, value) => {
    // The failure this prevents: treating every declared constraint as a
    // safety constraint, which would suppress specific food guidance for a
    // vegetarian on a budget and make the Report useless for most customers.
    const r = deriveFoodGuidanceConstraints({ context: you, answers: withConstraints([value]) })
    expect(r.declaredConstraints).toContain(value)
    expect(r.requiresSpecificAvoidance).toBe(false)
    expect(r.unresolvedSpecificAvoidance).toBe(false)
  })

  it.each(["allergy", "medical-avoid"])(
    "a declared %s with structured detail is resolved",
    (constraint) => {
      const r = deriveFoodGuidanceConstraints({
        context: you,
        answers: withConstraints([constraint], ["nuts", "sesame"]),
      })
      expect(r.requiresSpecificAvoidance).toBe(true)
      expect(r.knownAvoidances).toEqual(["nuts", "sesame"])
      expect(r.unresolvedSpecificAvoidance).toBe(false)
    },
  )

  it.each(["allergy", "medical-avoid"])("a declared %s with no detail is unresolved", (constraint) => {
    const r = deriveFoodGuidanceConstraints({ context: you, answers: withConstraints([constraint]) })
    expect(r.requiresSpecificAvoidance).toBe(true)
    expect(r.knownAvoidances).toEqual([])
    expect(r.unresolvedSpecificAvoidance).toBe(true)
  })

  it("'something else, not listed here' is an avoidance, not a resolution", () => {
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: withConstraints(["allergy"], ["other"]),
    })
    expect(r.unresolvedSpecificAvoidance).toBe(true)
    expect(r.knownAvoidances).toEqual([])
  })

  it("a known category alongside 'something else' is still unresolved", () => {
    // Knowing about the nuts does not make it safe to assume there is nothing
    // else — the customer explicitly said there is.
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: withConstraints(["allergy"], ["nuts", "other"]),
    })
    expect(r.knownAvoidances).toEqual(["nuts"])
    expect(r.unresolvedSpecificAvoidance).toBe(true)
  })

  it("'prefer not to say' is unresolved, and is not a reason to ask harder", () => {
    const r = deriveFoodGuidanceConstraints({
      context: you,
      answers: withConstraints(["medical-avoid"], ["prefer-not-to-say"]),
    })
    expect(r.unresolvedSpecificAvoidance).toBe(true)
    expect(r.knownAvoidances).toEqual([])
  })

  it("declining the detail still lets the Consultation complete", () => {
    // Data minimisation and safety point the same way: the customer keeps the
    // choice, and the Report adapts to missing detail rather than the
    // Consultation forcing disclosure.
    const answers = withConstraints(["allergy"])
    expect(validateConsultationAnswers({ context: you, answers }).complete).toBe(true)
    expect(deriveFoodGuidanceConstraints({ context: you, answers }).unresolvedSpecificAvoidance).toBe(true)
  })

  it("reads trusted answers only", () => {
    // A malformed constraints answer must not quietly drop the safety flag.
    // It is dropped from `declaredConstraints` because it was never trusted —
    // and the Consultation is incomplete, so nothing generates from it.
    const answers = { ...completeYouAnswers(), core_environment_constraints_v1: ["allergy", "none"] }
    const r = deriveFoodGuidanceConstraints({ context: you, answers })
    expect(r.declaredConstraints).toEqual([])
    expect(validateConsultationAnswers({ context: you, answers }).complete).toBe(false)
  })

  it("works the same for a household", () => {
    const answers = {
      ...completeFamilyAnswers(),
      core_environment_constraints_v1: ["allergy"],
      core_environment_food_avoidances_v1: ["dairy"],
    }
    const r = deriveFoodGuidanceConstraints({ context: family, answers })
    expect(r.requiresSpecificAvoidance).toBe(true)
    expect(r.knownAvoidances).toEqual(["dairy"])
    expect(r.unresolvedSpecificAvoidance).toBe(false)
  })
})
