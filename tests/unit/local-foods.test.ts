import { describe, it, expect } from "vitest"
import { localFoods, fermentedPair, prebioticTrio } from "@/lib/local-foods"

describe("localFoods", () => {
  it("falls back to the western_eu set for unknown/absent countries (matches legacy copy)", () => {
    expect(localFoods(null).signature).toBe("sauerkraut")
    expect(localFoods("ZZ").signature).toBe("sauerkraut")
  })

  it("resolves South Asian foods for India", () => {
    expect(localFoods("IN").signature).toBe("dahi")
  })

  it("resolves East Asian foods for Korea", () => {
    expect(localFoods("KR").signature).toBe("kimchi")
  })
})

describe("prose helpers", () => {
  it("fermentedPair picks the first two examples", () => {
    expect(fermentedPair(localFoods("IE"))).toBe("yoghurt or kefir")
    expect(fermentedPair(localFoods("IN"))).toBe("dahi (yoghurt) or idli & dosa batter")
  })

  it("prebioticTrio picks the first three with an Oxford 'and'", () => {
    expect(prebioticTrio(localFoods("IE"))).toBe("oats, onions, and leeks")
    expect(prebioticTrio(localFoods("MX"))).toBe("black beans, plantain, and maize")
  })
})
