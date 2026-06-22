import { describe, it, expect } from "vitest"
import { generateShareCode, resultFromLead } from "@/lib/waitlist-result"

describe("waitlist-result", () => {
  it("generates 9-char share codes from the safe alphabet, and they differ", () => {
    const a = generateShareCode()
    const b = generateShareCode()
    expect(a).toHaveLength(9)
    expect(a).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{9}$/)
    expect(a).not.toBe(b) // astronomically unlikely to collide
  })

  it("returns null when the lead has no sub_scores", () => {
    expect(resultFromLead({ overall_score: 50, sub_scores: null })).toBeNull()
    expect(resultFromLead({})).toBeNull()
  })

  it("rebuilds a low result as Early Builder", () => {
    const r = resultFromLead({ overall_score: 0, sub_scores: { prebiotics: 0, probiotics: 0, postbiotics: 0 } })
    expect(r).not.toBeNull()
    expect(r!.profile.type).toBe("Early Builder")
    expect(r!.insights).toHaveLength(3)
  })

  it("rebuilds a high result as Thriving Food System", () => {
    const r = resultFromLead({ overall_score: 100, sub_scores: { prebiotics: 100, probiotics: 100, postbiotics: 100 } })
    expect(r!.profile.type).toBe("Thriving Food System")
    expect(r!.overall).toBe(100)
  })

  it("recomputes overall from sub_scores when overall_score is missing", () => {
    const r = resultFromLead({ sub_scores: { prebiotics: 80, probiotics: 80, postbiotics: 80 } })
    expect(r!.overall).toBeGreaterThan(0)
  })
})
