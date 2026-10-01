/**
 * Your Food Context, and the reviewed recommendation catalogue.
 *
 * ══ THE TWO INVARIANTS THIS FILE EXISTS FOR ═════════════════════════════════
 *
 * 1. CONTEXT SHAPES THE PLAN AND CANNOT TOUCH THE SCORE. Proven by computing a
 *    score twice over identical scored answers and OPPOSITE Food Context
 *    answers, and requiring the two results to be byte-identical. The engine
 *    enforces this structurally; this proves it end to end through the layer
 *    that actually reads those answers.
 *
 * 2. THE MOST CONSTRAINED PERSON STILL GETS A PLAN. Every domain carries at
 *    least one recommendation per horizon that asks nothing of anybody's time,
 *    money, access or kitchen. A product that goes quiet on exactly the people
 *    with the fewest options would be the worst failure this layer could have,
 *    so it is a checked invariant rather than an intention.
 *
 * Plus the one the repository learned the hard way: every authored entry must
 * be REACHABLE. `lib/report/food-swaps.ts` records twenty of twenty-five swaps
 * being unreachable for one hundred percent of reports because a key did not
 * match a map. Content nothing can select is worse than no content, because it
 * looks like coverage.
 */
import { describe, it, expect } from "vitest"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import {
  computeFoodSystemScore,
  type Answers,
} from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import { COMPARISON_LANGUAGE } from "@/lib/fss/engine/compare"
import { CONTEXT_ITEMS, isOfferable, readFoodContext } from "@/lib/fss/action/context"
import {
  ACTION_CATALOGUE,
  REASSESSMENT,
  THIRTY_DAY_FOCUS,
} from "@/lib/fss/action/catalogue"
import { ACTION_CATEGORY_ORDER } from "@/lib/fss/action/categories"
import { resolvePriorities } from "@/lib/fss/action/priority"
import type { ActionCategory, ContextConstraint, ReportedContext } from "@/lib/fss/action/types"
import type { FssDomain } from "@/lib/fss/questions/types"

const SET = resolveQuestionSetV1()
const FIXTURE = nonProductionFixture("unit test")

const DOMAINS: FssDomain[] = [
  "diversity",
  "plantsAndFibre",
  "fermentedFoods",
  "foodQuality",
  "mealRhythm",
]

const scoreOf = (answers: Answers) =>
  computeFoodSystemScore({
    set: SET,
    answers,
    weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
    fixtureContext: FIXTURE,
  })

/** Every scored item at `base`, every Food Context item at `fc`. */
function answers(base: number, fc: number | undefined): Answers {
  const out: Record<string, number> = {}
  for (const q of SET.questions) {
    if (q.contributes === "food-context") {
      if (fc !== undefined) out[q.id] = fc
    } else {
      out[q.id] = base
    }
  }
  return out
}

const permissive = (): ReportedContext => readFoodContext(SET, answers(2, 3))
const maximallyConstrained = (): ReportedContext => readFoodContext(SET, answers(2, 0))

