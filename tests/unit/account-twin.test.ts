import { describe, it, expect } from "vitest"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import { twinVisualState } from "@/lib/account/twin-visual"

function sampleInput(over: Partial<AccountTwinInput> = {}): AccountTwinInput {
  return {
    score: 74,
    previousScore: 68,
    profileType: "Emerging Balance",
    biotics: { prebiotic: 71, probiotic: 23, postbiotic: 48 },
    streak: 3,
    meals: [
      { name: "Kefir & berries", score: 78, prebiotic: 55, probiotic: 65, postbiotic: 44, createdAt: "2026-05-10T09:00:00Z" },
      { name: "Lentil salad", score: 74, prebiotic: 72, probiotic: 8, postbiotic: 42, createdAt: "2026-05-11T13:00:00Z" },
    ],
    ...over,
  }
}

describe("buildAccountTwin", () => {
  it("assembles a live twin from account data with the latest score + meal signals", async () => {
    const { twin, feed } = await buildAccountTwin(sampleInput())
    expect(twin.baseline.foundationKey).toBe("you")
    // Score moved 68 → 74 via the seeded assessment_update.
    expect(twin.currentScore.value).toBe(74)
    expect(twin.progress.scoreDelta).toBe(6)
    expect(twin.progress.momentum).toBe("improving")
    // Two meals + one assessment_update = 3 observations.
    expect(twin.observations.length).toBe(3)
    expect(twin.nextBestAction).not.toBeNull()
    // Feed leads with momentum and includes per-meal learning entries.
    expect(feed[0].icon).toBe("momentum")
    expect(feed.some((e) => e.icon === "streak")).toBe(true)
    expect(feed.some((e) => e.title === "Kefir & berries")).toBe(true)
  })

  it("still builds a twin on day one (no meals, no previous score)", async () => {
    const { twin, feed } = await buildAccountTwin(
      sampleInput({ previousScore: null, meals: [], streak: 0, biotics: null }),
    )
    expect(twin.currentScore.value).toBe(74)
    expect(twin.progress.scoreDelta).toBe(0)
    expect(feed[0].icon).toBe("momentum")
  })
})

describe("twinVisualState", () => {
  it("maps momentum + observation count to visual params", async () => {
    const { twin } = await buildAccountTwin(sampleInput())
    const v = twinVisualState(twin)
    expect(v.ringScore).toBe(74)
    expect(v.momentum).toBe("improving")
    expect(v.pulseSec).toBeLessThan(5) // improving pulses faster
    expect(v.confidence).toBeGreaterThan(0)
    expect(v.confidence).toBeLessThanOrEqual(1)
    expect(v.auraGradient).toContain("radial-gradient")
  })

  it("lowers confidence when few signals are known", async () => {
    const { twin } = await buildAccountTwin(sampleInput({ previousScore: null, meals: [] }))
    const v = twinVisualState(twin)
    expect(v.confidence).toBeLessThan(0.3)
  })
})
