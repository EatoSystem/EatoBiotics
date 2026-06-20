import { describe, it, expect } from "vitest"
import { computeResult, resultSections } from "@/lib/assessment-scoring"

function uniform(value: number): Record<string, number> {
  const a: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) a[`q${i}`] = value
  return a
}

describe("You result sections", () => {
  it("derives the standard constructive sections with a confidence label", () => {
    const result = computeResult(uniform(2))
    const s = resultSections(result)
    expect(s.whatThisMeans.length).toBeGreaterThan(0)
    expect(s.whyItMatters.length).toBeGreaterThan(0)
    expect(s.whatToDoThisWeek.length).toBeGreaterThan(0)
    expect(s.strongestArea.length).toBeGreaterThan(0)
    expect(s.biggestOpportunity.length).toBeGreaterThan(0)
    expect(s.confidenceLabel).toBe("Snapshot")
  })

  it("picks the highest-scoring pillar as strongest and the weakest as the opportunity", () => {
    // Prebiotics (q1–q6) highest, Probiotics (q7–q9) lowest, Postbiotics mid.
    const answers = { ...uniform(2), q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 0, q8: 0, q9: 0 }
    const s = resultSections(computeResult(answers))
    expect(s.strongestArea).toBe("Prebiotics")
    expect(s.biggestOpportunity).toBe("Probiotics")
  })

  it("accepts a Pattern/Tracked confidence label for repeat assessments", () => {
    const s = resultSections(computeResult(uniform(2)), "Tracked")
    expect(s.confidenceLabel).toBe("Tracked")
  })
})
