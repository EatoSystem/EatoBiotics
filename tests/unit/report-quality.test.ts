import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { buildPrompt, normalizeToBiotics } from "@/lib/report/generate-report-prompt"
import { computeSubScores, computeOverall, getProfile } from "@/lib/assessment-scoring"
import { computeResult, contextFromAnswers } from "@/lib/family-assessment-scoring"
import { FAMILY_QUESTIONS, FAMILY_CONTEXT_QUESTIONS } from "@/lib/family-assessment-data"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"

const root = process.cwd()
const read = (p: string) => readFileSync(join(root, p), "utf8")

/**
 * Source with comments stripped. Assertions about what the code *does* must not
 * trip over prose that explains what it used to do — several of these fixes
 * document the bug they removed, and that documentation is worth keeping.
 */
const readCode = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")

/**
 * Guards for the report quality regressions fixed alongside these tests.
 * Each one failed before the fix — they are not decoration.
 */

/* ── 1. The undefined/100 bug ────────────────────────────────────────────
 * The You assessment produces only the 3-Biotics keys, but /api/generate-report
 * used to read five legacy pillars, so every free full report sent Claude five
 * literal "undefined/100" lines. This is the test that would have caught it. */
describe("generate-report prompt", () => {
  // A real result from the real scorer, not a hand-made fixture — the bug lived
  // precisely in the gap between what the scorer emits and what the route read.
  const answers: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) answers[`q${i}`] = 2
  const subScores = computeSubScores(answers)
  const overall = computeOverall(subScores)
  const profile = getProfile(overall, subScores)

  const body = {
    tier: "full" as const,
    overall,
    subScores,
    profile: { type: profile.type, tagline: profile.tagline, description: profile.description },
  }

  it("never interpolates undefined into the prompt", () => {
    const biotics = normalizeToBiotics(subScores)
    expect(biotics).not.toBeNull()
    const prompt = buildPrompt(body, biotics!)
    expect(prompt).not.toContain("undefined")
    expect(prompt).not.toMatch(/undefined\/100/)
  })

  it("includes all three real pathway scores", () => {
    const biotics = normalizeToBiotics(subScores)!
    const prompt = buildPrompt(body, biotics)
    expect(prompt).toContain(`Prebiotics (what feeds their microbes): ${biotics.prebiotics}/100`)
    expect(prompt).toContain(`Probiotics (live-culture exposure): ${biotics.probiotics}/100`)
    expect(prompt).toContain(`Postbiotics (recovery, rhythm, resilience): ${biotics.postbiotics}/100`)
  })

  it("names a real pathway as weakest, never a legacy pillar", () => {
    const prompt = buildPrompt(body, normalizeToBiotics(subScores)!)
    expect(prompt).toMatch(/Weakest pathway: (Prebiotics|Probiotics|Postbiotics) \(\d+\/100\)/)
    for (const legacy of ["Diversity Score", "Feeding Score", "Adding Score", "Feeling Score"]) {
      expect(prompt).not.toContain(legacy)
    }
  })

  it("accepts the feed/seed/heal aliases", () => {
    expect(normalizeToBiotics({ feed: 60, seed: 40, heal: 50 })).toEqual({
      prebiotics: 60,
      probiotics: 40,
      postbiotics: 50,
    })
  })

  it("fails closed when a pathway score is missing", () => {
    // The exact shape that used to produce "undefined/100".
    expect(normalizeToBiotics({ diversity: 50, feeding: 60 })).toBeNull()
    expect(normalizeToBiotics({})).toBeNull()
    expect(normalizeToBiotics({ prebiotics: 50, probiotics: 40 })).toBeNull()
  })
})

