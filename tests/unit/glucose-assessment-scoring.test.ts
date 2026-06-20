import { describe, it, expect } from "vitest"
import {
  PILLAR_WEIGHTS,
  computeGlucoseSubScores,
  computeGlucoseOverall,
  getGlp1Status,
  type GlucoseSubScores,
} from "@/lib/glucose-assessment-scoring"
import {
  GLUCOSE_PILLAR_IDS,
  GLP1_QUESTION_ID,
  type GlucosePillarKey,
} from "@/lib/glucose-assessment-data"

/** Build an answers map setting every question of `pillar` to `value`. */
function pillarAnswers(pillar: GlucosePillarKey, value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (const id of GLUCOSE_PILLAR_IDS[pillar]) a[id] = value
  return a
}

/** Build an answers map setting every scored question to `value`. */
function uniformAnswers(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (const ids of Object.values(GLUCOSE_PILLAR_IDS)) {
    for (const id of ids) a[id] = value
  }
  return a
}

describe("PILLAR_WEIGHTS", () => {
  it("uses the spec weighting (plate .30, rhythm .20, strength .25, recovery .25)", () => {
    expect(PILLAR_WEIGHTS.plate).toBe(0.3)
    expect(PILLAR_WEIGHTS.rhythm).toBe(0.2)
    expect(PILLAR_WEIGHTS.strength).toBe(0.25)
    expect(PILLAR_WEIGHTS.recovery).toBe(0.25)
  })

  it("sums to 1.0", () => {
    const sum = Object.values(PILLAR_WEIGHTS).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 10)
  })
})

describe("computeGlucoseSubScores", () => {
  it("scores 100 for a maxed pillar and 0 for a zeroed pillar", () => {
    for (const key of Object.keys(GLUCOSE_PILLAR_IDS) as GlucosePillarKey[]) {
      const maxed = computeGlucoseSubScores(pillarAnswers(key, 3))
      expect(maxed[key]).toBe(100)

      const zeroed = computeGlucoseSubScores(pillarAnswers(key, 0))
      expect(zeroed[key]).toBe(0)
    }
  })

  it("scores every pillar 100 when all scored questions are maxed", () => {
    const s = computeGlucoseSubScores(uniformAnswers(3))
    expect(s.plate).toBe(100)
    expect(s.rhythm).toBe(100)
    expect(s.strength).toBe(100)
    expect(s.recovery).toBe(100)
  })

  it("returns zeros for an empty answer set", () => {
    const s = computeGlucoseSubScores({})
    expect(s.plate).toBe(0)
    expect(s.rhythm).toBe(0)
    expect(s.strength).toBe(0)
    expect(s.recovery).toBe(0)
  })
})

describe("computeGlucoseOverall", () => {
  it("returns 100 when every pillar is maxed", () => {
    const full: GlucoseSubScores = { plate: 100, rhythm: 100, strength: 100, recovery: 100 }
    expect(computeGlucoseOverall(full)).toBe(100)
  })

  it("applies a per-pillar floor of 20", () => {
    // all zeros → floored to 20 each → 20*(.30+.20+.25+.25) = 20
    const zero: GlucoseSubScores = { plate: 0, rhythm: 0, strength: 0, recovery: 0 }
    expect(computeGlucoseOverall(zero)).toBe(20)
  })

  it("applies the new weights with the floor", () => {
    // plate 100, rest floored to 20:
    // 100*.30 + 20*.20 + 20*.25 + 20*.25 = 30 + 4 + 5 + 5 = 44
    const mix: GlucoseSubScores = { plate: 100, rhythm: 0, strength: 0, recovery: 0 }
    expect(computeGlucoseOverall(mix)).toBe(44)
  })

  it("weights rhythm at .20 above the floor", () => {
    // rhythm 100, rest floored to 20:
    // 20*.30 + 100*.20 + 20*.25 + 20*.25 = 6 + 20 + 5 + 5 = 36
    const mix: GlucoseSubScores = { plate: 0, rhythm: 100, strength: 0, recovery: 0 }
    expect(computeGlucoseOverall(mix)).toBe(36)
  })
})

describe("getGlp1Status", () => {
  it("maps the context answer to none / considering / active", () => {
    expect(getGlp1Status({ [GLP1_QUESTION_ID]: 0 })).toBe("none")
    expect(getGlp1Status({ [GLP1_QUESTION_ID]: 1 })).toBe("considering")
    expect(getGlp1Status({ [GLP1_QUESTION_ID]: 2 })).toBe("active")
    expect(getGlp1Status({ [GLP1_QUESTION_ID]: 3 })).toBe("active")
  })

  it("defaults to none when the context answer is absent", () => {
    expect(getGlp1Status({})).toBe("none")
  })
})
