import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { serialiseReport } from "@/lib/report/deterministic/serialise"

import {
  NARRATIVE_CONTRACT_VERSION,
  isEligibleKind,
  ineligibleReasonFor,
  type RuntimeNarrativeFallbackReason,
} from "./contract"
import { narrativeDigest } from "./digest"
import { canonicalPropositionOrder } from "./order"
import {
  reviewedVariantForProposition,
  validateNarrativeVariantPack,
  type NarrativeVariantPackV1,
} from "./variant-pack"
import {
  NARRATIVE_LAYER_KIND,
  type NarrativeItem,
  type OptionalNarrativeLayerV1,
} from "./types"

/**
 * Building the overlay — Phase 4A-S3.
 *
 * ══ SYNCHRONOUS, AND THAT IS THE POINT ══════════════════════════════════════
 *
 * This function used to be async: it called a model, raced a deadline, ran a
 * bounded worker pool, and handled four kinds of provider failure. None of
 * that exists any more. Every sentence's wording was decided by a human before
 * this code ran, so the runtime does a lookup. There is no promise to await,
 * no timeout to tune, and no `rewriter-failed` to report — a whole class of
 * failure modes stopped existing rather than being handled.
 *
 * ══ THE CONTRACT IN ONE LINE ════════════════════════════════════════════════
 *
 * One item per canonical proposition, in canonical order, always — and every
 * item that does not name a reviewed variant is `canonical-only` with a typed
 * reason. There is no path from here to a failed Report. The worst outcome is
 * an overlay in which nothing is a variant, which renders exactly the S2
 * Report.
 *
 * ══ WHY COMPLETENESS IS THE INVARIANT ═══════════════════════════════════════
 *
 * A sparse overlay would have to be joined to the Report at render time, and a
 * join is where the wrong sentence gets the wrong wording. A total, ordered
 * overlay makes the join positional and checkable: same length, same order,
 * same ids, or the renderer ignores it.
 */

export interface BuildNarrativeOverlayInput {
  readonly report: PersonalFoodSystemReportV1
  /** The reviewed pack to resolve against. Validated before it is read. */
  readonly pack: NarrativeVariantPackV1
  /**
   * Off unless a caller says otherwise.
   *
   * S3 does not activate narrative, and a default of `true` would mean the
   * layer switched itself on the moment somebody imported it. Disabled is not
   * a degraded mode: it produces a complete overlay of canonical-only items.
   *
   * Kept even though the production pack is empty — two independent off
   * switches, and the one that does not depend on the pack's contents is the
   * one a deploy can reason about.
   */
  readonly enabled?: boolean
}

export function buildNarrativeOverlay(
  input: BuildNarrativeOverlayInput,
): OptionalNarrativeLayerV1 {
  const { report, pack } = input
  const enabled = input.enabled === true
  const propositions = canonicalPropositionOrder(report)

  /*
   * The pack is validated ONCE, before a single variant is read. An invalid
   * pack is not partially usable: every position falls back, with a reason
   * that says why, and `narrativeRenderPlan` refuses the overlay outright.
   */
  const packValid = validateNarrativeVariantPack(pack).ok

  const items: NarrativeItem[] = propositions.map((proposition): NarrativeItem => {
    const canonicalTextDigest = narrativeDigest(proposition.text)
    const canonicalOnly = (
      fallbackReason: RuntimeNarrativeFallbackReason,
    ): NarrativeItem => ({
      status: "canonical-only",
      propositionId: proposition.id,
      canonicalTextDigest,
      fallbackReason,
    })

    /*
     * Eligibility FIRST, and before the switches on purpose.
     *
     * A quotation is not canonical-only because the layer happens to be off
     * today; it is canonical-only permanently, and an overlay that said
     * `narrative-disabled` against it would record a temporary reason for a
     * permanent fact. Reading an overlay should tell you why THIS position
     * carries canonical wording, and for these two kinds the answer never
     * changes.
     *
     * It is also decided before any lookup, and decided again inside
     * `reviewedVariantForProposition`, because the loop-beat text collision
     * means a lookup that skipped the check would find the lever's wording.
     */
    if (!isEligibleKind(proposition.kind)) {
      return canonicalOnly(ineligibleReasonFor(proposition.kind) ?? "narrative-disabled")
    }

    if (!enabled) return canonicalOnly("narrative-disabled")
    if (!packValid) return canonicalOnly("variant-pack-invalid")

    const variant = reviewedVariantForProposition(pack, proposition)
    if (!variant) return canonicalOnly("no-approved-variant")

    return {
      status: "reviewed-variant",
      propositionId: proposition.id,
      canonicalTextDigest,
      variantId: variant.variantId,
    }
  })

  return {
    kind: NARRATIVE_LAYER_KIND,
    narrativeContractVersion: NARRATIVE_CONTRACT_VERSION,
    variantPackVersion: pack.version,
    canonicalReportDigest: narrativeDigest(serialiseReport(report)),
    items,
  }
}
