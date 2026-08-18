/**
 * /api/feedback/retention — the thing that makes "90-day retention" true (#229).
 *
 * A retention policy that exists only in a privacy document is not a retention
 * policy. Two halves have to agree: the column DEFAULT sets `expires_at` (no
 * route sends it), and this job deletes what it marks. These tests pin the
 * second half, plus the two ways it could quietly become dangerous — a widened
 * delete predicate, or an endpoint anyone can call.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { readFileSync } from "node:fs"

let cronSecret: string | undefined = "test-secret"
vi.mock("@/lib/cron-auth", async () => {
  const { NextResponse } = await import("next/server")
  return {
    verifyCronRequest: (req: NextRequest) => {
      if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
      if (req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
      }
      return null
    },
  }
})

/** Rows keyed by table, plus a record of every delete filter applied. */
type Row = { id: string; expires_at: string; user_id?: string | null }
let tables: Record<string, Row[]> = {}
let deleteError: { message: string } | null = null
const filters: Array<{ table: string; op: string; col: string; value: string }> = []
let dbConfigured = true

vi.mock("@/lib/supabase", () => ({
  getSupabase: () =>
    !dbConfigured
      ? null
      : {
          from: (table: string) => ({
            delete: () => {
              const applied: Array<(r: Row) => boolean> = []
              const builder: Record<string, unknown> = {}
              Object.assign(builder, {
                lte: (col: string, value: string) => {
                  filters.push({ table, op: "lte", col, value })
                  applied.push((r) => String(r[col as keyof Row]) <= value)
                  return builder
                },
                eq: (col: string, value: string) => {
                  filters.push({ table, op: "eq", col, value })
                  applied.push((r) => String(r[col as keyof Row]) === value)
                  return builder
                },
                select: async () => {
                  if (deleteError) return { data: null, error: deleteError }
                  const rows = tables[table] ?? []
                  const hit = rows.filter((r) => applied.every((f) => f(r)))
                  tables[table] = rows.filter((r) => !hit.includes(r))
                  return { data: hit.map((r) => ({ id: r.id })), error: null }
                },
              })
              return builder
            },
          }),
        },
}))

const PAST = "2020-01-01T00:00:00.000Z"
const FUTURE = "2999-01-01T00:00:00.000Z"

function req(auth?: string) {
  return new NextRequest("http://localhost/api/feedback/retention", {
    method: "GET",
    headers: auth ? { authorization: auth } : {},
  })
}
const load = () => import("@/app/api/feedback/retention/route")

beforeEach(() => {
  cronSecret = "test-secret"
  dbConfigured = true
  deleteError = null
  filters.length = 0
  tables = {
    feedback: [
      { id: "f-old", expires_at: PAST, user_id: "u1" },
      { id: "f-old-anon", expires_at: PAST, user_id: null },
      { id: "f-live", expires_at: FUTURE, user_id: "u2" },
    ],
    reviews: [
      { id: "r-old", expires_at: PAST, user_id: "u3" },
      { id: "r-live", expires_at: FUTURE, user_id: "u4" },
    ],
  }
})

describe("the sweep is not callable by a customer", () => {
  it("401s without the cron bearer token", async () => {
    const { GET } = await load()
    expect((await GET(req())).status).toBe(401)
    expect(filters, "an unauthorised call must not reach the database").toEqual([])
  })

  it("503s when CRON_SECRET is unset — fails closed, never open", async () => {
    cronSecret = undefined
    const { GET } = await load()
    expect((await GET(req("Bearer anything"))).status).toBe(503)
    expect(filters).toEqual([])
  })

  it("rejects a wrong token", async () => {
    const { GET } = await load()
    expect((await GET(req("Bearer wrong"))).status).toBe(401)
  })
})

describe("the sweep deletes expired rows and only expired rows", () => {
  it("removes expired feedback and reviews, leaving live rows alone", async () => {
    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deleted).toEqual({ feedback: 2, reviews: 1 })
    expect(tables.feedback.map((r) => r.id)).toEqual(["f-live"])
    expect(tables.reviews.map((r) => r.id)).toEqual(["r-live"])
  })

  it("expires anonymous feedback on the same clock as account-linked", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))
    // `f-old-anon` had user_id null and still went.
    expect(tables.feedback.find((r) => r.id === "f-old-anon")).toBeUndefined()
  })

  it("filters on expires_at and nothing else", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))

    expect(filters.map((f) => f.table)).toEqual(["feedback", "reviews"])
    for (const f of filters) {
      expect(f.op, "an equality filter here could target specific customers").toBe("lte")
      expect(
        f.col,
        "filtering on anything but expiry turns a retention sweep into a deletion tool",
      ).toBe("expires_at")
    }
  })

  it("sweeps both private tables, not just feedback", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))
    expect(new Set(filters.map((f) => f.table))).toEqual(new Set(["feedback", "reviews"]))
  })

  it("reports failure rather than a partial sweep that reads as complete", async () => {
    deleteError = { message: 'relation "feedback" does not exist' }
    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.ok).toBeUndefined()
    expect(JSON.stringify(body)).not.toMatch(/relation|does not exist/)
  })

  it("503s when the database is not configured", async () => {
    dbConfigured = false
    const { GET } = await load()
    expect((await GET(req("Bearer test-secret"))).status).toBe(503)
  })
})

describe("the job is actually scheduled", () => {
  it("vercel.json runs the sweep daily", () => {
    const cfg = JSON.parse(readFileSync("vercel.json", "utf8")) as {
      crons: Array<{ path: string; schedule: string }>
    }
    const job = cfg.crons.find((c) => c.path === "/api/feedback/retention")
    expect(job, "an unscheduled cleanup route retains nothing").toBeDefined()
    // Daily: five fields, day-of-month and month unrestricted.
    expect(job!.schedule).toMatch(/^\d+ \d+ \* \* \*$/)
  })
})
