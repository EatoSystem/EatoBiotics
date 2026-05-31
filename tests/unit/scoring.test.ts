import { describe, it, expect } from "vitest"
import { calculateBioticsScore, getScoreBand } from "@/lib/scoring"
import type { Food, BioticType, FoodCategory } from "@/lib/foods"

// calculateBioticsScore only reads `biotic` and `category`, so a minimal
// fixture is enough — no need to pull in the full foods dataset.
function food(biotic: BioticType, category: FoodCategory): Food {
  return { biotic, category } as Food
}

describe("getScoreBand", () => {
  it("maps scores to the correct band", () => {
    expect(getScoreBand(85).label).toBe("Exceptional")
    expect(getScoreBand(80).label).toBe("Exceptional")
    expect(getScoreBand(60).label).toBe("Excellent")
    expect(getScoreBand(40).label).toBe("Good")
    expect(getScoreBand(20).label).toBe("Fair")
    expect(getScoreBand(0).label).toBe("Getting Started")
  })

  it("falls back to the lowest band for out-of-range scores", () => {
    expect(getScoreBand(-10).label).toBe("Getting Started")
  })
})

describe("calculateBioticsScore", () => {
  it("returns 0 and a prompt for an empty plate", () => {
    const result = calculateBioticsScore([])
    expect(result.score).toBe(0)
    expect(result.suggestions[0]).toMatch(/Add some foods/i)
  })

  it("applies diminishing base points within a biotic type", () => {
    // BASE_POINTS = [8, 6, 4, 3, 2] → 1 food = 8, 2 = 14, 3 = 18
    const one = calculateBioticsScore([food("prebiotic", "Vegetables")])
    expect(one.breakdown.prebiotic).toBe(8)

    const three = calculateBioticsScore([
      food("prebiotic", "Vegetables"),
      food("prebiotic", "Fruit"),
      food("prebiotic", "Grains & Legumes"),
    ])
    expect(three.breakdown.prebiotic).toBe(18)
  })

  it("rewards balance across biotic types more than piling onto one", () => {
    const lopsided = calculateBioticsScore([
      food("prebiotic", "Vegetables"),
      food("prebiotic", "Fruit"),
      food("prebiotic", "Grains & Legumes"),
    ])
    const balanced = calculateBioticsScore([
      food("prebiotic", "Vegetables"),
      food("probiotic", "Fermented"),
      food("postbiotic", "Fats & Oils"),
    ])
    expect(balanced.balanceBonus).toBeGreaterThan(lopsided.balanceBonus)
    expect(balanced.score).toBeGreaterThan(lopsided.score)
  })

  it("computes a known score for one food of each type", () => {
    const result = calculateBioticsScore([
      food("prebiotic", "Vegetables"),       // plant
      food("probiotic", "Fermented"),
      food("postbiotic", "Fats & Oils"),
      food("protein", "Protein"),
    ])
    // base 8*4=32 + balance(4 types)=30 + diversity(4 cats*2)=8 + plant(1*2)=2
    expect(result.score).toBe(72)
    expect(result.balanceBonus).toBe(30)
  })

  it("caps the score at 100", () => {
    const many: Food[] = []
    const cats: FoodCategory[] = ["Vegetables", "Fruit", "Grains & Legumes", "Nuts & Seeds", "Herbs & Spices"]
    for (const b of ["prebiotic", "probiotic", "postbiotic", "protein"] as BioticType[]) {
      for (const c of cats) many.push(food(b, c))
    }
    expect(calculateBioticsScore(many).score).toBe(100)
  })

  it("treats biotic 'all' as protein", () => {
    const result = calculateBioticsScore([food("all", "Protein")])
    expect(result.breakdown.protein).toBe(8)
  })
})
