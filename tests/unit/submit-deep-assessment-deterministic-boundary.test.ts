import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

import { createDeterministicConsultationSnapshot } from "@/lib/consultation/session-envelope"

/**
 * The legacy submit route must never write over a deterministic Consultation.
 *
 * ══ THE GAP THIS CLOSES ═════════════════════════════════════════════════════
 *
 * `resolveTrustedQuestions` already refuses to BUILD a Report from a
 * deterministic question envelope — but it runs several hundred lines after the
 * intake upsert, and that upsert replaces `answers` with whatever the request
 * carried. By the time the existing refusal fires, the deterministic state
 * envelope is gone: candidate answers, skips, phase, cursor. A customer would
 * be told their report could not be made, and the Consultation they had spent
 * twenty minutes on would have been overwritten on the way to telling them.
 *
 * So the boundary moves to before the FIRST write, after payment and session
 * authority has been established so it cannot be used to probe which sessions
 * exist.
 *
 * ══ WHAT MUST STILL WORK ════════════════════════════════════════════════════
 *
 * Ordinary legacy behaviour is unchanged: a `DeepQuestion[]` is an array and
 * passes; an absent question set is a first submit and passes. Only a PRESENT
 * non-array envelope is refused, which is exactly the deterministic snapshot
 * shape and nothing else.
 */

/* ── Chainable Supabase stub (queue-per-table, plus Storage) ────────────── */
type Queued = { data?: unknown; error?: unknown; throws?: string }

function makeSupabaseStub(queues: Record<string, Queued[]>) {
  const writes: {
    table: string
    method: string
    payload: unknown
    /** The filters the SAME chain carried. Captured by reference, so `.eq()`
     *  calls made after `.update()` — which is how PostgREST reads — are seen. */
    filters: Record<string, unknown>
  }[] = []
  /**
   * The filters each chain was built with, in order.
   *
   * Recorded because the intake write's correctness is not visible in its
   * payload: an update that sets the right columns but is guarded on nothing is
   * exactly the unconditional write this boundary replaced, and it leaves an
   * identical `writes` entry behind.
   */
  const filters: Record<string, unknown>[] = []
  const from = (table: string) => {
    const next = (): Queued => queues[table]?.shift() ?? { data: null, error: null }
    const chain: Record<string, unknown> = {}
    const self = () => chain
    const applied: Record<string, unknown> = {}
    filters.push(applied)
    for (const m of ["select", "in", "not", "order", "limit"]) chain[m] = self
    for (const m of ["eq", "is"] as const) {
      chain[m] = (col: string, value: unknown) => {
        applied[`${m}:${col}`] = value
        return chain
      }
    }
    for (const m of ["insert", "update", "upsert"]) {
      chain[m] = (payload: unknown) => {
        writes.push({ table, method: m, payload, filters: applied })
        return chain
      }
    }
    /* A queued `throws` models a transport failure: an awaited PostgREST call
     * resolves with `{ error }`, but the connection itself can still throw. */
    const settle = () => {
      const q = next()
      return q.throws ? Promise.reject(new Error(q.throws)) : Promise.resolve(q)
    }
    chain.maybeSingle = settle
    chain.single = settle
    chain.then = (resolve: (v: Queued) => void, reject?: (e: unknown) => void) =>
      settle().then(resolve, reject)
    return chain
  }
  const storage = {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      createSignedUrl: (p: string) =>
        Promise.resolve({ data: { signedUrl: `https://signed.example.com/${p}` }, error: null }),
    }),
  }
  return { client: { from, storage } as unknown, writes, filters, queues }
}

/* ── Mocks ──────────────────────────────────────────────────────────────── */
const mockGetSupabase = vi.fn()
const mockMessagesCreate = vi.fn()
const mockGeneratePDF = vi.fn()
const mockSendEmail = vi.fn()
const mockReportError = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/anthropic", () => ({
  anthropic: { messages: { create: (...args: unknown[]) => mockMessagesCreate(...args) } },
  CLAUDE_MODEL: "claude-test",
}))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: vi.fn() } } },
}))
vi.mock("@/lib/pdf/generate-pdf", () => ({
  generatePDF: (...args: unknown[]) => mockGeneratePDF(...args),
}))
vi.mock("@/lib/email/paid-report-email", () => ({
  buildPaidReportEmail: () => ({ subject: "Your report", html: "<p>report email</p>" }),
}))
vi.mock("@/lib/email/send", () => ({ sendEmail: (...args: unknown[]) => mockSendEmail(...args) }))
vi.mock("@/lib/report-error", () => ({ reportError: (...args: unknown[]) => mockReportError(...args) }))

