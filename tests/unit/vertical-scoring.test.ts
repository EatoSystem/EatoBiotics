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
 * CHARACTERIZATION TEST — documents a KNOWN BUG, not desired behaviour.
 *
 * getInsights/getMindInsights read legacy 5-pillar keys (diversity, feeding,
 * adding, consistency, feeling) out of a SubScores that computeSubScores only
 * populates with 3-biotic keys (prebiotics/probiotics/postbiotics + feed/seed/
 * heal). Every per-pillar insight score therefore resolves to 0, even for a
 * perfect assessment. This test locks in the current behaviour so it FAILS
 * (prompting an update) once the key mismatch is fixed.
 */
describe("KNOWN BUG: family/mind insight scores are always 0 (pillar-key mismatch)", () => {
  it("family insights all score 0 even for a perfect assessment", () => {
    const r = computeFamilyResult(uniformAnswers(3)) // max answers
    expect(r.insights.every((i) => i.score === 0)).toBe(true)
  })

  it("mind insights all score 0 even for a perfect assessment", () => {
    const r = computeMindResult(uniformAnswers(3))
    expect(r.insights.every((i) => i.score === 0)).toBe(true)
  })
})
