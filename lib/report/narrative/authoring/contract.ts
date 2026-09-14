/**
 * The authoring contract — Phase 4A-S3.
 *
 * ══ WHAT AUTHORING IS ═══════════════════════════════════════════════════════
 *
 * Everything in this directory runs OFFLINE, supervised by a person, and never
 * inside a customer request. It produces candidate wording and screens out the
 * obviously unsafe, so that a human reviewer reads fewer and better
 * candidates. It does not decide anything a customer sees.
 *
 * ══ THE SCREEN IS NOT THE AUTHORITY ═════════════════════════════════════════
 *
 * The deterministic screen in `validate.ts` rejects; it never certifies. It
 * cannot establish that a candidate means what the canonical sentence means,
 * and the review that killed the previous architecture proved it concretely:
 * `most` → `least` passed every check while reversing the customer. The
 * screen was kept because reducing what a person has to read is worth having;
 * it was demoted because "nothing matched" was never evidence.
 *
 * THE SEMANTIC AUTHORITY IS THE HUMAN REVIEWER. Nothing in this directory may
 * be described as though it were.
 */

/** Bumped by ANY prompt wording change. Recorded in the review evidence. */
export const NARRATIVE_PROMPT_VERSION = "narrative-prompt-v1" as const

/** Bumped when a screen rule is added, removed or retuned. */
export const NARRATIVE_VALIDATOR_VERSION = "narrative-validator-v2" as const

/**
 * Why a candidate did not reach a human reviewer.
 *
 * These used to be runtime fallback reasons, when a model ran during a
 * customer's request. They are authoring outcomes now, and they live here so
 * the runtime union cannot advertise behaviour the runtime no longer has.
 */
export type AuthoringRejectionReason =
  /* ── the rewriter ── */
  | "rewriter-failed"
  | "rewriter-timeout"
  | "malformed-response"
  /* ── the deterministic screen ── */
  | "preservation-failed"
  | "drift-rejected"
  | "expansion-rejected"

/* ══ Expansion bounds ══════════════════════════════════════════════════════ */

/**
 * How far a candidate may move in length, frozen from the real corpus.
 *
 * ══ THE EVIDENCE ═══════════════════════════════════════════════════════════
 *
 * Two corpora, measured rather than estimated, because they are not the same
 * set and quoting only one would overstate what was examined.
 *
 * EVERY non-null template in the content pack — the sentences this layer could
 * ever be asked to restyle, under any future capability set:
 *
 *     count   112 sentences
 *     chars   min 31 · p25 49 · median 57 · p75 73 · p90 83 · max 99
 *
 * The subset REACHABLE TODAY — the same templates minus the fifteen the
 * `specificFoods` capability currently suppresses:
 *
 *     count   97 sentences
 *     chars   min 34 · p25 51 · median 60 · p75 73 · p90 84 · max 99
 *     words   min 7  · p25 10 · median 12 · p75 14 · max 20
 *
 * ══ THE RULE ═══════════════════════════════════════════════════════════════
 *
 * Both a ratio and an absolute delta, INTERSECTED — the tighter of the two
 * always binds. They bind at opposite ends of the corpus: on a 34-character
 * sentence the ratio is tighter; on a 99-character one the absolute delta is.
 * Using either alone would leave the other end loose. Set against the WIDER
 * corpus, so closing the dietetic gate cannot invalidate them.
 *
 * ±20 characters is roughly four words at this corpus's ~5.2 characters per
 * word — enough for a genuine restyle, not enough to insert a clause.
 *
 * ══ AUTHORING-ONLY ═════════════════════════════════════════════════════════
 *
 * These bound what reaches a REVIEWER, not what reaches a customer. Nothing at
 * runtime consults them: a variant a human approved is approved whatever its
 * length. Being conservative here only costs candidates, which is the cheap
 * direction.
 */
export const EXPANSION_BOUNDS = {
  minRatio: 0.7,
  maxRatio: 1.3,
  maxAbsoluteDelta: 20,
} as const

/** The inclusive character-length window a candidate must land in. */
export function allowedLengthWindow(canonicalLength: number): {
  readonly min: number
  readonly max: number
} {
  const { minRatio, maxRatio, maxAbsoluteDelta } = EXPANSION_BOUNDS
  return {
    min: Math.max(canonicalLength * minRatio, canonicalLength - maxAbsoluteDelta),
    max: Math.min(canonicalLength * maxRatio, canonicalLength + maxAbsoluteDelta),
  }
}
