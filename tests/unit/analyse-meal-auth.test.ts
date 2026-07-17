/**
 * /api/analyse-meal dual-surface auth (mobile Phase C contract).
 *
 * Exercises the REAL getUserFromRequest (bearer-header parsing + cookie
 * fallback) by mocking at the package boundary — @supabase/supabase-js for
 * the bearer path, @supabase/ssr + next/headers for the cookie path — and
 * stubbing the route's expensive dependencies (Claude, service-role DB,
 * rate limit) so the handler runs end-to-end in-process.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

// getUserFromRequest's bearer path reads these at call time and fails closed
// (null) when they're absent — stub them so the test doesn't depend on CI env.
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key"

const VALID_TOKEN = "valid-mobile-access-token"
const BEARER_USER = { id: "bearer-user-1" }

/** Toggled per test to simulate a signed-in / signed-out web session cookie. */
let cookieUser: { id: string } | null = null

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    auth: {
      getUser: async (token?: string) =>
        token === VALID_TOKEN ? { data: { user: BEARER_USER } } : { data: { user: null } },
    },
  }),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => ({ data: { user: cookieUser } }) },
  }),
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}))

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 19, resetAt: Date.now() + 60_000 }),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: () => ({ body: { error: "rate limited" }, init: { status: 429 } }),
}))

vi.mock("@/lib/membership", () => ({
  getUserMembershipTier: async () => "grow",
}))

const CLAUDE_RESULT = {
  meal_name: "Test bowl",
  meal_type: "Lunch",
  biotics_score: 80,
  prebiotic_score: 85,
  probiotic_score: 70,
  postbiotic_score: 60,
  quality_diversity: 75,
  quality_anti_inflammatory: 65,
  nutrition: { calories: 500, protein: 30, carbs: 40, fat: 20, fibre: 10 },
  insight: "Strong prebiotic base.",
  tags: ["Plant Diversity"],
}

/** Settable per test — what the mocked Claude call returns. */
let claudeOutput: unknown = CLAUDE_RESULT

vi.mock("@/lib/anthropic", () => ({
  CLAUDE_MODEL: "claude-test",
  anthropic: {
    messages: {
      create: async () => ({ content: [{ type: "text", text: JSON.stringify(claudeOutput) }] }),
    },
  },
}))

/** Spy: counts analyses inserts so tests can assert nothing was persisted. */
const insertSpy = vi.fn()

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => {
    // One chainable builder covers both usages in the route: the daily-cap
    // count query (awaited directly — thenable) and insert().select().single().
    const builder: Record<string, unknown> = {}
    Object.assign(builder, {
      select: () => builder,
      eq: () => builder,
      gte: () => builder,
      insert: (...args: unknown[]) => {
        insertSpy(...args)
        return builder
      },
      single: async () => ({ data: { id: "row-1", created_at: "2026-07-16T00:00:00Z" }, error: null }),
      then: (resolve: (v: unknown) => unknown) => Promise.resolve({ count: 0 }).then(resolve),
    })
    return { from: () => builder }
  },
}))

// Dynamic import (not top-level await — tsconfig's module setting rejects it)
// so the route loads after the vi.mock declarations above are registered.
async function post(req: NextRequest) {
  const { POST } = await import("@/app/api/analyse-meal/route")
  return POST(req)
}

function request(headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/analyse-meal", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ description: "porridge with berries" }),
  })
}

beforeEach(() => {
  cookieUser = null
  claudeOutput = CLAUDE_RESULT
  insertSpy.mockClear()
})

describe("/api/analyse-meal auth surfaces", () => {
  it("401s with no bearer header and no session cookie", async () => {
    const res = await post(request())
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: "Unauthorised" })
  })

  it("200s with a valid bearer token (mobile path)", async () => {
    const res = await post(request({ Authorization: `Bearer ${VALID_TOKEN}` }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.meal_name).toBe("Test bowl")
    expect(body.biotics_score).toBe(80)
    expect(body.id).toBe("row-1") // persisted row id round-trips
  })

  it("401s with an invalid bearer token (no silent cookie fallback for bad tokens)", async () => {
    cookieUser = { id: "cookie-user-1" } // even with a live session cookie present
    const res = await post(request({ Authorization: "Bearer wrong-token" }))
    expect(res.status).toBe(401)
  })

  it("200s with a session cookie and no bearer header (web path unchanged)", async () => {
    cookieUser = { id: "cookie-user-1" }
    const res = await post(request())
    expect(res.status).toBe(200)
    expect((await res.json()).meal_name).toBe("Test bowl")
  })
})

describe("/api/analyse-meal graceful ambiguity", () => {
  it("422s on an unreadable input, persists nothing, and consumes no cap slot", async () => {
    cookieUser = { id: "cookie-user-1" }
    claudeOutput = { error: "Could not identify foods in this image. Please try a clearer photo of your meal." }
    const res = await post(request())
    expect(res.status).toBe(422)
    expect(await res.json()).toEqual({
      error: "Could not identify foods in this image. Please try a clearer photo of your meal.",
      unreadable: true,
    })
    expect(insertSpy).not.toHaveBeenCalled() // no analyses row → no daily-cap slot consumed
  })

  it("still persists a row on a readable input (regression guard for the spy wiring)", async () => {
    cookieUser = { id: "cookie-user-1" }
    const res = await post(request())
    expect(res.status).toBe(200)
    expect(insertSpy).toHaveBeenCalledTimes(1)
  })
})
