import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import {
  CONSULTATION_QUESTION_BANK,
  findConsultationQuestion,
  optionLabelFor,
  questionTextFor,
} from "@/lib/consultation/question-bank"
import { SECTION_META } from "@/lib/consultation/types"
import type { ConsultationAnswers, ConsultationContext } from "@/lib/consultation/types"
import { buildConsultationReview } from "@/lib/consultation/review"
import {
  begin,
  continueLocally,
  createConsultationSession,
  currentQuestion,
  goNext,
  setAnswer,
} from "@/lib/consultation/session"
import { validateConsultationAnswers } from "@/lib/consultation/completeness"
import { ConsultationReviewView } from "@/components/assessment/consultation/consultation-review"

/**
 * Phase 3C-B — Review your Consultation.
 *
 * ══ WHAT REVIEW IS ══════════════════════════════════════════════════════════
 *
 * A reflection of what the customer said, derived from (bank + context +
 * candidate answers) on every render. It is not a stored list, not an analysis,
 * and not a second copy of the questionnaire's wording.
 *
 * The model and the rendering are tested together here because the interesting
 * failures span both: a value that survives the model and reaches the screen as
 * an internal token is one bug, and a closed branch that the model drops but the
 * markup still shows is another. Real clicks, focus and keyboard traversal are
 * in `tests/e2e/consultation-preview.spec.ts` — the repo has no jsdom.
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

/** A valid answer for every question that applies, without hard-coding values. */
function answerEverything(
  context: ConsultationContext,
  overrides: ConsultationAnswers = {},
): ConsultationAnswers {
  const answers: ConsultationAnswers = { ...overrides }
  // Two passes: answering a trigger can open a branch whose child then needs an
  // answer of its own.
  for (let pass = 0; pass < 3; pass += 1) {
    for (const q of CONSULTATION_QUESTION_BANK) {
      if (!q.foundations.includes(context.foundation)) continue
      if (q.id in answers) continue
      if (q.type === "single") answers[q.id] = q.options![0].value
      else if (q.type === "multi") answers[q.id] = [q.options![0].value]
      else if (q.type === "textarea") answers[q.id] = "A sentence that is a real answer."
      else answers[q.id] = q.min ?? 0
    }
  }
  return answers
}

const review = (context: ConsultationContext, answers: ConsultationAnswers, skipped: string[] = []) =>
  buildConsultationReview({
    context,
    candidateAnswers: answers,
    skippedOptionalQuestionIds: skipped,
  })

const itemFor = (r: ReturnType<typeof review>, id: string) =>
  r.sections.flatMap((s) => s.items).find((i) => i.questionId === id)

const renderReview = (r: ReturnType<typeof review>) =>
  renderToStaticMarkup(createElement(ConsultationReviewView, { review: r, onEdit: () => {} }))

/**
 * Canonical text as it appears in the markup.
 *
 * React escapes text nodes, so a question carrying an apostrophe reaches the
 * page as `&#x27;`. Comparing the raw string would fail on the escaping rather
 * than on the wording — which is the opposite of what these assertions are for.
 */
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")

/* ══ What appears ══════════════════════════════════════════════════════════ */

