import { describe, it, expect } from "vitest"
import {
  getProfile as getFamilyProfile,
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

// getProfile takes `overall` explicitly, so threshold behaviour can be tested directly.
const anySub = { prebiotics: 50, probiotics: 50, postbiotics: 50 }

describe("family getProfile thresholds", () => {
  it("maps overall score bands to the right profile", () => {
    expect(getFamilyProfile(80, anySub).type).toBe("Thriving System")
    expect(getFamilyProfile(60, anySub).type).toBe("Strong Foundation")
    expect(getFamilyProfile(45, anySub).type).toBe("Emerging Balance")
    expect(getFamilyProfile(20, anySub).type).toBe("Inconsistent System")
    expect(getFamilyProfile(5, anySub).type).toBe("Early Builder")
  })

  it("returns a well-formed profile (color + non-empty copy)", () => {
    const p = getFamilyProfile(60, anySub)
    expect(p.color).toMatch(/^var\(--/)
    expect(p.tagline.length).toBeGreaterThan(0)
    expect(p.description.length).toBeGreaterThan(0)
  })
})

describe("mind getMindProfile thresholds", () => {
  it("maps overall score bands to the right profile", () => {
    expect(getMindProfile(80, anySub).type).toBe("Sharp Mind")
    expect(getMindProfile(60, anySub).type).toBe("Clear Foundation")
    expect(getMindProfile(45, anySub).type).toBe("Emerging Clarity")
    expect(getMindProfile(30, anySub).type).toBe("Foggy System")
    expect(getMindProfile(20, anySub).type).toBe("Reactive Mind")
    expect(getMindProfile(5, anySub).type).toBe("Early Mind Builder")
  })
})

describe("computeResult coherence", () => {
  it("family result's overall matches computeOverall and returns 3 biotic insights", () => {
    const r = computeFamilyResult(uniformAnswers(2))
    expect(r.overall).toBe(familyComputeOverall(r.subScores))
    expect(r.insights).toHaveLength(3)
    expect(r.insights.map((i) => i.label).sort()).toEqual(["Postbiotics", "Prebiotics", "Probiotics"])
    expect(r.nextActions.length).toBeLessThanOrEqual(3)
  })

  it("mind result's overall matches computeOverall and returns 3 biotic insights", () => {
    const r = computeMindResult(uniformAnswers(2))
    expect(r.overall).toBe(mindComputeOverall(r.subScores))
    expect(r.insights).toHaveLength(3)
    expect(r.insights.map((i) => i.label).sort()).toEqual(["Postbiotics", "Prebiotics", "Probiotics"])
    expect(r.nextActions.length).toBeLessThanOrEqual(3)
  })
})

/*
 * Insight scores reflect the real 3-biotic sub-scores (the model the product
 * standardised on). Previously they were always 0 because the insight builders
 * read legacy 5-pillar keys out of the 3-biotic SubScores.
 */
describe("family/mind insight scores reflect the 3-biotic answers", () => {
  it("family insights all score 100 for a perfect assessment, 0 for the lowest", () => {
    expect(computeFamilyResult(uniformAnswers(3)).insights.every((i) => i.score === 100)).toBe(true)
    expect(computeFamilyResult(uniformAnswers(0)).insights.every((i) => i.score === 0)).toBe(true)
  })

  it("mind insights all score 100 for a perfect assessment, 0 for the lowest", () => {
    expect(computeMindResult(uniformAnswers(3)).insights.every((i) => i.score === 100)).toBe(true)
    expect(computeMindResult(uniformAnswers(0)).insights.every((i) => i.score === 0)).toBe(true)
  })

  it("a mid-level answer maps to a mid-level insight score (not 0)", () => {
    // value 2 of 3 across the questions in each biotic group → 67
    const insights = computeMindResult(uniformAnswers(2)).insights
    expect(insights.every((i) => i.score === 67)).toBe(true)
  })
})

/*
 * The weakest-pillar profile variants in the 28–41 band are now reachable
 * (they key off the 3-biotic weakest pillar instead of unreachable legacy keys).
 */
describe("family weakest-pillar profile variants (28–41 band)", () => {
  it("returns the rhythm variant when postbiotics is weakest", () => {
    expect(getFamilyProfile(30, { prebiotics: 50, probiotics: 50, postbiotics: 10 }).type)
      .toBe("Inconsistent System")
  })

  it("returns the fermented-foods variant when probiotics is weakest", () => {
    expect(getFamilyProfile(30, { prebiotics: 50, probiotics: 10, postbiotics: 50 }).type)
      .toBe("Underfed System")
  })

  it("falls back to the default when prebiotics is weakest", () => {
    expect(getFamilyProfile(30, { prebiotics: 10, probiotics: 50, postbiotics: 50 }).type)
      .toBe("Emerging Balance")
  })
})
