import { usesProhibitedFraming } from "@/lib/report/deterministic/proposition"
import { REPORT_COMPOSITION_BOUNDARY } from "@/lib/consultation/science-contract"

import { allowedLengthWindow, type AuthoringRejectionReason } from "./contract"
import {
  ABSOLUTE_TOKENS,
  BIOTICS_TOKENS,
  CAUSAL_TOKENS,
  FIRST_PERSON_CLAIM_TOKENS,
  FOOD_TOKENS,
  HEDGE_TOKENS,
  MEDICAL_TOKENS,
  NEGATION_TOKENS,
  QUANTITY_TOKENS,
  RECOMMENDATION_TOKENS,
  SAFETY_NETTING_TOKENS,
  SCORE_TOKENS,
  TEMPORAL_TOKENS,
} from "./lexicons"

/**
 * The authoring screen — Phase 4A-S3.
 *
 * ══ WHAT THIS IS, AND THE CLAIM IT DOES NOT MAKE ════════════════════════════
 *
 * A REJECTION filter, run OFFLINE, to reduce what a human reviewer has to
 * read. Every check below can refuse a candidate; not one of them can certify
 * a candidate as meaning the same thing as the canonical sentence. Nothing
 * downstream may read a clean pass as proof of equivalence, and the word
 * "equivalent" appears nowhere in what this returns.
 *
 * ══ THE COUNTEREXAMPLE THAT DEMOTED THIS FILE ═══════════════════════════════
 *
 * This screen was once the last thing between a model and a customer. Review
 * ended that with one line:
 *
 *     canonical  "You told us energy is what you most want to work on."
 *     candidate  "You told us energy is what you least want to work on."
 *
 * Every check passed. The customer's stated preference was reversed. The
 * quantity rule below now catches THAT pair — but `hardest`→`easiest`,
 * `relaxed`→`rushed` and `looser`→`tighter` still pass, and always will,
 * because antonyms are not a closed set and no denylist over an unbounded
 * candidate space can establish preservation. Those cases are kept as tests,
 * asserted to pass the screen, so the limit stays visible.
 *
 * THE SEMANTIC AUTHORITY IS THE HUMAN REVIEWER. This file only decides what
 * they are asked to look at.
 *
 * With that demotion, incompleteness here is survivable: a concept nobody
 * thought to list means a reviewer is shown one more candidate, not that a new
 * claim ships. Nothing this file passes reaches a customer without a person
 * approving it into the reviewed pack afterwards.
 *
 * ══ THREE LAYERS, IN ORDER, NONE OF WHICH CAN PERMIT ════════════════════════
 *
 *   A · STRUCTURAL     is this even a rewrite of one sentence?
 *   B · PRESERVATION   are the facts, the polarity, the certainty, the
 *                      attribution and the shape still the canonical ones?
 *   C · DRIFT          does the rewrite reach for a concept the canonical
 *                      sentence did not have?
 *
 * The order matters only for which reason is reported first; every layer is
 * independent, and a rewrite must clear all of them.
 *
 * ══ PURITY ══════════════════════════════════════════════════════════════════
 *
 * No clock, no randomness, no I/O, no network, no module state. Given the same
 * two strings this function returns the same answer forever, which is what
 * lets a rejection be argued about in review rather than reproduced.
 */

/* ══ Rejection classes ═════════════════════════════════════════════════════ */

/**
 * Every way a rewrite can be refused, as data.
 *
 * Exported so the evaluation corpus behind the Narrative Acceptance Gate can
 * be checked for completeness — "one worked example per class" is only a
 * meaningful requirement if the classes are enumerable.
 */
export const NARRATIVE_REJECTION_CLASSES = [
  "structural-not-a-string",
  "structural-empty",
  "structural-shape",
  "sentence-count",
  "numbers",
  "quantity",
  "temporal",
  "negation",
  "modality",
  "attribution",
  "prohibited-framing",
  "finding-shift",
  "expansion",
  "drift-causal",
  "drift-recommendation",
  "drift-medical",
  "drift-food",
  "drift-biotics",
  "drift-score",
  "drift-safety-netting",
] as const

