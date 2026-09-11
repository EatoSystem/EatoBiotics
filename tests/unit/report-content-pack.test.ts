import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { CONSULTATION_QUESTION_BANK } from "@/lib/consultation/question-bank"
import { REPORT_COMPOSITION_BOUNDARY } from "@/lib/consultation/science-contract"
import {
  CONTENT_PACK,
  CONTENT_PACK_VERSION,
  PRODUCTION_CONTENT_PACK_ID,
  STRUCTURAL_COPY,
  STRUCTURAL_TEMPLATE_IDS,
  TEST_CONTENT_PACK_PREFIX,
  contentPackFor,
  isStructuralTemplateId,
  registerTestContentPack,
  templateFor,
} from "@/lib/report/deterministic/content-pack"
import { valueIsSilenced } from "@/lib/report/deterministic/permissions"

/**
 * The reviewed words — Phase 4A-S2.
 *
 * ══ THE PROPERTY ════════════════════════════════════════════════════════════
 *
 * Exhaustive coverage with NO implicit default. Every enumerated option value
 * of every core question has a deliberate disposition: a reviewed sentence, or
 * `null` meaning reviewed and silent. `undefined` — the pack simply not having
 * thought about a value — is a build failure, because an unconsidered option
 * is how an unreviewed sentence, or a silently dropped answer, reaches a
 * paying customer.
 *
 * The distinction between `null` and `undefined` is the whole design and is
 * asserted directly below.
 */

const ENUMERATED = CONSULTATION_QUESTION_BANK.filter((q) => (q.options?.length ?? 0) > 0)

describe("every enumerated option value has an explicit disposition", () => {
  it("covers all 20 enumerated questions", () => {
    expect(ENUMERATED).toHaveLength(20)
    for (const q of ENUMERATED) {
      expect(CONTENT_PACK[q.id], `${q.id} missing from the pack`).toBeDefined()
    }
  })

  it("covers every option value of every one of them", () => {
    const missing: string[] = []
    for (const q of ENUMERATED) {
      for (const option of q.options ?? []) {
        if (templateFor(q.id, option.value) === undefined) {
          missing.push(`${q.id}="${option.value}"`)
        }
      }
    }
    expect(missing, "option values with no reviewed disposition").toEqual([])
  })

  it("holds no entry for a value the bank does not offer", () => {
    // The other direction: a stale template is prose nobody is reviewing.
    const stale: string[] = []
    for (const q of ENUMERATED) {
      const offered = new Set((q.options ?? []).map((o) => o.value))
      for (const value of Object.keys(CONTENT_PACK[q.id] ?? {})) {
        if (!offered.has(value)) stale.push(`${q.id}="${value}"`)
      }
    }
    expect(stale).toEqual([])
  })

  it("counts 120 option values in total, so the coverage number is visible", () => {
    const total = ENUMERATED.reduce((n, q) => n + (q.options?.length ?? 0), 0)
    expect(total).toBe(120)
  })

  it("distinguishes reviewed silence from an unconsidered value", () => {
    // null  = reviewed, deliberately says nothing
    expect(templateFor("core_rhythm_recent_change_v1", "health-event")).toBeNull()
    // undefined = nobody has decided. Never acceptable.
    expect(templateFor("core_rhythm_recent_change_v1", "not-an-option")).toBeUndefined()
  })

  it("the free-text question carries no template, because the words are the customer's", () => {
    expect(CONTENT_PACK["core_intentions_success_v1"]).toEqual({})
  })
})

describe("silenced values are silent in the pack too", () => {
  it("every no-proposition value has a null disposition", () => {
    for (const q of ENUMERATED) {
      for (const option of q.options ?? []) {
        if (valueIsSilenced(q.id, option.value)) {
          expect(
            templateFor(q.id, option.value),
            `${q.id}="${option.value}" is silenced but has words`,
          ).toBeNull()
        }
      }
    }
  })
})

