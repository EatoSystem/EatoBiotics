import { describe, it, expect } from "vitest"
import { countUniquePlants, PLANT_TARGET } from "@/lib/account/plant-count"

describe("countUniquePlants", () => {
  it("counts distinct plants across meal names", () => {
    const { plants, count } = countUniquePlants([
      "Spinach and chickpea curry",
      "Porridge with blueberries and almonds",
    ])
    // spinach, chickpeas, blueberries, almonds — at least these four
    expect(count).toBeGreaterThanOrEqual(4)
    expect(plants.some((p) => /spinach/i.test(p))).toBe(true)
    expect(plants.some((p) => /almond/i.test(p))).toBe(true)
  })

  it("de-duplicates the same plant eaten twice", () => {
    const a = countUniquePlants(["Garlic bread", "Garlic roast chicken"])
    expect(a.plants.filter((p) => /garlic/i.test(p)).length).toBe(1)
  })

  it("matches on word boundaries, not substrings", () => {
    // 'pear' must not match inside 'spear' / 'appearance'
    const { plants } = countUniquePlants(["appearance of a nice dish"])
    expect(plants.some((p) => /^pear$/i.test(p))).toBe(false)
  })

  it("prefers the more specific plant on overlapping names", () => {
    // 'sweet potato' should register (and not be shadowed away by 'potato')
    const { plants } = countUniquePlants(["Sweet potato mash"])
    expect(plants.some((p) => /sweet potato/i.test(p))).toBe(true)
  })

  it("handles empty / null input safely", () => {
    expect(countUniquePlants([]).count).toBe(0)
    expect(countUniquePlants([null, undefined, ""]).count).toBe(0)
  })

  it("returns nothing for a plant-free meal", () => {
    expect(countUniquePlants(["Grilled steak", "Boiled egg"]).count).toBe(0)
  })

  it("exposes the 30-plant target", () => {
    expect(PLANT_TARGET).toBe(30)
  })
})