/* ── 2. No emoji in the report data contract ─────────────────────────── */
describe("report schemas carry no emoji", () => {
  const contractFiles = [
    "lib/claude-report.ts",
    "lib/assessment-report.ts",
    "lib/fallback-paid-report.ts",
    "app/api/submit-deep-assessment/route.ts",
    "lib/report/generate-report-prompt.ts",
  ]

  // Matches `emoji:`, `emoji?:`, `"emoji":` and `.emoji` — the field, not the
  // word. Prose mentioning emoji is fine and is how the fix documents itself.
  const EMOJI_FIELD = /(^|[^\w.])emoji\s*\??\s*:|"emoji"\s*:|\.emoji\b/m

  it.each(contractFiles)("%s declares no emoji field", (file) => {
    expect(read(file)).not.toMatch(EMOJI_FIELD)
  })

  it("the deep-assessment prompt asks for biotic and mechanism instead", () => {
    const src = read("app/api/submit-deep-assessment/route.ts")
    expect(src).toContain('"biotic"')
    expect(src).toContain('"mechanism"')
    expect(src).toContain("Never output emoji")
  })

  it("the fallback report satisfies the same contract", () => {
    const report = buildFallbackPaidReport({
      tier: "full",
      overall: 62,
      subScores: computeSubScores({}),
      profile: { type: "Emerging Balance", tagline: "t", description: "d" },
      answers: {},
      questions: [],
    } as never) as { specificFoodList?: Array<Record<string, unknown>> }

    expect(report.specificFoodList?.length).toBeGreaterThan(0)
    for (const food of report.specificFoodList ?? []) {
      expect(food).not.toHaveProperty("emoji")
      expect(food).toHaveProperty("biotic")
      expect(food).toHaveProperty("mechanism")
      expect(String(food.mechanism).length).toBeGreaterThan(10)
    }
  })
})

/* ── 3. No pictographs on live report / assessment-result surfaces ───── */
describe("live report surfaces render no emoji", () => {
  const surfaces = [
    "components/assessment/assessment-results.tsx",
    "components/assessment/full-report-client.tsx",
    "components/assessment/paid-report-client.tsx",
    "components/assessment/report-starter.tsx",
    "components/assessment/report-premium-addons.tsx",
    "components/family-assessment/family-assessment-results.tsx",
    "components/mind-assessment/mind-assessment-results.tsx",
    "lib/pdf/report-pdf.tsx",
    // Renders inside all three results surfaces, so it counts as one.
    "components/assessment/save-results-card.tsx",
  ]

  // Deliberately NOT in this list: the public sample reports (/report-you,
  // /report-mind, /report-family, components/report/demo-report.tsx) and
  // lib/foods.ts. lib/foods.ts is shared with the food directory, /today,
  // myplate and the condition pages — report surfaces read it through
  // bioticFromFoodType rather than rendering its emoji.
  const PICTOGRAPH = /\p{Extended_Pictographic}/u

  it.each(surfaces)("%s has no pictographic characters", (file) => {
    const src = read(file)
    const offending = src
      .split("\n")
      .map((line, i) => [i + 1, line] as const)
      .filter(([, line]) => PICTOGRAPH.test(line))
    expect(offending).toEqual([])
  })

  it.each(surfaces)("%s does not render a .emoji property", (file) => {
    expect(read(file)).not.toMatch(/\.emoji\b/)
  })
})

/* ── 4. The paid PDF actually renders ─────────────────────────────────
 * It did not. `Helvetica-Bold` + fontStyle "italic" is unresolvable against
 * react-pdf's base-14 built-ins, so every paid PDF threw during render;
 * submit-deep-assessment caught it and marked pdf_status "failed", which meant
 * the failure was invisible — the report shipped with no PDF attached.
 * Rendering all three tiers is the only assertion that would have caught it. */
