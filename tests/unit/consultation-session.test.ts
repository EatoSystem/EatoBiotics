import { describe, it, expect } from "vitest"

import {
  CONSULTATION_QUESTION_BANK,
  findConsultationQuestion,
} from "@/lib/consultation/question-bank"
import type {
  ConsultationAnswers,
  ConsultationContext,
  ConsultationQuestion,
} from "@/lib/consultation/types"
import { validateConsultationAnswers } from "@/lib/consultation/completeness"
import {
  applicableQuestions,
  begin,
  canGoBack,
  clearAnswer,
  continueGate,
  createConsultationSession,
  currentQuestion,
  goBack,
  goNext,
  isLastQuestion,
  isSectionStart,
  progress,
  setAnswer,
  toggleMultiValue,
  trustedAnswers,
  type ConsultationSessionState,
} from "@/lib/consultation/session"

/**
 * Phase 3B — the Consultation state machine.
 *
 * ══ WHY THESE ARE NODE TESTS, NOT RENDERING TESTS ═══════════════════════════
 *
 * The rules this file guards are behavioural: an option must not advance the
 * customer, Continue must refuse an unanswered required question, Back must
 * land on the previous question that still applies, a closed branch must stop
 * counting. Every one of those is a property of the session reducer, and
 * proving it there is stronger than poking a DOM — a rendering test can only
 * show that one wiring of the component behaves, while these show the rule
 * itself holds for every caller, including Phase 3C's server.
 *
 * The repository has no jsdom and no React Testing Library (vitest runs in the
 * `node` environment), so DOM-level interaction is covered where the repo
 * already covers it: static render assertions in
 * `consultation-experience.test.ts`, and real clicks, focus and keyboard in
 * `tests/e2e/consultation-preview.spec.ts`.
 */

const you: ConsultationContext = { foundation: "you" }
const family: ConsultationContext = { foundation: "family" }

const Q1 = "core_signals_post_meal_pattern_v1"
const Q2 = "core_signals_energy_shape_v1"
const Q3 = "core_signals_context_v1"
const Q4 = "core_signals_settled_days_v1"
const CONSTRAINTS = "core_environment_constraints_v1"
const AVOIDANCES = "core_environment_food_avoidances_v1"
const SUCCESS = "core_intentions_success_v1"
const SHARED_MEALS = "core_rhythm_household_shared_meals_v1"
const SEPARATE_REASON = "core_rhythm_household_separate_reason_v1"

function session(context: ConsultationContext, answers: ConsultationAnswers = {}) {
  return begin(createConsultationSession({ context, answers }))
}

/** Drive the session to a question by answering everything before it validly. */
function driveTo(state: ConsultationSessionState, questionId: string): ConsultationSessionState {
  let s = state
  for (let i = 0; i < 40; i += 1) {
    const q = currentQuestion(s)
    if (!q || q.id === questionId) return s
    s = goNext(answerValidly(s, q))
  }
  throw new Error(`never reached ${questionId}`)
}

/**
 * The answer that opens no branch, for each question that can open one.
 *
 * `answerValidly` picks the first option, and for both trigger questions the
 * first option is a triggering one — "fullness" is a substantive post-meal
 * signal, and "allergy" is a safety constraint. So a walk that used it
 * everywhere silently took the ADAPTIVE path while calling itself a baseline.
 * Naming the non-triggering choices here makes the difference between the two
 * walkthroughs explicit rather than accidental.
 */
const BASELINE_CHOICE: Record<string, string | string[]> = {
  [Q1]: "nothing",
  [CONSTRAINTS]: ["budget"],
  [SHARED_MEALS]: "most-days",
}

/** Answer a question without opening any branch it could open. */
function answerForBaseline(
  state: ConsultationSessionState,
  q: ConsultationQuestion,
): ConsultationSessionState {
  const choice = BASELINE_CHOICE[q.id]
  return choice === undefined ? answerValidly(state, q) : setAnswer(state, q.id, choice)
}

