import { describe, it, expect } from "vitest"
import { getPercentile, getPercentileLabel } from "@/lib/percentile"

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

describe("getPercentileLabel", () => {
  it("embeds the percentile in a readable sentence", () => {
    const label = getPercentileLabel(55)
    expect(label).toContain("50%")
    expect(label).toMatch(/scored higher than/i)
  })
})
