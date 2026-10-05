import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"

/**
 * ══ 0R-4 · NO FABRICATED MEMBER DATA ON LIVE `/account` ═════════════════════
 *
 * `P0-TRUST-01` is not "a mock meal renders somewhere". It is a legacy
 * dashboard that, whenever real data is missing, substitutes invented data in
 * the member's own personal context — and the code says so out loud:
 * `const isMock = todayMeals.length === 0`, beside the comment
 * *"Real today's meals — or mock fallback"*.
 *
 * ── THE INVARIANT ───────────────────────────────────────────────────────────
 *
 *     No fabricated member meal or history data may render anywhere on live
 *     `/account`. Where real data is absent, show truthful absence.
 *
 * And the corollary that stops the obvious wrong fix:
 *
 *     Do not replace it with different sample data, more realistic fixtures or
 *     inferred history. Zero meals stay zero meals. Missing history stays
 *     missing history. Counts and averages derive only from real member data.
 *
 * ── WHY THIS TESTS THE ROOT PROPERTY AND NOT THE SENTENCES ──────────────────
 *
 * The Experience 0 audit caught ONE of four live manifestations. The other
 * three were found by tracing `MOCK_MEALS` to every consumer during 0R-4:
 *
 *   :1653  Today's Meals                       — the recorded finding
 *   :1699  "Today's average", behind a gate written `(todayMeals.length > 0
 *          || true)` — a tautology, so it always rendered
 *   :1931  My Meals — a fabricated SEVEN-DAY history, with invented insights,
 *          per-Biotic numbers and nutrition figures
 *   :1936  "7 meals logged this week" / :1938 "Average score: 73"
 *
 * A guard written per sentence would have passed three of those. So this one
 * pins the SOURCE constant's reachability instead: remove one manifestation and
 * leave another, and the inventory below still fails.
 */

const DASHBOARD = "components/account/live-dashboard.tsx"
const ACCOUNT_PAGE = "app/account/page.tsx"

function source(file: string): string {
  return readFileSync(file, "utf-8")
}

