/**
 * /api/twin-state — handler-level tests for the mobile sync contract.
 *
 * Same harness as tests/unit/analyse-meal-auth.test.ts: real route handler,
 * real getUserFromRequest, mocks at the package boundary. Locks down the
 * semantics both clients (web + mobile app) depend on: dual-surface auth,
 * incoming-day-wins merge, 35-day prune, milestone union, and the 5-key
 * ritual round-trip (the schema regression that once silently dropped
 * moved/slept from cross-device sync).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key"

const VALID_TOKEN = "valid-mobile-access-token"
const BEARER_USER = { id: "bearer-user-1" }
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

/** Controlled per test: the user's existing twin_state row. */
let existingRow: { rituals: Record<string, unknown>; milestones_seen: string[] } | null = null
/** Captures the merged upsert payload. */
const upsertSpy = vi.fn(async (_payload: unknown) => ({ error: null }))

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existingRow }) }) }),
      upsert: upsertSpy,
    }),
  }),
}))

async function call(method: "GET" | "PUT", opts: { headers?: Record<string, string>; body?: unknown } = {}) {
  const route = await import("@/app/api/twin-state/route")
  const req = new NextRequest("http://localhost/api/twin-state", {
    method,
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...(opts.body !== undefined ? { body: JSON.stringify(opts.body) } : {}),
  })
  return method === "GET" ? route.GET(req) : route.PUT(req)
}

const bearer = { Authorization: `Bearer ${VALID_TOKEN}` }

const fullDay = (v: boolean) => ({ fermented: v, plants: v, moved: v, slept: v, feeling: v })

/** A recent day key, n days back from now (safely inside the 35-day prune window). */
function dayKey(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

beforeEach(() => {
  cookieUser = null
  existingRow = null
  upsertSpy.mockClear()
})

describe("/api/twin-state auth surfaces", () => {
  it("401s GET and PUT with no auth", async () => {
    expect((await call("GET")).status).toBe(401)
    expect((await call("PUT", { body: {} })).status).toBe(401)
  })

  it("GET with a valid bearer token returns the stored state", async () => {
    existingRow = { rituals: { [dayKey(1)]: fullDay(true) }, milestones_seen: ["first_meal"] }
    const res = await call("GET", { headers: bearer })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      rituals: { [dayKey(1)]: fullDay(true) },
      milestonesSeen: ["first_meal"],
    })
  })

  it("GET with a session cookie returns empty defaults when no row exists", async () => {
    cookieUser = { id: "cookie-user-1" }
    const res = await call("GET")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ rituals: {}, milestonesSeen: [] })
  })
})

describe("/api/twin-state PUT merge semantics", () => {
  it("incoming day wins whole, other days survive, stale days are pruned, milestones union", async () => {
    const today = dayKey(0)
    const lastWeek = dayKey(7)
    existingRow = {
      rituals: {
        [today]: fullDay(false),        // server's stale copy of today — incoming must replace it whole
        [lastWeek]: fullDay(true),      // untouched by the push — must survive
        "2020-01-01": fullDay(true),    // far past the 35-day window — must be pruned
      },
      milestones_seen: ["a", "b"],
    }
    const incomingToday = { fermented: true, plants: true, moved: true, slept: false, feeling: true }

    const res = await call("PUT", {
      headers: bearer,
      body: { rituals: { [today]: incomingToday }, milestonesSeen: ["b", "c"] },
    })
    expect(res.status).toBe(200)

    expect(upsertSpy).toHaveBeenCalledTimes(1)
    const payload = upsertSpy.mock.calls[0][0] as unknown as {
      user_id: string
      rituals: Record<string, unknown>
      milestones_seen: string[]
    }
    expect(payload.user_id).toBe(BEARER_USER.id)
    expect(payload.rituals[today]).toEqual(incomingToday) // incoming day wins — including slept:false over server's copy
    expect(payload.rituals[lastWeek]).toEqual(fullDay(true))
    expect(payload.rituals["2020-01-01"]).toBeUndefined() // pruned
    expect(payload.milestones_seen).toEqual(["a", "b", "c"]) // unioned, order-stable

    // The response mirrors the merged state so clients can hydrate from it.
    const body = await res.json()
    expect(body.rituals[today]).toEqual(incomingToday)
    expect(body.milestonesSeen).toEqual(["a", "b", "c"])
  })

  it("round-trips all five ritual keys (moved/slept were once silently stripped)", async () => {
    const res = await call("PUT", {
      headers: bearer,
      body: { rituals: { [dayKey(0)]: fullDay(true) } },
    })
    expect(res.status).toBe(200)
    const payload = upsertSpy.mock.calls[0][0] as unknown as { rituals: Record<string, Record<string, boolean>> }
    expect(payload.rituals[dayKey(0)]).toEqual(fullDay(true))
  })

  it("400s on a malformed day key and writes nothing", async () => {
    const res = await call("PUT", {
      headers: bearer,
      body: { rituals: { "not-a-day": fullDay(true) } },
    })
    expect(res.status).toBe(400)
    expect(upsertSpy).not.toHaveBeenCalled()
  })
})