describe("paid PDF renders", () => {
  const answers: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) answers[`q${i}`] = 2
  const subScores = computeSubScores(answers)
  const overall = computeOverall(subScores)
  const profile = getProfile(overall, subScores)

  it.each(["starter", "full", "premium"] as const)(
    "%s tier produces a valid PDF",
    async (tier) => {
      const { generatePDF } = await import("@/lib/pdf/generate-pdf")
      const report = buildFallbackPaidReport({
        tier,
        overall,
        subScores,
        profile,
        answers: {},
        questions: [],
      } as never)
      const buf = await generatePDF({
        tier,
        leadName: "Test",
        generatedAt: new Date().toISOString(),
        freeScores: { overall, subScores, profile },
        report,
      } as never)
      expect(buf.subarray(0, 5).toString()).toBe("%PDF-")
      expect(buf.length).toBeGreaterThan(5000)
    },
    30_000,
  )
})

/* ── 5. Family context reaches scoring ───────────────────────────────── */
describe("family household context", () => {
  it("is presented in the assessment flow", () => {
    const src = read("components/family-assessment/family-assessment-client.tsx")
    expect(src).toContain("FAMILY_CONTEXT_QUESTIONS")
    // Asked, not just imported: the context questions must be in the list the
    // flow walks, and the result must be computed with the derived context.
    expect(src).toContain("ALL_FAMILY_QUESTIONS")
    expect(src).toContain("contextFromAnswers(answers)")
    expect(src).not.toMatch(/computeResult\(answers\)/)
  })

  it("maps every context question id onto FamilyContext", () => {
    const answers: Record<string, number> = {}
    for (const q of FAMILY_CONTEXT_QUESTIONS) answers[q.id] = 0
    const context = contextFromAnswers(answers)
    // Every ctx_ question must land somewhere, or the answer is silently lost.
    expect(Object.values(context).filter((v) => v !== undefined)).toHaveLength(
      FAMILY_CONTEXT_QUESTIONS.length,
    )
  })

  it("produces context tips that generic scoring cannot", () => {
    const scored: Record<string, number> = {}
    for (const q of FAMILY_QUESTIONS) scored[q.id] = 2

    const withoutContext = computeResult(scored)
    expect(withoutContext.contextTips).toEqual([])

    // Picky eaters, little cooking time and school meals — the constraints the
    // tips exist to address.
    const withContext = computeResult(scored, {
      pickyEating: 0,
      cookingTime: 0,
      schoolMeals: 0,
    })
    expect(withContext.contextTips.length).toBeGreaterThan(0)
  })

  it("context never changes the score", () => {
    const scored: Record<string, number> = {}
    for (const q of FAMILY_QUESTIONS) scored[q.id] = 2
    const plain = computeResult(scored)
    const shaped = computeResult(scored, { pickyEating: 0, budget: 0, cookingTime: 0 })
    expect(shaped.overall).toBe(plain.overall)
    expect(shaped.subScores).toEqual(plain.subScores)
  })
})

/* ── 6. Legacy pillar keys must not reach report surfaces ─────────────
 * Phase 1 fixed this in /api/generate-report but the same mistake existed in
 * two more places. Both are the same root cause: code keyed on the five legacy
 * pillars that the You assessment stopped producing. */
