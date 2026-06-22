import { describe, it, expect } from "vitest"
import { resolveMarket, marketBySlug, marketByName, rankCountries, MARKETS, DEFAULT_MARKET } from "@/lib/market"
import { foodSet, FOOD_PROFILES } from "@/lib/foods-by-country"

describe("market resolution", () => {
  it("resolves a known ISO code", () => {
    expect(resolveMarket("IE").name).toBe("Ireland")
    expect(resolveMarket("us").foodProfile).toBe("north_america") // case-insensitive
  })

  it("falls back for unknown / missing codes", () => {
    expect(resolveMarket(null)).toBe(DEFAULT_MARKET)
    expect(resolveMarket("").foodProfile).toBe(DEFAULT_MARKET.foodProfile)
    const xx = resolveMarket("XX")
    expect(xx.code).toBe("XX")
    expect(xx.foodProfile).toBe(DEFAULT_MARKET.foodProfile)
  })

  it("maps landing slugs to markets (uk → GB)", () => {
    expect(marketBySlug("ie")?.code).toBe("IE")
    expect(marketBySlug("uk")?.code).toBe("GB")
    expect(marketBySlug("US")?.code).toBe("US")
    expect(marketBySlug("zz")).toBeNull()
  })

  it("reverse-resolves by display name (for the quiz dropdown)", () => {
    expect(marketByName("Ireland")?.code).toBe("IE")
    expect(marketByName("united kingdom")?.code).toBe("GB")
    expect(marketByName("Atlantis")).toBeNull()
    expect(marketByName(null)).toBeNull()
  })

  it("every market maps to a defined food profile", () => {
    for (const mk of Object.values(MARKETS)) {
      const set = foodSet(mk.foodProfile)
      expect(set.fermented.length).toBeGreaterThan(0)
      expect(set.prebiotic.length).toBeGreaterThan(0)
    }
  })

  it("all 8 food profiles are authored", () => {
    expect(Object.keys(FOOD_PROFILES)).toHaveLength(8)
    expect(foodSet("east_asian").fermented).toContain("kimchi")
  })

  it("ranks country signups desc with flags + ranks", () => {
    const board = rankCountries(["Ireland", "Ireland", "United States", null, " ", "Ireland", "United States"])
    expect(board[0]).toMatchObject({ name: "Ireland", count: 3, rank: 1, flag: "🇮🇪" })
    expect(board[1]).toMatchObject({ name: "United States", count: 2, rank: 2 })
    expect(board).toHaveLength(2) // null/blank dropped
  })

  it("falls back to a globe flag for unknown countries", () => {
    const board = rankCountries(["Atlantis"])
    expect(board[0].flag).toBe("🌍")
  })
})
