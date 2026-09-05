import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { DeterministicConsultationClient } from "@/components/assessment/consultation/deterministic-consultation-client"
import { ConsultationQuestionView } from "@/components/assessment/consultation/consultation-question"
import { findConsultationQuestion } from "@/lib/consultation/question-bank"
import type { ConsultationQuestion } from "@/lib/consultation/types"

/**
 * Phase 3B — the rendered Consultation, and the guards that keep it honest.
 *
 * ══ WHAT IS TESTED WHERE ════════════════════════════════════════════════════
 *
 * Behaviour — advancing, Back, validation, exclusivity — lives in the session
 * reducer and is tested in `consultation-session.test.ts`, in Node, where the
 * rule itself can be proven rather than one component's wiring of it.
 *
 * This file covers the two things that are genuinely properties of the
 * rendering: the markup a customer's assistive technology receives, and the
 * source-level promises the component makes (no AI call, no submit, no
 * auto-advance, no internal science fields on screen).
 *
 * Real clicks, focus movement, keyboard traversal and mobile layout are in
 * `tests/e2e/consultation-preview.spec.ts`, against a real browser — the repo
 * has no jsdom, and a fake DOM would be a worse proxy for those than Chromium.
 */

const DIR = "components/assessment/consultation"
const CLIENT = join(process.cwd(), DIR, "deterministic-consultation-client.tsx")
const QUESTION = join(process.cwd(), DIR, "consultation-question.tsx")
const ORIENTATION = join(process.cwd(), DIR, "consultation-orientation.tsx")
const PROGRESS = join(process.cwd(), DIR, "consultation-progress.tsx")

const read = (p: string) => readFileSync(p, "utf8")

/** Every source file of the new experience. */
function experienceSources(): string[] {
  const base = join(process.cwd(), DIR)
  return readdirSync(base)
    .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts"))
    .map((f) => join(base, f))
}

function renderQuestion(question: ConsultationQuestion, overrides: Record<string, unknown> = {}) {
  return renderToStaticMarkup(
    createElement(ConsultationQuestionView, {
      question,
      foundation: "you",
      answer: undefined,
      touched: false,
      onAnswer: () => {},
      onBack: () => {},
      onNext: () => {},
      canGoBack: true,
      isLast: false,
      validationError: null,
      sectionTitle: "Your Signals",
      questionNumber: 1,
      questionCount: 4,
      ...overrides,
    } as never),
  )
}

/* ══ Orientation ═══════════════════════════════════════════════════════════ */

describe("Orientation states what this is without over-claiming", () => {
  const html = renderToStaticMarkup(
    createElement(DeterministicConsultationClient, { context: { foundation: "you" } }),
  )

  it("names the product and offers the Begin action", () => {
    expect(html).toContain("Personal Food System Consultation")
    expect(html).toContain("Begin My Consultation")
  })

  it("says it is guided, educational and non-diagnostic", () => {
    expect(html).toMatch(/guided digital process/i)
    expect(html).toMatch(/educational and non-diagnostic/i)
    expect(html).toMatch(/does not diagnose/i)
  })

  it("explains movement, adaptation and optional questions", () => {
    expect(html).toMatch(/forward and back/i)
    expect(html).toMatch(/only if they are relevant/i)
    expect(html).toMatch(/optional is clearly marked/i)
  })

  it("claims no completion time", () => {
    const source = experienceSources().map(read).join("\n")
    for (const re of [/\b\d+\s*(–|-|to)?\s*\d*\s*minutes?\b/i, /\btakes about\b/i, /\bquick\b/i]) {
      expect(source.match(re)?.[0], `time claim: ${re}`).toBeUndefined()
    }
  })

  it("claims no continuous saving and no email continuation", () => {
    const source = experienceSources().map(read).join("\n")
    expect(source).not.toMatch(/instantly saved|saved automatically|every answer is saved/i)
    expect(source).not.toMatch(/emailed you a link|email you a link/i)
  })

  it("uses household wording for Family", () => {
    const family = renderToStaticMarkup(
      createElement(DeterministicConsultationClient, { context: { foundation: "family" } }),
    )
    expect(family).toContain("Household Food System Consultation")
    expect(family).toContain("Begin Our Consultation")
  })
})

