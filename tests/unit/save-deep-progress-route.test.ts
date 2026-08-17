import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import type { DeepQuestion } from "@/lib/deep-assessment"
import { deferred, barrier } from "./helpers/fake-deep-assessments"

/**
 * PATCH /api/save-deep-progress — autosave authority and answer safety (#227).
 *
 * Two defects, one of which needed no attacker:
 *
 * 1. **Authority.** The route upserted whatever `status` the body sent, on an
 *    endpoint with no auth. Nothing in the client ever sent one.
 * 2. **Answer loss.** The client posted its ENTIRE answer map on every change,
 *    with no debounce and no in-flight sequencing. Two answers in quick
 *    succession put two maps on the wire; if the earlier landed last it erased
 *    the newer answer. Ordinary network reordering, real customer work lost.
 *
 * The contract is now one changed answer per request, merged server-side under
 * a compare-and-set on `updated_at`.
 */

/* ── A fake deep_assessments with real CAS semantics ────────────────────── */

type Row = Record<string, unknown>
type Hooks = { beforeRead?: (n: number) => void | Promise<void>; beforeWrite?: (n: number) => void | Promise<void> }

function makeDb(seed: Row | null, hooks: Hooks = {}, faults: { readThrows?: boolean; writeError?: boolean } = {}) {
  const rows = new Map<string, Row>()
  if (seed) rows.set(String(seed.stripe_session_id), { ...seed })
  const log: string[] = []
  let reads = 0
  let writes = 0

  function from(_t: string) {
    let action: "select" | "update" = "select"
    let payload: Row = {}
    let key: string | null = null
    const preds: Array<(r: Row) => boolean> = []

    const chain: Record<string, unknown> = {
      select: (_c?: string) => chain,
      update(p: Row) {
        action = "update"
        payload = p
        return chain
      },
      eq(col: string, val: unknown) {
        if (col === "stripe_session_id") key = String(val)
        else preds.push((r) => r[col] === val)
        return chain
      },
      is(col: string, val: unknown) {
        preds.push((r) => (r[col] ?? null) === val)
        return chain
      },
      maybeSingle: () => run(),
      then: (res: (v: unknown) => void, rej?: (e: unknown) => void) => run().then(res, rej),
    }

    async function run(): Promise<{ data: unknown; error: unknown }> {
      if (action === "select") {
        const n = ++reads
        log.push("read")
        await hooks.beforeRead?.(n)
        if (faults.readThrows) throw new Error("read failed")
        return { data: (key !== null ? rows.get(key) : undefined) ?? null, error: null }
      }
      const n = ++writes
      log.push("write")
      await hooks.beforeWrite?.(n)
      if (faults.writeError) return { data: null, error: { code: "08006", message: "connection failure" } }
      const row = key !== null ? rows.get(key) : undefined
      // The CAS: zero rows matched if the guard no longer holds.
      if (!row || !preds.every((p) => p(row))) return { data: [], error: null }
      Object.assign(row, payload)
      return { data: [{ stripe_session_id: key }], error: null }
    }
    return chain
  }

  return {
    client: { from } as unknown,
    rows,
    log,
    counts: () => ({ reads, writes }),
    only: () => [...rows.values()][0] ?? null,
    answers: () => (([...rows.values()][0]?.answers ?? {}) as Record<string, unknown>),
  }
}

/* ── Mocks ──────────────────────────────────────────────────────────────── */
const mockGetSupabase = vi.fn()
vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))

/* ── Fixtures ───────────────────────────────────────────────────────────── */
const SESSION = "cs_test_autosave_1"
const T0 = "2026-08-17T10:00:00.000Z"

const QUESTIONS: DeepQuestion[] = [1, 2, 3].map(
  (n) =>
    ({
      id: `dq${n}`,
      type: "single",
      pillar: "prebiotics",
      section: "symptoms",
      text: `Question ${n}`,
      options: [{ label: "Yes", value: "yes" }],
      required: true,
    }) as DeepQuestion,
)

const rowWith = (over: Row = {}): Row => ({
  stripe_session_id: SESSION,
  tier: "personal",
  free_scores: { overall: 58 },
  questions: QUESTIONS,
  answers: {},
  status: "in_progress",
  report_json: null,
  pdf_url: null,
  updated_at: T0,
  ...over,
})

