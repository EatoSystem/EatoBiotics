import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { resolveApplicableQuestions } from "@/lib/consultation/applicability"
import { CONSULTATION_QUESTION_BANK, findConsultationQuestion } from "@/lib/consultation/question-bank"
import type { ConsultationAnswers, ConsultationFoundation } from "@/lib/consultation/types"
import { canonicalValues } from "@/lib/report/deterministic/canonical-order"
import { PRIORITY_PRECEDENCE, choosePriority } from "@/lib/report/deterministic/priority"

/**
 * Where to start, and in what order — Phase 4A-S2 review fix.
 *
 * ══ THE TWO DEFECTS THIS FILE EXISTS FOR ════════════════════════════════════
 *
 * 1. `choosePriority` read the STORED answer array. That array is the order
 *    somebody's clicks happened to land in, so two Consultations that said the
 *    same thing could have produced different Reports — the determinism
 *    guarantee failing in the direction nobody would notice.
 *
 * 2. Three of the seven precedence rules could not be reached by any complete
 *    Consultation. Dead rules read as deliberate choices, and the next author
 *    edits them believing they do something.
 *
 * Both are proven here against the REAL frozen bank, never a fixture bank: a
 * reachability argument is only as good as the applicability and requiredness
 * it rests on.
 */

/** The ids a complete Consultation of this foundation would actually ask. */
function applicableIds(
  foundation: ConsultationFoundation,
  answers: ConsultationAnswers,
): readonly string[] {
  return resolveApplicableQuestions({
    questions: CONSULTATION_QUESTION_BANK,
    context: { foundation },
    answers,
  }).map((q) => q.id)
}

/* ══ Canonical order ═══════════════════════════════════════════════════════ */

describe("answer values are read in the bank's order, never the stored one", () => {
  const MULTI = "core_signals_context_v1"

  it("the question under test really is a multi-select in the frozen bank", () => {
    // Without this the order assertions below would be vacuous.
    expect(findConsultationQuestion(MULTI)?.type).toBe("multi")
  })

  it("returns bank option order whatever order the values were stored in", () => {
    const bankOrder = findConsultationQuestion(MULTI)!.options!.map((o) => o.value)
    const stored = [...bankOrder]
    const reversed = [...bankOrder].reverse()

    expect(canonicalValues({ [MULTI]: stored }, MULTI)).toEqual(bankOrder)
    expect(canonicalValues({ [MULTI]: reversed }, MULTI)).toEqual(bankOrder)
    expect(canonicalValues({ [MULTI]: reversed }, MULTI)).toEqual(
      canonicalValues({ [MULTI]: stored }, MULTI),
    )
  })

  it("a subset keeps bank order rather than selection order", () => {
    const bankOrder = findConsultationQuestion(MULTI)!.options!.map((o) => o.value)
    const [first, , third] = bankOrder
    expect(canonicalValues({ [MULTI]: [third, first] }, MULTI)).toEqual([first, third])
  })

  it("a single-select answer is returned as a one-value list", () => {
    expect(canonicalValues({ core_intentions_barrier_v1: "cost" }, "core_intentions_barrier_v1")).toEqual([
      "cost",
    ])
  })

  it("nothing selected is an empty list, not a missing question", () => {
    expect(canonicalValues({}, MULTI)).toEqual([])
  })

  it("a value this build's bank does not offer is dropped, and that is deliberate", () => {
    /*
     * Fail-closed. The seal recorded the value under a bank version whose
     * meaning this build cannot vouch for, and paraphrasing a value we cannot
     * describe is worse than omitting it. Pinned so the behaviour is a
     * decision rather than a side effect of the intersection.
     */
    expect(canonicalValues({ [MULTI]: ["rushed", "not-a-real-value"] }, MULTI)).toEqual(["rushed"])
  })

  it("a free-text question is null, not an empty list", () => {
    // Two different facts: "no option list exists here" vs "nothing chosen".
    expect(canonicalValues({ core_intentions_success_v1: "Calmer mornings." }, "core_intentions_success_v1")).toBe(
      null,
    )
  })

  it("a question unknown to this build is null", () => {
    expect(canonicalValues({ made_up_v1: ["x"] }, "made_up_v1")).toBe(null)
  })
})

/* ══ No stored-order read remains ══════════════════════════════════════════ */

