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
import ts from "typescript"

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
type Row = { id?: string; token?: string; expires_at: string; user_id?: string | null; message?: string; summary?: unknown }
let tables: Record<string, Row[]> = {}
let deleteError: { message: string } | null = null
/** Fail only this table, to exercise a partial sweep. */
let failTable: string | null = null
/**
 * Tables that do not exist in this database.
 *
 * Reads against them answer the way PostgREST does — `PGRST205`, "could not
 * find the table in the schema cache" — which is how the route tells absence
 * from a real failure. Modelling it matters: this is the exact production
 * state (`feedback` and `reviews` are drafted and unapplied) that used to
 * abort the whole sweep before `paid_report_intents` was ever reached.
 */
let absentTables = new Set<string>()
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
                  if (absentTables.has(table)) {
                    return resolve({
                      data: null,
                      error: {
                        code: "PGRST205",
                        message: `Could not find the table 'public.${table}' in the schema cache`,
                      },
                    })
                  }
                  if (failTable === table && deleteError === null) {
                    return resolve({
                      data: null,
                      // No `code`: a real failure, not an absent table.
                      error: { message: `read failed on ${table}` },
                    })
                  }
                  const hit = (tables[table] ?? []).filter((r) => preds.every((f) => f(r)))
                  // The server cap applies on top of any requested limit.
                  const capped = hit.slice(0, Math.min(limit, RESPONSE_LIMIT))
                  // Project the column the route ASKED for. Hardcoding `id`
                  // here would make the paid_report_intents case (keyed on
                  // `token`) pass against a route that selects the wrong
                  // column — the fake would be hiding the bug it exists to
                  // catch.
                  resolve({
                    data: capped.map((r) => ({ [cols]: (r as Record<string, unknown>)[cols] })),
                    error: null,
                  })
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
                    data: representation ? hit.slice(0, RESPONSE_LIMIT).map((r) => ({ id: r.id })) : null,  // representation body is unused by the route
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

/**
 * Sweep an explicit table list.
 *
 * V1 configures exactly one table, so the multi-table properties this file
 * has always covered — a capped DELETE, convergence, a partial sweep, and
 * above all ORDER — cannot be exercised through the route any more. They are
 * properties of the sweep, not of what V1 happens to schedule, so they are
 * tested against the sweep with the list named at the call site.
 */
async function sweep(tables: Array<{ table: string; keyColumn: string }>) {
  const { sweepTables } = await load()
  const res = await sweepTables(tables)
  return { res, body: await res.json() }
}

/** The three tables this job knew about before the V1 scope freeze. */
const THREE = [
  { table: "feedback", keyColumn: "id" },
  { table: "reviews", keyColumn: "id" },
  { table: "paid_report_intents", keyColumn: "token" },
]
const INTENTS = [{ table: "paid_report_intents", keyColumn: "token" }]