/** Source with comments stripped — a comment recording the old defect is not the defect. */
function rendered(file: string): string {
  return source(file)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/* ── THE SOURCE CONSTANT, AND THE ONE REFERENCE THAT MAY REMAIN ────────────── */

/**
 * `MOCK_MEALS` is a multi-day fabricated history: meal names, times, types,
 * scores, per-Biotic numbers, quality scores, nutrition figures and invented
 * insight prose — including *"The kimchi lifts your probiotic score
 * significantly"* and *"would push your diversity score from 55 to ~72"*, a
 * quantified predicted outcome.
 *
 * After 0R-4 exactly ONE reference survives, and it is the UNREACHABLE one:
 *
 *   `latestAnalysis ? <MealCard … /> : <MealCard meal={MOCK_MEALS[0].meals[0]} />`
 *
 * `latestAnalysis = recentAnalyses[0] ?? null` and the enclosing block requires
 * `recentAnalyses.length > 0`, so the else-branch cannot be evaluated. That is
 * `DEBT-CODE-01`, recorded as dead code rather than customer-facing debt, and
 * it is **0R-9's** to delete along with the constant.
 *
 * It is listed rather than ignored so that nobody has to trust a comment to
 * know why one reference is tolerated. SHRINK-ONLY, and it reaches **zero** at
 * 0R-9 — at which point this inventory and `MOCK_MEALS` are both deleted.
 */
const PERMITTED_MOCK_MEALS_SITES: readonly [snippet: string, why: string][] = [
  [
    ": <MealCard meal={MOCK_MEALS[0].meals[0]} />",
    "DEBT-CODE-01 — the dead else-branch of the latestAnalysis ternary, unreachable under the recentAnalyses.length > 0 gate. 0R-9 deletes it with the constant.",
  ],
]
const MOCK_SITES_AT_0R4_CLOSE = 1

describe("0R-4 · MOCK_MEALS reaches no live member-facing render path", () => {
  it("every MOCK_MEALS reference is an inventoried, justified one", () => {
    const src = rendered(DASHBOARD)
    const refs = [...src.matchAll(/^.*\bMOCK_MEALS\b.*$/gm)].map((m) => m[0].trim())

    /*
     * Non-vacuity: the constant must still be DECLARED, or this assertion is
     * trivially satisfied by a file that no longer mentions it for reasons
     * unrelated to the repair — and the declaration is 0R-9's to remove.
     */
    expect(
      refs.some((r) => r.startsWith("const MOCK_MEALS")),
      "MOCK_MEALS is no longer declared — if 0R-9 removed it, delete this inventory too",
    ).toBe(true)

    const uses = refs.filter((r) => !r.startsWith("const MOCK_MEALS"))
    const unjustified = uses.filter(
      (r) => !PERMITTED_MOCK_MEALS_SITES.some(([snippet]) => r.includes(snippet)),
    )

    expect(
      unjustified,
      `MOCK_MEALS is read on a path that is not in the inventory. Fabricated ` +
        `member data must not render on live /account — show truthful absence ` +
        `instead, and do NOT substitute different sample data.`,
    ).toEqual([])
  })

  it("the inventory may only shrink, and carries no headroom", () => {
    const src = rendered(DASHBOARD)
    const uses = [...src.matchAll(/^.*\bMOCK_MEALS\b.*$/gm)]
      .map((m) => m[0].trim())
      .filter((r) => !r.startsWith("const MOCK_MEALS"))

    expect(
      uses.length,
      "a NEW MOCK_MEALS read is a regression, not debt to record",
    ).toBeLessThanOrEqual(MOCK_SITES_AT_0R4_CLOSE)

    // Same contract as EXPOSED_AT_0R1: the cap equals the list, so headroom
    // cannot be left behind for a new read to hide in.
    expect(
      MOCK_SITES_AT_0R4_CLOSE,
      `MOCK_SITES_AT_0R4_CLOSE is ${MOCK_SITES_AT_0R4_CLOSE} while ${uses.length} ` +
        `reads remain. It moves DOWN only, with the repair, and reaches zero at 0R-9.`,
    ).toBe(uses.length)
  })

  it("every inventoried site still exists", () => {
    const src = rendered(DASHBOARD)
    for (const [snippet, why] of PERMITTED_MOCK_MEALS_SITES) {
      expect(
        src.includes(snippet),
        `an inventoried MOCK_MEALS site is gone, so DELETE its entry rather ` +
          `than leaving it: ${why}`,
      ).toBe(true)
    }
  })
})

describe("0R-4 · absence is rendered as absence, not filled in", () => {
  it("no render gate is disabled with a tautology", () => {
    /*
     * `{(todayMeals.length > 0 || true) && (` shipped on the "Today's average"
     * block. Somebody wrote the honest condition and then neutered it, so the
     * average rendered — from MOCK_MEALS — for a member with no meals today.
     *
     * A gate that cannot be false is a gate that is lying about being a gate.
     */
    const src = rendered(DASHBOARD)
    const tautologies = [...src.matchAll(/^.*\|\|\s*true\s*\).*$/gm)].map((m) => m[0].trim())
    expect(
      tautologies,
      "a render condition is disabled with `|| true`. Delete the gate or honour it.",
    ).toEqual([])
  })

  it("counts and averages have no invented fallback", () => {
    /*
     * `todayAvg ?? MOCK_MEALS[0].meals[0].score`, `totalMeals = … : 7` and
     * `avgScore = … : 73` each answered "how much has this member logged?"
     * with a number nobody logged.
     */
    const src = rendered(DASHBOARD)
    for (const [why, pattern] of [
      ["an average falls back to a fabricated score", /todayAvg\s*\?\?(?!\s*null\b)/],
      ["a meal count falls back to a literal", /totalMeals\s*=[^\n]*:\s*\d+/],
      ["an average falls back to a literal", /avgScore\s*=[^\n]*:\s*\d+(?!\s*\))/],
    ] as const) {
      const hit = src.match(pattern)
      expect(
        hit?.[0] ?? null,
        `${why} — counts and averages must derive only from real member data, ` +
          `and read as absent when there is none`,
      ).toBeNull()
    }
  })
})

