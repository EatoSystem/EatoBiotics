import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import { asAddon, encodePaidReportSummary, decodePaidReportSummary } from "@/lib/paid-report-session"
import { addonQuestionsFor, lensAnswers, ADDON_QUESTIONS } from "@/lib/assessment/addon-questions"
import { buildAddonLens, ensureAddonLens, mergeGeneratedLens, ADDON_SAFETY } from "@/lib/report/addon-lens"
import { buildFoodSystemReport, resolveReportMode } from "@/lib/report/build-food-system-report"
import { foodSystemReportSchema, type FoodSystemReport } from "@/lib/report/food-system-report-types"
import { FoodSystemSection } from "@/components/report/food-system-section"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import { CLAIMS, DENIAL_BOILERPLATE } from "./helpers/marketing-language"

/**
 * The end-to-end matrix.
 *
 * The other add-on suites test units. This one walks SCENARIOS — the states a
 * real customer record can actually be in — so a gap shows up as a named row
 * rather than being implied across four files.
 */

const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }
const CORE_ANSWERS = { dq1: "core-a", dq2: "core-b" }

const LENS_ANSWERS: Record<AddonType, Record<string, unknown>> = {
  stability: { lens1: "unpredictable", lens2: "stress-linked", lens3: ["none"], lens4: "rarely" },
  glucose: { lens1: "lift-then-dip", lens2: "skipped", lens3: "mid-afternoon", lens4: ["alone"] },
  mind: { lens1: "skipped", lens2: "early-afternoon", lens3: ["none"], lens4: "daily" },
  performance: { lens1: "neither", lens2: "depleted", lens3: ["variable"], lens4: "rarely" },
}

/** The contrasting set, for "same lens, different answers". */
const CONTRAST: Record<AddonType, Record<string, unknown>> = {
  stability: { lens1: "predictable", lens2: "none", lens3: ["veg-variety", "fermented"], lens4: "daily" },
  glucose: { lens1: "steady", lens2: "protein-led", lens3: "no-pattern", lens4: ["veg", "protein"] },
  mind: { lens1: "steady", lens2: "no-pattern", lens3: ["fermented", "oily-fish"], lens4: "rarely" },
  performance: { lens1: "both", lens2: "recovered", lens3: ["protein", "colour"], lens4: "daily" },
}

interface Scenario {
  name: string
  /** What the settled Stripe session says. */
  summary: { foundationType?: "you" | "family" | null; selectedAddon?: unknown }
  /** What the client submitted — may disagree with the summary. */
  submitted?: Record<string, unknown>
  expectAddon: AddonType | null
  expectFamily: boolean
}

const SCENARIOS: Scenario[] = [
  { name: "no add-on", summary: { foundationType: "you", selectedAddon: null }, expectAddon: null, expectFamily: false },
  ...ADDON_KEYS.map((a) => ({
    name: `${a}`,
    summary: { foundationType: "you" as const, selectedAddon: a },
    expectAddon: a,
    expectFamily: false,
  })),
  ...ADDON_KEYS.map((a) => ({
    name: `family + ${a}`,
    summary: { foundationType: "family" as const, selectedAddon: a },
    expectAddon: a,
    expectFamily: true,
  })),
  {
    name: "legacy row: neither foundationType nor selectedAddon",
    summary: {},
    expectAddon: null,
    expectFamily: false,
  },
  {
    name: "unknown add-on on the payment record",
    summary: { foundationType: "you", selectedAddon: "recovery" },
    expectAddon: null,
    expectFamily: false,
  },
  {
    name: "payload tries to change the entitled add-on",
    summary: { foundationType: "you", selectedAddon: "stability" },
    // Client claims glucose and sends glucose's answers.
    submitted: { ...CORE_ANSWERS, ...LENS_ANSWERS.glucose, selectedAddon: "glucose" },
    expectAddon: "stability",
    expectFamily: false,
  },
  {
    name: "lens answers belonging to a different add-on",
    summary: { foundationType: "you", selectedAddon: "mind" },
    submitted: { ...CORE_ANSWERS, foreignKey: "x", lens99: "y" },
    expectAddon: "mind",
    expectFamily: false,
  },
]