describe("no surface is still keyed on the legacy five pillars", () => {
  const youAnswers: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) youAnswers[`q${i}`] = 2
  const youScores = computeSubScores(youAnswers)

  const familyAnswers: Record<string, number> = {}
  for (const q of FAMILY_QUESTIONS) familyAnswers[q.id] = 2
  const familyScores = computeResult(familyAnswers).subScores

  it("normalizes both flows to three real pathways", async () => {
    const { normalizeToBiotics } = await import("@/lib/report/subscores")
    for (const [name, scores] of [
      ["you", youScores],
      ["family", familyScores],
    ] as const) {
      const biotics = normalizeToBiotics(scores)
      expect(biotics, name).not.toBeNull()
      for (const v of Object.values(biotics!)) {
        expect(Number.isFinite(v), name).toBe(true)
      }
    }
  })

  it("the paid PDF score panel labels every row, for both flows", async () => {
    // Walks the rendered element tree rather than grepping source or the PDF
    // bytes: react-pdf hex-encodes text with subset fonts, so searching the
    // output for "Prebiotics" always misses and would pass a broken panel.
    const React = (await import("react")).default
    const { ReportPDF } = await import("@/lib/pdf/report-pdf")

    const strings = (node: unknown, acc: string[] = []): string[] => {
      if (node == null || typeof node === "boolean") return acc
      if (typeof node === "string" || typeof node === "number") {
        acc.push(String(node))
        return acc
      }
      if (Array.isArray(node)) {
        node.forEach((n) => strings(n, acc))
        return acc
      }
      const el = node as { type?: unknown; props?: { children?: unknown } }
      if (el.props?.children !== undefined) strings(el.props.children, acc)
      if (typeof el.type === "function") {
        try {
          strings((el.type as (p: unknown) => unknown)(el.props), acc)
        } catch {
          /* component needs a render context; its children are covered above */
        }
      }
      return acc
    }

    for (const [flow, sub] of [
      ["you", youScores],
      ["family", familyScores],
    ] as const) {
      const overall = computeOverall(sub)
      const profile = getProfile(overall, sub)
      const report = buildFallbackPaidReport({
        tier: "starter",
        overall,
        subScores: sub,
        profile,
        answers: {},
        questions: [],
      } as never)
      const rendered = strings(
        React.createElement(ReportPDF, {
          tier: "starter",
          leadName: "T",
          generatedAt: "1 Aug",
          freeScores: { overall, subScores: sub, profile },
          report,
        } as never),
      )

      expect(rendered, flow).toContain("Your 3 Biotics")
      expect(rendered, flow).toContain("Prebiotics")
      expect(rendered, flow).toContain("Probiotics")
      expect(rendered, flow).toContain("Postbiotics")
      expect(rendered, flow).not.toContain("Your 5 Pillars")
      // The symptom of the bug: rows whose label resolved to undefined.
      expect(rendered.some((v) => v.includes("undefined")), flow).toBe(false)
    }
  })

  it("the paid PDF source no longer keys on legacy pillars", async () => {
    // The panel used to Object.entries() the raw sub-scores and look each key up
    // in maps covering only the legacy five. You-flow data has six keys, none of
    // them present, so it rendered six rows with undefined label and colour
    // under a heading reading "Your 5 Pillars".
    const src = readCode("lib/pdf/report-pdf.tsx")
    expect(src).not.toContain("Your 5 Pillars")
    expect(src).not.toMatch(/Object\.entries\(subScores\)/)
    // Labels must come from the shared pathway map, not a local legacy one.
    expect(src).not.toMatch(/PILLAR_LABELS\s*[:=]/)
    expect(src).toContain("normalizeToBiotics")
  })

  it("food swaps differ by pathway instead of always returning 'feeding'", async () => {
    // deepDives[0].pillar is always feed | seed | heal, but FOOD_SWAPS was keyed
    // diversity | feeding | adding | consistency | feeling, so the lookup never
    // hit and the ?? FOOD_SWAPS.feeding fallback fired on every single request.
    const { swapsForPathway, FOOD_SWAP_KEYS_FOR_PATHWAY } = await import(
      "@/lib/report/food-swaps"
    )
    const feed = swapsForPathway("feed")
    const seed = swapsForPathway("seed")
    const heal = swapsForPathway("heal")

    for (const [name, set] of [["feed", feed], ["seed", seed], ["heal", heal]] as const) {
      expect(set.length, name).toBeGreaterThan(0)
    }
    // The assertion that fails on 4f5b482: all three were identical.
    expect(feed).not.toEqual(seed)
    expect(seed).not.toEqual(heal)
    expect(feed).not.toEqual(heal)

    // Canonical names resolve the same as the aliases.
    expect(swapsForPathway("prebiotics")).toEqual(feed)
    expect(swapsForPathway("probiotics")).toEqual(seed)
    expect(swapsForPathway("postbiotics")).toEqual(heal)

    // Every authored swap set stays reachable — 20 of 25 were dead before.
    const reachable = new Set<string>(Object.values(FOOD_SWAP_KEYS_FOR_PATHWAY).flat())
    for (const key of ["diversity", "feeding", "adding", "consistency", "feeling"]) {
      expect(reachable.has(key), key).toBe(true)
    }
  })
})

