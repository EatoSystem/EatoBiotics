/**
 * Resolving when a purchase actually happened — Step 7 review repair.
 *
 * The entitlement is anchored to this value, so what it will and will not
 * return is the contract. It must return a purchase time only for a checkout
 * that genuinely settled, and it must return null rather than guessing.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const retrieve = vi.hoisted(() => vi.fn())

vi.mock("@/lib/stripe-server", () => ({
  stripe: { checkout: { sessions: { retrieve: (...a: unknown[]) => retrieve(...a) } } },
}))

const CREATED = Math.floor(Date.UTC(2026, 0, 1) / 1000)

async function resolve(sessionId = "cs_test_1") {
  const { purchasedAtFromStripe } = await import("@/lib/auth/purchased-at")
  return purchasedAtFromStripe(sessionId)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe("purchasedAtFromStripe", () => {
  it("returns the session's creation time for a paid checkout", async () => {
    retrieve.mockResolvedValue({ payment_status: "paid", created: CREATED })
    expect(await resolve()).toBe("2026-01-01T00:00:00.000Z")
  })

  it("also answers for a 100%-promo checkout, which has no PaymentIntent at all", async () => {
    // The reason `session.created` is the chosen datum: a charge timestamp
    // does not exist for this settlement and so could not express the contract.
    retrieve.mockResolvedValue({ payment_status: "no_payment_required", created: CREATED })
    expect(await resolve()).toBe("2026-01-01T00:00:00.000Z")
  })

  it("refuses a checkout that never settled — an abandoned session has a `created` too", async () => {
    retrieve.mockResolvedValue({ payment_status: "unpaid", created: CREATED })
    expect(await resolve()).toBeNull()
  })

  it("returns null when the session carries no creation time", async () => {
    retrieve.mockResolvedValue({ payment_status: "paid" })
    expect(await resolve()).toBeNull()
  })

  it("fails closed when Stripe is unreachable, rather than guessing", async () => {
    retrieve.mockRejectedValue(new Error("network down"))
    expect(await resolve()).toBeNull()
  })

  it("fails closed for an unknown session id", async () => {
    retrieve.mockRejectedValue(Object.assign(new Error("No such session"), { code: "resource_missing" }))
    expect(await resolve("cs_does_not_exist")).toBeNull()
  })

  it("asks Stripe for exactly the session it was given", async () => {
    retrieve.mockResolvedValue({ payment_status: "paid", created: CREATED })
    await resolve("cs_test_specific")
    expect(retrieve).toHaveBeenCalledWith("cs_test_specific")
  })
})