beforeEach(() => {
  cronSecret = "test-secret"
  dbConfigured = true
  deleteError = null
  failTable = null
  absentTables = new Set()
  suppressCount = false
  RESPONSE_LIMIT = 5
  mutationCap = null
  filters.length = 0
  selectedColumns.length = 0
  tables = {
    // Keyed on `token`, not `id` — the reason the route carries a keyColumn.
    paid_report_intents: [
      { token: "t-old", expires_at: PAST, summary: { overall: 56 } },
      { token: "t-live", expires_at: FUTURE, summary: { overall: 71 } },
    ],
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
  it("the scheduled route sweeps the expired intent, and nothing else", async () => {
    // What V1 actually runs at 03:00. `feedback` and `reviews` are drafted
    // and unapplied, so they are not in the list and their rows are untouched.
    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deleted).toEqual({ paid_report_intents: 1 })
    // The unexpired intent survives; only the abandoned one goes.
    expect(tables.paid_report_intents.map((r) => r.token)).toEqual(["t-live"])
    expect(tables.feedback.length, "feedback is not in the V1 list").toBe(3)
    expect(tables.reviews.length).toBe(2)
  })

  it("sweeps every table it is given, leaving live rows alone", async () => {
    const { res, body } = await sweep(THREE)

    expect(res.status).toBe(200)
    expect(body.deleted).toEqual({ feedback: 2, reviews: 1, paid_report_intents: 1 })
    expect(tables.feedback.map((r) => r.id)).toEqual(["f-live"])
    expect(tables.reviews.map((r) => r.id)).toEqual(["r-live"])
    expect(tables.paid_report_intents.map((r) => r.token)).toEqual(["t-live"])
  })

  it("deletes EVERY expired row when there are far more than the response limit", async () => {
    // The case the old implementation got wrong. RESPONSE_LIMIT models
    // db-max-rows: one round trip can only ever see 5 rows, so a single
    // delete-and-count-what-came-back leaves the other 112 in place and
    // reports a number that is not the truth.
    RESPONSE_LIMIT = 5
    tables.paid_report_intents = [
      ...Array.from({ length: 117 }, (_, i) => ({ token: `old-${i}`, expires_at: PAST })),
      ...Array.from({ length: 9 }, (_, i) => ({ token: `live-${i}`, expires_at: FUTURE })),
    ]

    const { GET } = await load()
    const body = await (await GET(req("Bearer test-secret"))).json()

    expect(body.ok).toBe(true)
    expect(body.deleted.paid_report_intents, "the count must be the real total, not one page").toBe(117)
    expect(
      tables.paid_report_intents.map((r) => r.token).sort(),
      "no expired row may survive the sweep",
    ).toEqual(Array.from({ length: 9 }, (_, i) => `live-${i}`).sort())
  })

  it("still completes when the DELETE itself is capped per statement", async () => {
    // We could not establish from the docs whether db-max-rows caps rows
    // AFFECTED by a mutation. So the sweep is built not to care: each pass
    // re-reads, and the loop ends only on an empty read.
    RESPONSE_LIMIT = 10
    mutationCap = 3
    tables.paid_report_intents = Array.from({ length: 40 }, (_, i) => ({
      token: `old-${i}`,
      expires_at: PAST,
    }))

    const { GET } = await load()
    const body = await (await GET(req("Bearer test-secret"))).json()

    expect(body.ok).toBe(true)
    expect(body.deleted.paid_report_intents).toBe(40)
    expect(
      tables.paid_report_intents,
      "a capped mutation must not leave expired rows behind",
    ).toEqual([])
  })

  it("reports incomplete rather than success when it cannot converge", async () => {
    // Pathological: the delete never removes anything. The sweep must not
    // spin forever, and must not report a clean run.
    mutationCap = 0
    tables.paid_report_intents = Array.from({ length: 20 }, (_, i) => ({
      token: `old-${i}`,
      expires_at: PAST,
    }))

    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body.ok).toBeUndefined()
    expect(body.error).toMatch(/incomplete/i)
    expect(body.failedTable).toBe("paid_report_intents")
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

  it("asks the database for primary keys and nothing else", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))

    expect(selectedColumns.length).toBeGreaterThan(0)
    for (const cols of selectedColumns) {
      // `token` for paid_report_intents, `id` for the other two — never a
      // content column, and never `*`.
      expect(["id", "token"], "the sweep must never read customer content").toContain(cols)
    }
    // `summary` is the health-derived payload on paid_report_intents; the sweep
    // deletes those rows without ever reading what is in them.
    for (const forbidden of ["message", "comment", "rating", "user_id", "summary", "*"]) {
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
    // Coverage kept for when Migration 46 lands and `feedback` returns to the
    // list: anonymity is not a longer retention period.
    await sweep(THREE)
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
    // Primary key per table: `id` for feedback/reviews, `token` for
    // paid_report_intents. Never a content or ownership column.
    for (const f of deletes) expect(["id", "token"]).toContain(f.col)

    // No user/content targeting anywhere.
    expect(filters.some((f) => f.op === "eq")).toBe(false)
  })

  it("sweeps exactly the retained tables — and nothing else", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))
    const touched = new Set(filters.map((f) => f.table))
    expect(touched).toEqual(new Set(["paid_report_intents"]))

    // The consequential half, asserted explicitly rather than implied by the
    // set above: `consents` is the record that someone agreed to health-data
    // processing and must outlive what it permitted, and `deep_assessments`
    // holds the purchased report itself. A widened predicate that swept either
    // would destroy data no retention promise covers.
    for (const protectedTable of ["consents", "deep_assessments", "leads", "profiles"]) {
      expect(touched, `${protectedTable} must never be swept`).not.toContain(protectedTable)
    }
  })

  it("deletes intents by token, and only expired ones", async () => {
    const { GET } = await load()
    await GET(req("Bearer test-secret"))

    const intentFilters = filters.filter((f) => f.table === "paid_report_intents")
    // Named by primary key, not by a bare predicate — the batch contract.
    const del = intentFilters.find((f) => f.op === "in")
    expect(del?.col, "intents are keyed on token, not id").toBe("token")
    expect(del?.value).toEqual(["t-old"])

    // And the read that chose them filtered on expiry only — never on the
    // buyer, the session, or the summary.
    const read = intentFilters.find((f) => f.op === "lte")
    expect(read?.col).toBe("expires_at")
    expect(intentFilters.every((f) => ["expires_at", "token"].includes(f.col))).toBe(true)
  })

  it("leaves every intent alone when none has expired", async () => {
    tables.paid_report_intents = [
      { token: "t-a", expires_at: FUTURE, summary: {} },
      { token: "t-b", expires_at: FUTURE, summary: {} },
    ]
    const { GET } = await load()
    const res = await GET(req("Bearer test-secret"))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.deleted.paid_report_intents).toBe(0)
    expect(tables.paid_report_intents.map((r) => r.token)).toEqual(["t-a", "t-b"])
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
    const { res, body } = await sweep(THREE)

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

/* ── The V1 repair ───────────────────────────────────────────────────────── */

describe("an absent table cannot starve the one that matters", () => {
  /**
   * ══ THE PRODUCTION FAILURE THIS PINS ══════════════════════════════════════
   *
   * RETAINED_TABLES read feedback → reviews → paid_report_intents, and a read
   * error returned 500 on the spot. Both of the first two are drafted and
   * unapplied — verified absent from production — so every nightly run died
   * on table one and the 30-day purchase-intent window was never enforced.
   * The table happened to hold zero rows, which bounded the harm and hid it.
   *
   * Two things were changed, and both are tested here, because either alone
   * leaves the hole open: the list was narrowed to what V1 has, AND a missing
   * table became a recorded skip. Narrowing alone would be undone by the next
   * person who adds a table above this one.
   */
  it("the exact production shape: two absent tables first, and the intent still goes", async () => {
    absentTables = new Set(["feedback", "reviews"])
    const { res, body } = await sweep(THREE)

    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body.deleted, "the expired intent must be deleted").toEqual({ paid_report_intents: 1 })
    expect(body.skipped).toEqual(["feedback", "reviews"])
    expect(tables.paid_report_intents.map((r) => r.token)).toEqual(["t-live"])
  })

  it("an absent table is reported, not silently counted as swept", async () => {
    absentTables = new Set(["feedback"])
    const { body } = await sweep(THREE)
    // Absence is not the same fact as "nothing had expired", and a log that
    // conflated them would hide a missing migration for as long as it lasted.
    expect(body.skipped).toContain("feedback")
    expect(Object.keys(body.deleted)).not.toContain("feedback")
  })

  it("a real database error still fails the run — absence is the only excuse", async () => {
    // `failTable` produces an error with no PostgREST code: a permission
    // problem, a timeout, a malformed filter. Swallowing those would leave an
    // operator reading a green log over expired customer data.
    failTable = "paid_report_intents"
    const { res, body } = await sweep(INTENTS)

    expect(res.status).toBe(500)
    expect(body.ok).toBeUndefined()
    expect(body.error).toMatch(/failed/i)
    expect(body.failedTable).toBe("paid_report_intents")
    expect(body.skipped, "a real failure is not a skip").toEqual([])
  })

  it("a missing table does not report the run as incomplete", async () => {
    // The skip has to leave the TABLE, not just the pass loop: an unlabelled
    // break would fall through to the convergence check and 500.
    absentTables = new Set(["paid_report_intents"])
    const { res, body } = await sweep(INTENTS)
    expect(res.status).toBe(200)
    expect(body.deleted).toEqual({})
    expect(body.skipped).toEqual(["paid_report_intents"])
  })
})

