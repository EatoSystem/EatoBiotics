/**
 * What `/account` says about the next charge — PR #293's account UI half.
 *
 * Cancelling renewal leaves the profile `active` until the paid period ends
 * (`tests/unit/cancel-renewal-entitlement.test.ts`), so the profile cannot tell
 * the dashboard that renewal is off. `/account` reads it from the Stripe
 * subscription on every load and maps it with `lib/stripe-renewal.ts`.
 *
 * Three things are pinned here:
 *   1. the mapping, against the Stripe v20 (`2026-02-25.clover`) shape — the
 *      period end is on `items.data[]`, and a top-level `current_period_end`
 *      is not trusted;
 *   2. the REAL `app/account/page.tsx`, rendered twice per case as a stand-in
 *      for a reload, hands `LiveDashboard` the derived state — and never a
 *      next billing date when Stripe could not be read;
 *   3. the renewal copy itself.
 *
 * Test env is `node` with no jsdom, hence createElement + renderToStaticMarkup.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

const state = vi.hoisted(() => ({
  retrieve: null as unknown as import("vitest").Mock<(...a: unknown[]) => Promise<unknown>>,
  dashboardProps: [] as Record<string, unknown>[],
  profile: null as Record<string, unknown> | null,
}))
state.retrieve = vi.fn(async (..._a: unknown[]): Promise<unknown> => ({}))
const retrieve = state.retrieve
const dashboardProps = state.dashboardProps

vi.mock("next/navigation", () => ({
  redirect: (to: string) => { throw new Error(`redirect ${to}`) },
}))
vi.mock("@/lib/supabase-server", () => ({
  getUser: async () => ({ id: "user_1", email: "member@example.com" }),
}))
vi.mock("@/lib/stripe-server", () => ({
  stripe: { subscriptions: { retrieve: (...a: unknown[]) => state.retrieve(...a) } },
}))
vi.mock("@/components/account/live-dashboard", () => ({
  LiveDashboard: (props: Record<string, unknown>) => {
    state.dashboardProps.push(props)
    return null
  },
}))
/** Every query resolves empty, except the profile read. */
vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: (table: string) => {
      const builder: unknown = new Proxy({}, {
        get(_target, prop) {
          if (prop === "then") {
            const result = { data: table === "profiles" ? state.profile : [], error: null }
            return (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
              Promise.resolve(result).then(resolve, reject)
          }
          if (prop === "single" || prop === "maybeSingle") {
            return async () => ({ data: table === "profiles" ? state.profile : null, error: null })
          }
          return () => builder
        },
      })
      return builder
    },
  }),
}))

import AccountPage from "@/app/account/page"
import { renewalState } from "@/lib/stripe-renewal"
import { RenewalCancelledNotice, renewalLine } from "@/components/account/renewal-status"

const SUB_ID = "sub_account_fixture"
const PERIOD_END = Date.parse("2026-11-01T00:00:00.000Z") / 1000
const PAID_THROUGH = "2026-11-01T00:00:00.000Z"
const LATER = Date.parse("2026-12-15T00:00:00.000Z") / 1000

/** A subscription as the pinned API version returns it. */
function subscription(over: Record<string, unknown> = {}) {
  return {
    id: SUB_ID,
    object: "subscription",
    status: "active",
    cancel_at_period_end: false,
    cancel_at: null,
    items: { object: "list", data: [{ id: "si_1", current_period_end: PERIOD_END }] },
    ...over,
  }
}

describe("renewalState — Stripe v20 subscription → what happens next", () => {
  it("an active subscription renews at the item period end", () => {
    expect(renewalState(subscription())).toEqual({ kind: "renews", nextBillingDate: PAID_THROUGH })
  })

  it("takes the earliest item period end when there are several items", () => {
    const sub = subscription({
      items: { data: [{ current_period_end: LATER }, { current_period_end: PERIOD_END }] },
    })
    expect(renewalState(sub)).toEqual({ kind: "renews", nextBillingDate: PAID_THROUGH })
  })

  it("does not trust a top-level current_period_end", () => {
    const sub = subscription({ items: { data: [] }, current_period_end: LATER })
    expect(renewalState(sub)).toEqual({ kind: "renews", nextBillingDate: null })
  })

  it("cancel_at_period_end ends at the item period end — no next charge", () => {
    const sub = subscription({ cancel_at_period_end: true, current_period_end: LATER })
    expect(renewalState(sub)).toEqual({ kind: "ends", accessUntil: PAID_THROUGH })
  })

  it("cancel_at_period_end with Stripe's cancel_at uses cancel_at", () => {
    const sub = subscription({ cancel_at_period_end: true, cancel_at: PERIOD_END })
    expect(renewalState(sub)).toEqual({ kind: "ends", accessUntil: PAID_THROUGH })
  })

  it("cancel_at_period_end with no period anywhere still ends, date unknown", () => {
    const sub = subscription({ cancel_at_period_end: true, items: undefined })
    expect(renewalState(sub)).toEqual({ kind: "ends", accessUntil: null })
  })

  it("a dated cancellation inside the current period ends at that date", () => {
    const sub = subscription({ cancel_at: PERIOD_END - 86_400 })
    expect(renewalState(sub)).toEqual({
      kind: "ends",
      accessUntil: new Date((PERIOD_END - 86_400) * 1000).toISOString(),
    })
  })

  it("a dated cancellation after the current period still renews once", () => {
    expect(renewalState(subscription({ cancel_at: LATER }))).toEqual({
      kind: "renews",
      nextBillingDate: PAID_THROUGH,
    })
  })

  it("a dated cancellation with no period end is unknown, not a renewal", () => {
    expect(renewalState(subscription({ cancel_at: LATER, items: { data: [] } }))).toEqual({ kind: "unknown" })
  })

  it("an already-cancelled subscription never renews", () => {
    expect(renewalState(subscription({ status: "canceled" })).kind).toBe("ends")
  })

  it.each([
    ["nothing", undefined],
    ["null", null],
    ["a string", "sub_x"],
    ["no cancel_at_period_end", { id: SUB_ID, items: { data: [{ current_period_end: PERIOD_END }] } }],
    ["a non-boolean cancel_at_period_end", subscription({ cancel_at_period_end: "false" })],
  ])("is unknown for %s", (_label, input) => {
    expect(renewalState(input)).toEqual({ kind: "unknown" })
  })

  it("ignores malformed item period ends", () => {
    const sub = subscription({ items: { data: [null, { current_period_end: "soon" }, { current_period_end: -1 }] } })
    expect(renewalState(sub)).toEqual({ kind: "renews", nextBillingDate: null })
  })
})

