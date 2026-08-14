import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

import { ADDON_KEYS, type AddonType } from "@/lib/addon-types"
import {
  GENERATION_SOURCES,
  FOOD_SYSTEM_NARRATIVE_SOURCES,
  ADDON_LENS_NARRATIVE_SOURCES,
  isGenerationSource,
  isFoodSystemNarrativeSource,
  isAddonLensNarrativeSource,
  readProvenance,
  withProvenance,
  reusedAddonLensSource,
  sessionTag,
  LEGACY_PROVENANCE,
  type AddonLensNarrativeSource,
  type ReportProvenance,
} from "@/lib/report/generation-provenance"
import { buildFallbackPaidReport } from "@/lib/fallback-paid-report"
import {
  buildAddonLens,
  reconcileAddonLens,
  mergeGeneratedLens,
  claudeContributedToLens,
  lensNarrativeProjection,
} from "@/lib/report/addon-lens"
import {
  ensureFoodSystem,
  buildFoodSystemReport,
  mergeGeneratedNarrative,
  claudeContributedToFoodSystem,
  foodSystemNarrativeProjection,
} from "@/lib/report/build-food-system-report"
import { parseFoodSystemReport } from "@/lib/report/food-system-report-types"
import { overallReportStatus, reportViewState } from "@/lib/report-status"
import { computeOverall, getProfile } from "@/lib/assessment-scoring"
import { sanitizeLensAnswers, lensQuestionId } from "@/lib/assessment/addon-questions"
import type { DeepReport } from "@/lib/claude-report"
import type { FoodSystemReport, FoodSystemLens } from "@/lib/report/food-system-report-types"

/**
 * Report-content provenance.
 *
 * Two gaps this closes. First: when Claude answered but the merged foodSystem
 * failed validation, the route shipped the derived base and left `report_error`
 * null, so the row was indistinguishable from a clean generation. Second, and
 * the reason one field was not enough: BOTH overlays fall back field by field
 * and return the derived base untouched when the model omits their key, and the
 * derived base always validates. A response carrying no `foodSystem` at all
 * therefore produced an accepted, valid report in which every customer-visible
 * narrative string was written by this codebase — while the row claimed Claude
 * wrote it.
 *
 * So: `generationSource` describes the REQUEST, and two narrative fields
 * describe the CONTENT, one per independently-merged layer. Describing the
 * content is also what makes reuse correct — re-serving a stored report, or
 * attaching a derived lens to it, does not change who wrote the prose.
 */

const SUB = { prebiotics: 85, probiotics: 20, postbiotics: 85 }
const overall = computeOverall(SUB)
const profile = getProfile(overall, SUB)

const core = (mode: "you" | "family" | "combined" = "combined") =>
  buildFoodSystemReport({ mode, subScores: SUB, overall, profile })

const fallback = (mode: "you" | "family" | "combined" = "combined") =>
  buildFallbackPaidReport({
    tier: "premium", overall, subScores: { ...SUB }, profile,
    questions: [], answers: {}, mode,
  }) as DeepReport

const lensAnswers = (addon: AddonType) =>
  sanitizeLensAnswers(addon, { [lensQuestionId(addon, 1)]: "unpredictable" })

/** A derived core block with a derived lens attached — the route's `foodSystemBase`. */
const coreWithLens = (addon: AddonType): FoodSystemReport => {
  const base = core()
  return {
    ...base,
    lens: buildAddonLens({ addon, answers: lensAnswers(addon), foodSystem: base, isFamily: false }),
  }
}

/**
 * The route's own lens-attribution expression for the fresh-generation path.
 *
 * Restated here so tests exercise the mapping rather than a constant. It is a
 * restatement, and that is a drift risk in itself — so the route-wiring block
 * below asserts the route still contains this exact shape.
 */
const lensSourceFor = (
  base: FoodSystemReport,
  shipped: FoodSystemReport,
): AddonLensNarrativeSource =>
  !shipped.lens
    ? "not_applicable"
    : base.lens && claudeContributedToLens(base.lens, shipped.lens)
    ? "claude_contributed"
    : "deterministic"

const provenance = (p: Partial<ReportProvenance> = {}): ReportProvenance => ({
  ...LEGACY_PROVENANCE,
  ...p,
})