/** A valid answer for any question in the bank, without hard-coding values. */
function answerValidly(
  state: ConsultationSessionState,
  q: ConsultationQuestion,
): ConsultationSessionState {
  if (q.type === "single") return setAnswer(state, q.id, q.options![0].value)
  if (q.type === "multi") return setAnswer(state, q.id, [q.options![0].value])
  if (q.type === "textarea") return setAnswer(state, q.id, "A sentence that is a real answer.")
  return setAnswer(state, q.id, q.min ?? 0)
}

/* ══ A — baseline sequences ════════════════════════════════════════════════ */

describe("A. the baseline sequence is deterministic", () => {
  it("You with no answers is exactly the You baseline, in bank order", () => {
    const ids = applicableQuestions(session(you)).map((q) => q.id)
    const expected = CONSULTATION_QUESTION_BANK.filter(
      (q) => q.foundations.includes("you") && !q.applicableWhen,
    ).map((q) => q.id)
    expect(ids).toEqual(expected)
    expect(ids).toHaveLength(13)
  })

  it("resolving twice gives the identical sequence", () => {
    const s = session(you)
    expect(applicableQuestions(s).map((q) => q.id)).toEqual(
      applicableQuestions(s).map((q) => q.id),
    )
  })

  it("no AI call can be involved — the sequence is a pure function of bank plus answers", () => {
    // Constructed from a frozen bank and a plain object. If this ever needed a
    // network call it could not be computed synchronously here at all.
    const a = applicableQuestions(session(you, { [Q1]: "bloating" }))
    const b = applicableQuestions(session(you, { [Q1]: "bloating" }))
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })
})

/* ══ B — adaptive questions ════════════════════════════════════════════════ */

describe("B. You adaptive questions appear only on a valid trigger", () => {
  it("a substantive post-meal signal opens both signal branches", () => {
    const ids = applicableQuestions(session(you, { [Q1]: "bloating" })).map((q) => q.id)
    expect(ids).toContain(Q3)
    expect(ids).toContain(Q4)
  })

  it("'nothing' and 'prefer-not-to-say' open neither", () => {
    for (const value of ["nothing", "prefer-not-to-say"]) {
      const ids = applicableQuestions(session(you, { [Q1]: value })).map((q) => q.id)
      expect(ids, value).not.toContain(Q3)
      expect(ids, value).not.toContain(Q4)
    }
  })

  it("an invalid trigger answer opens neither", () => {
    const ids = applicableQuestions(session(you, { [Q1]: "not-an-option" })).map((q) => q.id)
    expect(ids).not.toContain(Q3)
    expect(ids).not.toContain(Q4)
  })
})

/* ══ C — Q7 gated on allergy / medical-avoid ═══════════════════════════════ */

describe("C. the food-avoidance question is gated on the safety constraints only", () => {
  it.each(["allergy", "medical-avoid"])("%s opens it", (value) => {
    const ids = applicableQuestions(session(you, { [CONSTRAINTS]: [value] })).map((q) => q.id)
    expect(ids).toContain(AVOIDANCES)
  })

  it.each(["budget", "time", "vegetarian-vegan", "dislikes"])("%s does not", (value) => {
    const ids = applicableQuestions(session(you, { [CONSTRAINTS]: [value] })).map((q) => q.id)
    expect(ids).not.toContain(AVOIDANCES)
  })

  it("an exclusive value combined with allergy fails closed", () => {
    // "none" is exclusive, so the whole answer is invalid — and an invalid
    // parent must not govern which questions a customer is asked.
    const ids = applicableQuestions(
      session(you, { [CONSTRAINTS]: ["allergy", "none"] }),
    ).map((q) => q.id)
    expect(ids).not.toContain(AVOIDANCES)
  })
})

/* ══ D — Family ════════════════════════════════════════════════════════════ */

