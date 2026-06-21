import { describe, it, expect } from "vitest"
import {
  QUICK_QUESTIONS,
  quickSubScores,
  computeQuickResult,
} from "@/lib/quick-assessment"

// Build an answer map that gives every question the same 0–3 value.
function uniformAnswers(value: number): Record<string, number> {
  return Object.fromEntries(QUICK_QUESTIONS.map((q) => [q.id, value]))
}

describe("quick-assessment", () => {
  it("has 5 questions covering all three pillars", () => {
    expect(QUICK_QUESTIONS).toHaveLength(5)
    const pillars = new Set(QUICK_QUESTIONS.map((q) => q.pillar))
    expect(pillars).toEqual(new Set(["prebiotics", "probiotics", "postbiotics"]))
    // Every option value is in the 0–3 range used by the real engine.
    for (const q of QUICK_QUESTIONS) {
      for (const o of q.options) {
        expect(o.value).toBeGreaterThanOrEqual(0)
        expect(o.value).toBeLessThanOrEqual(3)
      }
    }
  })

  it("produces valid 0–100 sub-scores for every pillar", () => {
    const sub = quickSubScores(uniformAnswers(2))
    for (const key of ["prebiotics", "probiotics", "postbiotics"] as const) {
      expect(sub[key]).toBeGreaterThanOrEqual(0)
      expect(sub[key]).toBeLessThanOrEqual(100)
    }
    // feed/seed/heal aliases mirror the canonical pillars.
    expect(sub.feed).toBe(sub.prebiotics)
    expect(sub.seed).toBe(sub.probiotics)
    expect(sub.heal).toBe(sub.postbiotics)
  })

  it("maps all-low answers to the Early Builder profile", () => {
    const result = computeQuickResult(uniformAnswers(0))
    expect(result.profile.type).toBe("Early Builder")
    expect(result.overall).toBeLessThan(35)
  })

  it("maps all-high answers to the Thriving Food System profile", () => {
    const result = computeQuickResult(uniformAnswers(3))
    expect(result.profile.type).toBe("Thriving Food System")
    expect(result.overall).toBeGreaterThanOrEqual(80)
  })

  it("lands a mid-range profile for moderate answers", () => {
    const result = computeQuickResult(uniformAnswers(2))
    // value 2/3 ≈ 67 per pillar → overall in the Strong Foundation band.
    expect(result.overall).toBeGreaterThanOrEqual(50)
    expect(result.overall).toBeLessThan(80)
    expect(result.profile.type.length).toBeGreaterThan(0)
    expect(result.insights).toHaveLength(3)
  })
})