describe("Review shows exactly the questions that apply right now", () => {
  it("a baseline You Consultation reviews the baseline sequence", () => {
    const r = review(you, { [Q1]: "nothing", [CONSTRAINTS]: ["budget"] })
    const expected = CONSULTATION_QUESTION_BANK.filter(
      (q) => q.foundations.includes("you") && !q.applicableWhen,
    ).map((q) => q.id)
    expect(r.questionIds).toEqual(expected)
  })

  it("an open branch is reviewed alongside its parent", () => {
    const r = review(you, answerEverything(you, { [Q1]: "bloating" }))
    expect(r.questionIds).toContain(Q3)
    expect(r.questionIds).toContain(Q4)
  })

  it("a closed branch is absent, with nothing having deleted it", () => {
    // The branch child still has a stored answer. It is simply not part of what
    // the customer is being asked to confirm, because they are not being asked.
    const answers = answerEverything(you, { [Q1]: "bloating" })
    const closed: ConsultationAnswers = { ...answers, [Q1]: "nothing" }
    const r = review(you, closed)
    expect(r.questionIds).not.toContain(Q3)
    expect(r.questionIds).not.toContain(Q4)
    expect(closed[Q3], "the candidate answer survives the branch closing").toBeDefined()
  })

  it("the stale candidate is retained outside the Review model", () => {
    const answers = answerEverything(you, { [Q1]: "bloating" })
    const stale: ConsultationAnswers = { ...answers, [Q1]: "nothing" }
    const r = review(you, stale)
    // Three different things, deliberately kept apart: stored, reviewed, trusted.
    expect(stale[Q4]).toBeDefined()
    expect(r.questionIds).not.toContain(Q4)
    expect(validateConsultationAnswers({ context: you, answers: stale }).trustedAnswers[Q4])
      .toBeUndefined()
  })

  it("a candidate answer to a question the bank does not hold is never displayed", () => {
    const answers = { ...answerEverything(you, { [Q1]: "nothing" }), not_a_question_v1: "value" }
    const r = review(you, answers)
    expect(r.questionIds).not.toContain("not_a_question_v1")
    expect(renderReview(r)).not.toContain("not_a_question_v1")
  })
})

/* ══ Grouping ══════════════════════════════════════════════════════════════ */

describe("Review is grouped into the canonical sections", () => {
  const r = review(you, answerEverything(you, { [Q1]: "bloating" }))

  it("sections appear in bank order and repeat none", () => {
    const sections = r.sections.map((s) => s.section)
    expect(sections).toEqual(["signals", "rhythm", "environment", "intentions"])
    expect(new Set(sections).size).toBe(sections.length)
  })

  it("each section carries its canonical title, not a new taxonomy", () => {
    for (const section of r.sections) {
      expect(section.title).toBe(SECTION_META[section.section].title)
    }
    for (const legacy of ["Symptoms", "Gut History", "Diagnosis", "Biological Signals"]) {
      expect(renderReview(r), legacy).not.toContain(legacy)
    }
  })

  it("every applicable question lands in its own question's section", () => {
    for (const section of r.sections) {
      for (const item of section.items) {
        expect(findConsultationQuestion(item.questionId)!.section).toBe(section.section)
      }
    }
  })

  it("the rendered page carries the header copy and one h1", () => {
    const html = renderReview(r)
    expect(html).toContain("Review your Consultation")
    expect(html).toMatch(/You can edit any answer before moving to the next step/)
    expect((html.match(/<h1/g) ?? []).length).toBe(1)
    expect((html.match(/<h2/g) ?? []).length).toBe(r.sections.length)
  })

  it("each section is a landmark named by its own heading", () => {
    const html = renderReview(r)
    for (const section of r.sections) {
      expect(html, section.section).toContain(`aria-labelledby="review-${section.section}"`)
      expect(html, section.section).toContain(`id="review-${section.section}"`)
    }
  })
})

/* ══ Answer display ════════════════════════════════════════════════════════ */