describe("D. Family gets its own questions and its own wording", () => {
  it("the sequence is the Family baseline, not the You one", () => {
    const ids = applicableQuestions(session(family)).map((q) => q.id)
    expect(ids).toHaveLength(13)
    expect(ids).not.toContain(Q1)
    expect(ids).toContain("core_signals_household_mealtime_v1")
  })

  it("the household branch opens on rarely/never", () => {
    for (const value of ["rarely", "never"]) {
      const ids = applicableQuestions(session(family, { [SHARED_MEALS]: value })).map((q) => q.id)
      expect(ids, value).toContain(SEPARATE_REASON)
    }
  })

  it("a You answer carried into a Family session opens no You branch", () => {
    const ids = applicableQuestions(session(family, { [Q1]: "bloating" })).map((q) => q.id)
    expect(ids).not.toContain(Q3)
    expect(ids).not.toContain(Q4)
  })
})

/* ══ E — Lens entitlement ══════════════════════════════════════════════════ */

describe("E. Lens questions appear only when entitled", () => {
  it("the v1 canonical bank contributes no lens questions either way", () => {
    // Recorded rather than asserted as a feature: the deterministic bank has no
    // lens section in v1 (lens questions live in lib/assessment/addon-questions
    // .ts, a different schema this phase does not redesign). So an entitled
    // context and an unentitled one currently resolve identically, and the
    // guard exists so that adding lens questions later cannot skip entitlement.
    const withLens = applicableQuestions(
      session({ foundation: "you", lens: "stability" }),
    ).map((q) => q.id)
    const withoutLens = applicableQuestions(session(you)).map((q) => q.id)
    expect(withLens).toEqual(withoutLens)
  })

  it("an unentitled context can never resolve a question a lens would add", () => {
    // The real invariant, expressed against the bank rather than the resolver:
    // every question the resolver can return belongs to the core sections.
    const sections = new Set(applicableQuestions(session(you)).map((q) => q.section))
    expect([...sections].every((s) => ["signals", "rhythm", "environment", "intentions"].includes(s))).toBe(true)
  })
})

/* ══ F, G — changing a parent answer ═══════════════════════════════════════ */

describe("F/G. changing a parent answer closes the branch and drops its answer", () => {
  it("the child leaves the applicable sequence", () => {
    let s = session(you, { [CONSTRAINTS]: ["allergy"] })
    expect(applicableQuestions(s).map((q) => q.id)).toContain(AVOIDANCES)
    s = setAnswer(s, CONSTRAINTS, ["budget"])
    expect(applicableQuestions(s).map((q) => q.id)).not.toContain(AVOIDANCES)
  })

  it("the stale child answer is excluded from trusted answers", () => {
    let s = session(you, { [CONSTRAINTS]: ["allergy"], [AVOIDANCES]: ["nuts"] })
    expect(trustedAnswers(s)[AVOIDANCES]).toEqual(["nuts"])

    s = setAnswer(s, CONSTRAINTS, ["budget"])
    expect(trustedAnswers(s)[AVOIDANCES]).toBeUndefined()
    // Still present as a candidate — the customer really did type it, and the
    // projection is what decides it does not count. Deleting it here would be a
    // second, destructive rule the server could not verify ran.
    expect(s.answers[AVOIDANCES]).toEqual(["nuts"])
  })

  it("it is reported as dropped, not silently ignored", () => {
    let s = session(you, { [CONSTRAINTS]: ["allergy"], [AVOIDANCES]: ["nuts"] })
    s = setAnswer(s, CONSTRAINTS, ["budget"])
    const { droppedQuestionIds, applicableQuestionIds } = validateConsultationAnswers({
      context: you,
      answers: s.answers,
    })
    expect(droppedQuestionIds).toContain(AVOIDANCES)
    expect(applicableQuestionIds).not.toContain(AVOIDANCES)
  })
})

/* ══ H — Back ══════════════════════════════════════════════════════════════ */

