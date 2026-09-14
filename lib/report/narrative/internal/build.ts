import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { serialiseReport } from "@/lib/report/deterministic/serialise"

import {
  NARRATIVE_CONTRACT_VERSION,
  isEligibleKind,
  ineligibleReasonFor,
  type RuntimeNarrativeFallbackReason,
} from "../contract"
import { narrativeDigest } from "../digest"
import { canonicalPropositionOrder } from "../order"
import { validateNarrativeVariantPack, type NarrativeVariantPackV1 } from "../variant-pack"
import {
  NARRATIVE_LAYER_KIND,
  type NarrativeItem,
  type OptionalNarrativeLayerV1,
} from "../types"
import { reviewedVariantForProposition } from "./lookup"

/**
 * Overlay construction — Phase 4A-S3, internal.
 *
 * ══ WHY THE PACK IS A PARAMETER HERE AND NOWHERE PUBLIC ═════════════════════
 *
 * This is the implementation. It has to be told which pack to resolve against,
 * because it is used by the public entry point — which resolves the committed
 * pack itself — and by the test seam, which supplies a `test:` pack. Exporting
 * it publicly would put the authority object back in a caller's hands, which
 * is the defect this whole module boundary exists to close.
 *
 * ══ SYNCHRONOUS, AND THAT IS THE POINT ══════════════════════════════════════
 *
 * No model, no promise, no deadline, no worker pool. Every sentence's wording
 * was decided by a person before this code ran, so the runtime does a lookup.
 *
 * ══ THE CONTRACT IN ONE LINE ════════════════════════════════════════════════
 *
 * One item per canonical proposition, in canonical order, always — and every
 * item that does not name a reviewed variant is `canonical-only` with a typed
 * reason. There is no path from here to a failed Report. The worst outcome is
 * an overlay in which nothing is a variant, which renders exactly the S2
 * Report.
 */

export interface BuildOverlayWithPackInput {
  readonly report: PersonalFoodSystemReportV1
  /** Resolved by the caller — from the committed registry, or the test seam. */
  readonly pack: NarrativeVariantPackV1 | undefined
  readonly enabled: boolean
}

export function buildOverlayWithPack(
  input: BuildOverlayWithPackInput,
): OptionalNarrativeLayerV1 {
  const { report, pack, enabled } = input
  const propositions = canonicalPropositionOrder(report)

  /*
   * The pack is validated ONCE, before a single variant is read. An absent
   * pack — an unknown committed version — and an invalid one are the same
   * fact here: there is nothing trustworthy to resolve against.
   */
  const packValid = pack !== undefined && validateNarrativeVariantPack(pack).ok

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
     * permanent fact.
     *
     * It is also decided before any lookup, and decided again inside
     * `reviewedVariantForProposition`, because the loop-beat text collision
     * means a lookup that skipped the check would find the lever's wording.
     */
    if (!isEligibleKind(proposition.kind)) {
      return canonicalOnly(ineligibleReasonFor(proposition.kind) ?? "narrative-disabled")
    }

    if (!enabled) return canonicalOnly("narrative-disabled")
    if (!packValid || !pack) return canonicalOnly("variant-pack-invalid")

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
    /*
     * The version the overlay was actually resolved against. When no pack
     * resolved there is nothing truthful to name, and naming the version that
     * was ASKED for would let a later renderer resolve a pack this overlay
     * never saw.
     */
    variantPackVersion: packValid && pack ? pack.version : "",
    canonicalReportDigest: narrativeDigest(serialiseReport(report)),
    items,
  }
}
