import { describe, it, expect, afterEach } from "vitest"
import { canAccess, tierFromPriceId, isFoundingMember, TIER_META } from "@/lib/membership"

describe("canAccess", () => {
  it("grants AI consultation to the single membership (and legacy transform), not free", () => {
    expect(canAccess("member", "ai_consultation")).toBe(true)
    expect(canAccess("trial", "ai_consultation")).toBe(true)
    expect(canAccess("transform", "ai_consultation")).toBe(true)
    expect(canAccess("free", "ai_consultation")).toBe(false)
  })

  it("grants unlimited analyses to every paid tier but not free", () => {
    for (const tier of ["grow", "restore", "transform", "trial", "member"] as const) {
      expect(canAccess(tier, "unlimited_analyses")).toBe(true)
    }
    expect(canAccess("free", "unlimited_analyses")).toBe(false)
  })

  it("gives the single membership full access — incl. premium features", () => {
    for (const feature of ["ai_consultation", "weekly_checkin", "weekly_meal_plans", "score_history_90"] as const) {
      expect(canAccess("member", feature)).toBe(true)
    }
  })

  it("makes the trial mirror member except the founding-member badge", () => {
    expect(canAccess("trial", "weekly_checkin")).toBe(true)
    expect(canAccess("trial", "score_history_90")).toBe(true)
    expect(canAccess("trial", "founding_member")).toBe(false)
    expect(canAccess("member", "founding_member")).toBe(true)
  })

  it("leaves legacy grow as a base tier (no 90-day history)", () => {
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
