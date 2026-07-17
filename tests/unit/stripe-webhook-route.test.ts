/**
 * /api/stripe/webhook — handler-level tests for the money-path boundary.
 *
 * Same harness as tests/unit/analyse-meal-auth.test.ts: run the real route
 * handler in-process, mock at the package/lib boundary. Covers the guard
 * rails that protect billing state: secret configuration, signature
 * verification, and event idempotency (Stripe redelivers on retry — a
 * double-applied event would double-apply membership changes).
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/** Controlled per test: what stripe.webhooks.constructEvent does. */
let constructResult: { id: string; type: string; data: { object: unknown } } | Error =
  new Error("not configured")

vi.mock("@/lib/stripe-server", () => ({
  stripe: {
    webhooks: {
      constructEvent: () => {
        if (constructResult instanceof Error) throw constructResult
        return constructResult
      },
    },
    subscriptions: { retrieve: async () => ({}) },
  },
}))

/** Controlled per test: pre-existing stripe_processed_events row. */
let processedRow: { event_id: string } | null = null
/** Spy on the processed-event marker insert. */
const processedInsertSpy = vi.fn(async () => ({ error: null }))

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => {
      if (table === "stripe_processed_events") {
        return {
          select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: processedRow }) }) }),
          insert: processedInsertSpy,
        }
      }
      // Generic inert builder for any other table the handler touches.
      const b: Record<string, unknown> = {}
      Object.assign(b, {
        select: () => b,
        eq: () => b,
        maybeSingle: async () => ({ data: null }),
        single: async () => ({ data: null }),
        update: () => b,
        upsert: async () => ({ error: null }),
        insert: async () => ({ error: null }),
      })
      return b
    },
  }),
}))

vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => ({})) }))
vi.mock("@/lib/statsig-server", () => ({ logServerEvent: vi.fn(async () => {}) }))
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn(async () => {}) }))
vi.mock("@/lib/email/welcome-subscription-email", () => ({ welcomeSubscriptionEmailHtml: () => "" }))
vi.mock("@/lib/email/paid-onboarding-email", () => ({ cancellationEmail: () => ({ subject: "", html: "" }) }))
vi.mock("@/lib/paid-report-session", () => ({
  getPaidReportSummaryFromSession: () => null,
  isCheckoutSessionSettled: () => false,
}))
vi.mock("@/lib/auth/reconcile-account", () => ({
  decideTrialActivation: () => ({ activate: false }),
}))
vi.mock("@/lib/membership", () => ({
  tierFromPriceId: () => null,
  isFoundingMember: () => false,
}))

async function post(headers: Record<string, string> = {}, body = "{}") {
  const { POST } = await import("@/app/api/stripe/webhook/route")
  return POST(
    new NextRequest("http://localhost/api/stripe/webhook", { method: "POST", headers, body }),
  )
}

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
  constructResult = new Error("signature verification failed")
  processedRow = null
  processedInsertSpy.mockClear()
})

describe("/api/stripe/webhook guard rails", () => {
  it("500s when STRIPE_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const res = await post({ "stripe-signature": "sig" })
    expect(res.status).toBe(500)
  })

  it("400s when the stripe-signature header is missing", async () => {
    const res = await post()
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Missing stripe-signature header")
  })

  it("400s when signature verification fails", async () => {
    const res = await post({ "stripe-signature": "bad-sig" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe("Invalid signature")
  })

  it("dedupes an already-processed event without reprocessing or re-marking it", async () => {
    constructResult = { id: "evt_1", type: "customer.subscription.updated", data: { object: {} } }
    processedRow = { event_id: "evt_1" }
    const res = await post({ "stripe-signature": "sig" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true, deduped: true })
    expect(processedInsertSpy).not.toHaveBeenCalled()
  })

  it("acknowledges an unknown event type and records it as processed", async () => {
    constructResult = { id: "evt_2", type: "some.future.event", data: { object: {} } }
    const res = await post({ "stripe-signature": "sig" })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(processedInsertSpy).toHaveBeenCalledTimes(1)
    expect(processedInsertSpy).toHaveBeenCalledWith({ event_id: "evt_2", event_type: "some.future.event" })
  })
})
