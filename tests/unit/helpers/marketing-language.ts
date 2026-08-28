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
 * Line comments go too, but they have to be stripped *per line, before the
 * join* — after the join a single `//` would eat the rest of the file. The
 * #204 note about URLs still stands, so `//` only counts as a comment when it
 * is not preceded by a colon: `https://…` survives, `// treat as free` does not.
 *
 * Honest note on this one: it currently removes zero hits from the corpus. It
 * was added for `// Fail closed: … treat as free` in
 * app/stability/insights/page.tsx, but the "treats X as Y" lookahead below
 * silences that independently — measured by reverting each fix separately. It
 * stays because a `//` comment is definitionally not customer copy, the same
 * reasoning that added the block-comment strip in #204 before anything had
 * failed. Proved directly in marketing-language-corpus.test.ts instead, since
 * the corpus cannot prove it.
 *
 * Method calls go as well. `[...SCORE_BANDS].reverse()` in app/method/page.tsx
 * registered as the medical claim "reverse": code, matched by a rule about
 * bodies. Stripping `.word(` kills the class rather than the instance, and
 * prose effectively never contains that shape.
 *
 * All three strips exist because the rules were tuned against 17 hand-picked
 * marketing files. Pointed at the rest of the site they fire on ordinary code
 * and ordinary English, and a guard that cries wolf gets deleted.
 */