describe("/account hands LiveDashboard Stripe's renewal state on every load", () => {
  beforeEach(() => {
    retrieve.mockReset()
    dashboardProps.length = 0
    state.profile = {
      id: "user_1",
      email: "member@example.com",
      name: "A Member",
      membership_tier: "member",
      membership_status: "active",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: SUB_ID,
      membership_started_at: "2026-06-01T00:00:00.000Z",
    }
  })

  /** Renders the real page twice — the second render is the reload. */
  async function loadTwice() {
    for (let i = 0; i < 2; i++) {
      renderToStaticMarkup(await AccountPage({ searchParams: Promise.resolve({}) }))
    }
    expect(dashboardProps).toHaveLength(2)
    expect(dashboardProps[1]).toEqual(dashboardProps[0])
    return dashboardProps[1]
  }

  it("a cancelled renewal shows as cancelled after reload, with no next billing date", async () => {
    retrieve.mockResolvedValue(subscription({ cancel_at_period_end: true, cancel_at: PERIOD_END }))
    const props = await loadTwice()
    expect(retrieve).toHaveBeenCalledTimes(2)
    expect(retrieve).toHaveBeenCalledWith(SUB_ID)
    expect(props.scheduledCancellation).toEqual({ accessUntil: PAID_THROUGH })
    expect(props.nextBillingDate).toBeNull()
    // The entitlement inputs are the profile's, untouched.
    expect(props.membershipStatus).toBe("active")
    expect(props.membershipTier).toBe("member")
  })

  it("an active subscription still shows its next billing date", async () => {
    retrieve.mockResolvedValue(subscription())
    const props = await loadTwice()
    expect(props.nextBillingDate).toBe(PAID_THROUGH)
    expect(props.scheduledCancellation).toBeNull()
  })

  it("when Stripe cannot be read, claims neither a next charge nor a cancellation", async () => {
    retrieve.mockRejectedValue(new Error("stripe down"))
    const err = vi.spyOn(console, "error").mockImplementation(() => {})
    const props = await loadTwice()
    err.mockRestore()
    expect(props.nextBillingDate).toBeNull()
    expect(props.scheduledCancellation).toBeNull()
  })

  it("when Stripe's answer is ambiguous, claims neither", async () => {
    retrieve.mockResolvedValue({ id: SUB_ID, current_period_end: PERIOD_END })
    const props = await loadTwice()
    expect(props.nextBillingDate).toBeNull()
    expect(props.scheduledCancellation).toBeNull()
  })

  it("does not call Stripe for a profile with no subscription", async () => {
    state.profile = { ...state.profile, membership_tier: "free", membership_status: "inactive", stripe_subscription_id: null }
    const props = await loadTwice()
    expect(retrieve).not.toHaveBeenCalled()
    expect(props.nextBillingDate).toBeNull()
    expect(props.scheduledCancellation).toBeNull()
  })
})

describe("the renewal copy", () => {
  it("Renewal cancelled names the paid-through date and offers nothing else", () => {
    const html = renderToStaticMarkup(createElement(RenewalCancelledNotice, { accessUntil: PAID_THROUGH }))
    expect(html).toContain("Renewal cancelled")
    expect(html).toContain("Your membership remains active until <strong>1 November 2026</strong>.")
    expect(html).not.toMatch(/Next billing|Cancel plan|charge/i)
  })

  it("without a date it still promises no charge and invents no date", () => {
    const html = renderToStaticMarkup(createElement(RenewalCancelledNotice, { accessUntil: null }))
    expect(html).toContain("Renewal cancelled")
    expect(html).toContain("Your membership remains active until the end of your current billing period.")
    expect(html.replace(/<[^>]+>/g, "")).not.toMatch(/\d/)
  })

  it("an active plan names its next billing date only when there is one", () => {
    expect(renewalLine(PAID_THROUGH)).toBe("Next billing 1 Nov 2026")
    expect(renewalLine(null)).toBe("Active subscription")
  })
})
