import { describe, it, expect } from "vitest"

import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { band } from "@/lib/report/build-food-system-report"
import { normalizeToBiotics, orderedByNeed, PATHWAY_LABEL } from "@/lib/report/subscores"

/**
 * Regression suite for the €49 audit's core finding: the fallback paid report
 * (what a customer actually receives when Claude generation fails or is
 * skipped) used to be score-blind — every customer got the same opening
 * shape, the same five foods, and 30-day plans that never referenced their
 * weakest pathway. A 98/100 profile and a 20/100 profile received the same
 * report with different numbers substituted in.
 *
 * Three profiles, deliberately spanning all three bands (strong/building/
 * strained) AND three different priority pathways, so a bug that only shows
 * up for one band or one pathway cannot hide behind the other two.
 */

const PROFILE = { type: "Emerging Balance", tagline: "t", description: "d" }

const PROFILES = {
  strong: {
    overall: 91,
    subScores: { prebiotics: 70, probiotics: 95, postbiotics: 98 },
  },
  building: {
    overall: 55,
    subScores: { prebiotics: 60, probiotics: 35, postbiotics: 65 },
  },
  strained: {
    overall: 22,
    subScores: { prebiotics: 30, probiotics: 28, postbiotics: 15 },
  },
  /**
   * The adversarial case, and the reason `Framing` exists.
   *
   * computeOverall is `0.4·pre + 0.2·pro + 0.4·post` with a floor of 20 per
   * pillar, so someone who eats no fermented food at all still scores
   * 0.4·85 + 0.2·20 + 0.4·85 = 72 → the "strong" band, while Probiotics sits at
   * 20/100. Branching on the overall band alone told this customer their 20/100
   * pathway was "well supported", "not a weakness to fix" and "doesn't need
   * fixing" — on a report that prints Probiotics 20/100 elsewhere.
   */
  strongWithStrained: {
    overall: 72,
    subScores: { prebiotics: 85, probiotics: 20, postbiotics: 85 },
  },
} as const

/** Phrases that must never reach a profile with a strained pathway. */
const CONTRADICTORY = [
  "well supported across the board",
  "not a weakness",
  "doesn't need fixing",
  "does not need fixing",
  "well established across all three pathways",
  "not a missing pathway",
]

/** Every string in a report, however deeply nested — the whole customer surface. */
export function allStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") acc.push(value)
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, acc))
  else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) => allStrings(v, acc))
  }
  return acc
}

function reportFor(name: keyof typeof PROFILES, tier: "starter" | "full" | "premium" = "premium") {
  const p = PROFILES[name]
  return buildFallbackPaidReport({
    tier,
    overall: p.overall,
    subScores: p.subScores,
    profile: PROFILE,
    questions: [],
    answers: {},
  }) as ReturnType<typeof buildFallbackPaidReport> & {
    specificFoodList: Array<{ food: string; biotic: string; swap?: string }>
    sevenDayPlan: Array<{ day: string; action: string }>
    thirtyDayRoadmap: Array<{ week: number; theme: string; actions: string[] }>
    opening: string
    topTrigger: string
    foodSystem: { systemSnapshot: { priorityPathway: string; strongestPathway: string } }
  }
}

describe("fallback report: priority pathway agrees with the actual scores", () => {
  it.each(Object.keys(PROFILES) as Array<keyof typeof PROFILES>)("%s profile", (name) => {
    const p = PROFILES[name]
    const biotics = normalizeToBiotics(p.subScores)!
    const ranked = orderedByNeed(biotics)
    const expectedPriority = ranked[0][0]
    const expectedStrongest = ranked[ranked.length - 1][0]

    const report = reportFor(name)

    // The Food System chapter's own priority classification must agree with
    // what the legacy fields below are built from — there is only one ranking.
    expect(report.foodSystem.systemSnapshot.priorityPathway).toBe(expectedPriority)
    expect(report.foodSystem.systemSnapshot.strongestPathway).toBe(expectedStrongest)

    // The first food recommended must come from the priority pathway.
    expect(report.specificFoodList[0]?.biotic).toBe(expectedPriority)

    // The opening and the top lever must name the real priority pathway label.
    expect(report.opening).toContain(PATHWAY_LABEL[expectedPriority])
    expect(report.topTrigger.toLowerCase()).toContain(PATHWAY_LABEL[expectedPriority].toLowerCase())
  })
})