describe("answers are shown in the words the customer read", () => {
  it("a single choice shows its canonical label, never its stored value", () => {
    const r = review(you, answerEverything(you, { [Q1]: "bloating" }))
    const q = findConsultationQuestion(Q1)!
    const label = optionLabelFor(q.options!.find((o) => o.value === "bloating")!, "you")
    expect(itemFor(r, Q1)!.answer).toEqual([label])
    const html = renderReview(r)
    expect(html).toContain(esc(label))
    expect(html).not.toMatch(/>bloating</)
  })

  it("a multi choice shows one label per selected value", () => {
    const r = review(you, answerEverything(you, { [Q1]: "nothing", [CONSTRAINTS]: ["budget", "time"] }))
    const q = findConsultationQuestion(CONSTRAINTS)!
    expect(itemFor(r, CONSTRAINTS)!.answer).toEqual(
      ["budget", "time"].map((v) => optionLabelFor(q.options!.find((o) => o.value === v)!, "you")),
    )
  })

  it("a bundled value is shown as its whole canonical label", () => {
    // "stress-sleep" is one selection covering two circumstances (§17 of the
    // science contract). Splitting it here, or printing the token, would be a
    // claim the customer never made.
    const r = review(you, answerEverything(you, { [Q1]: "bloating", [Q3]: ["stress-sleep"] }))
    const q = findConsultationQuestion(Q3)!
    const label = optionLabelFor(q.options!.find((o) => o.value === "stress-sleep")!, "you")
    expect(label).toMatch(/\bor\b/i)
    expect(itemFor(r, Q3)!.answer).toEqual([label])
    const html = renderReview(r)
    expect(html).toContain(esc(label))
    expect(html).not.toContain("stress-sleep")
  })

  it("free text is shown exactly as typed, never summarised", () => {
    const typed = "Mornings feel steadier when I eat before nine."
    const r = review(you, answerEverything(you, { [Q1]: "nothing", [SUCCESS]: typed }))
    expect(itemFor(r, SUCCESS)!.answer).toEqual([typed])
    expect(renderReview(r)).toContain(esc(typed))
  })

  it("the question text is the canonical text for this foundation", () => {
    const r = review(you, answerEverything(you, { [Q1]: "nothing" }))
    for (const item of r.sections.flatMap((s) => s.items)) {
      expect(item.question).toBe(questionTextFor(findConsultationQuestion(item.questionId)!, "you"))
    }
  })
})

/* ══ The three unanswered states ═══════════════════════════════════════════ */

describe("an unanswered optional question is described truthfully", () => {
  // The one optional branch in the bank: it appears only on a safety constraint.
  const withBranch = { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }

  it("deliberately skipped reads as skipped", () => {
    const r = review(you, answerEverything(you, withBranch, ), [AVOIDANCES])
    // `answerEverything` fills it; clear it to model the skip it was given.
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const skippedReview = review(you, answers, [AVOIDANCES])
    expect(r.questionIds).toContain(AVOIDANCES)
    expect(itemFor(skippedReview, AVOIDANCES)!.state).toBe("skipped")
    expect(itemFor(skippedReview, AVOIDANCES)!.answer).toEqual([])
    expect(renderReview(skippedReview)).toContain("Not answered (optional)")
  })

  it("not yet reached reads as not answered yet", () => {
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const r = review(you, answers)
    expect(itemFor(r, AVOIDANCES)!.state).toBe("unanswered")
    expect(renderReview(r)).toContain("Not answered yet")
  })

  it("never invents No, None or a declined disclosure", () => {
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const html = renderReview(review(you, answers, [AVOIDANCES]))
    // Choosing "I'd rather not say" IS an answer, and it is not this. Rendering
    // it here would record a disclosure decision the customer never made.
    const q = findConsultationQuestion(AVOIDANCES)!
    const declined = optionLabelFor(q.options!.find((o) => o.value === "prefer-not-to-say")!, "you")
    expect(html).not.toContain(esc(declined))
    expect(html).not.toMatch(/>\s*(No|None)\s*</)
  })

  it("choosing to decline IS an answer and is shown as one", () => {
    const answers = answerEverything(you, { ...withBranch, [AVOIDANCES]: ["prefer-not-to-say"] })
    const r = review(you, answers)
    const q = findConsultationQuestion(AVOIDANCES)!
    const declined = optionLabelFor(q.options!.find((o) => o.value === "prefer-not-to-say")!, "you")
    expect(itemFor(r, AVOIDANCES)!.state).toBe("answered")
    expect(itemFor(r, AVOIDANCES)!.answer).toEqual([declined])
  })

  it("an invalid stored value is shown as unanswered rather than printed", () => {
    const answers = { ...answerEverything(you, { [Q1]: "nothing" }), [Q2]: "not-an-option" }
    const r = review(you, answers)
    expect(itemFor(r, Q2)!.state).toBe("unanswered")
    expect(r.missingRequiredIds).toContain(Q2)
    expect(r.complete).toBe(false)
    expect(renderReview(r)).not.toContain("not-an-option")
  })
})

/* ══ Preview and persisted paths agree ═════════════════════════════════════ */

