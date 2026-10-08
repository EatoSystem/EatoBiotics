import { describe, it, expect } from "vitest"

import { buildFoodSystemReport } from "@/lib/report/build-food-system-report"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import { getProfile, computeOverall } from "@/lib/assessment-scoring"

/* ════════════════════════════════════════════════════════════════════════════
   0R-6R · THE DOWNLOADABLE PAID PDF, PROVED BY RENDER.

   ══ WHY THIS FILE EXISTS, AND WHY IT IS NEW ═════════════════════════════════

   The PDF a paying customer downloads had NEVER been proved by render for
   Biotic claims. That is not a small gap — it is the specific reason the worst
   remaining instance of the construct survived five tranches of this programme:

     lib/pdf/report-pdf.tsx   "Your 3 Biotics", rows sorted WEAKEST FIRST, each
                              with the Biotic's name, a per-Biotic colour, a bar
                              of width `${score}%` and the score itself.

   Name, number, colour and extent — the exact four forms of `BioticBar`, which
   0R-5 deleted from `twin-stage.tsx` after finding it rendering ungated for
   every member with a Twin. Reconstructed in the PDF, with the ranking carried
   by the row order on top.

   And in `lib/pdf/food-system-pdf.tsx`, `BodyFigure` drew the three scores and
   their band words ON a figure of the member's body, inside three rings — the
   anatomy construct `P0-SCIENCE-05` removed from the Twin.

   ══ THE ELEMENT TREE, NOT THE PDF BYTES ════════════════════════════════════

   `report-quality.test.ts` established the method and its own comment says why:
   react-pdf hex-encodes text with subset fonts, so searching the output bytes
   for "Prebiotics" always misses — and a test that always misses would pass a
   broken panel. So this walks the rendered element tree, where the strings are
   the strings.

   `renderToBuffer` is then called for real, because a tree that walks cleanly
   and a document that builds are two different claims.
   ════════════════════════════════════════════════════════════════════════════ */

/** Every string and number in a rendered react-pdf tree, however deep. */
function treeStrings(node: unknown, acc: string[] = []): string[] {
  if (node == null || typeof node === "boolean") return acc
  if (typeof node === "string" || typeof node === "number") {
    acc.push(String(node))
    return acc
  }
  if (Array.isArray(node)) {
    node.forEach((n) => treeStrings(n, acc))
    return acc
  }
  const el = node as { type?: unknown; props?: { children?: unknown } }
  if (el.props?.children !== undefined) treeStrings(el.props.children, acc)
  if (typeof el.type === "function") {
    try {
      treeStrings((el.type as (p: unknown) => unknown)(el.props), acc)
    } catch {
      /* needs a render context; its children are covered above */
    }
  }
  return acc
}

/*
 * Six orderings of ONE score multiset. The multiset is held constant and only
 * WHICH Biotic carries which number changes, so every difference between two
 * renders is a personal Biotic ranking and nothing else.
 */
const PERMUTATIONS = [
  { prebiotics: 71, probiotics: 23, postbiotics: 48 },
  { prebiotics: 23, probiotics: 48, postbiotics: 71 },
  { prebiotics: 48, probiotics: 71, postbiotics: 23 },
  { prebiotics: 23, probiotics: 71, postbiotics: 48 },
  { prebiotics: 71, probiotics: 48, postbiotics: 23 },
  { prebiotics: 48, probiotics: 23, postbiotics: 71 },
] as const

const PROFILE = { type: "Emerging Balance", tagline: "A steady pattern.", description: "d" }

/** A per-Biotic score with a denominator, in any of the forms either PDF used. */
const SCORE_WITH_DENOMINATOR = /\b\d{1,3}\s*\/\s*100\b/
const BAND_WORDS = ["Well supported", "Building", "Room to grow", "Not enough to say"] as const
/**
 * A ranking OF A PATHWAY, which is the claim — not a superlative in ordinary
 * prose, which is not.
 *
 * Narrowed after the first run flagged the fallback report's own reviewed
 * sentence: "The strongest practical move is to keep your best meals as easy to
 * repeat as they are now." That is a superlative about an ACTION. A rule that
 * refused it would be refusing English, and the repository has the same lesson
 * written down about lowercase "heal" and about `capitalize`.
 *
 * So the rule requires the superlative to be ABOUT one of the three — either
 * naming a Biotic, or naming the thing a Biotic was ranked as.
 */
