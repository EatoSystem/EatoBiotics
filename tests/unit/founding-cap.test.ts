import { describe, it, expect } from "vitest"
import { hasFoundersCapReached, FOUNDERS_CAP } from "@/lib/founding"

describe("founding cap logic", () => {
  it("is false below the cap", () => {
    expect(hasFoundersCapReached(0)).toBe(false)
    expect(hasFoundersCapReached(FOUNDERS_CAP - 1)).toBe(false)
  })
  it("is true at the cap", () => {
    expect(hasFoundersCapReached(FOUNDERS_CAP)).toBe(true)
  })
  it("is true above the cap", () => {
    expect(hasFoundersCapReached(FOUNDERS_CAP + 1)).toBe(true)
  })
  it("is false for null/undefined/negative", () => {
    expect(hasFoundersCapReached(null as any)).toBe(false)
    expect(hasFoundersCapReached(undefined as any)).toBe(false)
    expect(hasFoundersCapReached(-5)).toBe(false)
  })
})

