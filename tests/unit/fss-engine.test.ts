import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { resolveQuestionSetV1, scoredQuestions } from "@/lib/fss/questions/resolve"
import {
  computeFoodSystemScore,
  MINIMUM_DOMAIN_COMPLETENESS,
  INSUFFICIENT,
  EngineError,
  type Answers,
} from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
  resolveWeights,
  UnapprovedWeightsError,
} from "@/lib/fss/engine/weights"
import {
  FSS_V1_PROVENANCE,
  LEGACY_PROVENANCE,
  LEGACY_UNVERSIONED,
  isLegacyUnversioned,
} from "@/lib/fss/engine/provenance"
import {
  canCompare,
  canCompareDomains,
  COMPARABLE_DOMAIN_SCHEMAS,
  COMPARABLE_METHODS,
} from "@/lib/fss/engine/compare"
import { DOMAIN_SCHEMA_VERSION, FSS_DOMAINS } from "@/lib/fss/questions/domain-schema"

const SET = resolveQuestionSetV1()
const FIXTURE = nonProductionFixture("unit test")

const answerAll = (v: number): Answers =>
  Object.fromEntries(SET.questions.map((q) => [q.id, v]))

const score = (answers: Answers) =>
  computeFoodSystemScore({
    set: SET,
    answers,
    weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
    fixtureContext: FIXTURE,
  })

/* ══ Weights ═══════════════════════════════════════════════════════════════ */

describe("there are no approved weights, and no path that pretends otherwise", () => {
  it("scoring is impossible without an explicit non-production context", () => {
    expect(() =>
      computeFoodSystemScore({
        set: SET,
        answers: answerAll(2),
        weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
        // @ts-expect-error — the context is required; this is the accident being prevented
        fixtureContext: undefined,
      }),
    ).toThrow(UnapprovedWeightsError)
  })

  it("a plain object cannot masquerade as the fixture context", () => {
    expect(() =>
      // @ts-expect-error — deliberately the wrong shape
      resolveWeights(DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS, { __nonProductionFixture: true }),
    ).toThrow(UnapprovedWeightsError)
  })

  it("the fixture weights are named so they cannot be read as methodology", () => {
    const src = readFileSync("lib/fss/engine/weights.ts", "utf-8")
    expect(src).toContain("DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS")
    expect(src).toMatch(/NOT APPROVED METHODOLOGY/)
  })

  it("NO export of the weights module is named as approved, canonical or production", () => {
    /*
     * The assertion that keeps the refusal real. The easiest way for this gate
     * to be quietly undone is an `FSS_V1_WEIGHTS` or `APPROVED_WEIGHTS` export
     * appearing beside the fixture — at which point every caller uses it and
     * nobody notices a methodology decision was made by autocomplete.
     */
    const src = readFileSync("lib/fss/engine/weights.ts", "utf-8")
    const exported = [...src.matchAll(/export\s+(?:const|function|class|interface|type)\s+(\w+)/g)].map((m) => m[1])
    expect(exported.length).toBeGreaterThan(3)
    for (const name of exported) {
      expect(
        /^(APPROVED|CANONICAL|PRODUCTION|FSS_V1_WEIGHTS|DEFAULT_WEIGHTS)/i.test(name),
        `"${name}" reads as approved methodology, and none exists`,
      ).toBe(false)
    }
  })

  it("weights that do not sum to 1 are refused", () => {
    expect(() =>
      resolveWeights({ ...DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS, diversity: 0.9 }, FIXTURE),
    ).toThrow(UnapprovedWeightsError)
  })
})

/* ══ Provenance ════════════════════════════════════════════════════════════ */

describe("no score exists without provenance", () => {
  it("every result carries all five fields", () => {
    const result = score(answerAll(2))
    for (const key of [
      "fssMethodVersion",
      "assessmentVersion",
      "questionSetVersion",
      "calculationVersion",
      "interpretationVersion",
    ] as const) {
      expect(result.provenance[key], key).toBeTruthy()
    }
  })

  it("the provenance matches the question set that produced it", () => {
    const result = score(answerAll(2))
    expect(result.provenance.questionSetVersion).toBe(SET.questionSetVersion)
    expect(result.provenance.assessmentVersion).toBe(SET.assessmentVersion)
  })

  it("legacy-unversioned is a sentinel, not an empty value", () => {
    /*
     * A null or an empty string would be indistinguishable from "we forgot".
     * The honest state is "we cannot know", said in a form nothing mistakes
     * for a version number.
     */
    expect(LEGACY_UNVERSIONED).toBe("legacy-unversioned")
    expect(isLegacyUnversioned(LEGACY_PROVENANCE)).toBe(true)
    expect(isLegacyUnversioned(FSS_V1_PROVENANCE)).toBe(false)
  })
})