export type NarrativeRejectionClass = (typeof NARRATIVE_REJECTION_CLASSES)[number]

export type ValidationOutcome =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly reason: AuthoringRejectionReason
      readonly rejectionClass: NarrativeRejectionClass
      readonly detail: string
    }

function reject(
  reason: AuthoringRejectionReason,
  rejectionClass: NarrativeRejectionClass,
  detail: string,
): ValidationOutcome {
  return { ok: false, reason, rejectionClass, detail }
}

/* ══ Tokenisation ══════════════════════════════════════════════════════════ */

/**
 * Lowercased words, punctuation removed, apostrophes kept.
 *
 * Apostrophes are kept because they are the difference between `don't` and
 * `dont` reading as a negation, and losing a negation is the cheapest meaning
 * flip there is.
 */
function wordsOf(text: string): readonly string[] {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? []
}

/** The same text as a space-padded stream, for matching multi-word phrases. */
function phraseStreamOf(text: string): string {
  return ` ${wordsOf(text).join(" ")} `
}

/** Bare numeric tokens. `30`, `3.5`, `1,000` — not the `1` inside `week1`. */
function numbersOf(text: string): readonly string[] {
  return text.match(/\d+(?:[.,]\d+)?/g) ?? []
}

/** How a lexicon entry is matched against a sentence. */
type MatchMode = "exact" | "prefix"

/**
 * How many times one lexicon entry occurs.
 *
 * A multi-word entry is matched as a phrase regardless of mode — `due to` has
 * no useful prefix reading. A single word is matched whole (`exact`) or as a
 * stem (`prefix`); the stem mode is for lexicons written as stems, where
 * over-matching is the safe direction because it can only produce more
 * canonical fallback.
 */
function countToken(
  words: readonly string[],
  stream: string,
  token: string,
  mode: MatchMode,
): number {
  if (token.indexOf(" ") !== -1) {
    const needle = ` ${token} `
    let count = 0
    let from = 0
    for (;;) {
      const at = stream.indexOf(needle, from)
      if (at === -1) return count
      count += 1
      // Advance by one word, not by the whole needle, so overlapping phrases
      // are still counted once each rather than swallowed.
      from = at + 1
    }
  }
  let count = 0
  for (const word of words) {
    if (mode === "exact" ? word === token : word.indexOf(token) === 0) count += 1
  }
  return count
}

/** Total occurrences of any entry in a lexicon. */
function countLexicon(
  words: readonly string[],
  stream: string,
  lexicon: readonly string[],
  mode: MatchMode,
): number {
  let total = 0
  for (const token of lexicon) total += countToken(words, stream, token, mode)
  return total
}

/** Which entries of a lexicon fire at all. Used for the delta rule. */
function firingEntries(
  words: readonly string[],
  stream: string,
  lexicon: readonly string[],
  mode: MatchMode,
): readonly string[] {
  const out: string[] = []
  for (const token of lexicon) {
    if (countToken(words, stream, token, mode) > 0) out.push(token)
  }
  return out
}

/** A multiset comparison that reports the first disagreement it finds. */
function multisetDifference(
  canonical: readonly string[],
  rewritten: readonly string[],
): string | null {
  const tally = new Map<string, number>()
  for (const item of canonical) tally.set(item, (tally.get(item) ?? 0) + 1)
  for (const item of rewritten) tally.set(item, (tally.get(item) ?? 0) - 1)
  for (const [item, delta] of tally) {
    if (delta > 0) return `"${item}" was dropped`
    if (delta < 0) return `"${item}" was added`
  }
  return null
}

/* ══ Layer A — structural ══════════════════════════════════════════════════ */

/** A hard ceiling, well above the longest canonical sentence. Caps a runaway. */
const MAX_REWRITE_CHARS = 400

