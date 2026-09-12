import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"

import { serialiseReport } from "@/lib/report/deterministic/serialise"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { buildNarrativeOverlay, overlayMatchesReport } from "@/lib/report/narrative/overlay"
import {
  NARRATIVE_CONTRACT_VERSION,
  NARRATIVE_PROMPT_VERSION,
  NARRATIVE_VALIDATOR_VERSION,
  isEligibleKind,
} from "@/lib/report/narrative/contract"

import { echoRewriter, mutatingRewriter, reportFor } from "./narrative-fixtures"

/**
 * The overlay's 1:1 contract — Phase 4A-S3.
 *
 * ══ WHY COMPLETENESS IS THE THING BEING TESTED ══════════════════════════════
 *
 * The overlay is joined to the Report positionally. Every property that makes
 * that join safe — same length, same order, same ids, one item per
 * proposition — is asserted here, on both foundations, because a sparse or
 * reordered overlay would label the right rewrite against the wrong sentence
 * and nothing downstream could tell.
 */

const sha256 = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")

describe("the overlay is exactly 1:1 with the Report", () => {
  for (const foundation of ["you", "family"] as const) {
    it(`${foundation}: one item per proposition, in canonical order`, async () => {
      const report = reportFor(foundation)
      const propositions = canonicalPropositionOrder(report)
      const overlay = await buildNarrativeOverlay({
        report,
        rewriter: echoRewriter(),
        enabled: true,
      })

      expect(overlay.items.length).toBe(propositions.length)
      expect(overlay.items.map((i) => i.propositionId)).toEqual(propositions.map((p) => p.id))
      expect(overlay.items.map((i) => i.canonicalTextDigest)).toEqual(
        propositions.map((p) => sha256(p.text)),
      )
    })

    it(`${foundation}: binds to exactly one canonical document`, async () => {
      const report = reportFor(foundation)
      const overlay = await buildNarrativeOverlay({
        report,
        rewriter: echoRewriter(),
        enabled: true,
      })
      expect(overlay.canonicalReportDigest).toBe(sha256(serialiseReport(report)))
      expect(overlayMatchesReport(overlay, report)).toBe(true)

      // The other foundation is a different document, and the overlay must
      // refuse it rather than be reconciled against it.
      const other = reportFor(foundation === "you" ? "family" : "you")
      expect(overlayMatchesReport(overlay, other)).toBe(false)
    })

    it(`${foundation}: carries the versions it was produced under`, async () => {
      const overlay = await buildNarrativeOverlay({
        report: reportFor(foundation),
        rewriter: echoRewriter(),
        enabled: true,
      })
      expect(overlay.kind).toBe("optional-narrative-layer-v1")
      expect(overlay.narrativeContractVersion).toBe(NARRATIVE_CONTRACT_VERSION)
      expect(overlay.promptVersion).toBe(NARRATIVE_PROMPT_VERSION)
      expect(overlay.validatorVersion).toBe(NARRATIVE_VALIDATOR_VERSION)
    })

    it(`${foundation}: every item is one status with the matching field`, async () => {
      const overlay = await buildNarrativeOverlay({
        report: reportFor(foundation),
        rewriter: echoRewriter(),
        enabled: true,
      })
      for (const item of overlay.items) {
        if (item.status === "accepted") {
          expect(typeof item.narrativeText).toBe("string")
          expect(item.fallbackReason).toBeUndefined()
        } else {
          expect(item.narrativeText).toBeUndefined()
          expect(typeof item.fallbackReason).toBe("string")
        }
      }
    })
  }
})

