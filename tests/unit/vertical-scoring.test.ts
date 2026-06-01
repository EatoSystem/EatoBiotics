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
  it("family result's overall matches computeOverall and returns 5 insights", () => {
    const r = computeFamilyResult(uniformAnswers(2))
    expect(r.overall).toBe(familyComputeOverall(r.subScores))
    expect(r.insights).toHaveLength(5)
    expect(r.nextActions.length).toBeLessThanOrEqual(3)
  })

  it("mind result's overall matches computeOverall and returns 5 insights", () => {
    const r = computeMindResult(uniformAnswers(2))
    expect(r.overall).toBe(mindComputeOverall(r.subScores))
    expect(r.insights).toHaveLength(5)
    expect(r.nextActions.length).toBeLessThanOrEqual(3)
  })
})

/*
 * Insight scores now reflect the real 5-pillar answers (bucketed by each
 * question's `pillar` field) — previously they were always 0 because the
 * insight functions read legacy 5-pillar keys out of the 3-biotic SubScores.
 */
describe("family/mind insight scores reflect the 5-pillar answers", () => {
  it("family insights all score 100 for a perfect assessment, 0 for the lowest", () => {
    expect(computeFamilyResult(uniformAnswers(3)).insights.every((i) => i.score === 100)).toBe(true)
    expect(computeFamilyResult(uniformAnswers(0)).insights.every((i) => i.score === 0)).toBe(true)
  })

  it("mind insights all score 100 for a perfect assessment, 0 for the lowest", () => {
    expect(computeMindResult(uniformAnswers(3)).insights.every((i) => i.score === 100)).toBe(true)
    expect(computeMindResult(uniformAnswers(0)).insights.every((i) => i.score === 0)).toBe(true)
  })

  it("a mid-level answer maps to a mid-level insight score (not 0)", () => {
    // value 2 of 3 across 3 questions per pillar → 6/9 → 67
    const insights = computeMindResult(uniformAnswers(2)).insights
    expect(insights.every((i) => i.score === 67)).toBe(true)
  })
})