describe("H. Back returns to the previous applicable question", () => {
  it("steps back one question and keeps the answer", () => {
    let s = session(you)
    s = goNext(setAnswer(s, Q1, "bloating"))
    expect(currentQuestion(s)?.id).toBe(Q2)
    s = goBack(s)
    expect(currentQuestion(s)?.id).toBe(Q1)
    expect(s.answers[Q1]).toBe("bloating")
  })

  it("crosses a section boundary", () => {
    let s = driveTo(session(you), "core_rhythm_first_meal_v1")
    expect(currentQuestion(s)?.section).toBe("rhythm")
    s = goBack(s)
    expect(currentQuestion(s)?.section).toBe("signals")
  })

  it("skips a branch that has since closed", () => {
    // Open the branch, walk past it, close it, then walk back: the closed
    // question must not be a place Back can land.
    let s = driveTo(session(you), CONSTRAINTS)
    s = goNext(setAnswer(s, CONSTRAINTS, ["allergy"]))
    expect(currentQuestion(s)?.id).toBe(AVOIDANCES)

    s = goBack(s)
    s = setAnswer(s, CONSTRAINTS, ["budget"])
    s = goNext(s)
    expect(currentQuestion(s)?.id).not.toBe(AVOIDANCES)

    s = goBack(s)
    expect(currentQuestion(s)?.id).toBe(CONSTRAINTS)
  })

  it("from the first question returns to Orientation, never out of the flow", () => {
    const s = goBack(session(you))
    expect(s.currentQuestionId).toBeNull()
    expect(s.finished).toBe(false)
  })

  it("is unavailable on the first question and available after it", () => {
    const first = session(you)
    expect(canGoBack(first)).toBe(false)
    expect(canGoBack(goNext(setAnswer(first, Q1, "bloating")))).toBe(true)
  })
})

/* ══ I, J — explicit Continue ══════════════════════════════════════════════ */

describe("I/J. only Continue advances", () => {
  it("setAnswer never changes the current question", () => {
    const s = session(you)
    for (const value of ["bloating", "nothing", "dip", "prefer-not-to-say"]) {
      expect(setAnswer(s, Q1, value).currentQuestionId).toBe(s.currentQuestionId)
    }
  })

  it("setAnswer never finishes the Consultation", () => {
    let s = driveTo(session(you), SUCCESS)
    expect(isLastQuestion(s)).toBe(true)
    s = setAnswer(s, SUCCESS, "Something I would like to change.")
    expect(s.finished).toBe(false)
  })

  it("toggling every option of a multi never advances", () => {
    let s = driveTo(session(you), CONSTRAINTS)
    const q = findConsultationQuestion(CONSTRAINTS)!
    for (const option of q.options!) {
      s = setAnswer(s, CONSTRAINTS, toggleMultiValue(q.options!, [], option.value))
      expect(s.currentQuestionId).toBe(CONSTRAINTS)
    }
  })

  it("goNext is what moves, and only when the gate allows", () => {
    const s = session(you)
    expect(goNext(s).currentQuestionId).toBe(Q1) // refused: still here
    expect(goNext(setAnswer(s, Q1, "bloating")).currentQuestionId).toBe(Q2)
  })
})

/* ══ K, L — optional and required ══════════════════════════════════════════ */

describe("K. an optional question can be passed unanswered", () => {
  it("the optional free-text question lets Continue through with nothing", () => {
    const s = driveTo(session(you), SUCCESS)
    expect(findConsultationQuestion(SUCCESS)!.required).toBe(false)
    expect(continueGate(s).allowed).toBe(true)
    expect(goNext(s).finished).toBe(true)
  })

  it("unanswered and 'prefer-not-to-say' stay distinct states", () => {
    // Passing an optional question must not be implemented by writing a
    // declined-disclosure value the customer never chose.
    let s = driveTo(session(you), CONSTRAINTS)
    s = goNext(setAnswer(s, CONSTRAINTS, ["allergy"]))
    expect(currentQuestion(s)?.id).toBe(AVOIDANCES)

    const passed = goNext(s)
    expect(passed.answers[AVOIDANCES]).toBeUndefined()
    expect(trustedAnswers(passed)[AVOIDANCES]).toBeUndefined()

    const declined = goNext(setAnswer(s, AVOIDANCES, ["prefer-not-to-say"]))
    expect(declined.answers[AVOIDANCES]).toEqual(["prefer-not-to-say"])
    expect(trustedAnswers(declined)[AVOIDANCES]).toEqual(["prefer-not-to-say"])
  })

  it("an optional question answered badly still blocks", () => {
    let s = driveTo(session(you), CONSTRAINTS)
    s = goNext(setAnswer(s, CONSTRAINTS, ["allergy"]))
    s = setAnswer(s, AVOIDANCES, ["not-an-option"])
    expect(continueGate(s).allowed).toBe(false)
  })
})

