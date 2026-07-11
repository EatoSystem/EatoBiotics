import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

/* Guards the Content Studio's fail-closed access model:
   1. The edge (Web Crypto) admin-token derivation used by the proxy.ts
      default-deny agrees byte-for-byte with the node derivation used by
      /api/admin/login — a divergence would lock admins out or let them in
      inconsistently.
   2. Both derivations fail closed with no secret configured.
   3. /api/cms routes return a uniform 404 to unauthorised callers and never
      touch the database on that path. */

const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("edge/node admin token agreement", () => {
  it("derives identical tokens for the same secret", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { adminCookieTokenEdge, verifyAdminCookieEdge } = await import("@/lib/admin-auth-edge")

    const nodeToken = adminCookieToken()
    const edgeToken = await adminCookieTokenEdge()
    expect(nodeToken).toBeTruthy()
    expect(edgeToken).toBe(nodeToken)
    expect(await verifyAdminCookieEdge(nodeToken as string)).toBe(true)
    expect(await verifyAdminCookieEdge("wrong-token")).toBe(false)
  })

  it("fails closed with no secret configured", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { adminCookieTokenEdge, verifyAdminCookieEdge } = await import("@/lib/admin-auth-edge")
    expect(await adminCookieTokenEdge()).toBeNull()
    expect(await verifyAdminCookieEdge("anything")).toBe(false)
    expect(await verifyAdminCookieEdge(undefined)).toBe(false)
  })
})

describe("/api/cms guard", () => {
  function reqWithCookie(cookie?: string): NextRequest {
    const headers: Record<string, string> = {}
    if (cookie) headers.cookie = `admin_auth=${cookie}`
    return new NextRequest("http://localhost/api/cms/content", { headers })
  }

  it("unauthenticated callers get 404 and the database is never touched", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/content/route")
    const res = await GET(reqWithCookie(undefined))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a wrong cookie gets the same 404 (no existence leak)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/content/route")
    const res = await GET(reqWithCookie("not-the-token"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { GET } = await import("@/app/api/cms/content/route")
    const res = await GET(reqWithCookie("any-cookie-value"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database, proving the gate was the only barrier)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { GET } = await import("@/app/api/cms/content/route")
    const res = await GET(reqWithCookie(adminCookieToken() as string))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})
