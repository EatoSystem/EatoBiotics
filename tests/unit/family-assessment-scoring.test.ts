import { describe, it, expect } from "vitest"
import {
  computeResult as computeFamilyResult,
  computeFamilyPillarScores,
  FAMILY_PILLAR_ORDER,
} from "@/lib/family-assessment-scoring"

/** All q1..q15 set to the same 0–3 value. */
function uniform(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) a[`q${i}`] = value
  return a
}

/** Per-group values: exposure q1-3, foundation q4-6, liveFoods q7-9, rhythm q10-12, foodCulture q13-15. */
function byGroup(v: {
  exposure: number
  foundation: number
  liveFoods: number
  rhythm: number
  foodCulture: number
}): Record<string, number> {
  return {
    q1: v.exposure, q2: v.exposure, q3: v.exposure,
    q4: v.foundation, q5: v.foundation, q6: v.foundation,
    q7: v.liveFoods, q8: v.liveFoods, q9: v.liveFoods,
    q10: v.rhythm, q11: v.rhythm, q12: v.rhythm,
    q13: v.foodCulture, q14: v.foodCulture, q15: v.foodCulture,
  }
}

describe("family native 5-subscore model", () => {
  it("computes five pillars scaled to 0–100", () => {
    expect(FAMILY_PILLAR_ORDER).toEqual([
      "exposure", "foundation", "liveFoods", "rhythm", "foodCulture",
    ])
    expect(computeFamilyPillarScores(uniform(3))).toEqual({
      exposure: 100, foundation: 100, liveFoods: 100, rhythm: 100, foodCulture: 100,
    })
    expect(computeFamilyPillarScores(uniform(0))).toEqual({
      exposure: 0, foundation: 0, liveFoods: 0, rhythm: 0, foodCulture: 0,
    })
  })

  it("exposes the five pillars as the primary result", () => {
    const r = computeFamilyResult(uniform(2))
    expect(Object.keys(r.pillarScores).sort()).toEqual(
      ["exposure", "foodCulture", "foundation", "liveFoods", "rhythm"].sort(),
    )
    expect(r.insights).toHaveLength(5)
  })

  it("derives the secondary 3-Biotics: Exposure+Foundation→Pre, LiveFoods→Pro, Rhythm+FoodCulture→Post", () => {
    const r = computeFamilyResult(
      byGroup({ exposure: 3, foundation: 3, liveFoods: 2, rhythm: 0, foodCulture: 0 }),
    )
    expect(r.biotics.prebiotics).toBe(100) // q1-6 maxed
    expect(r.biotics.probiotics).toBe(67) // q7-9 at 2/3
    expect(r.biotics.postbiotics).toBe(0) // q10-15 at 0
  })

  it("stores canonical sub_scores: 3-Biotics + legacy 5-keys for the dashboard", () => {
    const r = computeFamilyResult(
      byGroup({ exposure: 3, foundation: 1, liveFoods: 2, rhythm: 1, foodCulture: 0 }),
    )
    // 3-Biotics present
    expect(typeof r.subScores.prebiotics).toBe("number")
    expect(typeof r.subScores.probiotics).toBe("number")
    expect(typeof r.subScores.postbiotics).toBe("number")
    // Legacy 5-keys mirror the native pillars (dashboard extractSubScores reads these)
    expect(r.subScores.diversity).toBe(r.pillarScores.exposure)
    expect(r.subScores.feeding).toBe(r.pillarScores.foundation)
    expect(r.subScores.adding).toBe(r.pillarScores.liveFoods)
    expect(r.subScores.consistency).toBe(r.pillarScores.rhythm)
    expect(r.subScores.feeling).toBe(r.pillarScores.foodCulture)
  })

  it("context shapes tips but NEVER changes the score", () => {
    const answers = uniform(2)
    const base = computeFamilyResult(answers)
    const withContext = computeFamilyResult(answers, {
      pickyEating: 0, budget: 0, cookingTime: 0, schoolMeals: 0,
    })
    expect(withContext.pillarScores).toEqual(base.pillarScores)
    expect(withContext.overall).toBe(base.overall)
    expect(withContext.subScores).toEqual(base.subScores)
    expect(withContext.contextTips.length).toBeGreaterThan(0) // tips appear
    expect(base.contextTips).toHaveLength(0) // none without context
  })

  it("result language stays constructive (no shaming/medical claims in band copy)", () => {
    const text = computeFamilyResult(uniform(0)).profile.description.toLowerCase()
    expect(text).not.toContain("diagnos")
    expect(text).not.toContain("fail")
  })
})
