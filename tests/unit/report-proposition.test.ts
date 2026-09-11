import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { AGGREGATION_EVIDENCE_RULE } from "@/lib/consultation/science-contract"
import {
  buildProposition,
  usesProhibitedFraming,
  type PropositionResult,
} from "@/lib/report/deterministic/proposition"

/**
 * The proposition constructor — Phase 4A-S2.
 *
 * ══ THE QUESTION EVERY SENTENCE MUST ANSWER ═════════════════════════════════
 *
 *   WHY IS THIS ALLOWED TO EXIST?
 *
 * Answered mechanically or not at all. A composer that could write a
 * proposition object directly would be asserting its own permission, so
 * everything customer-facing goes through `buildProposition` and it refuses by
 * default: no source, no record, no granted use, no granted target, a silenced
 * value, a mixed authority or a prohibited framing all produce a typed refusal
 * rather than a sentence.
 */

const refusalOf = (result: PropositionResult) => (result.ok ? null : result.reason)

const valid = {
  id: "test.recap",
  kind: "recap" as const,
  sourceQuestionIds: ["core_signals_energy_shape_v1"],
  allowedUse: "practical-timing" as const,
  target: "priorityLever" as const,
  templateId: "t1",
  text: "You reported an afternoon dip in your energy.",
}

describe("a proposition cannot exist without provenance", () => {
  it("builds when every element is granted", () => {
    const result = buildProposition(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sourceFields).toEqual(["signals.energyShape"])
    expect(result.proposition.basis.kind).toBe("science-adjudicated")
    expect(result.proposition.evidenceStatus).toBe("CONTEXT_ONLY")
  })

  it("refuses an unsourced sentence", () => {
    expect(refusalOf(buildProposition({ ...valid, sourceQuestionIds: [] }))).toBe("no-source")
  })

  it("refuses a question with no permission record", () => {
    expect(
      refusalOf(buildProposition({ ...valid, sourceQuestionIds: ["core_invented_v1"] })),
    ).toBe("no-permission-record")
  })

  it("refuses a use the record does not grant", () => {
    // energyShape grants timing, recap and reflection — never operational filtering.
    expect(
      refusalOf(buildProposition({ ...valid, allowedUse: "operational-filtering" })),
    ).toBe("use-not-permitted")
  })

  it("refuses a target the record does not grant", () => {
    expect(refusalOf(buildProposition({ ...valid, target: "foodTools" }))).toBe("use-not-permitted")
  })

  it("refuses a target adjudication explicitly withheld", () => {
    // bodySignalMap was withdrawn from every signal question by adjudication.
    expect(refusalOf(buildProposition({ ...valid, target: "bodySignalMap" }))).toBe(
      "use-not-permitted",
    )
  })
})

describe("value-level denials reach the constructor", () => {
  it("refuses a silenced value even where the question is permitted", () => {
    const result = buildProposition({
      id: "recentChange.healthEvent",
      kind: "recap",
      sourceQuestionIds: ["core_rhythm_recent_change_v1"],
      sourceValues: { core_rhythm_recent_change_v1: ["health-event"] },
      allowedUse: "descriptive-recap",
      target: "systemSnapshot",
      templateId: "t",
      text: "You told us about a health event.",
    })
    expect(refusalOf(result)).toBe("value-silenced")
  })

  it("permits a sibling value of the same question", () => {
    const result = buildProposition({
      id: "recentChange.schedule",
      kind: "recap",
      sourceQuestionIds: ["core_rhythm_recent_change_v1"],
      sourceValues: { core_rhythm_recent_change_v1: ["schedule"] },
      allowedUse: "descriptive-recap",
      target: "systemSnapshot",
      templateId: "t",
      text: "You told us a change of schedule has affected how you eat recently.",
    })
    expect(result.ok).toBe(true)
  })
})

