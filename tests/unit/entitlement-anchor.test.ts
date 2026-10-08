/**
 * The buyer can never receive less than the 30 days they were sold.
 *
 * ══ THE PROBLEM THIS CLOSES ═════════════════════════════════════════════════
 *
 * Nothing in this system records when a payment settled, so the 30-day clock
 * has to start from something else. Two earlier attempts both started it too
 * early or in the wrong place:
 *
 *   • `deep_assessments.created_at` — when a ROW was written, which can be days
 *     after the purchase whenever the webhook did not run;
 *   • `session.created` — when the buyer STARTED checkout, so someone who
 *     finished late was sold 30 days and given 29.
 *
 * The anchor is now the LATEST instant the checkout could have settled, which
 * makes the guarantee one-sided in the customer's favour.
 *
 * ══ THE BOUND ═══════════════════════════════════════════════════════════════
 *
 * With c = created, x = expires_at, s = actual settlement, a session accepts
 * payment only while open, so `c ≤ s ≤ x`. Anchoring at x:
 *
 *     access after settlement = x + 30d − s ≥ 30d
 *     over-grant              = x − s      ≤ x − c ≤ 24h
 */
import { describe, it, expect, vi, beforeEach } from "vitest"
import { entitlementAnchorFromSession } from "@/lib/auth/entitlement-anchor"
import { decideTrialActivation } from "@/lib/auth/reconcile-account"

const retrieve = vi.hoisted(() => vi.fn())
vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => retrieve(...a) } } },
}))

const SEC = 1000
const MINUTE = 60 * SEC
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const THIRTY_DAYS = 30 * DAY

/** A session created at `c`, expiring 24h later — what this repo always makes. */
const CREATED = Date.UTC(2026, 0, 1)
const EXPIRES = CREATED + 24 * HOUR

function session(overrides: Record<string, unknown> = {}) {
  return {
    payment_status: "paid",
    created: Math.floor(CREATED / 1000),
    expires_at: Math.floor(EXPIRES / 1000),
    ...overrides,
  }
}

async function resolveFromStripe(sessionId = "cs_test_1") {
  const { entitlementAnchorFromStripe } = await import("@/lib/auth/entitlement-anchor")
  return entitlementAnchorFromStripe(sessionId)
}

