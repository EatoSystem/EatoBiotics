/**
 * The guided question journey — Phase 2B.
 *
 * Source-level assertions rather than rendered DOM, because this repository has
 * no React testing library; same style and same reason as
 * checkout-acknowledgement.test.ts. Where behaviour can be proved by running
 * real code instead — the section transitions, which are derived from the
 * question data — it is, because that is stronger than reading markup.
 *
 * What the entry looked like before this phase, and what these rules exist to
 * stop coming back:
 *
 *   - answer options were plain <button>s: no group, no radio semantics, no
 *     exposed checked state
 *   - single-choice questions had NO Continue at all (it was rendered inside
 *     `{isMulti && …}`, under a comment claiming the opposite)
 *   - every selection fired setTimeout(onNext, 350) regardless of input method
 *     or prefers-reduced-motion
 *   - AssessmentProgress had no role and no aria-*
 *   - the section name was printed twice in one viewport
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { QUESTIONS } from "@/lib/assessment-data"
import { FAMILY_QUESTIONS } from "@/lib/family-assessment-data"
import { MIND_QUESTIONS } from "@/lib/mind-assessment-data"
import { BIOTICS, BIOTIC_INTRO, bioticOf, startsBiotic } from "@/lib/assessment/biotics"
import { copyOf } from "./helpers/marketing-language"

const QUESTION_VIEW_PATH = "components/assessment/assessment-question.tsx"
const VIEW = readFileSync(QUESTION_VIEW_PATH, "utf8")
const PROGRESS = readFileSync("components/assessment/assessment-progress.tsx", "utf8")
const CLIENT = readFileSync("components/assessment/assessment-client.tsx", "utf8")

/* Comment-stripped, for the two rules that forbid a construct BY NAME.
   Both files document what was removed and why — the timer, the
   abandonment event — so a rule run against raw source fires on the
   explanation of the very thing it is banning. The rule should read the
   code; the commentary is not the code. (copyOf leaves bare `setTimeout(`
   alone: it only strips `.method(` forms.) */
const VIEW_CODE = copyOf(VIEW)
const CLIENT_CODE = copyOf(CLIENT)

/* ── §2 Three transitions, derived from the data ────────────────────────── */

