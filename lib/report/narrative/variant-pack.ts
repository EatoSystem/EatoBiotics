import { CONTENT_PACK } from "@/lib/report/deterministic/content-pack"
import type { ReportProposition } from "@/lib/report/deterministic/proposition"

import {
  NARRATIVE_ACCEPTANCE_GATE,
  isEligibleKind,
  type EligiblePropositionKind,
} from "./contract"
import { narrativeDigest } from "./digest"

/**
 * The Reviewed Narrative Variant Pack — Phase 4A-S3.
 *
 * ══ WHAT A VARIANT IS ═══════════════════════════════════════════════════════
 *
 * One string a human read, compared against one exact canonical sentence in
 * one exact role, and approved. Nothing else is a variant. There is no
 * "candidate" state here and no `reviewStatus` field: MEMBERSHIP IN THIS PACK
 * IS THE APPROVAL. A status field whose type admits only "approved" is a field
 * that can only ever be wrong, and it invites a second arm later; unapproved
 * candidates live in the authoring record, which the runtime never imports. An
 * unreviewed variant is therefore unrepresentable at runtime rather than
 * refused at runtime.
 *
 * ══ WHY THE BINDING IS THREE FIELDS AND NOT A DIGEST ════════════════════════
 *
 * Content identity alone is not authority identity. Two propositions can carry
 * byte-identical canonical text in different roles — the priority lever and
 * its recap twin do, and so does every loop beat — so a digest-keyed pack
 * would hand a lever's approved wording to a loop beat that a reviewer never
 * looked at in that role. The binding is therefore:
 *
 *     templateId + propositionKind + canonicalTextDigest
 *
 * `templateId` names the reviewed content the wording belongs to.
 * `propositionKind` names the role it was approved for.
 * `canonicalTextDigest` makes a canonical edit invalidate the variant rather
 * than silently re-labelling it.
 *
 * Repeated occurrences of the SAME binding legitimately share one variant —
 * that is deterministic reuse of one reviewed asset, not runtime reasoning
 * across propositions.
 *
 * ══ ONE VARIANT PER BINDING, IN V1 ══════════════════════════════════════════
 *
 * Zero variants means canonical wording. Exactly one means that one. More than
 * one makes the pack INVALID — not a choice to make. Selecting between
 * variants would be a runtime decision about which wording a customer sees,
 * and every mechanism for making it (random, rotation, personalisation,
 * preference) is a decision nobody reviewed.
 */

export const NARRATIVE_VARIANT_PACK_KIND = "narrative-variant-pack-v1" as const

export const PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION =
  "narrative-variant-pack-v1-empty" as const

/** Test packs must say so in their identity, and may not wear production's. */
export const TEST_NARRATIVE_VARIANT_PACK_PREFIX = "test:"

/** What a variant is approved FOR. Three fields, all load-bearing. */
export interface NarrativeVariantBinding {
  readonly templateId: string
  readonly propositionKind: EligiblePropositionKind
  readonly canonicalTextDigest: string
}

export interface ReviewedNarrativeVariant extends NarrativeVariantBinding {
  /** Stable and unique within the pack. This is what travels in an overlay. */
  readonly variantId: string
  /** The approved wording. The only narrative wording a renderer may show. */
  readonly narrativeText: string
}

export interface NarrativeVariantPackV1 {
  readonly kind: typeof NARRATIVE_VARIANT_PACK_KIND
  readonly version: string
  readonly variants: readonly ReviewedNarrativeVariant[]
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
export const PRODUCTION_NARRATIVE_VARIANT_PACK: NarrativeVariantPackV1 = {
  kind: NARRATIVE_VARIANT_PACK_KIND,
  version: PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  variants: [],
}

/* ══ The production content index ══════════════════════════════════════════ */

/**
 * Every reviewed template id and its current text.
 *
 * Built from the Core's own `CONTENT_PACK`, so "is this a real reviewed
 * sentence" and "is this still its wording" are answered by the content pack
 * itself rather than by a list kept in step by hand.
 *
 * Loop-beat and quotation template ids are absent from it by construction —
 * the loop's ids are derived at compose time and the quotation's is structural
 * copy — which is a second, independent reason a variant can never bind to
 * either.
 */
function productionTemplateIndex(): ReadonlyMap<string, string> {
  const index = new Map<string, string>()
  for (const question of Object.values(CONTENT_PACK)) {
    for (const disposition of Object.values(question)) {
      if (!disposition) continue
      index.set(disposition.templateId, disposition.text)
    }
  }
  return index
}

const TEMPLATE_INDEX = productionTemplateIndex()

/** Exported for tests that need to reason about the reviewed corpus. */
export function reviewedTemplateText(templateId: string): string | undefined {
  return TEMPLATE_INDEX.get(templateId)
}

export function bindingKey(binding: NarrativeVariantBinding): string {
  /*
   * A JSON array, not a delimiter-joined string.
   *
   * Any separator character has to be one no field can contain, and asserting
   * that about three fields from three different sources is a claim that goes
   * stale. JSON escapes on the caller's behalf, so no template id, role or
   * digest can impersonate a boundary — the ambiguity is unrepresentable
   * rather than argued about. (The first version used a NUL byte, which was
   * unambiguous and also made the file read as binary to every text tool.)
   */
  return JSON.stringify([binding.templateId, binding.propositionKind, binding.canonicalTextDigest])
}

/* ══ Validation ════════════════════════════════════════════════════════════ */

export type PackInvalidReason =
  | "kind-unknown"
  | "version-unrecognised"
  | "production-pack-not-empty-while-gate-open"
  | "duplicate-variant-id"
  | "duplicate-binding"
  | "ineligible-proposition-kind"
  | "template-unknown"
  | "canonical-digest-stale"
  | "narrative-text-empty"

export type PackValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: PackInvalidReason; readonly detail: string }

