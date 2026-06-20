import { describe, it, expect } from "vitest"
import {
  getFamilyProfile,
  computeResult as computeFamilyResult,
  computeOverall as familyComputeOverall,
} from "@/lib/family-assessment-scoring"
import {
  getMindProfile,
  computeMindResult,
  computeOverall as mindComputeOverall,
} from "@/lib/mind-assessment-scoring"

/** Answers map with the same 0–3 value for q1..q15. */
function uniformAnswers(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) a[`q${i}`] = value
  return a
}

const anyBiotics = { prebiotics: 50, probiotics: 50, postbiotics: 50 }

describe("family getFamilyProfile thresholds", () => {
  it("maps overall score bands to the right family profile", () => {
    expect(getFamilyProfile(80, anyBiotics).type).toBe("Thriving Food Culture")
    expect(getFamilyProfile(60, anyBiotics).type).toBe("Strong Foundation")
    expect(getFamilyProfile(45, anyBiotics).type).toBe("Emerging Balance")
    expect(getFamilyProfile(30, anyBiotics).type).toBe("Finding Your Rhythm")
    expect(getFamilyProfile(5, anyBiotics).type).toBe("Early Builder")
  })
})

describe("mind getMindProfile thresholds", () => {
  it("maps overall score bands to the right mind profile", () => {
    expect(getMindProfile(80).type).toBe("Sharp & Steady")
    expect(getMindProfile(60).type).toBe("Clear Foundation")
    expect(getMindProfile(45).type).toBe("Emerging Clarity")
    expect(getMindProfile(30).type).toBe("Finding Your Rhythm")
    expect(getMindProfile(5).type).toBe("Early Builder")
  })
})

describe("native 5-pillar coherence (no longer 3 biotic insights)", () => {
  it("family returns 5 family-native insights", () => {
    const r = computeFamilyResult(uniformAnswers(2))
    expect(r.overall).toBe(familyComputeOverall(r.subScores))
    expect(r.insights).toHaveLength(5)
    expect(r.insights.map((i) => i.label).sort()).toEqual(
      ["Exposure", "Food Culture", "Foundation", "Live Foods", "Rhythm"].sort(),
    )
  })

  it("mind returns 5 mind-native insights", () => {
    const r = computeMindResult(uniformAnswers(2))
    expect(r.overall).toBe(mindComputeOverall(r.subScores))
    expect(r.insights).toHaveLength(5)
    expect(r.insights.map((i) => i.label).sort()).toEqual(
      ["Brain Fuel", "Live Foods", "Mind Response", "Plant & Polyphenol Diversity", "Rhythm"].sort(),
    )
  })

  it("pillar scores scale cleanly: 3→100, 0→0, 2→67", () => {
    expect(computeFamilyResult(uniformAnswers(3)).insights.every((i) => i.score === 100)).toBe(true)
    expect(computeFamilyResult(uniformAnswers(0)).insights.every((i) => i.score === 0)).toBe(true)
    expect(computeMindResult(uniformAnswers(2)).insights.every((i) => i.score === 67)).toBe(true)
  })
})