describe("each source value is a closed, validated set", () => {
  it("generationSource recognises exactly the five documented states", () => {
    expect([...GENERATION_SOURCES].sort()).toEqual([
      "claude_response_accepted",
      "deterministic_claude_error",
      "deterministic_no_api_key",
      "deterministic_validation_failure",
      "legacy_unknown",
    ])
  })

  it("the narrative sets are the documented three and four", () => {
    expect([...FOOD_SYSTEM_NARRATIVE_SOURCES].sort()).toEqual([
      "claude_contributed",
      "deterministic",
      "legacy_unknown",
    ])
    expect([...ADDON_LENS_NARRATIVE_SOURCES].sort()).toEqual([
      "claude_contributed",
      "deterministic",
      "legacy_unknown",
      "not_applicable",
    ])
  })

  it("the request field and the content fields do not share a vocabulary", () => {
    // Guards against the original defect returning as a copy-paste: one value
    // meaning both "a response arrived" and "its prose shipped".
    expect(GENERATION_SOURCES).not.toContain("claude_contributed")
    expect(FOOD_SYSTEM_NARRATIVE_SOURCES).not.toContain("claude_response_accepted")
  })

  it.each(GENERATION_SOURCES)("%s is accepted as a generationSource", (s) =>
    expect(isGenerationSource(s)).toBe(true),
  )
  it.each(FOOD_SYSTEM_NARRATIVE_SOURCES)("%s is accepted as a foodSystem source", (s) =>
    expect(isFoodSystemNarrativeSource(s)).toBe(true),
  )
  it.each(ADDON_LENS_NARRATIVE_SOURCES)("%s is accepted as a lens source", (s) =>
    expect(isAddonLensNarrativeSource(s)).toBe(true),
  )

  it.each([["unknown string", "reused"], ["empty", ""], ["number", 7], ["object", {}], ["null", null]])(
    "every guard rejects %s",
    (_l, v) => {
      expect(isGenerationSource(v)).toBe(false)
      expect(isFoodSystemNarrativeSource(v)).toBe(false)
      expect(isAddonLensNarrativeSource(v)).toBe(false)
    },
  )

  it("a value from the wrong set is rejected, not silently accepted", () => {
    expect(isFoodSystemNarrativeSource("claude_response_accepted")).toBe(false)
    expect(isGenerationSource("claude_contributed")).toBe(false)
    expect(isFoodSystemNarrativeSource("not_applicable")).toBe(false)
  })
})

describe("reading provenance off a stored report", () => {
  it("round-trips a fully stamped report", () => {
    const p = provenance({
      generationSource: "claude_response_accepted",
      foodSystemNarrativeSource: "claude_contributed",
      addonLensNarrativeSource: "deterministic",
    })
    expect(readProvenance(withProvenance(fallback(), p))).toEqual(p)
  })

  it.each([
    ["a legacy report with no _meta", fallback()],
    ["_meta present but empty", { ...fallback(), _meta: {} }],
    ["_meta not an object", { ...fallback(), _meta: "claude_response_accepted" }],
    ["null", null],
    ["a string", "nope"],
  ])("%s reads as legacy_unknown on every field", (_label, input) => {
    expect(readProvenance(input)).toEqual(LEGACY_PROVENANCE)
  })

  it("validates each field independently — a half-written row still answers honestly", () => {
    const row = {
      ...fallback(),
      _meta: {
        generationSource: "claude_response_accepted",
        foodSystemNarrativeSource: "definitely_claude", // not in the set
        // addonLensNarrativeSource absent entirely
      },
    }
    expect(readProvenance(row)).toEqual({
      generationSource: "claude_response_accepted",
      foodSystemNarrativeSource: "legacy_unknown",
      addonLensNarrativeSource: "legacy_unknown",
    })
  })

  it("never infers one field from another", () => {
    // An accepted response says nothing about whether prose shipped. If the
    // narrative field is missing it must read unknown, not be back-filled.
    const row = { ...fallback(), _meta: { generationSource: "claude_response_accepted" } }
    expect(readProvenance(row).foodSystemNarrativeSource).toBe("legacy_unknown")
    expect(readProvenance(row).addonLensNarrativeSource).toBe("legacy_unknown")
  })
})

/**
 * The success path builds its report by spreading Claude's own parsed response.
 * If the stamp were applied before that spread, or merged with what is already
 * there, a model could choose its own provenance.
 */
describe("the server is the only writer of _meta", () => {
  const hostile = () =>
    ({
      ...fallback(),
      _meta: {
        generationSource: "claude_response_accepted",
        foodSystemNarrativeSource: "claude_contributed",
        addonLensNarrativeSource: "claude_contributed",
        injected: "ZZQX",
      },
    }) as unknown as DeepReport

  it("overwrites a model-supplied _meta rather than merging it", () => {
    const stamped = withProvenance(
      hostile(),
      provenance({
        generationSource: "deterministic_validation_failure",
        foodSystemNarrativeSource: "deterministic",
        addonLensNarrativeSource: "not_applicable",
      }),
    )
    expect(readProvenance(stamped)).toEqual({
      generationSource: "deterministic_validation_failure",
      foodSystemNarrativeSource: "deterministic",
      addonLensNarrativeSource: "not_applicable",
    })
  })

  it("drops model-supplied sibling keys — nothing rides into _meta uninvited", () => {
    const stamped = withProvenance(hostile(), LEGACY_PROVENANCE)
    const meta = (stamped as unknown as { _meta: Record<string, unknown> })._meta
    expect(meta.injected).toBeUndefined()
    expect(Object.keys(meta).sort()).toEqual([
      "addonLensNarrativeSource",
      "foodSystemNarrativeSource",
      "generationSource",
    ])
    expect(JSON.stringify(stamped)).not.toContain("ZZQX")
  })

  it("does not mutate the report it is given", () => {
    const original = fallback()
    const before = JSON.stringify(original)
    withProvenance(original, provenance({ generationSource: "claude_response_accepted" }))
    expect(JSON.stringify(original)).toBe(before)
  })

  it("changes nothing but _meta — scores and content are untouched", () => {
    const before = fallback()
    const after = withProvenance(before, provenance({ generationSource: "claude_response_accepted" }))
    const strip = (r: DeepReport) => {
      const { _meta: _drop, ...rest } = r as DeepReport & { _meta?: unknown }
      return JSON.stringify(rest)
    }
    expect(strip(after)).toBe(strip(before))
    expect(after.foodSystem!.bioticScores).toEqual(before.foodSystem!.bioticScores)
    expect(after.foodSystem!.systemSnapshot).toEqual(before.foodSystem!.systemSnapshot)
  })

  it.each(GENERATION_SOURCES)("a report stamped %s still validates", (source) => {
    const stamped = withProvenance(fallback(), provenance({ generationSource: source }))
    expect(parseFoodSystemReport(stamped.foodSystem)).not.toBeNull()
  })
})

