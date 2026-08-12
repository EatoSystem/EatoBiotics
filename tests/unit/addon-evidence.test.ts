import { describe, it, expect } from "vitest"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { buildAddonLens, mergeGeneratedLens } from "@/lib/report/addon-lens"
import { buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { foodSystemReportSchema } from "@/lib/report/food-system-report-types"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import { CLAIMS, DENIAL_BOILERPLATE } from "./helpers/marketing-language"

/**
 * The lens evidence contract.
 *
 * These sources were verified out-of-band and supplied exactly; this session
 * could not open them, because the egress policy blocks every one of the
 * domains. So these tests pin the transcription rather than the research: if a
 * title, publisher, year or URL drifts from what was verified, the citation is
 * no longer the thing that was checked, and that is the failure mode worth
 * catching in a paid report.
 */

const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }

function core() {
  const overall = computeOverall(SUB)
  return buildFoodSystemReport({ mode: "combined", subScores: SUB, overall, profile: getProfile(overall, SUB) })
}

const ANSWERS: Record<AddonType, Record<string, unknown>> = {
  stability: { lens1: "unpredictable", lens2: "stress-linked", lens3: ["none"], lens4: "rarely" },
  glucose: { lens1: "lift-then-dip", lens2: "skipped", lens3: "mid-afternoon", lens4: ["alone"] },
  mind: { lens1: "skipped", lens2: "early-afternoon", lens3: ["none"], lens4: "daily" },
  performance: { lens1: "neither", lens2: "depleted", lens3: ["variable"], lens4: "rarely" },
}

const lensFor = (addon: AddonType) =>
  buildAddonLens({ addon, answers: ANSWERS[addon], foodSystem: core() })

/** The verified pack, as supplied. Any drift from this fails. */
const EXPECTED: Record<AddonType, Array<{ title: string; organisation: string; year: string; url: string }>> = {
  stability: [
    {
      title: "Irritable bowel syndrome in adults: diagnosis and management",
      organisation: "NICE",
      year: "2017, reviewed 2025",
      url: "https://www.nice.org.uk/guidance/cg61",
    },
    {
      title: "Symptoms of IBS (irritable bowel syndrome)",
      organisation: "NHS",
      year: "2025",
      url: "https://www.nhs.uk/conditions/irritable-bowel-syndrome-ibs/symptoms/",
    },
  ],
  glucose: [
    {
      title: "Healthy diet",
      organisation: "World Health Organization",
      year: "2026",
      url: "https://www.who.int/news-room/fact-sheets/detail/healthy-diet",
    },
    {
      title: "Carbohydrate quality and human health: a series of systematic reviews and meta-analyses",
      organisation: "The Lancet",
      year: "2019",
      url: "https://pubmed.ncbi.nlm.nih.gov/30638909/",
    },
    {
      title:
        "The Effect of Adding Protein to a Carbohydrate Meal on Postprandial Glucose and Insulin Responses",
      organisation: "The Journal of Nutrition",
      year: "2024",
      url: "https://pubmed.ncbi.nlm.nih.gov/39019167/",
    },
  ],
  mind: [
    {
      title: "Food and mood: how do diet and nutrition affect mental wellbeing?",
      organisation: "BMJ",
      year: "2020",
      url: "https://pubmed.ncbi.nlm.nih.gov/32601102/",
    },
    {
      title:
        "The Effects of Dietary Improvement on Symptoms of Depression and Anxiety: A Meta-Analysis of Randomized Controlled Trials",
      organisation: "Psychosomatic Medicine",
      year: "2019",
      url: "https://pubmed.ncbi.nlm.nih.gov/30720698/",
    },
  ],
  performance: [
    {
      title: "Nutrition and Athletic Performance",
      organisation:
        "Academy of Nutrition and Dietetics, Dietitians of Canada and American College of Sports Medicine",
      year: "2016",
      url: "https://pubmed.ncbi.nlm.nih.gov/26891166/",
    },
    {
      title:
        "The Effect of Consuming Carbohydrate With and Without Protein on the Rate of Muscle Glycogen Re-synthesis During Short-Term Post-exercise Recovery",
      organisation: "Sports Medicine - Open",
      year: "2021",
      url: "https://pubmed.ncbi.nlm.nih.gov/33507402/",
    },
  ],
}

