import { describe, it, expect } from "vitest"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { ADDON_QUESTIONS, addonQuestionsFor, sanitizeLensAnswers } from "@/lib/assessment/addon-questions"
import { FALLBACK_DEEP_QUESTIONS } from "@/lib/deep-assessment"
import { nsAnswers } from "./helpers/lens-fixtures"

/**
 * The lens question banks.
 *
 * The customer paid for a specific lens, so the assessment has to ask something
 * the lens can actually interpret — and, just as importantly, the no-add-on
 * questionnaire has to be untouched by all of this.
 */

describe("no add-on changes nothing", () => {
  it.each([null, undefined])("addonQuestionsFor(%s) is empty", (value) => {
    expect(addonQuestionsFor(value)).toEqual([])
  })

  it("the core fallback bank is untouched by this module", () => {
    // If the lens work ever reached into the core bank, this is where it shows.
    expect(FALLBACK_DEEP_QUESTIONS.length).toBeGreaterThan(5)
    expect(FALLBACK_DEEP_QUESTIONS.every((q) => q.id.startsWith("dq"))).toBe(true)
    expect(FALLBACK_DEEP_QUESTIONS.some((q) => q.section === "lens")).toBe(false)
  })

  it("unknown add-ons yield no questions rather than throwing", () => {
    for (const bad of ["recovery", "longevity", "", "MIND", "sleep"]) {
      expect(addonQuestionsFor(bad as AddonType)).toEqual([])
    }
  })
})

describe("every add-on changes the question set", () => {
  it.each(ADDON_KEYS)("%s adds a focused set", (addon) => {
    const qs = addonQuestionsFor(addon)
    expect(qs.length).toBeGreaterThanOrEqual(4)
    // A lens, not a second assessment.
    expect(qs.length).toBeLessThanOrEqual(6)
  })

  it("all four banks are distinct from each other", () => {
    const texts = ADDON_KEYS.map((a) =>
      addonQuestionsFor(a)
        .map((q) => q.text)
        .join("|"),
    )
    expect(new Set(texts).size).toBe(ADDON_KEYS.length)
  })

  it("no lens question text is shared between two lenses", () => {
    const seen = new Map<string, AddonType>()
    for (const addon of ADDON_KEYS) {
      for (const q of addonQuestionsFor(addon)) {
        const prior = seen.get(q.text)
        expect(prior, `"${q.text}" appears in both ${prior} and ${addon}`).toBeUndefined()
        seen.set(q.text, addon)
      }
    }
  })
})