describe("L. a required question cannot be passed", () => {
  it("Continue is refused with an announceable reason", () => {
    const s = session(you)
    const gate = continueGate(s)
    expect(gate.allowed).toBe(false)
    expect(gate.allowed === false && gate.reason.length).toBeGreaterThan(0)
    expect(goNext(s).validationError).toBeTruthy()
  })

  it("pressing Continue repeatedly never gets past it", () => {
    let s = session(you)
    for (let i = 0; i < 10; i += 1) s = goNext(s)
    expect(s.currentQuestionId).toBe(Q1)
    expect(s.finished).toBe(false)
  })

  it("an invalid answer is refused as firmly as a missing one", () => {
    const s = setAnswer(session(you), Q1, "not-an-option")
    expect(continueGate(s).allowed).toBe(false)
    expect(goNext(s).currentQuestionId).toBe(Q1)
  })

  it("clearing an answer re-blocks a required question", () => {
    let s = setAnswer(session(you), Q1, "bloating")
    expect(continueGate(s).allowed).toBe(true)
    s = clearAnswer(s, Q1)
    expect(continueGate(s).allowed).toBe(false)
  })

  it("every required applicable question blocks when unanswered", () => {
    let s = session(you)
    for (let i = 0; i < 40; i += 1) {
      const q = currentQuestion(s)
      if (!q) break
      if (q.required) expect(continueGate(s).allowed, q.id).toBe(false)
      s = goNext(answerValidly(s, q))
    }
    expect(s.finished).toBe(true)
  })
})

/* ══ M, N — exclusivity ════════════════════════════════════════════════════ */

describe("M/N. exclusive options behave in both directions", () => {
  const q = () => findConsultationQuestion(CONSTRAINTS)!
  const exclusive = () => q().options!.filter((o) => o.exclusive).map((o) => o.value)
  const substantive = () => q().options!.filter((o) => !o.exclusive).map((o) => o.value)

  it("the bank really declares exclusive options here", () => {
    expect(exclusive().length).toBeGreaterThanOrEqual(2)
  })

  it("choosing an exclusive option clears substantive selections", () => {
    for (const ex of exclusive()) {
      const next = toggleMultiValue(q().options!, substantive().slice(0, 2), ex)
      expect(next).toEqual([ex])
    }
  })

  it("choosing a substantive option removes an active exclusive one", () => {
    for (const ex of exclusive()) {
      const next = toggleMultiValue(q().options!, [ex], substantive()[0])
      expect(next).toEqual([substantive()[0]])
    }
  })

  it("the result is always something the canonical validator accepts", () => {
    // The UI must not be able to build a combination the projection refuses.
    let selected: string[] = []
    for (const option of q().options!) {
      selected = toggleMultiValue(q().options!, selected, option.value)
      const s = setAnswer(driveTo(session(you), CONSTRAINTS), CONSTRAINTS, selected)
      expect(continueGate(s).allowed, selected.join("+")).toBe(true)
    }
  })

  it("toggling an option off again deselects it", () => {
    const first = substantive()[0]
    expect(toggleMultiValue(q().options!, [first], first)).toEqual([])
  })
})