/* ══ Question semantics ════════════════════════════════════════════════════ */

describe("a question is rendered as a real, labelled group", () => {
  const q1 = findConsultationQuestion("core_signals_post_meal_pattern_v1")!

  it("uses fieldset and legend rather than a row of buttons", () => {
    const html = renderQuestion(q1)
    expect(html).toContain("<fieldset")
    expect(html).toContain("<legend")
  })

  it("renders native radios for single choice, each with its own label", () => {
    const html = renderQuestion(q1)
    expect(html).toMatch(/type="radio"/)
    expect((html.match(/type="radio"/g) ?? []).length).toBe(q1.options!.length)
    expect((html.match(/<label/g) ?? []).length).toBe(q1.options!.length)
  })

  it("renders native checkboxes for multi choice and says so", () => {
    const multi = findConsultationQuestion("core_environment_constraints_v1")!
    const html = renderQuestion(multi)
    expect((html.match(/type="checkbox"/g) ?? []).length).toBe(multi.options!.length)
    expect(html).toContain("Select all that apply")
  })

  it("announces the section and position before the question text", () => {
    const html = renderQuestion(q1)
    expect(html).toMatch(/Your Signals\. Question 1 of 4\./)
    expect(html).toContain(q1.text)
  })

  it("gives the heading a programmatic focus target", () => {
    expect(renderQuestion(q1)).toMatch(/tabIndex="-1"|tabindex="-1"/)
  })

  it("renders canonical support text when the question has it", () => {
    expect(q1.supportText).toBeTruthy()
    expect(renderQuestion(q1)).toContain(q1.supportText!)
  })

  it("marks an optional question Optional, and a required one not", () => {
    const optional = findConsultationQuestion("core_environment_food_avoidances_v1")!
    expect(optional.required).toBe(false)
    expect(renderQuestion(optional)).toContain("Optional")
    expect(renderQuestion(q1)).not.toContain(">Optional<")
  })

  it("renders a validation message as an alert", () => {
    const html = renderQuestion(q1, { validationError: "Please choose an answer to continue." })
    expect(html).toContain('role="alert"')
    expect(html).toContain("Please choose an answer to continue.")
  })

  it("renders Continue and Back with adequate touch targets", () => {
    const html = renderQuestion(q1)
    expect(html).toContain("Continue")
    expect(html).toContain("Back")
    expect((html.match(/min-h-\[44px\]/g) ?? []).length).toBeGreaterThanOrEqual(2)
  })

  it("labels the last question's action Finish, not Submit or Generate", () => {
    const html = renderQuestion(q1, { isLast: true })
    expect(html).toContain("Finish")
    expect(html).not.toMatch(/generate|submit my|create my report/i)
  })

  it("hides Back on the first question rather than rendering a dead control", () => {
    expect(renderQuestion(q1, { canGoBack: false })).not.toContain(">Back<")
  })

  it("uses household wording and household option labels for Family", () => {
    const shared = findConsultationQuestion("core_environment_constraints_v1")!
    const html = renderToStaticMarkup(
      createElement(ConsultationQuestionView, {
        question: shared,
        foundation: "family",
        answer: undefined,
        touched: false,
        onAnswer: () => {},
        onBack: () => {},
        onNext: () => {},
        canGoBack: true,
        isLast: false,
        validationError: null,
        sectionTitle: "Your Food Environment",
        questionNumber: 1,
        questionCount: 6,
      } as never),
    )
    // Compared on a fragment without an apostrophe: the renderer escapes `'`
    // to `&#x27;`, so a whole-string match would fail on the escaping rather
    // than on the wording.
    expect(shared.familyText).toContain("your household")
    expect(html).toContain("your household")
    expect(html).not.toContain(shared.text)
    // The household label for the "Foods I simply don't like" option.
    expect(html).toContain("Foods we simply don&#x27;t like")
  })
})

