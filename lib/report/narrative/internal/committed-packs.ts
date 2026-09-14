import {
  NARRATIVE_VARIANT_PACK_KIND,
  PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  validateNarrativeVariantPack,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "../variant-pack"

/**
 * The committed packs — Phase 4A-S3, internal.
 *
 * ══ WHY THIS IS NOT A PUBLIC MODULE ═════════════════════════════════════════
 *
 * It was, and review found what that meant. A `NarrativeVariantPackV1` contains
 * `ReviewedNarrativeVariant`, which contains `narrativeText` — so a public
 * registry export is reviewed wording, reachable without the binding, the
 * proposition or the overlay:
 *
 *     committedPackForVersion(version)?.variants[0]?.narrativeText
 *
 * Empty today, and therefore dormant rather than harmless: the day a reviewed
 * pack is populated, that line is a renderer bypassing every authority check
 * this phase exists to impose. The invariant is stronger than "the caller
 * cannot supply a pack" — it is that NARRATIVE WORDING IS NOT AVAILABLE TO A
 * PRODUCTION CALLER EXCEPT THROUGH `narrativeRenderPlan`.
 *
 * So the data moved to the authority side of the boundary. What stays public
 * is metadata that grants nothing: the kind and version constants, the types,
 * `bindingKey`, `reviewedTemplateText` and the validator. A repo-wide guard
 * proves that only `overlay.ts`, `trust.ts`, the other `internal/` modules and
 * files under `tests/` import anything from here.
 *
 * ══ SOURCE-CONTROLLED, NOT LOOKED UP ════════════════════════════════════════
 *
 * No database, no config service, no environment variable, no provider, and no
 * registration function. The registry is a frozen array in a reviewed file,
 * which is the only storage whose contents cannot change between a review and
 * a customer request.
 */

/**
 * Freeze a pack all the way down.
 *
 * The array and the pack were already frozen; each VARIANT was not, so a
 * populated pack would have shipped mutable `narrativeText`. Writing the
 * helper now means the later pack-population change cannot ship that by
 * omission — it does not have to remember, because the entries pass through
 * here on the way in.
 *
 * Exported — INTERNALLY, behind the same boundary as everything else here —
 * only so a guard can prove the per-variant freeze on a POPULATED pack. The
 * committed pack is empty today, so asserting the freeze against it is
 * vacuous, and a vacuous guard would go on passing on the day somebody
 * removed the line.
 */
export function freezeCommittedPack(pack: NarrativeVariantPackV1): NarrativeVariantPackV1 {
  for (const variant of pack.variants) Object.freeze(variant)
  Object.freeze(pack.variants)
  return Object.freeze(pack)
}

/**
 * The production pack. EMPTY, and mechanically required to stay empty.
 *
 * The Narrative Acceptance Gate is OPEN, so nothing has been reviewed, so
 * there is nothing to ship. `validateNarrativeVariantPack` enforces that
 * rather than trusting it: a production pack holding anything while the gate
 * is OPEN is an invalid pack, and an invalid pack renders canonical.
 *
 * An empty pack is NOT a degraded mode. Every eligible proposition falls back
 * to canonical wording, which is the S2 Report exactly — complete, correct and
 * customer-ready.
 */
const PRODUCTION_PACK: NarrativeVariantPackV1 = freezeCommittedPack({
  kind: NARRATIVE_VARIANT_PACK_KIND,
  version: PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  variants: [] as readonly ReviewedNarrativeVariant[],
})

/** Every pack this build will resolve. Frozen, and only ever grown in a diff. */
export const COMMITTED_NARRATIVE_VARIANT_PACKS: readonly NarrativeVariantPackV1[] = Object.freeze([
  PRODUCTION_PACK,
])

/** The version a freshly built overlay resolves against. */
export const CURRENT_COMMITTED_PACK_VERSION = PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION

/**
 * Resolve a committed pack by the version an overlay names.
 *
 * `undefined` for a version nobody committed, AND for a committed pack that
 * does not validate. Both are the same fact from a renderer's point of view —
 * there is no trustworthy pack for this overlay — and collapsing them means
 * there is no ordering in which an invalid pack is used because the version
 * happened to be known.
 */
export function committedPackForVersion(version: string): NarrativeVariantPackV1 | undefined {
  const pack = COMMITTED_NARRATIVE_VARIANT_PACKS.find((candidate) => candidate.version === version)
  if (!pack) return undefined
  return validateNarrativeVariantPack(pack).ok ? pack : undefined
}

/** The pack a new overlay is built against. */
export function currentCommittedPack(): NarrativeVariantPackV1 | undefined {
  return committedPackForVersion(CURRENT_COMMITTED_PACK_VERSION)
}

/**
 * Whether the gate's empty-production-pack rule currently holds.
 *
 * Exported so a test can assert the rule without being handed the pack — the
 * question "is production empty" is metadata, and answering it does not
 * require returning anything that carries wording.
 */
export function committedProductionPackIsEmpty(): boolean {
  return PRODUCTION_PACK.variants.length === 0
}

/** Metadata only: which versions this build will resolve. Carries no wording. */
export function committedPackVersions(): readonly string[] {
  return COMMITTED_NARRATIVE_VARIANT_PACKS.map((pack) => pack.version)
}