describe("a question passed with Continue reads the same as one passed with Skip", () => {
  const withBranch = { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }

  /** The state after Continue on the unanswered optional question. */
  function afterContinue() {
    let s = begin(createConsultationSession({ context: you, answers: withBranch }))
    for (let i = 0; i < 30 && currentQuestion(s)?.id !== AVOIDANCES; i += 1) {
      const q = currentQuestion(s)!
      const value =
        q.type === "single"
          ? q.options![0].value
          : q.type === "multi"
            ? [q.options![0].value]
            : q.type === "textarea"
              ? "A sentence that is a real answer."
              : (q.min ?? 0)
      s = goNext(setAnswer(s, q.id, value))
    }
    expect(currentQuestion(s)?.id).toBe(AVOIDANCES)

    // The SAME transition the preview's Continue handler runs — called, not
    // re-implemented, so a change to it cannot pass here and fail there.
    return continueLocally(s)
  }

  it("Continue records the skip, so the model reports it as skipped", () => {
    const s = afterContinue()
    const r = review(you, s.answers, [...s.skipped])
    expect(itemFor(r, AVOIDANCES)!.state).toBe("skipped")
  })

  it("the avoidance row says 'Not answered (optional)', not 'Not answered yet'", () => {
    // The whole point of the parity: the preview must not describe a decision
    // the customer made as silence.
    //
    // Scoped to that row on purpose. Questions further on are genuinely not
    // reached yet, and they SHOULD still read "Not answered yet" — a page-wide
    // assertion would be checking the wrong thing and would pass for the wrong
    // reason if the two labels were ever merged.
    const s = afterContinue()
    const html = renderReview(review(you, s.answers, [...s.skipped]))
    const question = questionTextFor(findConsultationQuestion(AVOIDANCES)!, "you")
    const start = html.indexOf(esc(question))
    expect(start, "the avoidance row is on the page").toBeGreaterThan(-1)
    const row = html.slice(start, html.indexOf("</li>", start))

    expect(row).toContain("Not answered (optional)")
    expect(row).not.toContain("Not answered yet")
  })

  it("Continue and the Skip button produce the same Review", () => {
    const viaContinue = afterContinue()
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const viaButton = review(you, answers, [AVOIDANCES])

    expect(itemFor(review(you, viaContinue.answers, [...viaContinue.skipped]), AVOIDANCES)!.state)
      .toBe(itemFor(viaButton, AVOIDANCES)!.state)
  })

  it("a question genuinely not reached still reads as not answered yet", () => {
    // The distinction has to survive in both directions, or recording the skip
    // would just have replaced one wrong label with another.
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const html = renderReview(review(you, answers))
    expect(html).toContain("Not answered yet")
    expect(html).not.toContain("Not answered (optional)")
  })
})

/* ══ Completeness ══════════════════════════════════════════════════════════ */

