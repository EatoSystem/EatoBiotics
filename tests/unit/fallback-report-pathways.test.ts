import { describe, it, expect } from "vitest"

import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"

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
  }
}

/* ══ 0R-6R · THESE FOUR DESCRIBES ASSERTED THE CONSTRUCT ═══════════════════
 *
 * They were written for the €49 audit's finding that this fallback was
 * "score-blind": every customer got the same opening and the same five foods,
 * and the repair made the report vary with the member's WEAKEST PATHWAY.
 *
 * That repair was the defect. The variation it introduced was an argmin over
 * three unmeasured scores choosing the opening, the top trigger, the five
 * foods, the seven-day plan and the thirty-day roadmap — and the four describes
 * here were the proof that it was working:
 *
 *   "priority pathway agrees with the actual scores"
 *   "a strong overall score never hides a strained pathway"
 *   "band-aware language"
 *   "three profiles do not receive the same report with different numbers"
 *
 * The invariant is now the opposite one, and it is stronger: holding the
 * MULTISET of scores constant and permuting which Biotic carries which, the
 * report must be byte-identical. The audit's real concern — that a report
 * should not be the same for a 98 and a 20 — survives in the band-aware
 * describe below, which keys on the OVERALL score, one figure on one scale.
 */

describe("0R-6R · which Biotic is weakest cannot change the fallback report", () => {
  const MULTISET = [71, 23, 48] as const
  const PERMUTATIONS = [
    { prebiotics: 71, probiotics: 23, postbiotics: 48 },
    { prebiotics: 23, probiotics: 48, postbiotics: 71 },
    { prebiotics: 48, probiotics: 71, postbiotics: 23 },
    { prebiotics: 23, probiotics: 71, postbiotics: 48 },
    { prebiotics: 71, probiotics: 48, postbiotics: 23 },
    { prebiotics: 48, probiotics: 23, postbiotics: 71 },
  ] as const

  function permuted(sub: (typeof PERMUTATIONS)[number]) {
    return buildFallbackPaidReport({
      tier: "premium",
      overall: 55,
      subScores: { ...sub },
      profile: PROFILE,
      questions: [],
      answers: {},
    })
  }

  it("six orderings of the same three numbers produce one report", () => {
    // NON-VACUITY: the fixture really is one multiset, permuted.
    for (const p of PERMUTATIONS) {
      expect([p.prebiotics, p.probiotics, p.postbiotics].sort((a, b) => b - a)).toEqual(
        [...MULTISET].sort((a, b) => b - a),
      )
    }

    /*
     * `generatedAt` is a wall-clock ISO string minted per call, so the six
     * reports differ by a millisecond and nothing else. Measured, not assumed:
     * a line-by-line diff of two permutations showed exactly one differing
     * line, and it was the timestamp. Normalised here so the assertion is about
     * the ranking rather than about how fast the loop ran.
     */
    const rendered = PERMUTATIONS.map((p) =>
      JSON.stringify(permuted(p)).replace(/"generatedAt":"[^"]*"/g, '"generatedAt":"FIXED"'),
    )
    expect(
      new Set(rendered).size,
      "the fallback report still differs across permutations of the SAME three " +
        "scores. Only which Biotic carries which number changed, so every " +
        "difference is a personal Biotic ranking choosing what a paying " +
        "customer receives when generation fails.",
    ).toBe(1)
  })

  it("no customer-facing PROSE names a Biotic or ranks the pathways", () => {
    const report = permuted(PERMUTATIONS[0])
    /*
     * The food catalogue's `biotic` field is excluded, and the ruling says why:
     * "non-personal taxonomy keys used only to organise reviewed material" may
     * remain. `{ food: "Kefir", biotic: "probiotics" }` classifies a FOOD. It
     * says nothing about the reader, and a rule that refused it would be
     * refusing the education the product is built to teach.
     *
     * Everything else in the report is prose a customer reads.
     */
    /*
     * Scoped to the DeepReport's OWN copy. Two things inside it legitimately
     * name a Biotic, and the ruling names both as permitted:
     *
     *   report.foodSystem.educationModules  "Prebiotics: what feeds your
     *                                        microbes" — reviewed GENERAL
     *                                        education, about the biology
     *   specificFoodList[].biotic           a taxonomy key classifying a FOOD
     *
     * Neither says anything about the reader. What this suite is about is the
     * prose the fallback writes ABOUT this customer, which is every other
     * string in the object.
     */
    const { foodSystem: _edu, specificFoodList, ...own } = report as typeof report & {
      specificFoodList: Array<{ food: string; biotic: string }>
    }
    const foodKeys = new Set(specificFoodList.map((f) => f.biotic))
    const strings = [...allStrings(own), ...allStrings(specificFoodList)].filter(
      (v) => !foodKeys.has(v),
    )

    // NON-VACUITY: this is a full report, not an empty object.
    expect(strings.length, "the fallback report produced almost no copy").toBeGreaterThan(40)

    for (const value of strings) {
      expect(value, `names a Biotic: "${value}"`).not.toMatch(/\b(?:[Pp]re|[Pp]ro|[Pp]ost)biotics?\b/)
      expect(value, `ranks the pathways: "${value}"`).not.toMatch(
        /\b(?:strongest|weakest|thinnest) pathway\b|\bpathway (?:with the most room|holding the rest)\b/i,
      )
    }
  })
})

