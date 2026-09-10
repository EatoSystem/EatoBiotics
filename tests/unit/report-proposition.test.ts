import { describe, it, expect } from "vitest"

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
