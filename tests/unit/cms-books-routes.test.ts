import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"

/* The books/chapters routes inherit the Content Studio fail-closed gate:
   unauthorised callers get a uniform 404 and the database is never touched
   on that path. Mirrors tests/unit/cms-media-routes.test.ts for the
   books/chapters surface. */

const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
})
afterEach(() => {
  vi.unstubAllEnvs()
})

function req(url: string, opts: { cookie?: string; method?: string; body?: unknown } = {}): NextRequest {
  const { cookie, method, body } = opts
  const headers: Record<string, string> = {}
  if (cookie) headers.cookie = `admin_auth=${cookie}`
  if (body !== undefined) headers["content-type"] = "application/json"
  return new NextRequest(`http://localhost${url}`, {
    method: method ?? (body !== undefined ? "POST" : "GET"),
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

const params = (id: string) => ({ params: Promise.resolve({ id }) })

describe("/api/cms/books fail-closed gate", () => {
  it("GET list returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/books/route")
    const res = await GET(req("/api/cms/books"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("POST returns 404 with a wrong cookie and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { POST } = await import("@/app/api/cms/books/route")
    const res = await POST(req("/api/cms/books", { cookie: "wrong", body: { title: "x" } }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { GET } = await import("@/app/api/cms/books/route")
    const res = await GET(req("/api/cms/books", { cookie: "any-cookie" }))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { GET } = await import("@/app/api/cms/books/route")
    const res = await GET(req("/api/cms/books", { cookie: adminCookieToken() as string }))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})

describe("/api/cms/books/[id] fail-closed gate", () => {
  it("GET returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/books/[id]/route")
    const res = await GET(req("/api/cms/books/abc"), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { PATCH } = await import("@/app/api/cms/books/[id]/route")
    const res = await PATCH(req("/api/cms/books/abc", { cookie: "any-cookie", method: "PATCH", body: { subtitle: "x" } }), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { DELETE } = await import("@/app/api/cms/books/[id]/route")
    const res = await DELETE(req("/api/cms/books/abc", { cookie: adminCookieToken() as string, method: "DELETE" }), params("abc"))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})

describe("/api/cms/books/[id]/chapters fail-closed gate", () => {
  it("GET returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/books/[id]/chapters/route")
    const res = await GET(req("/api/cms/books/abc/chapters"), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/route")
    const res = await POST(
      req("/api/cms/books/abc/chapters", { cookie: "any-cookie", body: { title: "x", chapter_number: 1 } }),
      params("abc")
    )
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("rejects an invalid publication_target for an authenticated admin (validation before any DB write)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const from = vi.fn()
    mockGetSupabase.mockReturnValue({ from })
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/route")
    const res = await POST(
      req("/api/cms/books/abc/chapters", {
        cookie: adminCookieToken() as string,
        body: { title: "x", chapter_number: 1, publication_target: ["kindle"] },
      }),
      params("abc")
    )
    expect(res.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { GET } = await import("@/app/api/cms/books/[id]/chapters/route")
    const res = await GET(req("/api/cms/books/abc/chapters", { cookie: adminCookieToken() as string }), params("abc"))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})

describe("/api/cms/chapters/[id] fail-closed gate", () => {
  it("GET returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { GET } = await import("@/app/api/cms/chapters/[id]/route")
    const res = await GET(req("/api/cms/chapters/abc"), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { PATCH } = await import("@/app/api/cms/chapters/[id]/route")
    const res = await PATCH(req("/api/cms/chapters/abc", { cookie: "any-cookie", method: "PATCH", body: { chapter_number: 2 } }), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("rejects an invalid publication_target for an authenticated admin (validation before any DB write)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const from = vi.fn()
    mockGetSupabase.mockReturnValue({ from })
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { PATCH } = await import("@/app/api/cms/chapters/[id]/route")
    const res = await PATCH(
      req("/api/cms/chapters/abc", { cookie: adminCookieToken() as string, method: "PATCH", body: { publication_target: ["kindle"] } }),
      params("abc")
    )
    expect(res.status).toBe(400)
    expect(from).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { GET } = await import("@/app/api/cms/chapters/[id]/route")
    const res = await GET(req("/api/cms/chapters/abc", { cookie: adminCookieToken() as string }), params("abc"))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})

describe("/api/cms/content book_id/chapter_id passthrough", () => {
  it("passes book_id and chapter_id through to the insert payload when provided", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const bookId = "11111111-1111-1111-1111-111111111111"
    const chapterId = "22222222-2222-2222-2222-222222222222"
    const insertedRows: Record<string, unknown>[] = []
    const chain = {
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
        single: () => Promise.resolve({ data: { id: "new-id", slug: "x" }, error: null }),
      }),
    }
    const from = vi.fn(() => ({
      select: chain.select,
      insert: (row: Record<string, unknown>) => {
        insertedRows.push(row)
        return { select: () => ({ single: () => Promise.resolve({ data: { id: "new-id", slug: "x" }, error: null }) }) }
      },
    }))
    mockGetSupabase.mockReturnValue({ from })
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/content/route")
    const res = await POST(
      req("/api/cms/content", {
        cookie: adminCookieToken() as string,
        body: { title: "Extract", content_type: "chapter_extract", book_id: bookId, chapter_id: chapterId },
      })
    )
    expect(res.status).toBe(201)
    expect(insertedRows[0]?.book_id).toBe(bookId)
    expect(insertedRows[0]?.chapter_id).toBe(chapterId)
  })
})