describe("exactly one operation per eligible proposition, and none for the rest", () => {
  for (const foundation of ["you", "family"] as const) {
    it(`${foundation}: call count equals the eligible count`, async () => {
      const report = reportFor(foundation)
      const propositions = canonicalPropositionOrder(report)
      const eligible = propositions.filter((p) => isEligibleKind(p.kind))
      const rewriter = echoRewriter()

      await buildNarrativeOverlay({ report, rewriter, enabled: true })

      expect(rewriter.calls.length).toBe(eligible.length)
      // Not batched: one payload per eligible proposition, each carrying a
      // single sentence, so a call physically cannot see a second one.
      expect(rewriter.calls.map((c) => c.text).sort()).toEqual(
        eligible.map((p) => p.text).sort(),
      )
    })

    it(`${foundation}: the quotation is never sent`, async () => {
      const report = reportFor(foundation)
      const rewriter = echoRewriter()
      await buildNarrativeOverlay({ report, rewriter, enabled: true })

      expect(report.quotation).toBeDefined()
      for (const call of rewriter.calls) {
        expect(call.text).not.toBe(report.quotation!.text)
      }
      const quotationItem = (
        await buildNarrativeOverlay({ report, rewriter: echoRewriter(), enabled: true })
      ).items.slice(-1)[0]
      expect(quotationItem.status).toBe("canonical-only")
      expect(quotationItem.fallbackReason).toBe("ineligible-quotation")
    })

    it(`${foundation}: no loop step is sent, and none copies the lever's rewrite`, async () => {
      const report = reportFor(foundation)
      const propositions = canonicalPropositionOrder(report)
      const rewriter = mutatingRewriter((text) => text.replace("You told us", "You reported"))
      const overlay = await buildNarrativeOverlay({ report, rewriter, enabled: true })

      const loopIndices = propositions
        .map((p, i) => (p.kind === "loop-step" ? i : -1))
        .filter((i) => i >= 0)
      expect(loopIndices.length).toBe(4)

      for (const index of loopIndices) {
        expect(overlay.items[index].status).toBe("canonical-only")
        expect(overlay.items[index].fallbackReason).toBe("ineligible-loop-step")
        // The tempting shortcut — reuse the lever's accepted rewrite for the
        // four beats — would show up here as narrative text on a loop item.
        expect(overlay.items[index].narrativeText).toBeUndefined()
      }

      const leverIndex = propositions.findIndex((p) => p.kind === "lever")
      expect(overlay.items[leverIndex].status).toBe("accepted")
    })
  }
})

describe("the overlay never touches the Report", () => {
  it("leaves the document byte-identical", async () => {
    const report = reportFor("family")
    const before = serialiseReport(report)
    await buildNarrativeOverlay({
      report,
      rewriter: mutatingRewriter((text) => text.replace("You told us", "You reported")),
      enabled: true,
    })
    expect(serialiseReport(report)).toBe(before)
  })

  it("stores no canonical text, only a digest of it", async () => {
    const report = reportFor("you")
    /*
     * A rewriter that actually changes the wording, so that "the overlay
     * contains this sentence" can only mean it stored a canonical copy. An
     * echo rewriter would make an accepted rewrite byte-identical to the
     * canonical sentence and the assertion would be untestable rather than
     * satisfied.
     */
    const overlay = await buildNarrativeOverlay({
      report,
      rewriter: mutatingRewriter((text) => text.replace("You told us", "You reported")),
      enabled: true,
    })
    const serialised = JSON.stringify(overlay)
    for (const proposition of canonicalPropositionOrder(report)) {
      expect(serialised, `canonical wording stored: ${proposition.text}`).not.toContain(
        proposition.text,
      )
    }
    for (const item of overlay.items) {
      expect(Object.keys(item)).not.toContain("canonicalText")
    }
  })
})

describe("bounded concurrency changes nothing but the timing", () => {
  it("produces the same overlay at 1, 4 and 64 in flight", async () => {
    const report = reportFor("family")
    const results = []
    for (const concurrency of [1, 4, 64]) {
      results.push(
        await buildNarrativeOverlay({
          report,
          rewriter: mutatingRewriter((text) => text.replace("You told us", "You reported")),
          enabled: true,
          concurrency,
        }),
      )
    }
    expect(results[1]).toEqual(results[0])
    expect(results[2]).toEqual(results[0])
  })

  it("issues one call per eligible proposition however many workers there are", async () => {
    const report = reportFor("family")
    const eligible = canonicalPropositionOrder(report).filter((p) => isEligibleKind(p.kind))
    for (const concurrency of [1, 2, 64]) {
      const rewriter = echoRewriter()
      await buildNarrativeOverlay({ report, rewriter, enabled: true, concurrency })
      expect(rewriter.calls.length, `concurrency ${concurrency}`).toBe(eligible.length)
    }
  })
})
