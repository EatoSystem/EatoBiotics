import { describe, it, expect } from "vitest"
import {
  computeMindResult,
  computeMindPillarScores,
  MIND_PILLAR_ORDER,
  MIND_PROFESSIONAL_NOTE,
} from "@/lib/mind-assessment-scoring"
import { MIND_QUESTIONS } from "@/lib/mind-assessment-data"

function uniform(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) a[`q${i}`] = value
  return a
}

describe("mind native 5-subscore model", () => {
  it("computes the five mind pillars 0–100", () => {
    expect(MIND_PILLAR_ORDER).toEqual([
      "plantDiversity", "brainFuel", "liveFoods", "rhythm", "mindResponse",
    ])
    expect(computeMindPillarScores(uniform(3))).toEqual({
      plantDiversity: 100, brainFuel: 100, liveFoods: 100, rhythm: 100, mindResponse: 100,
    })
  })

  it("exposes the five pillars + secondary biotics as the result", () => {
    const r = computeMindResult(uniform(2))
    expect(r.insights).toHaveLength(5)
    expect(Object.keys(r.biotics).sort()).toEqual(["postbiotics", "prebiotics", "probiotics"])
  })

  it("surfaces the professional-help note when mental response is low, not when high", () => {
    expect(computeMindResult(uniform(0)).safetyNote).toBe(MIND_PROFESSIONAL_NOTE)
    expect(computeMindResult(uniform(3)).safetyNote).toBeUndefined()
  })
})

describe("mind language is non-diagnostic and hedged", () => {
  const allCopy = [
    ...MIND_QUESTIONS.map((q) => q.text),
    ...MIND_QUESTIONS.flatMap((q) => q.options.map((o) => `${o.label} ${o.description}`)),
    ...computeMindResult(uniform(1)).insights.flatMap((i) =>
      [i.strength, i.opportunity, i.action].filter(Boolean) as string[],
    ),
    computeMindResult(uniform(1)).profile.description,
    MIND_PROFESSIONAL_NOTE,
  ].join(" \n ").toLowerCase()

  it("contains none of the banned deterministic phrases", () => {
    for (const banned of [
      "drive neuroinflammation",
      "drives neuroinflammation",
      "will improve",
      "cures",
      "treats",
      "diagnos",
      "measures your mental health",
    ]) {
      expect(allCopy).not.toContain(banned)
    }
  })

  it("uses careful hedged language somewhere in the copy", () => {
    expect(/may support|is associated|may be associated|can help/.test(allCopy)).toBe(true)
  })

  it("the professional-help note points to a qualified professional", () => {
    expect(MIND_PROFESSIONAL_NOTE.toLowerCase()).toContain("qualified")
  })
})
