/**
 * The narrative contract — Phase 4A-S3.
 *
 * ══ WHAT THIS LAYER IS, AND WHAT IT IS NOT ══════════════════════════════════
 *
 * The canonical deterministic Report from S2 is complete and customer-ready
 * WITHOUT any of this. The narrative layer may change how an approved sentence
 * READS. It may not change what the Report says, what it is attributed to, how
 * certain it is, or how many sentences there are.
 *
 * It holds no authority. Everything a rewriter returns is a PROPOSAL, accepted
 * only after deterministic checks and discarded without consequence at the
 * first doubt. Delete this directory and the Report is unchanged.
 *
 * ══ WHY IT LIVES HERE AND NOT IN THE CORE ═══════════════════════════════════
 *
 * `lib/report/deterministic/` carries a purity firewall — a guard scans every
 * file there for model, database, HTTP and framework imports. S3 sits ON TOP
 * of S2 rather than inside it, so that firewall stays untouched and green, and
 * its passing is the evidence the boundary held.
 */

/** Bumped when the contract below changes. Travels in every overlay. */
export const NARRATIVE_CONTRACT_VERSION = "narrative-v1" as const
/** Bumped by ANY prompt wording change. */
export const NARRATIVE_PROMPT_VERSION = "narrative-prompt-v1" as const
/** Bumped when a validator rule is added, removed or retuned. */
export const NARRATIVE_VALIDATOR_VERSION = "narrative-validator-v1" as const

/* ══ Why a proposition kept its canonical wording ══════════════════════════ */

/**
 * A closed union. Every one of these resolves to canonical wording, and none
 * of them fails Report generation.
 */
export type NarrativeFallbackReason =
  /* ── never attempted ── */
  /** The layer was not enabled for this composition. */
  | "narrative-disabled"
  /** A customer quotation. Never sent, on purpose — see ELIGIBILITY below. */
  | "ineligible-quotation"
  /** A 30-day loop beat. Never sent, on purpose — see ELIGIBILITY below. */
  | "ineligible-loop-step"
  /* ── the rewriter ── */
  | "rewriter-failed"
  | "rewriter-timeout"
  | "malformed-response"
  /* ── deterministic validation ── */
  /** A number, date, negation, modal, attribution or framing was not preserved. */
  | "preservation-failed"
  /** A risky concept absent from the canonical sentence appeared in the rewrite. */
  | "drift-rejected"
  /** The rewrite grew or shrank beyond the frozen bounds. */
  | "expansion-rejected"

/* ══ Eligibility ═══════════════════════════════════════════════════════════ */

/**
 * Which proposition kinds may be rewritten at all.
 *
 * ══ THE TWO EXCLUSIONS, AND WHY THEY ARE STRUCTURAL ═════════════════════════
 *
 * `quotation` — the customer's own free text. It is the most sensitive content
 *   in the Report, the S2 contract already says it is quoted and never read,
 *   and the only rewritable part around it is a reviewed lead-in that gains
 *   nothing from a model. Excluding it means the one thing the customer wrote
 *   in their own words never leaves the application at all.
 *
 * `loop-step` — a loop beat's text is BY CONSTRUCTION byte-identical to the
 *   priority lever's; the four steps differ only by a reviewed beat label. Four
 *   independent rewrites would risk four phrasings of what the S2 contract
 *   deliberately makes ONE action repeated four times, undermining the exact
 *   property the loop exists to express. The lever's own rewrite already
 *   carries any readability gain.
 *
 *   The tempting alternative — rewrite the lever once and copy its narrative
 *   text into the four steps — is deliberately NOT taken. That is reuse across
 *   propositions, which is the shape this layer otherwise forbids, and it
 *   would make one accepted rewrite authoritative for four entries.
 *
 * Eligibility is decided BEFORE any rewriter invocation, so an ineligible
 * proposition is never projected, never sent and never in flight.
 *
 * ══ ONE OF THE THREE IS CURRENTLY UNREACHABLE ═══════════════════════════════
 *
 * `constraint` is listed, and today no composed Report contains one. The
 * composer builds constraint propositions against the `foodTools` target,
 * which requires the `specificFoods` capability, which is disabled while the
 * dietetic gate is OPEN — so all fifteen constraint sentences are suppressed
 * at the admission boundary and the constraints section composes empty.
 *
 * It is listed anyway, because eligibility is a statement about what MAY be
 * restyled, not a cache of what the current capability set happens to admit.
 * Removing it would mean the day the gate closes, the newly admitted sentences
 * would silently become unrewritable for a reason nobody wrote down. A test
 * asserts this reachability truth rather than implying all three occur.
 */
export const ELIGIBLE_PROPOSITION_KINDS = ["recap", "lever", "constraint"] as const

export type EligiblePropositionKind = (typeof ELIGIBLE_PROPOSITION_KINDS)[number]

export function isEligibleKind(kind: string): kind is EligiblePropositionKind {
  return (ELIGIBLE_PROPOSITION_KINDS as readonly string[]).includes(kind)
}

