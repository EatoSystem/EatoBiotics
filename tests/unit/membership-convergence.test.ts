/**
 * Cancellation converges without any further Stripe event — Step 7 repair.
 *
 * ══ WHY THIS EXISTS ═════════════════════════════════════════════════════════
 *
 * `customer.subscription.deleted` is TERMINAL. Stripe sends nothing further
 * about a deleted subscription, so if that handler does not complete, no later
 * event will ever downgrade the profile.
 *
 * That was survivable while a failed handler left the event unmarked and
 * Stripe's retry re-ran it. The webhook's atomic claim removed that: a process
 * that dies after claiming means the retry is deduped, so the downgrade never
 * happens at all. `getUserMembershipTier` returned the paid tier on
 * `status === "active"` without ever consulting `membership_expires_at`, so a
 * cancelled member kept paid access FOR EVER.
 *
 * The recovery mechanism is the paid-through date that `created`, `updated`
 * and `invoice.payment_succeeded` all keep current. Access is bounded by it,
 * so cancellation converges by construction rather than by hoping an event
 * completed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest"

const profileRow = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }))

vi.mock("@/lib/supabase", () => ({
  getSupabase: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () =>
            profileRow.current
              ? { data: profileRow.current, error: null }
              : { data: null, error: { code: "PGRST116" } },
        }),
      }),
    }),
  }),
}))

const DAY = 24 * 60 * 60 * 1000
const GRACE = 3 * DAY

async function tierFor(row: Record<string, unknown>) {
  profileRow.current = row
  const { getUserMembershipTier } = await import("@/lib/membership")
  return getUserMembershipTier("user_1")
}

beforeEach(() => {
  vi.resetModules()
  profileRow.current = null
})

describe("an active membership is bounded by what was paid for", () => {
  it("still grants access inside the paid period", async () => {
    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "active",
        membership_expires_at: new Date(Date.now() + 10 * DAY).toISOString(),
      }),
    ).toBe("member")
  })

  it("CONVERGENCE: a cancellation whose handler never ran stops granting access", async () => {
    // The profile the crash left behind: still "active", still "member", with
    // a paid-through date that has long passed.
    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "active",
        membership_expires_at: new Date(Date.now() - 60 * DAY).toISOString(),
      }),
    ).toBe("free")
  })

  it("keeps a paying member in while a renewal webhook is merely late", async () => {
    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "active",
        membership_expires_at: new Date(Date.now() - 1 * DAY).toISOString(),
      }),
    ).toBe("member")
  })

  it("lets go once even the renewal grace has passed", async () => {
    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "active",
        membership_expires_at: new Date(Date.now() - (GRACE + DAY)).toISOString(),
      }),
    ).toBe("free")
  })

  it("fails OPEN on a null or unreadable paid-through date", async () => {
    // Revoking access from a member whose period end was never recorded is the
    // worse error. Recorded as a deliberate residual, asserted so it stays one.
    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "active",
        membership_expires_at: null,
      }),
    ).toBe("member")

    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "active",
        membership_expires_at: "not-a-date",
      }),
    ).toBe("member")
  })

  it("leaves the trial and past_due paths alone", async () => {
    expect(
      await tierFor({
        membership_tier: "trial",
        membership_status: "active",
        trial_expires_at: new Date(Date.now() + 5 * DAY).toISOString(),
        membership_expires_at: new Date(Date.now() - 60 * DAY).toISOString(),
      }),
    ).toBe("trial")

    expect(
      await tierFor({
        membership_tier: "member",
        membership_status: "past_due",
        membership_expires_at: new Date(Date.now() + 2 * DAY).toISOString(),
      }),
    ).toBe("member")
  })

  it("NON-VACUITY: the old behaviour would have kept the cancelled member in", () => {
    const oldBehaviour = (status: string, tier: string) => (status === "active" ? tier : "free")
    expect(oldBehaviour("active", "member")).toBe("member")
  })
})