describe("the words obey the composition boundary", () => {
  const allText = [
    ...ENUMERATED.flatMap((q) =>
      (q.options ?? [])
        .map((o) => templateFor(q.id, o.value))
        .filter((d): d is NonNullable<typeof d> => !!d)
        .map((d) => d.text),
    ),
    ...Object.values(STRUCTURAL_COPY).flatMap((v) => (Array.isArray(v) ? [...v] : [v])),
  ]

  it("uses no prohibited framing", () => {
    const offenders: string[] = []
    for (const text of allText) {
      for (const framing of REPORT_COMPOSITION_BOUNDARY.prohibitedFramings) {
        if (text.toLowerCase().includes(framing.toLowerCase())) {
          offenders.push(`"${framing}" in "${text}"`)
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it("names no Prebiotics, Probiotics or Postbiotics while that gate is open", () => {
    const offenders = allText.filter((t) => /pre-?biotic|pro-?biotic|post-?biotic|microbiom/i.test(t))
    expect(offenders).toEqual([])
  })

  it("names no specific food while the dietetic gate is open", () => {
    /*
     * Two separate things, and an earlier version of this guard confused them.
     *
     * It banned the verb "eat", which is wrong: "You told us you usually eat
     * within an hour of waking" is a RECAP of when somebody eats, not a
     * suggestion of what. Banning it would have forced the content pack to
     * write around plain English to satisfy a badly-drawn rule — the guard
     * bending the product instead of describing it.
     *
     * What actually matters is (a) no specific food is named and (b) nothing
     * is recommended. Both are checked, separately.
     *
     * The avoidance lines are the deliberate exception to (a): "You asked us
     * to leave out nuts" repeats the customer's own declaration in order to
     * SUPPRESS, and the composer drops even those while the capability is off.
     */
    const FOODS = [
      "kefir", "yoghurt", "yogurt", "beans", "lentils", "berries", "oats",
      "kimchi", "sauerkraut", "kombucha", "broccoli", "spinach", "banana",
      "almond", "walnut", "salmon", "chickpea", "garlic", "onion", "apple",
    ]
    const named = allText.filter(
      (t) => !/leave out/i.test(t) && FOODS.some((f) => new RegExp(`\\b${f}`, "i").test(t)),
    )
    expect(named, "a specific food is named").toEqual([])
  })

  it("recommends nothing at all while the dietetic gate is open", () => {
    const recommending = allText.filter((t) =>
      /\b(we recommend|you should|try adding|start eating|swap your|include more)\b/i.test(t),
    )
    expect(recommending, "the pack recommends something").toEqual([])
  })

  it("never operationalises lighter meals into eating less", () => {
    const lighter = templateFor("core_signals_settled_days_v1", "lighter-meals")
    expect(lighter?.text).toBeDefined()
    expect(lighter!.text).not.toMatch(
      /eat less|smaller portion|fewer meals|reduce|calorie|restrict|skip/i,
    )
    // It stays the customer's own report of what tends to differ.
    expect(lighter!.text).toMatch(/you told us/i)
  })

  it("keeps the three bundled context values joined", () => {
    // Each option covered two circumstances; the customer never said which.
    expect(templateFor("core_signals_context_v1", "rushed")!.text).toMatch(/rushed or eaten on the go/i)
    expect(templateFor("core_signals_context_v1", "large-late")!.text).toMatch(/larger or later/i)
    expect(templateFor("core_signals_context_v1", "stress-sleep")!.text).toMatch(/stress or less sleep/i)
  })

  it("the unresolved-avoidance note never reads as a clearance", () => {
    expect(STRUCTURAL_COPY.unresolvedAvoidance).toMatch(/don't have enough detail|general guidance/i)
    expect(STRUCTURAL_COPY.unresolvedAvoidance).not.toMatch(/safe|fine|no restrictions|nothing to avoid/i)
  })

  it("is versioned, so a wording change is visible in provenance", () => {
    expect(CONTENT_PACK_VERSION).toBe("content-pack-v1")
  })
})

/* ══ The test-pack registration hatch ══════════════════════════════════════ */

/**
 * `registerTestContentPack` exists so the two capabilities with no production
 * wording can be proven through the real constructor. It is exported from
 * shipped code, so it is guarded three ways rather than trusted.
 */
describe("an extra content pack can only ever be a test pack", () => {
  it("refuses an id without the reserved prefix", () => {
    expect(() =>
      registerTestContentPack({ id: "content-pack-v2", version: "x", resolve: () => undefined }),
    ).toThrow(/must begin with/)
  })

  it("refuses to shadow the production pack", () => {
    expect(() =>
      registerTestContentPack({
        id: PRODUCTION_CONTENT_PACK_ID,
        version: "x",
        resolve: () => undefined,
      }),
    ).toThrow()
  })

  it("refuses to re-register an id it already holds", () => {
    const pack = { id: `${TEST_CONTENT_PACK_PREFIX}duplicate`, version: "x", resolve: () => undefined }
    registerTestContentPack(pack)
    expect(() => registerTestContentPack(pack)).toThrow(/already registered/)
  })

  it("no shipped module calls it", () => {
    /*
     * The guard that makes the hatch a test affordance rather than a product
     * one. A production caller could register a pack whose templates declare
     * weaker capabilities than the words deserve, which is the defect this
     * whole round removed — so no production caller is allowed to exist.
     */
    const roots = ["app", "components", "lib"]
    const offenders: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules") walk(full)
          continue
        }
        if (!/\.tsx?$/.test(entry.name)) continue
        const source = readFileSync(full, "utf8")
        // The definition itself lives in lib and is not a call.
        if (/registerTestContentPack\s*\(/.test(source) && !full.endsWith("content-pack.ts")) {
          offenders.push(full.replace(`${process.cwd()}/`, ""))
        }
      }
    }
    for (const root of roots) walk(join(process.cwd(), root))
    expect(offenders, "a shipped module registers a content pack").toEqual([])
  })

  it("the production pack resolves exactly what templateFor does", () => {
    // One authority behind two names, so the addressable form cannot drift
    // from the one the coverage tests above exercise.
    const pack = contentPackFor(PRODUCTION_CONTENT_PACK_ID)
    expect(pack).toBeDefined()
    expect(pack!.resolve("core_signals_energy_shape_v1", "steady")).toBe(
      templateFor("core_signals_energy_shape_v1", "steady"),
    )
    expect(pack!.resolve("core_rhythm_recent_change_v1", "health-event")).toBe(null)
    expect(pack!.resolve("core_signals_energy_shape_v1", "nope")).toBeUndefined()
  })

  it("an unregistered id resolves to nothing, with no fallback to production", () => {
    expect(contentPackFor("test:never-registered")).toBeUndefined()
  })
})

describe("structural template ids are an allow-list, not a convention", () => {
  it("holds only the quotation", () => {
    expect(STRUCTURAL_TEMPLATE_IDS).toEqual(["intentions.success.quotation"])
  })

  it("rejects anything else", () => {
    expect(isStructuralTemplateId("intentions.success.quotation")).toBe(true)
    expect(isStructuralTemplateId("environment.constraints.allergy")).toBe(false)
    expect(isStructuralTemplateId("")).toBe(false)
  })
})
