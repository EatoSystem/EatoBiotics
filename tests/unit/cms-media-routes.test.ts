import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

/* The media routes inherit the Content Studio fail-closed gate: unauthorised
   callers get a uniform 404 and the database/storage is never touched on that
   path. Mirrors tests/unit/cms-auth.test.ts for the media surface. */

const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.unstubAllEnvs()
})

function req(url: string, cookie?: string, body?: unknown): NextRequest {
  const headers: Record<string, string> = {}
  if (cookie) headers.cookie = `admin_auth=${cookie}`
  if (body !== undefined) headers["content-type"] = "application/json"
  return new NextRequest(`http://localhost${url}`, {
    method: body !== undefined ? "POST" : "GET",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

describe("/api/cms/media fail-closed gate", () => {
  it("GET list returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/media/route")
    const res = await GET(req("/api/cms/media"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("upload-url returns 404 with a wrong cookie and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { POST } = await import("@/app/api/cms/media/upload-url/route")
    const res = await POST(req("/api/cms/media/upload-url", "wrong", { filename: "x.png", mime: "image/png", size: 10 }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { GET } = await import("@/app/api/cms/media/route")
    const res = await GET(req("/api/cms/media", "any-cookie"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { GET } = await import("@/app/api/cms/media/route")
    const res = await GET(req("/api/cms/media", adminCookieToken() as string))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })

  it("upload-url rejects a disallowed type for an authenticated admin (validation before any storage call)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const createSignedUploadUrl = vi.fn()
    mockGetSupabase.mockReturnValue({ storage: { from: () => ({ createSignedUploadUrl }) } })
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/media/upload-url/route")
    const res = await POST(req("/api/cms/media/upload-url", adminCookieToken() as string, { filename: "x.svg", mime: "image/svg+xml", size: 100 }))
    expect(res.status).toBe(400)
    expect(createSignedUploadUrl).not.toHaveBeenCalled()
  })
})
