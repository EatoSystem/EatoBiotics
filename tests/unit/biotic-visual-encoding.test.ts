import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0R-2 — THE FORM TRACK.

   ══ WHY THIS FILE EXISTS SEPARATELY FROM `biotic-claims.test.ts` ════════════

   `P0-SCIENCE-04`. `twin-stage.tsx:284` renders the glow around the member's
   body figure as `auraGradientForBiotic(twin.biotics.weakest, …)`. The COLOUR
   of that glow IS a personal comparative Biotic verdict — and it carries no
   string. A corpus of text rules cannot see it at any width.

   Gate 3.6 removed the chip, the bar and the band word from the hotspots in
   that same component and left the orb tinted, because each repair closed the
   FORM it found. 0R-1 closes the COVERAGE gap and measures how much of the debt
   coverage cannot reach: nineteen inventoried findings, and `live-dashboard.tsx`
   — which carries six P0s — produced one.

   So coverage and form are two requirements, not one:

     COVERAGE  every customer-facing claims surface is inside the corpus
     FORM      a prohibited personal Biotic state cannot FLOW into a visual
               encoding — colour, position, scale, opacity, duration, anatomy

   This file is the second. It asserts over DATA FLOW, not language.

   ══ WHAT IT DOES NOT DO ═════════════════════════════════════════════════════

   It does not repair anything. The two known sites are inventoried below and
   deleted by 0R-5, exactly as `EXPOSED_AT_0R1` works. A guard that silently
   passed today would be the thing this programme keeps finding broken.
   ════════════════════════════════════════════════════════════════════════════ */

function source(file: string): string {
  return readFileSync(file, "utf-8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ")
}

/**
 * A value derived from the member's per-Biotic scores.
 *
 * `strongest` and `weakest` are `argmax`/`argmin` over the three
 * (`lib/agent-loop/biotics.ts:44-55`), so naming either is naming a comparative
 * verdict. `biotics[...]` and a bare `BioticKey` parameter are the general
 * forms.
 */
const BIOTIC_DERIVED = [
  ["the weakest Biotic", /\bbiotics\s*\.\s*weakest\b/],
  ["the strongest Biotic", /\bbiotics\s*\.\s*strongest\b/],
  ["a Biotic key as a function parameter", /\b\w+\s*:\s*BioticKey\b/],
  /*
   * ── ADDED AT 0R-5 · THE PER-BIOTIC SCORE ITSELF ──────────────────────────
   *
   * 0R-2 wrote this list for `P0-SCIENCE-04`, where the member's weakest Biotic
   * chooses a colour. `argmin` over three numbers is a comparative verdict, so
   * naming it was enough. It is not the only derived form, and 0R-5's trace
   * found the other one live:
   *
   *     lib/account/meal-impact.ts:57   level: levelFor(input.probiotic_score)
   *
   * A per-Biotic SCORE flowing into a band word and a chip colour is the same
   * prohibited mapping with one fewer step — no `weakest`, no `BioticKey`, and
   * invisible to all three rules above. The permanent product rule names this
   * form explicitly: "not as a number, not as a bar, not as a band word".
   */
  [
    "a per-Biotic score",
    /*
     * The plural matters, and the non-vacuity case below is what found it.
     * Written first as `biotics\s*\.\s*(?:pre|pro|post)biotic\b`, which does
     * NOT match `twin.biotics.prebiotics.score` — the trailing `s` defeats the
     * word boundary — and that is the exact property path `twin-stage.tsx`'s
     * `BioticBar` call sites used. The rule would have passed the worst live
     * site in the product while describing itself as catching per-Biotic
     * scores.
     */
    /\b(?:pre|pro|post)biotic_score\b|\bbiotics\s*\.\s*(?:pre|pro|post)biotics?\b/,
  ],
] as const

/**
 * Functions and fields whose output a person SEES as visual state.
 *
 * Named for what they produce rather than for where they live, because the
 * defect is the mapping and not the module.
 */
