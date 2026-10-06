import { describe, it, expect } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { heroTaglineFor } from "@/lib/report/framing"
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

  it.each(NAMES)("%s — the hero shows no opening slice, and no refused tagline", (name) => {
    const body = text(renderPaid(name))

    /*
     * 0R-6R · this asserted `toContain(heroTaglineFor(…))`. It now returns
     * NULL for this fixture, and the fixture is the point: `PROFILE.tagline` is
     * `getProfile`'s real `>= 65` string, "A solid base in your answers, with
     * one pathway thinner than the rest" — a ranking with the pathway elided.
     * The boundary refuses it, so the hero falls back to the tier label.
     *
     * That is what the two halves below assert: the refusal happens, and the
     * fallback renders rather than leaving the hero empty.
     */
    expect(heroTaglineFor({ profile: PROFILE })).toBeNull()
    expect(body).not.toContain(PROFILE.tagline)
    expect(body).toMatch(/Your (?:Personal|Starter|Full|Premium) Report/)

    // A tagline that makes no such claim still passes through.
    expect(heroTaglineFor({ profile: { tagline: "A pattern worth repeating." } })).toBe(
      "A pattern worth repeating.",
    )

    // The brittle construction that caused the duplication.
    expect(renderPaid(name)).not.toContain(reportFor(name).opening.split(".")[0] + ".</h1>")
  })

  it("0R-6R · the hero states no pathway and no three-pathway band", () => {
    /*
     * INVERTED. It required the hero to read "A strong overall base, with
     * Probiotics the thinnest part of your answers" — the argmin, printed on
     * the most prominent line of the €49 Report. The second half of the old
     * assertion is KEPT and is now the whole point: `heroTaglineFor` refuses
     * `getProfile`'s "all three pathways being well supported" too, because a
     * band word over the member's three Biotics is the same construct in a
     * different grammar.
     */
    const body = text(renderPaid("strongWithStrained"))

    // NON-VACUITY: the Report rendered.
    expect(body.length).toBeGreaterThan(2000)

    expect(body).not.toContain("the thinnest part of your answers")
    expect(body).not.toContain("all three pathways being well supported")
    expect(body).not.toMatch(/\b(?:Prebiotics|Probiotics|Postbiotics) (?:is|are) (?:your|the) (?:strongest|weakest|thinnest)/)
  })
})

describe("paid report: the food section describes itself honestly", () => {
  const REMOVED = "Selected specifically based on your answers"

  it.each(NAMES)("%s — the overstated subtitle is gone from the web report", (name) => {
    expect(text(renderPaid(name))).not.toContain(REMOVED)
  })

  it("the honest subtitle is present, and claims no priority pathway", () => {
    const body = text(renderPaid("mixed"))
    // 0R-6R · was "…chosen to support your current priority pathway." The five
    // foods are catalogue-ordered now, and the heading claimed otherwise.
    expect(body).toContain("A practical starting set — what each one does, and how to use it.")
    expect(body).not.toContain("priority pathway")
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
