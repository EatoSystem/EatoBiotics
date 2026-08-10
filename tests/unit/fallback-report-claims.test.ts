import { describe, it, expect } from "vitest"

import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { CLAIMS, DENIAL_BOILERPLATE } from "./helpers/marketing-language"
import type { DeepPremiumReport } from "@/lib/claude-report"

/**
 * Permanent safety guard for the DETERMINISTIC FALLBACK REPORT.
 *
 * ── Why this file exists ─────────────────────────────────────────────────────
 *
 * The marketing corpus guard (marketing-language-corpus.test.ts) walks
 * `app/**\/page.tsx` plus three named components. It has never walked `lib/`,
 * so the copy in lib/fallback-paid-report.ts — which is what a paying customer
 * actually reads whenever Claude generation fails or is skipped
 * (app/api/submit-deep-assessment/route.ts, the no-API-key and catch branches) —
 * was covered by no health-claims rule at all. The PR #216 review found that
 * gap, and found a live `promise`-rule hit sitting in it ("Your food system
 * *will respond* best to rhythm").
 *
 * Adding all of `lib/` to MARKETING_COMPONENTS would be the wrong fix: most of
 * lib/ is code, and the rules were tuned against customer prose. A guard that
 * cries wolf gets deleted — the same argument the corpus file makes for
 * excluding legal and transactional routes.
 *
 * So this guard is narrow and behavioural instead of source-scanning: it BUILDS
 * the real reports through the real builder and runs the real exported CLAIMS
 * rules over the strings those reports actually contain. Source formatting,
 * template interpolation and branch selection are all exercised, which a regex
 * over the source file could not do — a claim assembled from two template
 * fragments would be invisible to a source scan and is caught here.
 *
 * ── What it covers ───────────────────────────────────────────────────────────
 *
 * All four framings the builder can produce, including the adversarial
 * strong-overall/strained-pathway profile that motivated `Framing`.
 */

const PROFILE = { type: "Emerging Balance", tagline: "t", description: "d" }

const PROFILES = {
  strong: { overall: 98, subScores: { prebiotics: 95, probiotics: 99, postbiotics: 100 } },
  mixed: { overall: 60, subScores: { prebiotics: 70, probiotics: 40, postbiotics: 70 } },
  earlyStage: { overall: 20, subScores: { prebiotics: 30, probiotics: 25, postbiotics: 10 } },
  /** Strong overall, one strained pathway — the `mixed` framing. */
  strongWithStrained: { overall: 72, subScores: { prebiotics: 85, probiotics: 20, postbiotics: 85 } },
} as const

type ProfileName = keyof typeof PROFILES

function reportFor(name: ProfileName): DeepPremiumReport {
  const p = PROFILES[name]
  return buildFallbackPaidReport({
    tier: "premium",
    overall: p.overall,
    subScores: p.subScores,
    profile: PROFILE,
    questions: [],
    answers: {},
  }) as DeepPremiumReport
}

const NAMES = Object.keys(PROFILES) as ProfileName[]

/**
 * The narrative and action fields a customer reads. Listed explicitly rather
 * than walked, so that DELETING a field from the builder fails this test
 * instead of silently shrinking what is checked.
 */
const REQUIRED_STRING_FIELDS = [
  "opening",
  "scoreInterpretation",
  "closing",
  "deepInsight",
  "topTrigger",
  "topTriggerExplanation",
  "membershipBridge",
  "habitAnalysis",
  "rhythmInsight",
  "energyBreakdown",
  "lifestyleConnection",
  "systemInterpretation",
  "systemStory",
  "gutDiagnosticSummary",
  "symptomPattern",
] as const

const REQUIRED_STRING_ARRAYS = [
  "strengths",
  "strengthExplanations",
  "opportunities",
  "opportunityExplanations",
] as const

/** Every customer-visible string in a report, however deeply nested. */
function allStrings(value: unknown, acc: string[] = []): string[] {
  if (typeof value === "string") acc.push(value)
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, acc))
  else if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((v) => allStrings(v, acc))
  }
  return acc
}

