import { CONTENT_PACK } from "@/lib/report/deterministic/content-pack"

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

/*
 * ══ THE PRODUCTION PACK OBJECT IS NOT HERE ═════════════════════════════════
 *
 * It was, and it was exported. A pack contains variants, and a variant
 * contains `narrativeText` — so a public pack constant is reviewed wording
 * that any production caller could read directly, without the binding, the
 * proposition or the overlay. Empty today, which made it dormant rather than
 * harmless.
 *
 * The committed packs now live in `internal/committed-packs.ts`, behind the
 * same boundary as the lookups, and a repo-wide guard proves only the two
 * public entry points, the other internal modules and files under `tests/`
 * reach them.
 *
 * What remains in this module is metadata that grants nothing: the kind and
 * version constants, the types, `bindingKey`, `reviewedTemplateText` and the
 * validator. None of them hands anybody a sentence.
 */

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

/*
 * ══ NO LOOKUP LIVES HERE ═══════════════════════════════════════════════════
 *
 * `reviewedVariantForProposition` and `variantById` were exported from this
 * module and are not any more. Both returned the object carrying
 * `narrativeText`, and both took a pack the caller had in its hand — so either
 * one was a way to obtain reviewed wording from a pack nobody committed. They
 * now live in `internal/lookup.ts`, which only the two public entry points and
 * the test seam may import, and a guard asserts that.
 *
 * `testNarrativeVariantPack` has moved to `testing/pack-seam.ts` for the same
 * reason: while it lived beside the production types, a caller could build a
 * `test:` pack and hand it to the same public render path that serves
 * customers. The seam is now a separate module that only files under `tests/`
 * may import.
 *
 * What stays public here is metadata that grants nothing: the types, the
 * versions, the frozen production pack, `bindingKey`, `reviewedTemplateText`
 * and `validateNarrativeVariantPack`. None of them hands anybody a sentence.
 */