/** The fallback reason for a kind that is never rewritten. */
export function ineligibleReasonFor(kind: string): NarrativeFallbackReason | null {
  if (kind === "quotation") return "ineligible-quotation"
  if (kind === "loop-step") return "ineligible-loop-step"
  return isEligibleKind(kind) ? null : "narrative-disabled"
}

/* ══ Expansion bounds ══════════════════════════════════════════════════════ */

/**
 * How far a rewrite may move in length, frozen from the real corpus.
 *
 * ══ THE EVIDENCE ═══════════════════════════════════════════════════════════
 *
 * Two corpora, measured rather than estimated, because they are not the same
 * set and quoting only one of them would overstate what was examined.
 *
 * EVERY non-null template in the content pack — the sentences this layer could
 * ever be asked to rewrite, under any future capability set:
 *
 *     count   112 sentences
 *     chars   min 31 · p25 49 · median 57 · p75 73 · p90 83 · max 99
 *
 * The subset REACHABLE TODAY — the same templates minus the fifteen the
 * `specificFoods` capability currently suppresses, i.e. exactly the sentences
 * a composed Report can contain while the dietetic gate is OPEN:
 *
 *     count   97 sentences
 *     chars   min 34 · p25 51 · median 60 · p75 73 · p90 84 · max 99
 *     words   min 7  · p25 10 · median 12 · p75 14 · max 20
 *
 * These are short, single-clause, uniform sentences. A readability rewrite of
 * a twelve-word sentence that lands far outside its own length has almost
 * certainly added or dropped something. The bounds below are set against the
 * WIDER corpus, so closing the dietetic gate cannot invalidate them.
 *
 * ══ THE RULE ═══════════════════════════════════════════════════════════════
 *
 * Both a ratio and an absolute delta, INTERSECTED — the tighter of the two
 * always binds. They bind at opposite ends of the corpus: on a 31-character
 * sentence the ratio is the tighter constraint; on a 99-character one the
 * absolute delta is. Using either alone would leave the other end loose.
 *
 * ±20 characters is roughly four words at this corpus's ~5.2 characters per
 * word — enough for a genuine restyle, not enough to insert a clause.
 *
 * ══ WHAT THIS BOUND IS FOR ═════════════════════════════════════════════════
 *
 * A BACKSTOP, not the primary defence. The preservation and drift checks are
 * what actually catch added content; this catches the shape of a rewrite that
 * has gone somewhere the other checks were not looking. Being conservative
 * costs only canonical wording, which is the approved safe state.
 *
 * Whether these bounds are too tight for READABILITY is a product judgement,
 * and it belongs to the Narrative Acceptance Gate, which calibrates against
 * this same corpus before any activation. Nothing here activates anything.
 */
export const EXPANSION_BOUNDS = {
  minRatio: 0.7,
  maxRatio: 1.3,
  maxAbsoluteDelta: 20,
} as const

/** The inclusive character-length window a rewrite must land in. */
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

/* ══ The Narrative Acceptance Gate ═════════════════════════════════════════ */

/**
 * A PRODUCT-QUALITY AND SAFETY activation gate — deliberately not a specialist
 * gate.
 *
 * ══ WHY IT IS NOT IN SPECIALIST_GATES ═══════════════════════════════════════
 *
 * `SPECIALIST_GATES` in the Science Contract is the adjudicated science and
 * legal record. `reportCapabilityEnabled` derives the three Report
 * capabilities from it, and a test asserts all three are OPEN. Putting a
 * product decision in that record would place a product judgement inside a
 * science contract — precisely the conflation the two-basis permission
 * registry was built to prevent. So this gate lives here, in the narrative
 * contract, and the Science Contract is not touched.
 *
 * S3 does not activate narrative. This record states what must be true before
 * anything renders, so the bar is written down before anyone is under pressure
 * to clear it.
 */
export const NARRATIVE_ACCEPTANCE_GATE = {
  gate: "narrative-acceptance",
  kind: "product-quality-and-safety",
  status: "OPEN",
  requiredBefore: "rendering any narrative wording to a customer",
  /** Non-negotiable. One accepted violation closes nothing and blocks activation. */
  safetyRule:
    "ZERO accepted safety or integrity violations across the frozen and adversarial evaluation corpus.",
  /** Deliberately unset here — see `readabilityThresholdsNote`. */
  readabilityThresholds: null,
  readabilityThresholdsNote:
    "Calibrated from the complete eligible canonical corpus and explicitly frozen before any runtime or customer activation. Not invented in S3, because S3 renders nothing and a number chosen without that calibration would be a guess wearing a constant's clothing.",
  corpus: [
    "every proposition family — all recap templates, every priority lever, both constraint questions",
    "both foundations, You and Family",
    "awkward inputs — longest and shortest sentences, numbers, negation, prefer-not-to-say wording, the unresolved-avoidance and undisclosed safety notes",
    "boundary wording — sentences sitting closest to each lexicon without crossing it",
    "adversarial candidate rewrites — at least one per deterministic rejection class",
    "every deterministic rejection class, each with a worked example",
  ],
  perCustomerApprovalRequired: false,
} as const