describe("every lens cites at least two verified sources", () => {
  it.each(ADDON_KEYS)("%s has the exact verified pack", (addon) => {
    const notes = lensFor(addon).evidenceNotes
    expect(notes.length).toBeGreaterThanOrEqual(2)
    expect(
      notes.map((n) => ({ title: n.title, organisation: n.organisation, year: n.year, url: n.url })),
    ).toEqual(EXPECTED[addon])
  })

  it.each(ADDON_KEYS)("%s states what each source supports and does not show", (addon) => {
    for (const n of lensFor(addon).evidenceNotes) {
      expect(n.whatItSupports.trim().length, `${addon}: ${n.title} supports`).toBeGreaterThan(40)
      expect(n.limitation.trim().length, `${addon}: ${n.title} limitation`).toBeGreaterThan(40)
      expect(n.url).toMatch(/^https:\/\//)
    }
  })
})

/**
 * The two sources that were removed for not supporting the sentence they sat
 * beside. Both are plausible-looking and topically adjacent, which is exactly
 * why they need a named guard rather than reliance on review.
 */
describe("mismatched sources cannot return", () => {
  it("Wastyk 2021 is not cited as Mind evidence", () => {
    const blob = JSON.stringify(lensFor("mind")).toLowerCase()
    expect(blob).not.toContain("wastyk")
    expect(blob).not.toContain("34256014")
    expect(blob).not.toContain("gut-microbiota-targeted diets")
  })

  it("generic NHS physical-activity guidance is not cited as Performance evidence", () => {
    const blob = JSON.stringify(lensFor("performance")).toLowerCase()
    expect(blob).not.toContain("physical-activity-guidelines")
    expect(blob).not.toContain("physical activity guidelines")
  })

  it("no lens cites a source for a claim about measuring or predicting", () => {
    for (const addon of ADDON_KEYS) {
      for (const n of lensFor(addon).evidenceNotes) {
        const supports = n.whatItSupports.toLowerCase()
        expect(supports, `${addon}: ${n.title}`).not.toMatch(
          /measures? your|predicts? your|shows? your (glucose|mood|risk)|diagnos/,
        )
      }
    }
  })

  it("the Mind copy no longer claims fermented food is the most studied factor", () => {
    // Narrowed when Wastyk was dropped: nothing in the verified Mind pack
    // supports a superlative, and its evidence is about dietary improvement
    // generally, with no significant effect for anxiety.
    const blob = JSON.stringify(lensFor("mind")).toLowerCase()
    expect(blob).not.toContain("most studied")
  })
})

describe("evidence is derived and cannot be touched by the model", () => {
  it.each(ADDON_KEYS)("%s: a hostile response cannot add, remove or rewrite evidence", (addon) => {
    const base = lensFor(addon)
    const merged = mergeGeneratedLens(base, {
      evidenceNotes: [
        {
          title: "Invented Study Proving Everything",
          organisation: "Nowhere",
          year: "2030",
          url: "https://example.com/fake",
          whatItSupports: "That this plan is guaranteed to work for you personally within weeks.",
          limitation: "None.",
        },
      ],
      patternSummary: "A legitimate personalised summary, comfortably past the minimum length.",
    })

    expect(JSON.stringify(merged.evidenceNotes)).toBe(JSON.stringify(base.evidenceNotes))
    expect(JSON.stringify(merged.evidenceNotes)).not.toContain("Invented Study")
    // The one field it IS allowed to write still came through.
    expect(merged.patternSummary).toContain("legitimate personalised summary")
  })

  it("a response that deletes evidence leaves it intact", () => {
    const base = lensFor("stability")
    expect(mergeGeneratedLens(base, { evidenceNotes: [] }).evidenceNotes).toEqual(base.evidenceNotes)
  })
})

describe("the schema requires evidence when a lens exists", () => {
  const base = core()

  it("a lens with the full pack validates", () => {
    expect(foodSystemReportSchema.safeParse({ ...base, lens: lensFor("glucose") }).success).toBe(true)
  })

  it("a report with no lens still validates", () => {
    expect(foodSystemReportSchema.safeParse(base).success).toBe(true)
  })

  it.each([
    ["no evidence at all", undefined],
    ["an empty list", []],
    ["only one source", [lensFor("mind").evidenceNotes[0]]],
  ])("a lens with %s is rejected", (_label, evidenceNotes) => {
    const lens = { ...lensFor("mind"), evidenceNotes }
    expect(foodSystemReportSchema.safeParse({ ...base, lens }).success).toBe(false)
  })

  it("a note missing its limitation is rejected", () => {
    const notes = lensFor("mind").evidenceNotes.map((n) => ({ ...n, limitation: "" }))
    expect(foodSystemReportSchema.safeParse({ ...base, lens: { ...lensFor("mind"), evidenceNotes: notes } }).success).toBe(
      false,
    )
  })
})

describe("the real CLAIMS rules pass over supports and limitation text", () => {
  it.each(ADDON_KEYS)("%s", (addon) => {
    const text = lensFor(addon)
      .evidenceNotes.map((n) => `${n.whatItSupports}\n${n.limitation}`)
      .join("\n")
      .replace(DENIAL_BOILERPLATE, " ")

    expect(text.length).toBeGreaterThan(300)

    const hits: string[] = []
    for (const [rule, pattern] of CLAIMS) {
      const m = text.match(pattern)
      if (m) hits.push(`${rule}: "${m[0]}"`)
    }
    expect(hits, hits.join("\n")).toEqual([])
  })
})