describe("what V1 actually sweeps, and how the route asks for it", () => {
  it("RETAINED_TABLES is exactly the one live table", async () => {
    const { RETAINED_TABLES } = await load()
    expect([...RETAINED_TABLES]).toEqual([{ table: "paid_report_intents", keyColumn: "token" }])
  })

  it("the schema-drift marker names the same table the list does", () => {
    const src = readFileSync("app/api/feedback/retention/route.ts", "utf8")
    const marker = /schema-drift-tables:\s*(.+)/.exec(src)
    expect(marker, "the marker is gone — check-schema-drift.mjs cannot see this route").toBeTruthy()
    const named = marker![1].split(",").map((t) => t.trim()).filter(Boolean)
    expect(named).toEqual(["paid_report_intents"])
  })

  /**
   * ══ WHY THIS IS PARSED ════════════════════════════════════════════════════
   *
   * `sweepTables` takes its list as an argument so the ordering counterfactual
   * above can exist at all. That seam is only safe while the route passes
   * RETAINED_TABLES and nothing else — a literal here would let production
   * and these tests sweep different things while everything stayed green.
   *
   * Matched on the call's ARGUMENT in the syntax tree, not on the text of the
   * file: `RETAINED_TABLES` appears in this route's prose several times, and a
   * substring check would pass on the comments explaining it.
   */
  it("GET and POST both call sweepTables(RETAINED_TABLES)", () => {
    const src = readFileSync("app/api/feedback/retention/route.ts", "utf8")
    const sf = ts.createSourceFile("route.ts", src, ts.ScriptTarget.ESNext, true)

    const calls: string[] = []
    for (const st of sf.statements) {
      if (!ts.isFunctionDeclaration(st) || !st.body) continue
      if (st.name?.text !== "GET" && st.name?.text !== "POST") continue
      ;(function visit(node: ts.Node) {
        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === "sweepTables"
        ) {
          calls.push(node.arguments.map((a) => a.getText()).join(", "))
        }
        ts.forEachChild(node, visit)
      })(st.body)
    }

    expect(calls, "GET and POST must each call sweepTables exactly once").toHaveLength(2)
    for (const arg of calls) expect(arg).toBe("RETAINED_TABLES")
  })

  it("the parse would see a literal argument", () => {
    // Non-vacuity, against the mutation this guard exists for.
    const mutated = `
      export async function GET(req: NextRequest) {
        return sweepTables([{ table: "feedback", keyColumn: "id" }])
      }
    `
    const sf = ts.createSourceFile("route.ts", mutated, ts.ScriptTarget.ESNext, true)
    const args: string[] = []
    ;(function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "sweepTables"
      ) {
        args.push(node.arguments.map((a) => a.getText()).join(", "))
      }
      ts.forEachChild(node, visit)
    })(sf)
    expect(args).toHaveLength(1)
    expect(args[0]).not.toBe("RETAINED_TABLES")
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
