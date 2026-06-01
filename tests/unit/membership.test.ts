import { describe, it, expect, afterEach } from "vitest"
import { canAccess, tierFromPriceId, isFoundingMember, TIER_META } from "@/lib/membership"

describe("canAccess", () => {
  it("gates AI consultation to transform only", () => {
    expect(canAccess("transform", "ai_consultation")).toBe(true)
    expect(canAccess("restore", "ai_consultation")).toBe(false)
    expect(canAccess("grow", "ai_consultation")).toBe(false)
    expect(canAccess("free", "ai_consultation")).toBe(false)
  })

  it("grants unlimited analyses to every paid tier but not free", () => {
    for (const tier of ["grow", "restore", "transform", "trial", "member"] as const) {
      expect(canAccess(tier, "unlimited_analyses")).toBe(true)
    }
    expect(canAccess("free", "unlimited_analyses")).toBe(false)
  })

  it("treats member like restore for 90-day history (and grow like a base tier)", () => {
    expect(canAccess("member", "score_history_90")).toBe(true)
    expect(canAccess("grow", "score_history_90")).toBe(false)
  })
})

describe("tierFromPriceId", () => {
  it("returns null for an unknown price id", () => {
    expect(tierFromPriceId("price_does_not_exist")).toBeNull()
  })
})

describe("TIER_META", () => {
  it("exposes consistent monthly prices", () => {
    expect(TIER_META.transform.priceMonthly).toBe(99)
    expect(TIER_META.free.priceMonthly).toBe(0)
  })
})

describe("isFoundingMember", () => {
  const original = process.env.FOUNDING_MEMBER_CUTOFF_DATE

  afterEach(() => {
    if (original === undefined) delete process.env.FOUNDING_MEMBER_CUTOFF_DATE
    else process.env.FOUNDING_MEMBER_CUTOFF_DATE = original
  })

  it("is false when the cutoff env var is unset", () => {
    delete process.env.FOUNDING_MEMBER_CUTOFF_DATE
    expect(isFoundingMember(new Date("2020-01-01"))).toBe(false)
  })

  it("is true before the cutoff and false after", () => {
    process.env.FOUNDING_MEMBER_CUTOFF_DATE = "2026-06-01"
    expect(isFoundingMember(new Date("2026-05-01"))).toBe(true)
    expect(isFoundingMember(new Date("2026-07-01"))).toBe(false)
  })
})
