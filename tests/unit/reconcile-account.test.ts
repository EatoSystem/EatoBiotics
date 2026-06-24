/* ── Deferred report-trial decision ───────────────────────────────────────
   `decideTrialActivation` is the shared guard used by BOTH the Stripe webhook
   (pay-while-logged-in) and the auth callback (pay-before-signup). These tests
   pin the rules: only free/trial accounts, requires a paid report, never
   shortens an existing trial, and is idempotent.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { decideTrialActivation } from "@/lib/auth/reconcile-account"

const NOW = Date.UTC(2026, 0, 1) // fixed clock
const DAY = 24 * 60 * 60 * 1000

describe("decideTrialActivation", () => {
  it("grants a 30-day trial to a free account with a paid report", () => {
    const d = decideTrialActivation("free", null, true, NOW)
    expect(d.activate).toBe(true)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("does nothing without a paid report", () => {
    expect(decideTrialActivation("free", null, false, NOW).activate).toBe(false)
  })

  it("never downgrades a paying subscriber", () => {
    for (const tier of ["member", "grow", "restore", "transform"]) {
      expect(decideTrialActivation(tier, null, true, NOW).activate).toBe(false)
    }
  })

  it("extends a shorter existing trial", () => {
    const soon = new Date(NOW + 5 * DAY).toISOString()
    const d = decideTrialActivation("trial", soon, true, NOW)
    expect(d.activate).toBe(true)
    expect(new Date(d.expiresAt!).getTime()).toBe(NOW + 30 * DAY)
  })

  it("never shortens a longer existing trial (idempotent on repeat)", () => {
    const later = new Date(NOW + 60 * DAY).toISOString()
    expect(decideTrialActivation("trial", later, true, NOW).activate).toBe(false)
  })

  it("treats a null/unknown tier as free", () => {
    expect(decideTrialActivation(null, null, true, NOW).activate).toBe(true)
    expect(decideTrialActivation(undefined, null, true, NOW).activate).toBe(true)
  })
})
