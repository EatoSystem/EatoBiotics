import type {
  NARRATIVE_CONTRACT_VERSION,
  RuntimeNarrativeFallbackReason,
} from "./contract"

/**
 * The runtime overlay — Phase 4A-S3.
 *
 * ══ WHY THE OVERLAY CARRIES NO WORDING AT ALL ═══════════════════════════════
 *
 * It already refused to carry canonical text, because there is exactly one
 * canonical-text authority — `PersonalFoodSystemReportV1` — and two copies can
 * disagree. The same argument applies to narrative text, and the reviewed
 * pack is its single authority. So an item names WHICH approved variant
 * applies and never what it says.
 *
 * The consequence is worth stating plainly: "somebody edited the narrative
 * wording in the overlay while leaving every digest intact" is not a failure
 * mode this layer detects. It is a failure mode that cannot be expressed,
 * because there is no wording in the overlay to edit.
 *
 * ══ WHY THE STATUS IS NOT "accepted" ════════════════════════════════════════
 *
 * "Accepted" was the word that carried the old architecture's over-strong
 * claim: it read as approved when the only established fact was that a filter
 * had not objected. `reviewed-variant` names where the wording came from,
 * which is the only thing this layer knows.
 */

export type NarrativeStatus = "reviewed-variant" | "canonical-only"

/**
 * One position in the canonical Report.
 *
 * A discriminated union, so the impossible combinations are compile errors
 * rather than runtime checks: a reviewed-variant item with a fallback reason,
 * or a canonical-only item with a variant, cannot be constructed.
 */
export type NarrativeItem =
  | {
      readonly status: "reviewed-variant"
      /** The real id, attached from the local walk. Never sent anywhere. */
      readonly propositionId: string
      /** sha256 of the exact canonical sentence at this position. */
      readonly canonicalTextDigest: string
      /** WHICH approved variant. Deliberately not its words. */
      readonly variantId: string
      readonly fallbackReason?: never
    }
  | {
      readonly status: "canonical-only"
      readonly propositionId: string
      readonly canonicalTextDigest: string
      readonly fallbackReason: RuntimeNarrativeFallbackReason
      readonly variantId?: never
    }

export const NARRATIVE_LAYER_KIND = "optional-narrative-layer-v1" as const

export interface OptionalNarrativeLayerV1 {
  readonly kind: typeof NARRATIVE_LAYER_KIND
  readonly narrativeContractVersion: typeof NARRATIVE_CONTRACT_VERSION
  /**
   * The exact pack this overlay was resolved against.
   *
   * A renderer holding a different pack must not use the overlay: the same
   * `variantId` in a later pack could carry different wording, and matching
   * ids across packs is not matching content.
   */
  readonly variantPackVersion: string
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

/*
 * `promptVersion` and `validatorVersion` are deliberately absent.
 *
 * They describe how a candidate was produced and screened at authoring time,
 * and a runtime artefact carrying authoring metadata invites a renderer to
 * reason about it. Runtime authority is the canonical Report, the exact pack
 * identity, and the exact binding — nothing else. The authoring provenance is
 * kept in the committed review record, keyed by `variantId`.
 */