const VISUAL_SINKS = [
  ["a colour or gradient", /\b(?:\w*[Gg]radient\w*|\w*[Cc]olou?r\w*|\w*[Tt]int\w*|\w*[Aa]ura\w*)\b/],
  /*
   * ── ADDED AT 0R-5 · EXTENT, WHICH THIS FILE ALWAYS CLAIMED ───────────────
   *
   * The header above states the form requirement as "colour, position, scale,
   * opacity, duration, anatomy" — and then implemented colour. 0R-2 had a
   * reason: `P0-SCIENCE-04` was a colour, and a sink nothing flowed into would
   * have been untested. But a `ScoreBar`'s LENGTH is the oldest form of this
   * claim in the product, and the register's own wording for the permanent rule
   * puts "not as a bar" beside "not as a number".
   *
   * So the promise is now kept rather than restated. `width:` is the Tailwind /
   * inline-style form; `strokeDasharray` is the SVG ring form that
   * `live-dashboard.tsx` and `report-client.tsx` both use.
   */
  ["an extent — a bar length, a ring arc or a scale", /\bwidth\s*:|\bstrokeDasharray\b|\bscale\s*\(/],
] as const

/**
 * An anatomical coordinate — a point ON a picture of the member's body.
 *
 * ── WHY THIS IS A SECOND RULE AND NOT A THIRD SINK ──────────────────────────
 *
 * Written first as a sink alongside colour, which required a Biotic to flow
 * into it. The guard then REJECTED its own inventory entry for `ritual.ts`,
 * correctly: `RITUAL_CHECKS` carries `node: { x, y }` per check, but its keys
 * are `fermented` · `plants` · `moved` · `slept` · `feeling` — self-reported
 * behaviour, not Biotics.
 *
 * So `P0-SCIENCE-05` is a DIFFERENT FORM from `P0-SCIENCE-04`, and collapsing
 * them would have hidden it:
 *
 *   P0-SCIENCE-04   a Biotic verdict        → a colour
 *   P0-SCIENCE-05   a self-reported tap     → a point on the body
 *
 * The second needs no Biotic to be a prohibited claim. Lighting a named
 * anatomical position from a checkbox asserts a bodily response to that
 * checkbox, which is what "YOUR BODY JUST FELT THAT" then says in words.
 */
const ANATOMICAL_COORDINATE = /\bnode\s*:\s*\{\s*x\s*:/

/**
 * Modules that map a Biotic to something a person sees.
 *
 * Deliberately NOT derived from an import closure: the question is which
 * modules PRODUCE visual parameters, and that is a judgement about intent that
 * a closure cannot make. The list is small, and 0R-2's coverage derivation
 * (`biotic-claims.test.ts`) is what stops a new one hiding.
 */
const VISUAL_MODULES = [
  "lib/account/twin-visual.ts",
  "lib/account/ritual.ts",
  "lib/account/system-map.ts",
  "lib/account/stage-mood.ts",
  "components/account/twin/twin-stage.tsx",
  "components/account/twin/daily-ritual.tsx",
  /*
   * ── ADDED AT 0R-5 ───────────────────────────────────────────────────────
   *
   * `lib/account/meal-impact.ts` produces the visual parameters for the
   * QuickLog result and the Meal Reveal: a chip colour and a band level, both
   * keyed off a per-Biotic score. `meal-impact.tsx` is the renderer that turns
   * that level into "Strong lift" and a glow.
   *
   * Neither was in this list, and neither was in the Experience 0 register as
   * its own finding — `biotic-claims.test.ts`'s ledger found the producer by
   * its effect STRING and recorded it as `P0-SCIENCE-05`'s second producer.
   * The mapping beside that string was never named.
   */
  "lib/account/meal-impact.ts",
  "components/account/twin/meal-impact.tsx",
  /*
   * FOUND BY SABOTAGE CASE 1493, WHILE WRITING IT.
   *
   * `quick-log.tsx` rendered three per-Biotic rows — label, score, colour and a
   * bar whose width was the score — from `BIOTIC_META`. It was repaired as
   * `P0-SCIENCE-01`'s seventh site, and then the case that restores its
   * contract had nothing to fail against, because the file was in no instrument
   * at all. A repair without an instrument is a repair that lasts until the
   * next edit.
   */
  "components/account/twin/quick-log.tsx",
  /*
   * ── ADDED AT 0R-6 · THE COVERAGE GAP 0R-5 CREATED ON THE MONEY PATH ──────
   *
   * 0R-5 made the Biotic→visual flow structurally unavailable on the Twin and
   * widened this file's sinks from colour to extent. The report family was in
   * no entry here, so the identical construct stayed live on the PAID path:
   *
   *     build-food-system-report.ts:518
   *       primaryAccent: bioticAccent(priorityPathway)
   *
   * `priorityPathway` is `orderedByNeed(biotics)[0][0]` — an argmin over the
   * member's three Biotic scores — so the paid Report's accent colour IS a
   * comparative personal Biotic verdict. 0R-5 secured the Twin and left the
   * money path open: the kind of gap a tranche's own scoping creates, which
   * only the next tranche's trace finds.
   *
   * SCOPED TO THE DERIVATION, NOT TO `bioticAccent` ITSELF.
   * `lib/report/visual-token.ts` and `components/report/food-system-section.tsx`
   * colour all three pathways symmetrically, which is education — the same
   * distinction 0R-5 drew for `system-map.ts`'s static hotspot tone. What is
   * prohibited is a RANKED key choosing a colour.
   */
  "lib/report/build-food-system-report.ts",
]

/* ── THE 0R-2 INVENTORY — EMPTIED AND DELETED AT 0R-5 ────────────────────────
 *
 * 0R-2 opened this file with four inventoried encodings and the same contract
 * as `EXPOSED_AT_0R1`: an entry may exist only while its defect does, the list
 * may only shrink, and 0R-5 deletes it. They were:
 *
 *   lib/account/twin-visual.ts                     a Biotic chooses a colour
 *   components/account/twin/twin-stage.tsx         a Biotic chooses a colour
 *   lib/account/ritual.ts                          a self-report tap lights an
 *   components/account/twin/twin-stage.tsx           anatomical coordinate
 *
 * 0R-5 repaired all four, so the inventory is gone rather than emptied: a
 * zero-length allowlist with its branches still wired is an invitation to add a
 * fifth. The assertions below are now unconditional, which is the whole point
 * of the exercise.
 *
 * WHAT REPLACES THE INVENTORY'S ONE LOAD-BEARING PROPERTY. The membership test
 * (sabotage 1461) existed because `it.each(VISUAL_MODULES)` only examines what
 * the list names: dropping `twin-stage.tsx` from `VISUAL_MODULES` removed the
 * worst encoding in the product from the instrument and broke nothing. With no
 * inventory to cross-check against, that hole is closed by pinning the module
 * set itself — a module may be ADDED, never silently removed.
 */
const MODULES_AT_0R5_CLOSE = [
  "components/account/twin/daily-ritual.tsx",
  "components/account/twin/meal-impact.tsx",
  "components/account/twin/twin-stage.tsx",
  "lib/account/meal-impact.ts",
  "lib/account/ritual.ts",
  "lib/account/stage-mood.ts",
  "lib/account/system-map.ts",
  "lib/account/twin-visual.ts",
  "components/account/twin/quick-log.tsx",
  // 0R-6 · the paid Report, added with the money-path coverage gap above.
  "lib/report/build-food-system-report.ts",
] as const

/*
 * ── AND THE PIN ITSELF MUST NOT BE EMPTIABLE — SABOTAGE 1462 ───────────────
 *
 * `MODULES_AT_0R5_CLOSE` replaced the deleted inventory as the thing that stops
 * a module leaving the instrument, and on its first run it inherited the
 * inventory's old weakness in a new shape: the test iterates the pin, so
 * emptying the pin makes the test pass over zero entries. Case 1462 — repointed
 * from the cap it used to raise — does exactly that, and slipped.
 *
 * Fixed with the contract this repository has now applied three times: a
 * LITERAL that must EQUAL the list. Emptying the list fails (9 ≠ 0); lowering
 * the literal fails (the list is still 9). Neither single edit gets through.
 */
const PINNED_MODULES_AT_0R5_CLOSE = 10

/* ── THE 0R-6 BLOCKED INVENTORY ──────────────────────────────────────────────
 *
 * 0R-5 deleted this file's inventory because all four of its entries were
 * repaired, and said so: "a zero-length allowlist with its branches still
 * wired is an invitation to add a fifth." 0R-6 re-introduces exactly one entry,
 * and the justification is different in kind — this is not debt nobody got to,
 * it is debt that CANNOT be repaired inside this tranche.
 *
 *   lib/report/build-food-system-report.ts:518
 *     primaryAccent: bioticAccent(priorityPathway)
 *
 * `priorityPathway` is `orderedByNeed(biotics)[0][0]` — an argmin over the
 * member's three Biotic scores — so the paid Report's accent colour is a
 * comparative personal Biotic verdict encoded as colour. It is the Report
 * analogue of `P0-SCIENCE-04`, which 0R-5 closed on the Twin, and it is folded
 * into `P0-SCIENCE-06` as another site of one construct: one unsupported
 * personal inference may have textual, behavioural and visual outputs, and
 * those outputs remain manifestations of the same construct.
 *
 * It is held because retiring `priorityPathway` requires a selection source
 * the repository does not have — the FSS-v1 weights refuse to score outside a
 * DEV_ONLY fixture context, and the deterministic Report core is
 * pre-activation with Migrations 48/49 unapplied. See the long note in
 * `tests/unit/agent-loop-claims.test.ts`.
 *
 * SAME CONTRACT AS EVERY INVENTORY IN THIS REPOSITORY: an entry may exist only
 * while its defect does, the list may only shrink, and the cap EQUALS the list.
 */
const BLOCKED_AT_0R6: readonly [file: string, why: string][] = [
  ["lib/report/build-food-system-report.ts", "a ranked Biotic chooses the paid Report's accent colour"],
]
const BLOCKED_ENTRIES_AT_0R6 = 1

describe("0R-2 · a Biotic may not flow into a visual encoding", () => {
  it.each(VISUAL_MODULES)("%s maps no Biotic to a visual parameter", (file) => {
    const src = source(file)
    const derived = BIOTIC_DERIVED.filter(([, re]) => re.test(src)).map(([w]) => w)
    const sinks = VISUAL_SINKS.filter(([, re]) => re.test(src)).map(([w]) => w)
    const flows = derived.length > 0 && sinks.length > 0

    const blocked = BLOCKED_AT_0R6.find(([f]) => f === file)
    if (blocked) {
      expect(
        flows,
        `${file} is in BLOCKED_AT_0R6 — "${blocked[1]}" — and no longer maps a ` +
          `Biotic to a visual parameter. The defect is GONE: DELETE the entry ` +
          `and drop the cap to match.`,
      ).toBe(true)
      return
    }

    expect(
      flows,
      `${file} maps ${derived.join(" + ")} onto ${sinks.join(" + ")}. ` +
        `A claim is still a claim when it is encoded through colour, motion, ` +
        `anatomy, position or scale rather than words.`,
    ).toBe(false)
  })

  it.each(VISUAL_MODULES)("%s attaches no anatomical coordinate to self-report", (file) => {
    expect(
      ANATOMICAL_COORDINATE.test(source(file)),
      `${file} attaches a point on the member's body to something they reported. ` +
        `Nothing in that chain is measured.`,
    ).toBe(false)
  })

  /*
   * ── A MODULE MAY BE ADDED, NEVER SILENTLY REMOVED ────────────────────────
   *
   * The successor to the membership test the inventory used to anchor. Sabotage
   * 1461 dropped `twin-stage.tsx` from `VISUAL_MODULES` and nothing failed,
   * because `it.each` examines only what the list names. The inventory caught
   * that by cross-reference; with the inventory gone, the list is pinned
   * directly.
   */
  it("the blocked inventory may only shrink, and carries no headroom", () => {
    expect(
      BLOCKED_AT_0R6.length,
      "a NEW blocked visual encoding is a regression, not debt to record",
    ).toBeLessThanOrEqual(BLOCKED_ENTRIES_AT_0R6)
    expect(
      BLOCKED_ENTRIES_AT_0R6,
      `BLOCKED_ENTRIES_AT_0R6 is ${BLOCKED_ENTRIES_AT_0R6} while the inventory ` +
        `holds ${BLOCKED_AT_0R6.length}. It moves DOWN only, with the repair.`,
    ).toBe(BLOCKED_AT_0R6.length)
  })

  it("every blocked file is still a module under test", () => {
    // The sabotage-1461 lesson: an inventoried file that leaves VISUAL_MODULES
    // leaves the instrument, and the inventory would still read one.
    for (const [file] of BLOCKED_AT_0R6) {
      expect(VISUAL_MODULES, `${file} is inventoried but not under test`).toContain(file)
    }
  })

  it("no module leaves the instrument", () => {
    expect(
      MODULES_AT_0R5_CLOSE.length,
      `the pin holds ${MODULES_AT_0R5_CLOSE.length} modules and the literal says ` +
        `${PINNED_MODULES_AT_0R5_CLOSE}. Emptying the pin would make the loop ` +
        `below iterate nothing and pass — which is what sabotage 1462 does.`,
    ).toBe(PINNED_MODULES_AT_0R5_CLOSE)

    for (const file of MODULES_AT_0R5_CLOSE) {
      expect(
        VISUAL_MODULES,
        `${file} was under this instrument at the 0R-5 close and is not any ` +
          `more. Removing a file from the instrument is not the same as ` +
          `repairing it.`,
      ).toContain(file)
    }
  })

  /*
   * ── NON-VACUITY ──────────────────────────────────────────────────────────
   *
   * The instrument is proved against a module that genuinely maps a Biotic to a
   * colour and one that genuinely does not, because a data-flow guard that
   * matched nothing would pass in exactly the way `P0-SCIENCE-04` survived four
   * claim sweeps.
   */
  /*
   * ── NON-VACUITY, AGAINST THE SHAPES THAT SHIPPED ─────────────────────────
   *
   * 0R-2 proved this instrument by pointing it at `lib/account/twin-visual.ts`
   * and asserting it fired, which was right at the time: the file genuinely
   * mapped a Biotic to a colour. 0R-5 repaired it, so that proof now fails for
   * the best possible reason — and a guard proved against a FIXED file proves
   * only that the file is fixed.
   *
   * So the subjects are the four real pre-repair source lines, held as
   * literals. They exist nowhere in the tree any more; these strings ARE the
   * regressions. Same contract as `PRE_REPAIR` in
   * `live-dashboard-fabrication.test.ts`.
   */
  const PRE_REPAIR: readonly [why: string, shape: string][] = [
    [
      "P0-SCIENCE-04 · the weakest Biotic chose the stage aura (twin-stage.tsx:284)",
      "      : auraGradientForBiotic(twin.biotics.weakest, visual.confidence)",
    ],
    [
      "P0-SCIENCE-04 · the strongest Biotic computed TwinVisualState.auraGradient",
      "    auraGradient: auraGradientForBiotic(twin.biotics.strongest, confidence),",
    ],
    [
      "the signature that let either of them through",
      "export function auraGradientForBiotic(biotic: BioticKey, intensity = 0.6): string {",
    ],
    /*
     * This subject exists so the PER-BIOTIC SCORE rule has a case of its own.
     * Found while writing sabotage 1507: nulling that rule broke nothing,
     * because every other subject here also carries a `BioticKey` or a
     * `weakest`/`strongest` read, so the older rules covered them. The
     * meal-impact row is the one real shape whose only Biotic read is the score
     * itself.
     */
    [
      "P0-SCIENCE-05 · a per-Biotic score chose a band and a chip colour (meal-impact.ts)",
      '    level: probioticBoost ? "strong" : levelFor(input.probiotic_score),\n    color: TEAL,',
    ],
    /*
     * MALFORMED ON ITS FIRST RUN, AND CORRECTED RATHER THAN THE RULE WEAKENED.
     *
     * Written as the bar's `style` line alone, which carries no Biotic read:
     * `score` is a bare parameter, and what made it a Biotic was the SIGNATURE
     * and the CALL SITE, two other lines. These rules evaluate a whole file for
     * co-occurrence, so a one-line subject tests something the instrument never
     * claimed. The case now holds the three lines that together were the
     * defect — which is also how the rule reads the real file.
     *
     * Fixing the case is also what exposed the plural gap in the rule above, so
     * the two corrections are not independent: a malformed case found a real
     * hole.
     */
    /*
     * EXTENT-ONLY, AND DELIBERATELY SO — found by sabotage 1506.
     *
     * Nulling the extent sink broke nothing, because every other subject here
     * also carries a colour word: the full `BioticBar` shape below has
     * `backgroundColor`, so the colour sink covered it and the new sink was
     * never load-bearing in the proof.
     *
     * This subject is the same real shape with the colour declaration dropped,
     * so the ONLY sink in it is the bar's width. It is a trimmed shape rather
     * than a line that ever shipped, and it is labelled as such; the untrimmed
     * version is the next entry.
     */
    [
      "the extent sink alone — a per-Biotic bar width with no colour beside it",
      [
        "function BioticBar({ biotic, score, delay }: { biotic: BioticKey; score: number; delay: number }) {",
        'style={{ width: `${Math.max(4, Math.min(100, score))}%` }}',
      ].join("\n"),
    ],
    [
      "P0-SCIENCE-01 · a per-Biotic score drove a named bar's width (twin-stage.tsx BioticBar)",
      [
        "function BioticBar({ biotic, score, delay }: { biotic: BioticKey; score: number; delay: number }) {",
        'style={{ width: `${Math.max(4, Math.min(100, score))}%`, backgroundColor: c }}',
        "<BioticBar biotic=\"prebiotics\" score={twin.biotics.prebiotics.score} delay={700} />",
      ].join("\n"),
    ],
  ]

  it.each(PRE_REPAIR)("NON-VACUITY: the rules refuse the shape that shipped — %s", (_why, shape) => {
    const derived = BIOTIC_DERIVED.some(([, r]) => r.test(shape))
    const sink = VISUAL_SINKS.some(([, r]) => r.test(shape))
    expect(derived || ANATOMICAL_COORDINATE.test(shape), `no Biotic read found in: ${shape}`).toBe(true)
    expect(sink, `no visual sink found in: ${shape}`).toBe(true)
  })

  it("NON-VACUITY: the anatomical shapes that shipped are still refused", () => {
    for (const shape of [
      '{ key: "fermented", label: "Fermented food", node: { x: 54, y: 56 } }',
      "signals?: Array<{ key: string; node: { x: number; y: number }; color: string }>",
    ]) {
      expect(ANATOMICAL_COORDINATE.test(shape), `missed: ${shape}`).toBe(true)
    }
  })

  it("NON-VACUITY: the guard does not fire on education", () => {
    // `lib/pillars.ts` is the canonical education module: Biotic vocabulary,
    // no member data, no visual parameter. It must NOT fire.
    const clean = source("lib/pillars.ts")
    expect(
      BIOTIC_DERIVED.some(([, r]) => r.test(clean)) && VISUAL_SINKS.some(([, r]) => r.test(clean)),
      "the guard fires on education — it is over-broad",
    ).toBe(false)
  })

  it("NON-VACUITY: the anatomical-coordinate rule catches the real shape", () => {
    expect(ANATOMICAL_COORDINATE.test('{ key: "fermented", node: { x: 54, y: 56 } }')).toBe(true)
    expect(ANATOMICAL_COORDINATE.test("const node = findDomNode(ref)")).toBe(false)
  })
})
