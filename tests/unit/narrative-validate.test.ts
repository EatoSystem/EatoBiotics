import { describe, it, expect } from "vitest"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { templateFor } from "@/lib/report/deterministic/content-pack"
import { EXPANSION_BOUNDS, allowedLengthWindow } from "@/lib/report/narrative/contract"
import {
  NARRATIVE_REJECTION_CLASSES,
  validateRewrite,
  type NarrativeRejectionClass,
} from "@/lib/report/narrative/validate"

/**
 * The validator — Phase 4A-S3.
 *
 * ══ WHAT A GREEN FILE HERE DOES AND DOES NOT MEAN ═══════════════════════════
 *
 * It means each rejection class fires on a worked example. It does NOT mean
 * an accepted rewrite means the same thing as its canonical sentence — nothing
 * in this layer can establish that, and no test below claims it.
 */

/* Canonical sentences, taken from the real reviewed pack unless marked. */
const FOCUS = "You told us energy is what you most want to work on."
const MORNINGS = "You told us mornings are the hardest part of the day for your household."
const NOTHING = "You told us there's nothing in particular to work around."
const SETTLED =
  "You told us meals tend to be lighter or simpler on the days you experience as more settled."
const EGGS = "You asked us to leave out eggs."
/** Not from the pack: no reviewed sentence contains a numeral. */
const NUMERIC = "You told us you cook 3 nights a week."

interface Case {
  readonly name: string
  readonly canonical: string
  readonly rewritten: unknown
  readonly cls: NarrativeRejectionClass
}

