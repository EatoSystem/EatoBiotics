import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

import { ADDON_KEYS, asAddonType, isAddon, type AddonType } from "@/lib/addon-types"
import {
  asAddon,
  asFoundation,
  encodePaidReportSummary,
  decodePaidReportSummary,
  ADDON_KEYS as SESSION_ADDON_KEYS,
} from "@/lib/paid-report-session"
import { HEALTH_SYSTEM_KEYS, isHealthSystemKey } from "@/lib/assessment/registry"
import { resolveReportMode } from "@/lib/report/build-food-system-report"

/**
 * The add-on contract: one union, one validator, unknown values rejected.
 *
 * ── Why ──────────────────────────────────────────────────────────────────────
 *
 * "Which add-ons exist" used to be written out by hand in four places —
 * PaidReportHealthSystem, a HEALTH_SYSTEMS array in the checkout route, an
 * inline union in submit-deep-assessment, and AssessedSystemKey in the
 * assessment registry. Four copies is four chances to add a fifth add-on to
 * three of them, and the failure mode is silent: the value simply stops being
 * an add-on partway through checkout → report, and the customer pays for a lens
 * that never appears.
 *
 * These tests pin the collapse to a single definition and fail if a new literal
 * copy of the list appears anywhere in lib/ or app/.
 */

const EXPECTED: AddonType[] = ["stability", "glucose", "mind", "performance"]

describe("one add-on union", () => {
  it("the canonical list is the four purchasable lenses", () => {
    expect([...ADDON_KEYS]).toEqual(EXPECTED)
  })

  it("every downstream list is the same object, not a copy", () => {
    // Identity, not equality: a re-declared array would still be `toEqual` but
    // would be a second source of truth.
    expect(SESSION_ADDON_KEYS).toBe(ADDON_KEYS)
    expect(HEALTH_SYSTEM_KEYS).toBe(ADDON_KEYS)
  })

  it("every downstream validator is the same function", () => {
    expect(asAddon).toBe(asAddonType)
    expect(isHealthSystemKey).toBe(isAddon)
  })
})

describe("unknown add-ons are rejected at every boundary", () => {
  const BAD = ["recovery", "longevity", "Stability", "STABILITY", "", " ", "sleep", "../mind", null, undefined, 7, {}, []]

  it.each(BAD.map((v) => [JSON.stringify(v) ?? String(v), v] as const))(
    "asAddonType(%s) is null",
    (_label, value) => {
      expect(asAddonType(value)).toBeNull()
    },
  )

  it("recovery and longevity are site systems but NOT purchasable lenses", () => {
    // lib/systems.ts lists both in the marketing catalogue. Neither has a
    // question bank or a lens builder, so neither may pass validation.
    expect(asAddonType("recovery")).toBeNull()
    expect(asAddonType("longevity")).toBeNull()
  })

  it("a Stripe summary carrying an unknown add-on decodes it away", () => {
    // Hand-rolled payload: encodePaidReportSummary is typed, but Stripe metadata
    // is just a string and could carry anything, including a value written by an
    // older or newer deploy.
    const raw = Buffer.from(
      JSON.stringify({
        tier: "personal",
        overall: 60,
        subScores: { prebiotics: 60, probiotics: 60, postbiotics: 60 },
        profile: { type: "T", tagline: "t", description: "d" },
        selectedAddon: "recovery",
        foundationType: "you",
      }),
      "utf-8",
    ).toString("base64")

    const decoded = decodePaidReportSummary(raw)
    expect(decoded).not.toBeNull()
    expect(decoded!.selectedAddon).toBeNull()
    expect(decoded!.foundationType).toBe("you")
  })

  it("an unknown foundation is rejected the same way", () => {
    expect(asFoundation("household")).toBeNull()
    expect(asFoundation("you")).toBe("you")
  })
})

describe("the add-on survives the Stripe round trip", () => {
  it.each(ADDON_KEYS)("%s encodes and decodes unchanged", (addon) => {
    const encoded = encodePaidReportSummary({
      tier: "personal",
      overall: 72,
      subScores: { prebiotics: 85, probiotics: 20, postbiotics: 85 },
      profile: { type: "Strong Foundation", tagline: "t", description: "d" },
      foundationType: "you",
      selectedAddon: addon,
    })
    expect(decodePaidReportSummary(encoded)?.selectedAddon).toBe(addon)
  })

  it("no add-on round-trips as null, not undefined-shaped", () => {
    const encoded = encodePaidReportSummary({
      tier: "personal",
      overall: 72,
      subScores: { prebiotics: 85, probiotics: 20, postbiotics: 85 },
      profile: { type: "Strong Foundation", tagline: "t", description: "d" },
      foundationType: "you",
      selectedAddon: null,
    })
    expect(decodePaidReportSummary(encoded)?.selectedAddon).toBeNull()
  })

  it("a legacy summary with no add-on key at all still decodes", () => {
    // Production currently holds exactly one deep_assessments row, written
    // 2026-05-16, whose free_scores carries neither selectedAddon nor
    // foundationType. This is that row's shape.
    const raw = Buffer.from(
      JSON.stringify({
        tier: "personal",
        overall: 55,
        subScores: { prebiotics: 55, probiotics: 55, postbiotics: 55 },
        profile: { type: "T", tagline: "t", description: "d" },
      }),
      "utf-8",
    ).toString("base64")

    const decoded = decodePaidReportSummary(raw)
    expect(decoded).not.toBeNull()
    expect(decoded!.selectedAddon).toBeNull()
    expect(decoded!.foundationType).toBeNull()
  })
})

