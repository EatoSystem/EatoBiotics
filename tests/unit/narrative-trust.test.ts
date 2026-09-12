import { describe, it, expect } from "vitest"

import { customerFacingText } from "@/lib/report/deterministic/serialise"
import { narrativeDigest } from "@/lib/report/narrative/digest"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { buildNarrativeOverlay } from "@/lib/report/narrative/overlay"
import { narrativeRenderPlan, overlayMatchesReport } from "@/lib/report/narrative/trust"
import { PRODUCTION_NARRATIVE_VARIANT_PACK } from "@/lib/report/narrative/variant-pack"
import type {
  NarrativeItem,
  OptionalNarrativeLayerV1,
} from "@/lib/report/narrative/types"

import { emptyTestPack, reportFor, testPackForReport } from "./narrative-fixtures"

/**
 * Authority to render — Phase 4A-S3.
 *
 * ══ TWO PROOFS, NOT ONE ═════════════════════════════════════════════════════
 *
 *   overlayMatchesReport   "this overlay is bound to this document"
 *   narrativeRenderPlan    "this overlay may be rendered"
 *
 * The first is deliberately insufficient, and the first test below shows it:
 * a hand-built overlay claiming a variant nobody reviewed passes it happily.
 * Conflating the two is how such an overlay reaches a page.
 *
 * ══ AND WHAT PASSING STILL DOES NOT MEAN ════════════════════════════════════
 *
 * Not that any wording means what its canonical sentence means. Only that
 * every narrative string in the plan is the exact string committed in the
 * reviewed pack for the exact binding at that position.
 */

const REPORT = reportFor("you")
const PROPOSITIONS = canonicalPropositionOrder(REPORT)
const PACK = testPackForReport(REPORT)
const OVERLAY = buildNarrativeOverlay({ report: REPORT, pack: PACK, enabled: true })

/** A structurally valid overlay with one field changed. */
function tweak(over: Partial<OptionalNarrativeLayerV1>): OptionalNarrativeLayerV1 {
  return { ...OVERLAY, ...over }
}

/** The same, with one item replaced. */
function withItem(index: number, item: NarrativeItem): OptionalNarrativeLayerV1 {
  const items = [...OVERLAY.items]
  items[index] = item
  return { ...OVERLAY, items }
}

const firstVariantIndex = OVERLAY.items.findIndex((i) => i.status === "reviewed-variant")
const loopIndex = PROPOSITIONS.findIndex((p) => p.kind === "loop-step")
const leverIndex = PROPOSITIONS.findIndex((p) => p.kind === "lever")
const leverVariantId = (() => {
  const item = OVERLAY.items[leverIndex]
  if (item.status !== "reviewed-variant") throw new Error("fixture: the lever has no variant")
  return item.variantId
})()

describe("structural binding is not authority", () => {
  it("a forged overlay passes overlayMatchesReport and fails the render plan", () => {
    const forged = withItem(loopIndex, {
      status: "reviewed-variant",
      propositionId: PROPOSITIONS[loopIndex].id,
      canonicalTextDigest: narrativeDigest(PROPOSITIONS[loopIndex].text),
      variantId: leverVariantId,
    })
    // Every digest lines up, because the loop beat's text IS the lever's.
    expect(overlayMatchesReport(forged, REPORT)).toBe(true)

    const plan = narrativeRenderPlan({ overlay: forged, report: REPORT, pack: PACK })
    expect(plan.usable).toBe(false)
    if (plan.usable) return
    expect(plan.reason).toBe("variant-on-ineligible-kind")
  })

  it("is still a real check — it compares every position, not just the totals", () => {
    /*
     * `overlayMatchesReport` is the weaker of the two proofs, which is not the
     * same as it being a formality. This pins its own contract: the item count
     * and the document digest both line up here, and only one position's id is
     * wrong.
     */
    const misplaced = withItem(0, {
      ...(OVERLAY.items[0] as Extract<NarrativeItem, { status: "reviewed-variant" }>),
      propositionId: PROPOSITIONS[1].id,
    })
    expect(misplaced.items.length).toBe(OVERLAY.items.length)
    expect(misplaced.canonicalReportDigest).toBe(OVERLAY.canonicalReportDigest)
    expect(overlayMatchesReport(misplaced, REPORT)).toBe(false)
  })
})