/* ══ Bundled values on screen ══════════════════════════════════════════════ */

describe("bundled values are rendered whole", () => {
  const q3 = findConsultationQuestion("core_signals_context_v1")!

  it("each bundle is one checkbox carrying its exact canonical OR label", () => {
    const html = renderQuestion(q3)
    for (const value of ["rushed", "large-late", "stress-sleep"]) {
      const option = q3.options!.find((o) => o.value === value)!
      expect(option.label).toMatch(/\bor\b/i)
      expect(html, value).toContain(option.label)
    }
    expect((html.match(/type="checkbox"/g) ?? []).length).toBe(q3.options!.length)
  })

  it("renders no sub-control that would split a bundle", () => {
    const source = read(QUESTION)
    for (const banned of ["components", "splitLabel", "subOption", "decompose"]) {
      expect(source, banned).not.toContain(banned)
    }
  })
})

/* ══ Slider ════════════════════════════════════════════════════════════════ */

describe("an untouched slider does not present its default as an answer", () => {
  const slider: ConsultationQuestion = {
    id: "core_signals_test_slider_v1",
    answerField: "signals.testSlider",
    section: "signals",
    type: "slider",
    foundations: ["you"],
    text: "How settled does your digestion feel on a typical day?",
    min: 0,
    max: 10,
    required: true,
    sensitivity: "low",
    scienceReview: "not-required",
    intent: "Renderer fixture.",
    whyNeeded: "Renderer fixture, so the untouched-slider rule cannot regress when one is added.",
    reportTargets: ["systemSnapshot"],
    freeAssessmentOverlap: "none",
  }

  it("shows a dash and says no answer has been chosen", () => {
    const html = renderQuestion(slider)
    expect(html).toContain("—")
    expect(html).toContain('aria-valuetext="No answer chosen yet"')
  })

  it("shows the number once it is the customer's answer", () => {
    const html = renderQuestion(slider, { answer: 7, touched: true })
    expect(html).toContain(">7<")
    expect(html).toContain('aria-valuetext="7"')
  })
})

/* ══ Free text ═════════════════════════════════════════════════════════════ */

describe("free text is a plain, bounded, labelled textarea", () => {
  const q = findConsultationQuestion("core_intentions_success_v1")!

  it("carries the canonical max length and a label", () => {
    expect(q.maxLength).toBeGreaterThan(0)
    const html = renderQuestion(q)
    expect(html).toContain(`maxLength="${q.maxLength}"`)
    expect(html).toMatch(/<label[^>]*class="sr-only"/)
    expect(html).toContain(`/${q.maxLength}`)
  })

  it("offers no AI assistance of any kind", () => {
    const source = read(QUESTION)
    expect(source).not.toMatch(/autocomplete|suggest|expand|rewrite|ai-?assist/i)
  })
})

/* ══ Progress ══════════════════════════════════════════════════════════════ */

describe("progress leads with the section, not a global count", () => {
  const html = renderToStaticMarkup(
    createElement(DeterministicConsultationClient, { context: { foundation: "you" } }),
  )

  it("the progress bar is absent on Orientation", () => {
    // Orientation is not a section and carries no position.
    expect(html).not.toMatch(/Question 1 of/)
  })

  it("names the sections rather than numbering the whole Consultation", () => {
    const source = read(PROGRESS)
    expect(source).toContain("Question {current.questionNumber} of {current.questionCount}")
    // The overall figure exists, but only inside the screen-reader line.
    expect(source).toMatch(/sr-only[\s\S]{0,200}overallNumber/)
  })

  it("scopes the visible bar to the current section", () => {
    const source = read(PROGRESS)
    expect(source).toContain("current.questionNumber / current.questionCount")
    expect(source).not.toContain("overallNumber / progress.overallCount")
  })

  it("tells assistive technology the total can change", () => {
    expect(read(PROGRESS)).toMatch(/total can\s+change/)
  })
})

/* ══ End state ═════════════════════════════════════════════════════════════ */

