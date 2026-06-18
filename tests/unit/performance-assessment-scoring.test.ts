import { describe, it, expect } from "vitest"
import {
  computePerformanceSubScores,
  computePerformanceOverall,
  getPerformanceProfile,
  computePerformanceResult,
} from "@/lib/performance-assessment-scoring"
import { PERFORMANCE_QUESTIONS } from "@/lib/performance-assessment-data"

/** Build an answers map with the same value for every scored question. */
function uniformAnswers(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (const q of PERFORMANCE_QUESTIONS) a[q.id] = value
  return a
}

describe("computePerformanceSubScores", () => {
  it("scores every pillar at 100 for uniform max answers", () => {
    const s = computePerformanceSubScores(uniformAnswers(3))
    expect(s).toEqual({ energy: 100, build: 100, recovery: 100, protection: 100 })
  })

  it("scores every pillar at 0 for uniform zero answers", () => {
    const s = computePerformanceSubScores(uniformAnswers(0))
    expect(s).toEqual({ energy: 0, build: 0, recovery: 0, protection: 0 })
  })

  it("treats missing answers as 0", () => {
    const s = computePerformanceSubScores({ e1: 3, e2: 3, e3: 3 })
    expect(s.energy).toBe(100)
    expect(s.build).toBe(0)
  })
})

describe("computePerformanceOverall", () => {
  it("returns 100 when every pillar is maxed", () => {
    expect(
      computePerformanceOverall({ energy: 100, build: 100, recovery: 100, protection: 100 }),
    ).toBe(100)
  })

  it("applies a per-pillar floor of 25 so all-zero pillars yield 25 overall", () => {
    expect(computePerformanceOverall({ energy: 0, build: 0, recovery: 0, protection: 0 })).toBe(25)
  })
})

describe("getPerformanceProfile", () => {
  it("returns the optimised band at the top", () => {
    expect(getPerformanceProfile(100).label).toBe("Performance-Optimised")
  })

  it("returns the early-builder band at the bottom", () => {
    expect(getPerformanceProfile(25).label).toBe("Early Performance Builder")
  })

  it("always returns a well-formed profile", () => {
    const p = getPerformanceProfile(50)
    expect(p.label.length).toBeGreaterThan(0)
    expect(p.color).toMatch(/^var\(--/)
  })
})

describe("computePerformanceResult", () => {
  it("uniform max answers → every pillar 100 and overall 100", () => {
    const r = computePerformanceResult(uniformAnswers(3))
    expect(r.subScores).toEqual({ energy: 100, build: 100, recovery: 100, protection: 100 })
    expect(r.overall).toBe(100)
  })

  it("uniform zero answers → pillars 0 but overall reflects the 25 floor", () => {
    const r = computePerformanceResult(uniformAnswers(0))
    expect(r.subScores).toEqual({ energy: 0, build: 0, recovery: 0, protection: 0 })
    expect(r.overall).toBe(25)
  })

  it("orders insights weakest-first", () => {
    // energy weakest (0), protection strongest (100)
    const answers: Record<string, number> = {
      e1: 0, e2: 0, e3: 0, // energy 0
      b1: 1, b2: 1, b3: 1, // build 33
      r1: 2, r2: 2, r3: 2, // recovery 67
      p1: 3, p2: 3, p3: 3, // protection 100
    }
    const r = computePerformanceResult(answers)
    expect(r.insights.map((i) => i.key)).toEqual([
      "energy",
      "build",
      "recovery",
      "protection",
    ])
    // monotonically non-decreasing scores
    const scores = r.insights.map((i) => i.score)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })

  it("context changes nextActions but NOT the numeric scores", () => {
    const answers = uniformAnswers(1)
    const base = computePerformanceResult(answers)
    const withContext = computePerformanceResult(answers, {
      sport: "endurance",
      mainGoal: "endurance",
      level: "competitive",
    })

    // Scores are identical regardless of context.
    expect(withContext.subScores).toEqual(base.subScores)
    expect(withContext.overall).toBe(base.overall)
    expect(withContext.profile).toBe(base.profile)

    // But the endurance goal tailors the energy action.
    const baseEnergy = base.nextActions.find((a) => a.pillar === "energy")
    const ctxEnergy = withContext.nextActions.find((a) => a.pillar === "energy")
    expect(baseEnergy).toBeDefined()
    expect(ctxEnergy).toBeDefined()
    expect(ctxEnergy!.text).not.toBe(baseEnergy!.text)
    expect(ctxEnergy!.text).toContain("endurance goal")
  })
})
