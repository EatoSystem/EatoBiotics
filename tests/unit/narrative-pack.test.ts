import { describe, it, expect } from "vitest"

import { CONTENT_PACK } from "@/lib/report/deterministic/content-pack"
import { NARRATIVE_ACCEPTANCE_GATE } from "@/lib/report/narrative/contract"
import { narrativeDigest } from "@/lib/report/narrative/digest"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import {
  NARRATIVE_VARIANT_PACK_KIND,
  bindingKey,
  PRODUCTION_NARRATIVE_VARIANT_PACK,
  PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  reviewedTemplateText,
  reviewedVariantForProposition,
  testNarrativeVariantPack,
  validateNarrativeVariantPack,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "@/lib/report/narrative/variant-pack"

import { reportFor, testPackForReport } from "./narrative-fixtures"

/**
 * The Reviewed Narrative Variant Pack — Phase 4A-S3.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 * That a variant cannot exist in a usable pack unless it names a real reviewed
 * template, in an eligible role, against that template's CURRENT wording, once.
 * Everything else fails the whole pack.
 *
 * What is NOT being proven, here or anywhere: that an approved variant means
 * the same thing as its canonical sentence. A human decided that.
 */

const LEVER_TEMPLATE = "intentions.primaryFocus.energy"
const LEVER_TEXT = "You told us energy is what you most want to work on."

function variant(over: Partial<ReviewedNarrativeVariant> = {}): ReviewedNarrativeVariant {
  return {
    templateId: LEVER_TEMPLATE,
    propositionKind: "lever",
    canonicalTextDigest: narrativeDigest(LEVER_TEXT),
    variantId: "v-1",
    narrativeText: "You reported energy is what you most want to work on.",
    ...over,
  }
}

const packOf = (...variants: ReviewedNarrativeVariant[]): NarrativeVariantPackV1 =>
  testNarrativeVariantPack("test:pack", variants)

describe("the fixture binds to real reviewed content", () => {
  it("the template it uses is the one the content pack holds", () => {
    // If this drifts, every case below would be testing a template that does
    // not exist, and would pass for the wrong reason.
    expect(reviewedTemplateText(LEVER_TEMPLATE)).toBe(LEVER_TEXT)
  })

  it("template ids are unique across the reviewed content pack", () => {
    const seen = new Set<string>()
    for (const question of Object.values(CONTENT_PACK)) {
      for (const disposition of Object.values(question)) {
        if (!disposition) continue
        expect(seen.has(disposition.templateId), disposition.templateId).toBe(false)
        seen.add(disposition.templateId)
      }
    }
    expect(seen.size).toBe(112)
  })
})

describe("the production pack is empty, and required to be", () => {
  it("holds nothing", () => {
    expect(PRODUCTION_NARRATIVE_VARIANT_PACK.variants).toEqual([])
  })

  it("is valid while empty", () => {
    expect(validateNarrativeVariantPack(PRODUCTION_NARRATIVE_VARIANT_PACK).ok).toBe(true)
  })

  it("an OPEN gate makes a populated production pack invalid, not merely discouraged", () => {
    expect(NARRATIVE_ACCEPTANCE_GATE.status).toBe("OPEN")
    const seeded: NarrativeVariantPackV1 = {
      kind: NARRATIVE_VARIANT_PACK_KIND,
      version: PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
      variants: [variant()],
    }
    const outcome = validateNarrativeVariantPack(seeded)
    expect(outcome.ok).toBe(false)
    if (outcome.ok) return
    expect(outcome.reason).toBe("production-pack-not-empty-while-gate-open")
  })
})

describe("pack validity", () => {
  const CASES: readonly {
    readonly name: string
    readonly pack: NarrativeVariantPackV1
    readonly reason: string
  }[] = [
    {
      name: "an unknown kind",
      pack: { ...packOf(variant()), kind: "something-else" } as unknown as NarrativeVariantPackV1,
      reason: "kind-unknown",
    },
    {
      name: "a version that is neither production nor test-prefixed",
      pack: { ...packOf(variant()), version: "narrative-variant-pack-v2" },
      reason: "version-unrecognised",
    },
    {
      name: "a repeated variantId",
      pack: packOf(variant(), variant({ propositionKind: "recap" })),
      reason: "duplicate-variant-id",
    },
    {
      name: "two variants for one binding",
      pack: packOf(variant(), variant({ variantId: "v-2", narrativeText: "You reported energy." })),
      reason: "duplicate-binding",
    },
    {
      name: "a variant for the quotation",
      pack: packOf(
        variant({
          templateId: "intentions.success.quotation",
          propositionKind: "quotation" as never,
        }),
      ),
      reason: "ineligible-proposition-kind",
    },
    {
      name: "a variant for a loop beat",
      pack: packOf(variant({ propositionKind: "loop-step" as never })),
      reason: "ineligible-proposition-kind",
    },
    {
      name: "a template the content pack does not hold",
      pack: packOf(variant({ templateId: "intentions.primaryFocus.invented" })),
      reason: "template-unknown",
    },
    {
      name: "a loop beat's derived template id",
      pack: packOf(variant({ templateId: `${LEVER_TEMPLATE}.loop.try` })),
      reason: "template-unknown",
    },
    {
      name: "a digest from wording that has since changed",
      pack: packOf(variant({ canonicalTextDigest: narrativeDigest("something else entirely") })),
      reason: "canonical-digest-stale",
    },
    {
      name: "no wording at all",
      pack: packOf(variant({ narrativeText: "   " })),
      reason: "narrative-text-empty",
    },
  ]

  for (const testCase of CASES) {
    it(`rejects ${testCase.name}`, () => {
      const outcome = validateNarrativeVariantPack(testCase.pack)
      expect(outcome.ok, `accepted ${testCase.name}`).toBe(false)
      if (outcome.ok) return
      expect(outcome.reason).toBe(testCase.reason)
    })
  }

  it("accepts a well-formed test pack", () => {
    expect(validateNarrativeVariantPack(packOf(variant())).ok).toBe(true)
  })

  it("accepts one variant per role for the same wording", () => {
    // The lever and its recap twin share bytes and differ in role. Two
    // bindings, two reviews, two variants — and a valid pack.
    const outcome = validateNarrativeVariantPack(
      packOf(variant(), variant({ variantId: "v-2", propositionKind: "recap" })),
    )
    expect(outcome.ok, outcome.ok ? "" : outcome.detail).toBe(true)
  })
})

describe("the binding tells three things apart", () => {
  /**
   * Asserted directly on `bindingKey`, and not only through a Report.
   *
   * Each field is load-bearing for a different reason, and a Report fixture
   * can only exercise the combinations it happens to contain — the composed
   * document has no pair of DIFFERENT templates carrying identical wording, so
   * dropping `templateId` from the key changed no end-to-end result and the
   * sabotage case for it slipped. These three assertions are what make each
   * field's removal independently visible.
   */
  const base = {
    templateId: "a.template",
    propositionKind: "recap",
    canonicalTextDigest: "digest",
  } as const

  it("distinguishes two reviewed templates with identical wording", () => {
    expect(bindingKey(base)).not.toBe(bindingKey({ ...base, templateId: "b.template" }))
  })

  it("distinguishes two roles for the same sentence", () => {
    expect(bindingKey(base)).not.toBe(bindingKey({ ...base, propositionKind: "lever" }))
  })

  it("distinguishes the same sentence before and after a canonical edit", () => {
    expect(bindingKey(base)).not.toBe(bindingKey({ ...base, canonicalTextDigest: "other" }))
  })

  it("gives one key to one binding", () => {
    expect(bindingKey(base)).toBe(bindingKey({ ...base }))
  })
})

describe("test packs cannot pass for production", () => {
  it("refuses a version that does not announce itself", () => {
    expect(() => testNarrativeVariantPack("narrative-variant-pack-v1-empty", [])).toThrow(
      /must begin with "test:"/,
    )
    expect(() => testNarrativeVariantPack("v1", [])).toThrow()
  })
})

describe("lookup is by binding, and never by content alone", () => {
  const report = reportFor("you")
  const pack = testPackForReport(report)

  it("resolves the eligible propositions", () => {
    for (const proposition of canonicalPropositionOrder(report)) {
      if (proposition.kind !== "recap" && proposition.kind !== "lever") continue
      expect(reviewedVariantForProposition(pack, proposition), proposition.id).not.toBeNull()
    }
  })

  it("resolves nothing for a loop beat, whose text is the lever's", () => {
    const propositions = canonicalPropositionOrder(report)
    const lever = propositions.find((p) => p.kind === "lever")!
    const beat = propositions.find((p) => p.kind === "loop-step")!
    // The collision is real: same bytes, same digest.
    expect(beat.text).toBe(lever.text)
    expect(narrativeDigest(beat.text)).toBe(narrativeDigest(lever.text))
    // And it resolves to nothing anyway.
    expect(reviewedVariantForProposition(pack, beat)).toBeNull()
  })

  it("resolves nothing for the quotation", () => {
    const quotation = canonicalPropositionOrder(report).find((p) => p.kind === "quotation")!
    expect(reviewedVariantForProposition(pack, quotation)).toBeNull()
  })

  it("exports no content-keyed lookup primitive", async () => {
    const packModule = await import("@/lib/report/narrative/variant-pack")
    // A `variantFor(digest)` would be exactly how a loop beat gets handed the
    // lever's reviewed wording. The only way in takes a real proposition.
    expect(Object.keys(packModule)).not.toContain("variantFor")
    expect(Object.keys(packModule)).not.toContain("variantForDigest")
    expect(Object.keys(packModule)).not.toContain("indexByBinding")
  })
})