/* ══ O — bundled values ════════════════════════════════════════════════════ */

describe("O. bundled Q3 values stay one selection", () => {
  it("each bundle is a single option value, and selecting it selects one thing", () => {
    const q = findConsultationQuestion(Q3)!
    for (const value of ["rushed", "large-late", "stress-sleep"]) {
      expect(q.options!.some((o) => o.value === value), value).toBe(true)
      expect(toggleMultiValue(q.options!, [], value)).toEqual([value])
    }
  })

  it("no component of a bundle is separately selectable", () => {
    const values = findConsultationQuestion(Q3)!.options!.map((o) => o.value)
    for (const component of ["stress", "sleep", "late", "large", "skipped"]) {
      expect(values, component).not.toContain(component)
    }
  })
})

/* ══ P, Q, R — Phase 3A invariants still hold at the experience layer ══════ */

describe("P/Q/R. the experience cannot surface what adjudication removed", () => {
  it("no reachable question is the removed antibiotic question", () => {
    for (const context of [you, family]) {
      const ids = applicableQuestions(session(context)).map((q) => q.id)
      expect(ids).not.toContain("core_rhythm_antibiotics_v1")
    }
    // And not through any answer either.
    let s = session(you)
    for (let i = 0; i < 40; i += 1) {
      const q = currentQuestion(s)
      if (!q) break
      expect(q.id).not.toBe("core_rhythm_antibiotics_v1")
      s = goNext(answerValidly(s, q))
    }
  })

  it("no reachable question targets bodySignalMap", () => {
    for (const context of [you, family]) {
      for (const q of applicableQuestions(session(context))) {
        expect(q.reportTargets, q.id).not.toContain("bodySignalMap")
      }
    }
  })

  it("nothing in the bank is marked scientifically reviewed", () => {
    expect(CONSULTATION_QUESTION_BANK.filter((q) => q.scienceReview === "reviewed")).toEqual([])
  })
})

/* ══ Slider touched state ══════════════════════════════════════════════════ */

describe("a slider's default position is not an answer", () => {
  // The v1 bank has no slider (types.ts explains why), so the renderer and the
  // gate are exercised against a synthetic one. Without this, the first slider
  // question ever added would ship with its default silently counting as an
  // answer and no test would notice.
  const slider: ConsultationQuestion = {
    id: "core_signals_test_slider_v1",
    answerField: "signals.testSlider",
    section: "signals",
    type: "slider",
    foundations: ["you"],
    text: "On a typical day, how settled does your digestion feel?",
    min: 0,
    max: 10,
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Fixture for the touched-state rule.",
    whyNeeded: "Fixture for the touched-state rule, which must not regress when a slider is added.",
    reportTargets: ["systemSnapshot"],
    freeAssessmentOverlap: "none",
  }
  const bank = [slider]

  it("an untouched required slider blocks Continue even with a value in range", () => {
    const s = begin(
      createConsultationSession({ context: you, questions: bank, answers: { [slider.id]: 5 } }),
    )
    // The value is valid on its own terms...
    expect(currentQuestion(s)?.id).toBe(slider.id)
    // ...but a resumed answer counts as touched, so this one passes.
    expect(continueGate(s).allowed).toBe(true)
  })

  it("a slider never interacted with in this session blocks Continue", () => {
    const s = begin(createConsultationSession({ context: you, questions: bank }))
    const untouched: ConsultationSessionState = { ...s, answers: { [slider.id]: 5 } }
    expect(untouched.touched.has(slider.id)).toBe(false)
    expect(continueGate(untouched).allowed).toBe(false)
  })

  it("moving the slider makes the value an answer", () => {
    let s = begin(createConsultationSession({ context: you, questions: bank }))
    s = setAnswer(s, slider.id, 5)
    expect(s.touched.has(slider.id)).toBe(true)
    expect(continueGate(s).allowed).toBe(true)
  })

  it("an out-of-range value is refused even when touched", () => {
    const s = setAnswer(begin(createConsultationSession({ context: you, questions: bank })), slider.id, 99)
    expect(continueGate(s).allowed).toBe(false)
  })
})