const RANKING =
  /\b(?:strongest|weakest|thinnest)\s+(?:pathway|pillar|area|biotic)|\b(?:[Pp]re|[Pp]ro|[Pp]ost)biotics?\b[^.]{0,30}\b(?:strongest|weakest|thinnest)\b|\b(?:strongest|weakest|thinnest)\b[^.]{0,30}\b(?:[Pp]re|[Pp]ro|[Pp]ost)biotics?\b/

/**
 * A band word, as a BADGE rather than as a word inside a sentence.
 *
 * Measured, not assumed: the first version of this asserted the band words were
 * absent from the JOINED text, and "Building" fired on the legacy PDF's own
 * reviewed prose — "Building the rest of the plan around meals that are already
 * reliable makes the whole system easier to sustain". That is an ordinary
 * gerund, not a claim about anybody.
 *
 * `StateBadge` rendered its band word as its own `<Text>`, so in the element
 * tree the badge is a STANDALONE NODE equal to the word and the prose is a long
 * node containing it. Comparing whole nodes tells them apart exactly, with no
 * judgement call about which sentences are allowed to contain which words.
 */
function badgeNodes(strings: readonly string[]): string[] {
  return strings.map((v) => v.trim()).filter((v) => (BAND_WORDS as readonly string[]).includes(v))
}

function foodSystemFor(sub: (typeof PERMUTATIONS)[number]) {
  return buildFoodSystemReport({
    mode: "you",
    subScores: { ...sub },
    overall: 55,
    profile: PROFILE,
    generatedAt: "2026-01-01T00:00:00.000Z",
  })
}

describe("0R-6R · the food-system PDF chapters state no personal Biotic state", () => {
  /*
   * ── THE PERMUTATION SET ITSELF, PINNED — FOUND WRITING SABOTAGE 1520 ──────
   *
   * The invariance assertion in this describe reads `new Set(...).size === 1`
   * over `PERMUTATIONS`. With one entry that is trivially true, so truncating
   * the array would turn the PDF's close proof into a tautology in one edit.
   * The same pin as `agent-loop-claims.test.ts`, because both files carry the
   * same six orderings for the same reason.
   */
  it("the permutation set is six distinct orderings of one score multiset", () => {
    expect(PERMUTATIONS).toHaveLength(6)

    const keys = ["prebiotics", "probiotics", "postbiotics"] as const
    const orderings = new Set(PERMUTATIONS.map((p) => keys.map((k) => p[k]).join("-")))
    expect(orderings.size, "two permutations are the same ordering").toBe(6)

    const multisets = new Set(
      PERMUTATIONS.map((p) =>
        keys
          .map((k) => p[k])
          .sort((a, b) => a - b)
          .join("-"),
      ),
    )
    expect(
      multisets.size,
      "the permutations do not all hold the same three numbers, so a difference " +
        "between two renders need not be a ranking",
    ).toBe(1)
  })

  it("renders the three pathway NAMES and no score, band or ranking", async () => {
    const React = (await import("react")).default
    const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")

    const strings = treeStrings(
      React.createElement(FoodSystemPages, { report: foodSystemFor(PERMUTATIONS[0]) }),
    )
    const joined = strings.join(" ")

    /*
     * NON-VACUITY, and it matters most here: the pathway names and the teaching
     * chapter must still be present. An empty render would satisfy every
     * absence below.
     */
    expect(strings.length, "the PDF chapters rendered almost nothing").toBeGreaterThan(60)
    for (const label of ["Prebiotics", "Probiotics", "Postbiotics"]) {
      expect(joined, `${label} is missing — this is not the Report`).toContain(label)
    }
    expect(joined).toContain("Your 3-Biotics Engine")

    // The construct, in each of its forms.
    expect(SCORE_WITH_DENOMINATOR.test(joined), `a score out of 100: "${joined.slice(0, 200)}"`).toBe(false)
    expect(
      badgeNodes(strings),
      "a band word is rendered as a badge — that is a per-Biotic state in words",
    ).toEqual([])
    expect(RANKING.test(joined), "the chapters rank the pathways").toBe(false)
    expect(joined).not.toContain("Where it matters most:")
    expect(joined).not.toContain("Part by Part")
  })

  it("is byte-identical across six orderings of the same three scores", async () => {
    const React = (await import("react")).default
    const { FoodSystemPages } = await import("@/lib/pdf/food-system-pdf")

    const rendered = PERMUTATIONS.map((sub) =>
      treeStrings(React.createElement(FoodSystemPages, { report: foodSystemFor(sub) })).join("\u0000"),
    )

    expect(
      new Set(rendered).size,
      "the PDF chapters differ across permutations of the SAME three scores, so " +
        "a personal Biotic ranking is still choosing what a paying customer " +
        "downloads.",
    ).toBe(1)
  })
})

