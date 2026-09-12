import type { PersonalFoodSystemReportV1 } from "@/lib/report/deterministic/report-types"
import { serialiseReport } from "@/lib/report/deterministic/serialise"

import {
  NARRATIVE_LAYER_KIND,
  type NarrativeItem,
  type OptionalNarrativeLayerV1,
} from "./types"
import {
  SUPPORTED_NARRATIVE_CONTRACT_VERSIONS,
  isEligibleKind,
  type NarrativeUnusableReason,
} from "./contract"
import { narrativeDigest } from "./digest"
import { canonicalPropositionOrder } from "./order"
import {
  bindingKey,
  validateNarrativeVariantPack,
  variantById,
  type NarrativeVariantPackV1,
} from "./variant-pack"

/**
 * Two separate proofs — Phase 4A-S3.
 *
 * ══ THE DISTINCTION THAT MATTERS ════════════════════════════════════════════
 *
 *   "this overlay is structurally bound to this Report"
 *   "this overlay is authorised to render narrative wording"
 *
 * These are not the same claim, and conflating them is how a correctly bound
 * but unauthorised overlay ends up on a page. `overlayMatchesReport` proves
 * only the first. It is NOT sufficient to render narrative, and nothing in
 * this file describes it as though it were.
 *
 * `narrativeRenderPlan` proves the second, and returns the finished answer:
 * one string per canonical position, already decided. The renderer performs no
 * join of its own, which removes the last place a variant could be attached to
 * the wrong sentence.
 *
 * ══ WHOLE-OVERLAY, NEVER PARTIAL ════════════════════════════════════════════
 *
 * Any inconsistency fails the entire overlay and renders the canonical Report.
 * There is no salvage. An overlay with one position that does not add up is an
 * overlay somebody has lost track of, and the safe reading of it is none of
 * it — the canonical Report is complete and correct on its own, so refusing
 * costs nothing.
 */

/* ══ Proof 1 — structural binding ══════════════════════════════════════════ */

/**
 * Is this overlay about this document?
 *
 * Digest, length, ids and per-position content digests. Nothing about
 * authority: a hand-built overlay claiming a variant nobody reviewed passes
 * this happily, which is exactly why it is not the check a renderer uses.
 */
export function overlayMatchesReport(
  overlay: OptionalNarrativeLayerV1,
  report: PersonalFoodSystemReportV1,
): boolean {
  if (overlay.canonicalReportDigest !== narrativeDigest(serialiseReport(report))) return false
  const propositions = canonicalPropositionOrder(report)
  if (overlay.items.length !== propositions.length) return false
  for (let i = 0; i < propositions.length; i += 1) {
    const item = overlay.items[i]
    if (item.propositionId !== propositions[i].id) return false
    if (item.canonicalTextDigest !== narrativeDigest(propositions[i].text)) return false
  }
  return true
}

/* ══ Proof 2 — authority to render ═════════════════════════════════════════ */

export type NarrativeRenderPlan =
  | { readonly usable: false; readonly reason: NarrativeUnusableReason; readonly detail: string }
  /** One finished string per canonical position, in canonical order. */
  | { readonly usable: true; readonly text: readonly string[] }

function unusable(reason: NarrativeUnusableReason, detail: string): NarrativeRenderPlan {
  return { usable: false, reason, detail }
}

/**
 * A runtime shape check on one item.
 *
 * The union already makes the impossible combinations uncompilable, so this
 * exists for data that did not come through the type system — a parsed
 * envelope, a hand-built fixture, a future persisted row. Both halves are
 * checked: a reviewed-variant item may not carry a reason, and a
 * canonical-only item may not carry variant authority.
 */
function itemShapeValid(item: NarrativeItem): boolean {
  const loose = item as {
    status?: unknown
    variantId?: unknown
    fallbackReason?: unknown
    propositionId?: unknown
    canonicalTextDigest?: unknown
  }
  if (typeof loose.propositionId !== "string" || loose.propositionId.length === 0) return false
  if (typeof loose.canonicalTextDigest !== "string" || loose.canonicalTextDigest.length === 0) {
    return false
  }
  if (loose.status === "reviewed-variant") {
    if (typeof loose.variantId !== "string" || loose.variantId.length === 0) return false
    return loose.fallbackReason === undefined
  }
  if (loose.status === "canonical-only") {
    if (typeof loose.fallbackReason !== "string" || loose.fallbackReason.length === 0) return false
    return loose.variantId === undefined
  }
  return false
}

