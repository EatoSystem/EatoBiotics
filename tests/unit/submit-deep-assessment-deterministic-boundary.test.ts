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
type Queued = { data?: unknown; error?: unknown }

function makeSupabaseStub(queues: Record<string, Queued[]>) {
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
    chain.then = (resolve: (v: Queued) => void) => resolve(next())
    return chain
  }
  const storage = {
    from: () => ({
      upload: () => Promise.resolve({ error: null }),
      createSignedUrl: (p: string) =>
        Promise.resolve({ data: { signedUrl: `https://signed.example.com/${p}` }, error: null }),
    }),
  }
  return { client: { from, storage } as unknown, writes }
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

/** The idempotency select, then the step-3 email lookup, then the writes. */
function queuesFor(existingQuestions: unknown): Record<string, Queued[]> {
  return {
    deep_assessments: [
      { data: existingQuestions === undefined ? null : { status: "in_progress", questions: existingQuestions } },
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
    const stub = makeSupabaseStub(queuesFor(snapshot()))
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
    const stub = makeSupabaseStub(queuesFor(snapshot()))
    mockGetSupabase.mockReturnValue(stub.client)

    await callRoute()

    expect(JSON.stringify(stub.writes)).not.toContain(ANSWER_SENTINEL)
  })

  it("nothing downstream of the write runs either", async () => {
    // No Claude call, no PDF, no email. The key is set in `beforeEach`, so the
    // generation branch is genuinely reachable and not reaching it is a signal.
    const stub = makeSupabaseStub(queuesFor(snapshot()))
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
  it("a stored DeepQuestion[] passes the boundary and writes intake", async () => {
    const stub = makeSupabaseStub(
      queuesFor([{ id: "q1", question: "How is your digestion?", type: "scale" }]),
    )
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).not.toBe(409)
    const writes = stub.writes.filter((w) => w.table === "deep_assessments")
    expect(writes.length).toBeGreaterThan(0)
    expect(writes[0].method).toBe("upsert")
  })

  it("a first submit with nothing stored passes, exactly as before", async () => {
    const stub = makeSupabaseStub(queuesFor(undefined))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).not.toBe(409)
    expect(stub.writes.filter((w) => w.table === "deep_assessments").length).toBeGreaterThan(0)
  })

  it("a row whose questions column is explicitly null passes", async () => {
    const stub = makeSupabaseStub(queuesFor(null))
    mockGetSupabase.mockReturnValue(stub.client)

    const res = await callRoute()

    expect(res.status).not.toBe(409)
    expect(stub.writes.filter((w) => w.table === "deep_assessments").length).toBeGreaterThan(0)
  })
})
