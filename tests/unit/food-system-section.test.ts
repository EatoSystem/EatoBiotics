import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import {
  FoodSystemSection,
  FoodSystemClosing,
} from "@/components/report/food-system-section"
import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import {
  CLOSING_HEADLINE_LINES,
  SAFETY_FOOTER,
  type FoodSystemReport,
} from "@/lib/report/food-system-report-types"
import { computeSubScores, computeOverall, getProfile } from "@/lib/assessment-scoring"
import { PATHWAY_LABEL } from "@/lib/report/subscores"
import { MISSION } from "@/lib/mission-content"
import type { DeepReport } from "@/lib/claude-report"

/** The pre-Phase-2 disclaimer, kept only for reports without a foodSystem block. */
const LEGACY_DISCLAIMER =
  "This report is for educational purposes and is not medical advice or a diagnosis."

/**
 * Phase 3 renders the educational foodSystem block in the paid web report.
 *
 * These assertions exist for two different reasons, and the second matters more:
 *
 *  1. The new sections actually show the data (rather than dropping fields
 *     silently, which is easy to do with a schema this wide).
 *  2. A report WITHOUT a foodSystem block still renders the report customers
 *     have today. Reports persisted before Phase 2 do not carry one, so that
 *     path is live, not hypothetical.
 *
 * The test env is `environment: "node"` with no jsdom, so these render to static
 * markup rather than mounting — same approach as the PDF assertions in
 * tests/unit/report-quality.test.ts.
 */

/* ── Fixtures from the real scorers and builders ─────────────────────────── */

function youResult(answerValue = 2) {
  const answers: Record<string, number> = {}
  for (let i = 1; i <= 15; i++) answers[`q${i}`] = answerValue
  const subScores = computeSubScores(answers)
  const overall = computeOverall(subScores)
  return { subScores, overall, profile: getProfile(overall, subScores) }
}

function youReport(answerValue = 2): FoodSystemReport {
  const { subScores, overall, profile } = youResult(answerValue)
  return buildFoodSystemReport({ mode: "you", subScores, overall, profile })
}

function paidReport(): DeepReport {
  const { subScores, overall, profile } = youResult()
  return buildFallbackPaidReport({
    tier: "premium",
    overall,
    subScores,
    profile,
    questions: [],
    answers: {},
  })
}

function renderSection(report: FoodSystemReport): string {
  return renderToStaticMarkup(createElement(FoodSystemSection, { report }))
}

function renderClosing(report: FoodSystemReport): string {
  return renderToStaticMarkup(createElement(FoodSystemClosing, { report }))
}

function renderPaid(reportJson: DeepReport): string {
  return renderToStaticMarkup(
    createElement(PaidReportClient, {
      tier: "premium" as const,
      sessionId: "cs_test_phase3",
      reportJson,
    }),
  )
}

/** Entity-decodes so assertions can be written against the real copy. */
function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
}

/* ── The block renders its data ──────────────────────────────────────────── */