/** The server's view: entitlement always comes from the summary. */
function resolve(scenario: Scenario) {
  const addon = asAddon(scenario.summary.selectedAddon)
  const isFamily = scenario.summary.foundationType === "family"
  const submitted = scenario.submitted ?? { ...CORE_ANSWERS, ...(addon ? LENS_ANSWERS[addon] : {}) }
  return { addon, isFamily, submitted, lens: lensAnswers(addon, submitted) }
}

function coreReport(isFamily: boolean, addon: AddonType | null): FoodSystemReport {
  const overall = computeOverall(SUB)
  return buildFoodSystemReport({
    mode: resolveReportMode({ foundationType: isFamily ? "family" : "you", selectedAddon: addon }),
    subScores: SUB,
    overall,
    profile: getProfile(overall, SUB),
  })
}

function fullReport(scenario: Scenario): FoodSystemReport {
  const { addon, isFamily, lens } = resolve(scenario)
  const base = coreReport(isFamily, addon)
  if (!addon) return base
  return { ...base, lens: buildAddonLens({ addon, answers: lens, foodSystem: base, isFamily }) }
}

const webText = (report: FoodSystemReport) =>
  renderToStaticMarkup(createElement(FoodSystemSection, { report }))
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

/* ── 1–3. Entitlement ────────────────────────────────────────────────────── */

describe("entitlement is the settled session, and survives every stage", () => {
  it.each(SCENARIOS.map((s) => [s.name, s] as const))("%s resolves correctly", (_n, scenario) => {
    const { addon, isFamily } = resolve(scenario)
    expect(addon).toBe(scenario.expectAddon)
    expect(isFamily).toBe(scenario.expectFamily)
  })

  it("a tampered payload cannot change the entitled lens", () => {
    const s = SCENARIOS.find((x) => x.name.startsWith("payload tries"))!
    const { addon, lens } = resolve(s)
    expect(addon).toBe("stability")
    // Glucose's answers were submitted; none of them survive the filter,
    // because glucose ids are not stability ids… except where ids overlap by
    // design (lens1..lens4 are per-lens slots), so assert the LENS is right and
    // the report is a Stability one.
    expect(fullReport(s).lens!.key).toBe("stability")
    expect(Object.keys(lens).every((k) => ADDON_QUESTIONS.stability.some((q) => q.id === k))).toBe(true)
  })

  /**
   * The scenario table above models the route's logic; these two guards pin the
   * ROUTE, because a test helper agreeing with itself proves nothing about what
   * ships. Both routes must take the add-on from the settled Stripe summary and
   * never from the request body.
   */
  it("submit-deep-assessment derives entitlement from the session, not the payload", () => {
    const src = readFileSync("app/api/submit-deep-assessment/route.ts", "utf8")
    expect(src).toContain("const entitledAddon = asAddon(freeScores.selectedAddon)")
    // The submitted answers are filtered, never trusted wholesale.
    expect(src).toContain("lensAnswers(entitledAddon, answers)")
    // And no path reads an add-on off the request body.
    expect(src).not.toMatch(/body\.selectedAddon|answers\.selectedAddon/)
  })

  it("generate-deep-questions derives entitlement from the session too", () => {
    const src = readFileSync("app/api/generate-deep-questions/route.ts", "utf8")
    expect(src).toContain("getPaidReportSummaryFromSession(session)")
    expect(src).toContain("entitledAddon = asAddon(summary?.selectedAddon)")
    expect(src).not.toMatch(/body\.selectedAddon/)
  })

  it("foreign answer keys are dropped entirely", () => {
    const s = SCENARIOS.find((x) => x.name.startsWith("lens answers belonging"))!
    expect(resolve(s).lens).toEqual({})
  })

  it("the add-on survives encode → decode → question generation → report", () => {
    for (const addon of ADDON_KEYS) {
      const encoded = encodePaidReportSummary({
        tier: "personal",
        overall: computeOverall(SUB),
        subScores: SUB,
        profile: getProfile(computeOverall(SUB), SUB),
        foundationType: "you",
        selectedAddon: addon,
      })
      const decoded = decodePaidReportSummary(encoded)!
      expect(decoded.selectedAddon).toBe(addon)

      const qs = addonQuestionsFor(asAddon(decoded.selectedAddon))
      expect(qs).toHaveLength(4)

      const report = fullReport({
        name: addon,
        summary: { foundationType: "you", selectedAddon: decoded.selectedAddon },
        expectAddon: addon,
        expectFamily: false,
      })
      expect(report.lens!.key).toBe(addon)
    }
  })
})

