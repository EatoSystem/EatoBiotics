import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { templateFor } from "@/lib/report/deterministic/content-pack"
import {
  FIXTURE_QUESTION,
  FIXTURE_UNGATED_TARGET,
  FIXTURE_VALUES,
  useFixtureContentPack,
} from "./fixtures/report-content-pack-fixture"

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
  // An IDENTITY, never words. The pack resolves the sentence and its gates.
  content: {
    from: "content-pack",
    questionId: "core_signals_energy_shape_v1",
    value: "afternoon-dip",
  } as const,
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
      content: {
        from: "content-pack",
        questionId: "core_rhythm_recent_change_v1",
        value: "health-event",
      },
    })
    // The PERMISSION registry's refusal, not the pack's. Both would decline
    // this value; the stronger authority is the one that must be reported.
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
      content: {
        from: "content-pack",
        questionId: "core_rhythm_recent_change_v1",
        value: "schedule",
      },
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
      content: {
        from: "content-pack",
        questionId: "core_signals_energy_shape_v1",
        value: "afternoon-dip",
      },
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
      content: {
        from: "content-pack",
        questionId: "core_environment_constraints_v1",
        value: "allergy",
      },
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
    /*
     * Through the STRUCTURAL path, because it is the only one that still
     * accepts caller text — and therefore the only one where a prohibited
     * framing could originate. Pack templates are corpus-checked separately;
     * this proves the escape hatch is checked too.
     */
    const result = buildProposition({
      ...valid,
      content: {
        from: "structural",
        templateId: "intentions.success.quotation",
        text: "This shows your energy dips in the afternoon.",
      },
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
describe("the pack, not the caller, establishes the words and their gates", () => {
  const FIXTURE = useFixtureContentPack()

  const foodOperation = {
    id: "test.constraint",
    kind: "constraint" as const,
    sourceQuestionIds: ["core_environment_constraints_v1"],
    allowedUse: "operational-filtering" as const,
    target: "foodTools" as const,
    content: {
      from: "content-pack",
      questionId: "core_environment_constraints_v1",
      value: "allergy",
    } as const,
  }

  /** A fixture operation on a target that requires nothing of its own. */
  const fixtureOperation = (value: string) => ({
    id: `test.fixture.${value}`,
    kind: "recap" as const,
    sourceQuestionIds: [FIXTURE_QUESTION],
    allowedUse: "descriptive-recap" as const,
    target: FIXTURE_UNGATED_TARGET,
    content: { from: "content-pack", packId: FIXTURE, questionId: FIXTURE_QUESTION, value } as const,
  })

  const requirementsOf = (input: Parameters<typeof buildProposition>[0]) => {
    const result = buildProposition(input)
    expect(result.ok, result.ok ? "" : `refused: ${result.reason} — ${result.detail}`).toBe(true)
    if (!result.ok) throw new Error(result.reason)
    return result.proposition.requiredCapabilities
  }

  /* ── One test per gate, all three through the real constructor ───────── */

  it("a template requiring specificFoods cannot be constructed without it", () => {
    expect(requirementsOf(foodOperation)).toEqual(["specificFoods"])
  })

  it("a template requiring bioticsLanguage carries it on an ungated target", () => {
    // thirtyDayLoop requires nothing, and the question grants nothing extra,
    // so the requirement can only have come from the words themselves.
    expect(requirementsOf(fixtureOperation(FIXTURE_VALUES.biotics))).toEqual(["bioticsLanguage"])
  })

  it("a template requiring safetyNetting carries it on an ungated target", () => {
    expect(requirementsOf(fixtureOperation(FIXTURE_VALUES.safety))).toEqual(["safetyNetting"])
  })

  it("an ungated template on the same target and question requires nothing", () => {
    // The control. Without it the two assertions above could pass because
    // everything from this pack is gated.
    expect(requirementsOf(fixtureOperation(FIXTURE_VALUES.ungated))).toEqual([])
  })

  /* ── The gate travels with the words ─────────────────────────────────── */

  it("moving a gated template to another permitted target does not erase its gate", () => {
    /*
     * `environment.constraints` permits foodTools (gated by the target) and
     * thirtyDayLoop (gated by nothing). A food template placed on the second
     * must still answer to the dietetic gate — the requirement belongs to
     * what is being said, not only to which section says it.
     */
    const named = templateFor("core_environment_food_avoidances_v1", "dairy")
    expect(named?.requiresCapabilities).toContain("specificFoods")
    expect(
      requirementsOf({
        id: "test.moved",
        kind: "constraint",
        sourceQuestionIds: ["core_environment_food_avoidances_v1"],
        allowedUse: "operational-filtering",
        target: "thirtyDayLoop",
        content: {
          from: "content-pack",
          questionId: "core_environment_food_avoidances_v1",
          value: "dairy",
        },
      }),
    ).toEqual(["specificFoods"])
  })

  it("a loop beat inherits the capabilities of the proposition it re-frames", () => {
    // Re-framing a gated sentence four times must not ungate it once.
    const lever = buildProposition(fixtureOperation(FIXTURE_VALUES.biotics))
    expect(lever.ok).toBe(true)
    if (!lever.ok) return
    expect(
      requirementsOf({
        id: "test.loop.week1",
        kind: "loop-step",
        sourceQuestionIds: lever.proposition.sourceQuestionIds,
        allowedUse: lever.proposition.allowedUse,
        target: "thirtyDayLoop",
        content: { from: "proposition", source: lever.proposition, templateIdSuffix: "loop.try" },
      }),
    ).toEqual(["bioticsLanguage"])
  })

  /* ── No caller argument can weaken, remove or replace a requirement ──── */

  it("there is no argument for text, a template id, or template capabilities", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/proposition.ts"), "utf8")
    const input = source.slice(
      source.indexOf("export interface PropositionInput"),
      source.indexOf("/** The words and the gates"),
    )
    for (const banned of [/^\s*capability\??:/m, /^\s*text\??:/m, /^\s*templateId\??:/m, /^\s*templateCapabilities\??:/m]) {
      expect(input, `PropositionInput still accepts ${banned}`).not.toMatch(banned)
    }
    expect(source).toContain("requiredCapabilitiesFor(")
  })

  it("extra properties shaped like the old API are ignored", () => {
    const forged = buildProposition({
      ...foodOperation,
      capability: "safetyNetting",
      templateCapabilities: [],
      text: "You told us you avoid nothing at all.",
      templateId: "forged",
    } as unknown as Parameters<typeof buildProposition>[0])
    expect(forged.ok).toBe(true)
    if (!forged.ok) return
    expect(forged.proposition.requiredCapabilities).toEqual(["specificFoods"])
    expect(forged.proposition.templateId).toBe("environment.constraints.allergy")
    expect(forged.proposition.text).toBe("You told us there's an allergy to work around.")
  })

  it("a forged disposition object cannot stand in for a reviewed one", () => {
    // Runtime resolution, not structural typing: there is no argument through
    // which an object literal reaches the constructor as a template.
    const forged = buildProposition({
      ...foodOperation,
      content: {
        from: "content-pack",
        packId: "not-a-registered-pack",
        questionId: "core_environment_constraints_v1",
        value: "allergy",
      },
    })
    expect(refusalOf(forged)).toBe("content-pack-unknown")
  })

  it("an ungated operation from the same source requires nothing", () => {
    /*
     * The precision half, and the reason capability cannot live on the
     * question: the SAME answer produces a gated food operation and an
     * ungated practical one, and only the first may be suppressed.
     */
    expect(
      requirementsOf({
        id: "test.fit",
        kind: "recap",
        sourceQuestionIds: ["core_environment_constraints_v1"],
        allowedUse: "practical-fit",
        target: "thirtyDayLoop",
        content: { from: "content-pack", questionId: "core_environment_constraints_v1", value: "time" },
      }),
    ).toEqual([])
  })

  it("the requirement set on a built proposition cannot be edited afterwards", () => {
    const required = requirementsOf(foodOperation) as string[]
    expect(Object.isFrozen(required)).toBe(true)
    expect(() => required.splice(0, 1)).toThrow()
  })

  /* ── The three content refusals ──────────────────────────────────────── */

  it("refuses an unreviewed value rather than inventing words for it", () => {
    expect(refusalOf(buildProposition(fixtureOperation("nobody-decided")))).toBe("content-unreviewed")
  })

  it("reports reviewed silence as its own reason, distinct from unreviewed", () => {
    expect(refusalOf(buildProposition(fixtureOperation(FIXTURE_VALUES.silent)))).toBe("content-silent")
  })

  it("refuses a structural id outside the pack's allow-list", () => {
    expect(
      refusalOf(
        buildProposition({
          ...foodOperation,
          content: {
            from: "structural",
            templateId: "invented.id" as never,
            text: "You told us something.",
          },
        }),
      ),
    ).toBe("structural-id-unknown")
  })
})
