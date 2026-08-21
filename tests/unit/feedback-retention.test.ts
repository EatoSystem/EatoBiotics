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

/**
 * A fake that models the PostgREST behaviour that actually matters here.
 *
 * `RESPONSE_LIMIT` stands in for `db-max-rows`: a server-side cap on how many
 * rows come back in a response. Applying it to SELECT is the whole point —
 * the old implementation deleted with `.select("id")` and counted the rows it
 * got back, which is exactly the value this cap truncates.
 *
 * `mutationCap` models the case we could NOT rule out from the docs: a DELETE
 * whose AFFECTED rows are themselves capped. Tests run the sweep with it set,
 * so completeness cannot depend on the favourable answer being true.
 *
 * `count` is served from the row total, independent of any returned body —
 * mirroring the client, which parses it from Content-Range.
 */
type Row = { id: string; expires_at: string; user_id?: string | null; message?: string }
let tables: Record<string, Row[]> = {}
let deleteError: { message: string } | null = null
/** Fail only this table, to exercise a partial sweep. */
let failTable: string | null = null
/** Force a null count, i.e. no usable Content-Range. */
let suppressCount = false
/** Server-side response cap. Small, so tests can exceed it cheaply. */
let RESPONSE_LIMIT = 5
/** Max rows a single DELETE may actually affect. null = uncapped. */
let mutationCap: number | null = null
const filters: Array<{ table: string; op: string; col: string; value: unknown }> = []
/** Every column list this route ever asked the database for. */
const selectedColumns: string[] = []
let dbConfigured = true

