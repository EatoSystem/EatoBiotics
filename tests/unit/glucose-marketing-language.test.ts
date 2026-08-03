import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Glucose marketing language guard.
 *
 * Phases 6 and 6.1 held the assessment *result* copy to one standard: describe
 * the habits someone reported, never the body; no claimed measurement, no
 * promised outcome, no timeline. The pages that sell the assessment were never
 * swept, so a visitor read "Steady your glucose system in 30 days" on the way
 * in and a hedged, answers-based report on the way out.
 *
 * These four files are the whole /glucose marketing surface: the two pages and
 * the two components they render copy from. hero.tsx is included because the
 * page's loudest claim lived there, not in the page file — a guard scoped to
 * app/glucose/** would have passed while the H1 still promised results in 30
 * days.
 *
 * The standard these assert is the one already written down in
 * lib/assessment-disclaimers.ts:16 — "This is a glucose-supportive behavior
 * score. It does not measure blood glucose." The page used to contradict it in
 * four places.
 */

const PAGES = ["app/glucose/page.tsx", "app/glucose/glp1/page.tsx"] as const
const COMPONENTS = [
  "components/eatobetics/home/hero.tsx",
  "components/eatobetics/EbFramework.tsx",
] as const

/**
 * The medical disclaimers are the one place "diagnose, treat, cure, or prevent"
 * is correct, so they are split off and checked separately rather than
 * exempted by a pattern — an exemption pattern would also excuse those words
 * anywhere else on the page.
 */
const DISCLAIMER_SECTION = /\{\/\*[^*]*disclaimer[\s\S]*$/i

function readSource(relPath: string): string {
  return readFileSync(join(process.cwd(), relPath), "utf8")
}

/**
 * Source → the customer-facing prose, as one whitespace-normalised string.
 *
 * Normalising across newlines is the load-bearing part. "could steady your
 * curve within weeks." was spread over three source lines, so a per-line or
 * per-JSX-fragment matcher could not see it and would have passed while the
 * claim shipped. Every phrase rule below depends on this join.
 *
 * className/style values are dropped first: they are not copy, and leaving
 * them in would force the general `will <verb>` rule to be narrowed to a verb
 * list to tolerate a CSS `will-change`. Narrowing a general rule to a list is
 * exactly what let claims through in #196 and #197.
 */
function copyOf(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*import\s/.test(line))
    .join(" ")
    .replace(/style=\{\{[\s\S]*?\}\}/g, " ")
    .replace(/className=(?:"[^"]*"|\{[^}]*\})/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Everything before the medical disclaimer — the copy the rules apply to. */
function marketingCopy(relPath: string): string {
  return copyOf(readSource(relPath).replace(DISCLAIMER_SECTION, ""))
}

/**
 * One list, applied to every file. Per-file exemptions are how a guard drifts
 * into covering less than its name says.
 */
const CLAIMS: Array<[string, RegExp]> = [
  // Timelines. "30-day plan" is a product fact and stays legal; "in 30 days"
  // and "within weeks" attached to a result do not.
  ["result within a timeframe", /within (a few )?(days|weeks|months)/i],
  ["result in N days/weeks", /\bin (just )?\d+ (days|weeks)\b/i],
  ["results by a deadline", /\b(to|for) results\b/i],
  // Promises.
  ["promise", /\bwill \w+/i],
  ["guarantee", /\b(guarantee|guaranteed|proven to)\b/i],
  // The claim this whole surface most needs to never make. Nothing else in
  // this list would catch "prevents diabetes" — the disclaimer is split off
  // above, so these words are illegal everywhere the reader is being sold to.
  // ("PREVENTION" as a section label survives: \b fails before "ion".)
  ["medical claim", /\b(treats?|cures?|prevents?|reverses?)\b/i],
  ["measurable difference", /measurable difference/i],
  ["outcome ownership", /(protects?|protecting) your results/i],
  ["durability promise", /so the results last/i],
  // Claimed measurement of a physiological value.
  ["claims to measure glucose", /measures? how steadily your glucose/i],
  ["glucose as a measured quantity", /your glucose (rhythm|response|curve|level)/i],
  ["acts on the curve", /(smooth|flatten|steady|soften)(s|ing)? (your|the) (curve|glucose)/i],
  ["steadies glucose", /steadies glucose/i],
  ["handles glucose", /handle the glucose/i],
  // Asserting the reader's state rather than their habits.
  ["asserts the reader's state", /working in your favour/i],
  ["states a fact about the body", /\bYou have\b/],
  // Superlatives that outrun the evidence.
  ["superlative", /\b(number-one|single biggest|fastest way|big difference)\b/i],
]

function assertClean(copy: string, where: string) {
  for (const [name, pattern] of CLAIMS) {
    expect(copy, `${where} — ${name}`).not.toMatch(pattern)
  }
}

describe("glucose marketing pages hold the Phase 6 language standard", () => {
  /**
   * Extraction floors. Without these, a regex that silently stopped matching —
   * a renamed attribute, a moved disclaimer marker — would empty the string and
   * every assertion below would pass on nothing. Same reason the protocol guard
   * asserts its iteration count.
   */
  const FLOORS: Record<string, [number, string]> = {
    "app/glucose/page.tsx": [4000, "The 3 Pillars"],
    "app/glucose/glp1/page.tsx": [3000, "Keep the "],
    "components/eatobetics/home/hero.tsx": [400, "Glucose Assessment"],
    "components/eatobetics/EbFramework.tsx": [200, "Glucose Score"],
  }

  it("extracts real copy from every file before asserting anything about it", () => {
    for (const f of [...PAGES, ...COMPONENTS]) {
      const copy = marketingCopy(f)
      const [minLength, anchor] = FLOORS[f]
      expect(copy.length, `${f} extracted only ${copy.length} chars`).toBeGreaterThan(minLength)
      expect(copy, `${f} is missing its anchor phrase`).toContain(anchor)
    }
  })

  it("makes no claim, promise or timeline on any glucose marketing surface", () => {
    for (const f of [...PAGES, ...COMPONENTS]) {
      assertClean(marketingCopy(f), f)
    }
  })

  it("keeps both medical disclaimers, which are the one legal use of those words", () => {
    for (const f of PAGES) {
      const source = readSource(f)
      const match = source.match(DISCLAIMER_SECTION)
      expect(match, `${f} has no disclaimer section`).not.toBeNull()

      const disclaimer = copyOf(match![0])
      expect(disclaimer, f).toMatch(/does not diagnose, treat, cure, or prevent/i)
      expect(disclaimer, f).toMatch(/qualified healthcare professional/i)
      // The disclaimer is the last section: nothing markets after the warning.
      expect(source.indexOf(match![0]), f).toBeGreaterThan(source.length * 0.8)
    }
  })

  it("states plainly that the Glucose Score is not a blood-glucose measurement", () => {
    // The positive half of the rule. Removing the claims is not enough if the
    // page still leaves a reader thinking the score reads their blood.
    expect(marketingCopy("app/glucose/page.tsx")).toMatch(/does not measure blood glucose/i)
  })

  it("still describes the 30-day plan, which is a product fact and not a promise", () => {
    // Guards against over-correction: the rewrite should remove the deadline on
    // the *result*, not the plan length the product actually ships.
    expect(marketingCopy("app/glucose/page.tsx")).toMatch(/30-day plan/i)
  })
})