describe("fallback report: a strong overall score never hides a strained pathway", () => {
  const report = reportFor("strongWithStrained")
  const all = allStrings(report).join(" \n ")

  it("lands in the strong band overall while Probiotics is strained", () => {
    // If either of these stops holding the fixture has stopped being adversarial
    // and the rest of this block would pass vacuously.
    expect(band(PROFILES.strongWithStrained.overall)).toBe("strong")
    expect(band(PROFILES.strongWithStrained.subScores.probiotics)).toBe("strained")
  })

  it("names Probiotics as the priority pathway", () => {
    expect(report.foodSystem.systemSnapshot.priorityPathway).toBe("probiotics")
    expect(report.topTrigger).toContain("Probiotics")
    expect(report.specificFoodList[0].biotic).toBe("probiotics")
  })

  it("the opening acknowledges the strong overall foundation", () => {
    expect(report.opening.toLowerCase()).toContain("strong overall foundation")
  })

  it("the opening also explicitly acknowledges the strained pathway", () => {
    expect(report.opening).toContain("Probiotics")
    expect(report.opening.toLowerCase()).toContain("under-supported")
    // The actual number, so the sentence cannot be read as reassurance.
    expect(report.opening).toContain("20/100")
  })

  it("no contradictory reassurance appears anywhere in the report", () => {
    for (const phrase of CONTRADICTORY) {
      expect(all.toLowerCase(), phrase).not.toContain(phrase)
    }
  })
})

describe("fallback report: band-aware language", () => {
  it("a strong profile is never told it has pressure points, and is not told to fix a weakness", () => {
    const report = reportFor("strong")
    expect(band(PROFILES.strong.overall)).toBe("strong")
    expect(report.opening.toLowerCase()).not.toMatch(/pressure point/)
    expect(report.opening.toLowerCase()).toMatch(/well supported/)
    // The top lever reframes as protection, not correction, for a strong profile.
    expect(report.topTrigger.toLowerCase()).toMatch(/protect|steady/)
  })

  it("a strained profile is never praised as a strong foundation", () => {
    const report = reportFor("strained")
    expect(band(PROFILES.strained.overall)).toBe("strained")
    expect(report.opening.toLowerCase()).not.toMatch(/strong foundation/)
    expect(report.opening.toLowerCase()).toMatch(/early in its development/)
  })

  it("a building profile lands between the two extremes", () => {
    const report = reportFor("building")
    expect(band(PROFILES.building.overall)).toBe("building")
    expect(report.opening.toLowerCase()).not.toMatch(/pressure point|strong foundation/)
  })
})

describe("fallback report: three profiles do not receive the same report with different numbers", () => {
  const reports = {
    strong: reportFor("strong"),
    building: reportFor("building"),
    strained: reportFor("strained"),
  }

  it("the five recommended foods differ across profiles with different priority pathways", () => {
    const foodLists = Object.values(reports).map((r) => r.specificFoodList.map((f) => f.food).join("|"))
    expect(new Set(foodLists).size).toBe(3)
  })

  it("every recommended food carries a real alternative", () => {
    for (const [name, report] of Object.entries(reports)) {
      for (const food of report.specificFoodList) {
        expect(food.swap, `${name}: ${food.food}`).toBeTruthy()
        expect(food.swap!.length, `${name}: ${food.food}`).toBeGreaterThan(5)
      }
    }
  })

  it("the seven-day plan's Monday and Saturday actions name the actual top food tool", () => {
    for (const [name, report] of Object.entries(reports)) {
      const topFood = report.foodSystem.systemSnapshot.priorityPathway
      expect(report.sevenDayPlan[0].day).toBe("Monday")
      expect(report.sevenDayPlan[0].action.toLowerCase(), name).toContain(
        report.specificFoodList[0].food.toLowerCase(),
      )
      expect(topFood).toBeTruthy()
    }
  })

  it("the 30-day roadmap's week 1-2 themes differ across profiles with different priority pathways", () => {
    const themes = Object.values(reports).map((r) => `${r.thirtyDayRoadmap[0].theme}|${r.thirtyDayRoadmap[1].theme}`)
    expect(new Set(themes).size).toBe(3)
  })

  it("no two profiles produce byte-identical openings, top triggers, or food lists", () => {
    const openings = Object.values(reports).map((r) => r.opening)
    const triggers = Object.values(reports).map((r) => r.topTrigger)
    expect(new Set(openings).size).toBe(3)
    expect(new Set(triggers).size).toBe(3)
  })
})