describe("the Food Context items are the ones this module thinks they are", () => {
  it("each named id exists and still contributes food-context", () => {
    const byId = new Map(SET.questions.map((q) => [q.id, q]))
    for (const [constraint, id] of Object.entries(CONTEXT_ITEMS)) {
      const q = byId.get(id)
      expect(q, `${constraint} names ${id}, which is not in the instrument`).toBeDefined()
      expect(q!.contributes, `${id} must be unscored`).toBe("food-context")
      expect(q!.part).toBe("your-food-context")
    }
  })

  it("covers all four constraints, with no id used twice", () => {
    const ids = Object.values(CONTEXT_ITEMS)
    expect(Object.keys(CONTEXT_ITEMS).sort()).toEqual(["access", "cost", "kitchen", "time"])
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("reading the context back", () => {
  it("0 and 1 are limiting; 2 is workable; 3 is free", () => {
    expect(readFoodContext(SET, answers(2, 0)).states.time).toBe("limiting")
    expect(readFoodContext(SET, answers(2, 1)).states.time).toBe("limiting")
    expect(readFoodContext(SET, answers(2, 2)).states.time).toBe("workable")
    expect(readFoodContext(SET, answers(2, 3)).states.time).toBe("free")
  })

  it("lists the limiting constraints, sorted so it renders identically", () => {
    const c = maximallyConstrained()
    expect(c.limiting).toEqual(["access", "cost", "kitchen", "time"])
    expect(permissive().limiting).toEqual([])
  })

  /*
   * The tempting cautious answer is to treat an unanswered item as limiting.
   * It is wrong: it would make the plan THINNER for the people who skipped the
   * section, when the section exists to make the plan better. Filtering on an
   * absence is filtering on nothing.
   */
  it("an unanswered item does not filter anything, and is not read as 'no constraint'", () => {
    const skipped = readFoodContext(SET, answers(2, undefined))
    expect(skipped.answered, "Part 4 was skipped, and that is distinguishable").toBe(false)
    expect(skipped.limiting).toEqual([])
    for (const c of Object.keys(CONTEXT_ITEMS) as ContextConstraint[]) {
      expect(skipped.states[c]).toBe("workable")
      expect(isOfferable([c], skipped), "nothing should be withheld on an absence").toBe(true)
    }
    // And answering any one of them flips the flag.
    expect(readFoodContext(SET, answers(2, 2)).answered).toBe(true)
  })

  it("isOfferable withholds only what the person said was in the way", () => {
    const c = readFoodContext(SET, { ...answers(2, 3), [CONTEXT_ITEMS.time]: 0 })
    expect(isOfferable([], c)).toBe(true)
    expect(isOfferable(["cost"], c)).toBe(true)
    expect(isOfferable(["time"], c)).toBe(false)
    expect(isOfferable(["time", "cost"], c)).toBe(false)
  })
})

describe("Your Food Context cannot reach the Score", () => {
  /*
   * The promise this keeps is on screen already: candidate-result.tsx tells
   * the person "What they change is what we would suggest, not what you are
   * worth." Both halves are asserted — the suggestion changes, the score does
   * not.
   */
  it("opposite context answers produce a byte-identical score", () => {
    const free = scoreOf(answers(2, 3))
    const constrained = scoreOf(answers(2, 0))
    const skipped = scoreOf(answers(2, undefined))

    expect(JSON.stringify(constrained)).toBe(JSON.stringify(free))
    expect(JSON.stringify(skipped)).toBe(JSON.stringify(free))
    expect(free.state).toBe("scored")
    expect(free.score).toBeGreaterThan(0)
  })

  it("and identical priorities, since those are derived from the score", () => {
    const a = resolvePriorities({ score: scoreOf(answers(2, 3)), set: SET, answers: answers(2, 3) })
    const b = resolvePriorities({ score: scoreOf(answers(2, 0)), set: SET, answers: answers(2, 0) })
    expect(JSON.stringify(b)).toBe(JSON.stringify(a))
  })

  it("but the offerable set DOES change — the filter is not decorative", () => {
    const free = permissive()
    const constrained = maximallyConstrained()
    const offerable = (c: ReportedContext) =>
      ACTION_CATALOGUE.filter((e) => isOfferable(e.requires, c)).map((e) => e.id)

    expect(offerable(free).length).toBe(ACTION_CATALOGUE.length)
    expect(
      offerable(constrained).length,
      "a maximally constrained person must be offered strictly fewer actions",
    ).toBeLessThan(offerable(free).length)
  })

  it("a scored answer cannot influence a constraint, even if one is passed", () => {
    /*
     * The module resolves each id through the instrument and checks
     * `contributes` before trusting it, so the crossing the architecture
     * forbids — reading an input to the Score in order to shape the plan —
     * degrades to "unknown" rather than happening quietly.
     *
     * Behavioural, not a source grep: what matters is that q1's value does not
     * move a constraint, whatever the implementation looks like.
     */
    const withScoredAnswer = readFoodContext(SET, { ...answers(2, 3), q1: 0 })
    expect(withScoredAnswer.states.time).toBe("free")
    expect(withScoredAnswer.limiting).toEqual([])

    // And the proof that it is reading the Food Context at all: changing the
    // Food Context answer DOES move it.
    expect(readFoodContext(SET, answers(2, 0)).states.time).toBe("limiting")
  })
})

describe("the catalogue is well formed", () => {
  it("has entries, with unique ids", () => {
    expect(ACTION_CATALOGUE.length).toBeGreaterThanOrEqual(16)
    const ids = ACTION_CATALOGUE.map((e) => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("every entry names a real domain, category, horizon and claim class", () => {
    for (const e of ACTION_CATALOGUE) {
      expect(DOMAINS, `${e.id} names an unknown domain`).toContain(e.domain)
      expect(ACTION_CATEGORY_ORDER, `${e.id} names an unknown category`).toContain(e.category)
      expect(["today", "this-week"], `${e.id} names an unexpected horizon`).toContain(e.timeHorizon)
      expect(
        ["observed-behaviour", "self-reported", "general-education", "personalised-recommendation"],
        `${e.id} names an unknown claim class`,
      ).toContain(e.claimClass)
      for (const r of e.requires) {
        expect(["time", "cost", "access", "kitchen"], `${e.id} requires something unknown`).toContain(r)
      }
    }
  })

  it("NO entry claims the thirty-day horizon — a month is a focus, not a list", () => {
    for (const e of ACTION_CATALOGUE) {
      expect(e.timeHorizon, `${e.id} would make the month a fourth list of tips`).not.toBe(
        "thirty-days",
      )
    }
    // The month's content lives here instead, one behaviour per domain.
    expect(Object.keys(THIRTY_DAY_FOCUS).sort()).toEqual([...DOMAINS].sort())
    for (const d of DOMAINS) {
      expect(THIRTY_DAY_FOCUS[d].behaviour.length).toBeGreaterThan(30)
      expect(THIRTY_DAY_FOCUS[d].whyThisOne.length).toBeGreaterThan(30)
    }
  })

  it("every domain offers something in every horizon it offers at all", () => {
    for (const d of DOMAINS) {
      const mine = ACTION_CATALOGUE.filter((e) => e.domain === d)
      expect(mine.length, `${d} has no recommendations`).toBeGreaterThanOrEqual(3)
      expect(
        mine.some((e) => e.timeHorizon === "today"),
        `${d} offers nothing for Today`,
      ).toBe(true)
      expect(
        mine.some((e) => e.timeHorizon === "this-week"),
        `${d} offers nothing for This Week`,
      ).toBe(true)
    }
  })
})

describe("the most constrained person still gets a plan", () => {
  it("every domain has an unconditional option in every horizon", () => {
    for (const d of DOMAINS) {
      for (const h of ["today", "this-week"] as const) {
        const unconditional = ACTION_CATALOGUE.filter(
          (e) => e.domain === d && e.timeHorizon === h && e.requires.length === 0,
        )
        expect(
          unconditional.length,
          `${d}/${h} has no recommendation that asks nothing of the person — a maximally constrained walk would go silent here`,
        ).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it("so the maximally constrained context still reaches every domain", () => {
    const c = maximallyConstrained()
    for (const d of DOMAINS) {
      const offerable = ACTION_CATALOGUE.filter(
        (e) => e.domain === d && isOfferable(e.requires, c),
      )
      expect(offerable.length, `${d} offers nothing to a fully constrained person`).toBeGreaterThan(0)
    }
  })

  it("NON-VACUITY: removing the unconditional options would be caught", () => {
    // Exactly the sabotage: strip the requires:[] entries and the fully
    // constrained person is left with nothing in at least one domain.
    const stripped = ACTION_CATALOGUE.filter((e) => e.requires.length > 0)
    const c = maximallyConstrained()
    const starved = DOMAINS.filter(
      (d) => stripped.filter((e) => e.domain === d && isOfferable(e.requires, c)).length === 0,
    )
    expect(starved.length, "the invariant must be load-bearing").toBeGreaterThan(0)
  })
})

describe("no priority is padded to fill a category", () => {
  /*
   * "Do not force every priority to generate one action in every category."
   * Forcing three would mean inventing one, and an invented action is what a
   * structured recommendation exists to make impossible.
   */
  const categoriesFor = (d: FssDomain) =>
    new Set(ACTION_CATALOGUE.filter((e) => e.domain === d).map((e) => e.category))

  it("at least one domain genuinely offers fewer than all three", () => {
    const incomplete = DOMAINS.filter((d) => categoriesFor(d).size < ACTION_CATEGORY_ORDER.length)
    expect(
      incomplete.length,
      "if every domain covered all three, this rule would be passing vacuously",
    ).toBeGreaterThan(0)
  })

  it("the gaps are the ones the catalogue documents", () => {
    // Recorded by value so a later addition is a deliberate decision rather
    // than a quiet drift towards padding.
    const shape = Object.fromEntries(
      DOMAINS.map((d) => [d, [...categoriesFor(d)].sort()]),
    ) as Record<FssDomain, ActionCategory[]>

    expect(shape).toEqual({
      diversity: ["feed"],
      plantsAndFibre: ["feed"],
      fermentedFoods: ["seed"],
      foodQuality: ["feed", "rejuvenate"],
      mealRhythm: ["rejuvenate"],
    })
  })

  it("but all three categories are used somewhere, so none is dead", () => {
    const used = new Set(ACTION_CATALOGUE.map((e) => e.category))
    expect([...used].sort()).toEqual([...ACTION_CATEGORY_ORDER].sort())
  })
})

describe("every authored entry is reachable", () => {
  /*
   * The food-swaps lesson. For each entry there must exist an answer set that
   * makes its domain a priority, and a context in which it is offerable.
   */
  function answersWithLowDomain(domain: FssDomain, fc: number): Answers {
    const out: Record<string, number> = {}
    for (const q of SET.questions) {
      if (q.contributes === "food-context") out[q.id] = fc
      else if (q.contributes === "fss" && q.domain === domain) out[q.id] = 0
      else out[q.id] = 3
    }
    return out
  }

  it("each one has an answer set that makes its domain the priority", () => {
    for (const e of ACTION_CATALOGUE) {
      const a = answersWithLowDomain(e.domain, 3)
      const priorities = resolvePriorities({ score: scoreOf(a), set: SET, answers: a })
      expect(
        priorities.map((p) => p.sourceDomain),
        `nothing can make ${e.domain} a priority, so ${e.id} is unreachable`,
      ).toContain(e.domain)
    }
  })

  it("and a context in which it is offerable", () => {
    const free = permissive()
    for (const e of ACTION_CATALOGUE) {
      expect(isOfferable(e.requires, free), `${e.id} is offerable to nobody`).toBe(true)
    }
  })
})

describe("the reassessment point states a rule rather than computing one", () => {
  it("delegates comparability to the Gate 2 primitive", () => {
    expect(REASSESSMENT.afterDays).toBe(30)
    expect(
      REASSESSMENT.comparabilityRule,
      "the rule must come from compare.ts, not be restated here",
    ).toBe(COMPARISON_LANGUAGE.methodChanged)
  })

  it("compares reported behaviour, and says so", () => {
    expect(REASSESSMENT.whatItCompares).toMatch(/reported food patterns/i)
    expect(REASSESSMENT.whatItCompares).toMatch(/not biology/i)
  })
})
