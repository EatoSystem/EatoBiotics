import { describe, it, expect } from "vitest"

import type { ConsultationQuestion } from "@/lib/consultation/types"
import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import {
  isQuestionApplicable,
  resolveApplicableQuestionIds,
  resolveApplicableQuestions,
} from "@/lib/consultation/applicability"
import { validateConsultationBank } from "@/lib/consultation/validation"

/**
 * The deterministic applicability resolver.
 *
 * This is the module that replaces the legacy client-side `followUp` splice.
 * The property that matters most is not "the right question appears" but "the
 * same question appears everywhere" — the client sequence, resume, a future
 * Answer Review and the server's completeness check must not be able to
 * disagree about what was asked. So most of what is tested here is
 * determinism, ordering and refusal.
 */

const you = { foundation: "you" } as const
const family = { foundation: "family" } as const

/** A synthetic bank, so the resolver's rules can be tested away from content. */
function q(partial: Partial<ConsultationQuestion> & { id: string }): ConsultationQuestion {
  return {
    answerField: `signals.${partial.id.replace(/[^a-z]/g, "")}`,
    section: "signals",
    type: "single",
    foundations: ["you", "family"],
    text: "A synthetic question for testing the resolver",
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Exercises the resolver in isolation from real content.",
    whyNeeded: "Content and mechanism fail in different ways and should be tested separately.",
    reportTargets: ["systemSnapshot"],
    freeAssessmentOverlap: "none",
    options: [
      { label: "Alpha", value: "alpha" },
      { label: "Beta", value: "beta" },
    ],
    ...partial,
  } as ConsultationQuestion
}

describe("foundation gating", () => {
  it("a You-only question is unreachable for Family", () => {
    const ids = resolveApplicableQuestionIds({ context: family })
    expect(ids).not.toContain("core_signals_post_meal_pattern_v1")
    expect(ids).not.toContain("core_rhythm_antibiotics_v1")
  })

  it("a Family-only question is unreachable for You", () => {
    const ids = resolveApplicableQuestionIds({ context: you })
    expect(ids).not.toContain("core_rhythm_household_shared_meals_v1")
    expect(ids).not.toContain("core_environment_household_differing_needs_v1")
  })

  it("shared questions appear for both", () => {
    for (const context of [you, family]) {
      expect(resolveApplicableQuestionIds({ context })).toContain("core_intentions_primary_focus_v1")
    }
  })
})

describe("baseline questions apply with no answers at all", () => {
  it.each([
    ["you", you, 13],
    ["family", family, 13],
  ] as const)("%s starts with its full baseline", (_label, context, expected) => {
    const ids = resolveApplicableQuestionIds({ context })
    expect(ids).toHaveLength(expected)
    // Nothing adaptive can be applicable before its trigger is answered.
    for (const id of ids) {
      expect(CONSULTATION_QUESTION_BANK.find((x) => x.id === id)?.applicableWhen).toBeUndefined()
    }
  })

  it("results are returned in bank order", () => {
    const bankOrder = CONSULTATION_QUESTION_BANK.filter((x) => x.foundations.includes("you")).map((x) => x.id)
    const resolved = resolveApplicableQuestionIds({ context: you })
    expect(resolved).toEqual(bankOrder.filter((id) => resolved.includes(id)))
  })
})

describe("the three operators", () => {
  it("notEquals reveals a branch only when the trigger says something else", () => {
    const hidden = resolveApplicableQuestionIds({
      context: you,
      answers: { core_signals_post_meal_pattern_v1: "nothing" },
    })
    expect(hidden).not.toContain("core_signals_settled_days_v1")

    const shown = resolveApplicableQuestionIds({
      context: you,
      answers: { core_signals_post_meal_pattern_v1: "bloating" },
    })
    expect(shown).toContain("core_signals_settled_days_v1")
  })

  it("notEquals treats 'prefer not to say' as a reason to stop asking", () => {
    const ids = resolveApplicableQuestionIds({
      context: you,
      answers: { core_signals_post_meal_pattern_v1: "prefer-not-to-say" },
    })
    expect(ids).not.toContain("core_signals_settled_days_v1")
  })

  it("includes reveals a branch when the multi answer carries the value", () => {
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: ["schedule", "health-event"] },
      }),
    ).toBe(true)

    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: ["schedule", "move-travel"] },
      }),
    ).toBe(false)
  })

  it("includes fires on any listed value, not all of them", () => {
    for (const value of ["allergy", "medical-avoid"]) {
      expect(
        isQuestionApplicable("core_environment_food_avoidances_v1", {
          context: you,
          answers: { core_environment_constraints_v1: [value] },
        }),
      ).toBe(true)
    }
    expect(
      isQuestionApplicable("core_environment_food_avoidances_v1", {
        context: you,
        answers: { core_environment_constraints_v1: ["budget", "time"] },
      }),
    ).toBe(false)
  })

  it("equals reveals the household follow-up only for households that rarely eat together", () => {
    for (const value of ["rarely", "never"]) {
      expect(
        isQuestionApplicable("core_rhythm_household_separate_reason_v1", {
          context: family,
          answers: { core_rhythm_household_shared_meals_v1: value },
        }),
      ).toBe(true)
    }
    expect(
      isQuestionApplicable("core_rhythm_household_separate_reason_v1", {
        context: family,
        answers: { core_rhythm_household_shared_meals_v1: "most-days" },
      }),
    ).toBe(false)
  })
})