function structural(rewritten: unknown): ValidationOutcome {
  if (typeof rewritten !== "string") {
    return reject("malformed-response", "structural-not-a-string", "rewritten is not a string")
  }
  if (rewritten.trim().length === 0) {
    return reject("malformed-response", "structural-empty", "rewritten is empty")
  }
  if (rewritten.length > MAX_REWRITE_CHARS) {
    return reject("malformed-response", "structural-shape", "rewritten exceeds the hard cap")
  }
  // A rewrite of one sentence is one line. A newline means a list, a preamble
  // or a second paragraph arrived — none of which is a restyle.
  if (/[\n\r\t]/.test(rewritten)) {
    return reject("malformed-response", "structural-shape", "rewritten contains a line break")
  }
  return { ok: true }
}

/* ══ Layer B — preservation ════════════════════════════════════════════════ */

/**
 * Lexicons compared by MULTISET — the same tokens, the same number of times.
 *
 * These are the facts of the sentence. A rewrite that drops one, adds one, or
 * swaps one for a neighbour is not restyling, whatever it looks like.
 */
const PRESERVED_EXACTLY: readonly {
  readonly cls: NarrativeRejectionClass
  readonly lexicon: readonly string[]
  readonly label: string
}[] = [
  { cls: "temporal", lexicon: TEMPORAL_TOKENS, label: "a reference to time" },
  { cls: "negation", lexicon: NEGATION_TOKENS, label: "a negation" },
]

