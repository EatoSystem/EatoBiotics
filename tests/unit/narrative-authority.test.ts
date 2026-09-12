import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

import { customerFacingText } from "@/lib/report/deterministic/serialise"
import { NARRATIVE_ACCEPTANCE_GATE } from "@/lib/report/narrative/contract"
import { narrativeDigest } from "@/lib/report/narrative/digest"
import { canonicalPropositionOrder } from "@/lib/report/narrative/order"
import { buildNarrativeOverlay } from "@/lib/report/narrative/overlay"
import {
  COMMITTED_NARRATIVE_VARIANT_PACKS,
  CURRENT_COMMITTED_PACK_VERSION,
  committedPackForVersion,
  committedPackVersions,
  committedProductionPackIsEmpty,
  currentCommittedPack,
  freezeCommittedPack,
} from "@/lib/report/narrative/internal/committed-packs"
import { narrativeRenderPlan } from "@/lib/report/narrative/trust"
import {
  NARRATIVE_VARIANT_PACK_KIND,
  PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION,
  type NarrativeVariantPackV1,
  type ReviewedNarrativeVariant,
} from "@/lib/report/narrative/variant-pack"

import { committedProductionPack, reportFor, testPackForReport } from "./narrative-fixtures"

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
    expect(Object.isFrozen(committedProductionPack())).toBe(true)
    expect(Object.isFrozen(committedProductionPack().variants)).toBe(true)
    expect(() => {
      ;(committedProductionPack().variants as ReviewedNarrativeVariant[]).push(
        forgedVariant(),
      )
    }).toThrow()
    expect(committedProductionPack().variants).toEqual([])
  })
})

describe("the committed registry", () => {
  it("holds exactly the current production pack today", () => {
    expect(COMMITTED_NARRATIVE_VARIANT_PACKS).toEqual([committedProductionPack()])
    expect(Object.isFrozen(COMMITTED_NARRATIVE_VARIANT_PACKS)).toBe(true)
  })

  it("resolves the current version internally", () => {
    expect(CURRENT_COMMITTED_PACK_VERSION).toBe(PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION)
    expect(currentCommittedPack()).toBe(committedProductionPack())
    expect(committedPackForVersion(CURRENT_COMMITTED_PACK_VERSION)).toBe(committedProductionPack())
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
    const registryModule = await import("@/lib/report/narrative/internal/committed-packs")
    expect(Object.keys(registryModule).sort()).toEqual([
      "COMMITTED_NARRATIVE_VARIANT_PACKS",
      "CURRENT_COMMITTED_PACK_VERSION",
      "committedPackForVersion",
      "committedPackVersions",
      "committedProductionPackIsEmpty",
      "currentCommittedPack",
      "freezeCommittedPack",
    ])
    // And nothing it returns carries wording today, because the pack is empty.
    expect(currentCommittedPack()?.variants).toEqual([])
  })
})

describe("no public module can hand out committed wording", () => {
  /**
   * A RUNTIME property, walked, not a list of forbidden names.
   *
   * The committed pack is empty today, so a name-based check would pass for as
   * long as the hole is dormant and stop meaning anything on the day it is
   * not. This walks every value each public module exports, to any depth, and
   * fails if a `narrativeText` key exists anywhere in it — which is the shape
   * the blocker was about, and which stays checkable once a reviewed pack is
   * populated.
   */
  const PUBLIC_MODULES = [
    "contract",
    "digest",
    "order",
    "overlay",
    "trust",
    "types",
    "variant-pack",
  ] as const

  function findWording(value: unknown, path: string, seen = new Set<unknown>()): string | null {
    if (value === null || typeof value !== "object") return null
    if (seen.has(value)) return null
    seen.add(value)
    if (Array.isArray(value)) {
      for (const [index, entry] of value.entries()) {
        const hit = findWording(entry, `${path}[${index}]`, seen)
        if (hit) return hit
      }
      return null
    }
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (key === "narrativeText") return `${path}.${key}`
      const hit = findWording(entry, `${path}.${key}`, seen)
      if (hit) return hit
    }
    return null
  }

  it("finds no committed wording anywhere in the public exports", async () => {
    for (const name of PUBLIC_MODULES) {
      const publicModule = await import(`@/lib/report/narrative/${name}`)
      for (const [key, value] of Object.entries(publicModule)) {
        expect(findWording(value, `${name}.${key}`), `${name}.${key} carries wording`).toBeNull()
      }
    }
  })

  it("the walker actually finds wording when there is some", () => {
    // Otherwise the assertion above passes because the walk does nothing.
    expect(findWording({ variants: [forgedVariant()] }, "fixture")).toBe(
      "fixture.variants[0].narrativeText",
    )
  })

  it("the removed symbols are gone from the public surface", async () => {
    const packModule = await import("@/lib/report/narrative/variant-pack")
    expect(Object.keys(packModule)).not.toContain("PRODUCTION_NARRATIVE_VARIANT_PACK")
    // The public registry module is gone, not merely emptied. Asserted on the
    // filesystem because a dynamic import of a deleted path is a compile
    // error, and a guard that will not compile is a guard nobody can run.
    expect(existsSync(join(process.cwd(), "lib/report/narrative/registry.ts"))).toBe(false)
  })

  it("public metadata still answers the questions that grant nothing", async () => {
    // Versions, types and validation stay public: none of them is a sentence.
    const packModule = await import("@/lib/report/narrative/variant-pack")
    expect(Object.keys(packModule).sort()).toEqual([
      "NARRATIVE_VARIANT_PACK_KIND",
      "PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION",
      "TEST_NARRATIVE_VARIANT_PACK_PREFIX",
      "bindingKey",
      "reviewedTemplateText",
      "validateNarrativeVariantPack",
    ])
  })
})

