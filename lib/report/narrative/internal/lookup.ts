import type { ReportProposition } from "@/lib/report/deterministic/proposition"

import { isEligibleKind } from "../contract"
import { narrativeDigest } from "../digest"
import {
  bindingKey,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "../variant-pack"

/**
 * Pack lookup — Phase 4A-S3, internal.
 *
 * ══ WHY THIS IS NOT PUBLIC ══════════════════════════════════════════════════
 *
 * Both functions here return the object that carries `narrativeText`, and both
 * take a pack the caller is holding. Exported, either one is a way to obtain
 * reviewed wording from a pack nobody committed — which is the whole authority
 * question, reopened by a helper.
 *
 * They are reachable from exactly three places: the two public entry points,
 * which resolve the pack from the committed registry first, and the test seam,
 * which no production module may import. A guard asserts that list.
 */

/**
 * Index a pack by binding.
 *
 * Not exported even from here, and deliberately not reachable with a digest:
 * a digest-keyed primitive is precisely how a loop beat would be handed the
 * lever's reviewed wording, because their canonical text is byte-identical.
 */
function indexByBinding(
  pack: NarrativeVariantPackV1,
): ReadonlyMap<string, ReviewedNarrativeVariant> {
  const map = new Map<string, ReviewedNarrativeVariant>()
  for (const variant of pack.variants) map.set(bindingKey(variant), variant)
  return map
}

/**
 * The reviewed variant for one real proposition, or null.
 *
 * Eligibility is decided HERE, before the binding is constructed, so an
 * ineligible proposition has no path to a lookup. That is one of the two
 * independent defences against the loop-beat collision; the other is that the
 * binding carries the kind, so a lever's variant cannot key a loop step even
 * if this check were removed.
 */
export function reviewedVariantForProposition(
  pack: NarrativeVariantPackV1,
  proposition: ReportProposition,
): ReviewedNarrativeVariant | null {
  if (!isEligibleKind(proposition.kind)) return null
  const key = bindingKey({
    templateId: proposition.templateId,
    propositionKind: proposition.kind,
    canonicalTextDigest: narrativeDigest(proposition.text),
  })
  return indexByBinding(pack).get(key) ?? null
}

/**
 * Resolve a variant by the id an overlay carries.
 *
 * Id-keyed, not content-keyed, and never sufficient on its own: the caller
 * re-checks the resolved variant's binding against the actual proposition, so
 * a forged id resolves to a variant that then fails to match.
 */
export function variantById(
  pack: NarrativeVariantPackV1,
  variantId: string,
): ReviewedNarrativeVariant | undefined {
  return pack.variants.find((variant) => variant.variantId === variantId)
}