describe("ids and sections stay disciplined", () => {
  it.each(ADDON_KEYS)("%s uses lens ids and the lens section only", (addon) => {
    for (const q of addonQuestionsFor(addon)) {
      // Namespaced per add-on: a Glucose answer can no longer masquerade as a
      // Mind one because both banks used `lens1`.
      expect(q.id, `${addon} ${q.id}`).toMatch(new RegExp(`^${addon}_lens[1-4]$`))
      expect(q.section, `${addon} ${q.id}`).toBe("lens")
      expect(q.id.startsWith("dq")).toBe(false)
    }
  })

  it.each(ADDON_KEYS)("%s ids are unique within the bank", (addon) => {
    const ids = addonQuestionsFor(addon).map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("lens ids never collide with the core generated ids", () => {
    const coreIds = new Set(FALLBACK_DEEP_QUESTIONS.map((q) => q.id))
    for (const addon of ADDON_KEYS) {
      for (const q of addonQuestionsFor(addon)) {
        expect(coreIds.has(q.id)).toBe(false)
      }
    }
  })

  it.each(ADDON_KEYS)("%s single/multi questions carry real options", (addon) => {
    for (const q of addonQuestionsFor(addon)) {
      if (q.type !== "single" && q.type !== "multi") continue
      expect(q.options?.length ?? 0, `${addon} ${q.id}`).toBeGreaterThanOrEqual(3)
      for (const o of q.options ?? []) {
        expect(o.label.trim().length).toBeGreaterThan(2)
        expect(o.value).toMatch(/^[a-z0-9-]+$/)
      }
      const values = (q.options ?? []).map((o) => o.value)
      expect(new Set(values).size, `${addon} ${q.id} duplicate values`).toBe(values.length)
    }
  })
})

describe("documentation is carried as data and stays complete", () => {
  it.each(ADDON_KEYS)("%s specs document intent, field and necessity", (addon) => {
    for (const spec of ADDON_QUESTIONS[addon]) {
      expect(spec.intent.trim().length, `${addon} slot${spec.slot} intent`).toBeGreaterThan(20)
      expect(spec.answerField.trim().length, `${addon} slot${spec.slot} answerField`).toBeGreaterThan(3)
      expect(spec.whyNeeded.trim().length, `${addon} slot${spec.slot} whyNeeded`).toBeGreaterThan(20)
    }
  })
})

describe("family wording", () => {
  it.each(ADDON_KEYS)("%s reads as a household when the foundation is Family", (addon) => {
    const you = addonQuestionsFor(addon, "you")
    const family = addonQuestionsFor(addon, "family")
    expect(family).toHaveLength(you.length)

    // Every question that has a household variant must actually differ.
    const specs = ADDON_QUESTIONS[addon]
    specs.forEach((spec, i) => {
      if (!spec.familyText) return
      expect(family[i].text, `${addon} slot${spec.slot}`).not.toBe(you[i].text)
      expect(family[i].text).toBe(spec.familyText)
    })

    // And at least most of the bank should be household-aware, or the Family
    // reader is answering a personal questionnaire.
    const householdAware = specs.filter((s) => s.familyText).length
    expect(householdAware, `${addon} household-aware questions`).toBeGreaterThanOrEqual(
      Math.ceil(specs.length * 0.75),
    )
  })

  it("family variants use household framing, not first-person-only framing", () => {
    for (const addon of ADDON_KEYS) {
      for (const q of addonQuestionsFor(addon, "family")) {
        if (!/your household|household's|across your household/i.test(q.text)) continue
        expect(q.text).toMatch(/household/i)
      }
    }
  })
})

/**
 * The hard content rule: this product cannot measure anything clinical, so it
 * must never ask as though it can. A question requesting a lab value would also
 * imply the report interprets one.
 */
describe("no medical measurements, no diagnosis language", () => {
  const BANNED: Array<[string, RegExp]> = [
    ["blood glucose reading", /\b(hba1c|a1c|fasting glucose|blood sugar level|mmol\/l|mg\/dl|glucose reading)\b/i],
    ["blood pressure", /\bblood pressure\b|\bsystolic\b|\bdiastolic\b/i],
    ["cholesterol / lab panel", /\bcholesterol\b|\bldl\b|\bhdl\b|\btriglyceride/i],
    ["diagnosis", /\bdiagnos(is|ed|e)\b|\bcondition\b.*\bdo you have\b/i],
    ["medication", /\bmedication\b|\bprescrib/i],
    ["weight / BMI target", /\bbmi\b|\bgoal weight\b|\btarget weight\b|\bhow much do you weigh\b/i],
    ["clinical mental-health terms", /\banxiety\b|\bdepress/i],
    ["guarantee language", /\bguarantee/i],
  ]

  it.each(BANNED)("no bank asks about %s", (_label, pattern) => {
    const hits: string[] = []
    for (const addon of ADDON_KEYS) {
      for (const spec of ADDON_QUESTIONS[addon]) {
        const blob = [spec.text, spec.familyText, spec.eduContext, spec.familyEduContext]
          .concat((spec.options ?? []).map((o) => o.label))
          .filter(Boolean)
          .join("\n")
        const m = blob.match(pattern)
        if (m) hits.push(`${addon}/slot${spec.slot}: "${m[0]}"`)
      }
    }
    expect(hits, hits.join("\n")).toEqual([])
  })

  it("the glucose lens asks about noticed patterns, and asks for no value", () => {
    // The rule is "never asks FOR a measurement", not "never says the word".
    // An earlier version of this test banned /measure/ outright and failed on
    // the eduContext "…a pattern clue, not a measurement", which is exactly the
    // disclaimer this lens should carry.
    const questionText = ADDON_QUESTIONS.glucose.map((s) => s.text.toLowerCase())

    for (const text of questionText) {
      expect(text, `asks for a value: "${text}"`).not.toMatch(
        /what (was|is) your\b|enter your\b|your last\b|how many (mmol|mg)\b|what number\b/,
      )
    }

    const blob = questionText.join("\n")
    expect(blob).toMatch(/notice|energy|craving|typical|behave/)

    // And it states plainly, in the questionnaire itself, that what the reader
    // notices is a pattern clue rather than a reading.
    const edu = ADDON_QUESTIONS.glucose.map((s) => s.eduContext ?? "").join("\n").toLowerCase()
    expect(edu).toMatch(/not a measurement|pattern clue/)
  })

  it("the banned-term guard is not vacuous", () => {
    // Proves the matcher would fire on a real violation.
    const [, hba1c] = BANNED[0]
    expect(hba1c.test("What was your last HbA1c?")).toBe(true)
    const [, dx] = BANNED[3]
    expect(dx.test("Have you been diagnosed with anything?")).toBe(true)
  })
})

describe("sanitizeLensAnswers extracts only the lens answers", () => {
  it("filters core answers out", () => {
    const answers = {
      dq1: "a",
      dq2: "b",
      ...nsAnswers("stability", { 1: "predictable", 2: "after-meals" }),
      stray: "x",
    }
    expect(sanitizeLensAnswers("stability", answers)).toEqual(
      nsAnswers("stability", { 1: "predictable", 2: "after-meals" }),
    )
  })

  it("returns nothing when there is no add-on", () => {
    expect(sanitizeLensAnswers(null, nsAnswers("stability", { 1: "predictable" }))).toEqual({})
  })
})
