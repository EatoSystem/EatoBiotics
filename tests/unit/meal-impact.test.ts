import { describe, it, expect } from "vitest"
import { mealImpact } from "@/lib/account/meal-impact"

const base = { prebiotic_score: 50, probiotic_score: 50, postbiotic_score: 50 }

describe("mealImpact", () => {
  it("lights the probiotic network for fermented meals", () => {
    const rows = mealImpact({ ...base, meal_name: "Kefir smoothie", tags: ["Fermented Foods"] })
    const pro = rows.find((r) => r.key === "probiotic")!
    expect(pro.level).toBe("strong")
    expect(pro.effect.toLowerCase()).toContain("light")
    // Strong rows sort before low ones.
    expect(rows[0].level === "strong" || rows[0].level === "strain").toBe(true)
  })

  it("glows fibre pathways for beans/lentils/oats", () => {
    const rows = mealImpact({ ...base, meal_name: "Lentil and bean stew", tags: [] })
    expect(rows.find((r) => r.key === "fibre")!.level).toBe("strong")
  })

  it("adds plant-diversity and healthy-fat rows only when earned", () => {
    const plain = mealImpact({ ...base, meal_name: "Plain toast", tags: [] })
    expect(plain.find((r) => r.key === "plants")).toBeUndefined()
    expect(plain.find((r) => r.key === "fats")).toBeUndefined()
    const rich = mealImpact({ ...base, meal_name: "Salmon, berries & greens with olive oil", tags: ["Omega-3s", "Plant Diversity"] })
    expect(rich.find((r) => r.key === "plants")!.level).toBe("strong")
    expect(rich.find((r) => r.key === "fats")!.level).toBe("strong")
  })

  it("flags ultra-processed strain only for genuinely low-biotic UPF meals", () => {
    const upf = mealImpact({ meal_name: "Fast food nuggets and soda", prebiotic_score: 12, probiotic_score: 8, postbiotic_score: 10, tags: ["Needs Work"] })
    const strain = upf.find((r) => r.key === "strain")!
    expect(strain.level).toBe("strain")
    expect(upf[0].key).toBe("strain") // strain surfaces first
    // A decent meal tagged Needs Work but with real fibre doesn't get shamed.
    const okay = mealImpact({ meal_name: "Pizza with salad", prebiotic_score: 55, probiotic_score: 20, postbiotic_score: 30, tags: ["Needs Work"] })
    expect(okay.find((r) => r.key === "strain")).toBeUndefined()
  })

  it("keeps every row educational, expandable and non-medical", () => {
    const rows = mealImpact({ ...base, meal_name: "Chicken, kimchi & oats", tags: ["Protein Rich"] })
    expect(rows.length).toBeGreaterThanOrEqual(4)
    for (const r of rows) {
      expect(r.why.length).toBeGreaterThan(30) // real micro-lesson behind "why this matters"
      expect(`${r.effect} ${r.why}`).not.toMatch(/cure|treat|diagnos|garden/i)
      expect(r.color).toMatch(/^#/)
    }
  })
})