/* ── Fixtures ───────────────────────────────────────────────────────────── */
const SESSION_ID = "cs_test_deterministic_boundary"
const ANSWER_SENTINEL = "SENTINEL-LEGACY-ANSWER-must-not-land"
const BUYER_EMAIL = "buyer@example.com"

const snapshot = () =>
  createDeterministicConsultationSnapshot({ foundation: "you", entitledLens: null })

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/submit-deep-assessment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: SESSION_ID,
      questions: [{ id: "q1", question: "How is your digestion?", type: "scale" }],
      answers: { q1: ANSWER_SENTINEL },
    }),
  })
}

/**
 * Queue order on `deep_assessments`:
 *   0 idempotency select
 *   1 step-3 email select
 *   2 THE BOUNDARY READ            ← its own read, not the idempotency one
 *   3 step-4 intake upsert
 *   4 step-6 report upsert
 *   5 step-9 email select
 *   6 step-10 status upsert
 *
 * `idempotency` is passed separately from `boundary` on purpose: the whole
 * point of the fix is that the boundary no longer inherits whatever the
 * idempotency read happened to return.
 */
function queuesFor(
  boundary: Queued,
  {
    idempotency = { data: null } as Queued,
    intake = INTAKE_LANDED,
  }: { idempotency?: Queued; intake?: Queued } = {},
): Record<string, Queued[]> {
  return {
    deep_assessments: [
      idempotency,
      { data: { email: BUYER_EMAIL } },
      boundary,
      intake,
      { data: null },
      { data: { email: BUYER_EMAIL } },
      { data: null },
    ],
    leads: [{ data: null }],
  }
}

const OBSERVED_UPDATED_AT = "2026-09-01T10:00:00.000Z"

/** A valid stored legacy set — the shape `readQuestionSnapshot` accepts. */
const LEGACY_QUESTIONS = [{ id: "dq1", text: "How is your digestion?", type: "scale" }]

/**
 * A boundary read that found a row.
 *
 * `report_json` and `updated_at` are part of the read now: the first
 * distinguishes a historical row legitimately without a question set from a
 * session that never had one, and the second is the CAS token the intake write
 * is guarded on.
 */
const found = (questions: unknown, over: Record<string, unknown> = {}): Queued => ({
  data: { questions, report_json: null, updated_at: OBSERVED_UPDATED_AT, ...over },
})
/** A boundary read that found no row at all. */
const noRow: Queued = { data: null }
/** The intake UPDATE proving through `.select()` that it touched a row. */
const INTAKE_LANDED: Queued = { data: [{ stripe_session_id: SESSION_ID }] }

async function callRoute() {
  const { POST } = await import("@/app/api/submit-deep-assessment/route")
  return POST(makeRequest())
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_SECRET_KEY", "")
  vi.stubEnv("EATOBIOTICS_ALLOW_UNVERIFIED_PAID_FLOW", "true")
  vi.stubEnv("NODE_ENV", "test")
  vi.stubEnv("VERCEL_ENV", "")
  vi.stubEnv("RESEND_API_KEY", "re_test_key")
  vi.stubEnv("EMAIL_FROM", "reports@eatobiotics.com")
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-key")
  mockMessagesCreate.mockRejectedValue(new Error("claude unavailable"))
  mockGeneratePDF.mockResolvedValue(Buffer.from("pdf-bytes"))
  mockSendEmail.mockResolvedValue({ ok: true })
  mockReportError.mockResolvedValue(undefined)
})

/* ══ Refused, before the write ═════════════════════════════════════════════ */

