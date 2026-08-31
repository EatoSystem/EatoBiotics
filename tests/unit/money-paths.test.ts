/* ── Money-path route smoke tests ─────────────────────────────────────────
   Route-level coverage for handlers that move money or accounts: report
   checkout, the Stripe webhook, subscription checkout, and the auth callback. External
   services (Stripe, Supabase, Resend, Statsig) are mocked; the assertions
   target the routes' guard rails and the webhook's core state transition.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect, vi, beforeEach } from "vitest"
import type { NextRequest } from "next/server"
import {
  getPaidReportSummaryFromSession,
  STRIPE_METADATA_VALUE_LIMIT,
} from "@/lib/paid-report-session"

/* ── Chainable Supabase stub ──────────────────────────────────────────────
   Every query-builder method returns the chain; awaiting it resolves the
   next canned response queued for that table (default { data: null }).
   insert/update/upsert payloads are recorded for assertions. */
type Recorded = { table: string; method: string; payload: unknown }

function makeSupabaseStub(queues: Record<string, Array<{ data?: unknown; error?: unknown; count?: number }>>) {
  const writes: Recorded[] = []
  const from = (table: string) => {
    const next = () => (queues[table]?.shift() ?? { data: null, error: null })
    const chain: Record<string, unknown> = {}
    const self = () => chain
    for (const m of ["select", "eq", "neq", "in", "is", "not", "gte", "lte", "order", "limit"]) chain[m] = self
    for (const m of ["insert", "update", "upsert"]) {
      chain[m] = (payload: unknown) => { writes.push({ table, method: m, payload }); return chain }
    }
    chain.single = () => Promise.resolve(next())
    chain.maybeSingle = () => Promise.resolve(next())
    // Awaiting the chain itself (e.g. bare insert/update) resolves the queue too.
    chain.then = (resolve: (v: unknown) => void) => resolve(next())
    return chain
  }
  return { client: { from }, writes }
}

/* ── Shared mocks ──────────────────────────────────────────────────────── */
const mockGetSupabase = vi.fn()
const mockGetUser = vi.fn()
const mockConstructEvent = vi.fn()
const mockCheckoutCreate = vi.fn()
const mockCustomersCreate = vi.fn()

vi.mock("@/lib/supabase", () => ({ getSupabase: () => mockGetSupabase() }))
vi.mock("@/lib/supabase-server", () => ({
  getUser: () => mockGetUser(),
  getSupabaseServer: vi.fn(),
}))
vi.mock("@/lib/statsig-server", () => ({ logServerEvent: vi.fn().mockResolvedValue(undefined) }))
vi.mock("@/lib/stripe-server", () => ({
  stripe: {
    webhooks: { constructEvent: (...a: unknown[]) => mockConstructEvent(...a) },
    checkout: { sessions: { create: (...a: unknown[]) => mockCheckoutCreate(...a) } },
    customers: { create: (...a: unknown[]) => mockCustomersCreate(...a) },
  },
  getStripe: vi.fn(),
}))
vi.mock("resend", () => ({ Resend: class { emails = { send: vi.fn().mockResolvedValue({ error: null }) } } }))

/* ── Request stubs ─────────────────────────────────────────────────────── */
function webhookReq(opts: { sig?: string | null; body?: string }): NextRequest {
  return {
    headers: { get: (k: string) => (k.toLowerCase() === "stripe-signature" ? opts.sig ?? null : null) },
    text: () => Promise.resolve(opts.body ?? "{}"),
  } as unknown as NextRequest
}

function jsonReq(body: unknown, url = "http://localhost/api/x"): NextRequest {
  return {
    url,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as NextRequest
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.STRIPE_SECRET_KEY = "sk_test_money_paths"
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.RESEND_API_KEY // email sends are skipped in webhook paths
})

