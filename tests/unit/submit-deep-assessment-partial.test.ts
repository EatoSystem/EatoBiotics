import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/**
 * Route-level tests for the partial-delivery owner alert in
 * POST /api/submit-deep-assessment: when a paid report finishes "partial"
 * (report exists but PDF or email delivery failed), the route must call
 * reportError() exactly once — with the session id and stage statuses, and
 * without any questionnaire answers, report content, or customer email — and
 * the customer-facing response must be unchanged by the alerting.
 *
 * External services are mocked per the money-paths.test.ts pattern. The route
 * runs in dev mode (no STRIPE_SECRET_KEY), which uses fixed free scores
 * (tier "personal") and skips Stripe verification, so the delivery stages
 * under test are reached without checkout fixtures. Claude is mocked to fail
 * so the real, pure buildFallbackPaidReport supplies the report.
 */

/* ── Chainable Supabase stub (queue-per-table, plus Storage) ────────────── */
type Queued = { data?: unknown; error?: unknown }

function makeSupabaseStub(
  queues: Record<string, Queued[]>,
  storageBehaviour: { uploadError?: string | null; signedUrl?: string | null } = {},
) {
  const writes: { table: string; method: string; payload: unknown }[] = []
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
    // Awaiting the chain itself (bare upsert with no terminal call) resolves the queue too.
    chain.then = (resolve: (v: Queued) => void) => resolve(next())
    return chain
  }
  const storage = {
    from: (_bucket: string) => ({
      upload: () =>
        Promise.resolve(
          storageBehaviour.uploadError
            ? { error: { message: storageBehaviour.uploadError } }
            : { error: null },
        ),
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
  return { client: { from, storage } as unknown, writes }
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
const SESSION_ID = "cs_test_partial_alert_1"
const ANSWER_SENTINEL = "SENTINEL-HEALTH-ANSWER-do-not-leak"
const BUYER_EMAIL = "buyer-sentinel@example.com"

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

/** Queue for a fresh (no prior row) run. Order of deep_assessments hits:
 *  1. idempotency select → no row
 *  2. step-3 email select → buyer email (for lead-name lookup)
 *  3. step-4 "analysing" upsert
 *  4. report upsert
 *  5. step-9 email select → buyer email (recipient lookup)
 *  6. final status upsert
 */
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

async function callRoute() {
  const { POST } = await import("@/app/api/submit-deep-assessment/route")
  return POST(makeRequest())
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("STRIPE_SECRET_KEY", "") // dev mode: fixed free scores, no Stripe call
  vi.stubEnv("RESEND_API_KEY", "re_test_key")
  vi.stubEnv("EMAIL_FROM", "reports@eatobiotics.com")
  // Default happy path: Claude fails (fallback report used), PDF + email succeed.
  mockMessagesCreate.mockRejectedValue(new Error("claude unavailable"))
  mockGeneratePDF.mockResolvedValue(Buffer.from("pdf-bytes"))
  mockSendEmail.mockResolvedValue({ ok: true })
  mockReportError.mockResolvedValue(undefined)
})

describe("submit-deep-assessment partial-delivery owner alert", () => {
  it("does not call reportError when report, PDF, and email all succeed", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toMatchObject({ ok: true, status: "complete" })
    expect(mockReportError).not.toHaveBeenCalled()
  })

  it("calls reportError exactly once when PDF generation fails", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)
    mockGeneratePDF.mockRejectedValue(new Error("renderer exploded"))

    const res = await callRoute()
    const body = await res.json()

    expect(body).toMatchObject({ ok: true, status: "partial" })
    expect(mockReportError).toHaveBeenCalledTimes(1)
    expect(mockReportError).toHaveBeenCalledWith(
      "submit-deep-assessment-partial",
      expect.stringContaining(`session=${SESSION_ID}`),
    )
    const detail = mockReportError.mock.calls[0][1] as string
    expect(detail).toContain("pdf=failed")
    expect(detail).toContain("email=sent")
    expect(detail).toContain("tier=personal")
    expect(detail).toContain("renderer exploded")
  })

  it("calls reportError exactly once when the report email fails", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)
    mockSendEmail.mockResolvedValue({ ok: false, error: "Resend 500" })

    const res = await callRoute()
    const body = await res.json()

    expect(body).toMatchObject({ ok: true, status: "partial" })
    expect(mockReportError).toHaveBeenCalledTimes(1)
    const detail = mockReportError.mock.calls[0][1] as string
    expect(detail).toContain(`session=${SESSION_ID}`)
    expect(detail).toContain("pdf=uploaded")
    expect(detail).toContain("email=failed")
    expect(detail).toContain("Resend 500")
  })

  it("never includes answers, report content, or the customer email in the alert", async () => {
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)
    mockSendEmail.mockResolvedValue({ ok: false, error: "Resend 500" })

    await callRoute()

    expect(mockReportError).toHaveBeenCalledTimes(1)
    const detail = mockReportError.mock.calls[0][1] as string
    expect(detail).not.toContain(ANSWER_SENTINEL)
    expect(detail).not.toContain(BUYER_EMAIL)
    // Fallback-report body text must not leak either — the alert carries only
    // statuses and infra error strings.
    expect(detail).not.toContain("gut")
    expect(detail).not.toMatch(/signedUrl|supabase\.co/)
  })

  it("returns the same partial response when the alert runs", async () => {
    // Proves the customer response is structurally independent of alerting:
    // same body as the partial scenarios above, with the alert having fired.
    mockGetSupabase.mockReturnValue(makeSupabaseStub(freshRunQueues()).client)
    mockGeneratePDF.mockRejectedValue(new Error("renderer exploded"))

    const res = await callRoute()
    const body = await res.json()

    expect(res.status).toBe(200)
    // `statusPersisted` reports whether the final bookkeeping write actually
    // landed; here it did, so the status reported is the one that was stored.
    expect(body).toEqual({ ok: true, pdfUrl: null, status: "partial", statusPersisted: true })
    expect(mockReportError).toHaveBeenCalledTimes(1)
  })
})
