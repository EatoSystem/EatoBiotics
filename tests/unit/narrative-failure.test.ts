import { describe, it, expect } from "vitest"

import { customerFacingText, serialiseReport } from "@/lib/report/deterministic/serialise"
import {
  isEligibleKind,
  type RuntimeNarrativeFallbackReason,
} from "@/lib/report/narrative/contract"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import {
  NARRATIVE_VARIANT_PACK_KIND,
  type NarrativeVariantPackV1,
} from "@/lib/report/narrative/variant-pack"

import {
  buildTestOverlay,
  emptyTestPack,
  renderTestPlan,
  reportFor,
  testPackForReport,
} from "./narrative-fixtures"

/**
 * Every way this can go wrong at runtime — Phase 4A-S3.
 *
 * ══ THE ONE PROPERTY BEING PROVEN ═══════════════════════════════════════════
 *
 * No failure of the narrative layer damages the Report. Every path ends the
 * same way: a complete overlay, a typed reason, and the canonical document
 * untouched and renderable.
 *
 * ══ WHAT IS NOT HERE ANY MORE ═══════════════════════════════════════════════
 *
 * Timeouts, thrown providers, malformed responses and retries. None of them
 * are runtime failure modes now — there is no model call during a customer's
 * request to fail. They are authoring failures, and they are tested in
 * `narrative-authoring.test.ts`. Keeping them here would test a code path
 * that no longer exists.
 */

const REPORT = reportFor("you")
const PROPOSITIONS = canonicalPropositionOrder(REPORT)

function expectAllCanonicalOnly(
  overlay: ReturnType<typeof buildTestOverlay>,
  eligibleReason: RuntimeNarrativeFallbackReason,
) {
  expect(overlay.items.length).toBe(PROPOSITIONS.length)
  overlay.items.forEach((item, index) => {
    expect(item.status).toBe("canonical-only")
    expect(item.variantId).toBeUndefined()
    if (isEligibleKind(PROPOSITIONS[index].kind)) {
      expect(item.fallbackReason).toBe(eligibleReason)
    } else {
      expect(item.fallbackReason).toMatch(/^ineligible-/)
    }
  })
}

describe("nothing to render from", () => {
  it("disabled: every item says so", () => {
    expectAllCanonicalOnly(
      buildTestOverlay({ report: REPORT, pack: testPackForReport(REPORT), enabled: false }),
      "narrative-disabled",
    )
  })

  it("disabled by omission: the layer does not switch itself on", () => {
    expectAllCanonicalOnly(
      buildTestOverlay({ report: REPORT, pack: testPackForReport(REPORT) }),
      "narrative-disabled",
    )
  })

  it("empty pack: eligible positions have no approved variant", () => {
    expectAllCanonicalOnly(
      buildTestOverlay({ report: REPORT, pack: emptyTestPack(), enabled: true }),
      "no-approved-variant",
    )
  })
})

describe("an unusable pack fails closed, in full", () => {
  const BROKEN: readonly { readonly name: string; readonly pack: NarrativeVariantPackV1 }[] = [
    {
      name: "an unknown kind",
      pack: { ...testPackForReport(REPORT), kind: "elsewhere" } as unknown as NarrativeVariantPackV1,
    },
    {
      name: "an unrecognised version",
      pack: { ...testPackForReport(REPORT), version: "v9" },
    },
    {
      name: "a duplicated variant id",
      pack: (() => {
        const pack = testPackForReport(REPORT)
        return { ...pack, variants: [...pack.variants, pack.variants[0]] }
      })(),
    },
    {
      name: "a variant bound to an unknown template",
      pack: (() => {
        const pack = testPackForReport(REPORT)
        return {
          ...pack,
          variants: [...pack.variants, { ...pack.variants[0], variantId: "x", templateId: "nope" }],
        }
      })(),
    },
    {
      name: "a variant carrying no wording",
      pack: (() => {
        const pack = testPackForReport(REPORT)
        return {
          kind: NARRATIVE_VARIANT_PACK_KIND,
          version: pack.version,
          variants: [{ ...pack.variants[0], narrativeText: "" }],
        }
      })(),
    },
  ]

  for (const { name, pack } of BROKEN) {
    it(`${name}: the overlay says so and nothing resolves`, () => {
      const overlay = buildTestOverlay({ report: REPORT, pack, enabled: true })
      expectAllCanonicalOnly(overlay, "variant-pack-invalid")
    })

    it(`${name}: the render plan refuses`, () => {
      const overlay = buildTestOverlay({ report: REPORT, pack, enabled: true })
      const plan = renderTestPlan({ overlay, report: REPORT, pack })
      expect(plan.usable).toBe(false)
    })
  }
})

describe("no failure reaches the Report", () => {
  it("leaves the canonical document identical under every runtime failure mode", () => {
    const before = serialiseReport(REPORT)
    const beforeText = customerFacingText(REPORT).join("\n")

    for (const pack of [
      testPackForReport(REPORT),
      emptyTestPack(),
      { ...testPackForReport(REPORT), version: "v9" },
    ]) {
      for (const enabled of [true, false]) {
        const overlay = buildTestOverlay({ report: REPORT, pack, enabled })
        renderTestPlan({ overlay, report: REPORT, pack })
      }
    }

    expect(serialiseReport(REPORT)).toBe(before)
    expect(customerFacingText(REPORT).join("\n")).toBe(beforeText)
  })

  it("never throws, whatever it is handed", () => {
    const nonsense = { kind: "?", version: 7, variants: null } as unknown as NarrativeVariantPackV1
    expect(() =>
      buildTestOverlay({ report: REPORT, pack: nonsense, enabled: true }),
    ).not.toThrow()
  })

  it("the canonical Report is complete without the layer at all", () => {
    // The phase's acceptance test, asserted rather than asserted-in-prose:
    // nothing in the narrative directory is needed to render the document.
    const rendered = customerFacingText(REPORT)
    expect(rendered.length).toBeGreaterThan(0)
    for (const proposition of PROPOSITIONS) expect(rendered).toContain(proposition.text)
  })
})
