/**
 * Cancelling renewal keeps the period already paid for.
 *
 * ══ THE INVARIANT ═══════════════════════════════════════════════════════════
 *
 * Cancelling renewal must stop the next renewal. It must not remove access
 * before the current paid period ends.
 *
 * `/api/stripe/cancel-subscription` used to write `membership_status:
 * "cancelled"` straight after scheduling `cancel_at_period_end`, and
 * `getUserMembershipTier` returns `free` for `cancelled` — so access ended on
 * the click. These cases run the REAL cancel route, the REAL webhook (real
 * Stripe signing) and the REAL `getUserMembershipTier` against one database
 * double, so the entitlement asserted is the one a member would get.
 *
 * The database is a double: see `tests/unit/support/postgrest-double.ts` for
 * what it does and does not model. Nothing here is evidence about Supabase.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { NextRequest } from "next/server"
import Stripe from "stripe"
import { PostgrestDouble } from "./support/postgrest-double"

const WEBHOOK_SECRET = "whsec_cancel_renewal_fixture"
const realStripe = new Stripe("sk_test_cancel_renewal_offline_fixture")

const subscriptionsUpdate = vi.fn(async (..._a: unknown[]): Promise<unknown> => ({}))
const subscriptionsRetrieve = vi.fn(async (..._a: unknown[]) => ({ current_period_end: 0 }))

const hoisted = vi.hoisted(() => ({
  db: null as PostgrestDouble | null,
  user: null as { id: string; email: string } | null,
}))

vi.mock("@/lib/stripe-server", () => ({
  stripe: {
    webhooks: realStripe.webhooks,
    subscriptions: {
      update: (...a: unknown[]) => subscriptionsUpdate(...a),
      retrieve: (...a: unknown[]) => subscriptionsRetrieve(...a),
    },
  },
}))
vi.mock("@/lib/supabase", () => ({ getSupabase: () => hoisted.db?.client() ?? null }))
vi.mock("@/lib/supabase-server", () => ({ getUser: async () => hoisted.user }))
vi.mock("@/lib/email/send", () => ({ sendEmail: vi.fn(async () => ({ ok: true })) }))
vi.mock("@/lib/statsig-server", () => ({ logServerEvent: vi.fn(async () => {}) }))
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn(async () => {}) }))

const DAY = 24 * 60 * 60 * 1000
const GRACE = 3 * DAY
const MEMBER_PRICE = "price_member_cancel_fixture"
const CUSTOMER = "cus_cancel_fixture"
const SUB_ID = "sub_cancel_fixture"
const SUB_CREATED = Math.floor((Date.now() - 10 * DAY) / 1000)
const PERIOD_END = Math.floor((Date.now() + 20 * DAY) / 1000)
const PAID_THROUGH = new Date(PERIOD_END * 1000).toISOString()

function memberDb() {
  return new PostgrestDouble({
    stripe_processed_events: { primaryKey: "event_id", rows: [] },
    profiles: {
      primaryKey: "id",
      rows: [
        {
          id: "user_1",
          email: "member@example.com",
          name: "A Member",
          stripe_customer_id: CUSTOMER,
          membership_tier: "member",
          membership_status: "active",
          stripe_subscription_id: SUB_ID,
          membership_started_at: new Date(SUB_CREATED * 1000).toISOString(),
          is_founding_member: false,
          membership_expires_at: PAID_THROUGH,
          trial_expires_at: null,
        },
      ],
    },
    subscription_events: { primaryKey: "id", rows: [] },
  })
}

function db(): PostgrestDouble {
  return hoisted.db!
}

function entitlement() {
  const p = db().rowsOf("profiles")[0]
  return {
    membership_tier: p.membership_tier,
    membership_status: p.membership_status,
    stripe_subscription_id: p.stripe_subscription_id,
    membership_expires_at: p.membership_expires_at,
  }
}

async function tier() {
  const { getUserMembershipTier } = await import("@/lib/membership")
  return getUserMembershipTier("user_1")
}

/** Stripe's answer to `subscriptions.update(id, { cancel_at_period_end: true })`. */
function scheduledCancellation() {
  // Stripe v20 (`2026-02-25.clover`) shape: the period end is on the items,
  // and the subscription itself carries no `current_period_end`.
  return {
    id: SUB_ID,
    status: "active",
    cancel_at_period_end: true,
    cancel_at: PERIOD_END,
    items: { object: "list", data: [{ id: "si_cancel_fixture", current_period_end: PERIOD_END }] },
  }
}

async function cancelRenewal() {
  const { POST } = await import("@/app/api/stripe/cancel-subscription/route")
  return POST()
}

function subscriptionEvent(type: string, eventId: string, subOverrides: Record<string, unknown> = {}) {
  return {
    id: eventId,
    object: "event",
    created: Math.floor(Date.now() / 1000),
    type,
    livemode: false,
    data: {
      object: {
        id: SUB_ID,
        object: "subscription",
        customer: CUSTOMER,
        status: "active",
        cancel_at_period_end: true,
        created: SUB_CREATED,
        current_period_end: PERIOD_END,
        items: { data: [{ price: { id: MEMBER_PRICE, unit_amount: 2499, currency: "eur", recurring: { interval: "month" } } }] },
        ...subOverrides,
      },
    },
  }
}

async function deliver(event: unknown) {
  const payload = JSON.stringify(event)
  const header = realStripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET })
  const { POST } = await import("@/app/api/stripe/webhook/route")
  return POST(
    new NextRequest("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": header },
      body: payload,
    }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET
  process.env.STRIPE_MEMBER_PRICE_ID = MEMBER_PRICE
  hoisted.db = memberDb()
  hoisted.user = { id: "user_1", email: "member@example.com" }
  subscriptionsUpdate.mockImplementation(async () => scheduledCancellation())
})