/** Access actually delivered to someone who settled at `settledAt`. */
function accessAfterSettlement(anchor: string, settledAt: number): number {
  const expiry = decideTrialActivation("free", null, anchor, settledAt).expiresAt!
  return Date.parse(expiry) - settledAt
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

/* ══ The bound, state by state ═══════════════════════════════════════════ */

describe("the 30 days sold are the 30 days delivered", () => {
  it("anchors at the latest instant the checkout could have settled", () => {
    expect(entitlementAnchorFromSession(session())).toBe(new Date(EXPIRES).toISOString())
  })

  it("a card settling immediately gets MORE than 30 days, never less", () => {
    const anchor = entitlementAnchorFromSession(session())!
    const delivered = accessAfterSettlement(anchor, CREATED + 2 * SEC)

    expect(delivered).toBeGreaterThanOrEqual(THIRTY_DAYS)
    expect(delivered).toBeLessThanOrEqual(THIRTY_DAYS + 24 * HOUR)
    // ~31 days: the full session lifetime of over-grant.
    expect(delivered).toBeCloseTo(THIRTY_DAYS + 24 * HOUR, -4)
  })

  it("a checkout settled at the LAST permitted instant gets exactly 30 days", () => {
    const anchor = entitlementAnchorFromSession(session())!
    expect(accessAfterSettlement(anchor, EXPIRES)).toBe(THIRTY_DAYS)
  })

  it("a 100%-discount checkout is bounded identically", () => {
    // The reason the anchor is a session field: this settlement has no
    // PaymentIntent and no charge, so no settlement timestamp exists for it.
    const anchor = entitlementAnchorFromSession(
      session({ payment_status: "no_payment_required" }),
    )!
    expect(anchor).toBe(new Date(EXPIRES).toISOString())
    expect(accessAfterSettlement(anchor, CREATED + 5 * MINUTE)).toBeGreaterThanOrEqual(THIRTY_DAYS)
    expect(accessAfterSettlement(anchor, EXPIRES)).toBe(THIRTY_DAYS)
  })

  it("holds across every settlement moment the session permits", () => {
    const anchor = entitlementAnchorFromSession(session())!
    for (let offset = 0; offset <= 24 * HOUR; offset += HOUR) {
      const delivered = accessAfterSettlement(anchor, CREATED + offset)
      expect(delivered).toBeGreaterThanOrEqual(THIRTY_DAYS)
      expect(delivered).toBeLessThanOrEqual(THIRTY_DAYS + 24 * HOUR)
    }
  })

  it("a short-lived session over-grants less, and still never under-grants", () => {
    // Stripe permits expiries as close as 30 minutes after creation.
    const short = session({ expires_at: Math.floor((CREATED + 30 * MINUTE) / 1000) })
    const anchor = entitlementAnchorFromSession(short)!
    expect(accessAfterSettlement(anchor, CREATED)).toBe(THIRTY_DAYS + 30 * MINUTE)
    expect(accessAfterSettlement(anchor, CREATED + 30 * MINUTE)).toBe(THIRTY_DAYS)
  })

  it("NON-VACUITY: anchoring at `created` under-delivers, which is the defect", () => {
    const wrong = new Date(CREATED).toISOString()
    // Someone who finished checkout 23 hours in gets less than the 30 days sold.
    expect(accessAfterSettlement(wrong, CREATED + 23 * HOUR)).toBeLessThan(THIRTY_DAYS)
  })
})

/* ══ Fallback and refusal ════════════════════════════════════════════════ */

describe("the anchor degrades safely", () => {
  it("falls back to created + the documented 24h maximum", () => {
    const anchor = entitlementAnchorFromSession(session({ expires_at: null }))!
    expect(anchor).toBe(new Date(CREATED + 24 * HOUR).toISOString())
    // Still an upper bound on settlement, so still never under-grants.
    expect(accessAfterSettlement(anchor, CREATED + 12 * HOUR)).toBeGreaterThanOrEqual(THIRTY_DAYS)
  })

  it("returns null when neither timestamp is readable", () => {
    expect(entitlementAnchorFromSession({})).toBeNull()
    expect(entitlementAnchorFromSession({ created: null, expires_at: null })).toBeNull()
  })
})

/* ══ The resolver ════════════════════════════════════════════════════════ */

describe("entitlementAnchorFromStripe", () => {
  it("answers for a settled card checkout", async () => {
    retrieve.mockResolvedValue(session())
    expect(await resolveFromStripe()).toBe(new Date(EXPIRES).toISOString())
  })

  it("answers for a 100%-promo checkout", async () => {
    retrieve.mockResolvedValue(session({ payment_status: "no_payment_required" }))
    expect(await resolveFromStripe()).toBe(new Date(EXPIRES).toISOString())
  })

  it("refuses a checkout that never settled — an abandoned session has both fields too", async () => {
    retrieve.mockResolvedValue(session({ payment_status: "unpaid" }))
    expect(await resolveFromStripe()).toBeNull()
  })

  it("fails closed when Stripe is unreachable or the session is unknown", async () => {
    retrieve.mockRejectedValue(new Error("network down"))
    expect(await resolveFromStripe()).toBeNull()

    retrieve.mockRejectedValue(Object.assign(new Error("No such session"), { code: "resource_missing" }))
    expect(await resolveFromStripe("cs_nope")).toBeNull()
  })

  it("asks Stripe for exactly the session it was given", async () => {
    retrieve.mockResolvedValue(session())
    await resolveFromStripe("cs_test_specific")
    expect(retrieve).toHaveBeenCalledWith("cs_test_specific")
  })
})
