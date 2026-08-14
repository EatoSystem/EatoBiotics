import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

import {
  readQuestionSnapshot,
  PROMPT_QUESTION_FIELDS,
} from "@/lib/assessment/question-snapshot"
import { FALLBACK_DEEP_QUESTIONS, type DeepQuestion } from "@/lib/deep-assessment"

/**
 * The persisted question snapshot.
 *
 * #223 asked whether this set needs a version handle or a content hash. It does
 * not — Claude generates the core set per session and it is frozen in
 * `deep_assessments.questions`, so there is no bank for it to drift against.
 * What it needs is to exist and to survive, which is what these tests pin.
 *
 * `readQuestionSnapshot` is the reuse-vs-regenerate decision. Getting it wrong
 * in the permissive direction hands the customer a quietly-altered
 * questionnaire; getting it wrong in the strict direction regenerates over a
 * live one. Both are worse than refusing.
 */

const valid = (over: Partial<DeepQuestion> = {}): DeepQuestion =>
  ({
    id: "dq1",
    type: "single",
    pillar: "prebiotics",
    text: "How many different plants did you eat last week?",
    required: true,
    ...over,
  }) as DeepQuestion

describe("readQuestionSnapshot: what counts as a usable snapshot", () => {
  it("accepts a real generated set", () => {
    expect(readQuestionSnapshot(FALLBACK_DEEP_QUESTIONS)).toEqual(FALLBACK_DEEP_QUESTIONS)
  })

  it.each([
    ["undefined", undefined],
    ["null", null],
    ["an empty array", []],
    ["not an array", { dq1: "x" }],
    ["a JSON string", JSON.stringify(FALLBACK_DEEP_QUESTIONS)],
    ["a number", 7],
  ])("refuses %s", (_label, persisted) => {
    expect(readQuestionSnapshot(persisted)).toBeNull()
  })

  it.each([
    ["a missing id", { id: undefined }],
    ["a blank id", { id: "" }],
    ["a non-string id", { id: 4 }],
    ["missing text", { text: undefined }],
    ["blank text", { text: "" }],
    ["non-string text", { text: { en: "hi" } }],
    ["a missing type", { type: undefined }],
    ["a blank type", { type: "" }],
    ["a non-string type", { type: 3 }],
  ])("refuses a set whose only element has %s", (_label, over) => {
    expect(readQuestionSnapshot([valid(over as Partial<DeepQuestion>)])).toBeNull()
  })

  it.each([[null], [undefined], ["dq2"], [42]])(
    "refuses a set containing the non-object element %p",
    (element) => {
      expect(readQuestionSnapshot([valid(), element])).toBeNull()
    },
  )

  /**
   * The central rule. Filtering the bad element out would be a silent repair:
   * the customer would answer a questionnaire shorter than the stored one,
   * while the survivors kept ids that no longer describe the set.
   */
  it("one malformed element invalidates the whole snapshot — no filtering", () => {
    const mostlyGood = [...FALLBACK_DEEP_QUESTIONS, { id: "dq99", text: "no type" }]
    expect(readQuestionSnapshot(mostlyGood)).toBeNull()
  })

  it("accepts a type this build does not know, rather than reinterpreting it", () => {
    // Rows written by earlier versions may carry types outside DeepQuestionType.
    // Narrowing here would regenerate over a snapshot that renders perfectly.
    const legacy = [valid({ type: "rank" as DeepQuestion["type"] })]
    expect(readQuestionSnapshot(legacy)).toEqual(legacy)
  })
})