describe("the resolver refuses rather than guesses", () => {
  it("an unanswered trigger reveals nothing", () => {
    const ids = resolveApplicableQuestionIds({ context: you, answers: {} })
    expect(ids).not.toContain("core_signals_context_v1")
    expect(ids).not.toContain("core_signals_settled_days_v1")
    expect(ids).not.toContain("core_rhythm_antibiotics_v1")
    expect(ids).not.toContain("core_environment_food_avoidances_v1")
  })

  it("a garbage trigger answer does not reveal a notEquals branch", () => {
    // The asymmetry worth pinning: `equals` and `includes` fail closed for free
    // because the value has to match something. `notEquals` is "not equal to
    // everything" for junk, so without a domain check a corrupted answer would
    // REVEAL a question rather than hide it.
    for (const junk of ["not-an-option", "", "  ", "NOTHING"]) {
      expect(
        isQuestionApplicable("core_signals_settled_days_v1", {
          context: you,
          answers: { core_signals_post_meal_pattern_v1: junk },
        }),
      ).toBe(false)
    }
  })

  it("a wrong-shaped trigger answer reveals nothing", () => {
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        // `includes` needs an array; a bare string must not satisfy it.
        answers: { core_rhythm_recent_change_v1: "health-event" as unknown as string[] },
      }),
    ).toBe(false)

    expect(
      isQuestionApplicable("core_signals_settled_days_v1", {
        context: you,
        answers: { core_signals_post_meal_pattern_v1: ["bloating"] as unknown as string },
      }),
    ).toBe(false)
  })

  it("an answer to a question the foundation never asks cannot trigger a branch", () => {
    // A Family submission carrying You answers must not open a You branch.
    const ids = resolveApplicableQuestionIds({
      context: family,
      answers: {
        core_signals_post_meal_pattern_v1: "bloating",
        core_rhythm_recent_change_v1: ["health-event"],
      },
    })
    expect(ids).not.toContain("core_signals_settled_days_v1")
    expect(ids).not.toContain("core_rhythm_antibiotics_v1")
  })

  it("an unknown answer id changes nothing", () => {
    const base = resolveApplicableQuestionIds({ context: you })
    const withJunk = resolveApplicableQuestionIds({
      context: you,
      answers: { dq1: "legacy", mind_lens1: "steady", nonsense: ["x"] },
    })
    expect(withJunk).toEqual(base)
  })

  it("an unknown operator reveals nothing", () => {
    const bank = [
      q({ id: "core_signals_parent_v1", answerField: "signals.parent" }),
      q({
        id: "core_signals_child_v1",
        answerField: "signals.child",
        applicableWhen: {
          questionId: "core_signals_parent_v1",
          operator: "greaterThan" as never,
          values: ["alpha"],
        },
      }),
    ]
    const ids = resolveApplicableQuestions({
      questions: bank,
      context: you,
      answers: { core_signals_parent_v1: "alpha" },
    }).map((x) => x.id)
    expect(ids).toEqual(["core_signals_parent_v1"])
  })
})

/**
 * Signals context is adaptive, not baseline.
 *
 * "On the days you notice it most…" is an incoherent question for someone who
 * has just said there is nothing to notice, or who declined to say. As a
 * baseline question it contradicted the answer immediately before it.
 */