function preservation(canonical: string, rewritten: string): ValidationOutcome {
  const canonicalWords = wordsOf(canonical)
  const rewrittenWords = wordsOf(rewritten)
  const canonicalStream = phraseStreamOf(canonical)
  const rewrittenStream = phraseStreamOf(rewritten)

  /* 1 · numbers and quantities — the same numerals, the same number of times */
  const numberDiff = multisetDifference(numbersOf(canonical), numbersOf(rewritten))
  if (numberDiff) {
    return reject("preservation-failed", "numbers", `a number changed: ${numberDiff}`)
  }

  /*
   * 1b · quantities and relations, as an exact multiset.
   *
   * ══ WHY THIS IS SEPARATE FROM THE NUMERIC CHECK ═══════════════════════════
   *
   * Because the numeric check above matches digits, and the reviewed corpus
   * has none. Every quantity in it is spelled: "four to six hours", "more than
   * eight hours", "within an hour", "almost all of your meals", "about half".
   * The digit rule therefore had ZERO coverage over the real corpus, and was
   * only ever exercised by a synthetic test sentence.
   *
   * The tokens are drawn from the corpus itself rather than from a general
   * idea of quantity words, and compared as an exact multiset because these
   * are facts, not style: `under` for `over`, `most` for `least`, `almost all`
   * for `few` are all reversals a reader would act on.
   *
   * Some entries also appear in the hedge or absolute lists. That is fine and
   * deliberate — the stricter rule simply binds first, and over-rejection at
   * authoring time only costs candidates.
   */
  const quantityDiff = multisetDifference(
    canonicalWords.filter((w) => QUANTITY_TOKENS.indexOf(w) !== -1),
    rewrittenWords.filter((w) => QUANTITY_TOKENS.indexOf(w) !== -1),
  )
  if (quantityDiff) {
    return reject("preservation-failed", "quantity", `a quantity changed: ${quantityDiff}`)
  }

  /* 2–3 · dates/times and negation */
  for (const { cls, lexicon, label } of PRESERVED_EXACTLY) {
    const diff = multisetDifference(
      canonicalWords.filter((w) => lexicon.indexOf(w) !== -1),
      rewrittenWords.filter((w) => lexicon.indexOf(w) !== -1),
    )
    if (diff) return reject("preservation-failed", cls, `${label} changed: ${diff}`)
  }

  /*
   * 4 · attribution — who is speaking, and who is being described.
   *
   * Two rules, because the corpus has two shapes. Every canonical sentence
   * opens by addressing the customer, so the FIRST WORD must survive: that is
   * what stops "You told us …" becoming "There is a pattern of …". And where
   * the canonical opens with one of the adjudicated
   * `REPORT_COMPOSITION_BOUNDARY` framings, the rewrite must open with an
   * adjudicated framing too — any of them, because swapping one approved
   * customer attribution for another is a restyle, while leaving the list
   * altogether is not.
   */
  const firstCanonical = canonicalWords[0] ?? ""
  const firstRewritten = rewrittenWords[0] ?? ""
  if (firstCanonical !== firstRewritten) {
    return reject(
      "preservation-failed",
      "attribution",
      `the sentence stopped opening with "${firstCanonical}"`,
    )
  }
  const opensApproved = (text: string) =>
    REPORT_COMPOSITION_BOUNDARY.allowedFramings.some(
      (framing) => phraseStreamOf(text).indexOf(` ${phraseStreamOf(framing).trim()} `) === 0,
    )
  if (opensApproved(canonical) && !opensApproved(rewritten)) {
    return reject(
      "preservation-failed",
      "attribution",
      "the approved customer-attribution opening was lost",
    )
  }

  /*
   * 5 · observation → finding. The prohibited framings come from the Core's
   * own `usesProhibitedFraming`, reused rather than re-listed here, so this
   * validator cannot drift away from the adjudicated list. The first-person
   * claim lexicon catches the softer shapes the boundary list does not name.
   */
  const framing = usesProhibitedFraming(rewritten)
  if (framing !== null) {
    return reject("preservation-failed", "prohibited-framing", `prohibited framing: "${framing}"`)
  }
  for (const token of FIRST_PERSON_CLAIM_TOKENS) {
    const before = countToken(canonicalWords, canonicalStream, token, "exact")
    const after = countToken(rewrittenWords, rewrittenStream, token, "exact")
    if (after > before) {
      return reject(
        "preservation-failed",
        "finding-shift",
        `"${token}" turns an observation into a finding`,
      )
    }
  }

  /*
   * 6 · modality — no strengthening, in either direction it can happen.
   *
   * Not a multiset: `tend` becoming `tends` is a restyle, and a rule that
   * forbade it would forbid the only thing this layer exists to do. So the
   * rule is asymmetric and matches the actual hazard — softening may not be
   * LOST, and hardening may not be GAINED.
   *
   * ══ WHY THIS RUNS AFTER THE FRAMING CHECKS ════════════════════════════════
   *
   * `shows`, `means` and `indicates` are hardening words AND the verbs of the
   * prohibited framings, so a rewrite that turns an observation into a finding
   * trips both rules. Every layer here rejects, so the order changes nothing
   * about the outcome — only about which reason is reported, and "this became
   * a finding" is a truer account of that edit than "a word from the absolutes
   * list appeared".
   */
  const hedgesCanonical = countLexicon(canonicalWords, canonicalStream, HEDGE_TOKENS, "exact")
  const hedgesRewritten = countLexicon(rewrittenWords, rewrittenStream, HEDGE_TOKENS, "exact")
  if (hedgesRewritten < hedgesCanonical) {
    return reject("preservation-failed", "modality", "a hedge was dropped, strengthening the claim")
  }
  for (const token of ABSOLUTE_TOKENS) {
    const before = countToken(canonicalWords, canonicalStream, token, "exact")
    const after = countToken(rewrittenWords, rewrittenStream, token, "exact")
    if (after > before) {
      return reject("preservation-failed", "modality", `"${token}" hardened the claim`)
    }
  }

  /*
   * 7 · shape. One sentence in, one sentence out — counted by terminators, so
   * a rewrite cannot smuggle a second clause in as a second sentence.
   */
  const terminators = (text: string) => (text.match(/[.!?]/g) ?? []).length
  if (terminators(rewritten) !== terminators(canonical)) {
    return reject("preservation-failed", "sentence-count", "the number of sentences changed")
  }

  /* 8 · bounded expansion — the backstop, with its own reason. */
  const window = allowedLengthWindow(canonical.trim().length)
  const length = rewritten.trim().length
  if (length < window.min || length > window.max) {
    return reject(
      "expansion-rejected",
      "expansion",
      `length ${length} is outside [${Math.ceil(window.min)}, ${Math.floor(window.max)}]`,
    )
  }

  return { ok: true }
}