describe("a valid snapshot survives verbatim", () => {
  const stored = [
    valid({
      id: "dq1",
      text: "ORIGINAL WORDING — must not be rewritten",
      options: [
        { label: "Original label", value: "original_value" },
        { label: "Second", value: "second" },
      ],
      eduContext: "An original explanation.",
    }),
    valid({ id: "dq2", type: "slider", text: "Second question", min: 1, max: 10 }),
  ]

  it("returns the same objects, in the same order, unmodified", () => {
    const out = readQuestionSnapshot(stored)!
    expect(out).not.toBeNull()
    expect(out).toBe(stored)
    expect(out.map((q) => q.id)).toEqual(["dq1", "dq2"])
    expect(out[0].text).toBe("ORIGINAL WORDING — must not be rewritten")
  })

  it("keeps fields nothing downstream reads — options, eduContext, slider bounds", () => {
    // The questionnaire still renders these even though report generation does
    // not consume them, so "unused downstream" is not licence to drop them.
    const out = readQuestionSnapshot(stored)!
    expect(out[0].options).toEqual([
      { label: "Original label", value: "original_value" },
      { label: "Second", value: "second" },
    ])
    expect(out[0].eduContext).toBe("An original explanation.")
    expect(out[1].min).toBe(1)
    expect(out[1].max).toBe(10)
  })

  it("does not clone, so no field can be lost in translation", () => {
    const out = readQuestionSnapshot(stored)!
    expect(JSON.stringify(out)).toBe(JSON.stringify(stored))
  })
})

/**
 * The downstream contract.
 *
 * #223's conclusion rests on a fact about the code: report generation reads
 * only `id`, `text` and `type` off a persisted question, so there is nothing
 * mutable for a version handle to protect. That is an assumption about two
 * functions, and assumptions rot. This guard fails the build if either starts
 * consuming `options` — or `pillar`, `section`, `min`, `eduContext`, anything
 * else — so widening the contract has to be a decision rather than a drift.
 *
 * If this goes red: the versioning question is what has been reopened. Widen
 * PROMPT_QUESTION_FIELDS deliberately, do not relax the test.
 */
describe("report generation consumes only id, text and type", () => {
  /** The body of `name`, by brace matching from its declaration. */
  function functionBody(source: string, name: string): string {
    const start = source.indexOf(`function ${name}(`)
    expect(start, `${name} not found — did it move or get renamed?`).toBeGreaterThan(-1)
    let depth = 0
    let seenOpen = false
    for (let i = source.indexOf("{", start); i < source.length; i++) {
      if (source[i] === "{") {
        depth++
        seenOpen = true
      } else if (source[i] === "}") {
        depth--
        if (seenOpen && depth === 0) return source.slice(start, i + 1)
      }
    }
    throw new Error(`unbalanced braces reading ${name}`)
  }

  /** Every field read off a question-shaped identifier in `body`. */
  function questionFieldReads(body: string): string[] {
    const reads = [...body.matchAll(/\b(?:q|question)\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1])
    return [...new Set(reads)].sort()
  }

  const CONSUMERS: Array<{ file: string; fns: string[] }> = [
    // The Claude prompt: prints q.text, switches on q.type, keys answers by q.id.
    { file: "app/api/submit-deep-assessment/route.ts", fns: ["formatAnswer", "buildQABlock"] },
    // The deterministic report that ships whenever Claude is unavailable.
    { file: "lib/fallback-paid-report.ts", fns: ["formatAnswer", "findAnswerText"] },
  ]

  it.each(CONSUMERS.flatMap(({ file, fns }) => fns.map((fn) => [file, fn] as const)))(
    "%s :: %s reads no field outside the contract",
    (file, fn) => {
      const body = functionBody(readFileSync(file, "utf8"), fn)
      const outside = questionFieldReads(body).filter(
        (f) => !(PROMPT_QUESTION_FIELDS as readonly string[]).includes(f),
      )
      expect(
        outside,
        `${fn} in ${file} now reads ${outside.join(", ")} off a persisted question. ` +
          `That is outside PROMPT_QUESTION_FIELDS and reopens #223's decision not to ` +
          `version the question set — widen the contract deliberately.`,
      ).toEqual([])
    },
  )

  it("each contract field is actually used, so the list cannot rot wide", () => {
    const all = CONSUMERS.flatMap(({ file, fns }) => {
      const src = readFileSync(file, "utf8")
      return fns.flatMap((fn) => questionFieldReads(functionBody(src, fn)))
    })
    for (const field of PROMPT_QUESTION_FIELDS) {
      expect(all, `${field} is in the contract but nothing reads it`).toContain(field)
    }
  })

  it("the guard detects a q.options read", () => {
    // Proves the matcher above bites, without waiting for a real regression.
    const sabotaged = `function buildQABlock(qs) { return qs.map((q) => q.options[0].label) }`
    expect(questionFieldReads(functionBody(sabotaged, "buildQABlock"))).toContain("options")
  })
})