/**
 * The heart of the fix, run against the REAL merges rather than a mock: given
 * what a model actually returned, did any string the merge is allowed to take
 * end up different from the one this codebase derived?
 */
describe("detecting whether model prose survived the food-system merge", () => {
  const base = core()
  const contributed = (generated: unknown) =>
    claudeContributedToFoodSystem(base, mergeGeneratedNarrative(base, generated))

  it("the blocker case: a response with no foodSystem block at all", () => {
    // What the original marker got wrong. The merge returns the base verbatim,
    // the base validates, and the row used to claim Claude wrote it.
    expect(contributed(undefined)).toBe(false)
    expect(contributed({})).toBe(false)
    expect(contributed({ someOtherKey: "…" })).toBe(false)
  })

  it("prose byte-identical to the derived copy reads deterministic", () => {
    // Under-claiming by design: we cannot see authorship we cannot observe.
    expect(contributed({ systemSnapshot: { oneLine: base.systemSnapshot.oneLine } })).toBe(false)
  })

  it("rejected values — empty and whitespace-only — do not count as contribution", () => {
    expect(contributed({ systemSnapshot: { oneLine: "" } })).toBe(false)
    expect(contributed({ priorityLever: { firstStep: "   " } })).toBe(false)
  })

  it.each([
    ["systemSnapshot.oneLine", { systemSnapshot: { oneLine: "A model-written one-liner." } }],
    ["systemSnapshot.dominantPattern", { systemSnapshot: { dominantPattern: "Model pattern." } }],
    ["systemSnapshot.mainLever", { systemSnapshot: { mainLever: "Model lever." } }],
    ["priorityLever.title", { priorityLever: { title: "Model title" } }],
    ["priorityLever.whyThisFirst", { priorityLever: { whyThisFirst: "Model reasoning." } }],
    ["priorityLever.firstStep", { priorityLever: { firstStep: "Model first step." } }],
    ["priorityLever.whatToNotice", { priorityLever: { whatToNotice: "Model signal." } }],
    ["closingMissionPage.insideYou", { closingMissionPage: { insideYou: "Model inside." } }],
    ["closingMissionPage.aroundYou", { closingMissionPage: { aroundYou: "Model around." } }],
    ["closingMissionPage.nextAction", { closingMissionPage: { nextAction: "Model next." } }],
    ["educationModules[].plainEnglish", { educationModules: [{ plainEnglish: "Model plain." }] }],
    ["educationModules[].whyItMatters", { educationModules: [{ whyItMatters: "Model why." }] }],
    [
      "educationModules[].whatYourAnswersSuggest",
      { educationModules: [{ whatYourAnswersSuggest: "Model suggests." }] },
    ],
    ["educationModules[].actionBridge", { educationModules: [{ actionBridge: "Model bridge." }] }],
  ])("a single model value in %s is detected", (_label, generated) => {
    expect(contributed(generated)).toBe(true)
  })

  it("bodySignalMap[].explanation is detected, matched by its derived id", () => {
    const id = base.bodySignalMap[0]!.id
    expect(contributed({ bodySignalMap: [{ id, explanation: "Model explanation." }] })).toBe(true)
    // An id the derived map does not contain is dropped by the merge.
    expect(contributed({ bodySignalMap: [{ id: "no-such-node", explanation: "Ignored." }] })).toBe(
      false,
    )
  })

  it("a model-supplied food list is detected", () => {
    expect(
      contributed({ foodTools: [{ food: "Model food", biotic: "prebiotics", mechanism: "Because." }] }),
    ).toBe(true)
  })

  it("a food list the merge rejects wholesale is not contribution", () => {
    // Each tool needs a name AND a mechanism; nameless entries are filtered out
    // and an empty result leaves the derived list in place.
    expect(contributed({ foodTools: [{ mechanism: "No name given." }] })).toBe(false)
  })

  it("the same tools in a different order are not contribution", () => {
    const asGenerated = base.foodTools.map((t) => ({
      food: t.food,
      biotic: t.biotic,
      mechanism: t.mechanism,
      whyForThisCustomer: t.whyForThisCustomer,
      howToUse: t.howToUse,
      swap: t.swap,
      familyAdaptation: t.familyAdaptation,
    }))
    expect(contributed({ foodTools: [...asGenerated].reverse() })).toBe(false)
  })

  it("derived and fixed fields cannot influence the answer", () => {
    // The merge refuses these outright, so the shipped block is identical to the
    // base — and the detector must agree, not notice some incidental difference.
    expect(
      contributed({
        systemSnapshot: { strongestPathway: "probiotics", priorityPathway: "prebiotics" },
        closingMissionPage: { headlineLines: ["Model headline"] },
        overallScore: 99,
        bioticScores: { prebiotics: 1, probiotics: 1, postbiotics: 1 },
        evidenceNotes: ["Model evidence"],
        safetyFooter: "Model safety footer",
      }),
    ).toBe(false)
  })

  it("a full narrative is detected", () => {
    expect(
      contributed({
        systemSnapshot: { oneLine: "Model one-line.", dominantPattern: "Model pattern." },
        educationModules: base.educationModules.map((_, i) => ({
          plainEnglish: `Model plain ${i}.`,
          whyItMatters: `Model why ${i}.`,
        })),
        priorityLever: { title: "Model lever", firstStep: "Model step." },
        closingMissionPage: { insideYou: "Model inside." },
      }),
    ).toBe(true)
  })
})