describe("report mode still resolves from the validated values", () => {
  it.each(ADDON_KEYS)("%s on a You foundation is a combined report", (addon) => {
    expect(resolveReportMode({ foundationType: "you", selectedAddon: addon })).toBe("combined")
  })

  it("no add-on keeps the foundation's own mode", () => {
    expect(resolveReportMode({ foundationType: "you", selectedAddon: null })).toBe("you")
    expect(resolveReportMode({ foundationType: "family", selectedAddon: null })).toBe("family")
  })
})

/**
 * Source guard: no fifth copy of the list.
 *
 * What counts as a copy is much narrower than "these four words appear near
 * each other", and getting there took three attempts:
 *
 *   1. Matching the four literals flagged lib/agent-loop/types.ts, where they
 *      appear in a COMMENT annotating the imported alias.
 *   2. Adding a wider-set exclusion still flagged lib/assessment/registry.ts
 *      and components/assessment/journey-next-step.tsx, which are per-add-on
 *      METADATA (routes, icons, blurbs). Those are legitimate and unavoidable —
 *      ADDON_QUESTIONS and the lens metadata in this same batch have exactly
 *      that shape — so a guard forbidding them would fight the design.
 *
 * What actually regresses is a re-declared TYPE or a bare KEYS ARRAY. Those are
 * two precise shapes, so that is all this looks for. A `Record<AddonType, …>`
 * keyed by the four names is fine: TypeScript already enforces its
 * exhaustiveness against the canonical union.
 *
 * Allowlisting the flagged files would have been the wrong fix each time — it
 * would let a real duplicate hide inside an allowed file later.
 */
describe("no re-declared add-on list", () => {
  const CANONICAL = "lib/addon-types.ts"

  /**
   * `type Foo = "stability" | "glucose" | "mind" | "performance"` — in any
   * member order, and ONLY when the union ends there. The trailing lookahead
   * matters: `HealthSystemKey` in lib/systems.ts opens with the same four and
   * then continues `| "recovery" | "longevity"`, which is the wider catalogue,
   * not a copy. Without it this flagged that file.
   */
  const UNION_DECL =
    /=\s*\|?\s*"(stability|glucose|mind|performance)"(\s*\|\s*"(stability|glucose|mind|performance)"){3}(?!\s*\|)/

  /** `["stability", "glucose", "mind", "performance"]` — a bare keys array. */
  const KEYS_ARRAY =
    /\[\s*"(stability|glucose|mind|performance)"(\s*,\s*"(stability|glucose|mind|performance)"){3}\s*,?\s*\]/

  function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1")
  }

  function walk(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      if (entry === "node_modules" || entry.startsWith(".")) continue
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full, out)
      else if (/\.tsx?$/.test(full)) out.push(full)
    }
    return out
  }

  it("only the canonical definition declares the union or the keys array", () => {
    const offenders = [...walk("lib"), ...walk("app"), ...walk("components")]
      .filter((f) => f !== CANONICAL)
      .filter((f) => {
        const code = stripComments(readFileSync(f, "utf8"))
        return UNION_DECL.test(code) || KEYS_ARRAY.test(code)
      })

    expect(
      offenders,
      `These files re-declare the add-on union or key list. Import ` +
        `AddonType/ADDON_KEYS from lib/addon-types.ts instead:\n${offenders.join("\n")}`,
    ).toEqual([])
  })

  it("the guard actually detects both shapes", () => {
    // Without this the test above could pass because the patterns match nothing.
    const strip = (s: string) => s
    expect(UNION_DECL.test(`type X = "stability" | "glucose" | "mind" | "performance"`)).toBe(true)
    expect(UNION_DECL.test(`type X = "mind" | "glucose" | "stability" | "performance"`)).toBe(true)
    expect(KEYS_ARRAY.test(`const K = ["stability", "glucose", "mind", "performance"]`)).toBe(true)
    // A wider catalogue that merely starts with the same four is not a copy.
    expect(
      UNION_DECL.test(`type H = "stability" | "glucose" | "mind" | "performance" | "recovery"`),
    ).toBe(false)
    // …and does not fire on legitimate per-add-on metadata.
    expect(
      UNION_DECL.test(strip(`const M: Record<AddonType, string> = { stability: "a", glucose: "b" }`)),
    ).toBe(false)
    expect(KEYS_ARRAY.test(`[{ key: "stability" }, { key: "glucose" }]`)).toBe(false)
  })
})
