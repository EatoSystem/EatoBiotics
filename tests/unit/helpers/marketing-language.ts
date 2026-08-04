import { expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Shared machinery for the marketing-language guards.
 *
 * Phases 6 and 6.1 held the assessment *result* copy to one standard: describe
 * the habits someone reported, never the body; no claimed measurement, no
 * promised outcome, no timeline. #198 extended it to the /glucose sales pages;
 * the You pages followed. Both guards import from here.
 *
 * ── Why one module rather than a copy per surface ────────────────────────────
 *
 * #198's guard covered the glucose surface only, and `{ num: "30 days", label:
 * "To results" }` sat untouched on the You hero the whole time — the identical
 * pattern, on a file no rule looked at. Two lists drift, and the gap is always
 * discovered later than it was created. With one list, a rule added for one
 * surface immediately protects the others, which is the point.
 *
 * NOTE: this file lives under tests/ but is deliberately not named *.test.ts —
 * vitest's include is tests/**\/*.test.ts, so it is importable without being
 * collected as a suite of its own.
 */

/**
 * The medical disclaimers are the one place "diagnose, treat, cure, or prevent"
 * is correct, so they are split off and checked separately rather than
 * exempted by a pattern — an exemption pattern would also excuse those words
 * anywhere else on the page.
 *
 * Optional by design: some pages carry a disclaimer section, and a file without
 * one simply keeps its whole body.
 */
export const DISCLAIMER_SECTION = /\{\/\*[^*]*disclaimer[\s\S]*$/i

export function readSource(relPath: string): string {
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
 *
 * Block comments go too, for the same reason. Developer notes are not copy, and
 * leaving them in produced two false positives on the /mind and /stability
 * sweep: a `MindFramework` comment describing the gut-brain axis, and a
 * `StabilityScoreShowcase` comment saying the bands are "driven entirely by the
 * shared scoring constant" — a sentence about code, matched by a rule about
 * bodies. Nothing had failed because of this yet, which is the point of fixing
 * it before something does.
 *
 * Only block comments: a naive `//` strip would eat the rest of any line
 * containing a URL.
 */
export function copyOf(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*import\s/.test(line))
    .join(" ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/style=\{\{[\s\S]*?\}\}/g, " ")
    .replace(/className=(?:"[^"]*"|\{[^}]*\})/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Everything before the medical disclaimer — the copy the rules apply to. */
export function marketingCopy(relPath: string): string {
  return copyOf(readSource(relPath).replace(DISCLAIMER_SECTION, ""))
}

/**
 * One list, applied to every marketing surface. Per-file exemptions are how a
 * guard drifts into covering less than its name says.
 *
 * Rules are written as general shapes wherever possible rather than as lists of
 * known-bad phrases. That is not tidiness: the `\w+s your <body noun>` rule
 * below found "influences your energy … more than almost any other factor you
 * can control" on the You page, a line no keyword sweep had flagged.
 */
export const CLAIMS: Array<[string, RegExp]> = [
  // Timelines. "30-day plan" is a product fact and stays legal; "in 30 days"
  // and "within weeks" attached to a result do not.
  ["result within a timeframe", /within (a few )?(days|weeks|months)/i],
  ["result in N days/weeks", /\bin (just )?\d+ (days|weeks)\b/i],
  ["results by a deadline", /\b(to|for) results\b/i],
  // Promises.
  ["promise", /\bwill \w+/i],
  ["guarantee", /\b(guarantee|guaranteed|proven to)\b/i],
  // The claim these surfaces most need to never make. Nothing else in this list
  // would catch "prevents diabetes" — the disclaimer is split off above, so
  // these words are illegal everywhere the reader is being sold to.
  // ("PREVENTION" as a section label survives: \b fails before "ion".)
  ["medical claim", /\b(treats?|cures?|prevents?|reverses?)\b/i],
  ["measurable difference", /measurable difference/i],
  ["outcome ownership", /(protects?|protecting) your results/i],
  ["durability promise", /so the results last/i],
  // Acting on the reader's body. Any verb, not a list of the ones already seen.
  ["acts on the body", /\b\w+s your (energy|immunity|mood|digestion|microbiome|health)\b/i],
  // Attributing a whole system to a single cause.
  ["absolute attribution", /\b(entirely|solely|purely) (by|from|shaped|determined|driven)\b/i],
  // Claimed measurement — of a physiological value, or of the reader's system.
  ["claims to be a measurement", /\b(single|one) measure of\b/i],
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
  ["comparative superlative", /more than (almost )?any other/i],
]

export function assertClean(copy: string, where: string) {
  for (const [name, pattern] of CLAIMS) {
    expect(copy, `${where} — ${name}`).not.toMatch(pattern)
  }
}

/**
 * Extraction floors. Without these, a regex that silently stopped matching — a
 * renamed attribute, a moved disclaimer marker — would empty the string and
 * every assertion would pass on nothing. Same reason the protocol guard in
 * assessment-language.test.ts asserts its iteration count.
 */
export function assertExtractionFloor(
  relPath: string,
  minLength: number,
  anchor: string,
) {
  const copy = marketingCopy(relPath)
  expect(copy.length, `${relPath} extracted only ${copy.length} chars`).toBeGreaterThan(
    minLength,
  )
  expect(copy, `${relPath} is missing its anchor phrase`).toContain(anchor)
}