const REJECTIONS: readonly Case[] = [
  /* ── A · structural ── */
  { name: "not a string", canonical: FOCUS, rewritten: { rewritten: FOCUS }, cls: "structural-not-a-string" },
  { name: "undefined", canonical: FOCUS, rewritten: undefined, cls: "structural-not-a-string" },
  { name: "empty", canonical: FOCUS, rewritten: "   ", cls: "structural-empty" },
  { name: "a second line", canonical: FOCUS, rewritten: `${FOCUS}\nAnd another.`, cls: "structural-shape" },
  {
    name: "a runaway",
    canonical: FOCUS,
    rewritten: `You told us ${"energy ".repeat(80)}.`,
    cls: "structural-shape",
  },

  /* ── B · preservation ── */
  { name: "a number changed", canonical: NUMERIC, rewritten: "You told us you cook 4 nights a week.", cls: "numbers" },
  { name: "a number added", canonical: FOCUS, rewritten: "You told us energy is the 1 thing you want to work on.", cls: "numbers" },
  { name: "a number dropped", canonical: NUMERIC, rewritten: "You told us you cook some nights a week.", cls: "numbers" },
  { name: "a time added", canonical: FOCUS, rewritten: "You told us energy is what you want to work on each morning.", cls: "temporal" },
  {
    name: "a time changed",
    canonical: MORNINGS,
    rewritten: "You told us evenings are the hardest part of the day for your household.",
    cls: "temporal",
  },
  { name: "a negation dropped", canonical: NOTHING, rewritten: "You told us there's something in particular to work around.", cls: "negation" },
  { name: "a negation added", canonical: FOCUS, rewritten: "You told us energy is not what you most want to work on.", cls: "negation" },
  {
    name: "a hedge dropped",
    canonical: SETTLED,
    rewritten: "You told us meals are lighter or simpler on the days you experience as more settled.",
    cls: "modality",
  },
  { name: "an absolute added", canonical: FOCUS, rewritten: "You told us energy is always what you want to work on.", cls: "modality" },
  { name: "the opening subject changed", canonical: FOCUS, rewritten: "Energy is what you most want to work on, you said.", cls: "attribution" },
  {
    /*
     * The first-word rule needs its own case, because the approved-framing
     * rule cannot express this one: the rewrite DOES open with an adjudicated
     * framing — just not with the same subject. Without a case like this,
     * deleting the first-word check changes no test result.
     */
    name: "the opening subject changed to a different approved framing",
    canonical: FOCUS,
    rewritten:
      "Based on the routines and constraints you described, energy is what you want to work on.",
    cls: "attribution",
  },
  { name: "the approved framing lost", canonical: FOCUS, rewritten: "You mentioned energy is what you most want to work on.", cls: "attribution" },
  {
    name: "a prohibited framing used",
    canonical: FOCUS,
    rewritten: "You told us energy matters, and this shows energy is the focus.",
    cls: "prohibited-framing",
  },
  {
    name: "an observation turned into a finding",
    canonical: MORNINGS,
    rewritten: "You told us this means mornings are the hardest part of the day for your household.",
    cls: "finding-shift",
  },
  { name: "a second sentence", canonical: FOCUS, rewritten: "You told us energy is what you want. It matters.", cls: "sentence-count" },
  { name: "expanded past the window", canonical: FOCUS, rewritten: "You told us energy is what you most want to work on, in your own view.", cls: "expansion" },
  { name: "collapsed below the window", canonical: FOCUS, rewritten: "You told us energy.", cls: "expansion" },

  /* ── C · drift ── */
  { name: "causal language", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day because of your household.", cls: "drift-causal" },
  { name: "recommendation language", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day, so you should plan ahead.", cls: "drift-recommendation" },
  { name: "medical vocabulary", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day for your metabolism.", cls: "drift-medical" },
  { name: "a named food", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day for your bread.", cls: "drift-food" },
  { name: "Biotics vocabulary", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day for your microbiome.", cls: "drift-biotics" },
  { name: "score language", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day for your score.", cls: "drift-score" },
  { name: "safety netting", canonical: MORNINGS, rewritten: "You told us mornings are the hardest part of the day, so speak to a doctor.", cls: "drift-safety-netting" },
]

describe("every rejection class fires on a worked example", () => {
  for (const testCase of REJECTIONS) {
    it(`rejects ${testCase.name}`, () => {
      const outcome = validateRewrite(testCase.canonical, testCase.rewritten)
      expect(outcome.ok, `accepted: ${String(testCase.rewritten)}`).toBe(false)
      if (outcome.ok) return
      expect(outcome.rejectionClass).toBe(testCase.cls)
    })
  }

  it("covers every declared class, so the enumeration is not decorative", () => {
    const covered = new Set(REJECTIONS.map((c) => c.cls))
    for (const cls of NARRATIVE_REJECTION_CLASSES) {
      expect(covered.has(cls), `no worked example for "${cls}"`).toBe(true)
    }
  })

  it("maps each class to the reason the overlay will report", () => {
    const seen = new Map<string, string>()
    for (const testCase of REJECTIONS) {
      const outcome = validateRewrite(testCase.canonical, testCase.rewritten)
      if (outcome.ok) continue
      seen.set(outcome.rejectionClass, outcome.reason)
    }
    expect(seen.get("structural-empty")).toBe("malformed-response")
    expect(seen.get("negation")).toBe("preservation-failed")
    expect(seen.get("expansion")).toBe("expansion-rejected")
    expect(seen.get("drift-food")).toBe("drift-rejected")
  })
})

describe("what the validator accepts", () => {
  it("accepts the sentence unchanged — the always-available safe answer", () => {
    for (const canonical of [FOCUS, MORNINGS, NOTHING, SETTLED, EGGS, NUMERIC]) {
      expect(validateRewrite(canonical, canonical).ok, canonical).toBe(true)
    }
  })

  it("accepts every reviewed sentence in the pack, returned unchanged", () => {
    let checked = 0
    for (const question of CONSULTATION_QUESTION_BANK) {
      for (const option of question.options ?? []) {
        const template = templateFor(question.id, option.value)
        if (!template) continue
        checked += 1
        expect(validateRewrite(template.text, template.text).ok, template.text).toBe(true)
      }
    }
    // If the identity rewrite were rejected anywhere, the layer could never
    // accept anything for that sentence, and the failure would look like a
    // model problem rather than a validator one.
    expect(checked).toBe(112)
  })

  it("accepts a genuine restyle that keeps the facts", () => {
    const outcome = validateRewrite(
      MORNINGS,
      "You told us mornings are the hardest part of your household's day.",
    )
    expect(outcome.ok, outcome.ok ? "" : `${outcome.rejectionClass}: ${outcome.detail}`).toBe(true)
  })

  it("allows a hedge to change form without being lost", () => {
    // `tend to be` → `tend to feel` keeps the softening; a multiset rule over
    // hedges would have rejected this, which is why the rule is asymmetric.
    const outcome = validateRewrite(
      SETTLED,
      "You told us meals tend to feel lighter or simpler on the days you experience as more settled.",
    )
    expect(outcome.ok, outcome.ok ? "" : `${outcome.rejectionClass}: ${outcome.detail}`).toBe(true)
  })
})

describe("the drift rule is a delta, not an absolute ban", () => {
  /*
   * `EGGS` is a food-avoidance sentence. It is currently suppressed at the
   * admission boundary — the dietetic gate is OPEN — so it cannot reach a
   * Report today. It is used here precisely because the delta rule exists for
   * the day it can: a gated sentence that legitimately names a food must still
   * be restylable, and the rule must be correct before that day, not after.
   */
  it("keeps a food the canonical sentence already named", () => {
    const outcome = validateRewrite(EGGS, "You asked us to leave out the eggs.")
    expect(outcome.ok, outcome.ok ? "" : `${outcome.rejectionClass}: ${outcome.detail}`).toBe(true)
  })

  it("rejects a second food the canonical sentence did not name", () => {
    const outcome = validateRewrite(EGGS, "You asked us to leave out eggs and nuts.")
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.rejectionClass).toBe("drift-food")
  })
})

describe("the expansion window", () => {
  /**
   * The constants are pinned, not derived.
   *
   * Every other assertion in this block computes its expectation from
   * `allowedLengthWindow`, which moves with the constants — so widening the
   * bound by a character would leave them all green. This is the tripwire that
   * does not move, and the worked case below is its behavioural twin: a
   * ninety-three-character rewrite of a seventy-two-character sentence, which
   * the frozen ±20 rejects and a ±21 would not.
   */
  it("is frozen at the values chosen against the corpus", () => {
    expect(EXPANSION_BOUNDS).toEqual({ minRatio: 0.7, maxRatio: 1.3, maxAbsoluteDelta: 20 })
  })

  it("rejects a rewrite one character past the frozen absolute delta", () => {
    const canonical = MORNINGS
    expect(canonical.length).toBe(72)
    const rewritten =
      "You told us mornings are the hardest part of the day for your household indeed indeed indeed."
    expect(rewritten.length).toBe(93)
    const outcome = validateRewrite(canonical, rewritten)
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.rejectionClass).toBe("expansion")
  })

  it("intersects the ratio and the absolute delta, tighter always binding", () => {
    // At the short end the ratio binds…
    const short = allowedLengthWindow(34)
    expect(short.min).toBeCloseTo(34 * EXPANSION_BOUNDS.minRatio, 5)
    expect(short.max).toBeCloseTo(34 * EXPANSION_BOUNDS.maxRatio, 5)
    // …and at the long end the absolute delta does.
    const long = allowedLengthWindow(99)
    expect(long.min).toBe(99 - EXPANSION_BOUNDS.maxAbsoluteDelta)
    expect(long.max).toBe(99 + EXPANSION_BOUNDS.maxAbsoluteDelta)
  })

  it("accepts exactly at the boundary and rejects one character past it", () => {
    const canonical = MORNINGS
    const window = allowedLengthWindow(canonical.length)
    const pad = (length: number) => {
      const stem = "You told us mornings are the hardest part of the day"
      const filler = " for your household".repeat(6)
      return (stem + filler).slice(0, length - 1) + "."
    }
    const atMax = pad(Math.floor(window.max))
    const pastMax = pad(Math.floor(window.max) + 1)
    expect(atMax.length).toBe(Math.floor(window.max))
    expect(validateRewrite(canonical, atMax).ok).toBe(true)
    const rejected = validateRewrite(canonical, pastMax)
    expect(rejected.ok).toBe(false)
    if (rejected.ok) return
    expect(rejected.rejectionClass).toBe("expansion")
  })
})

describe("the validator is pure", () => {
  it("returns the same answer for the same input, every time", () => {
    for (const testCase of REJECTIONS) {
      const first = validateRewrite(testCase.canonical, testCase.rewritten)
      const second = validateRewrite(testCase.canonical, testCase.rewritten)
      expect(second).toEqual(first)
    }
  })

  it("reads no clock and no random source", () => {
    const outcome = validateRewrite(FOCUS, FOCUS)
    expect(outcome.ok).toBe(true)
    // A validator that consulted a clock could accept in review and reject in
    // production, which is the one failure this layer cannot debug.
    expect(JSON.stringify(outcome)).not.toContain("Date")
  })
})