describe("the render plan refuses", () => {
  const CASES: readonly {
    readonly name: string
    readonly overlay: OptionalNarrativeLayerV1
    readonly reason: string
  }[] = [
    {
      name: "an unknown overlay kind",
      overlay: tweak({ kind: "something-else" as never }),
      reason: "overlay-kind-unknown",
    },
    {
      name: "an unsupported contract version",
      overlay: tweak({ narrativeContractVersion: "narrative-v99" as never }),
      reason: "contract-version-unsupported",
    },
    {
      name: "a pack version the overlay was not resolved against",
      overlay: tweak({ variantPackVersion: "test:some-other-pack" }),
      reason: "variant-pack-mismatch",
    },
    {
      name: "a stale canonical Report digest",
      overlay: tweak({ canonicalReportDigest: narrativeDigest("a different document") }),
      reason: "report-digest-mismatch",
    },
    {
      name: "an item dropped",
      overlay: tweak({ items: OVERLAY.items.slice(1) }),
      reason: "item-count-mismatch",
    },
    {
      name: "an item added",
      overlay: tweak({ items: [...OVERLAY.items, OVERLAY.items[0]] }),
      reason: "item-count-mismatch",
    },
    {
      name: "the items reordered",
      overlay: tweak({ items: [...OVERLAY.items].reverse() }),
      reason: "position-mismatch",
    },
    {
      name: "a stale per-position canonical digest",
      overlay: withItem(0, {
        ...(OVERLAY.items[0] as Extract<NarrativeItem, { status: "canonical-only" }>),
        canonicalTextDigest: narrativeDigest("different wording"),
      }),
      reason: "position-mismatch",
    },
    {
      name: "a reviewed-variant item with no variant",
      overlay: withItem(firstVariantIndex, {
        status: "reviewed-variant",
        propositionId: PROPOSITIONS[firstVariantIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[firstVariantIndex].text),
        variantId: "",
      }),
      reason: "item-shape-invalid",
    },
    {
      name: "a reviewed-variant item carrying a fallback reason",
      overlay: withItem(firstVariantIndex, {
        status: "reviewed-variant",
        propositionId: PROPOSITIONS[firstVariantIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[firstVariantIndex].text),
        variantId: leverVariantId,
        fallbackReason: "no-approved-variant",
      } as unknown as NarrativeItem),
      reason: "item-shape-invalid",
    },
    {
      name: "a canonical-only item carrying variant authority",
      overlay: withItem(loopIndex, {
        status: "canonical-only",
        propositionId: PROPOSITIONS[loopIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[loopIndex].text),
        fallbackReason: "ineligible-loop-step",
        variantId: leverVariantId,
      } as unknown as NarrativeItem),
      reason: "item-shape-invalid",
    },
    {
      name: "a canonical-only item with no reason",
      overlay: withItem(loopIndex, {
        status: "canonical-only",
        propositionId: PROPOSITIONS[loopIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[loopIndex].text),
      } as unknown as NarrativeItem),
      reason: "item-shape-invalid",
    },
    {
      name: "a variantId the pack does not hold",
      overlay: withItem(firstVariantIndex, {
        status: "reviewed-variant",
        propositionId: PROPOSITIONS[firstVariantIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[firstVariantIndex].text),
        variantId: "v-invented",
      }),
      reason: "variant-unknown",
    },
  ]

  for (const testCase of CASES) {
    it(`${testCase.name} → canonical`, () => {
      const plan = narrativeRenderPlan({ overlay: testCase.overlay, report: REPORT, pack: PACK })
      expect(plan.usable, `accepted: ${testCase.name}`).toBe(false)
      if (plan.usable) return
      expect(plan.reason).toBe(testCase.reason)
    })
  }

  it("a variant reviewed for a different template", () => {
    // Same role, same wording digest, different reviewed content identity.
    const recapIndex = PROPOSITIONS.findIndex(
      (p) => p.kind === "recap" && p.templateId !== PROPOSITIONS[leverIndex].templateId,
    )
    const recapItem = OVERLAY.items[recapIndex]
    if (recapItem.status !== "reviewed-variant") throw new Error("fixture")
    const plan = narrativeRenderPlan({
      overlay: withItem(leverIndex, {
        status: "reviewed-variant",
        propositionId: PROPOSITIONS[leverIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[leverIndex].text),
        variantId: recapItem.variantId,
      }),
      report: REPORT,
      pack: PACK,
    })
    expect(plan.usable).toBe(false)
    if (plan.usable) return
    expect(plan.reason).toBe("variant-binding-mismatch")
  })

  it("a variant reviewed for the other role of the same wording", () => {
    // The lever's variant, named at the recap twin's position. Identical
    // bytes, identical digest, different role — refused.
    const twinIndex = PROPOSITIONS.findIndex(
      (p) => p.kind === "recap" && p.text === PROPOSITIONS[leverIndex].text,
    )
    expect(twinIndex).toBeGreaterThanOrEqual(0)
    const plan = narrativeRenderPlan({
      overlay: withItem(twinIndex, {
        status: "reviewed-variant",
        propositionId: PROPOSITIONS[twinIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[twinIndex].text),
        variantId: leverVariantId,
      }),
      report: REPORT,
      pack: PACK,
    })
    expect(plan.usable).toBe(false)
    if (plan.usable) return
    expect(plan.reason).toBe("variant-binding-mismatch")
  })

  it("an invalid pack, whatever the overlay says", () => {
    const broken = { ...PACK, kind: "not-a-pack" } as unknown as typeof PACK
    const plan = narrativeRenderPlan({ overlay: OVERLAY, report: REPORT, pack: broken })
    expect(plan.usable).toBe(false)
    if (plan.usable) return
    expect(plan.reason).toBe("variant-pack-invalid")
  })

  it("in full — one bad position does not leave the rest usable", () => {
    const plan = narrativeRenderPlan({
      overlay: withItem(firstVariantIndex, {
        status: "reviewed-variant",
        propositionId: PROPOSITIONS[firstVariantIndex].id,
        canonicalTextDigest: narrativeDigest(PROPOSITIONS[firstVariantIndex].text),
        variantId: "v-invented",
      }),
      report: REPORT,
      pack: PACK,
    })
    // No partial plan, no per-item salvage: the whole overlay is refused.
    expect(plan.usable).toBe(false)
    expect("text" in plan).toBe(false)
  })
})

