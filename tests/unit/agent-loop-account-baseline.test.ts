import { describe, it, expect } from "vitest"
import { buildBaselineFromAccount } from "@/lib/agent-loop"

describe("buildBaselineFromAccount", () => {
  it("returns null when there is no score", () => {
    expect(buildBaselineFromAccount({ score: null })).toBeNull()
  })

  it("returns null when there is a score but no biotics from any source", () => {
    expect(buildBaselineFromAccount({ score: 60 })).toBeNull()
  })

  it("builds from assessment sub-scores (new format) and defaults to the You foundation", () => {
    const base = buildBaselineFromAccount({
      score: 62,
      profileType: "Strong Foundation",
      subScores: { prebiotics: 40, probiotics: 75, postbiotics: 55 },
    })
    expect(base).not.toBeNull()
    expect(base!.foundationKey).toBe("you")
    expect(base!.foodSystemScore.value).toBe(62)
    expect(base!.foodSystemScore.label).toBe("Strong Foundation")
    expect(base!.biotics.weakest).toBe("prebiotics")
    expect(base!.biotics.strongest).toBe("probiotics")
  })

  it("normalises legacy sub-score formats", () => {
    const base = buildBaselineFromAccount({
      score: 50,
      subScores: { diversity: 60, feeding: 40, adding: 30, consistency: 70, feeling: 50 },
    })
    // prebiotics = avg(diversity, feeding) = 50; probiotics = adding = 30; postbiotics = avg(70,50) = 60
    expect(base!.biotics.prebiotics.score).toBe(50)
    expect(base!.biotics.probiotics.score).toBe(30)
    expect(base!.biotics.postbiotics.score).toBe(60)
    expect(base!.biotics.weakest).toBe("probiotics")
  })

  it("falls back to analyses-averaged biotics when no sub-scores", () => {
    const base = buildBaselineFromAccount({
      score: 70,
      bioticsFallback: { prebiotic: 80, probiotic: 50, postbiotic: 65 },
    })
    expect(base!.biotics.prebiotics.score).toBe(80)
    expect(base!.biotics.strongest).toBe("prebiotics")
    expect(base!.biotics.weakest).toBe("probiotics")
  })

  it("prefers sub-scores over the analyses fallback", () => {
    const base = buildBaselineFromAccount({
      score: 70,
      subScores: { prebiotics: 30, probiotics: 90, postbiotics: 60 },
      bioticsFallback: { prebiotic: 99, probiotic: 1, postbiotic: 1 },
    })
    expect(base!.biotics.prebiotics.score).toBe(30)
    expect(base!.biotics.strongest).toBe("probiotics")
  })

  it("honours an explicit family foundation and falls back to a default label", () => {
    const base = buildBaselineFromAccount({
      foundationKey: "family",
      score: 55,
      subScores: { prebiotics: 50, probiotics: 50, postbiotics: 50 },
    })
    expect(base!.foundationKey).toBe("family")
    expect(base!.foodSystemScore.label).toBe("Food System")
  })
})