export interface NarrativeRenderPlanInput {
  readonly overlay: OptionalNarrativeLayerV1
  readonly report: PersonalFoodSystemReportV1
  readonly pack: NarrativeVariantPackV1
}

/**
 * Decide, once, what every position renders.
 *
 * Checks run in order and every one of them can only refuse. Passing is not a
 * claim that any wording means the same thing as its canonical sentence — a
 * human made that judgement at review time. Passing is the narrower claim this
 * architecture can actually support: every narrative string in the plan is the
 * exact string committed in the reviewed pack for the exact binding at that
 * position.
 */
export function narrativeRenderPlan(input: NarrativeRenderPlanInput): NarrativeRenderPlan {
  const { overlay, report, pack } = input

  if (overlay.kind !== NARRATIVE_LAYER_KIND) {
    return unusable("overlay-kind-unknown", `overlay kind "${String(overlay.kind)}"`)
  }
  if (!SUPPORTED_NARRATIVE_CONTRACT_VERSIONS.includes(overlay.narrativeContractVersion)) {
    return unusable(
      "contract-version-unsupported",
      `contract version "${String(overlay.narrativeContractVersion)}"`,
    )
  }

  const packValidation = validateNarrativeVariantPack(pack)
  if (!packValidation.ok) {
    return unusable("variant-pack-invalid", `${packValidation.reason}: ${packValidation.detail}`)
  }
  if (overlay.variantPackVersion !== pack.version) {
    /*
     * Not pedantry. The same `variantId` in a later pack may carry different
     * wording, so matching ids across packs is not matching content — an
     * overlay resolved against one pack says nothing about another.
     */
    return unusable(
      "variant-pack-mismatch",
      `overlay was resolved against "${overlay.variantPackVersion}", pack is "${pack.version}"`,
    )
  }

  if (overlay.canonicalReportDigest !== narrativeDigest(serialiseReport(report))) {
    return unusable("report-digest-mismatch", "the overlay belongs to a different document")
  }

  const propositions = canonicalPropositionOrder(report)
  if (overlay.items.length !== propositions.length) {
    return unusable(
      "item-count-mismatch",
      `${overlay.items.length} items for ${propositions.length} propositions`,
    )
  }

  const text: string[] = []

  for (let i = 0; i < propositions.length; i += 1) {
    const proposition = propositions[i]
    const item = overlay.items[i]

    if (!itemShapeValid(item)) {
      return unusable("item-shape-invalid", `item ${i} is not a valid narrative item`)
    }
    if (item.propositionId !== proposition.id) {
      return unusable("position-mismatch", `item ${i} names "${item.propositionId}"`)
    }
    if (item.canonicalTextDigest !== narrativeDigest(proposition.text)) {
      return unusable("position-mismatch", `item ${i} was built against different wording`)
    }

    if (item.status === "canonical-only") {
      text.push(proposition.text)
      continue
    }

    /*
     * The kind check, repeated here and not merely trusted from the builder.
     * A loop beat's canonical text is byte-identical to the lever's, so an
     * overlay that named the lever's variant at a loop position would satisfy
     * every digest check above. This is the assertion that refuses it.
     */
    if (!isEligibleKind(proposition.kind)) {
      return unusable(
        "variant-on-ineligible-kind",
        `item ${i} names a variant for the ineligible kind "${proposition.kind}"`,
      )
    }

    const variant = variantById(pack, item.variantId)
    if (!variant) {
      return unusable("variant-unknown", `item ${i} names unknown variant "${item.variantId}"`)
    }

    /*
     * And the binding, compared back to the ACTUAL proposition — template,
     * role and content, all three. A variant reviewed for one template in one
     * role is not authority for another, however well the digests line up.
     */
    const expected = bindingKey({
      templateId: proposition.templateId,
      propositionKind: proposition.kind,
      canonicalTextDigest: narrativeDigest(proposition.text),
    })
    if (bindingKey(variant) !== expected) {
      return unusable(
        "variant-binding-mismatch",
        `variant "${variant.variantId}" was reviewed for a different binding`,
      )
    }

    text.push(variant.narrativeText)
  }

  return { usable: true, text }
}
