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
