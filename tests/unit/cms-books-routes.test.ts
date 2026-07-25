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

/* ── Minimal Supabase query-builder mock ───────────────────────────────────
   Enough to drive the books/chapters/content routes' real DB paths without a
   database. `tables` configures, per table, the result of a top-level
   .select() chain, an .insert(), and an .update(); `rpc` configures the swap
   function. Every insert/update/rpc call is recorded in `sink` so tests can
   assert exactly which writes did (or did NOT) happen. */
type QResult = { data?: unknown; error?: unknown }
interface Sink {
  inserts: { table: string; row: unknown }[]
  updates: { table: string; row: unknown }[]
  rpc: { name: string; args: unknown }[]
}
function qb(result: QResult) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b: any = {
    select: () => b,
    eq: () => b,
    neq: () => b,
    in: () => b,
    order: () => b,
    limit: () => b,
    maybeSingle: () => Promise.resolve(result),
    single: () => Promise.resolve(result),
    then: (onF: (v: QResult) => unknown, onR?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(onF, onR),
  }
  return b
}
interface TableCfg { select?: QResult; insert?: QResult; update?: QResult }
function makeClient(
  cfg: { tables: Record<string, TableCfg>; rpc?: QResult },
  sink: Sink
) {
  const from = vi.fn((table: string) => {
    const t = cfg.tables[table] ?? {}
    return {
      select: () => qb(t.select ?? { data: null }),
      insert: (row: unknown) => {
        sink.inserts.push({ table, row })
        return qb(t.insert ?? { data: null, error: null })
      },
      update: (row: unknown) => {
        sink.updates.push({ table, row })
        return qb(t.update ?? { error: null })
      },
    }
  })
  const rpc = vi.fn((name: string, args: unknown) => {
    sink.rpc.push({ name, args })
    return Promise.resolve(cfg.rpc ?? { error: null })
  })
  return { from, rpc }
}
function newSink(): Sink {
  return { inserts: [], updates: [], rpc: [] }
}
const UUID_A = "11111111-1111-1111-1111-111111111111"
const UUID_B = "22222222-2222-2222-2222-222222222222"
const UUID_C = "33333333-3333-3333-3333-333333333333"

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

/* ── Duplicate active chapter_number prevention ─────────────────────────── */
describe("/api/cms/books/[id]/chapters duplicate-number guard", () => {
  async function authedPost(body: unknown, tables: Record<string, TableCfg>) {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const sink = newSink()
    mockGetSupabase.mockReturnValue(makeClient({ tables }, sink))
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/route")
    const res = await POST(
      req("/api/cms/books/book-content/chapters", { cookie: adminCookieToken() as string, body }),
      params("book-content")
    )
    return { res, sink }
  }

  it("rejects a chapter_number already used by an active chapter (no partial record)", async () => {
    const { res, sink } = await authedPost(
      { title: "Dup", chapter_number: 2 },
      {
        cms_books: { select: { data: { id: "book1" } } },
        cms_chapters: {
          select: {
            data: [
              { id: "a", chapter_number: 1, cms_content: { status: "draft" } },
              { id: "b", chapter_number: 2, cms_content: { status: "draft" } },
            ],
          },
        },
      }
    )
    expect(res.status).toBe(409)
    // Nothing was written — no orphan content row, no chapter row.
    expect(sink.inserts).toHaveLength(0)
  })

  it("accepts a chapter_number free among active chapters (archived numbers freed)", async () => {
    const { res, sink } = await authedPost(
      { title: "New", chapter_number: 3 },
      {
        cms_books: { select: { data: { id: "book1" } } },
        cms_chapters: {
          select: {
            data: [
              { id: "a", chapter_number: 1, cms_content: { status: "draft" } },
              { id: "old", chapter_number: 3, cms_content: { status: "archived" } },
            ],
          },
          insert: { error: null },
        },
        cms_content: { select: { data: null }, insert: { data: { id: "new-id", slug: "new" }, error: null } },
        cms_audit_log: { insert: { error: null } },
      }
    )
    expect(res.status).toBe(201)
    expect(sink.inserts.some((i) => i.table === "cms_content")).toBe(true)
    expect(sink.inserts.some((i) => i.table === "cms_chapters")).toBe(true)
  })
})

describe("/api/cms/books/[id]/chapters/reorder fail-closed gate", () => {
  it("returns 404 unauthenticated and never touches the database", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/reorder/route")
    const res = await POST(req("/api/cms/books/abc/chapters/reorder", { body: { chapter_id: UUID_A, direction: 1 } }), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("fails closed when no admin secret is configured, even with a cookie", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "")
    vi.stubEnv("ADMIN_PASSWORD", "")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/reorder/route")
    const res = await POST(req("/api/cms/books/abc/chapters/reorder", { cookie: "any-cookie", body: { chapter_id: UUID_A, direction: 1 } }), params("abc"))
    expect(res.status).toBe(404)
    expect(mockGetSupabase).not.toHaveBeenCalled()
  })

  it("a valid admin cookie passes the gate (503 without a database)", async () => {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    mockGetSupabase.mockReturnValue(null)
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/reorder/route")
    const res = await POST(req("/api/cms/books/abc/chapters/reorder", { cookie: adminCookieToken() as string, body: { chapter_id: UUID_A, direction: 1 } }), params("abc"))
    expect(res.status).toBe(503)
    expect(mockGetSupabase).toHaveBeenCalled()
  })
})