afterEach(() => {
  vi.useRealTimers()
})

describe("scheduling cancel_at_period_end", () => {
  it("does not remove paid access", async () => {
    expect(await tier()).toBe("member")
    const before = entitlement()

    const res = await cancelRenewal()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, accessUntil: PAID_THROUGH })
    expect(subscriptionsUpdate).toHaveBeenCalledTimes(1)
    expect(subscriptionsUpdate).toHaveBeenCalledWith(SUB_ID, { cancel_at_period_end: true })
    expect(entitlement()).toEqual(before)
    expect(db().writesTo("profiles")).toEqual([])
    expect(await tier()).toBe("member")
  })

  it("keeps membership_expires_at as the paid-through boundary", async () => {
    await cancelRenewal()
    expect(entitlement().membership_expires_at).toBe(PAID_THROUGH)

    vi.useFakeTimers({ toFake: ["Date"] })
    vi.setSystemTime(PERIOD_END * 1000 - 1000)
    expect(await tier()).toBe("member")
    // Past the paid-through date (and the renewal grace), access ends even if
    // the final Stripe event never arrives.
    vi.setSystemTime(PERIOD_END * 1000 + GRACE + 1000)
    expect(await tier()).toBe("free")
  })

  it("keeps access when Stripe's cancel_at_period_end update is processed before or after the click", async () => {
    // Webhook first, then the route's response: the order the old write lost.
    expect((await deliver(subscriptionEvent("customer.subscription.updated", "evt_pending_first"))).status).toBe(200)
    await cancelRenewal()
    expect(entitlement()).toEqual({
      membership_tier: "member",
      membership_status: "active",
      stripe_subscription_id: SUB_ID,
      membership_expires_at: PAID_THROUGH,
    })
    expect(await tier()).toBe("member")

    // Route first, then the webhook.
    hoisted.db = memberDb()
    await cancelRenewal()
    expect((await deliver(subscriptionEvent("customer.subscription.updated", "evt_pending_second"))).status).toBe(200)
    expect(entitlement().membership_status).toBe("active")
    expect(entitlement().membership_expires_at).toBe(PAID_THROUGH)
    expect(await tier()).toBe("member")
  })
})

describe("the subscription actually ending", () => {
  it("customer.subscription.deleted still moves the member to cancelled/free", async () => {
    await cancelRenewal()
    await deliver(subscriptionEvent("customer.subscription.updated", "evt_pending"))
    expect(await tier()).toBe("member")

    const res = await deliver(
      subscriptionEvent("customer.subscription.deleted", "evt_ended", { status: "canceled", cancel_at_period_end: false }),
    )

    expect(res.status).toBe(200)
    expect(entitlement()).toEqual({
      membership_tier: "free",
      membership_status: "cancelled",
      stripe_subscription_id: null,
      membership_expires_at: PAID_THROUGH,
    })
    expect(db().rowsOf("subscription_events")).toEqual([
      expect.objectContaining({ event_type: "updated", stripe_event_id: "evt_pending" }),
      expect.objectContaining({ event_type: "cancelled", from_tier: "member", to_tier: "free", stripe_event_id: "evt_ended" }),
    ])
    expect(await tier()).toBe("free")
  })
})

describe("retries", () => {
  it("repeated cancel clicks and webhook redeliveries do not extend or corrupt entitlement", async () => {
    await cancelRenewal()
    const pending = subscriptionEvent("customer.subscription.updated", "evt_pending")
    await deliver(pending)
    const settled = entitlement()

    expect((await cancelRenewal()).status).toBe(200)
    const replay = await deliver(pending)
    expect(await replay.json()).toEqual({ received: true, deduped: true })
    // A distinct event carrying the same Stripe state, as Stripe sends when
    // anything else about the subscription changes.
    await deliver(subscriptionEvent("customer.subscription.updated", "evt_pending_again"))

    expect(entitlement()).toEqual(settled)
    expect(entitlement().membership_expires_at).toBe(PAID_THROUGH)
    expect(db().writesTo("profiles", "update").every(
      w => (w.payload as Record<string, unknown>).membership_status === "active",
    )).toBe(true)
    expect(await tier()).toBe("member")

    const ended = subscriptionEvent("customer.subscription.deleted", "evt_ended", { status: "canceled" })
    await deliver(ended)
    const terminal = entitlement()
    expect(await (await deliver(ended)).json()).toEqual({ received: true, deduped: true })
    expect(entitlement()).toEqual(terminal)
    expect(await tier()).toBe("free")
  })
})

describe("unchanged route behaviour", () => {
  it("401s without a signed-in user and never calls Stripe", async () => {
    hoisted.user = null
    expect((await cancelRenewal()).status).toBe(401)
    expect(subscriptionsUpdate).not.toHaveBeenCalled()
  })

  it("400s when the profile has no subscription and never calls Stripe", async () => {
    db().rowsOf("profiles")[0].stripe_subscription_id = null
    const res = await cancelRenewal()
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "No active subscription found" })
    expect(subscriptionsUpdate).not.toHaveBeenCalled()
  })

  it("500s when Stripe refuses, leaving the profile untouched", async () => {
    subscriptionsUpdate.mockImplementation(async () => { throw new Error("stripe down") })
    const before = entitlement()
    const res = await cancelRenewal()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: "Cancellation failed" })
    expect(entitlement()).toEqual(before)
    expect(await tier()).toBe("member")
  })

  it("returns a null accessUntil when Stripe gives no period end", async () => {
    subscriptionsUpdate.mockImplementation(async () => ({ id: SUB_ID, status: "active", cancel_at_period_end: true }))
    expect(await (await cancelRenewal()).json()).toEqual({ ok: true, accessUntil: null })
  })
})