describe("the repo-wide importer allow-list is itself pinned", () => {
  /*
   * A guard on a guard, and deliberately in a DIFFERENT file.
   *
   * The repo-wide check lives in `narrative-privacy.test.ts` and concludes
   * from an allow-list. Widening that list — one extra path, one extra
   * `startsWith` — makes the check pass while permitting exactly what it
   * exists to forbid, and nothing in that file would notice. This pins the
   * list and the shape of the permission expression, so widening either is a
   * failing test somewhere else.
   *
   * A source tripwire, not a behavioural proof, and named as one.
   */
  const privacySource = readFileSync(
    join(process.cwd(), "tests/unit/narrative-privacy.test.ts"),
    "utf8",
  )

  it("permits exactly the two entry points and the test seam", () => {
    const start = privacySource.indexOf("const allowed = new Set([")
    expect(start, "the allow-list moved or was renamed").toBeGreaterThan(-1)
    const block = privacySource.slice(start, privacySource.indexOf("])", start))
    expect(block.match(/"[^"]+"/g)).toEqual([
      '"lib/report/narrative/overlay.ts"',
      '"lib/report/narrative/trust.ts"',
      '"lib/report/narrative/testing/pack-seam.ts"',
    ])
  })

  it("and admits nothing else through a second escape hatch", () => {
    const start = privacySource.indexOf("      const permitted =")
    expect(start, "the permission expression moved").toBeGreaterThan(-1)
    const block = privacySource.slice(start, privacySource.indexOf("expect(permitted", start))
    expect(block.match(/startsWith\(/g)).toHaveLength(2)
    expect(block).toContain('importer.startsWith("lib/report/narrative/internal/")')
    expect(block).toContain('importer.startsWith("tests/")')
    expect(block).toContain("allowed.has(importer)")
  })
})

describe("committed data cannot be mutated at runtime", () => {
  it("the pack, its array and every variant are frozen", () => {
    const pack = committedProductionPack()
    expect(Object.isFrozen(pack)).toBe(true)
    expect(Object.isFrozen(pack.variants)).toBe(true)
    for (const variant of pack.variants) expect(Object.isFrozen(variant)).toBe(true)
  })

  it("the committed list cannot be grown", () => {
    expect(Object.isFrozen(COMMITTED_NARRATIVE_VARIANT_PACKS)).toBe(true)
    expect(() => {
      ;(COMMITTED_NARRATIVE_VARIANT_PACKS as NarrativeVariantPackV1[]).push(
        committedProductionPack(),
      )
    }).toThrow()
  })

  it("and the freeze is proved on a POPULATED pack, not only the empty one", () => {
    /*
     * The committed pack holds nothing today, so the assertion above walks an
     * empty array and would keep passing with the per-variant freeze deleted.
     * This runs the helper the committed data actually passes through, over a
     * pack that has an entry in it, so the line is load-bearing now rather
     * than on the day a reviewed pack is populated.
     */
    const populated = freezeCommittedPack({
      kind: NARRATIVE_VARIANT_PACK_KIND,
      version: "test:frozen",
      variants: [forgedVariant()],
    })
    expect(Object.isFrozen(populated)).toBe(true)
    expect(Object.isFrozen(populated.variants)).toBe(true)
    expect(Object.isFrozen(populated.variants[0])).toBe(true)
    expect(() => {
      ;(populated.variants[0] as { narrativeText: string }).narrativeText = "rewritten at runtime"
    }).toThrow()
    expect(populated.variants[0].narrativeText).toBe(forgedVariant().narrativeText)
  })

  it("metadata accessors answer without handing over a pack", () => {
    expect(committedProductionPackIsEmpty()).toBe(true)
    expect(committedPackVersions()).toEqual([PRODUCTION_NARRATIVE_VARIANT_PACK_VERSION])
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
