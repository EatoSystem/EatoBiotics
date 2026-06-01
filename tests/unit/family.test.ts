import { describe, it, expect } from "vitest"
import { familyScore, familyScoreFromMembers } from "@/lib/family"

describe("familyScore", () => {
  it("averages the available scores and rounds", () => {
    const s = familyScore([80, 60, 70])
    expect(s.average).toBe(70)
    expect(s.contributors).toBe(3)
    expect(s.memberCount).toBe(3)
  })

  it("ignores null/undefined scores in the average but counts them as members", () => {
    const s = familyScore([90, null, undefined, 50])
    expect(s.average).toBe(70) // (90 + 50) / 2
    expect(s.contributors).toBe(2)
    expect(s.memberCount).toBe(4)
  })

  it("returns a null average when nobody has a score", () => {
    expect(familyScore([null, undefined])).toEqual({
      average: null,
      contributors: 0,
      memberCount: 2,
    })
  })

  it("handles an empty household", () => {
    expect(familyScore([])).toEqual({ average: null, contributors: 0, memberCount: 0 })
  })

  it("rounds to the nearest integer", () => {
    expect(familyScore([70, 71]).average).toBe(71) // 70.5 → 71
  })
})

describe("familyScoreFromMembers", () => {
  it("includes the owner's score alongside members", () => {
    const s = familyScoreFromMembers([{ score: 60 }, { score: 80 }], 70)
    expect(s.average).toBe(70) // (70 + 60 + 80) / 3
    expect(s.memberCount).toBe(3)
  })

  it("works when the owner has no score yet", () => {
    const s = familyScoreFromMembers([{ score: 40 }, { score: 60 }], null)
    expect(s.average).toBe(50)
    expect(s.contributors).toBe(2)
    expect(s.memberCount).toBe(3) // owner still counted as a household member
  })
})
