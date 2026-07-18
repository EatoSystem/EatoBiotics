/**
 * /api/reviews — the Loyalty capture. Handler-level tests: auth on POST,
 * one-row-per-member upsert with approved=false, and GET exposing an aggregate
 * plus APPROVED quotes only (never unmoderated text).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

let sessionUser: { id: string } | null = null
vi.mock("@/lib/supabase-server", () => ({ getUser: async () => sessionUser }))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 }),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: () => ({ body: { error: "rate limited" }, init: { status: 429 } }),
}))

/** Per-test control: rows the two GET selects return, and an upsert spy. */
let ratingRows: { rating: number }[] = []
let approvedQuoteRows: { quote: string; rating: number }[] = []
const upsertSpy = vi.fn(async (_payload: unknown, _opts: unknown) => ({ error: null }))

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => {
      // Track which select() shape we're in so the terminal await returns the
      // right rows: `.select("rating")` → ratings; anything with .eq() → quotes.
      let quotesPath = false
      const builder: Record<string, unknown> = {}
      Object.assign(builder, {
        select: (cols: string) => { quotesPath = cols.includes("quote"); return builder },
        eq: () => builder,
        not: () => builder,
        order: () => builder,
        limit: async () => ({ data: quotesPath ? approvedQuoteRows : ratingRows, error: null }),
        upsert: upsertSpy,
      })
      return builder
    },
  }),
}))

async function load() {
  return import("@/app/api/reviews/route")
}
function post(body: unknown) {
  return new NextRequest("http://localhost/api/reviews", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  })
}
function get() {
  return new NextRequest("http://localhost/api/reviews", { method: "GET" })
}

beforeEach(() => {
  sessionUser = null
  ratingRows = []
  approvedQuoteRows = []
  upsertSpy.mockClear()
})

describe("/api/reviews POST", () => {
  it("401s when not signed in", async () => {
    const { POST } = await load()
    expect((await POST(post({ rating: 5 }))).status).toBe(401)
    expect(upsertSpy).not.toHaveBeenCalled()
  })

  it("400s on an out-of-range rating", async () => {
    sessionUser = { id: "u1" }
    const { POST } = await load()
    expect((await POST(post({ rating: 7 }))).status).toBe(400)
  })

  it("upserts one row per member with approved=false", async () => {
    sessionUser = { id: "u1" }
    const { POST } = await load()
    const res = await POST(post({ rating: 4, quote: "Love the daily ritual", source: "meal" }))
    expect(res.status).toBe(200)
    expect(upsertSpy).toHaveBeenCalledTimes(1)
    const [payload, opts] = upsertSpy.mock.calls[0] as [Record<string, unknown>, Record<string, unknown>]
    expect(payload.user_id).toBe("u1")
    expect(payload.rating).toBe(4)
    expect(payload.quote).toBe("Love the daily ritual")
    expect(payload.approved).toBe(false) // never public without moderation
    expect(opts.onConflict).toBe("user_id") // one row per member
  })
})

describe("/api/reviews GET", () => {
  it("returns an aggregate and only approved quotes", async () => {
    ratingRows = [{ rating: 5 }, { rating: 4 }, { rating: 3 }]
    approvedQuoteRows = [{ quote: "Changed how I eat", rating: 5 }]
    const { GET } = await load()
    const res = await GET(get())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.count).toBe(3)
    expect(body.average).toBe(4) // (5+4+3)/3
    expect(body.testimonials).toEqual([{ quote: "Changed how I eat", rating: 5 }])
  })

  it("returns empty (not an error) when there are no reviews", async () => {
    const { GET } = await load()
    const body = await (await GET(get())).json()
    expect(body).toEqual({ count: 0, average: null, testimonials: [] })
  })
})
