/**
 * The three things EatoBiotics currently sells, asserted once.
 *
 * Every price here is IMPORTED from the module that owns it. Re-literalling 49
 * or 24.99 in a test is the failure mode this file exists to prevent: it makes
 * the suite agree with itself while the site says something else, and the test
 * then passes through exactly the change it was written to catch.
 *
 *     lib/product-vocabulary.ts   the names          (leaf, zero imports)
 *     lib/report/offer.ts         REPORT_PRICE_EUR   the €49 Consultation
 *     lib/membership-tiers.ts     MEMBER_PRICE_EUR   the €24.99 Member
 *
 * There is no fourth source, and no pricing framework. If a price needs to
 * change, it changes in one place and this test follows it there.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import {
  FOOD_SYSTEM_ASSESSMENT,
  PERSONAL_CONSULTATION,
  PERSONAL_REPORT,
  MEMBER,
  BIOTICS_SCORE,
  MEAL_BIOTICS_SCORE,
  BIOTICS,
  ACTIONS,
} from "@/lib/product-vocabulary"
import { REPORT_PRICE_EUR } from "@/lib/report/offer"
import { MEMBER_PRICE_EUR, PAID_TIERS, isPaidTierName } from "@/lib/membership-tiers"
import { TIER_META } from "@/lib/membership"

describe("the current commercial model", () => {
  it("names the free product, and what it produces", () => {
    expect(FOOD_SYSTEM_ASSESSMENT).toBe("Food System Assessment")
    expect(BIOTICS_SCORE).toBe("Biotics Score™")
    // The product is not its output, and not either retired name for it.
    expect(FOOD_SYSTEM_ASSESSMENT).not.toBe(BIOTICS_SCORE)
    expect(FOOD_SYSTEM_ASSESSMENT).not.toMatch(/snapshot|food system score/i)
  })

  it("prices the one-time product at the Consultation source", () => {
    expect(PERSONAL_CONSULTATION).toBe("Personal Food System Consultation")
    expect(REPORT_PRICE_EUR).toBe(49)
    // The Consultation is the SKU; the Report is what it produces.
    expect(PERSONAL_REPORT).toBe("Personal Food System Report")
  })

  it("prices Member at the membership source, with no second definition", () => {
    expect(MEMBER).toBe("EatoBiotics Member")
    expect(MEMBER_PRICE_EUR).toBe(24.99)
    // TIER_META derives from it rather than restating it — this is the check
    // that catches the two drifting apart.
    expect(TIER_META.member.priceMonthly).toBe(MEMBER_PRICE_EUR)
    expect(TIER_META.member.price).toBe(`€${MEMBER_PRICE_EUR}/mo`)
    expect(TIER_META.member.label).toBe("Member")
  })

  it("keeps the two frameworks apart", () => {
    expect([...BIOTICS]).toEqual(["Prebiotics", "Probiotics", "Postbiotics"])
    expect([...ACTIONS]).toEqual(["Feed", "Seed", "Regenerate"])
    // No name may appear in both lists — the moment one does, an action has
    // become a score or a score has become an action.
    for (const a of ACTIONS) expect(BIOTICS as readonly string[]).not.toContain(a)
    // And "Regenerates" is never the label.
    for (const a of ACTIONS) expect(a).not.toMatch(/s$/)
  })

  it("keeps the person's score and a meal's score distinct", () => {
    expect(MEAL_BIOTICS_SCORE).toBe("Meal Biotics Score")
    expect(MEAL_BIOTICS_SCORE).not.toBe(BIOTICS_SCORE)
    // The meal score carries no ™ — that mark belongs to the person's score.
    expect(MEAL_BIOTICS_SCORE).not.toContain("™")
  })

  it("keeps legacy tiers entitled but unsellable", () => {
    // Both halves. Dropping them from PAID_TIERS would present an upsell to
    // someone already paying; presenting them as an offer would sell a product
    // that no longer exists.
    for (const legacy of ["grow", "restore", "transform"]) {
      expect(PAID_TIERS as readonly string[]).toContain(legacy)
      expect(isPaidTierName(legacy)).toBe(true)
    }
    expect(isPaidTierName("member")).toBe(true)
    expect(isPaidTierName("free")).toBe(false)
  })

  it("keeps the vocabulary module importable from a client component", () => {
    // The whole reason it is a leaf. A single import here would let a
    // service-role Supabase client reach the browser bundle again — the exact
    // regression lib/membership-tiers.ts was split out to fix.
    const src = readFileSync("lib/product-vocabulary.ts", "utf8")
    expect(src).not.toMatch(/^\s*import\s/m)
    expect(src).not.toMatch(/process\.env/)
  })
})

describe("no current surface sells a retired plan", () => {
  it("quotes no retired price on the current-offer surfaces", () => {
    // €9.99 was Grow. There is no current €9.99 offer at all, so a live
    // commercial surface quoting it is quoting a retired plan.
    const surfaces = [
      "app/page.tsx",
      "components/home/membership-teaser.tsx",
      "app/pricing/page.tsx",
      "app/pricing/pricing-client.tsx",
      "components/analyse/free-scan-upsell.tsx",
      "components/account/report-bridge-card.tsx",
      "components/account/day8-challenge-card.tsx",
      "app/api/email/nurture/route.ts",
    ]
    for (const f of surfaces) {
      const src = readFileSync(f, "utf8")
      // Strip block comments: two of these files EXPLAIN the retired ladder
      // they replaced, and that explanation is the reason the change is
      // reviewable. A rule that deleted it would be optimising for silence.
      const live = src.replace(/\/\*[\s\S]*?\*\//g, "")
      expect(live, `${f} must not quote the retired €9.99 price`).not.toMatch(/€\s?9\.99/)
      expect(live, `${f} must not sell a retired plan`).not.toMatch(
        /\b(start|see|join|upgrade to)\s+(grow|restore|transform)\b/i,
      )
    }
  })
})