describe("0R-4 · the fabricated per-Biotic profile and its construct are gone", () => {
  it("the invented 71/23/48 fallback does not exist", () => {
    const src = rendered(DASHBOARD)
    expect(
      /prebiotic:\s*71|probiotic:\s*23|postbiotic:\s*48/.test(src),
      "the hardcoded per-Biotic fallback is back. It is reachable in production: " +
        "app/account/page.tsx returns undefined for bioticsProfile when the last " +
        "five analyses have null per-Biotic columns, while recentAnalyses applies " +
        "no such filter — so a real member sees invented numbers as their own.",
    ).toBe(false)
    expect(
      /\bdisplayBiotics\b/.test(src),
      "displayBiotics is back. It existed only to feed the per-Biotic card " +
        "construct, which 0R-4 retired with it.",
    ).toBe(false)
  })

  it("no personal per-Biotic score, ring or band word is rendered", () => {
    /*
     * The absorbed `P0-SCIENCE-02`. Its three cards were the ONLY consumers of
     * the fabricated numbers, which is why the data source and the construct
     * are one remediation unit: removing the fallback alone would have left
     * these cards rendering a member's REAL per-Biotic numbers with band
     * words — still prohibited, and a knowingly invalid intermediate state.
     */
    const src = rendered(DASHBOARD)
    expect(
      /Your Biotics Profile/.test(src),
      "the Your Biotics Profile block is back — a personal numerical " +
        "Three-Biotic state, which the permanent product rule forbids outright",
    ).toBe(false)
    for (const band of ["On track", "Needs work", "Building"]) {
      expect(
        new RegExp(String.raw`label:\s*"(?:Pre|Pro|Post)biotic"[^\n]*${band}`).test(src),
        `a per-Biotic card still carries the band word "${band}"`,
      ).toBe(false)
    }
  })
})

describe("0R-4 · the false personal conclusion is gone", () => {
  it("no 'lowest pillar' claim is rendered", () => {
    /*
     * `P0-TRUST-03`, and the absorbed `P0-SCIENCE-03` manifestation at the SAME
     * rendered sentence. It was dual-classified for a reason: every other entry
     * in the register describes the product saying something it has not earned
     * the right to say, and this one describes the product telling a member
     * something FALSE about their own data, under a heading claiming it was
     * derived from it.
     *
     * `displayBiotics` was referenced zero times in that block. It read true in
     * both captured fixtures only by coincidence — Probiotic was lowest in the
     * fabricated 71/23/48 AND in the genuine 58/44/63.
     *
     * `P0-SCIENCE-03`'s other two sites, :1843 and :1896, are NOT shared with a
     * trust finding and remain 0R-5's.
     */
    const src = rendered(DASHBOARD)
    for (const [why, pattern] of [
      ["a Biotic named as the member's lowest", /lowest pillar|your lowest|is your lowest/i],
      ["a focus block claiming a derivation it does not perform", /Your Focus Today/],
    ] as const) {
      expect(
        pattern.test(src),
        `${why} — removing the numbers is not enough; a product that stopped ` +
          `showing them and kept this sentence would still be telling members ` +
          `something false`,
      ).toBe(false)
    }
  })
})