describe("detecting whether model prose survived the lens merge", () => {
  const contributedFor = (addon: AddonType, generated: unknown) => {
    const base = coreWithLens(addon).lens!
    return claudeContributedToLens(base, mergeGeneratedLens(base, generated))
  }

  it.each(ADDON_KEYS)("%s: a response with no lens block reads deterministic", (addon) => {
    expect(contributedFor(addon, undefined)).toBe(false)
    expect(contributedFor(addon, {})).toBe(false)
  })

  it.each(ADDON_KEYS)("%s: a rewritten patternSummary is detected", (addon) => {
    expect(
      contributedFor(addon, {
        patternSummary:
          "Your answers describe a pattern the model has summarised in its own words here.",
      }),
    ).toBe(true)
  })

  it.each(ADDON_KEYS)("%s: a too-short patternSummary is rejected, not credited", (addon) => {
    // mergeGeneratedLens requires 40+ characters for this field.
    expect(contributedFor(addon, { patternSummary: "Too short." })).toBe(false)
  })

  it.each(ADDON_KEYS)("%s: one valid signals[].whatToNotice is detected", (addon) => {
    const base = coreWithLens(addon).lens!
    const label = base.signals[0]!.label
    expect(
      contributedFor(addon, {
        signals: [{ label, whatToNotice: "Something specific worth noticing this week." }],
      }),
    ).toBe(true)
    // …and a label the derived lens does not carry is dropped by the merge.
    expect(
      contributedFor(addon, {
        signals: [{ label: "no such signal", whatToNotice: "Something worth noticing here." }],
      }),
    ).toBe(false)
  })

  it.each(ADDON_KEYS)("%s: a rewritten pathway connection is detected", (addon) => {
    const base = coreWithLens(addon).lens!
    const pathway = base.pathwayConnections[0]!.pathway
    expect(
      contributedFor(addon, {
        pathwayConnections: [{ pathway, connection: "How this pathway connects, in model words." }],
      }),
    ).toBe(true)
  })

  it.each(ADDON_KEYS)("%s: lens identity and derived fields cannot influence it", (addon) => {
    expect(
      contributedFor(addon, {
        key: "glucose",
        name: "Model Renamed Lens",
        shortLabel: "Model",
        examines: "Whatever the model says it examines.",
        priorityConnection: { pathway: "probiotics", why: "Model priority." },
        loopAdditions: [{ week: 1, action: "Model action." }],
        safetyNote: "Model safety note.",
        evidenceNotes: ["Model evidence"],
        accent: "#ff0000",
      }),
    ).toBe(false)
  })

  it.each(ADDON_KEYS)("%s: text identical to the derived lens reads deterministic", (addon) => {
    const base = coreWithLens(addon).lens!
    expect(contributedFor(addon, { patternSummary: base.patternSummary })).toBe(false)
  })
})

/**
 * The projection lists the merge's allow-list by hand, which is the one way this
 * can rot: a field added to a merge but not to its projection would be invisible
 * to the detector, and the report would under-claim forever without failing
 * anything. So the allow-list is re-derived from each merge's own source and
 * checked against its projection.
 */
