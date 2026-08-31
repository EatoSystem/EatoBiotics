import { describe, it, expect } from "vitest"
import { getPercentile } from "@/lib/percentile"

describe("getPercentile", () => {
  it("returns ~50 at the distribution mean (55)", () => {
    expect(getPercentile(55)).toBe(50)
  })

  it("is monotonically increasing with score", () => {
    expect(getPercentile(80)).toBeGreaterThan(getPercentile(55))
    expect(getPercentile(55)).toBeGreaterThan(getPercentile(30))
  })

  it("clamps to the 1–99 range", () => {
    expect(getPercentile(-100)).toBe(1)
    expect(getPercentile(1000)).toBe(99)
  })
})

/*
 * The getPercentileLabel suite is gone with the function. It asserted the exact
 * sentence — "You scored higher than N% of people with typical eating habits" —
 * that this pass removed from every customer surface, so keeping it would have
 * been a test pinning a claim the product no longer makes.
 *
 * The maths tests above stay: the value still feeds analytics and share-URL
 * compatibility, and it should keep behaving predictably there.
 */