describe("the Signals context question follows the post-meal signal", () => {
  it("is hidden when the customer reports no post-meal signal", () => {
    expect(
      isQuestionApplicable("core_signals_context_v1", {
        context: you,
        answers: { core_signals_post_meal_pattern_v1: "nothing" },
      }),
    ).toBe(false)
  })

  it("is hidden when the customer declined to say", () => {
    expect(
      isQuestionApplicable("core_signals_context_v1", {
        context: you,
        answers: { core_signals_post_meal_pattern_v1: "prefer-not-to-say" },
      }),
    ).toBe(false)
  })

  it.each(["fullness", "bloating", "dip", "lift-then-dip"])(
    "is shown when the customer reports %s",
    (signal) => {
      expect(
        isQuestionApplicable("core_signals_context_v1", {
          context: you,
          answers: { core_signals_post_meal_pattern_v1: signal },
        }),
      ).toBe(true)
    },
  )

  it("shares the exclusion boundary with the settled-days question", () => {
    // Both ask about a signal the customer has said they notice, so both must
    // disappear together. Two rules drifting apart is how one of them ends up
    // asking about something the other just established does not exist.
    for (const answer of ["nothing", "prefer-not-to-say", "bloating"]) {
      const ids = resolveApplicableQuestionIds({
        context: you,
        answers: { core_signals_post_meal_pattern_v1: answer },
      })
      expect(ids.includes("core_signals_context_v1")).toBe(ids.includes("core_signals_settled_days_v1"))
    }
  })
})

/**
 * An invalid parent answer can never make an adaptive child applicable.
 *
 * The earlier implementation checked each value of a multi trigger
 * individually, so `["health-event", "not-a-real-option"]` revealed the branch
 * because one member happened to be legitimate. Per-value checking cannot see
 * duplicates, exclusivity violations or below-minimum selections — all states
 * the trusted projection refuses. Applicability now asks the same question,
 * through the same function.
 */
describe("applicability fails closed on the whole parent answer", () => {
  it("an unknown value mixed with a triggering value hides the branch", () => {
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: ["health-event", "not-a-real-option"] },
      }),
    ).toBe(false)
  })

  it("a duplicated value mixed with a triggering value hides the branch", () => {
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: ["health-event", "health-event"] },
      }),
    ).toBe(false)
  })

  it("an exclusive value mixed with a triggering value hides the branch", () => {
    // "Nothing much has changed" alongside "a health event" is a contradiction,
    // and a contradiction must not decide what the customer is asked next.
    for (const exclusive of ["none", "prefer-not-to-say"]) {
      expect(
        isQuestionApplicable("core_rhythm_antibiotics_v1", {
          context: you,
          answers: { core_rhythm_recent_change_v1: ["health-event", exclusive] },
        }),
      ).toBe(false)
    }
  })

  it("the same holds for the food-avoidance branch", () => {
    for (const bad of [
      ["allergy", "not-a-real-option"],
      ["allergy", "allergy"],
      ["allergy", "none"],
      ["allergy", "prefer-not-to-say"],
    ]) {
      expect(
        isQuestionApplicable("core_environment_food_avoidances_v1", {
          context: you,
          answers: { core_environment_constraints_v1: bad },
        }),
        bad.join("+"),
      ).toBe(false)
    }
  })

  it("a non-string member hides the branch", () => {
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: ["health-event", 7] as unknown as string[] },
      }),
    ).toBe(false)
  })

  it("an empty trigger array hides the branch", () => {
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: [] },
      }),
    ).toBe(false)
  })

  it("a valid trigger still opens the branch", () => {
    // The guard has to fail closed without failing shut: a correct answer must
    // still work, or the rule is just "never branch".
    expect(
      isQuestionApplicable("core_rhythm_antibiotics_v1", {
        context: you,
        answers: { core_rhythm_recent_change_v1: ["schedule", "health-event"] },
      }),
    ).toBe(true)
  })
})

