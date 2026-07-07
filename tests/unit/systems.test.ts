import { describe, it, expect } from "vitest"
import {
  SYSTEMS, SYSTEM_KEYS, FOUNDATION_KEYS, HEALTH_KEYS, LIFE_KEYS,
  foundationSystems, healthSystems, lifeSystems, liveSystems, systemsByFamily,
} from "@/lib/systems"
import { FOUNDATIONS, HEALTH_SYSTEMS, LIFE_SYSTEMS } from "@/lib/assessment/registry"

describe("systems catalog", () => {
  it("SYSTEM_KEYS covers every catalog entry, grouped by family", () => {
    expect(new Set(SYSTEM_KEYS)).toEqual(new Set(Object.keys(SYSTEMS)))
    expect(foundationSystems().map((s) => s.key)).toEqual(FOUNDATION_KEYS)
    expect(healthSystems().map((s) => s.key)).toEqual(HEALTH_KEYS)
    expect(lifeSystems().map((s) => s.key)).toEqual(LIFE_KEYS)
  })

  it("every non-foundation system inherits from You or Family", () => {
    for (const s of [...healthSystems(), ...lifeSystems()]) {
      expect(s.requiresFoundation, s.key).toBe(true)
      expect(s.allowedFoundations, s.key).toEqual(["you", "family"])
    }
    for (const s of foundationSystems()) {
      expect(s.requiresFoundation, s.key).toBe(false)
    }
  })

  it("Life systems are always sensitive and bridged", () => {
    for (const s of lifeSystems()) {
      expect(s.safetyLevel, s.key).toBe("sensitive")
      expect(s.futureBridge, s.key).toBeDefined()
    }
  })

  it("scaffold Life systems (birth, baby) carry no assessment yet", () => {
    for (const key of ["birth", "baby"] as const) {
      expect(SYSTEMS[key].status).toBe("scaffold")
      expect(SYSTEMS[key].assessmentRoute).toBeUndefined()
    }
  })

  it("Health/Foundation systems are standard safety level", () => {
    for (const s of [...foundationSystems(), ...healthSystems()]) {
      expect(s.safetyLevel, s.key).toBe("standard")
    }
  })

  it("live systems have an assessmentRoute matching the assessment registry", () => {
    const routes: Record<string, string> = {}
    for (const f of Object.values(FOUNDATIONS)) routes[f.key] = f.route
    for (const a of Object.values(HEALTH_SYSTEMS)) routes[a.key] = a.route
    for (const a of Object.values(LIFE_SYSTEMS)) routes[a.key] = a.route
    for (const s of liveSystems()) {
      expect(s.assessmentRoute, s.key).toBeDefined()
      expect(s.assessmentRoute, `${s.key} route matches registry`).toBe(routes[s.key])
    }
  })

  it("scaffold Health systems (recovery, longevity) have no assessment yet", () => {
    for (const key of ["recovery", "longevity"] as const) {
      expect(SYSTEMS[key].status).toBe("scaffold")
      expect(SYSTEMS[key].assessmentRoute).toBeUndefined()
    }
  })

  it("systemsByFamily is exhaustive and disjoint", () => {
    const total = systemsByFamily("foundation").length + systemsByFamily("health").length + systemsByFamily("life").length
    expect(total).toBe(SYSTEM_KEYS.length)
  })
})
