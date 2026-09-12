import { describe, it, expect } from "vitest"

import { customerFacingText } from "@/lib/report/deterministic/serialise"
import { NARRATIVE_ACCEPTANCE_GATE } from "@/lib/report/narrative/contract"
import { narrativeDigest } from "@/lib/report/narrative/digest"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { buildNarrativeOverlay } from "@/lib/report/narrative/overlay"
import {
  COMMITTED_NARRATIVE_VARIANT_PACKS,
  CURRENT_COMMITTED_PACK_VERSION,
  committedPackForVersion,
  currentCommittedPack,
} from "@/lib/report/narrative/registry"
import { narrativeRenderPlan } from "@/lib/report/narrative/trust"
import {
  PRODUCTION_NARRATIVE_VARIANT_PACK,
  PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "@/lib/report/narrative/variant-pack"

import { reportFor, testPackForReport } from "./narrative-fixtures"

/**
 * Who decides what a customer reads — Phase 4A-S3.
 *
 * ══ THE BLOCKER THIS FILE EXISTS FOR ════════════════════════════════════════
 *
 * Both public entry points used to take a pack. That meant the CALLER supplied
 * the object that was supposed to establish reviewed-wording authority — and
 * pack validation accepts any `test:`-prefixed version, because the empty-pack
 * rule binds the production version only. So anybody could assemble
 *
 *     testNarrativeVariantPack("test:caller-authored", [{
 *       templateId: <a real template>, propositionKind: <a real role>,
 *       canonicalTextDigest: <the correct digest>, variantId: "forged",
 *       narrativeText: <anything at all>,
 *     }])
 *
 * hand it to the same path a customer's Report takes, and watch it validate
 * and render. The frozen claim was not true of the code.
 *
 * The tests below are the claim, restated as things that can fail.
 */

const REPORT = reportFor("you")
const PROPOSITIONS = canonicalPropositionOrder(REPORT)

/** The forged pack from the blocker, built by hand and as real as it can be. */
function forgedVariant(): ReviewedNarrativeVariant {
  const lever = PROPOSITIONS.find((p) => p.kind === "lever")!
  return {
    templateId: lever.templateId,
    propositionKind: "lever",
    canonicalTextDigest: narrativeDigest(lever.text),
    variantId: "forged",
    narrativeText: "You told us energy is what you least want to work on.",
  }
}

describe("the caller cannot supply the authority object", () => {
  it("buildNarrativeOverlay ignores a pack it is handed", () => {
    const forged: NarrativeVariantPackV1 = {
      kind: "narrative-variant-pack-v1",
      version: "test:caller-authored",
      variants: [forgedVariant()],
    }

    // Passed through `as never` because the public type has no such field —
    // which is the first half of the defence. The second half is that even a
    // caller who defeats the compiler changes nothing.
    const overlay = buildNarrativeOverlay({
      report: REPORT,
      enabled: true,
      pack: forged,
    } as never)

    expect(overlay.items.every((item) => item.status === "canonical-only")).toBe(true)
    expect(overlay.variantPackVersion).toBe(PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION)
    expect(JSON.stringify(overlay)).not.toContain("forged")
  })

  it("a forged pack wearing the PRODUCTION version changes nothing either", () => {
    const impostor: NarrativeVariantPackV1 = {
      kind: "narrative-variant-pack-v1",
      version: PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
      variants: [forgedVariant()],
    }
    const overlay = buildNarrativeOverlay({
      report: REPORT,
      enabled: true,
      pack: impostor,
    } as never)
    expect(overlay.items.every((item) => item.status === "canonical-only")).toBe(true)

    // …and the render path resolves the committed pack by version, not the
    // object in the caller's hand, so the impostor is never consulted.
    const plan = narrativeRenderPlan({ overlay, report: REPORT, pack: impostor } as never)
    expect(plan.usable).toBe(true)
    if (!plan.usable) return
    expect(plan.text).toEqual(PROPOSITIONS.map((p) => p.text))
  })

  it("narrativeRenderPlan ignores a pack it is handed", () => {
    const overlay = buildNarrativeOverlay({ report: REPORT, enabled: true })
    const plan = narrativeRenderPlan({
      overlay,
      report: REPORT,
      pack: testPackForReport(REPORT),
    } as never)
    expect(plan.usable).toBe(true)
    if (!plan.usable) return
    // Canonical throughout: the committed pack is empty, and the pack the
    // caller offered is not an input.
    expect(plan.text).toEqual(PROPOSITIONS.map((p) => p.text))
  })

  it("the production pack object cannot be mutated into carrying a variant", () => {
    // `readonly` is a compile-time promise. This is the runtime one.
    expect(Object.isFrozen(PRODUCTION_NARRATIVE_VARIANT_PACK)).toBe(true)
    expect(Object.isFrozen(PRODUCTION_NARRATIVE_VARIANT_PACK.variants)).toBe(true)
    expect(() => {
      ;(PRODUCTION_NARRATIVE_VARIANT_PACK.variants as ReviewedNarrativeVariant[]).push(
        forgedVariant(),
      )
    }).toThrow()
    expect(PRODUCTION_NARRATIVE_VARIANT_PACK.variants).toEqual([])
  })
})

describe("the committed registry", () => {
  it("holds exactly the current production pack today", () => {
    expect(COMMITTED_NARRATIVE_VARIANT_PACKS).toEqual([PRODUCTION_NARRATIVE_VARIANT_PACK])
    expect(Object.isFrozen(COMMITTED_NARRATIVE_VARIANT_PACKS)).toBe(true)
  })

  it("resolves the current version internally", () => {
    expect(CURRENT_COMMITTED_PACK_VERSION).toBe(PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION)
    expect(currentCommittedPack()).toBe(PRODUCTION_NARRATIVE_VARIANT_PACK)
    expect(committedPackForVersion(CURRENT_COMMITTED_PACK_VERSION)).toBe(
      PRODUCTION_NARRATIVE_VARIANT_PACK,
    )
  })

  it("resolves nothing for a version nobody committed", () => {
    for (const version of ["test:narrative-variant-pack", "test:caller-authored", "v2", ""]) {
      expect(committedPackForVersion(version), version).toBeUndefined()
    }
  })

  it("an OPEN gate means the committed production pack is empty", () => {
    expect(NARRATIVE_ACCEPTANCE_GATE.status).toBe("OPEN")
    for (const pack of COMMITTED_NARRATIVE_VARIANT_PACKS) {
      if (pack.version !== PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION) continue
      expect(pack.variants).toEqual([])
    }
  })
})

describe("an overlay naming an unregistered pack is unusable", () => {
  it("refuses a version the registry does not hold", () => {
    const overlay = buildNarrativeOverlay({ report: REPORT, enabled: true })
    const plan = narrativeRenderPlan({
      overlay: { ...overlay, variantPackVersion: "test:narrative-variant-pack" },
      report: REPORT,
    })
    expect(plan.usable).toBe(false)
    if (plan.usable) return
    expect(plan.reason).toBe("variant-pack-unknown")
  })

  it("and so is one built while no pack resolved", () => {
    // An overlay that resolved nothing names no version, which is itself
    // unregistered — so the two states agree rather than one excusing the
    // other.
    const overlay = buildNarrativeOverlay({ report: REPORT, enabled: true })
    const plan = narrativeRenderPlan({
      overlay: { ...overlay, variantPackVersion: "" },
      report: REPORT,
    })
    expect(plan.usable).toBe(false)
  })
})

describe("no public module hands out narrative wording", () => {
  it("the pack module exports no lookup primitive", async () => {
    const packModule = await import("@/lib/report/narrative/variant-pack")
    for (const primitive of [
      "variantById",
      "reviewedVariantForProposition",
      "indexByBinding",
      "variantFor",
      "testNarrativeVariantPack",
    ]) {
      expect(Object.keys(packModule), `variant-pack exports ${primitive}`).not.toContain(primitive)
    }
  })

  it("the public entry points export only the two operations and their types", async () => {
    const overlayModule = await import("@/lib/report/narrative/overlay")
    const trustModule = await import("@/lib/report/narrative/trust")
    expect(Object.keys(overlayModule)).toEqual(["buildNarrativeOverlay"])
    expect(Object.keys(trustModule).sort()).toEqual(["narrativeRenderPlan", "overlayMatchesReport"])
  })

  it("the internal lookup exports exactly two functions, and no raw primitive", async () => {
    /*
     * `internal/` is reachable from three places, which is a small blast
     * radius and not a zero one. Pinning its exports means a digest-keyed
     * helper cannot be added there and quietly used by the render path — the
     * public-surface guard would not see it, because it does not scan
     * `internal/`.
     */
    const lookupModule = await import("@/lib/report/narrative/internal/lookup")
    expect(Object.keys(lookupModule).sort()).toEqual([
      "reviewedVariantForProposition",
      "variantById",
    ])
  })

  it("the registry hands out packs, never sentences", async () => {
    const registryModule = await import("@/lib/report/narrative/registry")
    expect(Object.keys(registryModule).sort()).toEqual([
      "COMMITTED_NARRATIVE_VARIANT_PACKS",
      "CURRENT_COMMITTED_PACK_VERSION",
      "committedPackForVersion",
      "currentCommittedPack",
    ])
    // And nothing it returns carries wording today, because the pack is empty.
    expect(currentCommittedPack()?.variants).toEqual([])
  })
})

describe("what the public path actually produces today", () => {
  it("a complete canonical-only overlay, and the S2 document rendered", () => {
    const overlay = buildNarrativeOverlay({ report: REPORT, enabled: true })
    expect(overlay.items.length).toBe(PROPOSITIONS.length)
    expect(overlay.items.every((item) => item.status === "canonical-only")).toBe(true)

    const plan = narrativeRenderPlan({ overlay, report: REPORT })
    expect(plan.usable).toBe(true)
    if (!plan.usable) return
    expect(plan.text).toEqual(PROPOSITIONS.map((p) => p.text))

    // Every rendered line is a sentence the canonical Report already contains.
    const rendered = customerFacingText(REPORT)
    for (const line of plan.text) expect(rendered).toContain(line)
  })

  it("the public entry point is still off unless asked", () => {
    // The seam takes `enabled` directly, so the PUBLIC default is only
    // observable here — mutating it would change nothing any other suite sees.
    const overlay = buildNarrativeOverlay({ report: REPORT })
    for (const [index, item] of overlay.items.entries()) {
      expect(item.status).toBe("canonical-only")
      if (PROPOSITIONS[index].kind === "recap" || PROPOSITIONS[index].kind === "lever") {
        expect(item.fallbackReason).toBe("narrative-disabled")
      }
    }
  })

  it("the exclusions survive the authority change", () => {
    const overlay = buildNarrativeOverlay({ report: REPORT, enabled: true })
    const quotation = PROPOSITIONS.findIndex((p) => p.kind === "quotation")
    const loop = PROPOSITIONS.map((p, i) => (p.kind === "loop-step" ? i : -1)).filter((i) => i >= 0)

    expect(overlay.items[quotation].fallbackReason).toBe("ineligible-quotation")
    expect(loop.length).toBe(4)
    for (const index of loop) {
      expect(overlay.items[index].fallbackReason).toBe("ineligible-loop-step")
    }
  })

  it("the overlay still carries no wording of any kind", () => {
    const overlay = buildNarrativeOverlay({ report: REPORT, enabled: true })
    const serialised = JSON.stringify(overlay)
    for (const proposition of PROPOSITIONS) expect(serialised).not.toContain(proposition.text)
    for (const item of overlay.items) expect(Object.keys(item)).not.toContain("narrativeText")
  })
})