describe("0R-4 · NON-VACUITY", () => {
  /*
   * Every pre-repair shape, held as a literal. Once the repair lands these
   * exist nowhere in the file, so a test that read its subject from the fixed
   * code would prove only that the code is fixed — not that the rule catches
   * the regression. These strings ARE the regression.
   */
  const PRE_REPAIR: readonly [why: string, shape: string, pattern: RegExp][] = [
    ["Today's Meals fell back to MOCK_MEALS",
     "{(todayMeals.length > 0 ? todayMeals : MOCK_MEALS[0].meals).map((meal, i) => {",
     /\bMOCK_MEALS\b/],
    ["the average gate was a tautology",
     "{(todayMeals.length > 0 || true) && (",
     /\|\|\s*true\s*\)/],
    ["the average fell back to a fabricated score",
     "{todayAvg ?? MOCK_MEALS[0].meals[0].score}",
     /todayAvg\s*\?\?(?!\s*null\b)/],
    ["the meal count fell back to a literal",
     "const totalMeals = analysesByDate.length > 0 ? recentAnalyses.length : 7",
     /totalMeals\s*=[^\n]*:\s*\d+/],
    ["the per-Biotic numbers were invented",
     "const displayBiotics = propBiotics ?? { prebiotic: 71, probiotic: 23, postbiotic: 48 }",
     /prebiotic:\s*71|probiotic:\s*23|postbiotic:\s*48/],
    ["the lowest-pillar sentence was false",
     "Your probiotic score is your lowest pillar. One serving of kimchi, kefir,",
     /lowest pillar|your lowest|is your lowest/i],
  ]

  it.each(PRE_REPAIR)("the rule for %s refuses the shape that shipped", (_why, shape, pattern) => {
    expect(pattern.test(shape), `the rule would have allowed: ${shape}`).toBe(true)
  })

  it("a `?? null` normalisation is not mistaken for a content fallback", () => {
    /*
     * Written first as `\\s*\\?\\?\\s*(?!null\\b)`, which MATCHED `?? null`:
     * `\\s*` backtracks to zero width, so the lookahead inspected the SPACE
     * rather than `null`. It flagged `rj?.pullQuote ?? null` — the legitimate
     * shape that normalises a missing field so the renderer can omit the block
     * — and the identical bug was latent in the `todayAvg` rule, passing only
     * because its pattern happened to be absent after the repair.
     */
    const RULE = /pullQuote\s*\?\?(?!\s*null\b)/
    expect(RULE.test("pullQuote: rj?.pullQuote ?? null,"), "flagged a null normalisation").toBe(false)
    expect(RULE.test('pullQuote ?? "an invented sentence"'), "missed a content fallback").toBe(true)
  })

  it("the rules do not fire on legitimate derived data", () => {
    // Real shapes from the same file that must keep passing: a count and an
    // average computed from real analyses, and an honestly-false gate.
    const legitimate = [
      "const todayAvg = todayMeals.length ? Math.round(todayMeals.reduce((s, m) => s + (m.biotics_score ?? 0), 0) / todayMeals.length) : null",
      "{todayMeals.length > 0 && (",
      "const totalMeals = recentAnalyses.length",
    ]
    for (const line of legitimate) {
      expect(/\bMOCK_MEALS\b/.test(line), `flagged legitimate line: ${line}`).toBe(false)
      expect(/\|\|\s*true\s*\)/.test(line), `flagged legitimate line: ${line}`).toBe(false)
      expect(/totalMeals\s*=[^\n]*:\s*\d+/.test(line), `flagged legitimate line: ${line}`).toBe(false)
    }
  })

  it("the production reachability of the per-Biotic fallback is still real", () => {
    /*
     * `P0-TRUST-02` was reachable in production, not only in the fixture, and
     * the asymmetry that made it so is asserted here so the register's claim
     * stays checkable: the bioticsProfile query filters out null per-Biotic
     * columns, and the recentAnalyses query does not.
     */
    const page = rendered(ACCOUNT_PAGE)
    expect(
      /prebiotic_score\s*!=\s*null/.test(page),
      "app/account/page.tsx no longer filters null per-Biotic columns — " +
        "re-check P0-TRUST-02's reachability argument before trusting it",
    ).toBe(true)
  })
})

/* ── THE ROOT-LEVEL PROPERTY ───────────────────────────────────────────────── */

describe("0R-4 · no live member surface consumes a mock member-history constant", () => {
  /*
   * ── WHY THIS RULE EXISTS ABOVE THE PER-CONSTANT ONES ──────────────────────
   *
   * Everything above is specific to `MOCK_MEALS`, and `MOCK_MEALS` turned out
   * not to be the whole surface. Tracing every mock constant to every consumer
   * found a SECOND one, `MOCK_CONSULTATIONS`, feeding a third tab that no
   * register entry named: three fabricated weekly consultations with invented
   * dates, scores, deltas, meal counts, per-Biotic bars, a fabricated report
   * COUNT, and quotations attributed to the member's own reports.
   *
   * A guard that knew only the constant it was written for would have missed it
   * exactly as the audit did. So this one is stated at the level of the
   * property rather than the instance:
   *
   *     A production member surface must not consume a mock or demo
   *     member-history constant.
   *
   * It is deliberately blunt. A new `MOCK_*`/`DEMO_*` constant read anywhere in
   * the live dashboard fails here, whatever it is called and whatever it feeds.
   */
  it("the dashboard reads no MOCK_/DEMO_ constant outside the inventory", () => {
    const src = rendered(DASHBOARD)
    const reads = [...src.matchAll(/^.*\b(?:MOCK|DEMO)_[A-Z0-9_]+\b.*$/gm)]
      .map((m) => m[0].trim())
      .filter((line) => !/^(?:const|let|var|type|interface)\s+(?:MOCK|DEMO)_/.test(line))

    const unjustified = reads.filter(
      (r) => !PERMITTED_MOCK_MEALS_SITES.some(([snippet]) => r.includes(snippet)),
    )
    expect(
      unjustified,
      `a live member surface reads a mock/demo member-history constant. Zero ` +
        `meals must render as zero meals, missing history as missing history, ` +
        `and zero reports as zero reports — never as demo, sample or ` +
        `placeholder content.`,
    ).toEqual([])
  })

  it("MOCK_CONSULTATIONS is gone entirely, declaration included", () => {
    /*
     * Unlike MOCK_MEALS it had no surviving reader once the fabricated count
     * and card list were removed, so the constant itself went. A superseded
     * construct is removed, not left for somebody to re-wire.
     */
    expect(
      /\bMOCK_CONSULTATIONS\b/.test(rendered(DASHBOARD)),
      "MOCK_CONSULTATIONS is back. It had zero readers after 0R-4; a dead " +
        "fabrication constant is a re-wiring hazard, not harmless.",
    ).toBe(false)
  })
})

