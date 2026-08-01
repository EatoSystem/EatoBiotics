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
import type { DeepReport } from "@/lib/claude-report"

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

  it("keeps every existing section and the original disclaimer", () => {
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
      "Recommended retest: in 75 days",
    ]) {
      expect(legacy).toContain(heading)
    }

    expect(legacy).toContain(
      "This report is for educational purposes and is not medical advice or a diagnosis.",
    )
  })

  it("shows one disclaimer, not two, once the block is present", () => {
    const enriched = text(renderPaid(paidReport()))

    expect(enriched).toContain(SAFETY_FOOTER)
    // The weaker one-liner is superseded rather than stacked.
    expect(enriched).not.toContain(
      "This report is for educational purposes and is not medical advice or a diagnosis.",
    )
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
})
