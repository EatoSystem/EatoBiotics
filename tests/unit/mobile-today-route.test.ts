/**
 * GET /api/mobile/v1/today — dual-surface auth + schema-valid body.
 *
 * Same harness as tests/unit/twin-state-route.test.ts: real getUserFromRequest,
 * mocks at the package boundary. Composition is stubbed so this file owns
 * auth posture; composeMobileTodayFrom is tested separately.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { mobileTodayResponseSchema } from "@eatobiotics/contracts"

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key"

const VALID_TOKEN = "valid-mobile-access-token"
const BEARER_USER = { id: "bearer-user-1", email: "member@example.com" }
let cookieUser: { id: string; email: string } | null = null

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

const PAYLOAD = {
  bioticsScore: 74,
  streak: { current: 1, longest: 3, loggedToday: true, daysSinceLast: 0 },
  ritualToday: { fermented: true, plants: false, moved: false, slept: false, feeling: true },
  recentActivity: [
    { kind: "meal" as const, at: "2026-10-07T08:00:00.000Z", summary: "Oat bowl", mealBioticsScore: 62 },
  ],
  nextStep: { kind: "reviewed-material" as const, copy: "Feed · Seed · Rejuvenate — how a person acts, not a ranking of what to do today." },
  entitlementTier: "member" as const,
}

vi.mock("@/lib/mobile/compose-today", () => ({
  composeMobileToday: async () => PAYLOAD,
}))

async function get(opts: { headers?: Record<string, string> } = {}) {
  const route = await import("@/app/api/mobile/v1/today/route")
  const req = new NextRequest("http://localhost/api/mobile/v1/today", {
    method: "GET",
    headers: opts.headers,
  })
  return route.GET(req)
}

beforeEach(() => {
  cookieUser = null
})

describe("/api/mobile/v1/today auth surfaces", () => {
  it("401s with no cookie and no bearer", async () => {
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("401s with a bad bearer token", async () => {
    const res = await get({ headers: { Authorization: "Bearer not-valid" } })
    expect(res.status).toBe(401)
  })

  it("returns a schema-valid body for a bearer session", async () => {
    const res = await get({ headers: { Authorization: `Bearer ${VALID_TOKEN}` } })
    expect(res.status).toBe(200)
    const json = await res.json()
    const parsed = mobileTodayResponseSchema.parse(json)
    expect(parsed.bioticsScore).toBe(74)
    expect(parsed.entitlementTier).toBe("member")
    expect("prebiotic_score" in parsed).toBe(false)
  })

  it("returns a schema-valid body for a cookie session", async () => {
    cookieUser = { id: "cookie-user-1", email: "web@example.com" }
    const res = await get()
    expect(res.status).toBe(200)
    const parsed = mobileTodayResponseSchema.parse(await res.json())
    expect(parsed.nextStep.kind).toBe("reviewed-material")
  })
})