function invalid(reason: PackInvalidReason, detail: string): PackValidation {
  return { ok: false, reason, detail }
}

/**
 * Validate a pack, in full, before anything reads a variant from it.
 *
 * Every rule fails the WHOLE pack. There is no "skip the bad variant": a pack
 * with one contradictory entry is a pack somebody has lost track of, and the
 * safe reading of it is none of it.
 */
export function validateNarrativeVariantPack(pack: NarrativeVariantPackV1): PackValidation {
  if (pack.kind !== NARRATIVE_VARIANT_PACK_KIND) {
    return invalid("kind-unknown", `pack kind "${String(pack.kind)}" is not supported`)
  }

  const isProduction = pack.version === PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION
  const isTest = pack.version.startsWith(TEST_NARRATIVE_VARIANT_PACK_PREFIX)
  if (!isProduction && !isTest) {
    return invalid(
      "version-unrecognised",
      `pack version "${pack.version}" is neither production nor "${TEST_NARRATIVE_VARIANT_PACK_PREFIX}"-prefixed`,
    )
  }

  /*
   * The gate, made mechanical. While the Narrative Acceptance Gate is OPEN,
   * nothing has been reviewed, so a production pack holding a variant is a
   * variant that got in without the review this whole architecture exists to
   * require. Failing closed here means seeding one cannot be a quiet code
   * change — it fails at runtime, not only in a test somebody could re-pin.
   */
  if (isProduction && NARRATIVE_ACCEPTANCE_GATE.status === "OPEN" && pack.variants.length > 0) {
    return invalid(
      "production-pack-not-empty-while-gate-open",
      `the production pack holds ${pack.variants.length} variant(s) while the Narrative Acceptance Gate is OPEN`,
    )
  }

  const seenIds = new Set<string>()
  const seenBindings = new Set<string>()

  for (const variant of pack.variants) {
    if (seenIds.has(variant.variantId)) {
      return invalid("duplicate-variant-id", `variantId "${variant.variantId}" appears twice`)
    }
    seenIds.add(variant.variantId)

    /*
     * Duplicate binding IS the "more than one variant per binding" rule. They
     * are the same check because a second variant for a binding and a
     * duplicate binding are the same object; giving them one rule means there
     * is no ordering in which one passes and the other does not.
     */
    const key = bindingKey(variant)
    if (seenBindings.has(key)) {
      return invalid(
        "duplicate-binding",
        `more than one variant for ${variant.templateId} / ${variant.propositionKind}`,
      )
    }
    seenBindings.add(key)

    if (!isEligibleKind(variant.propositionKind)) {
      // Also the rule that keeps quotations and loop beats out of a pack.
      return invalid(
        "ineligible-proposition-kind",
        `variant "${variant.variantId}" binds to the ineligible kind "${variant.propositionKind}"`,
      )
    }

    const text = TEMPLATE_INDEX.get(variant.templateId)
    if (text === undefined) {
      return invalid(
        "template-unknown",
        `variant "${variant.variantId}" binds to unknown template "${variant.templateId}"`,
      )
    }

    if (variant.canonicalTextDigest !== narrativeDigest(text)) {
      return invalid(
        "canonical-digest-stale",
        `variant "${variant.variantId}" was reviewed against different wording for "${variant.templateId}"`,
      )
    }

    if (variant.narrativeText.trim().length === 0) {
      return invalid("narrative-text-empty", `variant "${variant.variantId}" has no wording`)
    }
  }

  return { ok: true }
}

/* ══ Lookup ════════════════════════════════════════════════════════════════ */

/**
 * Index a validated pack by binding.
 *
 * Deliberately NOT exported, and deliberately not reachable with a digest.
 * The only way to ask this pack a question is to hand it a real proposition,
 * because a digest-keyed primitive is exactly how a loop beat would be handed
 * the lever's reviewed wording.
 */
function indexByBinding(pack: NarrativeVariantPackV1): ReadonlyMap<string, ReviewedNarrativeVariant> {
  const map = new Map<string, ReviewedNarrativeVariant>()
  for (const variant of pack.variants) map.set(bindingKey(variant), variant)
  return map
}

/**
 * The reviewed variant for one real proposition, or null.
 *
 * Eligibility is decided HERE, before the binding is even constructed, so an
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
 * Id-keyed, not content-keyed, and never sufficient on its own: every caller
 * re-checks the resolved variant's binding against the actual proposition, so
 * a forged id resolves to a variant that then fails to match.
 */
export function variantById(
  pack: NarrativeVariantPackV1,
  variantId: string,
): ReviewedNarrativeVariant | undefined {
  return pack.variants.find((variant) => variant.variantId === variantId)
}

/**
 * Build a test pack, refusing anything that could pass for production.
 *
 * Mirrors `registerTestContentPack` in the Core: a test fixture that could
 * wear the production identity is a test fixture that can be mistaken for
 * reviewed content.
 */
export function testNarrativeVariantPack(
  version: string,
  variants: readonly ReviewedNarrativeVariant[],
): NarrativeVariantPackV1 {
  if (!version.startsWith(TEST_NARRATIVE_VARIANT_PACK_PREFIX)) {
    throw new Error(
      `refusing to build variant pack "${version}": test pack versions must begin with "${TEST_NARRATIVE_VARIANT_PACK_PREFIX}"`,
    )
  }
  return { kind: NARRATIVE_VARIANT_PACK_KIND, version, variants }
}
