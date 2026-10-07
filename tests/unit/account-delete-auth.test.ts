/**
 * /api/account/delete dual-surface auth (P5 store deletion path).
 *
 * Real getUserFromRequest, mocks at the package boundary. Erasure ordering
 * stays in tests/unit/account-data-rights.test.ts; this file owns 401 vs
 * proceeding for cookie and bearer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "https://test.supabase.co"
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key"

const VALID_TOKEN = "valid-mobile-access-token"
const BEARER_USER = { id: "bearer-user-1", email: "member@example.com" }
let cookieUser: { id: string; email: string } | null = null
const authDeletes: string[] = []

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

function chain() {
  const c: Record<string, unknown> = {}
  c.select = () => c
  c.delete = () => c
  c.eq = () => c
  c.or = () => c
  c.in = () => c
  c.single = () => Promise.resolve({ data: [], error: null })
  c.then = (resolve: (v: unknown) => void) =>
    resolve({ data: [{ stripe_session_id: "cs_test_auth" }], error: null })
  return c
}

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => chain(),
    storage: { from: () => ({ remove: async () => ({ error: null }) }) },
    auth: {
      admin: {
        deleteUser: async (id: string) => {
          authDeletes.push(id)
          return { error: null }
        },
      },
    },
  }),
}))

async function call(opts: { headers?: Record<string, string> } = {}) {
  const { DELETE } = await import("@/app/api/account/delete/route")
  const req = new NextRequest("http://localhost/api/account/delete", {
    method: "DELETE",
    headers: opts.headers,
  })
  return DELETE(req)
}

beforeEach(() => {
  cookieUser = null
  authDeletes.length = 0
})

describe("/api/account/delete auth surfaces", () => {
  it("401s with no cookie and no bearer", async () => {
    const res = await call()
    expect(res.status).toBe(401)
    expect(authDeletes).toEqual([])
  })

  it("401s with a bad bearer token", async () => {
    const res = await call({ headers: { Authorization: "Bearer not-valid" } })
    expect(res.status).toBe(401)
    expect(authDeletes).toEqual([])
  })

  it("closes the account for a bearer session", async () => {
    const res = await call({ headers: { Authorization: `Bearer ${VALID_TOKEN}` } })
    expect(res.status).toBe(200)
    expect(authDeletes).toEqual(["bearer-user-1"])
  })

  it("still closes the account for a web cookie session", async () => {
    cookieUser = { id: "cookie-user-1", email: "web@example.com" }
    const res = await call()
    expect(res.status).toBe(200)
    expect(authDeletes).toEqual(["cookie-user-1"])
  })
})