describe("the resolver cannot reach a stored array directly", () => {
  const source = readFileSync(join(process.cwd(), "lib/report/deterministic/priority.ts"), "utf8")

  it("never indexes the trusted answers itself", () => {
    // The only way in is `canonicalValues`. A direct read is how the defect
    // got in, so the shape of the defect is what is banned.
    expect(source).not.toMatch(/trustedAnswers\s*\[/)
  })

  it("reads its values through the shared canonical helper", () => {
    expect(source).toContain("canonicalValues(trustedAnswers, candidate.questionId)")
  })
})

/* ══ Reachability ══════════════════════════════════════════════════════════ */

/**
 * A real state in which each retained rule wins.
 *
 * Declared as data, and cross-checked against `PRIORITY_PRECEDENCE` both ways,
 * so a rule added with no reachable state fails this file rather than sitting
 * in the list looking intentional.
 */
const WINNING_STATES: ReadonlyArray<{
  rank: number
  questionId: string
  foundation: ConsultationFoundation
  answers: ConsultationAnswers
  why: string
}> = [
  {
    rank: 1,
    questionId: "core_intentions_primary_focus_v1",
    foundation: "you",
    answers: { core_intentions_primary_focus_v1: "digestion" },
    why: "They named a focus. Nothing outranks it.",
  },
  {
    rank: 2,
    questionId: "core_signals_household_hardest_moment_v1",
    foundation: "family",
    answers: {
      core_intentions_primary_focus_v1: "unsure",
      core_signals_household_hardest_moment_v1: "mornings",
    },
    why: "A household with no stated focus but a named hard moment.",
  },
  {
    rank: 3,
    questionId: "core_intentions_barrier_v1",
    foundation: "you",
    answers: {
      core_intentions_primary_focus_v1: "unsure",
      core_intentions_barrier_v1: "time",
    },
    why: "No stated focus, and rule 2 is not applicable to a You Consultation.",
  },
  {
    rank: 4,
    questionId: "core_signals_energy_shape_v1",
    foundation: "you",
    answers: {
      core_intentions_primary_focus_v1: "unsure",
      core_intentions_barrier_v1: "none",
      core_signals_energy_shape_v1: "afternoon-dip",
    },
    why: "No focus and no barrier, so the shape of the day is the first thing left.",
  },
  {
    rank: 5,
    questionId: "core_environment_planning_v1",
    foundation: "family",
    answers: {
      core_intentions_primary_focus_v1: "unsure",
      core_signals_household_hardest_moment_v1: "none-stand-out",
      core_intentions_barrier_v1: "none",
      core_environment_planning_v1: "planned",
    },
    why: "The household case rules 1-3 decline and rule 4 cannot serve, because it is You-only.",
  },
]

describe("every retained rule has a state in which it actually wins", () => {
  it("the precedence list is ordered, complete and stated", () => {
    expect(PRIORITY_PRECEDENCE.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5])
    for (const candidate of PRIORITY_PRECEDENCE) {
      expect(candidate.reason.length, candidate.questionId).toBeGreaterThan(30)
    }
  })

  it("the declared winning states cover the list exactly, both ways", () => {
    expect(WINNING_STATES.map((w) => w.questionId)).toEqual(
      PRIORITY_PRECEDENCE.map((c) => c.questionId),
    )
    expect(WINNING_STATES.map((w) => w.rank)).toEqual(PRIORITY_PRECEDENCE.map((c) => c.rank))
  })

  for (const state of WINNING_STATES) {
    it(`rule ${state.rank} wins: ${state.why}`, () => {
      const choice = choosePriority(state.answers, applicableIds(state.foundation, state.answers))
      expect(choice, `rule ${state.rank} is unreachable`).not.toBe(null)
      expect(choice!.questionId).toBe(state.questionId)
      expect(choice!.rank).toBe(state.rank)
    })
  }

  it("the questions the audit deleted really are unreachable, and really are gone", () => {
    /*
     * Rules 5-7 used to be signals.context, signals.settledDays and
     * rhythm.longestGap. All three are You-only, and so is rule 4 — which has
     * no value that declines — so on a You Consultation rule 4 always answers
     * first, and on a Family Consultation none of them is applicable at all.
     */
    const deleted = [
      "core_signals_context_v1",
      "core_signals_settled_days_v1",
      "core_rhythm_longest_gap_v1",
    ]
    expect(PRIORITY_PRECEDENCE.map((c) => c.questionId)).not.toEqual(
      expect.arrayContaining(deleted),
    )
    for (const id of deleted) {
      expect(findConsultationQuestion(id)?.foundations, id).toEqual(["you"])
    }
    expect(findConsultationQuestion("core_signals_energy_shape_v1")?.foundations).toEqual(["you"])
    expect(findConsultationQuestion("core_signals_energy_shape_v1")?.required).toBe(true)
  })

  it("the new rule 5 is the only one a household can still reach", () => {
    const planning = findConsultationQuestion("core_environment_planning_v1")
    expect(planning?.foundations).toEqual(["you", "family"])
    expect(planning?.required).toBe(true)
  })
})

/* ══ Order invariance of the choice itself ═════════════════════════════════ */

describe("reversing a stored answer array cannot change the starting point", () => {
  it("holds for every retained rule", () => {
    for (const state of WINNING_STATES) {
      const reversed: ConsultationAnswers = Object.fromEntries(
        Object.entries(state.answers).map(([k, v]) => [k, Array.isArray(v) ? [...v].reverse() : v]),
      )
      const ids = applicableIds(state.foundation, state.answers)
      expect(choosePriority(reversed, ids), `rule ${state.rank}`).toEqual(
        choosePriority(state.answers, ids),
      )
    }
  })

  it("holds for a multi-valued answer resolved through the same helper", () => {
    /*
     * Every RETAINED rule reads a single-select question, so the assertion
     * above cannot fail today — it guards the rule somebody adds next. The
     * substantive proof is that the resolver's only route to a value is the
     * helper, and the helper is order-invariant on a real bank multi.
     */
    const bankOrder = findConsultationQuestion("core_signals_context_v1")!.options!.map((o) => o.value)
    expect(canonicalValues({ core_signals_context_v1: [...bankOrder].reverse() }, "core_signals_context_v1")).toEqual(
      canonicalValues({ core_signals_context_v1: bankOrder }, "core_signals_context_v1"),
    )
  })
})
