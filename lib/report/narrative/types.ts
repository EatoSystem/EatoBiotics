import type {
  NARRATIVE_CONTRACT_VERSION,
  NARRATIVE_PROMPT_VERSION,
  NARRATIVE_VALIDATOR_VERSION,
  NarrativeFallbackReason,
} from "./contract"

/**
 * The overlay, and the boundary the rewriter sits behind — Phase 4A-S3.
 *
 * ══ WHY THE OVERLAY DOES NOT CARRY CANONICAL TEXT ═══════════════════════════
 *
 * There is exactly ONE canonical-text authority: `PersonalFoodSystemReportV1`.
 * An overlay that carried a copy would be a second one, and two copies can
 * disagree — a canonical edit would leave the overlay quietly serving the old
 * wording under the new document's name.
 *
 * So an item carries a DIGEST of the sentence it was derived from. That is
 * enough to prove which sentence a rewrite belongs to, and not enough to serve
 * it. A renderer always reads the words from the Report.
 */

/* ══ The provider boundary ═════════════════════════════════════════════════ */

/**
 * Everything that leaves the application, for one proposition.
 *
 * One field. Not a proposition id, not an opaque handle, not a question id,
 * not an answer value, not a section, not a kind, not a capability, not a
 * correlation id. With one call per proposition the caller already knows which
 * proposition a call belongs to — the promise IS the correlation — so any
 * identifier would be disclosure with no purpose.
 *
 * `ReportProposition` is deliberately NOT accepted here. It carries
 * `sources[]` (the raw answer values, and for a quotation the customer's whole
 * free text), `sourceFields`, `basis`, `templateId` and `requiredCapabilities`.
 * Passing one would hand over the answers.
 */
export interface NarrativeRewriteRequest {
  readonly text: string
}

/**
 * Everything that comes back.
 *
 * No identifier either, so "the rewriter named the wrong proposition" is not a
 * failure mode to validate against — it cannot be expressed.
 */
export interface NarrativeRewriteResponse {
  readonly rewritten: string
}

/**
 * The injected seam. S3 wires no provider.
 *
 * Live generation, metering and persistence belong to the later runtime
 * boundary. Here there is only an interface, so every test runs against a
 * deterministic fake with no network, and provider independence is structural
 * rather than promised.
 */
export interface NarrativeRewriter {
  rewrite(request: NarrativeRewriteRequest): Promise<NarrativeRewriteResponse>
}

/* ══ The overlay ═══════════════════════════════════════════════════════════ */

export type NarrativeStatus = "accepted" | "canonical-only"

export interface NarrativeItem {
  /** The real id, attached from the local walk. Never sent, never received. */
  readonly propositionId: string
  /** sha256 of the exact canonical sentence this item was derived from. */
  readonly canonicalTextDigest: string
  readonly status: NarrativeStatus
  /** Present only when `status === "accepted"`. */
  readonly narrativeText?: string
  /** Present only when `status === "canonical-only"`. */
  readonly fallbackReason?: NarrativeFallbackReason
}

export interface OptionalNarrativeLayerV1 {
  readonly kind: "optional-narrative-layer-v1"
  readonly narrativeContractVersion: typeof NARRATIVE_CONTRACT_VERSION
  readonly promptVersion: typeof NARRATIVE_PROMPT_VERSION
  readonly validatorVersion: typeof NARRATIVE_VALIDATOR_VERSION
  /**
   * sha256 of `serialiseReport(report)`.
   *
   * Binds the overlay to exactly one canonical document. A renderer handed a
   * mismatched pair must ignore the overlay rather than reconcile it.
   */
  readonly canonicalReportDigest: string
  /** One item per canonical proposition, in canonical order. Exhaustive. */
  readonly items: readonly NarrativeItem[]
}

export const NARRATIVE_LAYER_KIND = "optional-narrative-layer-v1" as const
