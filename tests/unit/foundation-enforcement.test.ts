/* ── Server-side foundation enforcement ───────────────────────────────────
   Covers lib/assessment/foundation-server.ts and the three write routes it
   gates: POST /api/assessment/journey, POST /api/stability, and
   POST /api/send-results-email (mind only). Supabase is a chainable stub
   (mirrors tests/unit/money-paths.test.ts); reads are served from a
   per-table FIFO queue in call order, writes are recorded for assertions.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { NextRequest } from "next/server"
import { hasServerFoundation, payloadHasFoundation, payloadHasAddon } from "@/lib/assessment/foundation-server"

/* ── Chainable Supabase stub ──────────────────────────────────────────── */
type Recorded = { table: string; method: string; payload: unknown }
type Queued = { data?: unknown; error?: unknown }

function makeSupabaseStub(queues: Record<string, Queued[]>) {
  const writes: Recorded[] = []
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
    // Awaiting the chain itself (bare .update()/.upsert() with no terminal call) resolves the queue too.
    chain.then = (resolve: (v: Queued) => void) => resolve(next())
    return chain
  }
  return { client: { from } as unknown, writes }
}

/* ── Shared mocks for route-level tests ──────────────────────────────── */
const mockGetSupabase = vi.fn()
const mockGetUser = vi.fn()
const mockSendEmail = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/supabase-server", () => ({ getUser: () => mockGetUser() }))
vi.mock("@/lib/email/send", () => ({ sendEmail: (...a: unknown[]) => mockSendEmail(...a) }))