vi.mock("@/lib/supabase", () => ({
  getSupabase: () =>
    !dbConfigured
      ? null
      : {
          from: (table: string) => ({
            select: (cols: string) => {
              selectedColumns.push(cols)
              const preds: Array<(r: Row) => boolean> = []
              let limit = Infinity
              const b: Record<string, unknown> = {}
              Object.assign(b, {
                lte: (col: string, value: string) => {
                  filters.push({ table, op: "lte", col, value })
                  preds.push((r) => String(r[col as keyof Row]) <= value)
                  return b
                },
                limit: (n: number) => {
                  limit = n
                  return b
                },
                then: (resolve: (v: unknown) => void) => {
                  if (failTable === table && deleteError === null) {
                    return resolve({ data: null, error: { message: `read failed on ${table}` } })
                  }
                  const hit = (tables[table] ?? []).filter((r) => preds.every((f) => f(r)))
                  // The server cap applies on top of any requested limit.
                  const capped = hit.slice(0, Math.min(limit, RESPONSE_LIMIT))
                  resolve({ data: capped.map((r) => ({ id: r.id })), error: null })
                },
              })
              return b
            },
            delete: (opts?: { count?: string }) => {
              const preds: Array<(r: Row) => boolean> = []
              let representation = false
              const b: Record<string, unknown> = {}
              Object.assign(b, {
                lte: (col: string, value: string) => {
                  filters.push({ table, op: "lte", col, value })
                  preds.push((r) => String(r[col as keyof Row]) <= value)
                  return b
                },
                in: (col: string, values: string[]) => {
                  filters.push({ table, op: "in", col, value: values })
                  preds.push((r) => values.includes(String(r[col as keyof Row])))
                  return b
                },
                eq: (col: string, value: string) => {
                  filters.push({ table, op: "eq", col, value })
                  preds.push((r) => String(r[col as keyof Row]) === value)
                  return b
                },
                // Mirrors PostgrestTransformBuilder.select(), which appends
                // `Prefer: return=representation` — the body db-max-rows caps.
                select: (cols: string) => {
                  selectedColumns.push(cols)
                  representation = true
                  return b
                },
                then: (resolve: (v: unknown) => void) => {
                  if (deleteError) return resolve({ data: null, error: deleteError, count: null })
                  if (failTable === table) {
                    return resolve({
                      data: null,
                      error: { message: `relation "${table}" does not exist` },
                      count: null,
                    })
                  }
                  const rows = tables[table] ?? []
                  let hit = rows.filter((r) => preds.every((f) => f(r)))
                  // A DELETE that can only affect so many rows per statement.
                  if (mutationCap !== null) hit = hit.slice(0, mutationCap)
                  tables[table] = rows.filter((r) => !hit.includes(r))
                  resolve({
                    // Only present with return=representation, and TRUNCATED by
                    // the server cap — the trap the old implementation fell in.
                    data: representation ? hit.slice(0, RESPONSE_LIMIT).map((r) => ({ id: r.id })) : null,
                    error: null,
                    // From the row total, independent of the body above.
                    count: suppressCount || !opts?.count ? null : hit.length,
                  })
                },
              })
              return b
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
  failTable = null
  suppressCount = false
  RESPONSE_LIMIT = 5
  mutationCap = null
  filters.length = 0
  selectedColumns.length = 0
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

  it("deletes EVERY expired row when there are far more than the response limit", async () => {
    // The case the old implementation got wrong. RESPONSE_LIMIT models
    // db-max-rows: one round trip can only ever see 5 rows, so a single
    // delete-and-count-what-came-back leaves the other 112 in place and
    // reports a number that is not the truth.
    RESPONSE_LIMIT = 5
    tables.feedback = [
      ...Array.from({ length: 117 }, (_, i) => ({ id: `old-${i}`, expires_at: PAST })),
      ...Array.from({ length: 9 }, (_, i) => ({ id: `live-${i}`, expires_at: FUTURE })),
    ]
    tables.reviews = []

    const { GET } = await load()
    const body = await (await GET(req("Bearer test-secret"))).json()

    expect(body.ok).toBe(true)
    expect(body.deleted.feedback, "the count must be the real total, not one page").toBe(117)
    expect(
      tables.feedback.map((r) => r.id).sort(),
      "no expired row may survive the sweep",
    ).toEqual(Array.from({ length: 9 }, (_, i) => `live-${i}`).sort())
  })

  it("still completes when the DELETE itself is capped per statement", async () => {
    // We could not establish from the docs whether db-max-rows caps rows
    // AFFECTED by a mutation. So the sweep is built not to care: each pass
    // re-reads, and the loop ends only on an empty read.
    RESPONSE_LIMIT = 10
    mutationCap = 3
    tables.feedback = Array.from({ length: 40 }, (_, i) => ({ id: `old-${i}`, expires_at: PAST }))
    tables.reviews = [{ id: "r-live", expires_at: FUTURE }]

    const { GET } = await load()
    const body = await (await GET(req("Bearer test-secret"))).json()

    expect(body.ok).toBe(true)
    expect(body.deleted.feedback).toBe(40)
    expect(tables.feedback, "a capped mutation must not leave expired rows behind").toEqual([])
    expect(tables.reviews.map((r) => r.id)).toEqual(["r-live"])
  })

  it("reports incomplete rather than success when it cannot converge", async () => {
    // Pathological: the delete never removes anything. The sweep must not
    // spin forever, and must not report a clean run.
    mutationCap = 0
    tables.feedback = Array.from({ length: 20 }, (_, i) => ({ id: `old-${i}`, expires_at: PAST }))

    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.ok).toBeUndefined()
    expect(body.error).toMatch(/incomplete/i)
    expect(body.failedTable).toBe("feedback")
  })

  it("treats a missing exact count as a failure, not as zero", async () => {
    // The rows may well be gone, but a deletion job that cannot say how many
    // it deleted is not auditable. Reporting 0 would be worse than failing.
    suppressCount = true
    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.error).toMatch(/could not be verified/i)
    expect(body.ok).toBeUndefined()
  })

  it("asks the database for ids and nothing else", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))

    expect(selectedColumns.length).toBeGreaterThan(0)
    for (const cols of selectedColumns) {
      expect(cols, "the sweep must never read customer content").toBe("id")
    }
    for (const forbidden of ["message", "comment", "rating", "user_id", "*"]) {
      expect(selectedColumns.join(","), `selected ${forbidden}`).not.toContain(forbidden)
    }
  })

  it("never logs anything but ids and counts", async () => {
    const logged: string[] = []
    const spies = (["log", "error", "warn"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation((...a: unknown[]) => { logged.push(a.join(" ")) }),
    )
    tables.feedback = [{ id: "f-old", expires_at: PAST, message: "my private symptoms" }]

    const { GET } = await load()
    await GET(req("Bearer test-secret"))
    for (const sp of spies) sp.mockRestore()

    expect(logged.join("\n")).not.toMatch(/private symptoms/)
  })

  it("expires anonymous feedback on the same clock as account-linked", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))
    // `f-old-anon` had user_id null and still went.
    expect(tables.feedback.find((r) => r.id === "f-old-anon")).toBeUndefined()
  })

  it("selects only by expiry, and deletes only by the ids that selection returned", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))

    const reads = filters.filter((f) => f.op === "lte")
    const deletes = filters.filter((f) => f.op === "in")

    // Nothing is chosen for deletion except by having expired.
    expect(reads.length).toBeGreaterThan(0)
    for (const f of reads) {
      expect(
        f.col,
        "selecting on anything but expiry turns a retention sweep into a deletion tool",
      ).toBe("expires_at")
    }

    // And the DELETE names those exact ids — never a broad predicate that a
    // server-side cap could apply to unpredictably.
    expect(deletes.length).toBeGreaterThan(0)
    for (const f of deletes) expect(f.col).toBe("id")

    // No user/content targeting anywhere.
    expect(filters.some((f) => f.op === "eq")).toBe(false)
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

  it("a failure on the second table still reports what the first one swept", async () => {
    // "feedback cleared, reviews did not" is a materially different situation
    // to "nothing ran", and an operator needs to tell them apart.
    failTable = "reviews"
    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.failedTable).toBe("reviews")
    expect(body.deleted).toEqual({ feedback: 2 })
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