/**
 * Report text prepared for the CLAIMS rules.
 *
 * DENIAL_BOILERPLATE is stripped for exactly the reason the corpus guard strips
 * it: the fixed "diagnose, treat, cure, or prevent" formula is a DENIAL, and
 * flagging it would push an author to delete the safest sentence in the report.
 * Nothing else is stripped — this is prose, not source, so there are no
 * comments, classNames or method calls to remove.
 */
function claimsText(report: DeepPremiumReport): string {
  return allStrings(report).join("\n").replace(DENIAL_BOILERPLATE, " ")
}

describe("fallback report: completeness", () => {
  it.each(NAMES)("%s — every required narrative field is present and substantial", (name) => {
    const report = reportFor(name)

    for (const field of REQUIRED_STRING_FIELDS) {
      const value = report[field]
      expect(typeof value, `${name}.${field}`).toBe("string")
      expect(String(value).trim().length, `${name}.${field}`).toBeGreaterThan(20)
    }

    for (const field of REQUIRED_STRING_ARRAYS) {
      const value = report[field]
      expect(Array.isArray(value), `${name}.${field}`).toBe(true)
      expect(value.length, `${name}.${field}`).toBeGreaterThanOrEqual(3)
      for (const [i, entry] of value.entries()) {
        expect(String(entry).trim().length, `${name}.${field}[${i}]`).toBeGreaterThan(3)
      }
    }
  })

  it.each(NAMES)("%s — every action list is populated", (name) => {
    const report = reportFor(name)

    expect(report.sevenDayPlan).toHaveLength(7)
    for (const day of report.sevenDayPlan) {
      expect(day.day.trim().length, `${name} sevenDayPlan.day`).toBeGreaterThan(2)
      expect(day.action.trim().length, `${name} ${day.day}`).toBeGreaterThan(20)
    }

    expect(report.thirtyDayRoadmap).toHaveLength(4)
    for (const week of report.thirtyDayRoadmap) {
      expect(week.focus.trim().length, `${name} week ${week.week} focus`).toBeGreaterThan(3)
      expect(week.theme.trim().length, `${name} week ${week.week} theme`).toBeGreaterThan(3)
      expect(week.actions.length, `${name} week ${week.week} actions`).toBeGreaterThanOrEqual(3)
      for (const action of week.actions) {
        expect(action.trim().length, `${name} week ${week.week}`).toBeGreaterThan(10)
      }
    }

    expect(report.phasedStrategy).toHaveLength(3)
    for (const phase of report.phasedStrategy) {
      expect(phase.milestone.trim().length, `${name} ${phase.phase}`).toBeGreaterThan(10)
      expect(phase.actions.length, `${name} ${phase.phase}`).toBeGreaterThanOrEqual(3)
    }

    expect(report.specificFoodList).toHaveLength(5)
  })

  /**
   * A floor on the total, so a refactor that quietly collapses the report into
   * a handful of shared sentences fails here even if every named field above
   * still technically exists. Measured at ~150 strings per report today; 100 is
   * a deliberately loose floor that only trips on real collapse.
   */
  it.each(NAMES)("%s — carries a substantial number of distinct strings", (name) => {
    const strings = allStrings(reportFor(name)).filter((s) => s.trim().length > 15)
    expect(strings.length, `${name} string count`).toBeGreaterThan(100)
    expect(new Set(strings).size, `${name} distinct strings`).toBeGreaterThan(80)
  })
})

describe("fallback report: the real CLAIMS rules pass over generated content", () => {
  it("has rules to run", () => {
    // Guards the import: an empty CLAIMS array would make every assertion below
    // pass on nothing.
    expect(CLAIMS.length).toBeGreaterThan(15)
  })

  it.each(NAMES)("%s — no health-claim rule fires", (name) => {
    const text = claimsText(reportFor(name))
    expect(text.length, `${name} produced no text`).toBeGreaterThan(2_000)

    const hits: string[] = []
    for (const [rule, pattern] of CLAIMS) {
      const match = text.match(pattern)
      if (match) hits.push(`${rule}: "${match[0]}"`)
    }
    expect(hits, `${name} claim hits:\n${hits.join("\n")}`).toEqual([])
  })
})
