import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { PaidReportClient } from "@/components/assessment/paid-report-client"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { getProfile, computeOverall } from "@/lib/assessment-scoring"
import type { DeepReport } from "@/lib/claude-report"

/**
 * Regression guard for #218 — the report must not scroll sideways on mobile.
 *
 * ── What broke ───────────────────────────────────────────────────────────────
 *
 * The decorative glow behind the hero score ring used `-inset-6`: −24px on ALL
 * FOUR sides. An oversized absolute child still counts toward document
 * scrollWidth even when it is `pointer-events-none`, `aria-hidden` and `-z-10`,
 * so at 390px the page measured scrollWidth 394 / clientWidth 390 and rubber-
 * banded horizontally. Proven by hiding that one element and re-measuring: 394 →
 * 390. The same file's other candidate (`-inset-x-10` in food-system-section)
 * turned out to be innocent — its parent has `overflow-hidden`, so hiding it
 * changed nothing.
 *
 * ── Why this shape of test ───────────────────────────────────────────────────
 *
 * The honest check is a real browser measuring scrollWidth at mobile widths, and
 * that is what was run to verify the fix (320/375/390/430/768/1024/1440, four
 * profiles, all clean). It is not what is *kept*, because the paid report is not
 * reachable in the Playwright environment: /assessment/report needs a settled
 * Stripe session, and without STRIPE_SECRET_KEY it renders an empty shell with
 * no glow at all — a browser test pointed there would pass while measuring
 * nothing. Standing up a permanent test-only route to host the real report is a
 * bigger and more invasive fixture than this bug warrants, and a screenshot
 * snapshot would be expensive to maintain for a blurred gradient.
 *
 * So the invariant is encoded where it actually bites: an all-sides negative
 * inset on a decorative overlay. `-inset-x-*` and `-inset-y-*` stay allowed —
 * vertical bleed is free, and horizontal bleed is fine inside a clipped parent,
 * which is why food-system-section's glow is not flagged. Reintroducing
 * `-inset-<n>` on either report client fails this test.
 */

/** `-inset-6`, `-inset-1.5`, `-inset-px` — negative on all four sides. */
const ALL_SIDES_NEGATIVE_INSET = /-inset-(?!x-|y-)[\w.]+/g

const COMPONENTS = [
  "components/assessment/paid-report-client.tsx",
  "components/assessment/full-report-client.tsx",
]

describe("report overflow: no all-sides negative insets", () => {
  it.each(COMPONENTS)("%s declares none", (path) => {
    const source = readFileSync(path, "utf8")

    // Only look at className strings, so prose in comments cannot trip this.
    const classAttrs = [...source.matchAll(/className="([^"]*)"/g)].map((m) => m[1])
    const offenders = classAttrs.filter((c) => ALL_SIDES_NEGATIVE_INSET.test(c))

    expect(
      offenders,
      `${path}: an all-sides negative inset widens the document and reintroduces #218.\n` +
        `Use -inset-y-* with inset-x-0 for vertical bleed, or clip the parent.\n` +
        offenders.join("\n"),
    ).toEqual([])
  })

  it("the rendered paid report contains no all-sides negative inset", () => {
    const subScores = { prebiotics: 85, probiotics: 20, postbiotics: 85 }
    const overall = computeOverall(subScores)
    const profile = getProfile(overall, subScores)
    const report = buildFallbackPaidReport({
      tier: "premium",
      overall,
      subScores,
      profile,
      questions: [],
      answers: {},
    }) as DeepReport

    const markup = renderToStaticMarkup(
      createElement(PaidReportClient, {
        tier: "premium" as const,
        sessionId: "cs_test_overflow",
        reportJson: report,
        freeScores: { overall, subScores, profile },
      } as never),
    )

    // Sanity: the hero glow must actually be in the markup, or this asserts
    // nothing. It is the element that regressed.
    expect(markup).toContain("blur-3xl")

    expect(markup.match(ALL_SIDES_NEGATIVE_INSET) ?? []).toEqual([])
  })
})