/* ── Atomic server-side reorder ─────────────────────────────────────────── */
describe("/api/cms/books/[id]/chapters/reorder", () => {
  const chapterRows = {
    data: [
      { id: UUID_A, chapter_number: 1, created_at: "2026-01-01", cms_content: { status: "draft" } },
      { id: UUID_B, chapter_number: 2, created_at: "2026-01-02", cms_content: { status: "draft" } },
    ],
  }

  async function authedReorder(body: unknown, rpc: QResult) {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const sink = newSink()
    mockGetSupabase.mockReturnValue(
      makeClient(
        {
          tables: { cms_books: { select: { data: { id: "book1" } } }, cms_chapters: { select: chapterRows }, cms_audit_log: { insert: { error: null } } },
          rpc,
        },
        sink
      )
    )
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/books/[id]/chapters/reorder/route")
    const res = await POST(
      req("/api/cms/books/book-content/chapters/reorder", { cookie: adminCookieToken() as string, body }),
      params("book-content")
    )
    return { res, sink }
  }

  it("performs the swap in exactly one atomic rpc call", async () => {
    const { res, sink } = await authedReorder({ chapter_id: UUID_A, direction: 1 }, { error: null })
    expect(res.status).toBe(200)
    expect(sink.rpc).toEqual([{ name: "cms_swap_chapter_order", args: { a_id: UUID_A, b_id: UUID_B } }])
    // No manual per-row PATCHes — the swap is the single transaction.
    expect(sink.updates).toHaveLength(0)
  })

  it("a failed reorder changes nothing (no compensating writes, rolled back)", async () => {
    const { res, sink } = await authedReorder({ chapter_id: UUID_A, direction: 1 }, { error: { message: "boom" } })
    expect(res.status).toBe(500)
    expect(sink.rpc).toHaveLength(1)
    expect(sink.updates).toHaveLength(0)
    // No audit row for a reorder that did not happen.
    expect(sink.inserts).toHaveLength(0)
  })

  it("rejects an out-of-range move without touching the swap", async () => {
    const { res, sink } = await authedReorder({ chapter_id: UUID_A, direction: -1 }, { error: null })
    expect(res.status).toBe(400)
    expect(sink.rpc).toHaveLength(0)
  })
})

/* ── Server-side chapter_extract linkage validation ─────────────────────── */
describe("/api/cms/content chapter_extract linkage", () => {
  // A valid, active chapter the extract can legitimately link to.
  const validChapter = {
    data: { id: UUID_C, book_id: UUID_A, content_id: UUID_B, cms_content: { content_type: "book_chapter", status: "draft" } },
  }

  async function authedCreate(body: Record<string, unknown>, tables: Record<string, TableCfg>) {
    vi.stubEnv("ADMIN_SESSION_SECRET", "a-test-secret-value")
    const sink = newSink()
    mockGetSupabase.mockReturnValue(makeClient({ tables }, sink))
    const { adminCookieToken } = await import("@/lib/admin-auth")
    const { POST } = await import("@/app/api/cms/content/route")
    const res = await POST(req("/api/cms/content", { cookie: adminCookieToken() as string, body }))
    return { res, sink }
  }

  const extractBody = (over: Record<string, unknown> = {}) => ({
    title: "Extract",
    content_type: "chapter_extract",
    source_content_id: UUID_B,
    book_id: UUID_A,
    chapter_id: UUID_C,
    ...over,
  })

  it("rejects a wrong book linkage and writes nothing", async () => {
    const { res, sink } = await authedCreate(extractBody(), {
      cms_chapters: { select: { data: { ...validChapter.data, book_id: "99999999-9999-9999-9999-999999999999" } } },
    })
    expect(res.status).toBe(400)
    expect(sink.inserts).toHaveLength(0)
  })

  it("rejects a wrong chapter linkage (source ≠ chapter's content) and writes nothing", async () => {
    const { res, sink } = await authedCreate(extractBody({ source_content_id: "99999999-9999-9999-9999-999999999999" }), {
      cms_chapters: { select: validChapter },
    })
    expect(res.status).toBe(400)
    expect(sink.inserts).toHaveLength(0)
  })

  it("rejects a non-chapter source and writes nothing", async () => {
    const { res, sink } = await authedCreate(extractBody(), {
      cms_chapters: { select: { data: { ...validChapter.data, cms_content: { content_type: "article", status: "draft" } } } },
    })
    expect(res.status).toBe(400)
    expect(sink.inserts).toHaveLength(0)
  })

  it("rejects an archived source chapter and writes nothing", async () => {
    const { res, sink } = await authedCreate(extractBody(), {
      cms_chapters: { select: { data: { ...validChapter.data, cms_content: { content_type: "book_chapter", status: "archived" } } } },
    })
    expect(res.status).toBe(400)
    expect(sink.inserts).toHaveLength(0)
  })

  it("rejects an incomplete linkage triple and writes nothing", async () => {
    const { res, sink } = await authedCreate(
      { title: "Extract", content_type: "chapter_extract", book_id: UUID_A, chapter_id: UUID_C },
      { cms_chapters: { select: validChapter } }
    )
    expect(res.status).toBe(400)
    expect(sink.inserts).toHaveLength(0)
  })

  it("creates the extract when the full linkage identifies the same valid, active chapter and book", async () => {
    const { res, sink } = await authedCreate(extractBody(), {
      cms_chapters: { select: validChapter },
      cms_content: { select: { data: null }, insert: { data: { id: "extract-id", slug: "extract" }, error: null } },
      cms_audit_log: { insert: { error: null } },
    })
    expect(res.status).toBe(201)
    const contentInsert = sink.inserts.find((i) => i.table === "cms_content")?.row as Record<string, unknown>
    expect(contentInsert?.source_content_id).toBe(UUID_B)
    expect(contentInsert?.book_id).toBe(UUID_A)
    expect(contentInsert?.chapter_id).toBe(UUID_C)
  })
})