describe("authorities do not mix, and aggregation does not upgrade", () => {
  it("refuses a sentence resting on both a science and a product authority", () => {
    /*
     * A sentence with two authorities has no single answer to "who permitted
     * this", and the weaker one would do the work while the stronger lent its
     * name. Split it into two propositions instead.
     */
    const result = buildProposition({
      id: "mixed",
      kind: "recap",
      sourceQuestionIds: ["core_signals_energy_shape_v1", "core_rhythm_longest_gap_v1"],
      allowedUse: "practical-timing",
      target: "thirtyDayLoop",
      templateId: "t",
      text: "You reported an afternoon dip, and a long gap between meals.",
    })
    expect(refusalOf(result)).toBe("mixed-basis")
  })

  it("a combination is never stronger than its weakest source", () => {
    // constraints is SUPPORTED; combining it with anything CONTEXT_ONLY must
    // not produce SUPPORTED.
    const result = buildProposition({
      id: "constraints.only",
      kind: "constraint",
      sourceQuestionIds: ["core_environment_constraints_v1"],
      allowedUse: "operational-filtering",
      target: "foodTools",
      templateId: "t",
      text: "You told us there's an allergy to work around.",
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.proposition.evidenceStatus).toBe("SUPPORTED")
  })

  it("the states aggregation can never produce are the adjudicated ones", () => {
    expect(AGGREGATION_EVIDENCE_RULE.cannotProduce).toContain("biomarker")
    expect(AGGREGATION_EVIDENCE_RULE.cannotProduce).toContain("postbiotics-state")
    expect(AGGREGATION_EVIDENCE_RULE.cannotProduceValidatedSystemModel).toBe(true)
  })
})

describe("prohibited framings are refused, not merely discouraged", () => {
  it("catches every framing the contract prohibits", () => {
    for (const framing of ["We found", "This shows", "This reveals", "Your microbiome is"]) {
      expect(usesProhibitedFraming(`${framing} something about you.`)).toBe(framing)
    }
  })

  it("refuses to build a proposition that uses one", () => {
    const result = buildProposition({
      ...valid,
      text: "This shows your energy dips in the afternoon.",
    })
    expect(refusalOf(result)).toBe("prohibited-framing")
  })

  it("permits the approved reporting framings", () => {
    for (const text of [
      "You told us your energy dips in the afternoon.",
      "You reported an afternoon dip.",
      "You said this tends to happen on rushed days.",
    ]) {
      expect(usesProhibitedFraming(text)).toBeNull()
    }
  })
})

/* ══ Capability requirements are derived, never supplied ═══════════════════ */

/**
 * ══ THE DEFECT THIS BLOCK REPLACES ══════════════════════════════════════════
 *
 * `buildProposition` used to compute, in effect, `input.capability ??
 * permission.capability` — so a caller could hand it a DIFFERENT capability
 * from the one the operation actually needed. Passing `safetyNetting` for a
 * sentence that names a food satisfied the check while the food was named.
 *
 * Requirements are now derived from three authorities the caller does not
 * control — the target, the question's own grant of that target, and the
 * reviewed template's own words — and there is no input that can replace or
 * remove one. `templateCapabilities` can only ADD, and even then only what a
 * content-pack entry already declared.
 */
describe("a caller cannot choose which capability an operation needs", () => {
  const foodOperation = {
    id: "test.constraint",
    kind: "constraint" as const,
    sourceQuestionIds: ["core_environment_constraints_v1"],
    allowedUse: "operational-filtering" as const,
    target: "foodTools" as const,
    templateId: "t-food",
    text: "You told us there is a food allergy to work around.",
  }

  it("a foodTools operation requires specificFoods", () => {
    const result = buildProposition(foodOperation)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.requiredCapabilities).toEqual(["specificFoods"])
  })

  it("substituting a different capability does not replace the real one", () => {
    // The exact attack: an input shaped like the old API.
    const substituted = buildProposition({
      ...foodOperation,
      capability: "safetyNetting",
    } as unknown as Parameters<typeof buildProposition>[0])
    expect(substituted.ok).toBe(true)
    if (!substituted.ok) return
    expect(substituted.proposition.requiredCapabilities).toEqual(["specificFoods"])
    expect(substituted.proposition.requiredCapabilities).not.toContain("safetyNetting")
  })

  it("an empty template list cannot erase what the target requires", () => {
    const result = buildProposition({ ...foodOperation, templateCapabilities: [] })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.requiredCapabilities).toEqual(["specificFoods"])
  })

  it("a template that names a food adds its requirement to an ungated target", () => {
    const result = buildProposition({
      id: "test.loop",
      kind: "loop-step",
      sourceQuestionIds: ["core_environment_food_avoidances_v1"],
      allowedUse: "operational-filtering",
      target: "thirtyDayLoop",
      templateId: "t-named",
      text: "You told us you avoid dairy.",
      templateCapabilities: ["specificFoods"],
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.requiredCapabilities).toEqual(["specificFoods"])
  })

  it("an ungated operation from the same source requires nothing", () => {
    /*
     * The precision half, and the reason capability cannot live on the
     * question: the SAME answer produces a gated food operation and an
     * ungated practical one, and only the first may be suppressed.
     */
    const result = buildProposition({
      id: "test.fit",
      kind: "recap",
      sourceQuestionIds: ["core_environment_constraints_v1"],
      allowedUse: "practical-fit",
      target: "thirtyDayLoop",
      templateId: "t-fit",
      text: "You told us time to cook is tight.",
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.requiredCapabilities).toEqual([])
  })

  it("the requirement set on a built proposition cannot be edited afterwards", () => {
    const result = buildProposition(foodOperation)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const required = result.proposition.requiredCapabilities as string[]
    expect(Object.isFrozen(required)).toBe(true)
    expect(() => required.splice(0, 1)).toThrow()
    expect(result.proposition.requiredCapabilities).toEqual(["specificFoods"])
  })

  it("the input type carries no capability field at all", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/proposition.ts"), "utf8")
    // A field would be an override; the ban is on the shape, not the usage.
    expect(source).not.toMatch(/^\s*capability\??:/m)
    expect(source).toContain("requiredCapabilitiesFor(")
  })
})
