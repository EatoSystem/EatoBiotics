import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/**
 * Route-level tests for GET /api/account/pdf-url — proves the fix for the
 * 7-day signed PDF URL going dead: the route mints a fresh short-lived signed
 * URL on demand instead of relying on a permanently-cached one, and only ever
 * does so for the report's verified owner.
 *
 * The shared repo-wide Supabase stub (see foundation-enforcement.test.ts) is a
 * no-op passthrough on .eq()/.or() and can't express real filter/ownership
 * semantics, so it can't prove "wrong user gets 404" or "storage key is
 * server-derived, not client-supplied." This file builds a small, test-only
 * stub that actually applies the .eq()/.or(ownerOrFilter(...)) filters against
 * seeded rows (same technique already used in
 * account-paid-reports-visibility.test.ts for Fix #1), plus a minimal
 * .storage.from().createSignedUrl() stub.
 */

interface DeepAssessmentRow {
  stripe_session_id: string
  pdf_status: string
  user_id: string | null
  email: string | null
}

/** Parses a single `col.eq."value"` condition, reversing pgQuote's escaping. */
function parseCondition(condition: string): { column: string; value: string } {
  const match = /^(\w+)\.eq\."(.*)"$/.exec(condition)
  if (!match) throw new Error(`Unparseable OR condition: ${condition}`)
  const [, column, quoted] = match
  return { column, value: quoted.replace(/\\"/g, '"').replace(/\\\\/g, "\\") }
}

/** Splits ownerOrFilter()'s comma-joined output at condition boundaries only. */
function parseOrFilter(filter: string): { column: string; value: string }[] {
  return filter.split(/,(?=\w+\.eq\.)/).map(parseCondition)
}

function makeStub(
  rows: DeepAssessmentRow[],
  signing: { signedUrl?: string | null; error?: string | null } = {},
) {
  const writes: { table: string; method: string; payload: unknown }[] = []
  const signedUrlCalls: { bucket: string; path: string; ttl: number }[] = []

  const from = (table: string) => {
    const eqFilters: [string, string][] = []
    let orFilter: string | undefined
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: Record<string, any> = {
      select: () => chain,
      eq: (col: string, val: string) => {
        eqFilters.push([col, val])
        return chain
      },
      or: (filter: string) => {
        orFilter = filter
        return chain
      },
      maybeSingle: () => {
        const match = rows.find((row) => {
          const eqOk = eqFilters.every(([col, val]) => (row as unknown as Record<string, unknown>)[col] === val)
          if (!eqOk) return false
          if (!orFilter) return true
          return parseOrFilter(orFilter).some(({ column, value }) => (row as unknown as Record<string, unknown>)[column] === value)
        })
        return Promise.resolve({ data: match ?? null, error: null })
      },
    }
    for (const m of ["insert", "update", "upsert"]) {
      chain[m] = (payload: unknown) => {
        writes.push({ table, method: m, payload })
        return chain
      }
    }
    return chain
  }

  const storage = {
    from: (bucket: string) => ({
      createSignedUrl: (path: string, ttl: number) => {
        signedUrlCalls.push({ bucket, path, ttl })
        if (signing.error) return Promise.resolve({ data: null, error: { message: signing.error } })
        return Promise.resolve({
          data: { signedUrl: signing.signedUrl ?? `https://signed.example.com/${path}` },
          error: null,
        })
      },
    }),
  }

  return { client: { from, storage } as unknown, writes, signedUrlCalls }
}

const mockGetSupabase = vi.fn()
const mockGetUser = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => mockGetUser() }))

function req(session?: string): NextRequest {
  const url = session
    ? `http://localhost/api/account/pdf-url?session=${encodeURIComponent(session)}`
    : "http://localhost/api/account/pdf-url"
  return new NextRequest(url)
}

const owner = { id: "user-1", email: "buyer@example.com" }

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/account/pdf-url", () => {
  it("authenticated owner with an uploaded PDF receives a fresh signed URL", async () => {
    mockGetUser.mockResolvedValue(owner)
    const stub = makeStub([
      { stripe_session_id: "sess_1", pdf_status: "uploaded", user_id: "user-1", email: "buyer@example.com" },
    ])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    const res = await GET(req("sess_1"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.pdfUrl).toBe("https://signed.example.com/sess_1.pdf")
    expect(body.expiresInSeconds).toBe(300)
  })

  it("unauthenticated request receives 401", async () => {
    mockGetUser.mockResolvedValue(null)
    const stub = makeStub([])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    const res = await GET(req("sess_1"))

    expect(res.status).toBe(401)
  })

  it("a session owned by a different user receives 404, not their PDF", async () => {
    mockGetUser.mockResolvedValue(owner)
    const stub = makeStub([
      { stripe_session_id: "sess_1", pdf_status: "uploaded", user_id: "someone-else", email: "other@example.com" },
    ])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    const res = await GET(req("sess_1"))

    expect(res.status).toBe(404)
    expect(stub.signedUrlCalls).toHaveLength(0)
  })

  it("an existing report without an uploaded PDF receives 404", async () => {
    mockGetUser.mockResolvedValue(owner)
    const stub = makeStub([
      { stripe_session_id: "sess_1", pdf_status: "pending", user_id: "user-1", email: "buyer@example.com" },
    ])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    const res = await GET(req("sess_1"))

    expect(res.status).toBe(404)
  })

  it("an unknown session receives 404", async () => {
    mockGetUser.mockResolvedValue(owner)
    const stub = makeStub([])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    const res = await GET(req("sess_does-not-exist"))

    expect(res.status).toBe(404)
  })

  it("derives the storage key from the verified DB row, not a client-supplied path", async () => {
    mockGetUser.mockResolvedValue(owner)
    const stub = makeStub([
      { stripe_session_id: "sess_1", pdf_status: "uploaded", user_id: "user-1", email: "buyer@example.com" },
    ])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    // The client only ever sends ?session=; there is no path/key parameter for it to abuse.
    await GET(req("sess_1"))

    expect(stub.signedUrlCalls).toEqual([{ bucket: "pdf-reports", path: "sess_1.pdf", ttl: 300 }])
  })

  it("makes no write to deep_assessments", async () => {
    mockGetUser.mockResolvedValue(owner)
    const stub = makeStub([
      { stripe_session_id: "sess_1", pdf_status: "uploaded", user_id: "user-1", email: "buyer@example.com" },
    ])
    mockGetSupabase.mockReturnValue(stub.client)

    const { GET } = await import("@/app/api/account/pdf-url/route")
    await GET(req("sess_1"))

    expect(stub.writes).toHaveLength(0)
  })
})
