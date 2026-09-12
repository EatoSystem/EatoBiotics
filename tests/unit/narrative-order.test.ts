import { describe, it, expect } from "vitest"

import { customerFacingText } from "@/lib/report/deterministic/serialise"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { STRUCTURAL_COPY } from "@/lib/report/deterministic/content-pack"

import { reportFor } from "./narrative-fixtures"

/**
 * Canonical order — Phase 4A-S3.
 *
 * ══ WHY THIS IS WORTH A FILE OF ITS OWN ═════════════════════════════════════
 *
 * The overlay is joined to the Report BY POSITION. That is only safe if
 * "canonical order" has one definition, so the thing being proven here is not
 * that the walk is correct in the abstract — it is that the walk and the
 * renderer agree, sentence for sentence, on both foundations.
 */

describe("canonical proposition order", () => {
  for (const foundation of ["you", "family"] as const) {
    const report = reportFor(foundation)
    const ordered = canonicalPropositionOrder(report)
    const rendered = customerFacingText(report)

    it(`${foundation}: every proposition appears exactly once, in render order`, () => {
      const renderedTexts = rendered.filter((line) => ordered.some((p) => p.text === line))
      // Compared as sequences, not as sets: a walk that produced the right
      // sentences in the wrong order would satisfy a set comparison and label
      // every rewrite against its neighbour.
      expect(ordered.map((p) => p.text)).toEqual(renderedTexts)
    })

    it(`${foundation}: excludes section titles and loop beats`, () => {
      const structural = [
        STRUCTURAL_COPY.systemSnapshotTitle,
        STRUCTURAL_COPY.priorityLeverTitle,
        STRUCTURAL_COPY.constraintsTitle,
        STRUCTURAL_COPY.familyTitle,
        ...STRUCTURAL_COPY.loopBeats,
      ]
      for (const copy of structural) {
        expect(ordered.some((p) => p.text === copy)).toBe(false)
      }
      // …and those strings really are in the rendered document, so the
      // assertion above is excluding something rather than passing vacuously.
      expect(rendered).toContain(STRUCTURAL_COPY.systemSnapshotTitle)
      expect(rendered).toContain(STRUCTURAL_COPY.loopBeats[0])
    })

    it(`${foundation}: excludes the safety note, which is not a proposition`, () => {
      if (!report.safety.note) return
      expect(ordered.some((p) => p.text === report.safety.note)).toBe(false)
    })
  }

  it("includes the customer's quotation, in last position", () => {
    const report = reportFor("you")
    const ordered = canonicalPropositionOrder(report)
    expect(report.quotation).toBeDefined()
    expect(ordered[ordered.length - 1].kind).toBe("quotation")
  })

  it("carries household propositions after the personal ones, on a family Report", () => {
    const report = reportFor("family")
    const ordered = canonicalPropositionOrder(report)
    expect(report.familyContext).toBeDefined()
    const firstHousehold = ordered.findIndex(
      (p) => p === report.familyContext!.propositions[0],
    )
    const lastPersonal = ordered.findIndex((p) => p === report.systemSnapshot.propositions[0])
    expect(firstHousehold).toBeGreaterThan(lastPersonal)
  })

  /**
   * A real property of the composed document, asserted so nobody later
   * "fixes" the overlay by keying it on ids.
   *
   * On a family Report the same recap sentence can be admitted twice — once to
   * the personal snapshot and once to the household section — and it carries
   * the SAME proposition id both times, because the id is derived from the
   * answer field and value rather than from its position. Ids are therefore
   * not unique within a Report, and the overlay's 1:1 contract is positional
   * for that reason and not by accident.
   */
  it("proposition ids are not unique within a family Report", () => {
    const ordered = canonicalPropositionOrder(reportFor("family"))
    const ids = ordered.map((p) => p.id)
    expect(new Set(ids).size).toBeLessThan(ids.length)
  })
})