/* ── 4–5. Questions ──────────────────────────────────────────────────────── */

describe("question sets", () => {
  it("no add-on, legacy and unknown all leave the core set untouched", () => {
    for (const name of ["no add-on", "legacy row", "unknown add-on"]) {
      const s = SCENARIOS.find((x) => x.name.startsWith(name))!
      expect(addonQuestionsFor(resolve(s).addon), name).toEqual([])
    }
  })

  it.each(ADDON_KEYS)("%s adds exactly its own four questions", (addon) => {
    const qs = addonQuestionsFor(addon)
    expect(qs).toHaveLength(4)
    expect(qs.map((q) => q.id)).toEqual(["lens1", "lens2", "lens3", "lens4"])
    expect(qs.every((q) => q.section === "lens")).toBe(true)
  })
})

/* ── 6–8. Scores and lens content ────────────────────────────────────────── */

describe("core scores and lens content", () => {
  it("identical core answers keep identical Feed/Seed/Heal across every scenario", () => {
    const fingerprints = SCENARIOS.map((s) => JSON.stringify(fullReport(s).bioticScores))
    expect(new Set(fingerprints).size).toBe(1)
  })

  it("the priority pathway is identical across every scenario too", () => {
    const p = SCENARIOS.map((s) => fullReport(s).systemSnapshot.priorityPathway)
    expect(new Set(p).size).toBe(1)
  })

  it("the four add-ons produce distinct lens chapters", () => {
    const summaries = ADDON_KEYS.map(
      (a) => fullReport({ name: a, summary: { selectedAddon: a }, expectAddon: a, expectFamily: false }).lens!.patternSummary,
    )
    expect(new Set(summaries).size).toBe(ADDON_KEYS.length)
  })

  it.each(ADDON_KEYS)("%s: contrasting answers change the answer-linked fields", (addon) => {
    const base = coreReport(false, addon)
    const a = buildAddonLens({ addon, answers: LENS_ANSWERS[addon], foodSystem: base })
    const b = buildAddonLens({ addon, answers: CONTRAST[addon], foodSystem: base })

    expect(a.patternSummary).not.toBe(b.patternSummary)
    expect(JSON.stringify(a.loopAdditions)).not.toBe(JSON.stringify(b.loopAdditions))
    // …and the fixed half does not move.
    expect(a.safetyNote).toBe(b.safetyNote)
    expect(JSON.stringify(a.evidenceNotes)).toBe(JSON.stringify(b.evidenceNotes))
  })
})

/* ── 9. Family ───────────────────────────────────────────────────────────── */

describe("family wording throughout", () => {
  it.each(ADDON_KEYS)("family + %s reads as a household in questions and lens", (addon) => {
    const questions = addonQuestionsFor(addon, "family")
    expect(questions.filter((q) => /household/i.test(q.text)).length).toBeGreaterThanOrEqual(3)

    const s = SCENARIOS.find((x) => x.name === `family + ${addon}`)!
    const report = fullReport(s)
    expect(report.lens!.patternSummary).toMatch(/household/i)
    expect(webText(report)).toMatch(/household/i)
  })

  it("the personal voice does not leak household wording", () => {
    for (const addon of ADDON_KEYS) {
      const s = SCENARIOS.find((x) => x.name === addon)!
      expect(fullReport(s).lens!.patternSummary).not.toMatch(/household/i)
    }
  })
})

/* ── 10–11. Generation safety and validation ─────────────────────────────── */