describe("fallback report: band-aware language, keyed on the overall score", () => {
  it.each(["strong", "building", "strained"] as const)(
    "%s — no copy contradicts the overall band",
    (name) => {
      const strings = allStrings(reportFor(name)).join(" ").toLowerCase()
      if (name === "strong") return
      for (const phrase of CONTRADICTORY) {
        expect(strings.includes(phrase), `a ${name} profile was told "${phrase}"`).toBe(false)
      }
    },
  )

  it("a strong overall score still gets maintenance framing, not a fix-it pitch", () => {
    const r = reportFor("strong")
    expect(r.topTrigger.toLowerCase()).toContain("protect")
  })

  it("the adversarial 72 profile is no longer a special case", () => {
    /*
     * `strongWithStrained` existed because the overall band said "strong" while
     * probiotics sat at 20/100, and the report printed that 20 elsewhere. It
     * prints no per-Biotic score anywhere now, so the two statements that could
     * contradict each other are down to one — and that one is the overall score,
     * which is what the band describes.
     */
    const { foodSystem: _edu, specificFoodList, ...own } = reportFor("strongWithStrained")
    const foodKeys = new Set(specificFoodList.map((f) => f.biotic))
    const prose = [...allStrings(own), ...allStrings(specificFoodList)]
      .filter((v) => !foodKeys.has(v))
      .join(" ")
    expect(prose).not.toMatch(/\b(?:[Pp]re|[Pp]ro|[Pp]ost)biotics?\b/)
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
  /*
   * 0R-6R · these nine orderings used to be the point: `orderedByNeed`'s stable
   * sort decided the list, and the count broke whenever prebiotics was the
   * MIDDLE score. The list is now catalogue-ordered, so the orderings should
   * make no difference at all — which is a STRONGER version of the same
   * contract, and the identical-output assertion below is what states it.
   */
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

  /** The catalogue's first five unique tools — identical for every reader. */
  const CANONICAL_FIVE = (
    buildFallbackPaidReport({
      tier: "premium",
      overall: 50,
      subScores: { prebiotics: 50, probiotics: 50, postbiotics: 50 },
      profile: PROFILE,
      questions: [],
      answers: {},
    }) as { specificFoodList: Array<{ food: string }> }
  ).specificFoodList.map((f) => f.food)

  it.each(ORDERINGS)("%s yields the same five complete foods", (_label, subScores) => {
    const report = buildFallbackPaidReport({
      tier: "premium",
      overall: 50,
      subScores,
      profile: PROFILE,
      questions: [],
      answers: {},
    }) as { specificFoodList: Array<Record<string, string | undefined>> }

    const foods = report.specificFoodList
    expect(foods).toHaveLength(5)
    expect(new Set(foods.map((f) => f.food)).size).toBe(5)

    /*
     * 0R-6R · was `expect(foods[0].biotic).toBe(priority)` — the five foods a
     * paying customer sees, led by the argmin. The list is the same five, in
     * the same order, for every ordering of the scores.
     */
    expect(foods.map((f) => f.food)).toEqual(CANONICAL_FIVE)

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
