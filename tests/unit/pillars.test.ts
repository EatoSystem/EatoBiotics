import { describe, it, expect } from "vitest"
import {
  PILLARS,
  PILLAR_ORDER,
  PILLAR_LABELS,
  resolvePillar,
  pillarLabel,
} from "@/lib/pillars"

describe("PILLARS", () => {
  it("defines exactly the three biotics in canonical order", () => {
    expect(PILLAR_ORDER).toEqual(["prebiotics", "probiotics", "postbiotics"])
    expect(Object.keys(PILLARS)).toEqual(PILLAR_ORDER)
  })

  it("gives each pillar complete metadata", () => {
    for (const key of PILLAR_ORDER) {
      const p = PILLARS[key]
      expect(p.key).toBe(key)
      expect(p.label.length).toBeGreaterThan(0)
      expect(p.aliasLabel.length).toBeGreaterThan(0)
      expect(p.color).toMatch(/^var\(--/)
      expect(p.nudge.length).toBeGreaterThan(0)
      expect(p.foodExamples.length).toBeGreaterThan(0)
    }
  })

  it("maps Feed/Seed/Heal aliases to the right pillars", () => {
    expect(PILLARS.prebiotics.aliasKey).toBe("feed")
    expect(PILLARS.probiotics.aliasKey).toBe("seed")
    expect(PILLARS.postbiotics.aliasKey).toBe("heal")
  })
})

describe("resolvePillar", () => {
  it("resolves canonical keys", () => {
    expect(resolvePillar("probiotics")?.label).toBe("Probiotics")
  })

  it("resolves Feed/Seed/Heal aliases", () => {
    expect(resolvePillar("feed")?.key).toBe("prebiotics")
    expect(resolvePillar("seed")?.key).toBe("probiotics")
    expect(resolvePillar("heal")?.key).toBe("postbiotics")
  })

  it("returns null for legacy / unknown keys", () => {
    expect(resolvePillar("diversity")).toBeNull()
    expect(resolvePillar("nonsense")).toBeNull()
  })
})

describe("pillarLabel & PILLAR_LABELS", () => {
  it("labels canonical keys and aliases identically", () => {
    expect(pillarLabel("prebiotics")).toBe("Prebiotics")
    expect(pillarLabel("feed")).toBe("Prebiotics")
    expect(PILLAR_LABELS.feed).toBe(PILLAR_LABELS.prebiotics)
    expect(PILLAR_LABELS.heal).toBe(PILLAR_LABELS.postbiotics)
  })

  it("falls back to the key when unknown", () => {
    expect(pillarLabel("mystery")).toBe("mystery")
  })

  it("covers every key the migrated call sites relied on", () => {
    for (const key of ["prebiotics", "probiotics", "postbiotics", "feed", "seed", "heal"]) {
      expect(PILLAR_LABELS[key]).toBeTruthy()
    }
  })
})