/* ══ Layer C — drift rejection ═════════════════════════════════════════════ */

/**
 * The delta rule: a risky lexicon entry may appear in the rewrite only if it
 * already appeared in the canonical sentence.
 *
 * ══ WHY A DELTA AND NOT AN ABSOLUTE BAN ═════════════════════════════════════
 *
 * Because the day the dietetic gate closes, a legitimately gated sentence that
 * names a food must still be restylable, and an absolute ban would make the
 * safest sentences the only unrewritable ones. Today every admitted
 * proposition requires no capability and therefore names no food, so the delta
 * rule degrades to exactly the absolute ban — the same behaviour, arrived at
 * by a rule that will still be correct later.
 */
const DRIFT_LEXICONS: readonly {
  readonly cls: NarrativeRejectionClass
  readonly lexicon: readonly string[]
  readonly mode: MatchMode
  readonly label: string
}[] = [
  { cls: "drift-causal", lexicon: CAUSAL_TOKENS, mode: "prefix", label: "causal language" },
  {
    cls: "drift-recommendation",
    lexicon: RECOMMENDATION_TOKENS,
    mode: "prefix",
    label: "recommendation language",
  },
  { cls: "drift-medical", lexicon: MEDICAL_TOKENS, mode: "prefix", label: "medical vocabulary" },
  { cls: "drift-food", lexicon: FOOD_TOKENS, mode: "prefix", label: "a named food" },
  { cls: "drift-biotics", lexicon: BIOTICS_TOKENS, mode: "prefix", label: "Biotics vocabulary" },
  { cls: "drift-score", lexicon: SCORE_TOKENS, mode: "prefix", label: "score or risk language" },
  {
    cls: "drift-safety-netting",
    lexicon: SAFETY_NETTING_TOKENS,
    mode: "prefix",
    label: "safety-netting language",
  },
]

function drift(canonical: string, rewritten: string): ValidationOutcome {
  const canonicalWords = wordsOf(canonical)
  const rewrittenWords = wordsOf(rewritten)
  const canonicalStream = phraseStreamOf(canonical)
  const rewrittenStream = phraseStreamOf(rewritten)

  for (const { cls, lexicon, mode, label } of DRIFT_LEXICONS) {
    const before = firingEntries(canonicalWords, canonicalStream, lexicon, mode)
    const after = firingEntries(rewrittenWords, rewrittenStream, lexicon, mode)
    for (const token of after) {
      if (before.indexOf(token) === -1) {
        return reject("drift-rejected", cls, `${label} appeared: "${token}"`)
      }
    }
  }

  // `%` is punctuation, so it never survives tokenisation. Checked directly,
  // because a percentage is the most score-like thing a sentence can contain.
  if (rewritten.indexOf("%") !== -1 && canonical.indexOf("%") === -1) {
    return reject("drift-rejected", "drift-score", 'score or risk language appeared: "%"')
  }

  return { ok: true }
}

/* ══ The entry point ═══════════════════════════════════════════════════════ */

/**
 * Accept a rewrite, or say why not.
 *
 * `canonical` is the approved sentence from `PersonalFoodSystemReportV1`.
 * `rewritten` is whatever came back, typed `unknown` on purpose: a response
 * that is not a string is a malformed response, not a crash.
 */
export function validateRewrite(canonical: string, rewritten: unknown): ValidationOutcome {
  const structure = structural(rewritten)
  if (!structure.ok) return structure

  const candidate = rewritten as string
  const preserved = preservation(canonical, candidate)
  if (!preserved.ok) return preserved

  return drift(canonical, candidate)
}
