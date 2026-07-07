import { describe, it, expect } from "vitest"
import { calculatePregnancyScore } from "@/lib/pregnancy/scoring"
import {
  DEFAULT_PREGNANCY_FLAGS,
  allPregnancyAnswered,
  requiredPregnancyQuestionIds,
} from "@/lib/pregnancy/questions"
import type { PregnancyAnswers } from "@/lib/pregnancy/types"

const answers = (over: Partial<PregnancyAnswers> = {}): PregnancyAnswers => ({
  vegVariety: 0, fruitVariety: 0, legumes: 0, wholeGrains: 0, fermented: 0,
  regularMeals: 0, breakfast: 0, comfortEating: 0,
  hydration: 0,
  proteinFoods: 0, calciumFoods: 0, varietyGroups: 0,
  ultraProcessed: 0, sweetDrinks: 0, caffeine: 0,
  ...over,
})

const HIGH = answers({
  vegVariety: 3, fruitVariety: 3, legumes: 3, wholeGrains: 3, fermented: 3,
  regularMeals: 3, breakfast: 3, comfortEating: 3,
  hydration: 3,
  proteinFoods: 3, calciumFoods: 3, varietyGroups: 3,
  ultraProcessed: 0, sweetDrinks: 0, caffeine: 0,
})

describe("calculatePregnancyScore", () => {
  it("scores a well-nourished, varied week highly (Strong & Steady)", () => {
    const s = calculatePregnancyScore(HIGH, DEFAULT_PREGNANCY_FLAGS)
    expect(s.totalScore).toBeGreaterThanOrEqual(80)
    expect(s.band).toBe("Strong & Steady")
    expect(s.positiveFactors).toContain("Good plant variety")
    expect(s.redFlags).toEqual([])
  })

  it("scores a low-variety, high-processed week low (Building Foundations)", () => {
    const s = calculatePregnancyScore(
      answers({ ultraProcessed: 3, sweetDrinks: 3, caffeine: 3 }),
      DEFAULT_PREGNANCY_FLAGS,
    )
    expect(s.totalScore).toBeLessThan(40)
    expect(s.band).toBe("Building Foundations")
    expect(s.priorityFactors).toContain("Low plant variety")
  })

  it("never produces a negative or >100 score, and keeps categories bounded", () => {
    const s = calculatePregnancyScore(HIGH, DEFAULT_PREGNANCY_FLAGS)
    expect(s.totalScore).toBeLessThanOrEqual(100)
    expect(s.categoryScores.plantDiversity).toBeLessThanOrEqual(25)
    expect(s.categoryScores.gentleModeration).toBeGreaterThanOrEqual(0)
  })

  it("surfaces red flags and leads the next steps with professional signposting — never a diagnosis", () => {
    const s = calculatePregnancyScore(HIGH, { ...DEFAULT_PREGNANCY_FLAGS, bleeding: true, reducedMovements: true })
    expect(s.redFlags).toContain("Vaginal bleeding")
    expect(s.redFlags).toContain("A noticeable reduction in your baby's movements")
    expect(s.recommendedNextSteps[0]).toMatch(/midwife|GP|maternity/i)
    // score itself stays food-based (red flags don't fabricate a medical verdict)
    expect(s.totalScore).toBeGreaterThanOrEqual(80)
  })

  it("gates on full completion — no score is implied until every question is answered", () => {
    expect(allPregnancyAnswered([])).toBe(false)
    expect(allPregnancyAnswered(requiredPregnancyQuestionIds())).toBe(true)
  })
})
