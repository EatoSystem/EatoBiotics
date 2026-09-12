import { describe, it, expect } from "vitest"

import { serialiseReport } from "@/lib/report/deterministic/serialise"
import {
  NARRATIVE_CONTRACT_VERSION,
  isEligibleKind,
} from "@/lib/report/narrative/contract"
import { narrativeDigest } from "@/lib/report/narrative/digest"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { overlayMatchesReport } from "@/lib/report/narrative/trust"
import { committedProductionPack } from "./narrative-fixtures"

import {
  buildTestOverlay,
  emptyTestPack,
  reportFor,
  testPackForReport,
} from "./narrative-fixtures"

/**
 * The overlay's 1:1 contract — Phase 4A-S3.
 *
 * The overlay is joined to the Report positionally, so every property that
 * makes the join safe is asserted here on both foundations: same length, same
 * order, same ids, one item per proposition. A sparse or reordered overlay
 * would label the right variant against the wrong sentence.
 *
 * It carries no wording of any kind — canonical or narrative. The reviewed
 * pack is the sole authority for the latter, and `PersonalFoodSystemReportV1`
 * for the former.
 */

describe("the overlay is exactly 1:1 with the Report", () => {
  for (const foundation of ["you", "family"] as const) {
    const report = reportFor(foundation)
    const pack = testPackForReport(report)
    const overlay = buildTestOverlay({ report, pack, enabled: true })
    const propositions = canonicalPropositionOrder(report)

    it(`${foundation}: one item per proposition, in canonical order`, () => {
      expect(overlay.items.length).toBe(propositions.length)
      expect(overlay.items.map((i) => i.propositionId)).toEqual(propositions.map((p) => p.id))
      expect(overlay.items.map((i) => i.canonicalTextDigest)).toEqual(
        propositions.map((p) => narrativeDigest(p.text)),
      )
    })

    it(`${foundation}: binds to one document and one pack`, () => {
      expect(overlay.canonicalReportDigest).toBe(narrativeDigest(serialiseReport(report)))
      expect(overlay.variantPackVersion).toBe(pack.version)
      expect(overlay.narrativeContractVersion).toBe(NARRATIVE_CONTRACT_VERSION)
      expect(overlay.kind).toBe("optional-narrative-layer-v1")
      expect(overlayMatchesReport(overlay, report)).toBe(true)

      const other = reportFor(foundation === "you" ? "family" : "you")
      expect(overlayMatchesReport(overlay, other)).toBe(false)
    })

    it(`${foundation}: carries no wording, canonical or narrative`, () => {
      const serialised = JSON.stringify(overlay)
      for (const proposition of propositions) {
        expect(serialised, `canonical wording stored: ${proposition.text}`).not.toContain(
          proposition.text,
        )
      }
      for (const variant of pack.variants) {
        expect(serialised, "narrative wording stored").not.toContain(variant.narrativeText)
      }
      for (const item of overlay.items) {
        expect(Object.keys(item)).not.toContain("narrativeText")
        expect(Object.keys(item)).not.toContain("canonicalText")
      }
    })

    it(`${foundation}: every item is one status with the matching field`, () => {
      for (const item of overlay.items) {
        if (item.status === "reviewed-variant") {
          expect(typeof item.variantId).toBe("string")
          expect(item.variantId.length).toBeGreaterThan(0)
          expect(item.fallbackReason).toBeUndefined()
        } else {
          expect(item.variantId).toBeUndefined()
          expect(typeof item.fallbackReason).toBe("string")
        }
      }
    })

    it(`${foundation}: only eligible propositions carry a variant`, () => {
      overlay.items.forEach((item, index) => {
        if (item.status !== "reviewed-variant") return
        expect(isEligibleKind(propositions[index].kind), propositions[index].kind).toBe(true)
      })
    })
  }
})

