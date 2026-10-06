import { describe, it, expect } from "vitest"
import { mealImpact } from "@/lib/account/meal-impact"

/*
 * ══ 0R-5 · REPOINTED, AND WHAT THAT COST IS WORTH RECORDING ═════════════════
 *
 * This suite's first assertion was named "lights the probiotic network for
 * fermented meals", and it PASSED for the whole programme. It was a
 * regression test for `P0-SCIENCE-05`'s defect:
 *
 *     const pro = rows.find((r) => r.key === "probiotic")!
 *     expect(pro.level).toBe("strong")
 *     expect(pro.effect.toLowerCase()).toContain("light")
 *
 * — a test that demanded a Biotic-named personal row, demanded its band word
 * be "strong" because the meal was fermented, and demanded the sentence say
 * the member's probiotic network "lights up". Every claims guard in the
 * repository was green while this one held the prohibited construct in place.
 *
 * The lesson is not about this file. It is that a test suite can PIN a defect
 * as a requirement, and a guard that reads source can never see it, because
 * the test is not a customer surface. `tests/unit/agent-loop-claims.test.ts`
 * now CALLS `mealImpact` and reads what it returns, which is the only
 * instrument that would have caught this.
 *
 * The rows that remain describe observable food, and the per-Biotic input is
 * gone from the contract, so these cases no longer supply one.
 */

describe("mealImpact", () => {
  it("names fibre from the tags and the meal name, with no Biotic row", () => {
    const rows = mealImpact({ meal_name: "Lentil and bean stew", tags: [] })
    expect(rows.find((r) => r.key === "fibre")!.level).toBe("strong")
    for (const key of ["probiotic", "postbiotic", "prebiotic"]) {
      expect(rows.find((r) => r.key === key), `a ${key} row is back`).toBeUndefined()
    }
    // Strong rows sort before low ones.
    expect(rows[0].level === "strong" || rows[0].level === "strain").toBe(true)
  })

  it("a fermented meal produces no row of its own", () => {
    /*
     * It used to produce the strongest row on the card. A fermented food is an
     * observable fact about the plate and remains visible in the meal's tags
     * and name; what is gone is the inference that it did something to this
     * member's probiotics.
     */
    const rows = mealImpact({ meal_name: "Kefir smoothie", tags: ["Fermented Foods"] })
    expect(rows.every((r) => !/biotic/i.test(r.key))).toBe(true)
    expect(rows.every((r) => !/biotic/i.test(`${r.label} ${r.effect} ${r.why}`))).toBe(true)
  })

  it("adds plant-diversity and healthy-fat rows only when earned", () => {
    const plain = mealImpact({ meal_name: "Plain toast", tags: [] })
    expect(plain.find((r) => r.key === "plants")).toBeUndefined()
    expect(plain.find((r) => r.key === "fats")).toBeUndefined()
    const rich = mealImpact({ meal_name: "Salmon, berries & greens with olive oil", tags: ["Omega-3s", "Plant Diversity"] })
    expect(rich.find((r) => r.key === "plants")!.level).toBe("strong")
    expect(rich.find((r) => r.key === "fats")!.level).toBe("strong")
  })

  it("flags ultra-processed strain from the observable meal alone", () => {
    /*
     * The gate was `strained && prebiotic_score < 40 && probiotic_score < 40`,
     * so whether a member was told their meal may strain the system depended on
     * two per-Biotic numbers. "Pizza with salad" was spared by a prebiotic
     * score of 55 — a kindness delivered through a prohibited construct.
     */
    const upf = mealImpact({ meal_name: "Fast food nuggets and soda", tags: ["Needs Work"] })
    expect(upf.find((r) => r.key === "strain")!.level).toBe("strain")
    expect(upf[0].key).toBe("strain") // strain surfaces first
  })

  it("keeps every row educational, expandable and non-medical", () => {
    const rows = mealImpact({ meal_name: "Chicken, kimchi & oats", tags: ["Protein Rich", "High Fibre"] })
    expect(rows.length).toBeGreaterThanOrEqual(2)
    for (const r of rows) {
      expect(r.why.length).toBeGreaterThan(30) // real micro-lesson behind "why this matters"
      expect(`${r.effect} ${r.why}`).not.toMatch(/cure|treat|diagnos|garden/i)
      expect(r.color).toMatch(/^#/)
    }
  })
})
