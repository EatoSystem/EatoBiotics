import { describe, it, expect } from "vitest"
import { calculateStabilityScore, STABILITY_BANDS } from "@/lib/stability/scoring"
import {
  DEFAULT_ANSWERS,
  DEFAULT_FLAGS,
  requiredStabilityQuestionIds,
  allStabilityAnswered,
} from "@/lib/stability/questions"
import type { StabilityAnswers, SafetyFlags } from "@/lib/stability/types"

const bandIndex = (band: string) => STABILITY_BANDS.findIndex((b) => b.band === band)

// A clearly healthy/stable answer set.
const GOOD_ANSWERS: StabilityAnswers = {
  ...DEFAULT_ANSWERS,
  bmFrequency: 1, predictable: 3, rush: 0, toiletWorry: 0, confidenceImpact: 0,
  usualStool: 4,
  urgencyFreq: 0, accidentFreq: 0, urgencySeverity: 0, canDelay: 3, urgencyAfterMeals: 0,
  vegVariety: 3, fruitVariety: 3, legumes: 3, wholeGrains: 3, fermented: 3,
  ultraProcessed: 0, richMeals: 0, sweeteners: 0, caffeine: 1, alcohol: 0, dairy: 1,
  sleepQuality: 3, stress: 0, movement: 3, hydration: 3, recentAntibiotics: 0, medicationChanges: 0,
}

// A clearly unstable/poor answer set.
const POOR_ANSWERS: StabilityAnswers = {
  ...DEFAULT_ANSWERS,
  bmFrequency: 3, predictable: 0, rush: 4, toiletWorry: 4, confidenceImpact: 4,
  usualStool: 7,
  urgencyFreq: 4, accidentFreq: 4, urgencySeverity: 5, canDelay: 0, urgencyAfterMeals: 3,
  vegVariety: 0, fruitVariety: 0, legumes: 0, wholeGrains: 0, fermented: 0,
  ultraProcessed: 3, richMeals: 3, sweeteners: 3, caffeine: 3, alcohol: 3, dairy: 3,
  sleepQuality: 0, stress: 4, movement: 0, hydration: 0, recentAntibiotics: 1, medicationChanges: 1,
}

describe("calculateStabilityScore — red-flag safety", () => {
  it("caps consistency ≤ 4, surfaces the GP message, and records redFlags when a safety flag is set", () => {
    const flags: SafetyFlags = { ...DEFAULT_FLAGS, blood: true }
    const score = calculateStabilityScore(GOOD_ANSWERS, flags)

    expect(score.categoryScores.consistency).toBeLessThanOrEqual(4)
    expect(score.redFlags.length).toBeGreaterThan(0)
    expect(score.topRiskFactors).toContain(
      "Red-flag symptoms present — please speak to a GP",
    )
  })

  it("does not flag anything when no safety flag is set", () => {
    const score = calculateStabilityScore(GOOD_ANSWERS, { ...DEFAULT_FLAGS })
    expect(score.redFlags).toHaveLength(0)
    expect(score.topRiskFactors).not.toContain(
      "Red-flag symptoms present — please speak to a GP",
    )
  })
})

describe("stability answer-completeness validation", () => {
  it("allStabilityAnswered([]) is false (no score from an unanswered/default state)", () => {
    expect(allStabilityAnswered([])).toBe(false)
  })

  it("is true only once every required id is present", () => {
    const required = requiredStabilityQuestionIds()
    expect(required.length).toBeGreaterThan(0)

    // Missing one id → still false.
    const allButOne = required.slice(0, -1).map(String)
    expect(allStabilityAnswered(allButOne)).toBe(false)

    // Every required id present → true.
    expect(allStabilityAnswered(required.map(String))).toBe(true)
  })
})

describe("calculateStabilityScore — banding", () => {
  it("good answers yield a higher band than poor answers", () => {
    const good = calculateStabilityScore(GOOD_ANSWERS, { ...DEFAULT_FLAGS })
    const poor = calculateStabilityScore(POOR_ANSWERS, { ...DEFAULT_FLAGS })

    expect(good.totalScore).toBeGreaterThan(poor.totalScore)
    expect(bandIndex(good.band)).toBeGreaterThan(bandIndex(poor.band))
  })
})
