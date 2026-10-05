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
] as const

/**
 * Functions and fields whose output a person SEES as visual state.
 *
 * Named for what they produce rather than for where they live, because the
 * defect is the mapping and not the module.
 */
const VISUAL_SINKS = [
  ["a colour or gradient", /\b(?:\w*[Gg]radient\w*|\w*[Cc]olou?r\w*|\w*[Tt]int\w*|\w*[Aa]ura\w*)\b/],
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
]

/* ── THE 0R-2 INVENTORY ──────────────────────────────────────────────────────
 *
 * Same contract as `EXPOSED_AT_0R1`: an entry is only allowed to exist while
 * its defect does, and the list MAY ONLY SHRINK. Both are deleted by 0R-5.
 */
const EXPOSED_VISUAL_ENCODINGS: readonly [file: string, why: string][] = [
  // P0-SCIENCE-04. `auraGradientForBiotic(twin.biotics.weakest, …)` →
  // twin-stage.tsx:284, applied at :330-331 as the breathing aura.
  ["lib/account/twin-visual.ts", "a Biotic chooses a colour"],
  ["components/account/twin/twin-stage.tsx", "a Biotic chooses a colour"],
  // P0-SCIENCE-05. RITUAL_CHECKS carries `node: { x, y }` per check, lit on the
  // body figure under "YOUR BODY JUST FELT THAT".
  ["lib/account/ritual.ts", "a self-report tap lights an anatomical coordinate"],
  /*
   * FOUND BY THIS GUARD, NOT BY THE AUDIT.
   *
   * `twin-stage.tsx:243` declares `signals?: Array<{ key; node: { x; y }; color }>`
   * — the consumer side of `ritualSignals()`. The register recorded
   * `P0-SCIENCE-05` at the producer (`ritual.ts`) and at the rendered copy; the
   * PROP CONTRACT that carries a body coordinate between them was not named.
   *
   * Recorded here rather than quietly folded in, because a guard finding a site
   * its author missed is the only evidence that it is doing more than restating
   * what was already known.
   */
  ["components/account/twin/twin-stage.tsx", "a self-report tap lights an anatomical coordinate"],
]
const VISUAL_ENTRIES_AT_OPEN = 4

describe("0R-2 · a Biotic may not flow into a visual encoding", () => {
  it.each(VISUAL_MODULES)("%s maps no Biotic to a visual parameter", (file) => {
    const src = source(file)
    const inventoried = EXPOSED_VISUAL_ENCODINGS.some(
      ([f, w]) => f === file && w === "a Biotic chooses a colour",
    )
    const derived = BIOTIC_DERIVED.filter(([, re]) => re.test(src)).map(([w]) => w)
    const sinks = VISUAL_SINKS.filter(([, re]) => re.test(src)).map(([w]) => w)
    const flows = derived.length > 0 && sinks.length > 0

    if (inventoried) {
      expect(
        flows,
        `${file} is in EXPOSED_VISUAL_ENCODINGS but no longer maps a Biotic to a ` +
          `visual parameter. The defect is GONE — DELETE the inventory entry.`,
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
    const hit = ANATOMICAL_COORDINATE.test(source(file))
    const inventoried = EXPOSED_VISUAL_ENCODINGS.some(
      ([f, w]) => f === file && w === "a self-report tap lights an anatomical coordinate",
    )
    if (inventoried) {
      expect(
        hit,
        `${file} is inventoried for an anatomical coordinate and no longer carries ` +
          `one. The defect is GONE — DELETE the inventory entry.`,
      ).toBe(true)
      return
    }
    expect(
      hit,
      `${file} attaches a point on the member's body to something they reported. ` +
        `Nothing in that chain is measured.`,
    ).toBe(false)
  })

  it("the inventory may only shrink, and carries no headroom", () => {
    expect(
      EXPOSED_VISUAL_ENCODINGS.length,
      "a NEW visual encoding of a Biotic is a regression, not debt to record",
    ).toBeLessThanOrEqual(VISUAL_ENTRIES_AT_OPEN)

    // Same reasoning as `ENTRIES_AT_0R1_OPEN` in `biotic-claims.test.ts`, and
    // the same sabotage case shape: `<=` alone leaves room for one new
    // encoding once a repair shortens the list. Sabotage 1462 raises this
    // constant, and slipped until the equality below existed.
    expect(
      VISUAL_ENTRIES_AT_OPEN,
      `VISUAL_ENTRIES_AT_OPEN is ${VISUAL_ENTRIES_AT_OPEN} while the inventory ` +
        `holds ${EXPOSED_VISUAL_ENCODINGS.length}. It moves DOWN only, with the ` +
        `repair.`,
    ).toBe(EXPOSED_VISUAL_ENCODINGS.length)
  })

  /*
   * ── AN INVENTORIED FILE MUST STILL BE UNDER TEST ────────────────────────────
   *
   * The second weak test sabotage found in this file. `it.each(VISUAL_MODULES)`
   * only examines what the list names, so dropping `twin-stage.tsx` from
   * `VISUAL_MODULES` while leaving it in `EXPOSED_VISUAL_ENCODINGS` removed the
   * file from the instrument and broke nothing: the inventory still read four,
   * every remaining module still passed, and the worst visual encoding in the
   * product stopped being looked at. Sabotage 1461 is exactly that mutation.
   *
   * So membership is asserted both ways round. The inventory is the record of
   * what is wrong; this is what keeps the record pointed at something.
   */
  it("every inventoried file is still a module under test", () => {
    for (const [file] of EXPOSED_VISUAL_ENCODINGS) {
      expect(
        VISUAL_MODULES,
        `${file} is inventoried as a known visual encoding but is not in ` +
          `VISUAL_MODULES, so no assertion in this file examines it. Removing a ` +
          `file from the instrument is not the same as repairing it.`,
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
  it("NON-VACUITY: the guard fires on the real mapping and not on education", () => {
    const dirty = source("lib/account/twin-visual.ts")
    expect(BIOTIC_DERIVED.some(([, r]) => r.test(dirty)), "no Biotic read found").toBe(true)
    expect(VISUAL_SINKS.some(([, r]) => r.test(dirty)), "no visual sink found").toBe(true)

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
