import { describe, it, expect, vi, afterEach } from "vitest"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

afterEach(() => {
  vi.useRealTimers()
})

describe("rateLimit", () => {
  it("allows requests up to the limit then blocks", () => {
    const key = `test:${Math.random()}`
    const limit = 3
    const window = 60_000

    for (let i = 0; i < limit; i++) {
      expect(rateLimit(key, limit, window).allowed).toBe(true)
    }
    const blocked = rateLimit(key, limit, window)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
  })

  it("decrements remaining on each allowed request", () => {
    const key = `test:${Math.random()}`
    expect(rateLimit(key, 5, 60_000).remaining).toBe(4)
    expect(rateLimit(key, 5, 60_000).remaining).toBe(3)
  })

  it("resets after the window elapses", () => {
    vi.useFakeTimers()
    const key = `test:${Math.random()}`
    expect(rateLimit(key, 1, 1_000).allowed).toBe(true)
    expect(rateLimit(key, 1, 1_000).allowed).toBe(false)

    vi.advanceTimersByTime(1_001)
    expect(rateLimit(key, 1, 1_000).allowed).toBe(true)
  })
})

describe("getClientIp", () => {
  it("uses the first entry of x-forwarded-for", () => {
    const req = new Request("https://x.test", {
      headers: { "x-forwarded-for": "203.0.113.7, 70.41.3.18" },
    })
    expect(getClientIp(req)).toBe("203.0.113.7")
  })

  it("falls back to x-real-ip then 'unknown'", () => {
    const withReal = new Request("https://x.test", { headers: { "x-real-ip": "198.51.100.2" } })
    expect(getClientIp(withReal)).toBe("198.51.100.2")

    const none = new Request("https://x.test")
    expect(getClientIp(none)).toBe("unknown")
  })
})
