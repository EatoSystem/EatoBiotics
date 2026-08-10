import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import type { DeepPremiumReport } from "@/lib/claude-report"

/**
 * Presentation guards for the paid web report, from the PR #216 review.
 *
 * Two of the four findings were renderer-side and invisible to every data-level
 * test, because the data was correct and the COMPONENT misused it:
 *
 *  1. The hero rendered `r.opening.split(".")[0]`, so the opening's first
 *     sentence appeared in the <h1> and then again, in full, in the "Your
 *     Pattern" card immediately below — the same sentence twice.
 *  2. The food section's subtitle claimed "Selected specifically based on your
 *     answers — not generic recommendations", implying per-person selection of
 *     a list that comes from a fixed catalogue ordered by priority pathway.
 *
 * These render the real component with a real fallback report, so they fail if
 * either regresses. `environment: "node"` with no jsdom, so this renders to
 * static markup rather than mounting — same approach as
 * tests/unit/food-system-section.test.ts.
 */

const PROFILE = {
  type: "Strong Foundation",
  tagline: "A solid base in your answers, with one pathway thinner than the rest.",
  description: "d",
  color: "var(--icon-teal)",
}

const PROFILES = {
  strong: { overall: 98, subScores: { prebiotics: 95, probiotics: 99, postbiotics: 100 } },
  mixed: { overall: 60, subScores: { prebiotics: 70, probiotics: 40, postbiotics: 70 } },
  earlyStage: { overall: 20, subScores: { prebiotics: 30, probiotics: 25, postbiotics: 10 } },
  strongWithStrained: { overall: 72, subScores: { prebiotics: 85, probiotics: 20, postbiotics: 85 } },
} as const

type ProfileName = keyof typeof PROFILES
const NAMES = Object.keys(PROFILES) as ProfileName[]

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

function renderPaid(name: ProfileName): string {
  const p = PROFILES[name]
  return renderToStaticMarkup(
    createElement(PaidReportClient, {
      tier: "premium" as const,
      sessionId: "cs_test_presentation",
      reportJson: reportFor(name),
      freeScores: { overall: p.overall, subScores: p.subScores, profile: PROFILE },
    } as never),
  )
}

/** Entity-decodes and strips tags so assertions read against the real copy. */
function text(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;|&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")
    .replace(/\s+/g, " ")
    .trim()
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let from = 0
  for (;;) {
    const i = haystack.indexOf(needle, from)
    if (i === -1) return count
    count += 1
    from = i + needle.length
  }
}

describe("paid report: the opening is not duplicated", () => {
  it.each(NAMES)("%s — the opening's first sentence appears exactly once", (name) => {
    const body = text(renderPaid(name))
    const opening = reportFor(name).opening

    // The lead sentence, as the reader sees it. Normalised the same way the
    // rendered markup is, so the comparison is like-for-like.
    const firstSentence = text(opening.split(". ")[0] + ".")
    expect(firstSentence.length).toBeGreaterThan(30)

    expect(countOccurrences(body, firstSentence), `"${firstSentence}"`).toBe(1)
  })

  it.each(NAMES)("%s — the full opening still renders, in its chapter", (name) => {
    const body = text(renderPaid(name))
    expect(body).toContain(text(reportFor(name).opening))
  })

  it("the hero shows the profile tagline, not a slice of the opening", () => {
    const body = text(renderPaid("strongWithStrained"))
    expect(body).toContain(PROFILE.tagline)
    // The brittle construction that caused the duplication.
    expect(renderPaid("strongWithStrained")).not.toContain(
      reportFor("strongWithStrained").opening.split(".")[0] + ".</h1>",
    )
  })
})

describe("paid report: the food section describes itself honestly", () => {
  const REMOVED = "Selected specifically based on your answers"

  it.each(NAMES)("%s — the overstated subtitle is gone from the web report", (name) => {
    expect(text(renderPaid(name))).not.toContain(REMOVED)
  })

  it("the honest subtitle is present", () => {
    expect(text(renderPaid("mixed"))).toContain(
      "A practical starting set chosen to support your current priority pathway.",
    )
  })

  it("the overstated subtitle is absent from the PDF renderer too", async () => {
    // The PDF never carried this string; asserting it here keeps the two
    // surfaces from drifting back apart when one is edited.
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
          /* needs a render context; children are covered above */
        }
      }
      return acc
    }

    const p = PROFILES.mixed
    const rendered = strings(
      React.createElement(ReportPDF, {
        tier: "premium",
        leadName: "T",
        generatedAt: "1 Aug",
        freeScores: { overall: p.overall, subScores: p.subScores, profile: PROFILE },
        report: reportFor("mixed"),
      } as never),
    ).join(" ")

    expect(rendered).not.toContain(REMOVED)
  })
})

describe("paid report: five food cards render on every profile", () => {
  it.each(NAMES)("%s — all five foods and their swaps reach the page", (name) => {
    const body = text(renderPaid(name))
    const foods = reportFor(name).specificFoodList

    expect(foods).toHaveLength(5)
    for (const food of foods) {
      expect(body, `${name}: ${food.food}`).toContain(food.food)
      expect(body, `${name}: swap for ${food.food}`).toContain(text(food.swap ?? ""))
    }
  })
})