describe("the render plan accepts", () => {
  it("a correct overlay, taking every narrative string from the pack", () => {
    const plan = narrativeRenderPlan({ overlay: OVERLAY, report: REPORT, pack: PACK })
    expect(plan.usable, plan.usable ? "" : `${plan.reason}: ${plan.detail}`).toBe(true)
    if (!plan.usable) return

    expect(plan.text.length).toBe(PROPOSITIONS.length)
    PROPOSITIONS.forEach((proposition, index) => {
      const item = OVERLAY.items[index]
      if (item.status === "canonical-only") {
        expect(plan.text[index]).toBe(proposition.text)
        return
      }
      const variant = PACK.variants.find((v) => v.variantId === item.variantId)!
      // The only source of narrative wording is the pack.
      expect(plan.text[index]).toBe(variant.narrativeText)
      expect(plan.text[index]).not.toBe(proposition.text)
    })
  })

  it("an empty pack, rendering the canonical Report exactly", () => {
    const pack = emptyTestPack()
    const overlay = buildNarrativeOverlay({ report: REPORT, pack, enabled: true })
    const plan = narrativeRenderPlan({ overlay, report: REPORT, pack })
    expect(plan.usable, plan.usable ? "" : plan.reason).toBe(true)
    if (!plan.usable) return
    expect(plan.text).toEqual(PROPOSITIONS.map((p) => p.text))
  })

  it("the production pack, which is empty — and the plan is the S2 document", () => {
    const pack = PRODUCTION_NARRATIVE_VARIANT_PACK
    const overlay = buildNarrativeOverlay({ report: REPORT, pack, enabled: true })
    const plan = narrativeRenderPlan({ overlay, report: REPORT, pack })
    expect(plan.usable).toBe(true)
    if (!plan.usable) return

    // Every rendered proposition is its canonical sentence, and in the same
    // order the renderer walks — an empty pack is not a degraded mode.
    const rendered = customerFacingText(REPORT)
    for (const line of plan.text) expect(rendered).toContain(line)
    expect(plan.text).toEqual(PROPOSITIONS.map((p) => p.text))
  })

  it("a pack with a variant for only some positions", () => {
    const partial = {
      ...PACK,
      variants: PACK.variants.slice(0, 1),
    }
    const overlay = buildNarrativeOverlay({ report: REPORT, pack: partial, enabled: true })
    const plan = narrativeRenderPlan({ overlay, report: REPORT, pack: partial })
    expect(plan.usable).toBe(true)
    if (!plan.usable) return
    const variantCount = overlay.items.filter((i) => i.status === "reviewed-variant").length
    expect(variantCount).toBe(1)
    expect(overlay.items.filter((i) => i.fallbackReason === "no-approved-variant").length)
      .toBeGreaterThan(0)
  })
})

describe("the most→least string cannot reach a customer", () => {
  /**
   * The counterexample that ended the previous architecture, kept as a
   * runtime assertion rather than a memory.
   *
   * There is no input to the runtime that produces it: it is not in the pack,
   * and the pack is the only source of narrative wording.
   */
  const INVERTED = "You told us energy is what you least want to work on."

  it("is absent from every render plan the runtime can produce", () => {
    for (const pack of [PACK, emptyTestPack(), PRODUCTION_NARRATIVE_VARIANT_PACK]) {
      const overlay = buildNarrativeOverlay({ report: REPORT, pack, enabled: true })
      const plan = narrativeRenderPlan({ overlay, report: REPORT, pack })
      expect(plan.usable).toBe(true)
      if (!plan.usable) continue
      expect(plan.text).not.toContain(INVERTED)
    }
  })

  it("could only appear by being committed to a reviewed pack", () => {
    // Stated as a test so the claim is exact: the architecture does not make
    // the inversion detectable, it makes it un-reachable without a human
    // having committed that exact string for that exact binding.
    expect(PACK.variants.some((v) => v.narrativeText === INVERTED)).toBe(false)
    expect(PRODUCTION_NARRATIVE_VARIANT_PACK.variants).toEqual([])
  })
})
