import { describe, it, expect } from "vitest"
import { buildAccountTwin, type AccountTwinInput } from "@/lib/agent-loop/account-twin"
import { twinVisualState, auraGradientForTone, restingAuraGradient } from "@/lib/account/twin-visual"
import { buildTwinLenses } from "@/lib/account/twin-data"

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
    /*
     * 0R-5 · `auraGradient` is no longer on `TwinVisualState`. It was
     * `auraGradientForBiotic(twin.biotics.strongest, …)` — a comparative
     * personal Biotic verdict encoded as a colour (`P0-SCIENCE-04`) — and the
     * assertion that it looked like a gradient was the only thing checking it.
     */
    expect("auraGradient" in v, "the Biotic-derived aura field is back").toBe(false)
  })

  it("lowers confidence when few signals are known", async () => {
    const { twin } = await buildAccountTwin(sampleInput({ previousScore: null, meals: [] }))
    const v = twinVisualState(twin)
    expect(v.confidence).toBeLessThan(0.3)
  })

  it("tints the aura per palette tone, and the tone is all it is given", () => {
    /*
     * 0R-5 · this read `auraGradientForBiotic("prebiotics")` /
     * `("postbiotics")`. The colours are unchanged — what changed is the
     * PARAMETER: a palette tone, which `twin.biotics.weakest` is not and cannot
     * be cast to, so the member's Biotic state can no longer reach the stage's
     * colour from any call site.
     */
    const lime = auraGradientForTone("lime")
    const amber = auraGradientForTone("amber")
    const green = auraGradientForTone("green")
    for (const g of [lime, amber, green]) expect(g).toContain("radial-gradient")
    expect(new Set([lime, amber, green]).size, "two tones collapsed to one colour").toBe(3)
  })

  it("changing which Biotic is weakest cannot change the stage aura", async () => {
    /*
     * ══ THE 0R-5 PROOF, WITH VARIED VALUES ════════════════════════════════
     *
     * `P0-SCIENCE-04` was `auraGradientForBiotic(twin.biotics.weakest, …)`, so
     * the colour of the glow around the member's figure WAS which of their
     * three Biotics ranked lowest. The repair is structural — `weakest` is a
     * `BioticKey` and the aura takes an `AuraTone` — but a structural argument
     * is only as good as the behaviour, so the behaviour is asserted.
     *
     * Three twins, each with a DIFFERENT weakest Biotic and identical
     * observation counts (so confidence matches and the comparison is about
     * the Biotics and nothing else). This is the fixture-design lesson the
     * register records: the captured fixtures all have Probiotic lowest, and a
     * state chosen to look ordinary can hide a defect by agreeing with it.
     */
    const cases = [
      ["probiotics lowest", { prebiotic: 71, probiotic: 23, postbiotic: 48 }],
      ["prebiotics lowest", { prebiotic: 18, probiotic: 77, postbiotic: 55 }],
      ["postbiotics lowest", { prebiotic: 64, probiotic: 69, postbiotic: 11 }],
    ] as const

    const auras = new Set<string>()
    const weakests = new Set<string>()
    for (const [, biotics] of cases) {
      const { twin } = await buildAccountTwin(sampleInput({ biotics }))
      weakests.add(twin.biotics.weakest)
      // The stage's default branch, exactly as `twin-stage.tsx` computes it.
      auras.add(restingAuraGradient(twinVisualState(twin).confidence))
    }

    // Non-vacuity: the three fixtures really do disagree about which is weakest.
    expect(
      weakests.size,
      "the three fixtures produced the same weakest Biotic — the comparison " +
        "would prove nothing",
    ).toBe(3)
    expect(
      auras.size,
      `the aura changed with the weakest Biotic (${[...auras].length} distinct ` +
        `gradients across ${[...weakests].join(", ")}). P0-SCIENCE-04 has regressed.`,
    ).toBe(1)
  })

  it("the resting aura is one fixed tone for every member", () => {
    /*
     * The slot that used to hold the member's weakest Biotic. Non-vacuous: it
     * must still produce a gradient, and it must be the SAME gradient at a
     * given intensity no matter what is happening in the account — which is
     * the property `P0-SCIENCE-04` violated.
     */
    expect(restingAuraGradient(0.42)).toContain("radial-gradient")
    expect(restingAuraGradient(0.42)).toBe(restingAuraGradient(0.42))
    expect(restingAuraGradient(0.42)).toBe(auraGradientForTone("lime", 0.42))
  })
})

describe("buildTwinLenses", () => {
  it("returns Foundation plus the four live specialised lenses with focus biotics + hrefs", () => {
    const lenses = buildTwinLenses()
    expect(lenses[0].key).toBe("foundation")
    const keys = lenses.map((l) => l.key)
    expect(keys).toEqual(expect.arrayContaining(["foundation", "stability", "glucose", "mind", "performance"]))
    const glucose = lenses.find((l) => l.key === "glucose")!
    expect(glucose.href).toBe("/glucose")
    expect(glucose.focusBiotic).toBeTruthy()
    expect(glucose.observes.length).toBeGreaterThan(0)
  })
})

describe("twinFigureSrc", () => {
  it("falls back to the couple figure when sex is unknown, and resolves per sex", async () => {
    const { twinFigureSrc, normaliseSex, TWIN_FIGURE_FALLBACK } = await import("@/lib/account/twin-figure")
    expect(twinFigureSrc(null)).toBe(TWIN_FIGURE_FALLBACK)
    expect(normaliseSex("banana")).toBeNull()
    expect(normaliseSex("male")).toBe("male")
    // Wire-now-art-later: male/female currently use the placeholder, but the
    // resolver must always return a non-empty image path for each.
    expect(twinFigureSrc("male")).toBeTruthy()
    expect(twinFigureSrc("female")).toBeTruthy()
  })

  it("resolves per-sex Digital Twin hero video, null when unknown", async () => {
    const { twinVideo } = await import("@/lib/account/twin-figure")
    expect(twinVideo(null)).toBeNull()
    const male = twinVideo("male")
    expect(male?.webm).toBe("/videos/dt-twin-male.webm")
    expect(male?.mp4).toBe("/videos/dt-twin-male.mp4")
    expect(male?.poster).toContain("dt-twin-male")
    expect(twinVideo("female")?.webm).toBe("/videos/dt-twin-female.webm")
  })
})