describe("the model reports completeness the same way the canonical projection does", () => {
  it("a fully answered Consultation is complete with nothing missing", () => {
    const answers = answerEverything(you, { [Q1]: "bloating" })
    const r = review(you, answers)
    expect(r.missingRequiredIds).toEqual([])
    expect(r.complete).toBe(true)
    expect(validateConsultationAnswers({ context: you, answers }).complete).toBe(true)
  })

  it("a missing required answer is named and blocks completeness", () => {
    const answers = answerEverything(you, { [Q1]: "nothing" })
    delete answers[Q2]
    const r = review(you, answers)
    expect(r.missingRequiredIds).toEqual([Q2])
    expect(r.complete).toBe(false)
  })

  it("a skipped OPTIONAL question does not block completeness", () => {
    const answers = answerEverything(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    delete answers[AVOIDANCES]
    const r = review(you, answers, [AVOIDANCES])
    expect(r.missingRequiredIds).toEqual([])
    expect(r.complete).toBe(true)
  })
})

/* ══ Family ════════════════════════════════════════════════════════════════ */

describe("Family Review uses household wording throughout", () => {
  const answers = answerEverything(family, { [SHARED_MEALS]: "never" })
  const r = review(family, answers)

  it("reviews the household sequence including its own branch", () => {
    expect(r.questionIds).toContain(SHARED_MEALS)
    expect(r.questionIds).toContain(SEPARATE_REASON)
    expect(r.questionIds).not.toContain(Q1)
  })

  it("section titles are the household titles", () => {
    for (const section of r.sections) {
      expect(section.title).toBe(SECTION_META[section.section].familyTitle)
    }
  })

  it("question text and option labels are the household versions", () => {
    const shared = findConsultationQuestion(CONSTRAINTS)!
    const item = itemFor(r, CONSTRAINTS)!
    expect(item.question).toBe(questionTextFor(shared, "family"))
    expect(item.question).not.toBe(shared.text)
    const value = (answers[CONSTRAINTS] as string[])[0]
    expect(item.answer).toEqual([
      optionLabelFor(shared.options!.find((o) => o.value === value)!, "family"),
    ])
  })

  it("the rendered page carries no You-voice question text", () => {
    const html = renderReview(r)
    const shared = findConsultationQuestion(CONSTRAINTS)!
    expect(shared.familyText, "fixture assumes this question has household wording").toBeTruthy()
    expect(html).not.toContain(esc(shared.text))
  })
})

/* ══ Edit ══════════════════════════════════════════════════════════════════ */

describe("every Review item offers an Edit a screen reader can tell apart", () => {
  const r = review(you, answerEverything(you, { [Q1]: "bloating" }))
  const html = renderReview(r)

  it("one Edit per applicable question", () => {
    expect((html.match(/>Edit</g) ?? []).length).toBe(r.questionIds.length)
  })

  it("each Edit carries its own question in the accessible name", () => {
    for (const item of r.sections.flatMap((s) => s.items)) {
      // A column of identical "Edit" buttons is unusable without this.
      expect(html, item.questionId).toContain(esc(item.question))
    }
    expect((html.match(/sr-only/g) ?? []).length).toBeGreaterThanOrEqual(r.questionIds.length)
  })

  it("Edit is a real button with an adequate touch target", () => {
    expect((html.match(/type="button"/g) ?? []).length).toBeGreaterThanOrEqual(r.questionIds.length)
    expect((html.match(/min-h-\[44px\]/g) ?? []).length).toBeGreaterThanOrEqual(r.questionIds.length)
  })

  it("Edit names the question it is given, not a position", () => {
    const calls: string[] = []
    const html2 = renderToStaticMarkup(
      createElement(ConsultationReviewView, { review: r, onEdit: (id: string) => calls.push(id) }),
    )
    // Rendering alone cannot click; what is provable here is that the ids the
    // handler will receive are canonical question ids in the live sequence.
    expect(html2).toBeTruthy()
    expect(r.questionIds.every((id) => Boolean(findConsultationQuestion(id)))).toBe(true)
  })
})

/* ══ Review interprets nothing ═════════════════════════════════════════════ */

describe("Review reflects and does not explain", () => {
  const MODEL = readFileSync(join(process.cwd(), "lib/consultation/review.ts"), "utf8")
  const VIEW = readFileSync(
    join(process.cwd(), "components/assessment/consultation/consultation-review.tsx"),
    "utf8",
  )
  const html = renderReview(review(you, answerEverything(you, { [Q1]: "bloating" })))

  it("adds no insight, lever, risk or biological statement", () => {
    for (const source of [MODEL, VIEW, html]) {
      for (const re of [
        /insight/i,
        /priority lever/i,
        /risk (indicator|score)/i,
        /your microbiome/i,
        /postbiotic/i,
        /this suggests/i,
        /this can mean/i,
        /points to/i,
        /because you/i,
      ]) {
        expect(source.match(re)?.[0], `interpretation: ${re}`).toBeUndefined()
      }
    }
  })

  it("says nothing about a food being safe or an allergy's severity", () => {
    for (const source of [MODEL, VIEW, html]) {
      expect(source).not.toMatch(/\bis safe\b|\bare safe\b|safe to eat/i)
      expect(source).not.toMatch(/severe|anaphyla|mild allergy/i)
    }
  })

  it("renders no internal governance field", () => {
    for (const field of [
      "whyNeeded",
      "deeperBecause",
      "scienceReview",
      "evidenceStatus",
      "prohibitedInferences",
      "sensitivity",
      "answerField",
      "reportTargets",
    ]) {
      expect(MODEL, `model reads ${field}`).not.toContain(field)
      expect(VIEW, `view renders ${field}`).not.toContain(field)
      expect(html, `page shows ${field}`).not.toContain(field)
    }
  })

  it("shows no question id anywhere on the page", () => {
    expect(html).not.toMatch(/core_[a-z]+_[a-z_]+_v\d/)
  })

  it("holds no copy of the bank's wording", () => {
    for (const source of [MODEL, VIEW]) {
      expect(source).not.toMatch(/core_[a-z]+_[a-z_]+_v\d/)
      expect(source).not.toContain(findConsultationQuestion(Q1)!.text)
    }
    expect(MODEL).toContain("questionTextFor")
    expect(MODEL).toContain("optionLabelFor")
    expect(MODEL).toContain("resolveApplicableQuestions")
  })

  it("the model is derived, never persisted", () => {
    // A stored review list would be a second copy of "what was asked", stale in
    // exactly the case that matters — the moment a branch closes.
    expect(MODEL).not.toMatch(/\bfetch\(/)
    expect(MODEL).not.toContain("localStorage")
    expect(MODEL).not.toMatch(/supabase/i)
  })

  it("offers no Report handoff", () => {
    expect(VIEW).not.toMatch(/Create My (Food System )?Report/i)
    expect(VIEW).not.toContain("submit-deep-assessment")
    expect(VIEW).not.toMatch(/\bfetch\(/)
  })
})

/* ══ Withdrawal — who may take an answer back ══════════════════════════════ */

/**
 * Phase 3C-C1 — `canWithdraw`.
 *
 * The model decides who may remove an answer, and the view asks rather than
 * decides. Keeping the rule here means there is one definition of "this can be
 * taken back", shared by the ephemeral preview, the persisted client and any
 * later surface — rather than a condition retyped in each of them, which is how
 * a required question eventually acquires a Remove button.
 */
describe("Review says which answers may be taken back", () => {
  const withBranch = { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }

  it("an answered OPTIONAL question may be withdrawn", () => {
    const r = review(you, answerEverything(you, withBranch))
    for (const id of [AVOIDANCES, SUCCESS]) {
      expect(itemFor(r, id)!.state, id).toBe("answered")
      expect(itemFor(r, id)!.canWithdraw, id).toBe(true)
    }
  })

  it("no REQUIRED question may be withdrawn, however it was answered", () => {
    const r = review(you, answerEverything(you, withBranch))
    const required = r.sections.flatMap((s) => s.items).filter((i) => i.required)
    expect(required.length).toBeGreaterThan(0)
    for (const item of required) expect(item.canWithdraw, item.questionId).toBe(false)
  })

  it("an optional question that is already skipped has nothing to withdraw", () => {
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const r = review(you, answers, [AVOIDANCES])
    expect(itemFor(r, AVOIDANCES)!.state).toBe("skipped")
    expect(itemFor(r, AVOIDANCES)!.canWithdraw).toBe(false)
  })

  it("an optional question not yet reached has nothing to withdraw", () => {
    const answers = answerEverything(you, withBranch)
    delete answers[AVOIDANCES]
    const r = review(you, answers)
    expect(itemFor(r, AVOIDANCES)!.state).toBe("unanswered")
    expect(itemFor(r, AVOIDANCES)!.canWithdraw).toBe(false)
  })

  it("a DECLINED disclosure is an answer, so it may be taken back too", () => {
    // "I'd rather not say" is something the customer chose to record. Refusing
    // to let them remove it would make the declining option stickier than the
    // disclosing ones.
    const r = review(you, answerEverything(you, { ...withBranch, [AVOIDANCES]: ["prefer-not-to-say"] }))
    expect(itemFor(r, AVOIDANCES)!.state).toBe("answered")
    expect(itemFor(r, AVOIDANCES)!.canWithdraw).toBe(true)
  })

  it("an invalid stored value is a correction, not something to withdraw", () => {
    const answers = { ...answerEverything(you, withBranch), [AVOIDANCES]: ["not-an-option"] }
    const r = review(you, answers)
    expect(itemFor(r, AVOIDANCES)!.state).toBe("unanswered")
    expect(itemFor(r, AVOIDANCES)!.canWithdraw).toBe(false)
  })

  it("a closed branch is not on the list at all, so it cannot be withdrawn here", () => {
    const answers = answerEverything(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] })
    const closed = { ...answers, [CONSTRAINTS]: ["budget"] }
    const r = review(you, closed)
    expect(r.questionIds).not.toContain(AVOIDANCES)
    expect(itemFor(r, AVOIDANCES)).toBeUndefined()
  })

  it("Family follows the same rule, on the same two optional questions", () => {
    const r = review(family, answerEverything(family, { [CONSTRAINTS]: ["allergy"] }))
    const withdrawable = r.sections
      .flatMap((s) => s.items)
      .filter((i) => i.canWithdraw)
      .map((i) => i.questionId)
    expect(withdrawable.sort()).toEqual([AVOIDANCES, SUCCESS].sort())
  })
})

/* ══ Withdrawal — what reaches the screen ══════════════════════════════════ */

describe("the Remove control appears exactly where the model allows it", () => {
  const r = review(you, answerEverything(you, { [Q1]: "nothing", [CONSTRAINTS]: ["allergy"] }))
  const items = r.sections.flatMap((s) => s.items)

  const renderWithWithdraw = () =>
    renderToStaticMarkup(
      createElement(ConsultationReviewView, {
        review: r,
        onEdit: () => {},
        onWithdraw: () => {},
      }),
    )

  /** The rendered rows, each paired with the item it belongs to. */
  const rowsByItem = () => {
    // Split on the ROW element specifically. A multi-value answer renders its
    // own list items inside the row, so splitting on every `<li` would cut a
    // row in half and hand the controls to the wrong question.
    const rows = renderWithWithdraw().split('<li class="rounded-2xl').slice(1)
    expect(rows).toHaveLength(items.length)
    return items.map((item) => {
      const matching = rows.filter((row) => row.includes(esc(item.question)))
      expect(matching, `one row for ${item.questionId}`).toHaveLength(1)
      return { item, row: matching[0] }
    })
  }

  it("a caller that cannot honour a removal renders no control", () => {
    // The preview and the persisted client both pass a handler. A surface that
    // did not would otherwise show a button that silently does nothing.
    expect(renderReview(r)).not.toContain("Remove answer")
  })

  it("one control per withdrawable answer, and none anywhere else", () => {
    const expected = items.filter((i) => i.canWithdraw).length
    expect(expected).toBeGreaterThan(0)
    expect((renderWithWithdraw().match(/Remove answer/g) ?? []).length).toBe(expected)
  })

  it("no required question's row carries one", () => {
    for (const { item, row } of rowsByItem()) {
      expect(row.includes("Remove answer"), item.questionId).toBe(item.canWithdraw)
      if (item.required) expect(row, item.questionId).not.toContain("Remove answer")
    }
  })

  it("each control names its own question for a screen reader", () => {
    for (const { item, row } of rowsByItem()) {
      if (!item.canWithdraw) continue
      // Visible text is "Remove answer" for everyone; the question follows it in
      // the accessible name, as it does for Edit.
      expect(row, item.questionId).toContain(`Remove answer<span class="sr-only"> for ${esc(item.question)}`)
    }
  })

  it("it is a real button with an adequate touch target", () => {
    for (const { item, row } of rowsByItem()) {
      if (!item.canWithdraw) continue
      // The control's own opening tag, not a fixed lookback: the inline icon is
      // long enough that a character count would silently start mid-element.
      const at = row.indexOf("Remove answer")
      const segment = row.slice(row.lastIndexOf("<button", at), at)
      expect(segment, item.questionId).toContain('type="button"')
      expect(segment, item.questionId).toContain("min-h-[44px]")
    }
  })

  it("it is worded as a removal, never as a deletion or a warning", () => {
    // Reversible: the customer can Edit the question and answer it again. Copy
    // that implied otherwise would make an ordinary correction feel dangerous.
    const html = renderWithWithdraw()
    for (const alarming of ["Delete", "Erase", "permanently", "cannot be undone", "Are you sure"]) {
      expect(html, alarming).not.toContain(alarming)
    }
  })
})
