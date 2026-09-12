import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"

import { REPORT_SCHEMA_VERSION, COMPOSER_VERSION } from "@/lib/report/deterministic/report-types"
import { CONTENT_PACK_VERSION } from "@/lib/report/deterministic/content-pack"
import { REPORT_V1_SUPPORTED_BANKS } from "@/lib/report/deterministic/report-bank"
import { REPORT_USE_RECORD_VERSION } from "@/lib/report/deterministic/permissions"
import { serialiseReport } from "@/lib/report/deterministic/serialise"
import { buildNarrativeOverlay } from "@/lib/report/narrative/overlay"
import { isEligibleKind } from "@/lib/report/narrative/contract"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { validateRewrite } from "@/lib/report/narrative/validate"

import { echoRewriter, mutatingRewriter, reportFor } from "./narrative-fixtures"

/**
 * The S2 tripwires, re-asserted from S3 — Phase 4A-S3.
 *
 * ══ WHY THESE ARE ASSERTED AGAIN, IN A SECOND FILE ══════════════════════════
 *
 * `report-compose.test.ts` already pins the golden digests, and it is not
 * modified by this phase — its passing untouched is the primary evidence. This
 * file adds the specifically S3-shaped question: does the canonical document
 * still hash to the same value in a process where the narrative layer has been
 * imported, constructed and run? An overlay that reached the composer, the
 * serialiser or a proposition would show up here and nowhere else.
 *
 * If anything in this file goes red, S3 crossed into the canonical layer.
 * **The fix is to stop crossing it, never to re-pin the value.**
 */

const hash = (value: string) => createHash("sha256").update(value, "utf8").digest("hex")

/** The digests pinned by Phase 4A-S2. Copied, never recomputed. */
const S2_GOLDEN = {
  you: "eb8760cec7d394b70ea46a86f7c3679ca0cb03e72f77e088055461ba325694d9",
  family: "46b23209c42d8cb436fba66d7f015ad50e8d9c0396c98e93801779fc26096cc1",
} as const

describe("the S2 golden digests have not moved", () => {
  for (const foundation of ["you", "family"] as const) {
    it(`${foundation}: unchanged with the narrative layer never invoked`, () => {
      expect(hash(serialiseReport(reportFor(foundation)))).toBe(S2_GOLDEN[foundation])
    })

    it(`${foundation}: unchanged after an overlay has been built over it`, async () => {
      const report = reportFor(foundation)
      await buildNarrativeOverlay({
        report,
        rewriter: mutatingRewriter((text) => text.replace("You told us", "You reported")),
        enabled: true,
      })
      expect(hash(serialiseReport(report))).toBe(S2_GOLDEN[foundation])
    })

    it(`${foundation}: unchanged for a freshly composed Report afterwards`, async () => {
      await buildNarrativeOverlay({
        report: reportFor(foundation),
        rewriter: echoRewriter(),
        enabled: true,
      })
      // Composing again in the same process would catch a narrative module
      // that had mutated shared Core state — a frozen list, a cached pack.
      expect(hash(serialiseReport(reportFor(foundation)))).toBe(S2_GOLDEN[foundation])
    })
  }
})

describe("the S2 version pins have not moved", () => {
  it("keeps every version and fingerprint S3 was told to preserve", () => {
    expect(REPORT_SCHEMA_VERSION).toBe("personal-food-system-report-v1")
    expect(COMPOSER_VERSION).toBe("composer-v2")
    expect(CONTENT_PACK_VERSION).toBe("content-pack-v1")
    expect(REPORT_USE_RECORD_VERSION).toBe("report-use-v1")
    expect(REPORT_V1_SUPPORTED_BANKS.map((b) => b.fingerprint)).toEqual([
      "591ceb245296dab2d70dfb0420e0163a",
    ])
  })
})

describe("the overlay is not part of the canonical document", () => {
  it("never reaches the serialiser", async () => {
    const report = reportFor("you")
    const overlay = await buildNarrativeOverlay({
      report,
      rewriter: mutatingRewriter((text) => text.replace("You told us", "You reported")),
      enabled: true,
    })
    const serialised = serialiseReport(report)
    expect(serialised).not.toContain("optional-narrative-layer-v1")
    expect(serialised).not.toContain("narrativeText")
    expect(serialised).not.toContain("canonicalTextDigest")
    for (const item of overlay.items) {
      if (item.narrativeText) expect(serialised).not.toContain(item.narrativeText)
    }
  })

  it("leaves the Report deep-equal to a freshly composed one", async () => {
    const report = reportFor("family")
    await buildNarrativeOverlay({
      report,
      rewriter: mutatingRewriter((text) => text.replace("You told us", "You reported")),
      enabled: true,
    })
    expect(report).toEqual(reportFor("family"))
  })
})

describe("the layer is deterministic", () => {
  it("produces an identical overlay for identical input", async () => {
    const report = reportFor("family")
    const first = await buildNarrativeOverlay({
      report,
      rewriter: mutatingRewriter((t) => t.replace("You told us", "You reported")),
      enabled: true,
    })
    const second = await buildNarrativeOverlay({
      report,
      rewriter: mutatingRewriter((t) => t.replace("You told us", "You reported")),
      enabled: true,
    })
    expect(second).toEqual(first)
  })

  it("validates the same response identically twice", () => {
    const report = reportFor("you")
    for (const proposition of canonicalPropositionOrder(report)) {
      const candidate = proposition.text.replace("You told us", "You reported")
      expect(validateRewrite(proposition.text, candidate)).toEqual(
        validateRewrite(proposition.text, candidate),
      )
    }
  })
})

describe("eligibility, as it actually stands today", () => {
  /**
   * Stated as a fact rather than implied, because the honest position is
   * narrower than the contract's list.
   *
   * `constraint` is an eligible kind, and no composed Report currently
   * contains one: the composer targets `foodTools`, which requires the
   * `specificFoods` capability, which is disabled while the dietetic gate is
   * OPEN. So the sentences this layer can actually be asked to rewrite today
   * are recaps and the priority lever, and nothing else.
   */
  it("only recap and lever propositions are reachable while the dietetic gate is open", () => {
    for (const foundation of ["you", "family"] as const) {
      const report = reportFor(foundation)
      expect(report.constraints.propositions).toEqual([])
      const eligibleKinds = new Set(
        canonicalPropositionOrder(report)
          .filter((p) => isEligibleKind(p.kind))
          .map((p) => p.kind),
      )
      expect([...eligibleKinds].sort()).toEqual(["lever", "recap"])
    }
  })

  it("keeps constraint eligible anyway, so closing the gate needs no contract change", () => {
    expect(isEligibleKind("constraint")).toBe(true)
  })
})