describe("FoodSystemSection", () => {
  it("renders every education module, in full", () => {
    const report = youReport()
    const body = text(renderSection(report))

    expect(report.educationModules.length).toBeGreaterThan(0)
    for (const mod of report.educationModules) {
      expect(body).toContain(mod.title)
      expect(body).toContain(mod.plainEnglish)
      expect(body).toContain(mod.whyItMatters)
      expect(body).toContain(mod.whatYourAnswersSuggest)
      expect(body).toContain(mod.actionBridge)
    }
  })

  it("renders the snapshot, the three pathway scores and the priority lever", () => {
    const report = youReport()
    const body = text(renderSection(report))

    expect(body).toContain(report.systemSnapshot.oneLine)
    expect(body).toContain(report.systemSnapshot.dominantPattern)
    expect(body).toContain(report.systemSnapshot.mainLever)

    for (const label of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(body).toContain(label)
    }

    expect(body).toContain(report.priorityLever.title)
    expect(body).toContain(report.priorityLever.whyThisFirst)
    expect(body).toContain(report.priorityLever.firstStep)
    expect(body).toContain(report.priorityLever.whatToNotice)
  })

  it("renders both node maps with a written state, never colour alone", () => {
    const report = youReport()
    const body = text(renderSection(report))

    for (const node of [...report.foodSystemMap, ...report.bodySignalMap]) {
      expect(body).toContain(node.label)
      expect(body).toContain(node.explanation)
    }

    // Every node's state must reach the reader as words. A coloured dot alone
    // fails WCAG 1.4.1 and disappears entirely in print.
    const stateWords = ["Well supported", "Building", "Room to grow", "Not enough to say"]
    for (const node of report.foodSystemMap) {
      expect(stateWords.some((w) => body.includes(w))).toBe(true)
      expect(node.state).toBeTruthy()
    }
  })

  it("renders all four loop weeks and every food tool", () => {
    const report = youReport()
    const body = text(renderSection(report))

    expect(report.thirtyDayLoop).toHaveLength(4)
    for (const week of report.thirtyDayLoop) {
      expect(body).toContain(week.focus)
      expect(body).toContain(week.action)
      expect(body).toContain(week.why)
    }

    expect(report.foodTools.length).toBeGreaterThan(0)
    for (const tool of report.foodTools) {
      expect(body).toContain(tool.food)
      expect(body).toContain(tool.mechanism)
      expect(body).toContain(tool.whyForThisCustomer)
      expect(body).toContain(tool.howToUse)
    }
  })

  it("links every evidence note to its source", () => {
    const report = youReport()
    const markup = renderSection(report)

    expect(report.evidenceNotes.length).toBeGreaterThan(0)
    for (const note of report.evidenceNotes) {
      expect(text(markup)).toContain(note.claim)
      expect(markup).toContain(`href="${note.sourceUrl}"`)
    }
    // Outbound links open safely.
    expect(markup).toContain('rel="noopener noreferrer"')
  })

  it("renders the family chapter only when the report carries one", () => {
    const withoutFamily = text(renderSection(youReport()))
    expect(withoutFamily).not.toContain("The Family Table")

    const familyReport: FoodSystemReport = {
      ...youReport(),
      mode: "family",
      familyContext: {
        householdPattern: "Two adults and two children eating at different times.",
        constraints: ["One fussy eater", "Weeknights are short"],
        memberNotes: ["The younger child prefers smooth textures"],
        sharedLever: "Anchor one shared meal a week.",
      },
    }
    const withFamily = text(renderSection(familyReport))
    expect(withFamily).toContain("The Family Table")
    expect(withFamily).toContain("Two adults and two children eating at different times.")
    expect(withFamily).toContain("One fussy eater")
    expect(withFamily).toContain("The younger child prefers smooth textures")
    expect(withFamily).toContain("Anchor one shared meal a week.")
  })
})

/* ── Phase 4: the body-led architecture ──────────────────────────────────── */