describe("the two exclusions", () => {
  for (const foundation of ["you", "family"] as const) {
    const report = reportFor(foundation)
    const pack = testPackForReport(report)
    const overlay = buildTestOverlay({ report, pack, enabled: true })
    const propositions = canonicalPropositionOrder(report)

    it(`${foundation}: the quotation is canonical-only`, () => {
      const index = propositions.findIndex((p) => p.kind === "quotation")
      expect(index).toBeGreaterThanOrEqual(0)
      expect(overlay.items[index].status).toBe("canonical-only")
      expect(overlay.items[index].fallbackReason).toBe("ineligible-quotation")
    })

    it(`${foundation}: the four loop beats are canonical-only, though their text is the lever's`, () => {
      const lever = propositions.find((p) => p.kind === "lever")!
      const loopIndices = propositions
        .map((p, i) => (p.kind === "loop-step" ? i : -1))
        .filter((i) => i >= 0)
      expect(loopIndices.length).toBe(4)

      for (const index of loopIndices) {
        // The collision the binding and the eligibility check both guard.
        expect(propositions[index].text).toBe(lever.text)
        expect(overlay.items[index].status).toBe("canonical-only")
        expect(overlay.items[index].fallbackReason).toBe("ineligible-loop-step")
        expect(overlay.items[index].variantId).toBeUndefined()
      }

      // …and the lever itself did resolve, so the assertion above is not
      // passing because nothing resolved anywhere.
      const leverIndex = propositions.findIndex((p) => p.kind === "lever")
      expect(overlay.items[leverIndex].status).toBe("reviewed-variant")
    })
  }
})

describe("the lever and its recap twin are reviewed separately", () => {
  const report = reportFor("you")
  const propositions = canonicalPropositionOrder(report)
  const pack = testPackForReport(report)
  const overlay = buildTestOverlay({ report, pack, enabled: true })

  it("share their wording and not their variant", () => {
    const leverIndex = propositions.findIndex((p) => p.kind === "lever")
    const twinIndex = propositions.findIndex(
      (p) => p.kind === "recap" && p.text === propositions[leverIndex].text,
    )
    expect(twinIndex).toBeGreaterThanOrEqual(0)

    const lever = overlay.items[leverIndex]
    const twin = overlay.items[twinIndex]
    if (lever.status !== "reviewed-variant" || twin.status !== "reviewed-variant") {
      throw new Error("fixture: both should resolve")
    }
    // One sentence, two roles, two reviews, two variants.
    expect(lever.variantId).not.toBe(twin.variantId)
  })
})

describe("the overlay never touches the Report", () => {
  it("leaves the document byte-identical", () => {
    const report = reportFor("family")
    const before = serialiseReport(report)
    buildTestOverlay({ report, pack: testPackForReport(report), enabled: true })
    expect(serialiseReport(report)).toBe(before)
  })
})

describe("off by default, and off is complete", () => {
  const report = reportFor("you")
  const pack = testPackForReport(report)

  it("does not switch itself on", () => {
    const overlay = buildTestOverlay({ report, pack })
    const propositions = canonicalPropositionOrder(report)
    overlay.items.forEach((item, index) => {
      expect(item.status).toBe("canonical-only")
      // A quotation is not canonical-only because the switch is off today —
      // it is canonical-only permanently, and the reason says which.
      expect(item.fallbackReason).toBe(
        isEligibleKind(propositions[index].kind)
          ? "narrative-disabled"
          : item.fallbackReason,
      )
      if (!isEligibleKind(propositions[index].kind)) {
        expect(item.fallbackReason).toMatch(/^ineligible-/)
      }
    })
  })

  it("disabled still produces a complete, ordered overlay", () => {
    const overlay = buildTestOverlay({ report, pack, enabled: false })
    const propositions = canonicalPropositionOrder(report)
    expect(overlay.items.length).toBe(propositions.length)
    expect(overlay.items.map((i) => i.propositionId)).toEqual(propositions.map((p) => p.id))
  })

  it("an empty pack yields every position canonical-only, and that is not a failure", () => {
    const overlay = buildTestOverlay({ report, pack: emptyTestPack(), enabled: true })
    const propositions = canonicalPropositionOrder(report)
    overlay.items.forEach((item, index) => {
      expect(item.status).toBe("canonical-only")
      const expected = isEligibleKind(propositions[index].kind)
        ? "no-approved-variant"
        : item.fallbackReason
      expect(item.fallbackReason).toBe(expected)
    })
  })

  it("the production pack is the empty case", () => {
    const overlay = buildTestOverlay({
      report,
      pack: committedProductionPack(),
      enabled: true,
    })
    expect(overlay.items.every((i) => i.status === "canonical-only")).toBe(true)
  })
})

describe("the builder is deterministic and synchronous", () => {
  it("returns an overlay, not a promise", () => {
    const report = reportFor("you")
    const overlay = buildTestOverlay({ report, pack: testPackForReport(report), enabled: true })
    expect(overlay).not.toBeInstanceOf(Promise)
    expect(typeof (overlay as unknown as { then?: unknown }).then).toBe("undefined")
  })

  it("produces an identical overlay for identical input", () => {
    const report = reportFor("family")
    const pack = testPackForReport(report)
    expect(buildTestOverlay({ report, pack, enabled: true })).toEqual(
      buildTestOverlay({ report, pack, enabled: true }),
    )
  })
})