describe("generated output cannot overwrite what is derived", () => {
  it.each(ADDON_KEYS)("%s", (addon) => {
    const base = buildAddonLens({ addon, answers: LENS_ANSWERS[addon], foodSystem: coreReport(false, addon) })
    const merged = mergeGeneratedLens(base, {
      key: "recovery",
      name: "Renamed",
      priorityConnection: { pathway: "prebiotics", why: "invented" },
      loopAdditions: [{ week: 1, action: "invented action" }],
      safetyNote: "removed",
      evidenceNotes: [],
    })

    expect(merged.key).toBe(addon)
    expect(merged.name).toBe(base.name)
    expect(merged.priorityConnection).toEqual(base.priorityConnection)
    expect(merged.loopAdditions).toEqual(base.loopAdditions)
    expect(merged.safetyNote).toBe(ADDON_SAFETY[addon])
    expect(merged.evidenceNotes).toEqual(base.evidenceNotes)
  })

  it("both the fallback and the merged path produce a valid report", () => {
    for (const addon of ADDON_KEYS) {
      const base = coreReport(false, addon)
      const lens = buildAddonLens({ addon, answers: LENS_ANSWERS[addon], foodSystem: base })

      expect(foodSystemReportSchema.safeParse({ ...base, lens }).success, `${addon} fallback`).toBe(true)

      const merged = mergeGeneratedLens(lens, {
        patternSummary: "A generated summary of ample length to pass the minimum bar.",
      })
      expect(foodSystemReportSchema.safeParse({ ...base, lens: merged }).success, `${addon} merged`).toBe(true)
    }
  })
})

/* ── 12. Parity ──────────────────────────────────────────────────────────── */

describe("web and PDF agree", () => {
  it.each(ADDON_KEYS)("%s: lens fields and evidence appear in both", async (addon) => {
    const report = fullReport({ name: addon, summary: { selectedAddon: addon }, expectAddon: addon, expectFamily: false })
    const React = (await import("react")).default
    const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")

    const strings = (node: unknown, acc: string[] = []): string[] => {
      if (node == null || typeof node === "boolean") return acc
      if (typeof node === "string" || typeof node === "number") return void acc.push(String(node)), acc
      if (Array.isArray(node)) return node.forEach((n) => strings(n, acc)), acc
      const el = node as { type?: unknown; props?: { children?: unknown; src?: unknown } }
      if (el.props?.src) acc.push(String(el.props.src))
      if (el.props?.children !== undefined) strings(el.props.children, acc)
      if (typeof el.type === "function") {
        try {
          strings((el.type as (p: unknown) => unknown)(el.props), acc)
        } catch {
          /* ignore */
        }
      }
      return acc
    }

    const pdf = strings(React.createElement(FoodSystemPages, { report } as never)).join(" ")
    const web = webText(report)
    const lens = report.lens!

    for (const s of [lens.name, lens.patternSummary, lens.safetyNote, ...lens.evidenceNotes.map((n) => n.title)]) {
      expect(web, `web: ${s.slice(0, 40)}`).toContain(s)
      expect(pdf, `pdf: ${s.slice(0, 40)}`).toContain(s)
    }
  })
})

/* ── 13. Hollow and template lenses ──────────────────────────────────────── */

describe("empty, generic and renamed-template lenses fail", () => {
  const base = coreReport(false, "mind")
  const good = buildAddonLens({ addon: "mind", answers: LENS_ANSWERS.mind, foodSystem: base })

  it.each([
    ["empty pattern summary", { ...good, patternSummary: "" }],
    ["no signals", { ...good, signals: [] }],
    ["no actions", { ...good, loopAdditions: [] }],
    ["no evidence", { ...good, evidenceNotes: [] }],
    ["one source only", { ...good, evidenceNotes: [good.evidenceNotes[0]] }],
    ["blank safety", { ...good, safetyNote: "" }],
    ["unknown key", { ...good, key: "recovery" }],
  ])("%s is rejected", (_label, lens) => {
    expect(foodSystemReportSchema.safeParse({ ...base, lens }).success).toBe(false)
  })

  it("four renamed templates would be caught", () => {
    // The real guarantee: strip each lens's own vocabulary and the chapters
    // must still differ.
    const NOUNS = /stability|glucose|mind|performance|digestion|digestive|energy|craving|focus|recovery|activity/gi
    const skeletons = ADDON_KEYS.map((a) => {
      const l = buildAddonLens({ addon: a, answers: LENS_ANSWERS[a], foodSystem: coreReport(false, a) })
      return [l.patternSummary, ...l.loopAdditions.map((x) => x.action)].join(" ").replace(NOUNS, "•")
    })
    expect(new Set(skeletons).size).toBe(ADDON_KEYS.length)
  })
})

/* ── 14. Claims ──────────────────────────────────────────────────────────── */

