import { describe, it, expect } from "vitest"

import {
  buildFoodSystemReport,
  ensureFoodSystem,
  mergeGeneratedNarrative,
  resolveReportMode,
} from "@/lib/report/build-food-system-report"
import {
  CLOSING_HEADLINE_LINES,
  SAFETY_FOOTER,
  foodSystemReportSchema,
  parseFoodSystemReport,
} from "@/lib/report/food-system-report-types"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { computeSubScores, computeOverall, getProfile } from "@/lib/assessment-scoring"
import { computeResult } from "@/lib/family-assessment-scoring"
import { FAMILY_QUESTIONS } from "@/lib/family-assessment-data"

/* ── Fixtures from the real scorers, not hand-made objects ───────────────── */

function youResult(answerValue = 2) {
  const answers: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) answers[`q${i}`] = answerValue
  const subScores = computeSubScores(answers)
  const overall = computeOverall(subScores)
  return { subScores, overall, profile: getProfile(overall, subScores) }
}

function familyResult() {
  const answers: Record<string, number> = {}
  for (const q of FAMILY_QUESTIONS) answers[q.id] = 2
  const r = computeResult(answers)
  return { subScores: r.subScores, overall: r.overall, profile: r.profile }
}

const buildYou = (v = 2) => {
  const { subScores, overall, profile } = youResult(v)
  return buildFoodSystemReport({ mode: "you", subScores, overall, profile })
}

/* ── 1. The schema is satisfied by construction ──────────────────────────── */

describe("buildFoodSystemReport", () => {
  it("produces a report that validates, for every answer level", () => {
    // 0 through 3 is the full range of the assessment's answer values, so this
    // covers every band boundary the builder can hit.
    for (const v of [0, 1, 2, 3]) {
      const result = foodSystemReportSchema.safeParse(buildYou(v))
      expect(result.success, `answer value ${v}: ${JSON.stringify(result.error?.issues?.[0])}`).toBe(
        true,
      )
    }
  })

  it("validates for the family flow, whose sub-scores carry all eleven keys", () => {
    const { subScores, overall, profile } = familyResult()
    const report = buildFoodSystemReport({ mode: "family", subScores, overall, profile })
    expect(foodSystemReportSchema.safeParse(report).success).toBe(true)
    expect(report.mode).toBe("family")
  })

  it("survives sub-scores it cannot read, rather than throwing", () => {
    // The legacy-five-only shape — the one that caused the undefined/100 bug.
    const report = buildFoodSystemReport({
      mode: "you",
      subScores: { diversity: 50, feeding: 60 },
      overall: 55,
      profile: { type: "t", tagline: "tag", description: "desc" },
    })
    expect(foodSystemReportSchema.safeParse(report).success).toBe(true)
    expect(report.bioticScores).toEqual({ prebiotics: 0, probiotics: 0, postbiotics: 0 })
  })

  it("contains every chapter the brief requires", () => {
    const r = buildYou()
    expect(r.systemSnapshot.oneLine.length).toBeGreaterThan(20)
    expect(r.foodSystemMap.length).toBe(3)
    expect(r.educationModules.length).toBe(3)
    expect(r.bodySignalMap.length).toBeGreaterThan(0)
    expect(r.priorityLever.firstStep.length).toBeGreaterThan(10)
    expect(r.foodTools.length).toBeGreaterThan(0)
    expect(r.thirtyDayLoop.length).toBe(4)
    expect(r.evidenceNotes.length).toBeGreaterThan(0)
    expect(r.closingMissionPage.insideYou.length).toBeGreaterThan(20)
    expect(r.safetyFooter).toBe(SAFETY_FOOTER)
  })

  it("picks the weakest pathway as the priority and the strongest as strongest", () => {
    // Deliberately lopsided: probiotics is q7–q9, so answering those 0 and the
    // rest 3 makes probiotics unambiguously weakest.
    const answers: Record<string, number> = {}
    for (let i = 1; i <= 15; i++) answers[`q${i}`] = i >= 7 && i <= 9 ? 0 : 3
    const subScores = computeSubScores(answers)
    const overall = computeOverall(subScores)
    const r = buildFoodSystemReport({
      mode: "you",
      subScores,
      overall,
      profile: getProfile(overall, subScores),
    })
    expect(r.systemSnapshot.priorityPathway).toBe("probiotics")
    expect(r.systemSnapshot.strongestPathway).not.toBe("probiotics")
    expect(r.priorityLever.title).toContain("Probiotics")
  })

  it("uses real scores, never invented ones", () => {
    const { subScores, overall, profile } = youResult(2)
    const r = buildFoodSystemReport({ mode: "you", subScores, overall, profile })
    expect(r.bioticScores.prebiotics).toBe(subScores.prebiotics)
    expect(r.bioticScores.probiotics).toBe(subScores.probiotics)
    expect(r.bioticScores.postbiotics).toBe(subScores.postbiotics)
    expect(r.overallScore).toBe(overall)
  })
})

