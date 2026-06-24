/* ── Foundation → add-on resume routing ───────────────────────────────────
   When someone clicks an add-on before completing a foundation, the add-on is
   parked as `pendingAddon`. After they finish You/Family, they must be guided
   straight into that add-on. `resumeAddonRoute` is the pure decision behind that.
──────────────────────────────────────────────────────────────────────── */
import { describe, it, expect } from "vitest"
import { resumeAddonRoute, type Journey } from "@/lib/assessment/journey"

const journey = (over: Partial<Journey> = {}): Journey => ({
  foundationType: null,
  pendingAddon: null,
  selectedAddon: null,
  ...over,
})

describe("resumeAddonRoute", () => {
  it("routes to the pending add-on gate once the foundation is complete", () => {
    expect(resumeAddonRoute(journey({ pendingAddon: "glucose" }), true)).toBe("/assessment/add/glucose")
  })

  it("returns null while the foundation is not yet complete", () => {
    expect(resumeAddonRoute(journey({ pendingAddon: "glucose" }), false)).toBeNull()
  })

  it("returns null when there is no pending add-on", () => {
    expect(resumeAddonRoute(journey(), true)).toBeNull()
  })
})
