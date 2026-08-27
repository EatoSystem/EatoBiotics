import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/**
 * Persistence truth for POST /api/submit-deep-assessment.
 *
 * An awaited PostgREST call RESOLVES with `{ error }` rather than throwing, so
 * the route's `try/catch` around each write only ever caught transport-level
 * throws. Every `{ error }` return was discarded, and the route continued as if
 * the row had been written.
 *
 * Three writes, three different customer consequences:
 *
 *   step 4  intake ("analysing")  — no row exists, so a Claude call is paid for,
 *                                   a PDF is uploaded and an email is sent, all
 *                                   hanging off nothing. `reportViewState(null,
 *                                   false)` sends the buyer back into the intake
 *                                   questionnaire; the emailed link dies in 7 days.
 *   step 6  report_json           — the worst one. `reportOk` was hard-coded true,
 *                                   so overall status could be written "complete"
 *                                   with `report_json` null: the buyer is emailed
 *                                   "your report is ready", the site refuses to
 *                                   render it, and no partial alert fires because
 *                                   the status says complete.
 *   step 10 delivery status       — benign for access (the report is durable and
 *                                   still renders) but the response claimed a
 *                                   status that was never stored.
 *
 * These tests drive the real route with mocked collaborators and assert on
 * observable behaviour — which downstream calls happened, what the customer got
 * back — rather than reading the source. Harness mirrors
 * submit-deep-assessment-partial.test.ts.
 */

/* ── Chainable Supabase stub (queue-per-table, plus Storage) ────────────── */
type Queued = { data?: unknown; error?: unknown }

function makeSupabaseStub(
  queues: Record<string, Queued[]>,
  storageBehaviour: { uploadError?: string | null; signedUrl?: string | null } = {},
) {
  const writes: { table: string; method: string; payload: unknown }[] = []
  const uploads: string[] = []
  const from = (table: string) => {
    const next = (): Queued => queues[table]?.shift() ?? { data: null, error: null }
    const chain: Record<string, unknown> = {}
    const self = () => chain
    for (const m of ["select", "eq", "in", "not", "order", "limit"]) chain[m] = self
    for (const m of ["insert", "update", "upsert"]) {
      chain[m] = (payload: unknown) => {
        writes.push({ table, method: m, payload })
        return chain
      }
    }
    chain.maybeSingle = () => Promise.resolve(next())
    chain.single = () => Promise.resolve(next())
    chain.then = (resolve: (v: Queued) => void) => resolve(next())
    return chain
  }
  const storage = {
    from: (_bucket: string) => ({
      upload: (path: string) => {
        uploads.push(path)
        return Promise.resolve(
          storageBehaviour.uploadError
            ? { error: { message: storageBehaviour.uploadError } }
            : { error: null },
        )
      },
      createSignedUrl: (path: string) =>
        Promise.resolve({
          data:
            storageBehaviour.signedUrl === null
              ? null
              : { signedUrl: storageBehaviour.signedUrl ?? `https://signed.example.com/${path}` },
          error: null,
        }),
    }),
  }
  return { client: { from, storage } as unknown, writes, uploads }
}

/* ── Shared mocks ───────────────────────────────────────────────────────── */
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
vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))
vi.mock("@/lib/report-error", () => ({
  reportError: (...args: unknown[]) => mockReportError(...args),
}))

/* ── Fixtures ───────────────────────────────────────────────────────────── */
const SESSION_ID = "cs_test_persistence_truth_1"
const ANSWER_SENTINEL = "SENTINEL-HEALTH-ANSWER-do-not-leak"
const BUYER_EMAIL = "buyer-sentinel@example.com"
const DB_ERROR = "permission denied for table deep_assessments"

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
 * Order of `deep_assessments` queue hits on a fresh run:
 *  0 idempotency select → no row
 *  1 step-3 email select → buyer email
 *  2 step-4 "analysing" upsert      ← intake write
 *  3 step-6 report upsert            ← report persistence
 *  4 step-9 email select → buyer email
 *  5 step-10 final status upsert     ← delivery bookkeeping
 */
const INTAKE_WRITE = 2
const REPORT_WRITE = 3
const STATUS_WRITE = 5

function freshRunQueues(): Record<string, Queued[]> {
  return {
    deep_assessments: [
      { data: null },
      { data: { email: BUYER_EMAIL } },
      { data: null },
      { data: null },
      { data: { email: BUYER_EMAIL } },
      { data: null },
    ],
    leads: [{ data: null }],
  }
}

/** Same queue, with one write position returning a PostgREST `{ error }`. */
function queuesWithFailureAt(index: number): Record<string, Queued[]> {
  const q = freshRunQueues()
  q.deep_assessments[index] = { data: null, error: { message: DB_ERROR } }
  return q
}