/* ── 2. The closing mission page ─────────────────────────────────────────── */

describe("closing mission page", () => {
  it("carries the required headline, exactly", () => {
    expect(buildYou().closingMissionPage.headlineLines).toEqual([
      "Build the Food System",
      "inside you",
      "- and help build the Food System",
      "around you.",
    ])
  })

  it("rejects a report whose headline has been paraphrased", () => {
    const r = buildYou() as unknown as Record<string, unknown>
    const tampered = {
      ...r,
      closingMissionPage: {
        ...(r.closingMissionPage as Record<string, unknown>),
        headlineLines: [
          "Build the Food System",
          "inside you",
          "and help build the food system", // reworded
          "around you.",
        ],
      },
    }
    expect(parseFoodSystemReport(tampered)).toBeNull()
  })

  it("connects inside to outside", () => {
    const { insideYou, aroundYou } = buildYou().closingMissionPage
    expect(insideYou.toLowerCase()).toContain("inside you")
    expect(aroundYou.toLowerCase()).toMatch(/community|household|country/)
  })
})

/* ── 3. Health language stays non-diagnostic ─────────────────────────────── */

describe("health language", () => {
  // Phrases the brief rules out. Checked across every string the builder emits,
  // for every answer level, because band copy changes with the score.
  const BANNED = [
    /\byou have\b/i,
    /\bthis treats\b/i,
    /\bthis cures\b/i,
    /\bdirectly reduces\b/i,
    /\byou are deficient\b/i,
    /\bproducing too little\b/i,
    /\bwill experience\b/i,
    /\bclinical research consistently shows\b/i,
  ]

  const allStrings = (v: unknown, acc: string[] = []): string[] => {
    if (typeof v === "string") acc.push(v)
    else if (Array.isArray(v)) v.forEach((x) => allStrings(x, acc))
    else if (v && typeof v === "object") Object.values(v).forEach((x) => allStrings(x, acc))
    return acc
  }

  it("uses no diagnostic or deterministic phrasing", () => {
    for (const v of [0, 1, 2, 3]) {
      for (const s of allStrings(buildYou(v))) {
        // The safety footer is exempt and asserted separately: its required
        // wording contains "if you have a medical condition", which is a
        // conditional pointing at a professional, not a claim about the reader.
        if (s === SAFETY_FOOTER) continue
        for (const banned of BANNED) {
          expect(banned.test(s), `answer ${v}: "${s.slice(0, 90)}"`).toBe(false)
        }
      }
    }
  })

  it("frames body signals as clues, not findings", () => {
    for (const node of buildYou().bodySignalMap) {
      expect(node.explanation.toLowerCase()).toMatch(
        /may |associated with|clue|feedback|watching|context/,
      )
    }
  })

  it("cites a real source for every evidence note", () => {
    for (const note of buildYou().evidenceNotes) {
      expect(note.sourceUrl).toMatch(/^https:\/\//)
      expect(note.claim.length).toBeGreaterThan(20)
    }
  })
})

/* ── 4. Merging generated narrative ──────────────────────────────────────── */

describe("mergeGeneratedNarrative", () => {
  const base = buildYou()

  it("returns the base untouched for junk input", () => {
    for (const junk of [null, undefined, "text", 42, []]) {
      expect(mergeGeneratedNarrative(base, junk)).toEqual(base)
    }
  })

  it("takes prose when it is provided", () => {
    const merged = mergeGeneratedNarrative(base, {
      systemSnapshot: { oneLine: "A personalised opening line about their answers." },
      priorityLever: { firstStep: "Add a tablespoon of sauerkraut to lunch." },
    })
    expect(merged.systemSnapshot.oneLine).toBe("A personalised opening line about their answers.")
    expect(merged.priorityLever.firstStep).toBe("Add a tablespoon of sauerkraut to lunch.")
  })

  it("ignores empty or whitespace-only strings rather than blanking a section", () => {
    const merged = mergeGeneratedNarrative(base, {
      systemSnapshot: { oneLine: "   " },
      priorityLever: { title: "" },
    })
    expect(merged.systemSnapshot.oneLine).toBe(base.systemSnapshot.oneLine)
    expect(merged.priorityLever.title).toBe(base.priorityLever.title)
  })

  it("never lets generation overwrite scores or pathway ranking", () => {
    const merged = mergeGeneratedNarrative(base, {
      // A model hallucinating a perfect score, or reversing the ranking.
      overallScore: 100,
      bioticScores: { prebiotics: 100, probiotics: 100, postbiotics: 100 },
      systemSnapshot: {
        priorityPathway: "postbiotics",
        strongestPathway: "postbiotics",
        oneLine: "kept",
      },
    } as never)
    expect(merged.overallScore).toBe(base.overallScore)
    expect(merged.bioticScores).toEqual(base.bioticScores)
    expect(merged.systemSnapshot.priorityPathway).toBe(base.systemSnapshot.priorityPathway)
    expect(merged.systemSnapshot.strongestPathway).toBe(base.systemSnapshot.strongestPathway)
    expect(merged.systemSnapshot.oneLine).toBe("kept")
  })

  it("never lets generation rewrite the safety footer or closing headline", () => {
    const merged = mergeGeneratedNarrative(base, {
      safetyFooter: "This will cure your gut problems.",
      closingMissionPage: { headlineLines: ["Buy", "our", "thing", "now."], insideYou: "kept" },
    } as never)
    expect(merged.safetyFooter).toBe(SAFETY_FOOTER)
    expect(merged.closingMissionPage.headlineLines).toEqual(CLOSING_HEADLINE_LINES)
    expect(merged.closingMissionPage.insideYou).toBe("kept")
  })

  it("derives the visual token for generated foods instead of trusting one", () => {
    const merged = mergeGeneratedNarrative(base, {
      foodTools: [
        {
          food: "Kefir",
          biotic: "probiotics",
          mechanism: "Live cultures that add microbial exposure.",
          // A raw hex here would bypass the AA-safe -text tokens entirely.
          visualToken: { type: "food-group", accent: "#ff0000" },
        },
      ],
    } as never)
    expect(merged.foodTools).toHaveLength(1)
    expect(merged.foodTools[0].visualToken.accent).toBe("teal")
    expect(merged.foodTools[0].visualToken.iconName).toBe("Milk")
  })

  it("drops generated foods missing a name or a mechanism", () => {
    const merged = mergeGeneratedNarrative(base, {
      foodTools: [
        { food: "Oats" }, // no mechanism — teaches nothing
        { mechanism: "Fibre." }, // no name
        { food: "Lentils", biotic: "prebiotics", mechanism: "Fibre and resistant starch." },
      ],
    } as never)
    expect(merged.foodTools).toHaveLength(1)
    expect(merged.foodTools[0].food).toBe("Lentils")
  })

  it("still validates after merging", () => {
    const merged = mergeGeneratedNarrative(base, {
      systemSnapshot: { oneLine: "x".repeat(400) },
      foodTools: [{ food: "Kimchi", biotic: "probiotics", mechanism: "Live cultures." }],
    } as never)
    expect(foodSystemReportSchema.safeParse(merged).success).toBe(true)
  })
})

/* ── 5. Fallback reports carry the educational structure ─────────────────── */

describe("fallback paid report", () => {
  const { subScores, overall, profile } = youResult()

  it.each(["starter", "full", "premium"] as const)(
    "%s tier includes a valid foodSystem block",
    (tier) => {
      const report = buildFallbackPaidReport({
        tier,
        overall,
        subScores,
        profile,
        questions: [],
        answers: {},
      })
      expect(report.foodSystem, tier).toBeDefined()
      expect(foodSystemReportSchema.safeParse(report.foodSystem).success, tier).toBe(true)
      expect(report.foodSystem?.closingMissionPage.headlineLines).toEqual(CLOSING_HEADLINE_LINES)
      expect(report.foodSystem?.safetyFooter).toBe(SAFETY_FOOTER)
    },
  )

  it("carries family mode through when asked", () => {
    const report = buildFallbackPaidReport({
      tier: "full",
      overall,
      subScores,
      profile,
      questions: [],
      answers: {},
      mode: "family",
    })
    expect(report.foodSystem?.mode).toBe("family")
  })

  it("keeps Phase 1's emoji-free food contract intact", () => {
    const report = buildFallbackPaidReport({
      tier: "full",
      overall,
      subScores,
      profile,
      questions: [],
      answers: {},
    }) as { specificFoodList?: Array<Record<string, unknown>>; foodSystem?: { foodTools: unknown[] } }

    for (const food of report.specificFoodList ?? []) {
      expect(food).not.toHaveProperty("emoji")
      expect(food).toHaveProperty("mechanism")
    }
    for (const tool of report.foodSystem?.foodTools ?? []) {
      expect(tool).not.toHaveProperty("emoji")
    }
  })
})

/* ── 6. Validation rejects what it should ────────────────────────────────── */

describe("parseFoodSystemReport", () => {
  it("rejects junk", () => {
    for (const junk of [null, undefined, {}, "text", 42, []]) {
      expect(parseFoodSystemReport(junk)).toBeNull()
    }
  })

  it("rejects an out-of-range score", () => {
    const r = buildYou() as unknown as Record<string, unknown>
    expect(parseFoodSystemReport({ ...r, overallScore: 140 })).toBeNull()
  })

  it("rejects an evidence note without a real URL", () => {
    const r = buildYou() as unknown as Record<string, unknown>
    expect(
      parseFoodSystemReport({
        ...r,
        evidenceNotes: [{ claim: "A claim.", sourceTitle: "Somewhere", sourceUrl: "not-a-url" }],
      }),
    ).toBeNull()
  })

  it("rejects a 30-day loop that is not four weeks", () => {
    const r = buildYou()
    expect(
      parseFoodSystemReport({ ...r, thirtyDayLoop: r.thirtyDayLoop.slice(0, 3) }),
    ).toBeNull()
  })

  it("accepts a report the builder produced", () => {
    expect(parseFoodSystemReport(buildYou())).not.toBeNull()
  })
})

/* ── 7. Report mode resolution ───────────────────────────────────────────
 * The route resolved mode with a repeated `foundationType === "family"`
 * ternary that ignored selectedAddon entirely, so a paid report combining a
 * foundation with an add-on described itself as a plain "you" report. */
describe("resolveReportMode", () => {
  it("calls a foundation with an add-on 'combined'", () => {
    for (const addon of ["stability", "glucose", "mind", "performance"] as const) {
      expect(resolveReportMode({ foundationType: "you", selectedAddon: addon }), addon).toBe(
        "combined",
      )
      // Add-on wins over foundation: a Family + Glucose report covers both.
      expect(resolveReportMode({ foundationType: "family", selectedAddon: addon }), addon).toBe(
        "combined",
      )
    }
  })

  it("never returns 'mind' for a Mind add-on", () => {
    // "mind" is for the standalone Mind assessment, which does not route
    // through the paid deep flow. A Mind add-on sits on a foundation, so
    // labelling it "mind" would drop the foundation from the report's own
    // description of itself.
    expect(resolveReportMode({ foundationType: "you", selectedAddon: "mind" })).toBe("combined")
  })

  it("falls back to foundation when there is no add-on", () => {
    expect(resolveReportMode({ foundationType: "family", selectedAddon: null })).toBe("family")
    expect(resolveReportMode({ foundationType: "you", selectedAddon: null })).toBe("you")
  })

  it("defaults to 'you' when nothing is known", () => {
    expect(resolveReportMode({})).toBe("you")
    expect(resolveReportMode({ foundationType: null, selectedAddon: null })).toBe("you")
  })

  it("produces a mode the schema accepts, for every combination", () => {
    const { subScores, overall, profile } = youResult()
    for (const foundationType of ["you", "family", null] as const) {
      for (const selectedAddon of ["stability", "glucose", "mind", "performance", null] as const) {
        const mode = resolveReportMode({ foundationType, selectedAddon })
        const report = buildFoodSystemReport({ mode, subScores, overall, profile })
        expect(
          foodSystemReportSchema.safeParse(report).success,
          `${foundationType}/${selectedAddon}`,
        ).toBe(true)
      }
    }
  })
})

/* ── 8. Reused reports get the block ─────────────────────────────────────
 * submit-deep-assessment reuses existingRow.report_json verbatim on a retry.
 * Reports persisted before Phase 2 have no foodSystem, so without enrichment
 * they would never gain one — a customer retrying delivery would keep getting
 * the older shape forever. */
describe("ensureFoodSystem", () => {
  const { subScores, overall, profile } = youResult()
  const input = { mode: "you" as const, subScores, overall, profile }

  // Shaped like a persisted report_json row: arbitrary legacy fields plus the
  // optional block. `as never` would collapse the generic and hide the result
  // type, so the fixture is typed properly instead.
  type LegacyRow = Record<string, unknown> & {
    foodSystem?: ReturnType<typeof buildFoodSystemReport>
  }

  it("attaches a valid block to a report that has none", () => {
    const legacy: LegacyRow = { opening: "An older report.", closing: "…" }
    const enriched = ensureFoodSystem(legacy, input)
    expect(enriched.foodSystem).toBeDefined()
    expect(foodSystemReportSchema.safeParse(enriched.foodSystem).success).toBe(true)
  })

  it("preserves the existing report's own fields", () => {
    const legacy: LegacyRow = { opening: "An older report.", topTrigger: "Something specific." }
    const enriched = ensureFoodSystem(legacy, input)
    expect(enriched.opening).toBe("An older report.")
    expect(enriched.topTrigger).toBe("Something specific.")
  })

  it("leaves an existing block untouched rather than regenerating it", () => {
    const existing = buildFoodSystemReport({ ...input, mode: "family" })
    const report: LegacyRow = { opening: "x", foodSystem: existing }
    const result = ensureFoodSystem(report, input)
    // Same object identity: no rebuild, so a reused report keeps whatever
    // narrative it already had.
    expect(result.foodSystem).toBe(existing)
    expect(result.foodSystem?.mode).toBe("family")
  })

  it("carries the resolved mode into the derived block", () => {
    const enriched = ensureFoodSystem({} as LegacyRow, {
      ...input,
      mode: resolveReportMode({ foundationType: "family", selectedAddon: "glucose" }),
    })
    expect(enriched.foodSystem?.mode).toBe("combined")
  })
})