/* ══ Stripe webhook ══════════════════════════════════════════════════════ */
describe("POST /api/stripe/webhook", () => {
  it("returns 500 when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(webhookReq({ sig: "t" }))
    expect(res.status).toBe(500)
  })

  it("rejects a request with no stripe-signature header (400)", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(webhookReq({ sig: null }))
    expect(res.status).toBe(400)
  })

  it("rejects an invalid signature (400)", async () => {
    mockConstructEvent.mockImplementation(() => { throw new Error("bad sig") })
    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(webhookReq({ sig: "bad" }))
    expect(res.status).toBe(400)
  })

  it("dedupes an already-processed event", async () => {
    mockConstructEvent.mockReturnValue({ id: "evt_1", type: "customer.subscription.deleted", data: { object: {} } })
    const { client } = makeSupabaseStub({
      stripe_processed_events: [{ data: { event_id: "evt_1" } }],
    })
    mockGetSupabase.mockReturnValue(client)
    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(webhookReq({ sig: "ok" }))
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ deduped: true })
  })

  it("customer.subscription.deleted downgrades the profile to free/cancelled", async () => {
    mockConstructEvent.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.deleted",
      data: { object: { customer: "cus_1", current_period_end: 1893456000 } },
    })
    const { client, writes } = makeSupabaseStub({
      stripe_processed_events: [{ data: null }],          // not yet processed
      profiles: [
        { data: { id: "user-1" } },                       // lookup by customer id
        { data: { membership_tier: "restore" } },         // existing tier
        { data: null },                                   // update result
        { data: { email: "j@example.com", name: "J" } },  // (email branch — skipped, no RESEND key)
      ],
    })
    mockGetSupabase.mockReturnValue(client)
    const { POST } = await import("@/app/api/stripe/webhook/route")
    const res = await POST(webhookReq({ sig: "ok" }))
    expect(res.status).toBe(200)

    const profileUpdate = writes.find((w) => w.table === "profiles" && w.method === "update")
    expect(profileUpdate?.payload).toMatchObject({ membership_tier: "free", membership_status: "cancelled" })

    const subEvent = writes.find((w) => w.table === "subscription_events")
    expect(subEvent?.payload).toMatchObject({ event_type: "cancelled", from_tier: "restore", to_tier: "free" })

    expect(writes.some((w) => w.table === "stripe_processed_events" && w.method === "insert")).toBe(true)
  })
})

