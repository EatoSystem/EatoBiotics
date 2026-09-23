/* ── Deferred report-trial decision ───────────────────────────────────────
   `decideTrialActivation` is the shared guard used by BOTH the Stripe webhook
   (pay-while-logged-in) and the auth callback (pay-before-signup). These tests
   pin the rules: only free/trial accounts, requires a qualifying purchase,
   never shortens an existing entitlement — and, since Step 7, that the window
   is anchored to the PURCHASE rather than to the current time.

   ══ WHY THE SIGNATURE CHANGED ═══════════════════════════════════════════

   The third argument used to be `hasPaidReport: boolean` and the expiry was
   `now + 30 days`. Because `reconcileAccountAfterAuth` runs on EVERY sign-in,
   that slid the window forward on every visit — purchase day 0 → day 30,
   sign in day 2 → day 32, day 29 → day 59, day 400 → day 430 — so the 30 days
   of access sold with the €49 Report never expired for anyone who kept
   signing in. The old tests here asserted "idempotent on repeat" and passed,
   because they only ever called the function once per case at a fixed clock.

   Passing the purchase timestamp is what makes repeat calls genuinely
   idempotent: the same purchase always computes the same expiry.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { decideTrialActivation, latestPurchaseAt } from "@/lib/auth/reconcile-account"

const NOW = Date.UTC(2026, 0, 1) // fixed clock
const DAY = 24 * 60 * 60 * 1000
const PURCHASE = new Date(NOW).toISOString()

describe("decideTrialActivation", () => {
  it("grants a 30-day trial to a free account with a qualifying purchase", () => {
    const d = decideTrialActivation("free", null, PURCHASE, NOW)
    expect(d.activate).toBe(true)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("does nothing without a qualifying purchase", () => {
    expect(decideTrialActivation("free", null, null, NOW).activate).toBe(false)
    expect(decideTrialActivation("free", null, undefined, NOW).activate).toBe(false)
  })

  it("fails closed on an unreadable purchase timestamp rather than granting from now", () => {
    expect(decideTrialActivation("free", null, "not-a-date", NOW).activate).toBe(false)
  })

  it("never downgrades a paying subscriber", () => {
    for (const tier of ["member", "grow", "restore", "transform"]) {
      expect(decideTrialActivation(tier, null, PURCHASE, NOW).activate).toBe(false)
    }
  })

  it("extends a shorter existing trial up to the purchase window", () => {
    const soon = new Date(NOW + 5 * DAY).toISOString()
    const d = decideTrialActivation("trial", soon, PURCHASE, NOW)
    expect(d.activate).toBe(true)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("never shortens a longer existing trial", () => {
    const later = new Date(NOW + 60 * DAY).toISOString()
    expect(decideTrialActivation("trial", later, PURCHASE, NOW).activate).toBe(false)
  })

  it("treats a null/unknown tier as free", () => {
    expect(decideTrialActivation(null, null, PURCHASE, NOW).activate).toBe(true)
    expect(decideTrialActivation(undefined, null, PURCHASE, NOW).activate).toBe(true)
  })
})

/* ══ Step 7: one purchase, one fixed window ═══════════════════════════════
 *
 * The scenario table the reviewer specified, walked as a sequence rather than
 * as isolated calls — the sliding window only shows itself when the output of
 * one call becomes the input of the next, which is exactly what the old tests
 * never did.
 */