describe("body-led chapter", () => {
  it("uses the report's own body asset as the spine, not a hardcoded image", () => {
    const report = youReport()
    const markup = renderSection(report)

    // next/image rewrites src into an optimiser URL, so the asset path arrives
    // encoded. Asserting on the encoded form is what actually proves the wiring.
    expect(report.visualTheme.bodyAssetPath).toBeTruthy()
    expect(markup).toContain(encodeURIComponent(report.visualTheme.bodyAssetPath))

    const family: FoodSystemReport = {
      ...report,
      mode: "family",
      visualTheme: { ...report.visualTheme, bodyAssetPath: "/images/family-hero.png" },
    }
    expect(renderSection(family)).toContain(encodeURIComponent("/images/family-hero.png"))
  })

  it("writes every ring node's pathway and state as text", () => {
    const report = youReport()
    const body = text(renderSection(report))

    // On the ring, state is carried by this text alone: the node's accent marks
    // the pathway (bioticAccent), not its state, and ring position is
    // orientation. Drop the words and the state is not conveyed at all — which
    // is what this assertion is here to prevent.
    for (const node of report.foodSystemMap) {
      const label = PATHWAY_LABEL[node.id as keyof typeof PATHWAY_LABEL]
      if (label) expect(body).toContain(label)
    }
    const stateWords = ["Well supported", "Building", "Room to grow", "Not enough to say"]
    expect(stateWords.some((w) => body.includes(w))).toBe(true)
  })

  it("numbers the chapters 01-07, adding 08 only for a family report", () => {
    // The body-led opener is the cover and carries no numeral, so the first
    // teaching chapter is 01.
    const plain = text(renderSection(youReport()))
    for (const n of ["01", "02", "03", "04", "05", "06"]) {
      expect(plain).toContain(n)
    }
    // Evidence is the last chapter on a non-family report.
    expect(plain.indexOf("07")).toBeGreaterThan(-1)
    expect(plain).not.toContain("08")

    const family: FoodSystemReport = {
      ...youReport(),
      mode: "family",
      familyContext: {
        householdPattern: "Two adults and two children.",
        constraints: [],
        memberNotes: [],
        sharedLever: "Anchor one shared meal a week.",
      },
    }
    // The family chapter slots in before Evidence, so there is one more numeral.
    expect(text(renderSection(family))).toContain("08")
  })
})

/* ── The closing mission page ────────────────────────────────────────────── */

describe("FoodSystemClosing", () => {
  it("renders the fixed headline as four separate lines, in order", () => {
    const markup = renderClosing(youReport())
    const body = text(markup)

    for (const line of CLOSING_HEADLINE_LINES) {
      expect(body).toContain(line)
    }

    // Order matters — this is the brand's closing statement, not four phrases.
    const positions = CLOSING_HEADLINE_LINES.map((line) => body.indexOf(line))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))

    // Each line is its own block, so the break points survive any line length.
    for (const line of CLOSING_HEADLINE_LINES) {
      expect(markup).toContain(`<span class="block text-balance">${line}</span>`)
    }
  })

  it("draws the inside-out levels and writes each one out", () => {
    const markup = renderClosing(youReport())
    const body = text(markup)

    // The rings are decoration; these six words are the argument. They must be
    // present and in order regardless of whether the diagram is visible.
    const levels = ["You", "Family", "Community", "County", "Country", "The Food System"]
    let cursor = -1
    for (const level of levels) {
      const at = body.indexOf(level, cursor + 1)
      expect(at, `missing inside-out level: ${level}`).toBeGreaterThan(cursor)
      cursor = at
    }
  })

  it("renders the mission copy and the fixed safety footer", () => {
    const report = youReport()
    const body = text(renderClosing(report))

    expect(body).toContain(report.closingMissionPage.insideYou)
    expect(body).toContain(report.closingMissionPage.aroundYou)
    expect(body).toContain(report.closingMissionPage.nextAction)
    expect(body).toContain(SAFETY_FOOTER)
  })
})

/* ── Colour safety ───────────────────────────────────────────────────────── */

describe("colour tokens", () => {
  it("never uses a raw --icon-* hue as text colour", () => {
    const markup = renderSection(youReport()) + renderClosing(youReport())

    // Raw hues measure 1.55:1–2.96:1 on white and fail AA as copy; the -text
    // variants are the calibrated ones. This is the mistake #184 shipped.
    //
    // Both spellings have to be checked. The inline form is the obvious one,
    // but the Tailwind arbitrary-value class is how it actually got in here —
    // `text-[var(--icon-green)]` on the section eyebrow, which this assertion
    // missed on the first pass and axe caught instead.
    const inlineRawColour = /color:\s*var\(--icon-(lime|green|teal|yellow|orange)\)/g
    const classRawColour = /text-\[var\(--icon-(lime|green|teal|yellow|orange)\)\]/g

    expect(markup.match(inlineRawColour)).toBeNull()
    expect(markup.match(classRawColour)).toBeNull()
  })

  it("darkens accent text that sits on a tinted ground", () => {
    const markup = renderSection(youReport())

    // The -text variants are calibrated on white. On a tint they measure ~4.3:1
    // and fail, so badges and callout labels use accentTextOnTint instead.
    // Verified with axe against the built stylesheet: 0 contrast violations.
    expect(markup).toContain("color-mix(in srgb, var(--icon-")
    expect(markup).toContain("78%, #000)")
  })
})