export function copyOf(source: string): string {
  return source
    .split("\n")
    .filter((line) => !/^\s*import\s/.test(line))
    .map((line) => line.replace(/(?<!:)\/\/.*$/, " "))
    .join(" ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\.\w+\(/g, " ")
    .replace(/style=\{\{[\s\S]*?\}\}/g, " ")
    .replace(/className=(?:"[^"]*"|\{[^}]*\})/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * The fixed legal denial string, which is a denial and not a claim.
 *
 * /help carries it in an FAQ answer — "It does not diagnose, treat, cure, or
 * prevent any medical condition" — outside any disclaimer section, so
 * DISCLAIMER_SECTION does not reach it. Neither does a `(?<!\bnot )`
 * lookbehind, because the "not" sits three words before "treat".
 *
 * Handled as a fixed phrase rather than a rule narrowing, which is honest: it
 * *is* a fixed phrase, the standard four-verb formula, and it appears only as
 * boilerplate. Flagging it would push an author to delete the clearest
 * non-claim on the page — the same reasoning as the #204 lookbehinds.
 */
export const DENIAL_BOILERPLATE =
  /\bdiagnose,?\s+treat,?(?:\s+cure,?)?(?:\s+(?:or\s+)?cure,?)?(?:\s+(?:or\s+)?prevent)?\b/gi

/** Everything before the medical disclaimer — the copy the rules apply to. */
export function marketingCopy(relPath: string): string {
  return copyOf(
    readSource(relPath).replace(DISCLAIMER_SECTION, "").replace(DENIAL_BOILERPLATE, " "),
  )
}

/* ── Result-by-a-deadline ─────────────────────────────────────────────────
 * Built from parts because the assembled expression is long, and a long
 * literal is a place bugs hide.
 *
 * This replaces two narrower rules that between them missed every numeric
 * form. `within (a few )?(days|weeks|months)` required the unit to follow
 * "within" immediately, so `within 3–4 weeks` walked past it; `in (just )?\d+
 * (days|weeks)` knew no months and no ranges. The gap was reported four times
 * — #198, #208, #210, #211 — and never closed. #211 made it *less* visible by
 * removing two instances as copy, which is why it is being fixed at the rule.
 *
 * The two removed rules are fully subsumed: their exact historical catches
 * ("could steady your curve within weeks", "in just 30 days") are asserted as
 * fixtures in marketing-language-timeframes.test.ts, so the merge cannot
 * quietly lose coverage.
 *
 * ── Why a negative guard rather than a positive one
 *
 * The obvious design is to require an outcome word near the deadline. It was
 * built and measured, and it is worse: it missed "you'll be transformed within
 * 6 weeks" and "could steady your curve within weeks" — the #198 claim —
 * because neither contains a noun any reasonable list would hold. A positive
 * list fails toward the false negative, which for a safety guard is the
 * expensive direction.
 *
 * So the rule fires on any deadline-shaped span and excludes the small closed
 * set of verbs whose deadline is administrative or a product function. That
 * keeps the general shape the house style asks for, and a surprise shows up as
 * a flag to classify rather than as silence.
 *
 * ── Three structural details, each load-bearing
 *
 * 1. Unnumbered spans must be PLURAL. "week after week" and "day after day"
 *    are reduplication idioms, not deadlines, and `after week` is not English
 *    as a deadline. Requiring plurality kills the class without naming it.
 * 2. Compounds like `30-day plan` never match: the hyphen binds the number to
 *    a singular noun, and the unnumbered branch demands a plural.
 * 3. The guard allows up to three words between verb and deadline, so
 *    "retake the assessment in 30 days" is as quiet as "retake in 30 days".
 */
const SPAN = String.raw`(?:(?:a few\s+|\d+\s*(?:[-–—]|\s+to\s+)\s*\d+\s*|\d+\s*)(?:days?|weeks?|months?)|(?:days|weeks|months))`
const INTENSIFIER = String.raw`(?:just|only|barely|as little as)\s+`
/** Deadlines that belong to an action, not to the reader's body or score. */
const NOT_A_CLAIM = String.raw`(?:cancel\w*|unsubscrib\w*|respond\w*|repl(?:y|ies|ying)|deliver\w*|ship\w*|arriv\w*|refund\w*|notif\w*|expir\w*|renew\w*|retest\w*|retake\w*|re-?test\w*|re-?take\w*|remind\w*|process\w*|dispatch\w*)`
const GUARD = String.raw`(?<!${NOT_A_CLAIM}\s)(?<!${NOT_A_CLAIM}\s(?:\w+\s){1,3})`
export const RESULT_DEADLINE = new RegExp(
  `${GUARD}\\b(?:within|in|after|by)\\s+(?:${INTENSIFIER})?${SPAN}` +
    `|${GUARD}\\bby\\s+day\\s+\\d+\\b`,
  "i",
)

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
  // and "within weeks" attached to a result do not. See RESULT_DEADLINE above
  // for why this one rule replaced the two narrower ones it grew out of.
  ["result within a timeframe", RESULT_DEADLINE],
  ["results by a deadline", /\b(to|for) results\b/i],
  // Promises.
  ["promise", /\bwill \w+/i],
  ["guarantee", /\b(guarantee|guaranteed|proven to)\b/i],
  // The claim these surfaces most need to never make. Nothing else in this list
  // would catch "prevents diabetes" — the disclaimer is split off above, so
  // these words are illegal everywhere the reader is being sold to.
  // ("PREVENTION" as a section label survives: \b fails before "ion".)
  // "treats" also means "regards as", and that is the house style on every
  // Health System page — "Longevity, as a Health System, treats ageing well as
  // an extension of the Food System you're already building". Four pages use
  // it (longevity, recovery, baby, performance) and none of them is making a
  // medical claim. The same-sentence lookahead for a following "as" excludes
  // that sense only; cures/prevents/reverses are unaffected, and "treats IBS"
  // still fires.
  [
    "medical claim",
    /\b(?:treats?(?![^.]{0,60}\bas\b)|cures?|prevents?|reverses?)\b/i,
  ],
  ["measurable difference", /measurable difference/i],
  ["outcome ownership", /(protects?|protecting) your results/i],
  ["durability promise", /so the results last/i],
  // Acting on the reader's body. Any verb, not a list of the ones already seen.
  ["acts on the body", /\b\w+s your (energy|immunity|mood|digestion|microbiome|health)\b/i],
  // Attributing a whole system to a single cause.
  ["absolute attribution", /\b(entirely|solely|purely) (by|from|shaped|determined|driven)\b/i],
  // Claimed measurement — of a physiological value, or of the reader's system.
  ["claims to be a measurement", /\b(single|one) measure of\b/i],
  // The rule above only caught one phrasing, so "designed to measure how
  // reliably your Food System performs" and "helps measure how..." shipped on
  // /stability under a rule whose name says it covers measurement claims.
  //
  // The lookbehind is load-bearing: these surfaces legitimately *deny*
  // measurement — "it does not measure blood glucose" on /glucose, "not a
  // clinical measurement" on /stability — and a rule that flagged the denial
  // would push authors to delete the safest sentence on the page.
  [
    "claims to measure",
    /(?<!\bnot )\b(?:(?:designed|built|intended|made) to measure|helps? (?:you )?measure|measures? how)\b/i,
  ],
  // "measurable difference" above is one phrase; the adverb is the general
  // form, and it is the stronger claim — "Food is mood — directly and
  // measurably" asserted on /you that the link is both causal and quantified.
  // Same lookbehind, for the same reason: "not measurably" is a denial, and
  // the honest version of a claim like this is exactly where it would appear.
  ["claims measurability", /(?<!\bnot )\bmeasurabl[ey]\b/i],
  // Identity claims: food *is* a body state. Shorter than any hedge and read
  // as literal, so "Food is mood" outruns the science it sits next to — gut
  // serotonin does not cross the blood-brain barrier, which is precisely what
  // the sentence implies. Bounded to a noun list so the far more common
  // "Food is the most powerful lever..." construction stays legal.
  [
    "food-as-body-state identity claim",
    /\b(?:food|diet|what you eat) is (?:your )?(?:mood|health|energy|immunity|medicine)\b/i,
  ],
  // Product vocabulary, and the other half of the /stability rework: if a
  // behaviour score is "not a clinical measurement", it cannot also be "the
  // measure at the heart of EatoBiotics". Noun form, so the verb rules above
  // never saw it.
  ["score described as a measure", /(?<!\bnot )\bthe measure (?:at|of|behind)\b/i],
  ["claims to measure glucose", /measures? how steadily your glucose/i],
  ["glucose as a measured quantity", /your glucose (rhythm|response|curve|level)/i],
  ["acts on the curve", /(smooth|flatten|steady|soften)(s|ing)? (your|the) (curve|glucose)/i],
  ["steadies glucose", /steadies glucose/i],
  ["handles glucose", /handle the glucose/i],
  // Asserting the reader's state rather than their habits.
  ["asserts the reader's state", /working in your favour/i],
  ["states a fact about the body", /\bYou have\b/],
  // Predicting how far someone's score will move. The strongest claim the
  // product can make and the one it has least standing to: the number is not
  // derived from anything — no cohort, no retest data, no study — and it was
  // being asserted to every lead on a daily cron ("a score improvement of 8–18
  // points within 30 days", "typically moves it 5–12 points").
  //
  // RESULT_DEADLINE caught the "within 30 days" half of one instance and
  // nothing at all when the timeframe was absent, so the quantity needs its own
  // rule. Zero legitimate uses in the tree: score BANDS are written "60-79" or
  // "60–79" without the word, and every real percentile is computed rather than
  // typed (see below).
  ["quantified score outcome", /\b\d+\s*[–—-]\s*\d+\s*points\b/i],
  // Invented social proof: "you're already in the top 20% of people who
  // actually act on their results" — flattering, unfalsifiable, and measured
  // against nothing.
  //
  // Deliberately NOT a bare /top \d+%/. The product has a real percentile
  // feature — score-ring.tsx renders `Top {100 - percentile}%` from
  // lib/percentile.ts, and assessment-results renders "Higher than
  // {percentile}% of people" — and those are honest statements about a score
  // distribution. Both are template expressions, so a hardcoded literal is
  // exactly what separates the invented statistic from the computed one, and
  // this rule fires only on the literal.
  ["invented population statistic", /\btop \d+ ?% of people\b/i],
  // `fastest way` used to live in the superlative rule below. It moved here, and
  // the move is the point: `fastest way\b` does not match "fastest way**s**" —
  // there is no word boundary between `y` and `s` — so "one of the fastest ways
  // to improve your Probiotics score" sat on the live results page under a rule
  // whose name says it covers superlatives.
  //
  // Speed is its own claim, separate from the superlatives below, and the
  // comparative form is the more dangerous half: "your score moves faster from
  // consistent small actions", "members who log 3+ meals see their score move
  // fastest", "liquid ferments colonise faster than solids". Each states a rate
  // of change nothing has measured, and none of them names a timeframe, so
  // RESULT_DEADLINE never saw them.
  //
  // Measured at six files across the corpus before landing, every one a real
  // claim this change rewrites — no pre-existing false positive.
  ["speed claim", /\b(fastest|quickest|faster|sooner|quicker)\b/i],
  // Asserting a physiological process is already underway inside the reader.
  // The emails are sent on a cron to everyone on a schedule, so the reader may
  // have done nothing at all since taking the assessment: "your gut is already
  // adapting", "three days of consistent action is when your gut microbiome
  // starts responding".
  //
  // A verb-form rule rather than a phrase list, so it covers the family instead
  // of today's two instances. A broader version keyed on
  // `your (gut|microbiome|body) ... (is|starts|begins)` was measured first and
  // rejected at NINE files: it fired on ordinary headings like "Your gut system
  // is" on /report and /you. A rule that cries wolf gets deleted, so the narrow
  // one ships and the broad one is recorded here as tried.
  [
    "process already underway",
    /\b(?:is|are|has|have|starts?|begins?)\s+(?:already\s+)?(?:adapting|responding|recalibrat\w+|restoring|rebuilding|shifting|changing)\b/i,
  ],
  // The same claim in noun and infinitive form, which the verb rule above cannot
  // reach: "the window when microbiome restoration happens", "your microbiome
  // needs predictability to recalibrate". Both describe an internal process as
  // settled fact and as product vocabulary.
  [
    "physiological process as product vocabulary",
    /\b(?:microbiome|gut)\s+(?:restoration|recalibration)\b|\brecalibrate\b/i,
  ],
  // Superlatives that outrun the evidence. `fastest way` moved to the speed rule
  // above; leaving it in both would make one line report under two rule names.
  ["superlative", /\b(number-one|single biggest|big difference)\b/i],
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
