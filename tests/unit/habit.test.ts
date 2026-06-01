import { describe, it, expect } from "vitest"
import { focusPillar, dailyNudge } from "@/lib/habit"
import { PILLARS } from "@/lib/pillars"

describe("focusPillar", () => {
  it("picks the lowest-scoring pillar", () => {
    expect(focusPillar({ prebiotics: 80, probiotics: 30, postbiotics: 60 })).toBe("probiotics")
    expect(focusPillar({ prebiotics: 20, probiotics: 90, postbiotics: 70 })).toBe("prebiotics")
    expect(focusPillar({ prebiotics: 90, probiotics: 80, postbiotics: 10 })).toBe("postbiotics")
  })

  it("breaks ties in canonical order (prebiotics first)", () => {
    expect(focusPillar({ prebiotics: 50, probiotics: 50, postbiotics: 50 })).toBe("prebiotics")
    expect(focusPillar({ prebiotics: 90, probiotics: 50, postbiotics: 50 })).toBe("probiotics")
  })
})

describe("dailyNudge", () => {
  it("returns the weakest pillar's nudge from the Food System Core", () => {
    const nudge = dailyNudge({ prebiotics: 80, probiotics: 30, postbiotics: 60 })
    expect(nudge.pillar.key).toBe("probiotics")
    expect(nudge.nudge).toBe(PILLARS.probiotics.nudge)
    expect(nudge.score).toBe(30)
  })
})