/* ── The no-op guarantee for reports without the block ───────────────────── */

describe("PaidReportClient without a foodSystem block", () => {
  it("renders none of the new sections", () => {
    const withFs = paidReport()
    const withoutFs: DeepReport = { ...withFs }
    delete withoutFs.foodSystem

    const legacy = text(renderPaid(withoutFs))

    for (const marker of [
      "Your 3-Biotics Engine",
      "Your Food System, Part by Part",
      "Your Priority Lever",
      "Your 30-Day Improvement Loop",
      "Where This Comes From",
      SAFETY_FOOTER,
      ...CLOSING_HEADLINE_LINES,
    ]) {
      expect(legacy).not.toContain(marker)
    }
  })

  it("keeps every existing section, the mission note and the original disclaimer", () => {
    const withFs = paidReport()
    const withoutFs: DeepReport = { ...withFs }
    delete withoutFs.foodSystem

    const legacy = text(renderPaid(withoutFs))

    for (const heading of [
      "Your Pattern",
      "Strengths & Opportunities",
      "Your Key Insight",
      "Deep Insight",
      "Your 7-Day Starter Plan",
      "Your 30-Day Roadmap",
      "Priority Map",
      "Your System Story",
      "Phased Strategy",
      "Final Thoughts",
      "Your 30-day cycle",
    ]) {
      expect(legacy).toContain(heading)
    }

    expect(legacy).toContain(MISSION.shortLine)
    expect(legacy).toContain(LEGACY_DISCLAIMER)
  })

  it("shows one disclaimer and one mission message once the block is present", () => {
    const enriched = text(renderPaid(paidReport()))

    expect(enriched).toContain(SAFETY_FOOTER)
    // Both are superseded by the closing mission page rather than stacked: the
    // weaker disclaimer, and the inline mission note that would otherwise repeat
    // the mission the closing page just made.
    expect(enriched).not.toContain(LEGACY_DISCLAIMER)
    expect(enriched).not.toContain(MISSION.shortLine)
  })

  it("adds the new sections when the block is present", () => {
    const enriched = text(renderPaid(paidReport()))

    for (const marker of [
      "Your 3-Biotics Engine",
      "Your Priority Lever",
      "Your 30-Day Improvement Loop",
      "Where This Comes From",
      ...CLOSING_HEADLINE_LINES,
    ]) {
      expect(enriched).toContain(marker)
    }
  })

  it("ends an enriched report on the closing mission page", () => {
    const enriched = text(renderPaid(paidReport()))

    // The bug this pins: FoodSystemClosing rendered, and then the inline mission
    // note rendered after it, so the report did not actually end on "Build the
    // Food System…". A not.toContain assertion would have passed with that bug
    // present — only position catches it.
    const footerAt = enriched.indexOf(SAFETY_FOOTER)
    expect(footerAt).toBeGreaterThan(-1)

    for (const earlier of [
      "Your 30-Day Improvement Loop",
      "Where This Comes From",
      "Final Thoughts",
      "Your 30-day cycle",
      CLOSING_HEADLINE_LINES[0],
    ]) {
      expect(enriched.indexOf(earlier)).toBeLessThan(footerAt)
    }

    // Nothing at all follows it.
    expect(enriched.slice(footerAt + SAFETY_FOOTER.length).trim()).toBe("")
  })
})