function patch(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/save-deep-progress", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

async function call(req: NextRequest) {
  const { PATCH } = await import("@/app/api/save-deep-progress/route")
  return PATCH(req)
}

const bodyOf = async (r: Response) => (await r.json()) as { ok?: boolean; saved?: string; error?: string }

beforeEach(() => {
  vi.clearAllMocks()
})

/* ══ Authority ══════════════════════════════════════════════════════════ */

describe("the autosave route owns exactly one column", () => {
  it("a status in the request cannot alter stored status", async () => {
    const db = makeDb(rowWith({ status: "in_progress" }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes", status: "complete" }))

    expect(res.status).toBe(200)
    expect(db.only()?.status, "status must be untouched by autosave").toBe("in_progress")
  })

  it("never inserts — a missing row is a 404, not a creation", async () => {
    const db = makeDb(null)
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes" }))

    expect(res.status).toBe(404)
    expect(db.rows.size).toBe(0)
    expect(db.counts().writes).toBe(0)
  })

  it("leaves every field it does not own untouched", async () => {
    const db = makeDb(rowWith({ report_json: { some: "report" }, pdf_url: "https://x/y.pdf" }))
    mockGetSupabase.mockReturnValue(db.client)

    await call(patch({ sessionId: SESSION, questionId: "dq2", value: "yes" }))

    const row = db.only()!
    expect(row.tier).toBe("personal")
    expect(row.free_scores).toEqual({ overall: 58 })
    expect(row.questions).toEqual(QUESTIONS)
    expect(row.status).toBe("in_progress")
    expect(row.report_json).toEqual({ some: "report" })
    expect(row.pdf_url).toBe("https://x/y.pdf")
  })
})

/* ══ The delta contract ═════════════════════════════════════════════════ */

describe("one answer per request, merged server-side", () => {
  it("saves a single answer into an empty map", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes" }))

    expect(res.status).toBe(200)
    expect((await bodyOf(res)).saved).toBe("dq1")
    expect(db.answers()).toEqual({ dq1: "yes" })
  })

  it("merges without disturbing other answers", async () => {
    const db = makeDb(rowWith({ answers: { dq1: "yes", dq2: "no" } }))
    mockGetSupabase.mockReturnValue(db.client)

    await call(patch({ sessionId: SESSION, questionId: "dq3", value: ["a", "b"] }))

    expect(db.answers()).toEqual({ dq1: "yes", dq2: "no", dq3: ["a", "b"] })
  })

  it("an explicit clear removes only the named answer", async () => {
    const db = makeDb(rowWith({ answers: { dq1: "yes", dq2: "no" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", clear: true }))

    expect(res.status).toBe(200)
    expect(db.answers()).toEqual({ dq2: "no" })
  })

  it("an empty payload cannot wipe the map", async () => {
    // No questionId, no value — the old contract would have replaced the map
    // with {}. There is no longer a request shape that can express that.
    const db = makeDb(rowWith({ answers: { dq1: "yes", dq2: "no" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, answers: {} }))

    expect(res.status).toBe(400)
    expect(db.answers()).toEqual({ dq1: "yes", dq2: "no" })
    expect(db.counts().writes).toBe(0)
  })

  it("an unknown question id is rejected, not stored", async () => {
    const db = makeDb(rowWith({ answers: { dq1: "yes" } }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq99", value: "yes" }))

    expect(res.status).toBe(422)
    expect(db.answers()).toEqual({ dq1: "yes" })
    expect(db.counts().writes).toBe(0)
  })

  it("a malformed answer value is refused", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: { nested: "object" } }))

    expect(res.status).toBe(400)
    expect(db.counts().writes).toBe(0)
  })

  it("refuses before questions exist, rather than storing an unvalidatable answer", async () => {
    const db = makeDb(rowWith({ questions: null }))
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes" }))

    expect(res.status).toBe(409)
    expect(db.counts().writes).toBe(0)
  })
})

/* ══ Concurrency ════════════════════════════════════════════════════════ */

describe("concurrent saves cannot lose an answer", () => {
  it("two different-question saves both survive", async () => {
    // Force the interleaving: both read the same map before either writes.
    const bothRead = barrier(2)
    const firstWrite = deferred()
    const db = makeDb(rowWith(), {
      beforeRead: () => bothRead.arrive(),
      beforeWrite: async (n) => {
        if (n === 1) await bothRead.reached
        if (n === 2) await firstWrite.promise
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const a = call(patch({ sessionId: SESSION, questionId: "dq1", value: "A" }))
    const b = call(patch({ sessionId: SESSION, questionId: "dq2", value: "B" }))
    // Release the loser once the winner has landed.
    setTimeout(() => firstWrite.resolve(), 0)

    const [resA, resB] = await Promise.all([a, b])

    expect(resA.status).toBe(200)
    expect(resB.status).toBe(200)
    expect(db.answers(), "both answers must survive the race").toEqual({ dq1: "A", dq2: "B" })
  })

  it("a stale writer re-reads instead of erasing a newer answer", async () => {
    // Between this request's read and its write, someone else stores dq2 and
    // moves updated_at — so the first write must lose the CAS.
    let injected = false
    const db = makeDb(rowWith(), {
      beforeWrite: () => {
        if (injected) return
        injected = true
        const row = db.only()!
        row.answers = { dq2: "newer" }
        row.updated_at = "2026-08-17T11:00:00.000Z"
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "mine" }))

    expect(res.status).toBe(200)
    // Re-read and re-applied: the intervening answer survives alongside ours.
    // Under whole-map replacement dq2 would simply be gone.
    expect(db.answers()).toEqual({ dq2: "newer", dq1: "mine" })
    expect(db.counts().writes, "a lost CAS must be retried, not accepted").toBeGreaterThan(1)
    expect(db.counts().reads, "the retry must re-read, not reuse the stale map").toBeGreaterThan(1)
  })

  it("a same-question race resolves last-writer-wins, deterministically", async () => {
    // Documented policy: two writes to the SAME id cannot both survive, so the
    // one that lands second wins. It re-reads first, so it never resurrects a
    // stale value for any other question.
    const db = makeDb(rowWith({ answers: { dq2: "keep" } }))
    mockGetSupabase.mockReturnValue(db.client)

    await call(patch({ sessionId: SESSION, questionId: "dq1", value: "first" }))
    await call(patch({ sessionId: SESSION, questionId: "dq1", value: "second" }))

    expect(db.answers()).toEqual({ dq2: "keep", dq1: "second" })
  })

  it("CAS exhaustion returns failure rather than claiming success", async () => {
    // Every write loses: the row moves under us on every attempt.
    const db = makeDb(rowWith(), {
      beforeWrite: () => {
        db.only()!.updated_at = new Date(Date.now() + Math.random() * 1e6).toISOString()
      },
    })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes" }))

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).ok).toBeUndefined()
    expect(db.counts().writes, "retries must be bounded").toBeLessThanOrEqual(3)
  })

  it("a write error is a failure response, not a silent swallow", async () => {
    const db = makeDb(rowWith(), {}, { writeError: true })
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes" }))

    expect(res.status).toBe(503)
    expect((await bodyOf(res)).ok).toBeUndefined()
  })

  it("a read failure is a failure response", async () => {
    const db = makeDb(rowWith(), {}, { readThrows: true })
    mockGetSupabase.mockReturnValue(db.client)

    expect((await call(patch({ sessionId: SESSION, questionId: "dq1", value: "yes" }))).status).toBe(503)
  })
})

/* ══ Disclosure ═════════════════════════════════════════════════════════ */

describe("no customer content escapes", () => {
  it("no answer value or question text reaches the logs", async () => {
    const lines: string[] = []
    const spy = vi.spyOn(console, "error").mockImplementation((...a) => lines.push(a.join(" ")))
    const db = makeDb(rowWith(), {}, { writeError: true })
    mockGetSupabase.mockReturnValue(db.client)

    await call(patch({ sessionId: SESSION, questionId: "dq1", value: "I take omeprazole daily" }))
    spy.mockRestore()

    const joined = lines.join("\n")
    expect(joined).not.toContain("omeprazole")
    expect(joined).not.toContain("Question 1")
  })

  it("a malformed body is not echoed back", async () => {
    mockGetSupabase.mockReturnValue(makeDb(rowWith()).client)

    const res = await call(patch({ sessionId: SESSION, questionId: "dq1", value: { secret: "diagnosis" } }))

    expect(JSON.stringify(await bodyOf(res))).not.toContain("diagnosis")
  })

  it("a malformed session id fails before any database work", async () => {
    const db = makeDb(rowWith())
    mockGetSupabase.mockReturnValue(db.client)

    const res = await call(patch({ sessionId: "x", questionId: "dq1", value: "yes" }))

    expect(res.status).toBe(400)
    expect(db.counts().reads).toBe(0)
  })
})