/* ══ The arithmetic ════════════════════════════════════════════════════════ */

describe("the candidate arithmetic", () => {
  it("scores a full sheet of 3s at 100", () => {
    const r = score(answerAll(3))
    expect(r.state).toBe("scored")
    expect(r.score).toBe(100)
  })

  it("HAS NO FLOOR — a full sheet of 0s scores 0, not 20", () => {
    /*
     * The defect this removes: today's model applies Math.max(n, 20), so a
     * 0–100 dial has an unreachable bottom fifth and every score ever issued
     * overstates the low end.
     */
    const r = score(answerAll(0))
    expect(r.state).toBe("scored")
    expect(r.score).toBe(0)
  })

  it("scores a full sheet of 2s at 67", () => {
    expect(score(answerAll(2)).score).toBe(67)
  })

  it("reports every domain", () => {
    const r = score(answerAll(2))
    expect(r.domains.map((d) => d.domain).sort()).toEqual([
      "diversity",
      "fermentedFoods",
      "foodQuality",
      "mealRhythm",
      "plantsAndFibre",
    ])
  })

  it("always reports completeness", () => {
    expect(score(answerAll(2)).completeness).toBe(1)
  })
})

describe("THE BIOTICS ARE NOT IN THE FUNCTION", () => {
  it("the engine source names no Biotic", () => {
    /*
     * Asserted as an absence, because that absence IS the architecture. A
     * Biotic appearing as a weighting bucket would be the old model returning
     * under new names.
     */
    const src = readFileSync("lib/fss/engine/score.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
    for (const biotic of ["prebiotic", "probiotic", "postbiotic", "feed", "seed", "heal"]) {
      expect(new RegExp(`\\b${biotic}`, "i").test(src), `engine references "${biotic}"`).toBe(false)
    }
  })
})

/* ══ The unscored layers ═══════════════════════════════════════════════════ */

describe("What You Notice and Your Food Context reach the Score by no path", () => {
  const unscoredIds = SET.questions
    .filter((q) => q.contributes !== "fss")
    .map((q) => q.id)

  it("there are unscored items to test", () => {
    expect(unscoredIds.length).toBe(7)
  })

  it("changing every unscored answer does not move the Score by one point", () => {
    const base = Object.fromEntries(scoredQuestions(SET).map((q) => [q.id, 2])) as Answers
    const withNoticeLow = { ...base, ...Object.fromEntries(unscoredIds.map((id) => [id, 0])) }
    const withNoticeHigh = { ...base, ...Object.fromEntries(unscoredIds.map((id) => [id, 3])) }
    expect(score(withNoticeLow).score).toBe(score(withNoticeHigh).score)
  })

  it("the engine throws if an unscored item ever reaches the arithmetic", () => {
    const poisoned = {
      ...SET,
      questions: SET.questions.map((q) =>
        q.id === "fc1" ? { ...q, contributes: "fss" as const, domain: undefined } : q,
      ),
    }
    expect(() =>
      computeFoodSystemScore({
        set: poisoned,
        answers: answerAll(2),
        weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
        fixtureContext: FIXTURE,
      }),
    ).toThrow(EngineError)
  })
})

/* ══ Missing data ══════════════════════════════════════════════════════════ */

describe("missing data withholds rather than zeroes", () => {
  it("a sparse domain is insufficient, not 0", () => {
    const scored = scoredQuestions(SET)
    const diversity = scored.filter((q) => q.domain === "diversity").map((q) => q.id)
    const answers: Answers = Object.fromEntries(
      scored.map((q) => [q.id, diversity.includes(q.id) ? undefined : 2]),
    )
    const r = computeFoodSystemScore({
      set: SET, answers, weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS, fixtureContext: FIXTURE,
    })
    const d = r.domains.find((x) => x.domain === "diversity")!
    expect(d.state).toBe(INSUFFICIENT)
    expect(d).not.toHaveProperty("score")
  })

  it("ANY insufficient domain withholds the whole Score, and it is not a zero", () => {
    const scored = scoredQuestions(SET)
    const answers: Answers = Object.fromEntries(
      scored.map((q, i) => [q.id, q.domain === "mealRhythm" && i % 2 === 0 ? undefined : 2]),
    )
    const r = computeFoodSystemScore({
      set: SET, answers, weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS, fixtureContext: FIXTURE,
    })
    // Asserted unconditionally. Wrapping these in `if (r.state === "withheld")`
    // would pass silently on the very regression the test exists to catch.
    expect(r.state).toBe("withheld")
    expect(r.score).toBeUndefined()
    expect(r.withheldBecause).toContain("mealRhythm")
  })

  it("an empty sheet withholds and reports zero completeness", () => {
    const r = computeFoodSystemScore({
      set: SET, answers: {}, weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS, fixtureContext: FIXTURE,
    })
    expect(r.state).toBe("withheld")
    expect(r.score).toBeUndefined()
    expect(r.completeness).toBe(0)
  })

  it("the completeness threshold is declared, not magic", () => {
    expect(MINIMUM_DOMAIN_COMPLETENESS).toBe(0.6)
  })
})

/* ══ Comparison ════════════════════════════════════════════════════════════ */

describe("comparison refuses by default", () => {
  it("the allowlist is empty, and that is correct", () => {
    expect(COMPARABLE_METHODS).toEqual([])
  })

  it("two scores from the same method are comparable", () => {
    expect(canCompare(FSS_V1_PROVENANCE, FSS_V1_PROVENANCE)).toEqual({
      comparable: true,
      via: "same-method",
    })
  })

  it("a legacy score is comparable with NOTHING — including another legacy score", () => {
    expect(canCompare(LEGACY_PROVENANCE, FSS_V1_PROVENANCE).comparable).toBe(false)
    expect(canCompare(LEGACY_PROVENANCE, LEGACY_PROVENANCE).comparable).toBe(false)
  })

  it("different methods refuse, and say what to do instead", () => {
    const v = canCompare(FSS_V1_PROVENANCE, { ...FSS_V1_PROVENANCE, fssMethodVersion: "fss-v2.0" })
    expect(v.comparable).toBe(false)
    if (!v.comparable) {
      expect(v.because).toBe("different-method")
      expect(v.explain).toMatch(/Show both, labelled/)
    }
  })

  it("a method version that lies about its instrument refuses too", () => {
    const v = canCompare(FSS_V1_PROVENANCE, { ...FSS_V1_PROVENANCE, questionSetVersion: "questions-v1.1" })
    expect(v.comparable).toBe(false)
    if (!v.comparable) expect(v.because).toBe("different-question-set")
  })

  it("NON-VACUITY: nothing returns comparable for a legacy pair", () => {
    for (const other of [FSS_V1_PROVENANCE, LEGACY_PROVENANCE, { ...FSS_V1_PROVENANCE, fssMethodVersion: "x" }]) {
      expect(canCompare(LEGACY_PROVENANCE, other).comparable).toBe(false)
    }
  })
})

/* ══ The domain schema — the fifth comparability axis ══════════════════════
   Gate 5 step 2a. The question this answers is NOT the one `canCompare`
   answers, and the whole point is that the two can disagree:

     > Do not assume that because the overall FSS is comparable, every nested
     > construct is automatically comparable.

   A domain can be renamed, split or recomposed while the method version, the
   calculation and the wording all stay still — and a per-domain delta across
   that change looks perfectly well-formed while describing two different
   things under one name.
   ═══════════════════════════════════════════════════════════════════════════ */

describe("the domain schema is a version, and it is pinned", () => {
  it("the version is the one records were written under", () => {
    expect(DOMAIN_SCHEMA_VERSION).toBe("domains-v1.0")
  })

  it("the five, by value and in order", () => {
    expect(FSS_DOMAINS).toEqual([
      "diversity",
      "plantsAndFibre",
      "fermentedFoods",
      "foodQuality",
      "mealRhythm",
    ])
  })

  /*
   * THE LOAD-BEARING TEST OF STEP 2A.
   *
   * `domain-schema.ts` already fails `tsc` if the union and the list diverge.
   * That is not enough on its own: the sabotage harness runs vitest, and a
   * widened TYPE is invisible to vitest — the exact gap that let four Gate 4
   * mutations through. So this reads the union from SOURCE and compares it to
   * the value, which makes the divergence a test failure as well as a build
   * failure.
   *
   * IF THIS FAILS: the scored domains moved. That is a methodology change, and
   * a per-domain comparison across it is meaningless under an unchanged
   * `fssMethodVersion`. Move `DOMAIN_SCHEMA_VERSION` — do not edit this list to
   * match. Every score already written stays on the old version, and
   * `canCompareDomains` refuses the pair, which is the correct outcome.
   */
  it("the union in SOURCE and the list are the same set", () => {
    const src = readFileSync("lib/fss/questions/types.ts", "utf8")
    const block = /export type FssDomain =([\s\S]*?)\n\n/.exec(src)
    expect(block).not.toBeNull()
    const inSource = [...(block?.[1] ?? "").matchAll(/"([a-zA-Z]+)"/g)].map((m) => m[1])

    expect(inSource.length).toBeGreaterThan(0)
    expect([...inSource].sort()).toEqual([...FSS_DOMAINS].sort())
  })
})

describe("domain comparability is asked separately, and refuses by default", () => {
  const V1 = DOMAIN_SCHEMA_VERSION

  it("the allowlist is empty, and that is correct", () => {
    expect(COMPARABLE_DOMAIN_SCHEMAS).toEqual([])
  })

  it("the same schema compares, and says which question it answered", () => {
    expect(canCompareDomains(V1, V1)).toEqual({ comparable: true, via: "same-domain-schema" })
  })

  it("a different schema refuses, and says the score may still compare", () => {
    const v = canCompareDomains(V1, "domains-v2.0")
    expect(v.comparable).toBe(false)
    if (!v.comparable) {
      expect(v.because).toBe("different-domain-schema")
      expect(v.explain).toMatch(/overall score may still be comparable/)
    }
  })

  /*
   * The records that most need refusing are the ones that predate the field.
   * Two of them are EQUAL — both absent — so an implementation that checked
   * equality first would let exactly that pair through. Asserted on both
   * sides and on the pair, because one-sided would pass a short-circuit.
   */
  it("an ABSENT schema refuses, including against another absent one", () => {
    for (const pair of [["", V1], [V1, ""], ["", ""]] as const) {
      const v = canCompareDomains(pair[0], pair[1])
      expect(v.comparable).toBe(false)
      if (!v.comparable) expect(v.because).toBe("different-domain-schema")
    }
  })

  /*
   * A version this code has never heard of is still comparable WITH ITSELF.
   *
   * Two scores written under domains-v9 share a composition, so comparing them
   * is sound; whether today's reviewed copy can NAME their domains is a
   * different question with a different answer, and it belongs to whatever
   * renders the result. Collapsing the two here would refuse a sound
   * comparison for a presentation reason — so this test exists to stop a
   * future `isCurrentDomainSchema` check being added to the equality path.
   */
  it("an unrecognised schema compares with itself, and not with another", () => {
    expect(canCompareDomains("domains-v9.0", "domains-v9.0").comparable).toBe(true)
    expect(canCompareDomains("domains-v9.0", V1).comparable).toBe(false)
  })

  it("NON-VACUITY: nothing returns comparable across two different schemas", () => {
    for (const other of ["", V1, "domains-v3.0", "domains-v1.1"]) {
      if (other === "domains-v2.0") continue
      expect(canCompareDomains("domains-v2.0", other).comparable).toBe(false)
    }
  })

  /*
   * The two axes are independent, which is the counterfactual this step was
   * built for: the score may still compare while the domains do not.
   */
  it("the score verdict and the domain verdict can DISAGREE", () => {
    expect(canCompare(FSS_V1_PROVENANCE, FSS_V1_PROVENANCE).comparable).toBe(true)
    expect(canCompareDomains(DOMAIN_SCHEMA_VERSION, "domains-v2.0").comparable).toBe(false)
  })
})