describe("determinism", () => {
  it("the same inputs always produce the same output", () => {
    const answers = {
      core_signals_post_meal_pattern_v1: "bloating",
      core_rhythm_recent_change_v1: ["health-event"],
      core_environment_constraints_v1: ["allergy"],
    }
    const first = resolveApplicableQuestionIds({ context: you, answers })
    for (let i = 0; i < 5; i += 1) {
      expect(resolveApplicableQuestionIds({ context: you, answers })).toEqual(first)
    }
  })

  it("resolving does not mutate the answers it is given", () => {
    const answers = { core_signals_post_meal_pattern_v1: "bloating" }
    const snapshot = JSON.stringify(answers)
    resolveApplicableQuestionIds({ context: you, answers })
    expect(JSON.stringify(answers)).toBe(snapshot)
  })

  it("every branch that can open, opens", () => {
    const ids = resolveApplicableQuestionIds({
      context: you,
      answers: {
        core_signals_post_meal_pattern_v1: "bloating",
        core_rhythm_recent_change_v1: ["health-event"],
        core_environment_constraints_v1: ["allergy"],
      },
    })
    expect(ids).toHaveLength(17)
    expect(ids).toContain("core_signals_settled_days_v1")
    expect(ids).toContain("core_rhythm_antibiotics_v1")
    expect(ids).toContain("core_environment_food_avoidances_v1")
  })
})

describe("the bank validator refuses malformed applicability", () => {
  const cases: Array<[string, ConsultationQuestion[], RegExp]> = [
    [
      "an unknown trigger",
      [
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: { questionId: "core_signals_ghost_v1", operator: "equals", values: ["alpha"] },
        }),
      ],
      /unknown question/,
    ],
    [
      "a self-reference",
      [
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: { questionId: "core_signals_child_v1", operator: "equals", values: ["alpha"] },
        }),
      ],
      /refers to itself/,
    ],
    [
      "a trigger that appears later in the bank",
      [
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: { questionId: "core_signals_parent_v1", operator: "equals", values: ["alpha"] },
        }),
        q({ id: "core_signals_parent_v1", answerField: "signals.parent" }),
      ],
      /must appear earlier/,
    ],
    [
      "a value the trigger never offers",
      [
        q({ id: "core_signals_parent_v1", answerField: "signals.parent" }),
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: { questionId: "core_signals_parent_v1", operator: "equals", values: ["gamma"] },
        }),
      ],
      /is not an option of/,
    ],
    [
      "a condition that can never be true",
      [
        q({ id: "core_signals_parent_v1", answerField: "signals.parent" }),
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: {
            questionId: "core_signals_parent_v1",
            operator: "notEquals",
            values: ["alpha", "beta"],
          },
        }),
      ],
      /can never be true/,
    ],
    [
      "an operator that does not match the trigger's type",
      [
        q({ id: "core_signals_parent_v1", answerField: "signals.parent" }),
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: { questionId: "core_signals_parent_v1", operator: "includes", values: ["alpha"] },
        }),
      ],
      /needs a multi trigger/,
    ],
    [
      "a branch off a branch",
      [
        q({ id: "core_signals_parent_v1", answerField: "signals.parent" }),
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          applicableWhen: { questionId: "core_signals_parent_v1", operator: "equals", values: ["alpha"] },
        }),
        q({
          id: "core_signals_grandchild_v1",
          answerField: "signals.grandchild",
          applicableWhen: { questionId: "core_signals_child_v1", operator: "equals", values: ["alpha"] },
        }),
      ],
      /branch off a branch/,
    ],
    [
      "a trigger the child's foundation never sees",
      [
        q({ id: "core_signals_parent_v1", answerField: "signals.parent", foundations: ["you"] }),
        q({
          id: "core_signals_child_v1",
          answerField: "signals.child",
          foundations: ["you", "family"],
          familyText: "A synthetic household question for testing the resolver",
          applicableWhen: { questionId: "core_signals_parent_v1", operator: "equals", values: ["alpha"] },
        }),
      ],
      /could never fire there/,
    ],
  ]

  it.each(cases)("rejects %s", (_label, bank, pattern) => {
    const errors = validateConsultationBank(bank)
    expect(errors.join("\n")).toMatch(pattern)
  })

  it("detects a cycle even if the ordering rule were relaxed", () => {
    const bank = [
      q({
        id: "core_signals_a_v1",
        answerField: "signals.a",
        applicableWhen: { questionId: "core_signals_b_v1", operator: "equals", values: ["alpha"] },
      }),
      q({
        id: "core_signals_b_v1",
        answerField: "signals.b",
        applicableWhen: { questionId: "core_signals_a_v1", operator: "equals", values: ["alpha"] },
      }),
    ]
    expect(validateConsultationBank(bank).join("\n")).toMatch(/applicability cycle/)
  })
})
