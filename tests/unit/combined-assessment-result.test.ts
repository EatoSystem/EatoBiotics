import { describe, it, expect } from "vitest"
import { buildCombinedResult } from "@/lib/combined-assessment-result"
import { GLOBAL_DISCLAIMER, STABILITY_DISCLAIMER } from "@/lib/assessment-disclaimers"
import type { AssessmentSummaryLike } from "@/lib/assessment-types"

function youSummary(over: Partial<AssessmentSummaryLike> = {}): AssessmentSummaryLike {
  return {
    key: "you",
    kind: "foundation",
    label: "You",
    scoreLabel: "Food System Score",
    score: 72,
    bandLabel: "Strong Foundation",
    bandDescription: "Your food system has a solid base.",
    strengths: ["Plant diversity"],
    priorities: ["Live foods"],
    sevenDay: ["Add one fermented food to a daily meal."],
    ...over,
  }
}

function familySummary(over: Partial<AssessmentSummaryLike> = {}): AssessmentSummaryLike {
  return {
    key: "family",
    kind: "foundation",
    label: "Family",
    scoreLabel: "Family Food Culture Score",
    score: 58,
    bandLabel: "Emerging Balance",
    bandDescription: "Your household food culture is taking shape.",
    strengths: ["Shared meals"],
    priorities: ["Exposure"],
    sevenDay: ["Offer one new plant food this week, no pressure."],
    ...over,
  }
}

function glucoseSummary(over: Partial<AssessmentSummaryLike> = {}): AssessmentSummaryLike {
  return {
    key: "glucose",
    kind: "health",
    label: "Glucose",
    scoreLabel: "Glucose Stability Support Score",
    score: 64,
    bandLabel: "Balanced Rhythm",
    bandDescription: "Your patterns broadly support steadier energy.",
    strengths: ["The Plate"],
    priorities: ["Strength"],
    sevenDay: ["Walk for 10 minutes after your largest meal."],
    thirtyDay: ["Week 1: protein first at each meal", "Week 2: add two resistance sessions"],
    ...over,
  }
}

function stabilitySummary(over: Partial<AssessmentSummaryLike> = {}): AssessmentSummaryLike {
  return {
    key: "stability",
    kind: "health",
    label: "Stability",
    scoreLabel: "Digestive Stability Support Score",
    score: 40,
    bandLabel: "Moderate Instability",
    strengths: ["Food system"],
    priorities: ["Urgency & control"],
    sevenDay: ["Keep a simple symptom + food note for a week."],
    ...over,
  }
}

describe("buildCombinedResult", () => {
  it("titles a You + Glucose combined report", () => {
    const r = buildCombinedResult(youSummary(), glucoseSummary())
    expect(r.reportTitle).toBe("Your EatoBiotics + Glucose Report")
    expect(r.addonResult?.addonType).toBe("glucose")
    expect(r.foundationResult.foundationType).toBe("you")
  })

  it("titles a Family + Stability combined report", () => {
    const r = buildCombinedResult(familySummary(), stabilitySummary())
    expect(r.reportTitle).toBe("Your Family + Stability Report")
  })

  it("produces a foundation-only report when there is no add-on", () => {
    const r = buildCombinedResult(youSummary(), null)
    expect(r.reportTitle).toBe("Your EatoBiotics Report")
    expect(r.addonResult).toBeNull()
    expect(r.first7Days.length).toBeGreaterThan(0)
    expect(r.disclaimer).toBe(GLOBAL_DISCLAIMER)
  })

  it("merges both 7-day action sets and explains the foundation influence", () => {
    const r = buildCombinedResult(youSummary(), glucoseSummary())
    expect(r.first7Days).toContain("Walk for 10 minutes after your largest meal.")
    expect(r.first7Days).toContain("Add one fermented food to a daily meal.")
    expect(r.foundationInfluence.toLowerCase()).toContain("glucose")
    expect(r.combinedSummary).toContain("Glucose")
    expect(r.combinedSummary).toContain("EatoBiotics")
  })

  it("uses the add-on 30-day protocol when present, else derives one", () => {
    const withProtocol = buildCombinedResult(youSummary(), glucoseSummary())
    expect(withProtocol.next30Days[0]).toContain("Week 1")

    const derived = buildCombinedResult(youSummary(), stabilitySummary())
    expect(derived.next30Days.length).toBeGreaterThan(0)
  })

  it("puts safety first when the add-on reports red flags", () => {
    const flagged = stabilitySummary({ safetyFlags: ["Blood in stool"] })
    const r = buildCombinedResult(familySummary(), flagged)
    expect(r.addonResult?.safetyFlags).toEqual(["Blood in stool"])
    expect(r.combinedSummary.startsWith("Before anything else")).toBe(true)
    expect(r.first7Days[0].toLowerCase()).toContain("gp")
    expect(r.disclaimer).toContain(STABILITY_DISCLAIMER)
  })

  it("refuses to build a final report from an add-on alone (no foundation)", () => {
    // An add-on summary in the foundation slot must throw — add-ons are never standalone.
    expect(() => buildCombinedResult(glucoseSummary(), null)).toThrow()
  })
})