describe("0R-6R · the legacy paid PDF states no personal Biotic state", () => {
  const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }

  async function render() {
    const React = (await import("react")).default
    const { ReportPDF } = await import("@/lib/pdf/report-pdf")
    const overall = computeOverall(SUB)
    const profile = getProfile(overall, SUB)
    const report = buildFallbackPaidReport({
      tier: "premium",
      overall,
      subScores: SUB,
      profile,
      questions: [],
      answers: {},
    })
    return {
      element: React.createElement(ReportPDF, {
        tier: "premium",
        leadName: "T",
        generatedAt: "1 Aug",
        freeScores: { overall, profile },
        report,
      } as never),
      overall,
    }
  }

  it('carries no "Your 3 Biotics" panel, and no bar of per-Biotic width', async () => {
    const { element, overall } = await render()
    const strings = treeStrings(element)
    const joined = strings.join(" ")

    // NON-VACUITY: a full premium report rendered.
    expect(strings.length, "the PDF rendered almost nothing").toBeGreaterThan(120)
    expect(joined).toContain("Your Assessment")
    expect(joined).toContain(String(overall))

    expect(joined).not.toContain("Your 3 Biotics")
    expect(joined).not.toContain("Your 5 Pillars")
    expect(
      badgeNodes(strings),
      "a band word is rendered as a badge — that is a per-Biotic state in words",
    ).toEqual([])
    expect(RANKING.test(joined), `the PDF ranks the pathways: "${joined.slice(0, 300)}"`).toBe(false)
    // The symptom of the legacy-pillar bug, still worth holding.
    expect(strings.some((v) => v.includes("undefined"))).toBe(false)
  })

  /*
   * ── THE COVER TAGLINE GOES THROUGH THE REFUSAL, AND THAT IS PROVED HERE ───
   *
   * `report-pdf.tsx:513` renders `heroTaglineFor({ profile })`, which returns
   * NULL for this fixture — `getProfile`'s `>= 65` branch authors "A solid base
   * in your answers, with one pathway thinner than the rest", a ranking with the
   * pathway elided, and the boundary refuses it.
   *
   * Asserted explicitly rather than left to the absence rules above, because
   * the string does not contain "thinnest pathway" or any Biotic word: the
   * RANKING rule cannot see it. The PDF cover was the TENTH site found in this
   * tranche, and it was found by rendering the PDF rather than by reading the
   * web boundary — `<Text>{profile.tagline}</Text>` would have passed every
   * other assertion in this file.
   *
   * `getProfile` itself is deliberately unchanged: it feeds the free results
   * page, the lifecycle emails and the share card. It is recorded as a
   * reported-not-repaired finding, and this is the gate that keeps it off the
   * paid PDF.
   */
  it("the cover shows no refused tagline, and still shows the profile type", async () => {
    const { heroTaglineFor } = await import("@/lib/report/framing")
    const { element } = await render()
    const joined = treeStrings(element).join(" ")

    const SUB_PROFILE = getProfile(computeOverall(SUB), SUB)

    // NON-VACUITY: the fixture really does author a tagline, and the cover
    // really does render the rest of the profile.
    expect(SUB_PROFILE.tagline.length).toBeGreaterThan(20)
    expect(joined, "the cover lost the profile type too").toContain(SUB_PROFILE.type)

    expect(heroTaglineFor({ profile: SUB_PROFILE })).toBeNull()
    expect(
      joined.includes(SUB_PROFILE.tagline),
      "the PDF cover prints the authored tagline directly instead of going " +
        "through heroTaglineFor, so a ranking with the pathway elided reaches " +
        "the first page of the paid Report.",
    ).toBe(false)
    expect(joined).not.toContain("one pathway thinner than the rest")
  })

  it("the document actually builds — a walkable tree is not a valid PDF", async () => {
    const { renderToBuffer } = await import("@react-pdf/renderer")
    const { element } = await render()

    const buffer = (await renderToBuffer(element as never)) as Buffer
    expect(buffer.length, "renderToBuffer produced nothing").toBeGreaterThan(10_000)
    // A real PDF, not an error page.
    expect(buffer.subarray(0, 5).toString("latin1")).toBe("%PDF-")
  }, 60_000)
})
