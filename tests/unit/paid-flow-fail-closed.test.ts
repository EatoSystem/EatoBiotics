/**
 * The routes must fail CLOSED when the bypass is denied — matrix rows H, I, J.
 *
 * lib/paid-flow-policy.ts decides *whether* an unverified paid flow may run;
 * this file proves the two routes actually behave that way. The distinction
 * matters: a correct policy consumed at the wrong point in a route still lets
 * body-supplied scores through, or still writes the paid-shaped row that
 * reconcile-account.ts later reads as proof of purchase.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import { UNVERIFIED_PAID_FLOW_FLAG } from "@/lib/paid-flow-policy"

const mockGetSupabase = vi.fn()
const mockRetrieveSession = vi.fn()
const mockMessagesCreate = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/anthropic", () => ({
  anthropic: { messages: { create: (...a: unknown[]) => mockMessagesCreate(...a) } },
  CLAUDE_MODEL: "claude-test",
}))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => mockRetrieveSession(...a) } } },
}))

/** Records every write so "no paid-shaped row was created" is checkable. */
function recordingDb() {
  const writes: { table: string; method: string }[] = []
  const from = (table: string) => {
    const chain: Record<string, unknown> = {}
    for (const m of ["select", "eq", "order", "limit"]) chain[m] = () => chain
    for (const m of ["insert", "upsert", "update"]) {
      chain[m] = () => {
        writes.push({ table, method: m })
        return chain
      }
    }
    chain.maybeSingle = () => Promise.resolve({ data: null, error: null })
    chain.single = () => Promise.resolve({ data: null, error: null })
    chain.then = (resolve: (v: unknown) => void) => resolve({ data: null, error: null })
    return chain
  }
  return { client: { from }, writes }
}

let db = recordingDb()

/** A body that claims a perfect score and a premium tier — pure client assertion. */
const HOSTILE_BODY = {
  sessionId: "cs_hostile_1",
  tier: "premium",
  overall: 99,
  subScores: { prebiotics: 99, probiotics: 99, postbiotics: 99 },
  profile: { type: "Thriving", tagline: "t", description: "d" },
  email: "attacker@example.com",
  selectedAddon: "glucose",
}

function post(body: unknown) {
  return new NextRequest("http://localhost/api/generate-deep-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  db = recordingDb()
  mockGetSupabase.mockReturnValue(db.client)
  // A production-like runtime with NO Vercel signal: the shape the policy must
  // refuse to guess about. Stripe is absent — the condition that used to GRANT.
  vi.stubEnv("NODE_ENV", "production")
  vi.stubEnv("VERCEL_ENV", "")
  vi.stubEnv("STRIPE_SECRET_KEY", "")
})
afterEach(() => vi.unstubAllEnvs())

describe("G/I/J — a hostile body cannot buy itself authority", () => {
  it("refuses, and never trusts the body, when Stripe is absent and the bypass is denied", async () => {
    // The old rule: no STRIPE_SECRET_KEY meant "development", so this exact
    // request produced a questionnaire built from the attacker's own scores.
    mockRetrieveSession.mockRejectedValue(new Error("No API key provided"))
    const { POST } = await import("@/app/api/generate-deep-questions/route")

    const res = await POST(post(HOSTILE_BODY))

    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = await res.json()
    expect(JSON.stringify(body)).not.toContain("Thriving")
  })

  it("J — creates no deep_assessments row on the fail-closed path", async () => {
    // The consequential half. reconcile-account.ts counts ANY deep_assessments
    // row for a user as proof of purchase when granting the 30-day trial, so a
    // row written here would become free paid access at next sign-in.
    mockRetrieveSession.mockRejectedValue(new Error("No API key provided"))
    const { POST } = await import("@/app/api/generate-deep-questions/route")

    await POST(post(HOSTILE_BODY))

    const paidWrites = db.writes.filter((w) => w.table === "deep_assessments")
    expect(paidWrites, "no paid-shaped row may exist without a settled payment").toEqual([])
  })

  it("still refuses when the flag is set but the runtime cannot be proven safe", async () => {
    // Flag on, production-like runtime, no Vercel signal → denied.
    vi.stubEnv(UNVERIFIED_PAID_FLOW_FLAG, "true")
    mockRetrieveSession.mockRejectedValue(new Error("No API key provided"))
    const { POST } = await import("@/app/api/generate-deep-questions/route")

    const res = await POST(post(HOSTILE_BODY))

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(db.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })

  it("refuses on Vercel production even with the flag set", async () => {
    vi.stubEnv(UNVERIFIED_PAID_FLOW_FLAG, "true")
    vi.stubEnv("VERCEL_ENV", "production")
    mockRetrieveSession.mockRejectedValue(new Error("No API key provided"))
    const { POST } = await import("@/app/api/generate-deep-questions/route")

    const res = await POST(post(HOSTILE_BODY))

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(db.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })
})

describe("H — the verified path is untouched", () => {
  it("still refuses an unsettled session rather than falling back to the body", async () => {
    // Stripe configured and reachable, session not paid. This must 401 on the
    // payment, not quietly degrade into the development path.
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_present")
    mockRetrieveSession.mockResolvedValue({
      id: "cs_hostile_1",
      payment_status: "unpaid",
      metadata: {},
    })
    const { POST } = await import("@/app/api/generate-deep-questions/route")

    const res = await POST(post(HOSTILE_BODY))

    expect(res.status).toBe(401)
    expect(db.writes.filter((w) => w.table === "deep_assessments")).toEqual([])
  })
})