describe("the Assessment opens each Biotic exactly once", () => {
  it("starts a section at q1, q7 and q10 and nowhere else", () => {
    const starts = QUESTIONS.map((q, i) => [q.id, startsBiotic(QUESTIONS, i)] as const).filter(
      ([, biotic]) => biotic !== null,
    )
    expect(starts).toEqual([
      ["q1", "Prebiotics"],
      ["q7", "Probiotics"],
      ["q10", "Postbiotics"],
    ])
  })

  it("assigns every question to exactly one Biotic", () => {
    // A question with no Biotic would sit in a section the progress row cannot
    // name; two adjacent Biotics would produce a fourth transition.
    expect(QUESTIONS.map((q) => bioticOf(q.sectionTitle))).toEqual([
      ...Array(6).fill("Prebiotics"),
      ...Array(3).fill("Probiotics"),
      ...Array(6).fill("Postbiotics"),
    ])
  })

  it("adds no screen of its own", () => {
    // The beat renders above the question in the same view. A separate
    // acknowledge-and-continue step would show up as another view state here.
    expect(CLIENT).not.toMatch(/view:\s*"section/)
    expect(CLIENT).not.toMatch(/sectionIntro|showSectionIntro|interstitial/i)
    // currentIndex still counts questions, not screens.
    expect(CLIENT).toMatch(/currentIndex:\s*s\.currentIndex \+ 1/)
  })

  it("uses the canonical Biotic names", () => {
    expect([...BIOTICS]).toEqual(["Prebiotics", "Probiotics", "Postbiotics"])
  })
})

/* ── §3 The scientific boundary ─────────────────────────────────────────── */

describe("the section copy claims no measurement", () => {
  const FORBIDDEN =
    /metabolite|postbiotic compound|microbial product|microbial abundance|SCFA|short-chain|biomarker|clinical|diagnos|disease|biological recovery/i

  for (const [biotic, copy] of Object.entries(BIOTIC_INTRO)) {
    it(`${biotic} describes reported patterns, not laboratory findings`, () => {
      expect(copy, copy).not.toMatch(FORBIDDEN)
    })
  }

  it("keeps Postbiotics anchored to what was reported", () => {
    // The Assessment reads fifteen self-reported answers. This is the line
    // that would be easiest to overstate.
    expect(BIOTIC_INTRO.Postbiotics).toMatch(/appears to respond/i)
    expect(BIOTIC_INTRO.Postbiotics).toMatch(/you report/i)
  })
})

/* ── §5–§6 Progress ─────────────────────────────────────────────────────── */

describe("progress says where you are, and exposes it", () => {
  it("counts questions rather than showing a completion percentage", () => {
    expect(PROGRESS).toMatch(/Question \{position\}/)
    expect(PROGRESS, "a rounded % says what the bar already says").not.toMatch(
      /Math\.round\(pct\)/,
    )
  })

  it("is a real progressbar", () => {
    expect(PROGRESS).toMatch(/role="progressbar"/)
    expect(PROGRESS).toMatch(/aria-valuemin=/)
    expect(PROGRESS).toMatch(/aria-valuemax=\{total\}/)
    expect(PROGRESS).toMatch(/aria-valuenow=\{position\}/)
    expect(PROGRESS).toMatch(/aria-valuetext=\{`Question \$\{position\} of \$\{total\} — \$\{label\}`\}/)
  })

  it("does not announce its decoration twice", () => {
    // The bar and the colour dot restate the value; neither is focusable.
    expect((PROGRESS.match(/aria-hidden/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(PROGRESS).not.toMatch(/tabIndex/)
  })
})

/* ── §7 Answer semantics ────────────────────────────────────────────────── */

describe("answers are a group, not a row of buttons", () => {
  it("wraps the options in a labelled fieldset", () => {
    expect(VIEW).toMatch(/<fieldset/)
    expect(VIEW).toMatch(/<legend className="sr-only">/)
  })

  it("uses a native radio per option for single-choice", () => {
    expect(VIEW).toMatch(/type=\{isMulti \? "checkbox" : "radio"\}/)
    expect(VIEW).toMatch(/checked=\{isSelected\}/)
    expect(VIEW, "options must share a group name").toMatch(/name=\{isMulti \?/)
  })

  it("associates each option's description with its control", () => {
    expect(VIEW).toMatch(/aria-describedby=\{descId\}/)
  })

  it("never presents a multi-select as a radio group", () => {
    // No multi question ships today — all 15 gut questions, and every Family
    // and Mind question, are type "single". The branch is kept correct so it
    // cannot be wrong the day one is added.
    expect(QUESTIONS.every((q) => q.type === "single")).toBe(true)
    const multiIndex = VIEW.indexOf('isMulti ? "checkbox" : "radio"')
    expect(multiIndex, "the checkbox branch must exist").toBeGreaterThan(-1)
  })
})

/* ── §8–§10 Moving forward ──────────────────────────────────────────────── */

describe("the customer decides when to move on", () => {
  it("renders Continue for every question type", () => {
    // It used to live inside `{isMulti && …}`, so single-choice — which is
    // every question that ships — had no explicit way forward at all.
    expect(VIEW).not.toMatch(/\{isMulti && \(\s*<button/)
    expect(VIEW).toMatch(/disabled=\{!canNext\}/)
  })

  it("keeps Continue inert until an answer exists", () => {
    expect(VIEW).toMatch(/canNext\s*\?\s*"brand-gradient/)
    expect(VIEW).toMatch(/cursor-not-allowed/)
  })

  it("keeps Back available", () => {
    expect(VIEW).toMatch(/onClick=\{onBack\}/)
  })

  it("never navigates on a timer", () => {
    // With native radios, arrow keys move AND select — a timed advance would
    // fire once per option while someone was still reading them.
    expect(VIEW_CODE).not.toMatch(/setTimeout/)
  })

  it("offers one primary action, not two competing ones", () => {
    expect((VIEW.match(/brand-gradient/g) ?? []).length).toBe(1)
  })
})

/* ── §11–§12 Motion and focus ───────────────────────────────────────────── */

describe("motion is optional and the change is announced", () => {
  it("honours prefers-reduced-motion", () => {
    expect(VIEW).toMatch(/prefers-reduced-motion: reduce/)
    expect(VIEW).toMatch(/animate && "animate-in fade-in/)
  })

  it("moves focus to the question when the question changes", () => {
    expect(VIEW).toMatch(/tabIndex=\{-1\}/)
    expect(VIEW).toMatch(/headingRef\.current\?\.focus\(\)/)
    expect(VIEW).toMatch(/\}, \[question\.id\]\)/)
  })

  it("announces the position once, not through a competing live region", () => {
    expect(VIEW).toMatch(/Question \{position\} of \{total\}/)
    expect(VIEW, "one announcement path, not two").not.toMatch(/aria-live/)
  })
})

/* ── §16 No diagnosis while answering ───────────────────────────────────── */

describe("nothing is interpreted before it is calculated", () => {
  it("shows no score, prediction or per-answer feedback", () => {
    for (const rule of [
      /Great answer/i,
      /you'?re doing well/i,
      /your score so far/i,
      /predicted/i,
      /estimated score/i,
      /this will improve your score/i,
    ]) {
      expect(VIEW, String(rule)).not.toMatch(rule)
    }
  })
})

/* ── The other two journeys ─────────────────────────────────────────────── */

describe("Mind and Family are untouched by the Biotics beat", () => {
  it("has no Biotic section to open", () => {
    // The beat is driven by the data, not by a prop the You client passes, so
    // it cannot appear here by accident — and cannot be lost by forgetting a
    // flag either.
    expect(FAMILY_QUESTIONS.map((q) => bioticOf(q.sectionTitle)).filter(Boolean)).toEqual([])
    expect(MIND_QUESTIONS.map((q) => bioticOf(q.sectionTitle)).filter(Boolean)).toEqual([])
  })

  it("keeps its own section overline", () => {
    // The `biotic ? … : …` branch is what preserves their existing layout.
    expect(VIEW).toMatch(/\{biotic \?/)
    expect(VIEW).toMatch(/\{question\.sectionTitle\}/)
  })
})

/* ── §19 Analytics ──────────────────────────────────────────────────────── */

describe("journey position is measured, health data is not", () => {
  it("reports the index and the Biotic only", () => {
    expect(CLIENT).toMatch(/assessment_question_viewed/)
    expect(CLIENT).toMatch(/assessment_section_entered/)
    const block = CLIENT.slice(
      CLIENT.indexOf("assessment_section_entered") - 400,
      CLIENT.indexOf("assessment_question_viewed") + 400,
    )
    for (const leak of ["answers", "value", "score", "subScores"]) {
      expect(block, `analytics must not carry ${leak}`).not.toMatch(
        new RegExp(`${leak}\\s*[,:]`),
      )
    }
  })

  it("adds no abandonment event on a fragile browser signal", () => {
    expect(CLIENT_CODE).not.toMatch(/beforeunload|pagehide|assessment_abandoned/)
  })
})