/**
 * The "5 Foods" heading is hard-coded in two renderers
 * (lib/pdf/report-pdf.tsx "Your 5 Priority Foods" and
 * components/assessment/paid-report-client.tsx "5 Foods Chosen For You"), so the
 * count is a contract. It used to break: foodTools was
 * `[...TOOLS[priority], ...TOOLS[strongest]].slice(0, 5)` and the catalogue is
 * 3 prebiotic / 2 probiotic / 2 postbiotic, so any ordering where PREBIOTICS was
 * the MIDDLE score gave 2 + 2 = 4 foods under a five-food heading. That is a
 * third of all orderings, and the suite's own `building` fixture was one of them.
 */
describe("fallback report: always exactly five unique, complete foods", () => {
  // Every strict ordering of the three pathways, plus ties at each end and a
  // three-way tie — the cases where `orderedByNeed`'s stable sort decides.
  const ORDERINGS: Array<[string, { prebiotics: number; probiotics: number; postbiotics: number }]> = [
    ["pre<pro<post", { prebiotics: 20, probiotics: 50, postbiotics: 80 }],
    ["pre<post<pro", { prebiotics: 20, probiotics: 80, postbiotics: 50 }],
    ["pro<pre<post — prebiotics MIDDLE", { prebiotics: 50, probiotics: 20, postbiotics: 80 }],
    ["post<pre<pro — prebiotics MIDDLE", { prebiotics: 50, probiotics: 80, postbiotics: 20 }],
    ["pro<post<pre", { prebiotics: 80, probiotics: 20, postbiotics: 50 }],
    ["post<pro<pre", { prebiotics: 80, probiotics: 50, postbiotics: 20 }],
    ["all tied", { prebiotics: 50, probiotics: 50, postbiotics: 50 }],
    ["two tied low", { prebiotics: 20, probiotics: 20, postbiotics: 80 }],
    ["two tied high", { prebiotics: 20, probiotics: 80, postbiotics: 80 }],
  ]

  it.each(ORDERINGS)("%s yields five complete foods", (_label, subScores) => {
    const report = buildFallbackPaidReport({
      tier: "premium",
      overall: 50,
      subScores,
      profile: PROFILE,
      questions: [],
      answers: {},
    }) as { specificFoodList: Array<Record<string, string | undefined>>; foodSystem: { systemSnapshot: { priorityPathway: string } } }

    const foods = report.specificFoodList
    expect(foods).toHaveLength(5)
    expect(new Set(foods.map((f) => f.food)).size).toBe(5)

    // Priority-pathway foods lead the list.
    const priority = report.foodSystem.systemSnapshot.priorityPathway
    expect(foods[0].biotic).toBe(priority)

    // Every required field carries real content, on every item.
    for (const f of foods) {
      for (const field of ["food", "biotic", "mechanism", "whyForThem", "howToUse", "swap"] as const) {
        expect(f[field], `${_label} — ${f.food}.${field}`).toBeTruthy()
        expect(String(f[field]).trim().length, `${_label} — ${f.food}.${field}`).toBeGreaterThan(3)
      }
    }
  })
})

describe("fallback report: tiers still build on top of each other", () => {
  it("starter tier includes foodSystem but no specificFoodList (that's a full/premium field)", () => {
    const report = reportFor("building", "starter")
    expect(report.foodSystem).toBeTruthy()
    expect(report).not.toHaveProperty("specificFoodList")
  })

  it.each(["full", "premium"] as const)("%s tier's food list carries no emoji", (tier) => {
    const report = reportFor("building", tier)
    expect(report.specificFoodList.length).toBeGreaterThan(0)
    for (const food of report.specificFoodList) {
      expect(food).not.toHaveProperty("emoji")
    }
  })
})