describe("a deterministic Consultation is refused before any intake write", () => {
  it("no write of any kind reaches deep_assessments", async () => {
    const stub = makeSupabaseStub(queuesFor(found(snapshot())))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()
    const body = (await res.json()) as Record<string, unknown>

    expect(res.status).toBe(409)
    expect(body.code).toBe("deterministic_consultation_conflict")

    // The load-bearing assertion. The existing refusal fires AFTER the intake
    // upsert; this one has to fire before it, so the stored state envelope is
    // still there when the customer is turned away.
    const writes = stub.writes.filter((w) => w.table === "deep_assessments")
    expect(writes, "the deterministic state must not be overwritten").toEqual([])
  })

  it("the browser's legacy answers reach nothing at all", async () => {
    const stub = makeSupabaseStub(queuesFor(found(snapshot())))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(JSON.stringify(stub.writes)).not.toContain(ANSWER_SENTINEL)
  })

  it("nothing downstream of the write runs either", async () => {
    // No Claude call, no PDF, no email. The key is set in `beforeEach`, so the
    // generation branch is genuinely reachable and not reaching it is a signal.
    const stub = makeSupabaseStub(queuesFor(found(snapshot())))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(mockGeneratePDF).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it("no conversion is attempted in either direction", async () => {
    // A legacy submit arriving at a deterministic session is a routing mistake,
    // not a Consultation to finish. This route must not call the finalise route
    // or rewrite the envelope into legacy shape.
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("app/api/submit-deep-assessment/route.ts", "utf8"),
    )
    expect(source).not.toContain("consultation/finalise")
    expect(source).not.toContain("prepareConsultationFinalisation")
  })
})

/* ══ Legacy behaviour is untouched ═════════════════════════════════════════ */

describe("ordinary legacy sessions still submit", () => {
  it("a stored DeepQuestion[] passes the boundary and updates intake", async () => {
    const stub = makeSupabaseStub(queuesFor(found(LEGACY_QUESTIONS)))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).not.toBe(409)
    const writes = stub.writes.filter((w) => w.table === "deep_assessments")
    expect(writes.length).toBeGreaterThan(0)
    // An UPDATE, never an upsert: this route may mutate a row that still
    // belongs to the legacy path, and may not create one.
    expect(writes[0].method).toBe("update")
  })

  it("a row already carrying a Report still submits without a question set", async () => {
    // Historical compatibility: rows predating the persisted snapshot
    // legitimately have no questions, and a retry or partial-delivery re-run
    // must keep working for them. They are not deterministic sessions.
    const stub = makeSupabaseStub(queuesFor(found(null, { report_json: { summary: "old" } })))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).not.toBe(409)
    expect(stub.writes.filter((w) => w.table === "deep_assessments").length).toBeGreaterThan(0)
  })
})

/* ══ The boundary fails CLOSED ═════════════════════════════════════════════ */

/**
 * Phase 3C-C2A review fix — the boundary owns its read.
 *
 * The first version reused `existingRow`, populated by the idempotency check
 * near the top of the route. That check destructures `data` without inspecting
 * `error`, and swallows a throw so a paying customer's report is not stopped by
 * a failed idempotency lookup. Both are right for what it is; both are fatal
 * here, because they produce `existingRow === null` for a session whose row
 * exists and is deterministic — and the guard would then wave the write
 * through.
 *
 * A safety boundary cannot inherit another check's tolerance for failure. These
 * cases are the difference between "enforced" and "enforced while the database
 * is healthy".
 */