async function callRoute() {
  const { POST } = await import("@/app/api/submit-deep-assessment/route")
  return POST(makeRequest())
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_SECRET_KEY", "") // dev mode: fixed free scores, no Stripe call
  vi.stubEnv("RESEND_API_KEY", "re_test_key")
  vi.stubEnv("EMAIL_FROM", "reports@eatobiotics.com")
  // Set so the generation branch is genuinely reachable. Without a key the
  // route short-circuits to the deterministic builder and never calls Claude on
  // ANY path — which would make "no Claude call was made" vacuously true in the
  // intake test below. With the key set, the call is attempted and rejected, so
  // not reaching it is a real signal.
  vi.stubEnv("ANTHROPIC_API_KEY", "sk-test-key")
  mockMessagesCreate.mockRejectedValue(new Error("claude unavailable"))
  mockGeneratePDF.mockResolvedValue(Buffer.from("pdf-bytes"))
  mockSendEmail.mockResolvedValue({ ok: true })
  mockReportError.mockResolvedValue(undefined)
})

/* ══ Write 1 — intake ════════════════════════════════════════════════════ */

describe("intake write failure stops the request before anything is spent", () => {
  it("returns a retryable 503 and never starts Claude, PDF or email", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(INTAKE_WRITE)).client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.ok).toBeUndefined()
    expect(body.code).toBe("report_persistence_unavailable")

    // The three things that cost money or reach the customer.
    expect(mockMessagesCreate, "no Claude call may be paid for").not.toHaveBeenCalled()
    expect(mockGeneratePDF, "no PDF may be generated").not.toHaveBeenCalled()
    expect(mockSendEmail, "no email may be sent").not.toHaveBeenCalled()
  })

  it("leaks no database internals or answers to the caller", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(INTAKE_WRITE)).client)

    const body = JSON.stringify(await (await callRoute()).json())

    expect(body).not.toContain(DB_ERROR)
    expect(body).not.toContain("permission denied")
    expect(body).not.toContain(ANSWER_SENTINEL)
    expect(body).not.toContain(BUYER_EMAIL)
  })

  it("alerts the owner with identifiers and stage only", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(INTAKE_WRITE)).client)

    await callRoute()

    expect(mockReportError).toHaveBeenCalledTimes(1)
    const [tag, detail] = mockReportError.mock.calls[0] as [string, string]
    expect(tag).toBe("submit-deep-assessment-intake-write-failed")
    expect(detail).toContain(`session=${SESSION_ID}`)
    expect(detail).toContain("generation=not_started")
    expect(detail).not.toContain(ANSWER_SENTINEL)
    expect(detail).not.toContain(BUYER_EMAIL)
  })
})

/* ══ Write 2 — report_json ═══════════════════════════════════════════════ */

describe("report persistence failure is never dressed up as success", () => {
  it("does not return ok:true", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(REPORT_WRITE)).client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.ok).toBeUndefined()
    expect(body.code).toBe("report_persistence_failed")
    expect(body.status).not.toBe("complete")
  })

  it("sends no delivery email for a report the buyer could not open", async () => {
    // The defect this closes: an emailed "your report is ready" backed by a row
    // that renders as resume_questionnaire.
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(REPORT_WRITE)).client)

    await callRoute()

    expect(mockSendEmail, "delivery must be withheld").not.toHaveBeenCalled()
  })

  it("does not upload a PDF for an unrecoverable report", async () => {
    const stub = makeSupabaseStub(queuesWithFailureAt(REPORT_WRITE))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(stub.uploads).toEqual([])
  })

  it("alerts the owner without answers or report prose", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(REPORT_WRITE)).client)

    await callRoute()

    expect(mockReportError).toHaveBeenCalledTimes(1)
    const [tag, detail] = mockReportError.mock.calls[0] as [string, string]
    expect(tag).toBe("submit-deep-assessment-report-persist-failed")
    expect(detail).toContain(`session=${SESSION_ID}`)
    expect(detail).toContain("delivery=withheld")
    expect(detail).not.toContain(ANSWER_SENTINEL)
    expect(detail).not.toContain(BUYER_EMAIL)
    // Fallback report body text must not ride along in the alert.
    expect(detail).not.toContain("gut")
  })

  it("never writes a status that claims the report is complete", async () => {
    const stub = makeSupabaseStub(queuesWithFailureAt(REPORT_WRITE))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    const statusValues = stub.writes
      .filter((w) => w.table === "deep_assessments")
      .map((w) => (w.payload as { status?: string }).status)
    expect(statusValues, "no write may mark this session complete").not.toContain("complete")
  })
})