describe("the detectors cannot drift from the merges", () => {
  const read = (path: string) => readFileSync(path, "utf8")
  const between = (s: string, from: string, to: string) => s.slice(s.indexOf(from), s.indexOf(to))

  it("every field mergeGeneratedNarrative accepts is named in the projection", () => {
    const s = read("lib/report/build-food-system-report.ts")
    const merge = between(
      s,
      "export function mergeGeneratedNarrative",
      "export function foodSystemNarrativeProjection",
    )
    const projection = between(
      s,
      "export function foodSystemNarrativeProjection",
      "export function claudeContributedToFoodSystem",
    )

    // Every `str(g.…)` / `str(gen.…)` / `str(t.…)` the merge reads.
    const accepted = [...new Set([...merge.matchAll(/str\((?:g|gen|t)\.(?:\w+\.)?(\w+)\)/g)].map((m) => m[1]))]
    expect(accepted.length).toBeGreaterThan(15) // the extractor still finds them
    expect(accepted.filter((name) => !projection.includes(name))).toEqual([])

    // `biotic` is taken without `str()`, so name it explicitly.
    expect(merge).toContain("t.biotic")
    expect(projection).toContain("biotic")
  })

  it("every field mergeGeneratedLens accepts is named in the projection", () => {
    const s = read("lib/report/addon-lens.ts")
    const merge = between(
      s,
      "export function mergeGeneratedLens",
      "export function lensNarrativeProjection",
    )
    const projection = between(
      s,
      "export function lensNarrativeProjection",
      "export function claudeContributedToLens",
    )

    const accepted = [...new Set([...merge.matchAll(/text\((?:g|gen)\??\.(\w+)/g)].map((m) => m[1]))]
    expect(accepted.sort()).toEqual(["connection", "patternSummary", "whatToNotice"])
    expect(accepted.filter((name) => !projection.includes(name))).toEqual([])
  })

  it("each detector sits beside the merge it describes", () => {
    // Physical proximity is the mechanism that makes the guard above likely to
    // be honoured: you cannot edit one without reading the other.
    for (const [path, merge, detector] of [
      ["lib/report/build-food-system-report.ts", "mergeGeneratedNarrative", "claudeContributedToFoodSystem"],
      ["lib/report/addon-lens.ts", "mergeGeneratedLens", "claudeContributedToLens"],
    ] as const) {
      const s = read(path)
      expect(s.indexOf(`export function ${detector}`)).toBeGreaterThan(
        s.indexOf(`export function ${merge}`),
      )
    }
  })
})

/**
 * The case that blocked the merge, stated as one test: Claude wrote the core
 * narrative and omitted the lens. The record must say so field by field.
 */
describe("a mixed report is recorded as mixed", () => {
  it.each(ADDON_KEYS)("%s: core narrative from Claude, lens omitted", (addon) => {
    const base = coreWithLens(addon)

    // Exactly what a model that ignores the lens schema returns.
    const generated = { systemSnapshot: { oneLine: "A model-written opening line." } }
    const shipped: FoodSystemReport = mergeGeneratedNarrative(base, generated)
    shipped.lens = mergeGeneratedLens(base.lens!, (generated as { lens?: unknown }).lens)

    const p = provenance({
      generationSource: "claude_response_accepted",
      foodSystemNarrativeSource: claudeContributedToFoodSystem(base, shipped)
        ? "claude_contributed"
        : "deterministic",
      addonLensNarrativeSource: claudeContributedToLens(base.lens!, shipped.lens!)
        ? "claude_contributed"
        : "deterministic",
    })

    expect(p.foodSystemNarrativeSource).toBe("claude_contributed")
    expect(p.addonLensNarrativeSource).toBe("deterministic")

    // The lens the customer reads is word-for-word the derived one.
    expect(shipped.lens).toEqual(base.lens)

    // And the persisted record must not claim otherwise.
    const stored = withProvenance({ ...fallback(), foodSystem: shipped } as DeepReport, p)
    expect(readProvenance(stored).addonLensNarrativeSource).not.toBe("claude_contributed")
  })

  it("no add-on: there is no lens to attribute", () => {
    const base = core()
    const shipped = mergeGeneratedNarrative(base, {
      systemSnapshot: { oneLine: "A model-written opening line." },
    })
    expect(shipped.lens).toBeUndefined()
    expect(claudeContributedToFoodSystem(base, shipped)).toBe(true)
    // The route's own expression, evaluated — not merely a check that the value
    // exists in the enum, which would pass with the mapping deleted.
    expect(lensSourceFor(base, shipped)).toBe("not_applicable")
  })
})

/**
 * The success branch compares the derived base against the block returned by
 * `parseFoodSystemReport` — an unparsed object against a zod-parsed one. That
 * only tells the truth if parsing is projection-neutral.
 *
 * It is today: the schema declares no `.trim()`, `.transform()`, `.default()` or
 * coercion. But it is load-bearing and invisible — adding a `.trim()` to any
 * narrative field would make every accepted response read `claude_contributed`
 * regardless of what the model wrote, and nothing else here would notice.
 */
describe("validation is projection-neutral", () => {
  it.each(ADDON_KEYS)("%s: parsing changes neither projection", (addon) => {
    const base = coreWithLens(addon)
    const parsed = parseFoodSystemReport(base)
    expect(parsed).not.toBeNull()
    expect(foodSystemNarrativeProjection(parsed!)).toEqual(foodSystemNarrativeProjection(base))
    expect(claudeContributedToFoodSystem(base, parsed!)).toBe(false)
    expect(lensNarrativeProjection(parsed!.lens!)).toEqual(lensNarrativeProjection(base.lens!))
    expect(claudeContributedToLens(base.lens!, parsed!.lens!)).toBe(false)
  })

  it.each(ADDON_KEYS)("%s: a purchased lens survives validation, so it can never read not_applicable", (addon) => {
    // The invalid combination worth ruling out: an entitled add-on whose lens is
    // stripped by parsing would be recorded as "no add-on", which the operator
    // would read as nothing to check.
    const base = coreWithLens(addon)
    const generated = { systemSnapshot: { oneLine: "A model-written opening line." } }
    const merged = mergeGeneratedNarrative(base, generated)
    merged.lens = mergeGeneratedLens(base.lens!, (generated as { lens?: unknown }).lens)

    const shipped = parseFoodSystemReport(merged)
    expect(shipped).not.toBeNull()
    expect(shipped!.lens?.key).toBe(addon)
    expect(lensSourceFor(base, shipped!)).toBe("deterministic")
    expect(lensSourceFor(base, shipped!)).not.toBe("not_applicable")
  })
})

/**
 * The branch the whole marker exists for: Claude answered, the merged block
 * failed validation, and the derived base shipped instead.
 */
describe("a discarded response is recorded as deterministic", () => {
  it("a merged block that fails validation parses to null, so the base ships", () => {
    const broken = { ...coreWithLens("glucose"), overallScore: "not a number" }
    expect(parseFoodSystemReport(broken)).toBeNull()
  })

  it.each(ADDON_KEYS)("%s: shipping the base attributes neither layer to Claude", (addon) => {
    const base = coreWithLens(addon)
    // The route's `const shipped = validFoodSystem ?? foodSystemBase` on the
    // failure path: the base compared against itself, no special case.
    const shipped = base
    expect(claudeContributedToFoodSystem(base, shipped)).toBe(false)
    expect(lensSourceFor(base, shipped)).toBe("deterministic")
  })
})

/**
 * Reuse. Re-serving a stored report — and enriching it with a derived block or
 * lens it never had — is derivation, not generation, and must not relabel it.
 */
describe("reuse preserves the original provenance", () => {
  const storedWith = (p: Partial<ReportProvenance>, report: DeepReport = fallback()) =>
    withProvenance(report, provenance(p)) as DeepReport

  it.each(GENERATION_SOURCES)("a reused %s report keeps its generationSource", (source) => {
    const stored = storedWith({ generationSource: source })
    const reused = reconcileAddonLens(
      ensureFoodSystem(stored, { mode: "combined", subScores: SUB, overall, profile }),
      { addon: null, answers: {}, isFamily: false },
    )
    expect(readProvenance(reused).generationSource).toBe(source)
  })

  it.each(FOOD_SYSTEM_NARRATIVE_SOURCES)("a reused report keeps foodSystemNarrativeSource %s", (s) => {
    const stored = storedWith({ foodSystemNarrativeSource: s })
    const reused = ensureFoodSystem(stored, { mode: "combined", subScores: SUB, overall, profile })
    expect(readProvenance(reused).foodSystemNarrativeSource).toBe(s)
  })

  it("a legacy report without _meta reads legacy_unknown, and stays valid", () => {
    const legacy = fallback()
    expect((legacy as { _meta?: unknown })._meta).toBeUndefined()
    const reused = ensureFoodSystem(legacy, { mode: "combined", subScores: SUB, overall, profile })
    expect(readProvenance(reused)).toEqual(LEGACY_PROVENANCE)
    expect(parseFoodSystemReport(reused.foodSystem)).not.toBeNull()
  })

  it.each(ADDON_KEYS)("%s: enriching a missing lens on reuse does not relabel the core", (addon) => {
    // A report generated deterministically, later reused by a customer entitled
    // to a lens it never had. The lens is derived and attached — the core prose
    // was still not written by Claude, and neither is the new lens.
    const stored = storedWith(
      { generationSource: "deterministic_no_api_key", foodSystemNarrativeSource: "deterministic" },
      { ...fallback(), foodSystem: core() } as DeepReport,
    )
    expect(stored.foodSystem!.lens).toBeUndefined()

    const enriched = reconcileAddonLens(stored, { addon, answers: lensAnswers(addon), isFamily: false })
    const read = readProvenance(enriched)

    expect(enriched.foodSystem!.lens!.key).toBe(addon)
    expect(read.generationSource).toBe("deterministic_no_api_key")
    expect(read.foodSystemNarrativeSource).toBe("deterministic")
    expect(read.foodSystemNarrativeSource).not.toBe("claude_contributed")
  })

  it.each(ADDON_KEYS)("%s: a claude-written core keeps its attribution through enrichment", (addon) => {
    const stored = storedWith(
      {
        generationSource: "claude_response_accepted",
        foodSystemNarrativeSource: "claude_contributed",
      },
      { ...fallback(), foodSystem: core() } as DeepReport,
    )
    const enriched = reconcileAddonLens(stored, { addon, answers: lensAnswers(addon), isFamily: false })
    expect(readProvenance(enriched).foodSystemNarrativeSource).toBe("claude_contributed")
  })
})

/**
 * The lens half of reuse, run against `reconcileAddonLens`'s real outcomes. The
 * stored lens attribution only describes the lens that was stored.
 */
describe("the reused lens attribution follows the lens that actually survives", () => {
  const reconcile = (stored: DeepReport, addon: AddonType | null) =>
    reconcileAddonLens(stored, {
      addon,
      answers: addon ? lensAnswers(addon) : {},
      isFamily: false,
    })

  const withStoredLens = (addon: AddonType) =>
    ({ ...fallback(), foodSystem: coreWithLens(addon) }) as DeepReport

  it.each(ADDON_KEYS)("%s: the same lens survives, so a claude attribution is preserved", (addon) => {
    const stored = withStoredLens(addon)
    const final = reconcile(stored, addon)
    expect(final.foodSystem!.lens!.key).toBe(addon)
    expect(
      reusedAddonLensSource(
        provenance({ addonLensNarrativeSource: "claude_contributed" }),
        addon,
        final.foodSystem!.lens!.key,
      ),
    ).toBe("claude_contributed")
  })

  it.each(ADDON_KEYS)("%s: a lens derived on reuse is deterministic, whatever was stored", (addon) => {
    // Nothing stored, entitlement now present — reconcileAddonLens derives one.
    const stored = { ...fallback(), foodSystem: core() } as DeepReport
    const final = reconcile(stored, addon)
    expect(final.foodSystem!.lens!.key).toBe(addon)
    expect(
      reusedAddonLensSource(
        provenance({ addonLensNarrativeSource: "claude_contributed" }),
        null,
        final.foodSystem!.lens!.key,
      ),
    ).toBe("deterministic")
  })

  it("a lens replaced by a different add-on is deterministic", () => {
    const stored = withStoredLens("stability")
    const final = reconcile(stored, "glucose")
    expect(final.foodSystem!.lens!.key).toBe("glucose")
    expect(
      reusedAddonLensSource(
        provenance({ addonLensNarrativeSource: "claude_contributed" }),
        "stability",
        final.foodSystem!.lens!.key,
      ),
    ).toBe("deterministic")
  })

  it("a lens removed on reuse is not_applicable", () => {
    const stored = withStoredLens("stability")
    const final = reconcile(stored, null)
    expect(final.foodSystem!.lens).toBeUndefined()
    expect(
      reusedAddonLensSource(
        provenance({ addonLensNarrativeSource: "claude_contributed" }),
        "stability",
        final.foodSystem!.lens?.key ?? null,
      ),
    ).toBe("not_applicable")
  })

  it("no lens before or after is not_applicable, never a claim", () => {
    expect(reusedAddonLensSource(LEGACY_PROVENANCE, null, null)).toBe("not_applicable")
  })

  it("a legacy row with a surviving lens stays unknown rather than guessing", () => {
    expect(reusedAddonLensSource(LEGACY_PROVENANCE, "stability", "stability")).toBe("legacy_unknown")
  })

  it("a row that contradicts itself reads unknown, not not_applicable", () => {
    // Stored says there was no lens, yet one survived reconciliation.
    expect(
      reusedAddonLensSource(provenance({ addonLensNarrativeSource: "not_applicable" }), "stability", "stability"),
    ).toBe("legacy_unknown")
  })
})

/**
 * The marker must be inert. A deterministic fallback is still a successfully
 * delivered report, and provenance must not leak into delivery decisions.
 */
describe("delivery semantics are unaffected", () => {
  it("status and access are computed from pdf/email only", () => {
    // Kept as one real case rather than one per enum value: the inputs to these
    // functions do not include provenance, so repeating it per value would pass
    // even with the stamp deleted. The binding assertion is the source check.
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: true })).toBe("complete")
    expect(overallReportStatus({ reportOk: true, pdfOk: false, emailOk: true })).toBe("partial")
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: false })).toBe("partial")
    expect(reportViewState("complete", true)).toBe("view")
    expect(reportViewState("partial", true)).toBe("view_delivery_pending")
    expect(reportViewState("complete", false)).toBe("resume_questionnaire")
  })

  it("a report whose prose is entirely deterministic is still complete and deliverable", () => {
    const r = withProvenance(
      fallback(),
      provenance({
        generationSource: "deterministic_validation_failure",
        foodSystemNarrativeSource: "deterministic",
        addonLensNarrativeSource: "not_applicable",
      }),
    )
    expect(parseFoodSystemReport(r.foodSystem)).not.toBeNull()
    expect(overallReportStatus({ reportOk: true, pdfOk: true, emailOk: true })).toBe("complete")
    expect(reportViewState("complete", Boolean(r))).toBe("view")
  })
})

