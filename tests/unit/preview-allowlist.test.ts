import { describe, it, expect } from "vitest"
import { isEnterRoute } from "@/proxy"

describe("preview gate allowlist", () => {
  it("allows Founding 100 routes", () => {
    expect(isEnterRoute("/apply")).toBe(true)
    expect(isEnterRoute("/api/founding/apply")).toBe(true)
    expect(isEnterRoute("/api/founding/unlock")).toBe(true)
  })
  it("allows public metadata routes", () => {
    expect(isEnterRoute("/robots.txt")).toBe(true)
    expect(isEnterRoute("/sitemap.xml")).toBe(true)
    expect(isEnterRoute("/manifest.json")).toBe(true)
    expect(isEnterRoute("/opengraph-image")).toBe(true)
    expect(isEnterRoute("/opengraph-image/some/route")).toBe(true)
  })
  it("still allows existing waitlist routes", () => {
    expect(isEnterRoute("/enter")).toBe(true)
    expect(isEnterRoute("/waitlist")).toBe(true)
    expect(isEnterRoute("/api/waitlist")).toBe(true)
    expect(isEnterRoute("/api/enter")).toBe(true)
  })
})

