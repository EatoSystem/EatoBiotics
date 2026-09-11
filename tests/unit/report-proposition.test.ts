import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { STRUCTURAL_COPY, templateFor } from "@/lib/report/deterministic/content-pack"
import {
  FIXTURE_QUESTION,
  FIXTURE_UNGATED_TARGET,
  FIXTURE_VALUES,
  useFixtureContentPack,
} from "./fixtures/report-content-pack-fixture"

import { AGGREGATION_EVIDENCE_RULE } from "@/lib/consultation/science-contract"
import {
  QUOTATION_QUESTION_ID,
  QUOTATION_TEMPLATE_ID,
  buildProposition,
  buildQuotationProposition,
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

  it("records the content's own answer as its provenance", () => {
    // The binding. One identity produced the words AND the record of where
    // they came from, so there is nothing for them to disagree about.
    const result = buildProposition(valid)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sources).toEqual([
      { questionId: "core_signals_energy_shape_v1", value: "afternoon-dip" },
    ])
    expect(result.proposition.sourceQuestionIds).toEqual(["core_signals_energy_shape_v1"])
  })

  it("refuses a question with no permission record", () => {
    expect(
      refusalOf(
        buildProposition({
          ...valid,
          content: { from: "content-pack", questionId: "core_invented_v1", value: "x" },
        }),
      ),
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
  it("cannot be reached, because a proposition has exactly one source", () => {
    /*
     * This used to be a refusal test. It reached `mixed-basis` by handing the
     * constructor a second source, which is exactly the caller-authored
     * provenance the fourth repair round removed — so the state is now
     * unrepresentable rather than refused.
     *
     * The check itself is KEPT in the constructor, guarding the multi-source
     * mechanism a later phase may add. What is asserted here is the reason it
     * cannot fire today, so nobody reads it as live behaviour.
     */
    const result = buildProposition({
      id: "one-source",
      kind: "recap",
      allowedUse: "practical-timing",
      target: "thirtyDayLoop",
      content: {
        from: "content-pack",
        questionId: "core_signals_energy_shape_v1",
        value: "afternoon-dip",
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sources).toHaveLength(1)
    expect(new Set(result.proposition.sourceQuestionIds).size).toBe(1)
  })

  it("a combination is never stronger than its weakest source", () => {
    // constraints is SUPPORTED; combining it with anything CONTEXT_ONLY must
    // not produce SUPPORTED.
    const result = buildProposition({
      id: "constraints.only",
      kind: "constraint",
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

  it("refuses a quotation whose customer text uses one", () => {
    /*
     * The quotation is the only remaining sentence with any caller-shaped
     * text in it, and even there the text is the CUSTOMER'S. The check still
     * runs on the assembled sentence, so nothing reaches a Report by that
     * route either. Pack templates are corpus-checked separately.
     */
    expect(
      refusalOf(buildQuotationProposition({ answer: "This shows my energy dips after lunch." })),
    ).toBe("prohibited-framing")
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

  it("the quotation route is not reachable through the general constructor", () => {
    /*
     * Refused at RUNTIME, not merely absent from the exported type. An
     * unexported variant is closed to an honest caller and open to a cast,
     * and this is the one route whose entire purpose is that it cannot be
     * reached generically.
     */
    expect(
      refusalOf(
        buildProposition({
          ...foodOperation,
          content: { from: "quotation", answer: "Calmer mornings." } as never,
        }),
      ),
    ).toBe("content-route-unavailable")
  })
})

/* ══ Content identity IS provenance ════════════════════════════════════════ */

/**
 * ══ THE DEFECT THIS BLOCK REPLACES ══════════════════════════════════════════
 *
 * `buildProposition` took provenance as `sourceQuestionIds` plus an OPTIONAL
 * `sourceValues` map, and took content as a separate `{questionId, value}`.
 * It checked permission and value rules against the first and resolved the
 * sentence from the second, and reconciled them nowhere. A caller could take
 * permission and provenance from question A while the words came from
 * question B, and the Report would record an origin that was not true.
 *
 * The optional map was the sharper edge: omitting it skipped every
 * value-level rule for the value that actually produced the words.
 * `health-event` is `no-proposition` at value level precisely because the
 * Science Contract withdrew reported health history — and it was reachable by
 * simply not declaring it.
 *
 * Both are now unrepresentable rather than refused, which is the stronger
 * outcome and the reason these tests are shaped the way they are.
 */
describe("a proposition's words and its recorded origin are one fact", () => {
  const packInput = (questionId: string, value: string) => ({
    id: `bind.${questionId}.${value}`,
    kind: "recap" as const,
    allowedUse: "descriptive-recap" as const,
    target: "systemSnapshot" as const,
    content: { from: "content-pack", questionId, value } as const,
  })

  it("the input has no way to describe provenance separately", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/proposition.ts"), "utf8")
    const input = source.slice(
      source.indexOf("export interface PropositionInput"),
      source.indexOf("/** The words and the gates"),
    )
    for (const banned of [/^\s*sourceQuestionIds\??:/m, /^\s*sourceValues\??:/m]) {
      expect(input, `PropositionInput still accepts ${banned}`).not.toMatch(banned)
    }
  })

  it("a stray old-shape field cannot become the recorded source", () => {
    // Content from recentChange, a forged provenance naming energyShape.
    const forged = buildProposition({
      ...packInput("core_rhythm_recent_change_v1", "schedule"),
      sourceQuestionIds: ["core_signals_energy_shape_v1"],
      sourceValues: { core_signals_energy_shape_v1: ["steady"] },
    } as unknown as Parameters<typeof buildProposition>[0])
    expect(forged.ok).toBe(true)
    if (!forged.ok) return
    expect(forged.proposition.sources).toEqual([
      { questionId: "core_rhythm_recent_change_v1", value: "schedule" },
    ])
    expect(forged.proposition.sourceQuestionIds).not.toContain("core_signals_energy_shape_v1")
    expect(forged.proposition.templateId).toBe("rhythm.recentChange.schedule")
  })

  it("a value-level denial cannot be bypassed by declaring no provenance", () => {
    /*
     * THE TEST THAT MATTERS. No provenance argument is passed, because none
     * exists — and the rule still fires, because the value the words came
     * from is the value the rule is checked against.
     */
    expect(refusalOf(buildProposition(packInput("core_rhythm_recent_change_v1", "health-event")))).toBe(
      "value-silenced",
    )
  })

  it("the stronger authority names the refusal when both would decline", () => {
    // `health-event` is silenced in the permission registry AND null in the
    // pack. The registry's refusal is reported; the pack's would be weaker.
    const result = buildProposition(packInput("core_rhythm_recent_change_v1", "health-event"))
    expect(refusalOf(result)).not.toBe("content-silent")
  })

  /* ── No caller-authored provenance, of any shape ──────────────────── */

  /**
   * The fourth repair round's subject.
   *
   * Primary provenance was derived, but `additionalSources` let the caller
   * assert secondary provenance — the same invariant broken one field along.
   * It carried a fail-open too: `PropositionSource.value` allowed `null` and
   * value rules only ran where a value existed, so naming
   * `core_rhythm_recent_change_v1` with no value recorded it as contributing
   * while `health-event` went unchecked.
   *
   * These are behavioural, not only structural. A forged entry is not
   * "rejected" — it is never read, so it cannot appear however it is shaped.
   */
  it("the input declares no additionalSources field", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/proposition.ts"), "utf8")
    const input = source.slice(
      source.indexOf("export interface PropositionInput"),
      source.indexOf("/** The words and the gates"),
    )
    expect(input).not.toMatch(/^\s*additionalSources\??\s*:/m)
  })

  const forged = (extra: unknown) =>
    buildProposition({
      ...packInput("core_rhythm_recent_change_v1", "schedule"),
      additionalSources: extra,
    } as unknown as Parameters<typeof buildProposition>[0])

  const DERIVED = [{ questionId: "core_rhythm_recent_change_v1", value: "schedule" }]

  it("a forged null-valued secondary source cannot avoid a value rule", () => {
    /*
     * The exact attack the review named: name the question, give no value,
     * and the rule that would have silenced `health-event` never runs. It
     * cannot now, because the question is not a source at all.
     */
    const result = forged([{ questionId: "core_rhythm_recent_change_v1", value: null }])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sources).toEqual(DERIVED)
  })

  it("a forged valid-but-unrelated secondary source is not recorded", () => {
    // Rejecting null alone would have let this through: a real value from an
    // answer that did not produce or modify the sentence.
    const result = forged([{ questionId: "core_rhythm_week_shape_v1", value: "similar" }])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sources).toEqual(DERIVED)
    expect(result.proposition.sourceQuestionIds).not.toContain("core_rhythm_week_shape_v1")
  })

  it("a forged restatement cannot change the recorded value", () => {
    const result = forged([{ questionId: "core_rhythm_recent_change_v1", value: "caring" }])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sources).toEqual(DERIVED)
  })

  it("a forged silenced secondary source neither refuses nor appears", () => {
    // It is not read, so it neither poisons the proposition nor blocks it.
    const result = forged([{ questionId: "core_rhythm_recent_change_v1", value: "health-event" }])
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.proposition.sources).toEqual(DERIVED)
  })

  it("every route produces exactly one source", () => {
    const pack = buildProposition(packInput("core_rhythm_recent_change_v1", "schedule"))
    expect(pack.ok).toBe(true)
    if (!pack.ok) return
    const quote = buildQuotationProposition({ answer: "Fewer rushed mornings." })
    expect(quote.ok).toBe(true)
    if (!quote.ok) return
    const beat = buildProposition({
      id: "one.loop",
      kind: "loop-step",
      allowedUse: "descriptive-recap",
      target: "systemSnapshot",
      content: { from: "proposition", source: pack.proposition, templateIdSuffix: "loop.try" },
    })
    expect(beat.ok).toBe(true)
    if (!beat.ok) return
    for (const p of [pack.proposition, quote.proposition, beat.proposition]) {
      expect(p.sources, p.id).toHaveLength(1)
      expect(typeof p.sources[0].value, p.id).toBe("string")
    }
  })

  it("a re-framing carries the sources of the sentence it re-frames", () => {
    const lever = buildProposition(packInput("core_rhythm_recent_change_v1", "schedule"))
    expect(lever.ok).toBe(true)
    if (!lever.ok) return
    const beat = buildProposition({
      id: "bind.loop",
      kind: "loop-step",
      allowedUse: "descriptive-recap",
      target: "systemSnapshot",
      content: { from: "proposition", source: lever.proposition, templateIdSuffix: "loop.try" },
    })
    expect(beat.ok).toBe(true)
    if (!beat.ok) return
    expect(beat.proposition.sources).toEqual(lever.proposition.sources)
  })
})

/* ══ The quotation ═════════════════════════════════════════════════════════ */

/**
 * The structural route used to accept an allow-listed template id plus
 * ARBITRARY TEXT, with a caller-supplied kind, use, target and provenance.
 * The allow-list constrained the id and nothing else. It existed for one
 * sentence, so that sentence now has a constructor and the general route is
 * gone — which is why most of these assertions are about what CANNOT be said.
 */
describe("the quotation has one constructor and no arguments but the answer", () => {
  const ANSWER = "Fewer rushed mornings, and dinner not at nine."

  const built = () => {
    const result = buildQuotationProposition({ answer: ANSWER })
    expect(result.ok, result.ok ? "" : `refused: ${result.reason} — ${result.detail}`).toBe(true)
    if (!result.ok) throw new Error(result.reason)
    return result.proposition
  }

  it("its input carries exactly one field", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/proposition.ts"), "utf8")
    const signature = source.slice(
      source.indexOf("export function buildQuotationProposition"),
      source.indexOf("PropositionResult {", source.indexOf("export function buildQuotationProposition")),
    )
    expect(signature).toContain("answer: string")
    /*
     * Matched as FIELD DECLARATIONS with an optional `?`, not as substrings.
     * A first version banned the literal "text:" and a sabotage case walked
     * straight past it by adding `text?: string` — the optional marker is
     * exactly how a reopened escape would be written, since it has to keep
     * existing callers compiling.
     */
    for (const banned of ["templateId", "text", "kind", "target", "allowedUse", "sourceQuestionIds", "sources"]) {
      expect(
        signature,
        `the quotation input still accepts ${banned}`,
      ).not.toMatch(new RegExp(`\\b${banned}\\??\\s*:`))
    }
  })

  it("the general content union has no structural variant left", () => {
    const source = readFileSync(join(process.cwd(), "lib/report/deterministic/proposition.ts"), "utf8")
    // Exactly the union, not the internal declarations that follow it — the
    // quotation route legitimately names itself a few lines below, and a
    // guard that swept it up would be matching the thing it is guarding.
    const union = source.slice(
      source.indexOf("export type PropositionContent"),
      source.indexOf("The quotation route, reachable ONLY through"),
    )
    expect(union).not.toContain('from: "structural"')
    expect(union).not.toContain('from: "quotation"')
    expect(union).toContain('from: "content-pack"')
  })

  it("source, kind, use, target and template id are all fixed", () => {
    const p = built()
    expect(p.sources).toEqual([{ questionId: QUOTATION_QUESTION_ID, value: ANSWER }])
    expect(QUOTATION_QUESTION_ID).toBe("core_intentions_success_v1")
    expect(p.kind).toBe("quotation")
    expect(p.allowedUse).toBe("descriptive-recap")
    expect(p.target).toBe("systemSnapshot")
    expect(p.templateId).toBe(QUOTATION_TEMPLATE_ID)
    expect(p.requiredCapabilities).toEqual([])
  })

  it("the text is the reviewed lead-in plus the customer's own words, quoted", () => {
    const p = built()
    expect(p.text).toBe(`${STRUCTURAL_COPY.quotationLeadIn} “${ANSWER}”`)
    expect(p.text).toContain(ANSWER)
  })

  it("the words are derived from the supplied value, not supplied beside it", () => {
    // Change the answer and only the answer moves.
    const other = buildQuotationProposition({ answer: "Cooking more at home." })
    expect(other.ok).toBe(true)
    if (!other.ok) return
    expect(other.proposition.text).toContain("Cooking more at home.")
    expect(other.proposition.templateId).toBe(QUOTATION_TEMPLATE_ID)
    expect(other.proposition.sources[0].value).toBe("Cooking more at home.")
  })

  it("surrounding whitespace is trimmed, so the same answer is one sentence", () => {
    const a = buildQuotationProposition({ answer: `  ${ANSWER}  ` })
    expect(a.ok).toBe(true)
    if (!a.ok) return
    expect(a.proposition.text).toBe(built().text)
  })

  it("two calls with the same answer are identical", () => {
    expect(JSON.stringify(buildQuotationProposition({ answer: ANSWER }))).toBe(
      JSON.stringify(buildQuotationProposition({ answer: ANSWER })),
    )
  })

  it("an empty or whitespace-only answer refuses rather than quoting silence", () => {
    for (const answer of ["", "   ", "\n\t"]) {
      expect(refusalOf(buildQuotationProposition({ answer }))).toBe("quotation-empty")
    }
  })
})