describe("the correlation tag never carries the session id", () => {
  it("is a short one-way hash", () => {
    const id = "cs_test_a1b2c3d4e5f6g7h8"
    const tag = sessionTag(id)
    expect(tag).toMatch(/^[0-9a-f]{12}$/)
    expect(tag).not.toContain(id)
    expect(id).not.toContain(tag)
  })

  it("is stable and distinct per session", () => {
    expect(sessionTag("cs_a")).toBe(sessionTag("cs_a"))
    expect(sessionTag("cs_a")).not.toBe(sessionTag("cs_b"))
  })
})

/**
 * Route wiring. Source inspection, deliberately and with its limits stated: the
 * Claude call cannot be exercised here, so reading the branch is the only way to
 * pin which one stamps which value.
 */
describe("the route stamps every branch correctly", () => {
  const src = () => readFileSync("app/api/submit-deep-assessment/route.ts", "utf8")

  it.each([
    ["no API key", 'generationSource = "deterministic_no_api_key"'],
    ["Claude threw", 'generationSource = "deterministic_claude_error"'],
    ["reuse reads the stored record", "const stored = readProvenance(existingRow.report_json)"],
    ["reuse preserves the request field", "generationSource = stored.generationSource"],
    [
      "reuse preserves the core narrative field",
      "foodSystemNarrativeSource = stored.foodSystemNarrativeSource",
    ],
    ["reuse re-derives the lens field", "addonLensNarrativeSource = reusedAddonLensSource("],
  ])("%s", (_label, needle) => expect(src()).toContain(needle))

  it("validation failure and success are decided by the same validated result", () => {
    expect(src()).toContain(
      'generationSource = validFoodSystem ? "claude_response_accepted" : "deterministic_validation_failure"',
    )
  })

  it("both fallback branches attribute the prose to this codebase", () => {
    const s = src()
    for (const branch of ['"deterministic_no_api_key"', '"deterministic_claude_error"']) {
      const after = s.slice(s.indexOf(`generationSource = ${branch}`), s.indexOf(branch) + 400)
      expect(after).toContain('foodSystemNarrativeSource = "deterministic"')
      expect(after).toContain(
        'addonLensNarrativeSource = entitledAddon ? "deterministic" : "not_applicable"',
      )
      expect(after).not.toContain("claude_contributed")
    }
  })

  it("the narrative fields are computed from the shipped block, not from acceptance", () => {
    const s = src()
    // The detectors compare the derived base against what the customer will
    // read — so a validation failure compares the base with itself.
    expect(s).toContain("const shipped = validFoodSystem ?? foodSystemBase")
    expect(s).toContain("claudeContributedToFoodSystem(foodSystemBase, shipped)")
    expect(s).toContain("claudeContributedToLens(foodSystemBase.lens, shipped.lens)")
    expect(s).toMatch(/!shipped\.lens\s*\?\s*"not_applicable"/)
    // Not derived from generationSource — that is the conflation being fixed.
    expect(s).not.toMatch(/foodSystemNarrativeSource\s*=\s*validFoodSystem\s*\?/)
    expect(s).not.toMatch(/addonLensNarrativeSource\s*=\s*validFoodSystem\s*\?/)
  })

  it("stamps after the branches, so a model-supplied _meta cannot win", () => {
    const s = src()
    const stampAt = s.indexOf("report = withProvenance(report, {")
    expect(stampAt).toBeGreaterThan(-1)
    // After the spread of Claude's parsed response…
    expect(stampAt).toBeGreaterThan(s.indexOf("...(parsed as DeepReport)"))
    // …and before the row is persisted.
    expect(stampAt).toBeLessThan(s.indexOf("report_json: report"))
  })

  it("adds the operational message the validation-failure branch was missing", () => {
    expect(src()).toContain(
      'reportError = "Claude returned a foodSystem that failed validation — used derived base"',
    )
  })

  it("logs one structured event carrying only operational fields", () => {
    const s = src()
    const call = s.slice(s.indexOf("logGenerationSource({"), s.indexOf("// Step 6"))

    // Exactly the allowed keys — an added field has to be a deliberate edit here.
    const keys = [...call.matchAll(/^\s{4}(\w+)[,:]/gm)].map((m) => m[1]).sort()
    expect(keys).toEqual([
      "addon",
      "addonLensNarrativeSource",
      "foodSystemNarrativeSource",
      "generationSource",
      "mode",
      "reuse",
      "sessionTag",
      "tier",
    ])

    // The raw session id is hashed, never logged directly.
    expect(call).toContain("sessionTag: sessionTag(sessionId)")
    expect(call.replace("sessionTag: sessionTag(sessionId)", "")).not.toContain("sessionId")

    // Nothing identifying or content-bearing. `existingRow?.report_json` is a
    // boolean coercion for the reuse flag, not logged content — so this checks
    // for the report OBJECT being passed, not the substring.
    expect(call).not.toMatch(/\banswers\b|\bquestions\b|leadName|\bemail\b|\bprofile\b/)
    expect(call).not.toMatch(/report_json: |report,|pdfUrl/)
  })

  it("does not let any provenance field reach overall_status or the owner alert", () => {
    const s = src()
    const fields = ["generationSource", "foodSystemNarrativeSource", "addonLensNarrativeSource"]
    const statusBlock = s.slice(s.indexOf("const overall_status = overallReportStatus(")).slice(0, 400)
    const alertBlock = s.slice(s.indexOf("submit-deep-assessment-partial")).slice(0, 500)
    for (const field of fields) {
      expect(statusBlock).not.toContain(field)
      expect(alertBlock).not.toContain(field)
    }
  })
})

/** Type-level pin: the lens detector takes a lens, not a whole report. */
const _typePin: (b: FoodSystemLens, m: FoodSystemLens) => boolean = claudeContributedToLens
void _typePin