describe("0R-4 · member-attributed report content requires a real report", () => {
  it("the attributed quotation frame cannot render without a real pullQuote", () => {
    /*
     * `P0-TRUST-02` site 2. The frame says "From your latest report" and the
     * quotation was `pullQuote ?? "<invented sentence>"`, so a member with no
     * report was shown a sentence attributed to a report that does not exist —
     * carrying a quantified predicted outcome with a magnitude and a deadline.
     */
    const src = rendered(DASHBOARD)
    /*
     * `?? null` is the legitimate shape — normalising a missing field to null
     * so the renderer can omit the block. What is forbidden is substituting
     * CONTENT for a missing quotation.
     */
    expect(
      /pullQuote\s*\?\?(?!\s*null\b)/.test(src),
      "the attributed quotation has a content fallback again. With no report " +
        "there is no quotation: render the absence.",
    ).toBe(false)
    expect(
      /8[–-]12 points|biggest lever/.test(src),
      "the fabricated predicted-outcome quotation is back",
    ).toBe(false)
  })

  it("the consultations tab has no fabricated card path", () => {
    const src = rendered(DASHBOARD)
    for (const [why, pattern] of [
      ["a mock card list", /mockCards/],
      ["a card source chosen between real and mock", /cards\s*=\s*reports\s*\?/],
      ["a report count falling back to a constant's length", /count\s*=[^\n]*\?\?[^\n]*\.length/],
    ] as const) {
      expect(pattern.test(src), `${why} is back on the consultations tab`).toBe(false)
    }
  })

  it("a report card cannot render a personal per-Biotic state", () => {
    /*
     * The fused science construct. Removing the fabrication alone would have
     * left these bars rendering a member's REAL per-Biotic values — still
     * prohibited, and the knowingly invalid intermediate state the
     * tranche-boundary rule forbids.
     */
    const src = rendered(DASHBOARD)

    /*
     * ── SCOPED TO THE FUSED CONSTRUCT, AND THIS MATTERS ────────────────────
     *
     * Written first as "no <ScoreBar label='Prebiotic'> anywhere", which failed
     * — because THREE per-Biotic ScoreBar triples survive in this file, at
     * `MealCard`, the analysis result and the recent-analyses list. All three
     * render REAL meal data, none renders fabrication now that MOCK_MEALS no
     * longer reaches them, and none is fused to a trust finding.
     *
     * They are `P0-SCIENCE-01`'s class and they are **0R-5's work**. A guard
     * written here that demanded them would have been this tranche quietly
     * annexing the next one — the exact scope creep the tranche-boundary rule
     * forbids. So the rule names the construct that WAS fused, and nothing
     * else.
     */
    expect(
      /Biotics this week/.test(src),
      "the report card's 'Biotics this week' per-Biotic block is back. It was " +
        "removed in 0R-4 because the fabricated cards carried invented values " +
        "through it; the card must not be structurally capable of rendering a " +
        "personal per-Biotic state.",
    ).toBe(false)
    expect(
      /card\.pillars/.test(src),
      "a report card reads per-Biotic pillars again",
    ).toBe(false)
  })
})

describe("0R-4 · the close condition — every live tab was checked", () => {
  /*
   * The tranche may only claim "no fabricated member data remains on live
   * /account" after every materially distinct live tab has been examined. The
   * tab set is read from source rather than retyped, so a NEW tab added later
   * fails this test until somebody checks it for fabrication too.
   */
  const TABS_AT_0R4 = ["account", "consultations", "meals", "overview", "reports"] as const

  it("the live tab set is exactly the one 0R-4 audited", () => {
    const src = rendered(DASHBOARD)
    const tabs = [...new Set([...src.matchAll(/tab === "([a-z-]+)"/g)].map((m) => m[1]))].sort()
    expect(
      tabs,
      `the dashboard's tab set changed. 0R-4 audited ${TABS_AT_0R4.join(", ")} ` +
        `for fabricated member data; a new tab has not been audited, and the ` +
        `close claim does not extend to it.`,
    ).toEqual([...TABS_AT_0R4])
  })
})
