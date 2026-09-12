/**
 * The runtime narrative contract — Phase 4A-S3.
 *
 * ══ WHAT THIS LAYER IS, AND WHAT IT IS NOT ══════════════════════════════════
 *
 * The canonical deterministic Report from S2 is complete and customer-ready
 * WITHOUT any of this. The narrative layer may change how an approved sentence
 * READS. It may not change what the Report says, what it is attributed to, how
 * certain it is, or how many sentences there are.
 *
 * ══ WHY THERE IS NO MODEL HERE ══════════════════════════════════════════════
 *
 * The first design let a model return an arbitrary string at customer time and
 * accepted it if a token-level filter found nothing wrong. Review produced the
 * counterexample that ended that architecture:
 *
 *     canonical  "You told us energy is what you most want to work on."
 *     candidate  "You told us energy is what you least want to work on."
 *
 * Every structural, preservation and drift check passed, and the customer's
 * stated preference was reversed. The defect is not a missing word in a list.
 * An unbounded generator paired with a finite denylist can only exclude
 * candidates that carry a recognisable marker, and meaning can be inverted
 * without one. No amount of lexicon growth turns "nothing matched" into
 * "meaning preserved".
 *
 * So the model moved OFFLINE. Candidate wording is generated and screened
 * under `authoring/`, a human approves each candidate against one exact
 * canonical sentence, and the approved wording is committed to a frozen
 * Reviewed Narrative Variant Pack. At runtime there is a lookup and nothing
 * else — no provider, no promise, no deadline, no judgement.
 *
 * The claim this architecture makes is narrow and true: NO STRING CAN REACH A
 * CUSTOMER AS NARRATIVE UNLESS THAT EXACT STRING WAS COMMITTED IN THE REVIEWED
 * PACK FOR THAT EXACT CONTENT BINDING. It does not claim, and no test here
 * claims, that a human's semantic judgement was correct.
 *
 * ══ WHY IT LIVES HERE AND NOT IN THE CORE ═══════════════════════════════════
 *
 * `lib/report/deterministic/` carries a purity firewall — a guard scans every
 * file there for model, database, HTTP and framework imports. S3 sits ON TOP
 * of S2 rather than inside it, so that firewall stays untouched and green, and
 * its passing is the evidence the boundary held.
 */

/**
 * Bumped when the runtime contract below changes. Travels in every overlay.
 *
 * Still v1. The repair replaced an architecture that had never been merged,
 * activated or persisted — there is no artefact in the world stamped
 * `narrative-v1` under the old meaning, so a bump would describe a change
 * nobody can observe. It bumps when a shipped overlay's meaning changes.
 */
export const NARRATIVE_CONTRACT_VERSION = "narrative-v1" as const

/**
 * The contract versions a renderer will accept.
 *
 * A list rather than an equality check, so a future version can be added
 * without the previous one silently becoming unrenderable mid-deploy.
 */
export const SUPPORTED_NARRATIVE_CONTRACT_VERSIONS: readonly string[] = [
  NARRATIVE_CONTRACT_VERSION,
]

/* ══ Why a proposition kept its canonical wording ══════════════════════════ */

/**
 * The RUNTIME reasons. A closed union, and a short one.
 *
 * The old union carried `rewriter-failed`, `rewriter-timeout`,
 * `malformed-response`, `preservation-failed`, `drift-rejected` and
 * `expansion-rejected`. All six described a model call or a screen decision,
 * and neither happens at runtime any more — they are `AuthoringRejectionReason`
 * in `authoring/contract.ts`. Keeping them here would advertise a runtime
 * behaviour that no longer exists.
 *
 * None of these fails Report generation. Every one resolves to the canonical
 * wording, which was approved before any of this ran.
 */
export type RuntimeNarrativeFallbackReason =
  /** The layer was not enabled for this composition. */
  | "narrative-disabled"
  /** A customer quotation. Never eligible — see ELIGIBILITY below. */
  | "ineligible-quotation"
  /** A 30-day loop beat. Never eligible — see ELIGIBILITY below. */
  | "ineligible-loop-step"
  /** Eligible, and the reviewed pack holds no variant for this binding. */
  | "no-approved-variant"
  /** The pack itself did not validate. Fail closed, in full. */
  | "variant-pack-invalid"

/**
 * Why an overlay may not be rendered AT ALL.
 *
 * Separate from the per-item reasons on purpose: these are not "this sentence
 * keeps canonical wording", they are "this overlay is not trustworthy, render
 * the canonical Report throughout". A partially trusted overlay is not a
 * thing — see `narrativeRenderPlan`.
 */