/**
 * Phase 5 — the educational Food System chapters in the live paid PDF.
 *
 * The live path is app/api/submit-deep-assessment -> lib/pdf/generate-pdf.ts ->
 * lib/pdf/report-pdf.tsx. `/api/report-pdf` and components/report/report-pdf.tsx
 * are a separate prototype with no caller and are deliberately untouched.
 *
 * These assertions walk the rendered element tree and render real PDFs. They do
 * NOT search the PDF bytes for text: once brand fonts are registered react-pdf
 * subsets them and hex-encodes the strings, so a byte search silently misses and
 * would pass a report that rendered nothing.
 */
describe("paid PDF: Food System chapters", () => {
  /** Every string in a React element tree, evaluating function components. */
  const strings = (node: unknown, acc: string[] = []): string[] => {
    if (node == null || typeof node === "boolean") return acc
    if (typeof node === "string" || typeof node === "number") {
      acc.push(String(node))
      return acc
    }
    if (Array.isArray(node)) {
      node.forEach((n) => strings(n, acc))
      return acc
    }
    const el = node as { type?: unknown; props?: { children?: unknown } }
    if (el.props?.children !== undefined) strings(el.props.children, acc)
    if (typeof el.type === "function") {
      try {
        strings((el.type as (p: unknown) => unknown)(el.props), acc)
      } catch {
        /* needs a render context; children are covered above */
      }
    }
    return acc
  }

  async function fixture(withFoodSystem = true) {
    const answers: Record<string, number> = {}
    for (let i = 1; i <= 15; i++) answers[`q${i}`] = i % 3
    const subScores = computeSubScores(answers)
    const overall = computeOverall(subScores)
    const profile = getProfile(overall, subScores)
    const report = buildFallbackPaidReport({
      tier: "premium",
      overall,
      subScores,
      profile,
      questions: [],
      answers: {},
    } as never)
    if (!withFoodSystem) delete (report as { foodSystem?: unknown }).foodSystem
    return { report, freeScores: { overall, subScores, profile } }
  }

  async function tree(withFoodSystem = true) {
    const React = (await import("react")).default
    const { ReportPDF } = await import("@/lib/pdf/report-pdf")
    const { report, freeScores } = await fixture(withFoodSystem)
    return strings(
      React.createElement(ReportPDF, {
        tier: "premium",
        leadName: "T",
        generatedAt: "2 Aug",
        freeScores,
        report,
      } as never),
    )
  }

  it("registers the brand fonts, so these tests exercise the real path", async () => {
    const { fontsRegistered, FONT } = await import("@/lib/pdf/pdf-fonts")
    // If this ever goes false the fallback is being tested instead, and the
    // brand typography would be silently absent from production PDFs.
    expect(fontsRegistered).toBe(true)
    expect(FONT.serif).toBe("Lora")
    expect(FONT.sans).toBe("DMSans")
  })

  it("never synthesises an italic from a family that has none", async () => {
    // The Phase 1 outage: `fontStyle: "italic"` on a family with only a normal
    // face throws and fails the entire render. Registering real fonts re-arms
    // that trap, so no style may set fontStyle at all — italics come from a
    // dedicated family.
    for (const f of ["lib/pdf/report-pdf.tsx", "lib/pdf/food-system-pdf.tsx"]) {
      expect(readCode(f), f).not.toContain("fontStyle")
    }
  })

  it("renders every Food System chapter into the document", async () => {
    const rendered = await tree()
    const joined = rendered.join(" | ")

    const { report } = await fixture()
    const fs = report.foodSystem!

    expect(joined).toContain(fs.title)
    expect(joined).toContain(fs.systemSnapshot.oneLine)
    expect(joined).toContain(fs.systemSnapshot.dominantPattern)
    expect(joined).toContain(fs.systemSnapshot.mainLever)

    for (const mod of fs.educationModules) {
      expect(joined).toContain(mod.title)
      expect(joined).toContain(mod.plainEnglish)
      expect(joined).toContain(mod.whatYourAnswersSuggest)
    }
    for (const node of [...fs.foodSystemMap, ...fs.bodySignalMap]) {
      expect(joined).toContain(node.label)
      expect(joined).toContain(node.explanation)
    }
    expect(joined).toContain(fs.priorityLever.title)
    expect(joined).toContain(fs.priorityLever.firstStep)
    for (const tool of fs.foodTools) {
      expect(joined).toContain(tool.food)
      expect(joined).toContain(tool.mechanism)
    }
    expect(fs.thirtyDayLoop).toHaveLength(4)
    for (const week of fs.thirtyDayLoop) {
      expect(joined).toContain(week.focus)
      expect(joined).toContain(week.action)
    }
    for (const note of fs.evidenceNotes) {
      expect(joined).toContain(note.claim)
      expect(joined).toContain(note.sourceTitle)
    }
    for (const line of fs.closingMissionPage.headlineLines) {
      expect(rendered).toContain(line)
    }
    expect(joined).toContain(fs.closingMissionPage.insideYou)
    expect(joined).toContain(fs.safetyFooter)

    // States are words in print too — colour and ring position carry nothing on
    // paper, and nothing at all in monochrome.
    expect(
      ["Well supported", "Building", "Room to grow", "Not enough to say"].some((w) =>
        joined.includes(w),
      ),
    ).toBe(true)

    // The inside-out levels are spelled out; the rings alone say nothing.
    for (const level of ["You", "Family", "Community", "County", "Country"]) {
      expect(joined).toContain(level)
    }
  })

  it("leaves a report without a foodSystem block exactly as it was", async () => {
    const legacy = (await tree(false)).join(" | ")
    const { report } = await fixture()
    const fs = report.foodSystem!

    for (const marker of [
      fs.title,
      "Your 3-Biotics Engine",
      "Your Priority Lever",
      "Where This Comes From",
      fs.safetyFooter,
      ...fs.closingMissionPage.headlineLines,
    ]) {
      expect(legacy).not.toContain(marker)
    }

    // …while every legacy section still renders.
    for (const heading of [
      "Your Assessment",
      "Your Top Trigger",
      "Your Deep Insight",
      "Closing Thoughts",
      "Your Priority Map",
    ]) {
      expect(legacy).toContain(heading)
    }
  })

  it("produces a valid PDF for every tier, with and without the block", async () => {
    const { generatePDF } = await import("@/lib/pdf/generate-pdf")
    const { freeScores } = await fixture()

    let withBlockBytes = 0
    for (const tier of ["starter", "full", "premium"] as const) {
      const { report } = await fixture()
      const buf = await generatePDF({
        tier,
        leadName: "T",
        generatedAt: "2 Aug",
        freeScores,
        report,
      } as never)
      expect(buf.subarray(0, 5).toString(), tier).toBe("%PDF-")
      if (tier === "premium") withBlockBytes = buf.length
    }

    const { report: legacy } = await fixture(false)
    const legacyBuf = await generatePDF({
      tier: "premium",
      leadName: "T",
      generatedAt: "2 Aug",
      freeScores,
      report: legacy,
    } as never)
    expect(legacyBuf.subarray(0, 5).toString()).toBe("%PDF-")

    // The block adds pages rather than replacing them: a real render, not just
    // an element tree, so a layout-time throw would fail here.
    expect(withBlockBytes).toBeGreaterThan(legacyBuf.length)
  }, 120_000)
})