describe("the real CLAIMS rules pass over every scenario's lens", () => {
  it.each(SCENARIOS.filter((s) => s.expectAddon).map((s) => [s.name, s] as const))("%s", (_n, scenario) => {
    const lens = fullReport(scenario).lens!
    const text = JSON.stringify(lens).replace(DENIAL_BOILERPLATE, " ")
    const hits: string[] = []
    for (const [rule, pattern] of CLAIMS) {
      const m = text.match(pattern)
      if (m) hits.push(`${rule}: "${m[0]}"`)
    }
    expect(hits, hits.join("\n")).toEqual([])
  })
})

/* ── 15–16. Legacy, reuse, mission page ──────────────────────────────────── */

describe("reuse and retry", () => {
  const stored = () => ({ foodSystem: coreReport(false, "stability"), opening: "the stored narrative" })

  it("an existing valid lens is preserved, not rebuilt", () => {
    const lens = buildAddonLens({ addon: "stability", answers: LENS_ANSWERS.stability, foodSystem: coreReport(false, "stability") })
    const report = { foodSystem: { ...coreReport(false, "stability"), lens } }
    const again = ensureAddonLens(report, { addon: "stability", answers: LENS_ANSWERS.stability })
    expect(again.foodSystem!.lens).toBe(lens)
  })

  it("an entitled report missing its lens is enriched deterministically", () => {
    const a = ensureAddonLens(stored(), { addon: "stability", answers: LENS_ANSWERS.stability })
    const b = ensureAddonLens(stored(), { addon: "stability", answers: LENS_ANSWERS.stability })
    expect(a.foodSystem!.lens?.key).toBe("stability")
    expect(JSON.stringify(a.foodSystem!.lens)).toBe(JSON.stringify(b.foodSystem!.lens))
    expect(a.opening).toBe("the stored narrative")
  })

  it("a legacy or no-add-on report gains nothing", () => {
    const legacy = stored()
    expect(ensureAddonLens(legacy, { addon: null, answers: {} })).toBe(legacy)
    expect(ensureAddonLens(legacy, { addon: asAddon("recovery"), answers: {} })).toBe(legacy)
  })

  /**
   * Reuse must not pay for Claude again. ensureAddonLens is synchronous and
   * pulls in nothing from the AI client; the route's reuse branch is asserted
   * separately because that is where a regression would actually appear.
   */
  it("lens enrichment cannot make a network call", () => {
    const src = readFileSync("lib/report/addon-lens.ts", "utf8")
    expect(src).not.toMatch(/@\/lib\/anthropic|fetch\(|await /)
  })

  it("the route's reuse branch makes no Claude call", () => {
    const src = readFileSync("app/api/submit-deep-assessment/route.ts", "utf8")
    const start = src.indexOf("if (existingRow?.report_json)")
    const nextBranch = src.indexOf("} else if (!process.env.ANTHROPIC_API_KEY)", start)
    expect(start).toBeGreaterThan(-1)
    expect(nextBranch).toBeGreaterThan(start)

    const reuseBranch = src.slice(start, nextBranch)
    // Non-trivial slice, or the assertions below would pass on nothing.
    expect(reuseBranch.length).toBeGreaterThan(100)
    expect(reuseBranch).not.toContain("anthropic.messages.create")
    expect(reuseBranch).toContain("ensureAddonLens")
  })
})

describe("legacy reports and the mission page", () => {
  it("a legacy report with no lens still validates", () => {
    const s = SCENARIOS.find((x) => x.name.startsWith("legacy row"))!
    expect(foodSystemReportSchema.safeParse(fullReport(s)).success).toBe(true)
  })

  it.each(SCENARIOS.map((s) => [s.name, s] as const))("%s: the mission page is last", (_n, scenario) => {
    const report = fullReport(scenario)
    const body = webText(report)
    // FoodSystemSection renders chapters; the closing mission page is a
    // separate component rendered after it, so within this section the last
    // thing must be the core evidence chapter, never the lens.
    const lensAt = body.indexOf("Your Focus Area")
    const evidenceAt = body.lastIndexOf("Where This Comes From")
    if (lensAt > -1) expect(evidenceAt).toBeGreaterThan(lensAt)
    expect(report.closingMissionPage.headlineLines).toHaveLength(4)
  })
})
