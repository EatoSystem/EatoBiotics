import { describe, it, expect } from "vitest"
import {
  computeSubScores,
  computeOverall,
  getProfile,
  computeResult,
  normaliseSubScores,
} from "@/lib/assessment-scoring"

/** Build an answers map with the same value for q1..q15. */
function uniformAnswers(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) a[`q${i}`] = value
  return a
}

describe("computeSubScores", () => {
  it("scales each pillar to 0–100 against its max raw points", () => {
    const full = computeSubScores(uniformAnswers(3))
    expect(full.prebiotics).toBe(100)
    expect(full.probiotics).toBe(100)
    expect(full.postbiotics).toBe(100)
  })

  it("returns zeros for an empty answer set", () => {
    const empty = computeSubScores({})
    expect(empty.prebiotics).toBe(0)
    expect(empty.probiotics).toBe(0)
    expect(empty.postbiotics).toBe(0)
  })

  it("mirrors pillars onto feed/seed/heal aliases", () => {
    const s = computeSubScores(uniformAnswers(3))
    expect(s.feed).toBe(s.prebiotics)
    expect(s.seed).toBe(s.probiotics)
    expect(s.heal).toBe(s.postbiotics)
  })

  it("ignores non-numeric (multi-select) answers", () => {
    const s = computeSubScores({ q1: ["a", "b"], q2: 3 })
    // only q2 counts: 3/18 ≈ 17
    expect(s.prebiotics).toBe(17)
  })
})

describe("computeOverall", () => {
  it("returns 100 when every pillar is maxed", () => {
    expect(computeOverall({ prebiotics: 100, probiotics: 100, postbiotics: 100 })).toBe(100)
  })

  it("applies a per-pillar floor of 20", () => {
    // all zeros → floored to 20 each → 20*.4 + 20*.2 + 20*.4 = 20
    expect(computeOverall({ prebiotics: 0, probiotics: 0, postbiotics: 0 })).toBe(20)
  })

  it("weights prebiotics/postbiotics 40% and probiotics 20%", () => {
    // floors: 100, 20, 20 → 40 + 4 + 8 = 52
    expect(computeOverall({ prebiotics: 100, probiotics: 0, postbiotics: 0 })).toBe(52)
  })
})

describe("getProfile", () => {
  it("returns the thriving profile for high overall scores", () => {
    const profile = getProfile(85, { prebiotics: 90, probiotics: 85, postbiotics: 80 })
    expect(profile.type).toBe("Thriving Food System")
  })

  it("always returns a well-formed profile", () => {
    const profile = getProfile(30, { prebiotics: 10, probiotics: 40, postbiotics: 20 })
    expect(typeof profile.type).toBe("string")
    expect(profile.type.length).toBeGreaterThan(0)
    expect(profile.color).toMatch(/^var\(--/)
  })
})

describe("normaliseSubScores", () => {
  it("passes through the canonical prebiotics/probiotics/postbiotics shape", () => {
    const s = normaliseSubScores({ prebiotics: 50, probiotics: 60, postbiotics: 70 })
    expect(s).toMatchObject({ prebiotics: 50, probiotics: 60, postbiotics: 70, feed: 50, heal: 70 })
  })

  it("maps the feed/seed/heal shape", () => {
    const s = normaliseSubScores({ feed: 40, seed: 50, heal: 60 })
    expect(s.prebiotics).toBe(40)
    expect(s.probiotics).toBe(50)
    expect(s.postbiotics).toBe(60)
  })

  it("converts the legacy 5-pillar shape", () => {
    const s = normaliseSubScores({ diversity: 60, feeding: 40, adding: 30, consistency: 80, feeling: 20 })
    expect(s.prebiotics).toBe(50) // (60+40)/2
    expect(s.probiotics).toBe(30) // adding
    expect(s.postbiotics).toBe(50) // (80+20)/2
  })
})

describe("computeResult", () => {
  it("produces a coherent result whose overall matches computeOverall", () => {
    const answers = uniformAnswers(2)
    const result = computeResult(answers)
    expect(result.overall).toBe(computeOverall(result.subScores))
    expect(result.nextActions.length).toBeLessThanOrEqual(3)
    expect(result.completedAt).toBeGreaterThan(0)
  })
})