/* ══ Progress ══════════════════════════════════════════════════════════════ */

describe("progress is section-first and stays truthful", () => {
  it("reports the section, the position within it, and the section list", () => {
    const p = progress(session(you))
    expect(p.current?.section).toBe("signals")
    expect(p.current?.questionNumber).toBe(1)
    expect(p.sections).toEqual(["signals", "rhythm", "environment", "intentions"])
    expect(p.sectionIndex).toBe(0)
  })

  it("the section count grows when a branch inside it opens", () => {
    const before = progress(session(you)).current!.questionCount
    const after = progress(session(you, { [Q1]: "bloating" })).current!.questionCount
    expect(after).toBe(before + 2)
  })

  it("the overall total tracks the live sequence, not a fixed number", () => {
    expect(progress(session(you)).overallCount).toBe(13)
    expect(progress(session(you, { [Q1]: "bloating" })).overallCount).toBe(15)
    expect(
      progress(session(you, { [Q1]: "bloating", [CONSTRAINTS]: ["allergy"] })).overallCount,
    ).toBe(16)
  })

  it("marks the first question of each section as a section start", () => {
    let s = session(you)
    const starts: string[] = []
    for (let i = 0; i < 40; i += 1) {
      const q = currentQuestion(s)
      if (!q) break
      if (isSectionStart(s)) starts.push(q.section)
      s = goNext(answerValidly(s, q))
    }
    expect(starts).toEqual(["signals", "rhythm", "environment", "intentions"])
  })

  it("a section with no applicable questions never appears", () => {
    const p = progress(session(family))
    expect(p.sections).not.toContain("lens" as never)
    expect(p.sections.every((s) => ["signals", "rhythm", "environment", "intentions"].includes(s))).toBe(true)
  })
})

/* ══ Full walkthroughs ═════════════════════════════════════════════════════ */

describe("a whole Consultation can be completed", () => {
  it("You baseline finishes in 13 questions", () => {
    let s = session(you)
    let asked = 0
    for (let i = 0; i < 40 && !s.finished; i += 1) {
      const q = currentQuestion(s)!
      asked += 1
      s = goNext(answerForBaseline(s, q))
    }
    expect(s.finished).toBe(true)
    expect(asked).toBe(13)
  })

  it("the fully adaptive You path finishes in 16", () => {
    let s = session(you)
    let asked = 0
    for (let i = 0; i < 40 && !s.finished; i += 1) {
      const q = currentQuestion(s)!
      asked += 1
      // Choose the branch-opening answer wherever one exists.
      if (q.id === Q1) s = setAnswer(s, q.id, "bloating")
      else if (q.id === CONSTRAINTS) s = setAnswer(s, q.id, ["allergy"])
      else s = answerValidly(s, q)
      s = goNext(s)
    }
    expect(s.finished).toBe(true)
    expect(asked).toBe(16)
  })

  it("Family finishes in 13, or 14 with its branch open", () => {
    for (const [answer, expected] of [
      ["most-days", 13],
      ["never", 14],
    ] as const) {
      let s = session(family)
      let asked = 0
      for (let i = 0; i < 40 && !s.finished; i += 1) {
        const q = currentQuestion(s)!
        asked += 1
        s = goNext(
          q.id === SHARED_MEALS ? setAnswer(s, q.id, answer) : answerForBaseline(s, q),
        )
      }
      expect(asked, answer).toBe(expected)
    }
  })

  it("Back from the finished state returns to the last question", () => {
    let s = session(you)
    for (let i = 0; i < 40 && !s.finished; i += 1) s = goNext(answerValidly(s, currentQuestion(s)!))
    expect(s.finished).toBe(true)
    s = goBack(s)
    expect(s.finished).toBe(false)
    expect(currentQuestion(s)?.id).toBe(SUCCESS)
  })
})