/* ══ Write 3 — delivery bookkeeping ══════════════════════════════════════ */

describe("final status write failure reports the durable truth", () => {
  it("keeps the buyer's access and does not claim a status it failed to store", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(STATUS_WRITE)).client)

    const res = await callRoute()
    const body = await res.json()

    // The report IS durable — step 6 succeeded — so access is preserved.
    expect(res.status).toBe(200)
    expect(body.ok).toBe(true)

    // The row still carries step 6's value. Reporting "complete" here would
    // describe a write that did not happen.
    expect(body.statusPersisted).toBe(false)
    expect(body.status).toBe("analysing")
  })

  it("alerts the owner even though every delivery stage succeeded", async () => {
    // Previously silent: overall_status was "complete", so the partial alert
    // never fired, and the failed bookkeeping write went unnoticed.
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(STATUS_WRITE)).client)

    await callRoute()

    expect(mockReportError).toHaveBeenCalledTimes(1)
    const detail = mockReportError.mock.calls[0][1] as string
    expect(detail).toContain("statusPersisted=false")
    expect(detail).toContain("pdf=uploaded")
    expect(detail).toContain("email=sent")
  })

  it("still delivered the PDF and email — the failure is bookkeeping only", async () => {
    const stub = makeSupabaseStub(queuesWithFailureAt(STATUS_WRITE))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(stub.uploads).toHaveLength(1)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })
})

/* ══ reportOk derives from the verified write ════════════════════════════ */

describe("reportOk is derived, not asserted", () => {
  it("a run whose report write succeeded can reach complete", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)

    const body = await (await callRoute()).json()

    expect(body).toMatchObject({ ok: true, status: "complete", statusPersisted: true })
    expect(mockReportError).not.toHaveBeenCalled()
  })

  it("a run whose report write failed can never reach complete", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(queuesWithFailureAt(REPORT_WRITE)).client)

    const body = await (await callRoute()).json()

    expect(body.status).not.toBe("complete")
  })
})

/* ══ Partial-delivery states survive the change ══════════════════════════ */

describe("existing partial states are unchanged", () => {
  it("PDF failure still yields partial with the report intact", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)
    mockGeneratePDF.mockRejectedValue(new Error("renderer exploded"))

    const body = await (await callRoute()).json()

    expect(body).toMatchObject({ ok: true, status: "partial", statusPersisted: true })
    expect(mockReportError).toHaveBeenCalledTimes(1)
  })

  it("email failure still yields partial with the report intact", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)
    mockSendEmail.mockResolvedValue({ ok: false, error: "Resend 500" })

    const body = await (await callRoute()).json()

    expect(body).toMatchObject({ ok: true, status: "partial", statusPersisted: true })
    expect(mockReportError).toHaveBeenCalledTimes(1)
  })

  it("the deterministic fallback report is still delivered", async () => {
    // Claude is rejected in beforeEach, so this whole file runs on the fallback.
    // Asserted explicitly so a regression that made fallbacks undeliverable
    // fails here by name.
    const stub = makeSupabaseStub(freshRunQueues())
    mockGetSupabase.mockReturnValue(stub.client)

    const body = await (await callRoute()).json()

    expect(body.ok).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    const reportWrite = stub.writes.find(
      (w) => (w.payload as { report_json?: unknown }).report_json !== undefined,
    )
    expect(reportWrite, "the fallback report must still be persisted").toBeTruthy()
  })
})

/* ══ Retry safety ════════════════════════════════════════════════════════ */

describe("paid fulfilment fails closed without a database", () => {
  it("returns 503 and spends nothing when getSupabase() returns null", async () => {
    // Previously every write was skipped, the route returned ok:true, and the
    // customer was emailed a report backed by no row at all.
    mockGetSupabase.mockReturnValue(null)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body.ok).toBeUndefined()
    expect(body.code).toBe("report_persistence_unavailable")

    expect(mockMessagesCreate, "no Claude call may be paid for").not.toHaveBeenCalled()
    expect(mockGeneratePDF, "no PDF may be generated").not.toHaveBeenCalled()
    expect(mockSendEmail, "no email may be sent").not.toHaveBeenCalled()
  })

  it("leaks nothing to the caller when the database is missing", async () => {
    mockGetSupabase.mockReturnValue(null)

    const body = JSON.stringify(await (await callRoute()).json())

    expect(body).not.toContain(ANSWER_SENTINEL)
    expect(body).not.toContain(BUYER_EMAIL)
    expect(body).not.toMatch(/supabase|service.role|SUPABASE_URL/i)
  })
})

/* ══ Email idempotency across a failed status write ══════════════════════ */