/* ══ One-time report checkout ════════════════════════════════════════════ */
describe("POST /api/checkout", () => {
  it("keeps the buyer's answers out of Stripe and stores them server-side", async () => {
    // Checkout now writes paid_report_intents before creating the session, so
    // the route needs a working client; a null one is a 503 by design.
    const { client, writes } = makeSupabaseStub({ paid_report_intents: [] })
    mockGetSupabase.mockReturnValue(client)
    const supabase = { writes }

    mockCheckoutCreate.mockResolvedValue({
      id: "cs_test_report_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_report_1",
      livemode: false,
    })

    const { POST } = await import("@/app/api/checkout/route")
    const res = await POST(jsonReq({
      tier: "personal",
      overall: 56,
      subScores: {
        prebiotics: 44,
        probiotics: 66,
        postbiotics: 67,
        feed: 44,
        seed: 66,
        heal: 67,
      },
      profile: {
        type: "Emerging Balance",
        tagline: "The pieces show up in your answers; the pattern is not yet steady.",
        description:
          "Your answers suggest the pieces are present but not yet settled into a daily rhythm. This pattern may indicate that repetition, rather than knowledge, is the gap. Small repeatable changes to any of the three pathways are a useful place to begin.",
        color: "var(--icon-lime)",
      },
      email: "Buyer@Example.com",
      foundationType: "you",
      selectedAddon: "glucose",
      // Checkout requires two answers — the health-data consent and a request
      // to start now — and refuses before Stripe is called without either.
      // See the dedicated tests in checkout-acknowledgement.test.ts.
      healthDataConsent: true,
      requestedImmediateStart: true,
    }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_report_1" })

    const [params] = mockCheckoutCreate.mock.calls[0] as [
      { customer_email?: string; metadata: Record<string, string>; mode: string; currency: string }
    ]
    expect(params.mode).toBe("payment")
    expect(params.currency).toBe("eur")
    expect(params.customer_email).toBe("buyer@example.com")
    // #244: the summary no longer travels in Stripe metadata. Stripe gets an
    // opaque token and nothing describing the buyer's answers. foundation_type
    // and selected_addon went too — which health system someone selected should
    // not be legible in a payments dashboard.
    expect(params.metadata.summary_token).toMatch(/^[0-9a-f]{64}$/)
    expect(params.metadata.report_tier).toBe("personal")
    expect(params.metadata.result_summary).toBeUndefined()
    expect(params.metadata.result_summary_parts).toBeUndefined()
    expect(params.metadata.foundation_type).toBeUndefined()
    expect(params.metadata.selected_addon).toBeUndefined()

    // The record of the start request lives on the session, so it survives
    // independently of our database. The health consent deliberately does NOT:
    // its home is the `consents` table, and whether someone consented to
    // health-data processing is not a payment fact.
    expect(params.metadata.requested_immediate_start).toBe("true")
    expect(params.metadata.requested_at).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(params.metadata.health_data_consent).toBeUndefined()

    // Nothing in the metadata may carry the profile prose, the email, or a score.
    const metadataBlob = JSON.stringify(params.metadata)
    expect(metadataBlob).not.toContain("Emerging Balance")
    expect(metadataBlob).not.toContain("buyer@example.com")
    expect(Object.keys(params.metadata).length).toBeLessThanOrEqual(50)
    for (const value of Object.values(params.metadata)) {
      expect(value.length).toBeLessThanOrEqual(STRIPE_METADATA_VALUE_LIMIT)
    }

    // The summary is written server-side instead, before the session exists,
    // so a failure costs nothing: no session, no payment page, no charge.
    const intentWrite = supabase.writes.find(
      (w) => w.table === "paid_report_intents" && w.method === "insert",
    )
    expect(intentWrite, "checkout must persist the summary before creating a session").toBeTruthy()
    const persisted = (intentWrite!.payload as { token: string; summary: Record<string, unknown> })
    expect(persisted.token).toBe(params.metadata.summary_token)
    expect(persisted.summary).toMatchObject({
      tier: "personal",
      overall: 56,
      email: "buyer@example.com",
      foundationType: "you",
      selectedAddon: "glucose",
    })
  })
})

/* ══ Subscription checkout ═══════════════════════════════════════════════ */
describe("POST /api/stripe/create-subscription-checkout", () => {
  it("requires authentication (401)", async () => {
    mockGetUser.mockResolvedValue(null)
    const { POST } = await import("@/app/api/stripe/create-subscription-checkout/route")
    const res = await POST(jsonReq({ priceId: "price_x" }))
    expect(res.status).toBe(401)
  })

  it("rejects a price ID that is not one of ours (400)", async () => {
    mockGetUser.mockResolvedValue({ id: "user-1", email: "j@example.com" })
    const { POST } = await import("@/app/api/stripe/create-subscription-checkout/route")
    const res = await POST(jsonReq({ priceId: "price_attacker" }))
    expect(res.status).toBe(400)
    expect(mockCheckoutCreate).not.toHaveBeenCalled()
  })
})

/* ══ Auth callback ═══════════════════════════════════════════════════════ */
describe("GET /api/auth/callback", () => {
  it("redirects to the assessment with an error when no code is present", async () => {
    const { GET } = await import("@/app/api/auth/callback/route")
    const res = await GET(jsonReq({}, "http://localhost:3000/api/auth/callback"))
    expect(res.status).toBeGreaterThanOrEqual(300)
    expect(res.status).toBeLessThan(400)
    expect(res.headers.get("location")).toContain("/assessment?error=no_code")
  })
})