describe("a boundary read that did not happen stops the request", () => {
  it("a returned Supabase error is a 503, and writes nothing", async () => {
    const stub = makeSupabaseStub(
      queuesFor({ data: null, error: { message: "permission denied for table deep_assessments" } }),
    )
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()
    const body = (await res.json()) as Record<string, unknown>

    expect(res.status).toBe(503)
    expect(body.code).toBe("report_persistence_unavailable")
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("a read that THROWS is a 503, and writes nothing", async () => {
    // An awaited PostgREST call resolves with `{ error }` rather than throwing,
    // but transport failures do throw — and this must not be the one path where
    // the boundary silently opens.
    const stub = makeSupabaseStub(queuesFor({ throws: "connection reset" }))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe("report_persistence_unavailable")
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("the boundary does NOT trust the idempotency read", async () => {
    /*
     * The exact failure the fix closes: the idempotency read fails and returns
     * nothing, while the row genuinely is deterministic. Reusing `existingRow`
     * would see `null`, conclude "legacy, first submit", and overwrite the
     * Consultation.
     */
    const stub = makeSupabaseStub(
      queuesFor(found(snapshot()), { idempotency: { data: null, error: { message: "timeout" } } }),
    )
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("deterministic_consultation_conflict")
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("no browser answer reaches a write in ANY refused case", async () => {
    for (const boundary of [
      found(snapshot()),
      { data: null, error: { message: "permission denied" } } as Queued,
    ]) {
      const stub = makeSupabaseStub(queuesFor(boundary))
      mockGetSupabase.mockReturnValue(stub.client)

      await callRoute()

      expect(JSON.stringify(stub.writes)).not.toContain(ANSWER_SENTINEL)
    }
  })

  it("nothing downstream runs after a fail-closed refusal", async () => {
    const stub = makeSupabaseStub(queuesFor({ data: null, error: { message: "permission denied" } }))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(mockMessagesCreate).not.toHaveBeenCalled()
    expect(mockGeneratePDF).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it("the guard reads its own row rather than the idempotency result", async () => {
    // Structural, because the behavioural cases above can only show that the
    // current wiring is correct — this shows it cannot quietly revert to reading
    // a variable that is allowed to be wrong.
    const source = await import("node:fs").then((fs) =>
      fs.readFileSync("app/api/submit-deep-assessment/route.ts", "utf8"),
    )
    const marker = source.indexOf("Step 3b: the deterministic Consultation boundary")
    // From the comment's OPENING, so the strip below has a `/*` to match.
    // Ends at Step 5, not Step 4: C2B merged the boundary and the intake write
    // into one compare-and-set loop, so Step 4 now sits INSIDE the block under
    // test rather than after it.
    const block = source.slice(
      source.lastIndexOf("/*", marker),
      source.indexOf("// Step 5: Produce the report."),
    )
    // Comments stripped before matching. The guard EXPLAINS at length why it
    // does not reuse `existingRow`, and a check that read the explanation would
    // fail on the rationale rather than on the code.
    const guard = block.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
    expect(guard).toContain('.select("questions, report_json, updated_at")')
    expect(guard).toContain("boundaryError")
    // The write is conditional on the token this read observed, and is an
    // UPDATE — it may mutate a legacy row, never create one from the body.
    expect(guard).toContain("nextUpdatedAt(observed.updated_at)")
    expect(guard, "the intake write must not be an upsert").not.toContain("upsert")
    expect(guard, "the boundary must not read the best-effort idempotency row").not.toContain(
      "existingRow",
    )
  })
})

/* ══ The TOCTOU that Phase 3C-C2B must close ═══════════════════════════════ */

describe("the boundary's remaining race is pinned as a C2B precondition", () => {
  it("nothing installs a deterministic snapshot on a customer path", async () => {
    /*
     * The boundary read and the intake write are not one operation, so a
     * deterministic snapshot installed between them would still be overwritten.
     * Closing that means making the legacy intake write conditional, which is a
     * change to the legacy Report architecture C2A is explicitly not making.
     *
     * What makes that acceptable TODAY is that the race is unreachable: no
     * customer surface creates a deterministic session at all. This test is the
     * thing that stops it becoming reachable quietly — the moment
     * `createDeterministicConsultationSnapshot` is wired into a route or a page,
     * this fails, and whoever did it has to make the legacy write race-safe
     * first.
     */
    const { readFileSync, readdirSync, statSync } = await import("node:fs")
    const { join } = await import("node:path")

    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (/\.(ts|tsx)$/.test(entry.name) && statSync(full).isFile()) out.push(full)
      }
      return out
    }

    const installers = ["app", "components"]
      .flatMap((d) => walk(join(process.cwd(), d)))
      .filter((f) => readFileSync(f, "utf8").includes("createDeterministicConsultationSnapshot"))
      .map((f) => f.slice(process.cwd().length + 1))

    expect(
      installers,
      "a deterministic snapshot installer appeared — the legacy intake write must be made race-safe before this ships",
    ).toEqual([])
  })
})

/* ══ The write is conditional, and never creates a row ═════════════════════ */

/**
 * Phase 3C-C2B — the structural half of the TOCTOU closure.
 *
 * C2A proved the boundary READ was fail-closed. That was enough only while
 * nothing could install a deterministic snapshot on a customer path; C2B adds
 * exactly such a path, so the WRITE has to be safe too.
 *
 * The window was real: read "legacy", snapshot installed, unconditional upsert
 * lands, deterministic state envelope gone. It is closed by making the write a
 * compare-and-set on the token the classification was derived from — whatever
 * moves the token makes the guard match zero rows, and the retry re-reads and
 * re-decides rather than proceeding on an expired fact.
 */
describe("the intake write is a compare-and-set against a still-legacy row", () => {
  it("a missing row is refused rather than re-created from the request", async () => {
    /*
     * `upsert` used to insert one. That is not recovery — it is a paid
     * assessment resurrected from a browser payload, and it would undo an
     * account deletion that landed mid-submit.
     */
    const stub = makeSupabaseStub(queuesFor(noRow))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("assessment_row_missing")
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("a row with no questions and no Report refuses new generation", async () => {
    // Nothing persisted to check the submitted answers against. The recovery is
    // to reload and let generate-deep-questions install a set.
    const stub = makeSupabaseStub(queuesFor(found(null)))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("assessment_questions_missing")
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("an unreadable question shape refuses, and is never overwritten", async () => {
    const stub = makeSupabaseStub(queuesFor(found({ shape: "nothing writes this" })))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("assessment_questions_unreadable")
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("losing the CAS to a deterministic installation re-reads and then refuses", async () => {
    /*
     * The race itself. The first pass reads a legacy row and writes; the write
     * matches zero rows because a deterministic snapshot landed in between and
     * moved the token. The second pass sees the snapshot and refuses — the
     * browser's answers never reach the deterministic state envelope.
     */
    const stub = makeSupabaseStub(
      queuesFor(found(LEGACY_QUESTIONS), { intake: { data: [] } }),
    )
    // Second pass: the boundary re-read now sees the winner, then would-be write.
    stub.queues.deep_assessments.splice(4, 0, found(snapshot()))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(409)
    expect((await res.json()).code).toBe("deterministic_consultation_conflict")
    /*
     * Exactly one write was ATTEMPTED, and it matched zero rows.
     *
     * The stub records attempts rather than effects, so the answers do appear
     * in that attempted payload — what matters is that the guard rejected it
     * and no second attempt followed. That the payload could not have landed on
     * the deterministic row is the CAS's property, asserted structurally by
     * "the intake UPDATE is guarded on the observed token" below.
     */
    expect(stub.writes.filter((w) => w.table === "deep_assessments")).toHaveLength(1)
  })

  it("the intake UPDATE is guarded on the observed token and proves it landed", async () => {
    /*
     * The structural half of the CAS, and the one the traces above cannot show.
     *
     * A write that sets the right columns but is filtered only on the session id
     * is the unconditional write this boundary replaced — it leaves an identical
     * payload behind and would still overwrite whatever landed in between. What
     * makes it atomic is the pair: the guard on the token that was READ, and a
     * moved token written back so the next writer's guard fails.
     */
    const stub = makeSupabaseStub(queuesFor(found(LEGACY_QUESTIONS)))
    mockGetSupabase.mockReturnValue(stub.client)

    expect((await callRoute()).status).toBe(200)

    const intake = stub.writes.filter((w) => w.table === "deep_assessments" && w.method === "update")
    expect(intake, "exactly one intake write").toHaveLength(1)
    expect(intake[0].filters["eq:stripe_session_id"]).toBe(SESSION_ID)
    expect(
      intake[0].filters["eq:updated_at"],
      "the write must be conditional on the token the boundary read",
    ).toBe(OBSERVED_UPDATED_AT)
    expect(
      (intake[0].payload as { updated_at?: string }).updated_at,
      "and must move the token, so a concurrent writer's guard fails",
    ).not.toBe(OBSERVED_UPDATED_AT)
  })

  it("a row whose token is NULL is guarded on IS NULL, not on equality", async () => {
    // `updated_at` is nullable, and `eq(col, null)` never matches in PostgREST.
    // A single `.eq()` for both cases would silently never land on a fresh row.
    const stub = makeSupabaseStub(queuesFor(found(LEGACY_QUESTIONS, { updated_at: null })))
    mockGetSupabase.mockReturnValue(stub.client)

    expect((await callRoute()).status).toBe(200)

    const intake = stub.writes.find((w) => w.table === "deep_assessments" && w.method === "update")!
    expect(intake.filters["is:updated_at"]).toBe(null)
    expect("eq:updated_at" in intake.filters).toBe(false)
  })

  it("a CAS that never converges is a retryable 503, not a forced write", async () => {
    const stub = makeSupabaseStub(queuesFor(found(LEGACY_QUESTIONS), { intake: { data: [] } }))
    // Every re-read finds the same legacy row; every write matches zero rows.
    for (let i = 0; i < 6; i += 1) {
      stub.queues.deep_assessments.splice(4 + i * 2, 0, found(LEGACY_QUESTIONS), { data: [] })
    }
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).toBe(503)
    expect((await res.json()).code).toBe("report_persistence_unavailable")
    expect(mockGeneratePDF).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })
})
