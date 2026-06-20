import { describe, it, expect } from "vitest"
import { buildResultsEmail } from "@/lib/email/results-email"

const base = {
  name: "Sam",
  overall: 64,
  profileType: "Emerging Balance",
  tagline: "The building blocks are there.",
  nextActions: ["Do one small thing this week."],
}

describe("buildResultsEmail — assessment variants", () => {
  it("gut: Food System copy + 3 biotic pillars from subScores", () => {
    const { subject, html } = buildResultsEmail({
      ...base,
      subScores: { prebiotics: 80, probiotics: 40, postbiotics: 60 },
    })
    expect(subject).toBe("Your EatoBiotics Score: 64/100 — Emerging Balance")
    expect(html).toContain("Your Food System Score")
    expect(html).toContain("Prebiotics · Probiotics · Postbiotics")
    expect(html).toContain("Prebiotics")
    expect(html).toContain("Postbiotics")
  })

  it("mind: Mind copy + the five Mind pillars (not gut biotics)", () => {
    const { subject, html } = buildResultsEmail({
      ...base,
      assessmentType: "mind",
      subScores: { prebiotics: 50, probiotics: 50, postbiotics: 50 },
      pillars: [
        { label: "Plant & Polyphenol Diversity", score: 70 },
        { label: "Brain Fuel", score: 55 },
        { label: "Live Foods", score: 40 },
        { label: "Rhythm", score: 80 },
        { label: "Mind Response", score: 65 },
      ],
    })
    expect(subject).toContain("Mind Score:")
    expect(html).toContain("Your Mind Score")
    expect(html).toContain("Your 5 Pillars")
    expect(html).toContain("Brain Fuel")
    expect(html).toContain("Mind Response")
    // Strongest (Rhythm 80) and focus (Live Foods 40) callouts present
    expect(html).toContain("Rhythm")
    expect(html).toContain("Live Foods")
  })

  it("family: Family copy + the five Family pillars (not gut copy)", () => {
    const { subject, html } = buildResultsEmail({
      ...base,
      assessmentType: "family",
      subScores: { prebiotics: 50, probiotics: 50, postbiotics: 50 },
      pillars: [
        { label: "Exposure", score: 70 },
        { label: "Foundation", score: 55 },
        { label: "Live Foods", score: 40 },
        { label: "Rhythm", score: 80 },
        { label: "Food Culture", score: 65 },
      ],
    })
    expect(subject).toBe("Your EatoBiotics Family Score: 64/100 — Emerging Balance")
    expect(html).toContain("Your Family Food System Score")
    expect(html).toContain("Exposure")
    expect(html).toContain("Food Culture")
    expect(html).not.toContain("Your Mind Score")
  })
})