function jsonReq(body: unknown): NextRequest {
  return {
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as NextRequest
}

function validResult(overrides: Record<string, unknown> = {}) {
  return {
    overall: 72,
    subScores: { prebiotics: 70, probiotics: 65, postbiotics: 80 },
    profile: { type: "Balanced Builder", tagline: "On track", description: "Doing well.", color: "green" },
    insights: [],
    nextActions: ["Add more fibre"],
    completedAt: Date.now(),
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockSendEmail.mockResolvedValue({ ok: true })
  // send-results-email only calls sendEmail when RESEND_API_KEY is set — stub it
  // so the "not gated"/"gated" assertions can observe a real delivery attempt.
  vi.stubEnv("RESEND_API_KEY", "test-key")
})

afterEach(() => {
  vi.unstubAllEnvs()
})

/* ── hasServerFoundation / payload helpers ───────────────────────────── */
describe("hasServerFoundation", () => {
  it("finds foundation in leads by user_id", async () => {
    const { client } = makeSupabaseStub({ leads: [{ data: [{ id: "l1" }] }] })
    const result = await hasServerFoundation(client as never, { userId: "u1" })
    expect(result).toBe(true)
  })

  it("finds foundation in leads by normalized email", async () => {
    const { client } = makeSupabaseStub({ leads: [{ data: [{ id: "l2" }] }] })
    const result = await hasServerFoundation(client as never, { email: "  Test@Example.com  " })
    expect(result).toBe(true)
  })

  it("does not treat a Mind lead as foundation proof — queries assessment_type IN (gut, family)", async () => {
    const { client, writes } = makeSupabaseStub({ leads: [{ data: [] }] })
    // Spy on the `in` filter to confirm the query is scoped away from "mind".
    const calls: unknown[][] = []
    const original = (client as { from: (t: string) => Record<string, unknown> }).from
    ;(client as { from: (t: string) => Record<string, unknown> }).from = (table: string) => {
      const chain = original(table) as Record<string, (...a: unknown[]) => unknown>
      const realIn = chain.in
      chain.in = (...args: unknown[]) => {
        calls.push(args)
        return realIn(...args)
      }
      return chain
    }
    const result = await hasServerFoundation(client as never, { email: "mind-only@example.com" })
    expect(result).toBe(false)
    expect(calls).toContainEqual(["assessment_type", ["gut", "family"]])
    expect(writes).toEqual([])
  })

  it("finds foundation in assessment_journeys.summaries", async () => {
    const { client } = makeSupabaseStub({
      leads: [{ data: [] }],
      assessment_journeys: [{ data: { summaries: { you: { score: 80 } } } }],
    })
    const result = await hasServerFoundation(client as never, { userId: "u1" })
    expect(result).toBe(true)
  })

  it("returns false when neither source has a foundation", async () => {
    const { client } = makeSupabaseStub({
      leads: [{ data: [] }],
      assessment_journeys: [{ data: null }],
    })
    const result = await hasServerFoundation(client as never, { userId: "u1" })
    expect(result).toBe(false)
  })

  it("returns false with no identifying info at all", async () => {
    const { client } = makeSupabaseStub({})
    const result = await hasServerFoundation(client as never, {})
    expect(result).toBe(false)
  })
})

describe("payload helpers", () => {
  it("payloadHasFoundation recognises you/family, not add-ons alone", () => {
    expect(payloadHasFoundation({ you: {} })).toBe(true)
    expect(payloadHasFoundation({ family: {} })).toBe(true)
    expect(payloadHasFoundation({ mind: {} })).toBe(false)
    expect(payloadHasFoundation(null)).toBe(false)
  })

  it("payloadHasAddon recognises mind/glucose/performance/pregnancy/stability", () => {
    expect(payloadHasAddon({ mind: {} })).toBe(true)
    expect(payloadHasAddon({ glucose: {} })).toBe(true)
    expect(payloadHasAddon({ you: {} })).toBe(false)
    expect(payloadHasAddon(null)).toBe(false)
  })
})

/* ── POST /api/assessment/journey ────────────────────────────────────── */
describe("POST /api/assessment/journey", () => {
  it("rejects an add-on-only payload with no foundation anywhere", async () => {
    const { POST } = await import("@/app/api/assessment/journey/route")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const { client, writes } = makeSupabaseStub({
      leads: [{ data: [] }, { data: [] }], // by user_id, then by email
      assessment_journeys: [{ data: null }], // journeyHasFoundation maybeSingle
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(jsonReq({ journey: {}, summaries: { mind: { score: 70 } } }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: "Foundation assessment required before add-on assessment." })
    expect(writes.find((w) => w.table === "assessment_journeys")).toBeUndefined()
  })

  it("accepts a foundation-only payload (you/family) with no server-side check needed", async () => {
    const { POST } = await import("@/app/api/assessment/journey/route")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const { client, writes } = makeSupabaseStub({
      assessment_journeys: [{ error: null }], // the upsert itself
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(jsonReq({ journey: { foundationType: "you" }, summaries: { you: { score: 80 } } }))
    expect(res.status).toBe(200)
    expect(writes.some((w) => w.table === "assessment_journeys" && w.method === "upsert")).toBe(true)
  })

  it("accepts an add-on payload when the server already has a foundation on file", async () => {
    const { POST } = await import("@/app/api/assessment/journey/route")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const { client, writes } = makeSupabaseStub({
      leads: [{ data: [{ id: "l1" }] }], // found on the first (user_id) query
      assessment_journeys: [{ error: null }], // the upsert itself
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(jsonReq({ journey: {}, summaries: { mind: { score: 70 } } }))
    expect(res.status).toBe(200)
    expect(writes.some((w) => w.table === "assessment_journeys" && w.method === "upsert")).toBe(true)
  })

  it("accepts an add-on payload bundled together with its own foundation summary", async () => {
    const { POST } = await import("@/app/api/assessment/journey/route")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const { client, writes } = makeSupabaseStub({
      assessment_journeys: [{ error: null }],
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(jsonReq({ journey: {}, summaries: { you: { score: 80 }, mind: { score: 70 } } }))
    expect(res.status).toBe(200)
    expect(writes.some((w) => w.table === "assessment_journeys" && w.method === "upsert")).toBe(true)
  })
})

/* ── POST /api/stability ─────────────────────────────────────────────── */
describe("POST /api/stability", () => {
  it("rejects an assessment write with no foundation on file", async () => {
    const { POST } = await import("@/app/api/stability/route")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const { client, writes } = makeSupabaseStub({
      leads: [{ data: [] }, { data: [] }],
      assessment_journeys: [{ data: null }],
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(jsonReq({ assessment: { answers: {}, flags: {}, score: {} } }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: "Foundation assessment required before add-on assessment." })
    expect(writes.find((w) => w.table === "stability_assessments")).toBeUndefined()
  })

  it("accepts an assessment write once a foundation is on file", async () => {
    const { POST } = await import("@/app/api/stability/route")
    mockGetUser.mockResolvedValue({ id: "u1", email: "a@example.com" })
    const { client, writes } = makeSupabaseStub({
      leads: [{ data: [{ id: "l1" }] }],
      stability_assessments: [{ error: null }],
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(jsonReq({ assessment: { answers: {}, flags: {}, score: {} } }))
    expect(res.status).toBe(200)
    expect(writes.some((w) => w.table === "stability_assessments" && w.method === "upsert")).toBe(true)
  })
})

/* ── POST /api/send-results-email ────────────────────────────────────── */
describe("POST /api/send-results-email", () => {
  it("rejects a Mind submission with no foundation on file (anonymous)", async () => {
    const { POST } = await import("@/app/api/send-results-email/route")
    mockGetUser.mockResolvedValue(null)
    const { client, writes } = makeSupabaseStub({ leads: [{ data: [] }] })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(
      jsonReq({
        lead: { name: "Ada", email: "ada@example.com", ageBracket: "25-34" },
        result: validResult(),
        assessmentType: "mind",
      }),
    )
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: "Foundation assessment required before add-on assessment." })
    expect(mockSendEmail).not.toHaveBeenCalled()
    expect(writes.find((w) => w.table === "leads" && w.method === "update")).toBeUndefined()
  })

  it("accepts a Mind submission once a foundation is on file for that email", async () => {
    const { POST } = await import("@/app/api/send-results-email/route")
    mockGetUser.mockResolvedValue(null)
    const { client, writes } = makeSupabaseStub({
      leads: [{ data: [{ id: "l1" }] }, { error: null }], // foundation check, then the score update
    })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(
      jsonReq({
        lead: { name: "Ada", email: "ada@example.com", ageBracket: "25-34" },
        result: validResult(),
        assessmentType: "mind",
      }),
    )
    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalled()
    expect(writes.some((w) => w.table === "leads" && w.method === "update")).toBe(true)
  })

  it("does not gate gut/family submissions — foundation check only runs for mind", async () => {
    const { POST } = await import("@/app/api/send-results-email/route")
    mockGetUser.mockResolvedValue(null)
    const { client, writes } = makeSupabaseStub({ leads: [{ error: null }] }) // only the score update, no foundation check
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(
      jsonReq({
        lead: { name: "Ada", email: "ada@example.com", ageBracket: "25-34" },
        result: validResult(),
        assessmentType: "gut",
      }),
    )
    expect(res.status).toBe(200)
    expect(mockSendEmail).toHaveBeenCalled()
    expect(writes.some((w) => w.table === "leads" && w.method === "update")).toBe(true)
  })

  it("does not gate family submissions either", async () => {
    const { POST } = await import("@/app/api/send-results-email/route")
    mockGetUser.mockResolvedValue(null)
    const { client, writes } = makeSupabaseStub({ leads: [{ error: null }] })
    mockGetSupabase.mockReturnValue(client)

    const res = await POST(
      jsonReq({
        lead: { name: "Ada", email: "ada@example.com", ageBracket: "25-34" },
        result: validResult(),
        assessmentType: "family",
      }),
    )
    expect(res.status).toBe(200)
    expect(writes.some((w) => w.table === "leads" && w.method === "update")).toBe(true)
  })
})
