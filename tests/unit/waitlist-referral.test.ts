import { describe, it, expect } from "vitest"
import { waitlistPosition, REFERRAL_JUMP, UNLOCK_THRESHOLD } from "@/lib/waitlist-referral"

describe("waitlist-referral", () => {
  it("uses sane constants", () => {
    expect(REFERRAL_JUMP).toBeGreaterThan(0)
    expect(UNLOCK_THRESHOLD).toBeGreaterThan(0)
  })

  it("returns the raw rank when there are no referrals", () => {
    expect(waitlistPosition(1200, 0)).toBe(1200)
    expect(waitlistPosition(1, 0)).toBe(1)
  })

  it("moves you up REFERRAL_JUMP places per referral", () => {
    expect(waitlistPosition(1200, 1)).toBe(1200 - REFERRAL_JUMP)
    expect(waitlistPosition(1200, 3)).toBe(1200 - 3 * REFERRAL_JUMP)
  })

  it("never drops below position 1", () => {
    expect(waitlistPosition(5, 100)).toBe(1)
    expect(waitlistPosition(0, 0)).toBe(1)
  })

  it("ignores negative referral counts", () => {
    expect(waitlistPosition(50, -4)).toBe(50)
  })
})