describe("the Consultation ends at a neutral pre-Review state", () => {
  const source = read(CLIENT)

  it("says the answers are ready to review and names Phase 3C", () => {
    expect(source).toContain("Your Consultation answers are ready to review.")
    expect(source).toMatch(/Phase 3C/)
  })

  it("promises no report, no PDF and no email", () => {
    expect(source).not.toMatch(/Generating your PDF|Analysing your food system|your report is being/i)
    expect(source).not.toMatch(/STAGES|setSubmitStage/)
  })

  it("has no timers at all", () => {
    // The legacy client fakes generation stages with setTimeout. Nothing here
    // may describe work that has not started.
    for (const file of experienceSources()) {
      expect(read(file), file).not.toContain("setTimeout")
      expect(read(file), file).not.toContain("setInterval")
    }
  })
})

/* ══ The frozen promises ═══════════════════════════════════════════════════ */

describe("the experience makes no AI call and no submission", () => {
  it("never references the question-generation route or a model provider", () => {
    for (const file of experienceSources()) {
      const source = read(file)
      expect(source, file).not.toContain("generate-deep-questions")
      expect(source, file).not.toMatch(/anthropic|openai|claude-|gpt-/i)
    }
  })

  it("never posts to the submit route", () => {
    for (const file of experienceSources()) {
      expect(read(file), file).not.toContain("submit-deep-assessment")
    }
  })

  it("makes no network request whatsoever", () => {
    // Phase 3B persists nothing (see the persistence note in the PR): a fetch
    // here would either be a save that cannot succeed or a call that should not
    // exist. Either is worth failing on.
    for (const file of experienceSources()) {
      const source = read(file)
      expect(source, file).not.toMatch(/\bfetch\(/)
      expect(source, file).not.toMatch(/XMLHttpRequest|axios/)
    }
  })

  it("selecting an option cannot advance — no navigation call sits in an answer handler", () => {
    const source = read(QUESTION)
    // The legacy view does `onAnswer(...)` then `setTimeout(() => onNext(), 350)`.
    // The answer handlers here must call onAnswer and nothing else.
    const handlers = source.match(/function handle(Single|Multi)\([\s\S]*?\n {2}\}/g) ?? []
    expect(handlers.length).toBe(2)
    for (const handler of handlers) {
      expect(handler, handler.slice(0, 40)).not.toContain("onNext")
    }
    // And the only onChange wiring goes to those handlers.
    expect(source).not.toMatch(/onChange=\{[^}]*onNext/)
  })

  it("Continue is the only thing wired to onNext", () => {
    const source = read(QUESTION)
    const onNextUses = source.match(/onNext/g) ?? []
    // The prop, its type, and exactly one onClick.
    expect((source.match(/onClick=\{onNext\}/g) ?? []).length).toBe(1)
    expect(onNextUses.length).toBeLessThanOrEqual(4)
  })
})

/* ══ Internal fields stay internal ═════════════════════════════════════════ */

describe("science governance never reaches the customer", () => {
  it("no internal question field is rendered", () => {
    for (const file of experienceSources()) {
      const source = read(file)
      for (const field of [
        "whyNeeded",
        "deeperBecause",
        "scienceReview",
        "evidenceStatus",
        "prohibitedInferences",
        "sensitivity",
      ]) {
        expect(source, `${file} renders ${field}`).not.toContain(field)
      }
    }
  })

  it("`intent` is not rendered either", () => {
    // Checked separately because the word appears in prose; this looks for the
    // property access that would put it on screen.
    for (const file of experienceSources()) {
      expect(read(file), file).not.toMatch(/question\.intent|\{intent\}/)
    }
  })

  it("no science-contract status is shown as a badge", () => {
    for (const file of experienceSources()) {
      const source = read(file)
      for (const badge of ["CONTEXT_ONLY", "SUPPORTED", "SPECIALIST_REVIEW", "PROHIBITED"]) {
        expect(source, `${file} surfaces ${badge}`).not.toContain(badge)
      }
      expect(source, file).not.toContain("science-contract")
    }
  })
})

/* ══ Interpretation and safety copy ════════════════════════════════════════ */

describe("the Consultation collects, it does not interpret", () => {
  const source = experienceSources().map(read).join("\n")

  it("adds no interpretive copy around a signal answer", () => {
    for (const re of [
      /this suggests/i,
      /this can mean/i,
      /your microbiome/i,
      /your body is telling you/i,
      /that (often|usually) means/i,
      /points to/i,
    ]) {
      expect(source.match(re)?.[0], `interpretive copy: ${re}`).toBeUndefined()
    }
  })

  it("adds no restriction language around the lighter-meals answer", () => {
    for (const re of [
      /eat less/i,
      /smaller (meals|portions)/i,
      /fewer meals/i,
      /calorie/i,
      /restrict/i,
      /skip(ping)? meals/i,
      /cut down/i,
    ]) {
      expect(source.match(re)?.[0], `restriction language: ${re}`).toBeUndefined()
    }
  })

  it("never describes an unselected food as safe", () => {
    expect(source).not.toMatch(/\bis safe\b|\bare safe\b|safe to eat/i)
  })

  it("shows no future food-safety copy, which is not implemented", () => {
    expect(source).not.toMatch(/always check labels yourself as well/i)
    expect(source).not.toContain("FUTURE_FOOD_SAFETY_COPY")
  })

  it("carries no legacy section names", () => {
    for (const legacy of ["Your Symptoms", "Your Gut History", "Your Goals", "Your Lifestyle"]) {
      expect(source, legacy).not.toContain(legacy)
    }
  })
})

/* ══ No duplicated bank ════════════════════════════════════════════════════ */

describe("the UI holds no copy of the question bank", () => {
  it("carries no question id, option value or question text of its own", () => {
    const q1 = findConsultationQuestion("core_signals_post_meal_pattern_v1")!
    for (const file of experienceSources()) {
      const source = read(file)
      expect(source, file).not.toMatch(/core_[a-z]+_[a-z_]+_v\d/)
      expect(source, file).not.toContain(q1.text)
      for (const option of q1.options!) {
        expect(source, `${file} hard-codes "${option.value}"`).not.toContain(`"${option.value}"`)
      }
    }
  })

  it("resolves wording through the canonical helpers", () => {
    const source = read(QUESTION)
    for (const helper of ["questionTextFor", "supportTextFor", "optionLabelFor"]) {
      expect(source, helper).toContain(helper)
    }
  })

  it("takes exclusivity from the bank rather than naming exclusive values", () => {
    const source = read(QUESTION)
    expect(source).toContain("toggleMultiValue")
    expect(source).not.toMatch(/"none"|"prefer-not-to-say"/)
  })
})

/* ══ Component boundaries ══════════════════════════════════════════════════ */

describe("the experience is a new component, not a mutated legacy one", () => {
  it("the legacy client is untouched by this phase", () => {
    const legacy = read(join(process.cwd(), "components/assessment/deep/deep-assessment-client.tsx"))
    // Still the AI path, still its own submit — Phase 3B changes neither.
    expect(legacy).toContain("generate-deep-questions")
    expect(legacy).toContain("submit-deep-assessment")
    expect(legacy).not.toContain("lib/consultation")
  })

  it("the new experience imports the canonical engine, not the legacy schema", () => {
    for (const file of experienceSources()) {
      const source = read(file)
      expect(source, file).not.toContain("lib/deep-assessment")
      expect(source, file).not.toContain("DeepQuestion")
    }
    expect(read(CLIENT)).toContain("@/lib/consultation/session")
  })

  it("every source file in the directory is accounted for", () => {
    const files = experienceSources().map((f) => f.split("/").pop())
    expect(files.sort()).toEqual([
      "consultation-orientation.tsx",
      "consultation-progress.tsx",
      "consultation-question.tsx",
      "deterministic-consultation-client.tsx",
    ])
    for (const f of [CLIENT, QUESTION, ORIENTATION, PROGRESS]) {
      expect(statSync(f).isFile()).toBe(true)
    }
  })
})