describe("the entitlement window is anchored to the purchase", () => {
  /** Replay the sign-in path: feed each decision's output back in. */
  function signInAt(dayOffset: number, expiry: string | null): string | null {
    const d = decideTrialActivation("trial", expiry, PURCHASE, NOW + dayOffset * DAY)
    return d.activate ? d.expiresAt! : expiry
  }

  it("purchase on day 0 grants exactly day 30", () => {
    const d = decideTrialActivation("free", null, PURCHASE, NOW)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("signing in on day 2 leaves the expiry at day 30", () => {
    const granted = decideTrialActivation("free", null, PURCHASE, NOW).expiresAt!
    expect(signInAt(2, granted)).toBe(granted)
    expect(new Date(signInAt(2, granted)!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("signing in on day 29 leaves the expiry at day 30", () => {
    const granted = decideTrialActivation("free", null, PURCHASE, NOW).expiresAt!
    expect(signInAt(29, granted)).toBe(granted)
  })

  it("signing in on day 40 does not revive an elapsed window", () => {
    const granted = decideTrialActivation("free", null, PURCHASE, NOW).expiresAt!
    const after = decideTrialActivation("trial", granted, PURCHASE, NOW + 40 * DAY)
    expect(after.activate).toBe(false)
    // And a lapsed account signing in with nothing stored gets nothing either.
    expect(decideTrialActivation("free", null, PURCHASE, NOW + 40 * DAY).activate).toBe(false)
  })

  it("a first reconciliation on day 10 recovers day 30, not day 40", () => {
    const d = decideTrialActivation("free", null, PURCHASE, NOW + 10 * DAY)
    expect(d.activate).toBe(true)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("repeated sign-ins across the whole window never move the expiry", () => {
    let expiry = decideTrialActivation("free", null, PURCHASE, NOW).expiresAt!
    const first = expiry
    for (const day of [1, 2, 5, 9, 14, 21, 28, 29]) expiry = signInAt(day, expiry)!
    expect(expiry).toBe(first)
  })

  it("a duplicate or replayed webhook for the same purchase changes nothing", () => {
    const granted = decideTrialActivation("free", null, PURCHASE, NOW).expiresAt!
    // A redelivery milliseconds later, and a manual resend a week later.
    expect(decideTrialActivation("trial", granted, PURCHASE, NOW + 2).activate).toBe(false)
    expect(decideTrialActivation("trial", granted, PURCHASE, NOW + 7 * DAY).activate).toBe(false)
  })

  it("a genuine second purchase opens a new window from the SECOND purchase", () => {
    const first = decideTrialActivation("free", null, PURCHASE, NOW).expiresAt!
    const secondPurchase = new Date(NOW + 60 * DAY).toISOString()
    const d = decideTrialActivation("trial", first, secondPurchase, NOW + 60 * DAY)
    expect(d.activate).toBe(true)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 90 * DAY)
  })

  /*
   * The counterfactual, run on every CI pass rather than only under the
   * sabotage harness: a `now + 30 days` implementation cannot satisfy the
   * table above. If this ever stops failing, the guard above has stopped
   * measuring anything.
   */
  it("NON-VACUITY: a now-based implementation fails the day-2 case", () => {
    const nowBased = (currentExpiry: string | null, now: number) => {
      const proposed = now + 30 * DAY
      if (currentExpiry && new Date(currentExpiry).getTime() >= proposed) return currentExpiry
      return new Date(proposed).toISOString()
    }
    const granted = nowBased(null, NOW)
    const afterSignIn = nowBased(granted, NOW + 2 * DAY)
    expect(afterSignIn).not.toBe(granted)
    expect(new Date(afterSignIn).getTime()).toBe(NOW + 32 * DAY)
  })
})

describe("latestPurchaseAt resolves the PURCHASE, not the row", () => {
  const resolver = (map: Record<string, string | null>) => async (id: string) => map[id] ?? null

  it("returns the most recent resolved purchase, so a later purchase wins", async () => {
    expect(
      await latestPurchaseAt(
        [{ stripe_session_id: "a" }, { stripe_session_id: "b" }, { stripe_session_id: "c" }],
        resolver({
          a: "2026-01-01T00:00:00.000Z",
          b: "2026-03-01T00:00:00.000Z",
          c: "2026-02-01T00:00:00.000Z",
        }),
      ),
    ).toBe("2026-03-01T00:00:00.000Z")
  })

  it("returns null when nothing can be resolved — it never guesses", async () => {
    expect(await latestPurchaseAt([], resolver({}))).toBeNull()
    expect(await latestPurchaseAt(null, resolver({}))).toBeNull()
    expect(await latestPurchaseAt([{ stripe_session_id: "a" }], resolver({ a: null }))).toBeNull()
    expect(await latestPurchaseAt([{ stripe_session_id: null }], resolver({}))).toBeNull()
  })

  it("ignores an unresolvable session without discarding a resolvable one", async () => {
    expect(
      await latestPurchaseAt(
        [{ stripe_session_id: "gone" }, { stripe_session_id: "a" }],
        resolver({ gone: null, a: "2026-01-01T00:00:00.000Z" }),
      ),
    ).toBe("2026-01-01T00:00:00.000Z")
  })

  it("treats a throwing resolver as no evidence, not as a reason to guess", async () => {
    const thrower = async () => {
      throw new Error("stripe unreachable")
    }
    expect(await latestPurchaseAt([{ stripe_session_id: "a" }], thrower)).toBeNull()
  })

  it("bounds how many sessions it will resolve in one sign-in", async () => {
    const seen: string[] = []
    const rows = Array.from({ length: 20 }, (_, i) => ({ stripe_session_id: `s${i}` }))
    await latestPurchaseAt(rows, async (id) => {
      seen.push(id)
      return null
    })
    expect(seen.length).toBeLessThanOrEqual(5)
  })

  it("does not resolve the same session twice", async () => {
    const seen: string[] = []
    await latestPurchaseAt(
      [{ stripe_session_id: "a" }, { stripe_session_id: "a" }],
      async (id) => {
        seen.push(id)
        return null
      },
    )
    expect(seen).toEqual(["a"])
  })
})