describe("the customer email is sent at most once per session", () => {
  /**
   * The window this closes: the email is sent BEFORE the step-10 upsert, so a
   * failed status write leaves `email_status` un-persisted. Re-invoking the
   * route then re-sent. The `email_sends` ledger is written immediately after a
   * successful send, so it survives that failure.
   */
  function queuesWithLedger(ledgerRows: Queued[], statusWriteFails: boolean) {
    const q = statusWriteFails ? queuesWithFailureAt(STATUS_WRITE) : freshRunQueues()
    return { ...q, email_sends: ledgerRows }
  }

  it("records the delivery in email_sends immediately, not in the final write", async () => {
    const stub = makeSupabaseStub(queuesWithLedger([{ data: null }, { data: null }], false))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    const ledgerWrite = stub.writes.find((w) => w.table === "email_sends")
    expect(ledgerWrite, "a successful send must be recorded in the ledger").toBeTruthy()
    expect(ledgerWrite!.payload).toMatchObject({
      email: BUYER_EMAIL,
      kind: `paid_report:${SESSION_ID}`,
    })
  })

  it("does not re-send when the status write failed and the route is invoked again", async () => {
    // Call 1: everything delivers, but the final status upsert fails — so
    // `email_status` never reaches the row. The ledger insert did land.
    const first = makeSupabaseStub(queuesWithLedger([{ data: null }, { data: null }], true))
    mockGetSupabase.mockReturnValue(first.client)

    const firstBody = await (await callRoute()).json()
    expect(firstBody.statusPersisted).toBe(false)
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(first.writes.some((w) => w.table === "email_sends")).toBe(true)

    // Call 2: same session. The row still says "analysing" with no email_status
    // — the ONLY durable evidence of delivery is the ledger row.
    mockSendEmail.mockClear()
    const second = makeSupabaseStub(
      queuesWithLedger([{ data: { id: "ledger-row-from-call-1" } }], false),
    )
    mockGetSupabase.mockReturnValue(second.client)

    const secondBody = await (await callRoute()).json()

    expect(mockSendEmail, "the buyer must not be emailed twice").not.toHaveBeenCalled()
    expect(secondBody.ok).toBe(true)
  })

  it("skips the send rather than risking a duplicate when the ledger cannot be read", async () => {
    const stub = makeSupabaseStub(
      queuesWithLedger([{ data: null, error: { message: DB_ERROR } }], false),
    )
    mockGetSupabase.mockReturnValue(stub.client)

    const body = await (await callRoute()).json()

    expect(mockSendEmail, "an unreadable ledger cannot prove a first send").not.toHaveBeenCalled()
    // The report is durable and viewable; only delivery is deferred.
    expect(body.ok).toBe(true)
    expect(body.status).toBe("partial")
  })

  it("alerts the owner when the send succeeded but the ledger write failed", async () => {
    const stub = makeSupabaseStub(
      queuesWithLedger([{ data: null }, { data: null, error: { message: DB_ERROR } }], false),
    )
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    const ledgerAlert = mockReportError.mock.calls.find(
      (c) => c[0] === "submit-deep-assessment-email-ledger-write-failed",
    )
    expect(ledgerAlert, "an unrecorded delivery leaves a duplicate window open").toBeTruthy()
    expect(ledgerAlert![1]).toContain("risk=duplicate_on_retry")
    expect(ledgerAlert![1]).not.toContain(ANSWER_SENTINEL)
  })
})

describe("a retry cannot silently duplicate a completed delivery", () => {
  it("reuses a prior successful run without re-generating, re-uploading or re-emailing", async () => {
    // A row that already completed: report present, PDF uploaded, email sent.
    const priorRow = {
      status: "complete",
      pdf_url: "https://signed.example.com/prior.pdf",
      report_json: { summary: "already generated", _meta: {} },
      pdf_status: "uploaded",
      email_status: "sent",
      email_sent_at: "2026-08-01T00:00:00.000Z",
      questions: [{ id: "q1", question: "How is your digestion?", type: "scale" }],
    }
    const stub = makeSupabaseStub({
      deep_assessments: [
        { data: priorRow },
        { data: { email: BUYER_EMAIL } },
        { data: null },
        { data: null },
        { data: { email: BUYER_EMAIL } },
        { data: null },
      ],
      leads: [{ data: null }],
    })
    mockGetSupabase.mockReturnValue(stub.client)

    const body = await (await callRoute()).json()

    expect(body.ok).toBe(true)
    expect(mockMessagesCreate, "must not pay for Claude again").not.toHaveBeenCalled()
    expect(stub.uploads, "must not re-upload the PDF").toEqual([])
    expect(mockSendEmail, "must not re-send the delivery email").not.toHaveBeenCalled()
  })
})
