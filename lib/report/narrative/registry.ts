import {
  PRODUCTION_NARRATIVE_VARIANT_PACK,
  PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  validateNarrativeVariantPack,
  type NarrativeVariantPackV1,
} from "./variant-pack"

/**
 * The committed pack registry — Phase 4A-S3.
 *
 * ══ WHY THE CALLER NO LONGER SUPPLIES THE PACK ══════════════════════════════
 *
 * `buildNarrativeOverlay` and `narrativeRenderPlan` used to take a pack as an
 * argument. Review found what that meant: the caller supplied the object that
 * was supposed to ESTABLISH authority. Pack validation accepts any
 * `test:`-prefixed version — the empty-pack rule binds the production version
 * only — so anybody could assemble
 *
 *     { templateId: <real>, propositionKind: <real>, canonicalTextDigest:
 *       <correct>, variantId: "forged", narrativeText: <anything> }
 *
 * in a `test:` pack, hand it to the same public path a customer's Report goes
 * through, and have it validate and render. The frozen claim — no string
 * reaches runtime as narrative unless it was committed in the reviewed
 * production pack for that exact binding — was not true of the code.
 *
 * So the authority object is no longer an argument. It is resolved HERE, from
 * a list that exists only in source control. A caller can ask for a version;
 * it cannot manufacture the thing that version names.
 *
 * ══ SOURCE-CONTROLLED, NOT LOOKED UP ════════════════════════════════════════
 *
 * No database, no config service, no environment variable, no provider. The
 * registry is a frozen array in a reviewed file, which is the only storage
 * whose contents cannot change between a review and a customer request.
 *
 * ══ WHAT IS IN IT TODAY ═════════════════════════════════════════════════════
 *
 * Exactly one entry: the empty production pack. The Narrative Acceptance Gate
 * is OPEN, so nothing has been reviewed, so every position renders canonical.
 * Later reviewed versions are added here deliberately, in the same change that
 * adds their variants and their committed review evidence.
 */

/** Every pack this build will resolve. Frozen, and only ever grown in a diff. */
export const COMMITTED_NARRATIVE_VARIANT_PACKS: readonly NarrativeVariantPackV1[] = Object.freeze([
  PRODUCTION_NARRATIVE_VARIANT_PACK,
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