export type NarrativeUnusableReason =
  | "overlay-kind-unknown"
  | "contract-version-unsupported"
  /** The overlay names a pack version nobody committed to source control. */
  | "variant-pack-unknown"
  | "variant-pack-invalid"
  | "variant-pack-mismatch"
  | "report-digest-mismatch"
  | "item-count-mismatch"
  | "position-mismatch"
  | "item-shape-invalid"
  | "variant-unknown"
  | "variant-binding-mismatch"
  | "variant-on-ineligible-kind"

/* ══ Eligibility ═══════════════════════════════════════════════════════════ */

/**
 * Which proposition kinds may carry reviewed narrative wording at all.
 *
 * ══ THE TWO EXCLUSIONS, AND WHY THEY ARE STRUCTURAL ═════════════════════════
 *
 * `quotation` — the customer's own free text. It is the most sensitive content
 *   in the Report, the S2 contract already says it is quoted and never read,
 *   and it gains nothing from restyling. Excluding it means the one thing the
 *   customer wrote in their own words never leaves the application, at
 *   authoring time or any other time.
 *
 * `loop-step` — a loop beat's text is BY CONSTRUCTION byte-identical to the
 *   priority lever's; the four steps differ only by a reviewed beat label.
 *   Four divergent phrasings would undermine the exact property the loop
 *   exists to express: one action, repeated four times.
 *
 *   Under the reviewed-pack architecture this exclusion became LOAD-BEARING in
 *   a new way. A variant is bound by content identity, and a loop step's
 *   canonical text hashes to the same digest as the lever's — so a lookup
 *   keyed on text alone WOULD find the lever's variant. Two independent things
 *   stop that: the binding carries `propositionKind`, so a lever's variant is
 *   not a loop step's variant; and eligibility is checked before any lookup
 *   happens. Both are kept. Neither is relied on alone.
 */
export const ELIGIBLE_PROPOSITION_KINDS = ["recap", "lever", "constraint"] as const

export type EligiblePropositionKind = (typeof ELIGIBLE_PROPOSITION_KINDS)[number]

export function isEligibleKind(kind: string): kind is EligiblePropositionKind {
  return (ELIGIBLE_PROPOSITION_KINDS as readonly string[]).includes(kind)
}

/** The fallback reason for a kind that never carries narrative wording. */
export function ineligibleReasonFor(kind: string): RuntimeNarrativeFallbackReason | null {
  if (kind === "quotation") return "ineligible-quotation"
  if (kind === "loop-step") return "ineligible-loop-step"
  return isEligibleKind(kind) ? null : "narrative-disabled"
}

/*
 * `constraint` is listed and is currently UNREACHABLE. The composer builds
 * constraint propositions against the `foodTools` target, which requires the
 * `specificFoods` capability, which is disabled while the dietetic gate is
 * OPEN — so all fifteen constraint sentences are suppressed at the admission
 * boundary and the constraints section composes empty.
 *
 * It stays listed because eligibility states what MAY carry reviewed wording,
 * not what the current capability set happens to admit. Removing it would mean
 * that the day the gate closes, newly admitted sentences become unrewritable
 * for a reason nobody wrote down. A test asserts this reachability truth
 * rather than implying all three occur.
 */

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
 * registry was built to prevent. So this gate lives here, and the Science
 * Contract is not touched.
 *
 * ══ WHAT IT NOW MECHANICALLY CONTROLS ═══════════════════════════════════════
 *
 * Under the reviewed-pack architecture the gate stopped being a note and
 * became an enforced precondition: while `status` is OPEN, the production
 * variant pack MUST be empty, and `validateNarrativeVariantPack` refuses a
 * production pack that holds anything. An empty pack means every eligible
 * proposition falls back to canonical wording, which is the S2 Report exactly.
 *
 * Populating the pack is therefore not a code change that can happen quietly:
 * it requires this status to move, which requires the review this record
 * describes.
 */
export const NARRATIVE_ACCEPTANCE_GATE = {
  gate: "narrative-acceptance",
  kind: "product-quality-and-safety",
  status: "OPEN",
  requiredBefore: "committing any variant to the production Reviewed Narrative Variant Pack",
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
    "the known semantic inversions the authoring screen does NOT catch, so a reviewer sees what they alone are deciding",
  ],
  /**
   * Review is per VARIANT, not per customer output. A reviewer approves one
   * string against one canonical sentence, once; no Report is signed off.
   */
  perCustomerApprovalRequired: false,
  perVariantApprovalRequired: true,
  /** Where the committed human evidence lives. Never imported at runtime. */
  reviewRecordLocation: "docs/reviews/phase-4a-s3/narrative-variant-pack-v1.review.json",
} as const
