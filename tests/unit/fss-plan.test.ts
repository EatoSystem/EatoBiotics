/**
 * Your Plan — the horizons, and the things they must never do.
 *
 * ══ WHAT IS BEING PROVEN ════════════════════════════════════════════════════
 *
 *   Today        EXACTLY ONE action for the whole plan, never one per priority
 *   This Week    a small set, capped — not a long generic list
 *   30 Days      one behaviour and a reassessment point, never a fourth list
 *
 *   · the plan is deterministic, with no clock and no randomness;
 *   · Food Context changes the plan and cannot change the score;
 *   · no longer horizon is implemented;
 *   · AI touches none of it;
 *   · every recommendation carries its claim boundary and both versions.
 */
import { describe, it, expect } from "vitest"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import { computeFoodSystemScore, type Answers } from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import { FSS_V1_PROVENANCE, LEGACY_PROVENANCE } from "@/lib/fss/engine/provenance"
import { buildPlan } from "@/lib/fss/action/plan"
import { ACTION_CATALOGUE, THIRTY_DAY_FOCUS } from "@/lib/fss/action/catalogue"
import { CONTEXT_ITEMS } from "@/lib/fss/action/context"
import { ACTION_SET_VERSION, THIS_WEEK_MAX } from "@/lib/fss/action/types"
import { TIME_HORIZONS } from "@/lib/fss/action/horizons"
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

const planFor = (answers: Answers) => buildPlan({ score: scoreOf(answers), set: SET, answers })

/** One domain at 0, the rest at 3, Food Context at `fc`. */
function lowDomain(domain: FssDomain, fc = 3): Answers {
  const out: Record<string, number> = {}
  for (const q of SET.questions) {
    if (q.contributes === "food-context") out[q.id] = fc
    else if (q.contributes === "fss" && q.domain === domain) out[q.id] = 0
    else out[q.id] = 3
  }
  return out
}

/** Everything the same — all five domains tie, so three priorities. */
function allTied(v = 2, fc = 3): Answers {
  const out: Record<string, number> = {}
  for (const q of SET.questions) out[q.id] = q.contributes === "food-context" ? fc : v
  return out
}

describe("Today is one action for the whole plan", () => {
  it("one priority gives exactly one action for today", () => {
    const plan = planFor(lowDomain("fermentedFoods"))
    expect(plan.priorities).toHaveLength(1)
    expect(plan.today).not.toBeNull()
    expect(plan.today!.timeHorizon).toBe("today")
    expect(plan.today!.sourceDomain).toBe("fermentedFoods")
  })

  it("THREE priorities STILL give exactly one action for today", () => {
    /*
     * The failure this prevents: one today-action per priority. A plan that
     * opens with three things to do today has not prioritised anything, which
     * is the behaviour this whole layer replaces.
     */
    const plan = planFor(allTied())
    expect(plan.priorities).toHaveLength(3)
    expect(plan.today, "today must be a single recommendation, not a list").not.toBeNull()
    expect(Array.isArray(plan.today)).toBe(false)
  })

  it("it comes from the first priority", () => {
    const plan = planFor(allTied())
    expect(plan.today!.priorityId).toBe(plan.priorities[0].id)
  })

  it("and the cadence is a single occasion, not a duration", () => {
    const plan = planFor(lowDomain("diversity"))
    expect(plan.today!.suggestedFrequency).toMatch(/today/i)
    expect(TIME_HORIZONS.today.cadence).toMatch(/once/i)
  })
})

describe("This Week is a small set, not a list", () => {
  it("is capped, and the cap is a LITERAL three", () => {
    /*
     * Asserting against THIS_WEEK_MAX alone is a tautology: raising the
     * constant would raise the bound the test checks, and the plan could grow
     * into the long list this layer exists to replace while the suite stayed
     * green. Sabotage case 1048 is exactly that mutation.
     *
     * So the literal is here, and `fss-action-model.test.ts` separately pins
     * THIS_WEEK_MAX to 3 — two assertions, because "small set" is a product
     * decision and a number nobody can quietly change.
     */
    expect(THIS_WEEK_MAX).toBe(3)
    for (const answers of [lowDomain("diversity"), lowDomain("mealRhythm"), allTied()]) {
      const plan = planFor(answers)
      expect(plan.thisWeek.length, "the weekly set has become a list").toBeLessThanOrEqual(3)
      expect(plan.thisWeek.length).toBeGreaterThan(0)
    }
  })

  it("every entry is a this-week entry", () => {
    const plan = planFor(lowDomain("plantsAndFibre"))
    for (const r of plan.thisWeek) expect(r.timeHorizon).toBe("this-week")
  })

  /*
   * With three tied priorities, filling from the first would present a plan
   * about one domain while claiming three mattered equally. Round-robin gives
   * each its first action before any gets a second.
   */
  it("three priorities each get represented before any gets a second", () => {
    const plan = planFor(allTied())
    /*
     * Checking the ENTRY's own domain, not just the priority it is bound to.
     *
     * The first version of this test read `sourceDomain`, which is copied from
     * the priority — so a mutation that served three diversity actions under
     * three different priorities passed it. The entries were all from one
     * domain and the labels said otherwise, which is a worse bug than the one
     * the test was aimed at. Both are now asserted.
     */
    expect(
      new Set(plan.thisWeek.map((r) => r.domain)).size,
      "the weekly set must draw from different domains, not just label them so",
    ).toBe(Math.min(THIS_WEEK_MAX, plan.priorities.length))
    expect(new Set(plan.thisWeek.map((r) => r.sourceDomain)).size).toBe(
      Math.min(THIS_WEEK_MAX, plan.priorities.length),
    )
  })

  it("INTEGRITY: a recommendation is about the domain it claims to be about", () => {
    /*
     * `domain` comes from the reviewed catalogue entry; `sourceDomain` comes
     * from the priority it was bound to. If they can disagree, a person is
     * being shown advice about one domain under the heading of another — and
     * the structured reason, which is the whole point of this layer, becomes a
     * lie that validates.
     */
    for (const answers of [allTied(), lowDomain("mealRhythm"), lowDomain("foodQuality", 0)]) {
      const plan = planFor(answers)
      for (const r of [plan.today, ...plan.thisWeek].filter((x) => x !== null)) {
        expect(
          r!.domain,
          `${r!.id} is a ${r!.domain} action bound to a ${r!.sourceDomain} priority`,
        ).toBe(r!.sourceDomain)
      }
      if (plan.thirtyDays) {
        const p = plan.priorities.find((x) => x.id === plan.thirtyDays!.sourcePriorityId)
        expect(p!.sourceDomain).toBe(plan.thirtyDays.sourceDomain)
      }
    }
  })

  it("one priority is allowed depth instead", () => {
    const plan = planFor(lowDomain("fermentedFoods"))
    expect(new Set(plan.thisWeek.map((r) => r.sourceDomain))).toEqual(
      new Set(["fermentedFoods"]),
    )
    expect(plan.thisWeek.length).toBeGreaterThan(1)
  })

  it("no recommendation appears twice", () => {
    const plan = planFor(allTied())
    const ids = [plan.today!.id, ...plan.thisWeek.map((r) => r.id)]
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe("30 Days is a behavioural focus and a reassessment point", () => {
  it("is one behaviour, not a list", () => {
    const plan = planFor(lowDomain("mealRhythm"))
    expect(plan.thirtyDays).not.toBeNull()
    expect(Array.isArray(plan.thirtyDays)).toBe(false)
    expect(plan.thirtyDays!.behaviour).toBe(THIRTY_DAY_FOCUS.mealRhythm.behaviour)
    expect(plan.thirtyDays!.sourceDomain).toBe("mealRhythm")
  })

  it("takes the first priority, because a month holding three things holds none", () => {
    const plan = planFor(allTied())
    expect(plan.thirtyDays!.sourcePriorityId).toBe(plan.priorities[0].id)
  })

  it("names a reassessment point and the comparability rule, computing neither", () => {
    const plan = planFor(lowDomain("diversity"))
    expect(plan.thirtyDays!.reassessment.afterDays).toBe(30)
    expect(plan.thirtyDays!.reassessment.comparabilityRule.length).toBeGreaterThan(20)
    // No trend, no projection, no comparison performed anywhere in the plan.
    expect(JSON.stringify(plan)).not.toMatch(/trend|projection|forecast/i)
  })

  it("NO longer horizon is implemented", () => {
    const plan = planFor(allTied())
    const json = JSON.stringify(plan)
    for (const bad of ["ninety", "90-day", "90 days", "one-year", "12 months", "sixty days"]) {
      expect(json, `the plan mentions ${bad}`).not.toContain(bad)
    }
    // The three horizons are the only ones with content.
    expect(Object.keys(TIME_HORIZONS)).toHaveLength(3)
  })
})

describe("the plan is deterministic", () => {
  it("the same answers give a byte-identical plan, repeatedly", () => {
    const answers = allTied()
    const runs = [1, 2, 3, 4, 5].map(() => planFor(answers))
    for (const r of runs) expect(JSON.stringify(r)).toBe(JSON.stringify(runs[0]))
  })

  it("carries no timestamp, so two runs can be compared directly", () => {
    const json = JSON.stringify(planFor(lowDomain("diversity")))
    expect(json, "a clock would make the plan the one thing that cannot be diffed").not.toMatch(
      /createdAt|generatedAt|\d{4}-\d{2}-\d{2}T/,
    )
  })
})

describe("Your Food Context changes the plan and not the score", () => {
  it("a constrained person gets different actions from a free one", () => {
    const free = planFor(lowDomain("foodQuality", 3))
    const constrained = planFor(lowDomain("foodQuality", 0))

    expect(JSON.stringify(scoreOf(lowDomain("foodQuality", 0)))).toBe(
      JSON.stringify(scoreOf(lowDomain("foodQuality", 3))),
    )
    expect(JSON.stringify(constrained.priorities)).toBe(JSON.stringify(free.priorities))

    const ids = (p: typeof free) => [p.today?.id, ...p.thisWeek.map((r) => r.id)].join(",")
    expect(
      ids(constrained),
      "Your Food Context must actually change what is suggested",
    ).not.toBe(ids(free))
  })

  it("no action requiring a limiting constraint is ever offered", () => {
    for (const limited of ["time", "cost", "access", "kitchen"] as const) {
      const answers = { ...lowDomain("foodQuality", 3), [CONTEXT_ITEMS[limited]]: 0 }
      const plan = buildPlan({ score: scoreOf(answers), set: SET, answers })
      for (const r of [plan.today, ...plan.thisWeek].filter((x) => x !== null)) {
        expect(
          r!.requires,
          `${r!.id} requires ${limited}, which the person described as being in the way`,
        ).not.toContain(limited)
      }
    }
  })

  it("the maximally constrained person STILL gets a full plan", () => {
    /*
     * The worst available failure of this layer would be going quiet on the
     * person with the fewest options. Every domain, fully constrained.
     */
    for (const d of DOMAINS) {
      const plan = planFor(lowDomain(d, 0))
      expect(plan.today, `${d}: no action for today when everything is limiting`).not.toBeNull()
      expect(plan.thisWeek.length, `${d}: nothing for this week`).toBeGreaterThan(0)
      expect(plan.thirtyDays, `${d}: no month`).not.toBeNull()
      for (const r of [plan.today!, ...plan.thisWeek]) expect(r.requires).toEqual([])
    }
  })

  it("skipping Part 4 entirely still gives a plan, and says it was skipped", () => {
    const answers: Record<string, number> = {}
    for (const q of SET.questions) {
      if (q.contributes === "food-context") continue // Part 4 left blank
      answers[q.id] = q.contributes === "fss" && q.domain === "diversity" ? 0 : 3
    }
    const plan = buildPlan({ score: scoreOf(answers), set: SET, answers })
    expect(plan.context.answered).toBe(false)
    expect(plan.today).not.toBeNull()
    expect(plan.thisWeek.length).toBeGreaterThan(0)
  })
})

describe("no priority is padded to fill a category", () => {
  it("a mealRhythm plan is all Rejuvenate, with nothing invented", () => {
    const plan = planFor(lowDomain("mealRhythm"))
    const categories = new Set([plan.today!, ...plan.thisWeek].map((r) => r.category))
    expect(categories).toEqual(new Set(["rejuvenate"]))
  })

  it("a fermentedFoods plan is all Seed", () => {
    const plan = planFor(lowDomain("fermentedFoods"))
    const categories = new Set([plan.today!, ...plan.thisWeek].map((r) => r.category))
    expect(categories).toEqual(new Set(["seed"]))
  })

  it("and a foodQuality plan genuinely uses two", () => {
    // Proving the single-category plans above are a property of the content
    // rather than of the selection: where two exist, two are used.
    const plan = planFor(lowDomain("foodQuality"))
    const categories = new Set([plan.today!, ...plan.thisWeek].map((r) => r.category))
    expect(categories.size).toBeGreaterThan(1)
    expect(categories.has("seed"), "foodQuality corresponds to no Seed action").toBe(false)
  })
})

describe("every recommendation carries its boundary and both versions", () => {
  const plan = planFor(allTied())
  const all = [plan.today!, ...plan.thisWeek]

  it("the structure is complete", () => {
    for (const r of all) {
      expect(Object.keys(r).sort()).toEqual([
        "actionSetVersion",
        "category",
        "claimClass",
        "domain",
        "id",
        "practicalAction",
        "priorityId",
        "provenance",
        "rationale",
        "requires",
        "sourceDomain",
        "status",
        "suggestedFrequency",
        "timeHorizon",
        "title",
      ])
    }
  })

  it("each one carries a claim class, a status and the two versions", () => {
    for (const r of all) {
      expect(r.claimClass).toBeTruthy()
      expect(r.status).toBe("candidate-pending-review")
      expect(r.actionSetVersion).toBe(ACTION_SET_VERSION)
      expect(r.provenance).toEqual(FSS_V1_PROVENANCE)
    }
    expect(plan.actionSetVersion).toBe(ACTION_SET_VERSION)
    expect(plan.thirtyDays!.status).toBe("candidate-pending-review")
  })

  it("each one points back at a priority that is in the plan", () => {
    const ids = new Set(plan.priorities.map((p) => p.id))
    for (const r of all) expect(ids).toContain(r.priorityId)
  })

  it("an explicit provenance travels all the way to the recommendation", () => {
    const answers = allTied()
    const legacy = buildPlan({
      score: scoreOf(answers),
      set: SET,
      answers,
      provenance: LEGACY_PROVENANCE,
    })
    expect(legacy.provenance).toEqual(LEGACY_PROVENANCE)
    expect(legacy.today!.provenance).toEqual(LEGACY_PROVENANCE)
    expect(legacy.priorities[0].provenance).toEqual(LEGACY_PROVENANCE)
  })
})

describe("the empty cases", () => {
  it("nothing answered gives a plan with nothing in it, not a broken one", () => {
    const plan = buildPlan({ score: scoreOf({}), set: SET, answers: {} })
    expect(plan.priorities).toEqual([])
    expect(plan.today).toBeNull()
    expect(plan.thisWeek).toEqual([])
    expect(plan.thirtyDays).toBeNull()
    // Still carries its versions, so an empty plan is still identifiable.
    expect(plan.actionSetVersion).toBe(ACTION_SET_VERSION)
    expect(plan.provenance).toEqual(FSS_V1_PROVENANCE)
  })

  it("a withheld composite still gets a full plan from the domains that scored", () => {
    const answers: Record<string, number> = {}
    for (const q of SET.questions) answers[q.id] = 3
    for (const q of SET.questions.filter((q) => q.contributes === "fss" && q.domain === "foodQuality")) {
      delete answers[q.id]
    }
    for (const q of SET.questions.filter((q) => q.contributes === "fss" && q.domain === "diversity")) {
      answers[q.id] = 0
    }

    const score = scoreOf(answers)
    expect(score.state).toBe("withheld")

    const plan = buildPlan({ score, set: SET, answers })
    expect(plan.priorities.map((p) => p.sourceDomain)).toEqual(["diversity"])
    expect(plan.today).not.toBeNull()
    expect(plan.thirtyDays).not.toBeNull()
  })
})

describe("every entry in the catalogue is reachable through buildPlan", () => {
  /*
   * The food-swaps lesson, end to end rather than at the catalogue level:
   * twenty of twenty-five authored swaps were unreachable for one hundred
   * percent of reports because a key did not match a map. Authored content
   * that no walk can produce looks like coverage and is not.
   */
  it("some walk produces each one", () => {
    const reached = new Set<string>()
    for (const d of DOMAINS) {
      for (const fc of [0, 1, 2, 3]) {
        const plan = planFor(lowDomain(d, fc))
        if (plan.today) reached.add(plan.today.id)
        for (const r of plan.thisWeek) reached.add(r.id)
      }
      // And with that domain tied with others, which changes the weekly set.
      const tied = planFor(allTied())
      if (tied.today) reached.add(tied.today.id)
      for (const r of tied.thisWeek) reached.add(r.id)
    }

    const unreachable = ACTION_CATALOGUE.filter((e) => !reached.has(e.id)).map((e) => e.id)
    expect(unreachable, "authored content no walk can reach").toEqual([])
  })
})

describe("AI is not the recommendation authority, and is not present", () => {
  it("the plan is produced without any model call", () => {
    // Behavioural: buildPlan is synchronous and returns a complete plan. A
    // model call could not be hidden inside a synchronous pure function that
    // returns fully-populated reviewed content.
    const plan = planFor(lowDomain("diversity"))
    expect(plan.today!.practicalAction).toBe(
      ACTION_CATALOGUE.find((e) => e.id === plan.today!.id)!.practicalAction,
    )
    expect(plan.thirtyDays!.behaviour).toBe(THIRTY_DAY_FOCUS.diversity.behaviour)
  })

  it("every rendered sentence traces to reviewed content, byte for byte", () => {
    const plan = planFor(allTied())
    for (const r of [plan.today!, ...plan.thisWeek]) {
      const source = ACTION_CATALOGUE.find((e) => e.id === r.id)
      expect(source, `${r.id} is not in the catalogue`).toBeDefined()
      expect(r.title).toBe(source!.title)
      expect(r.practicalAction).toBe(source!.practicalAction)
      expect(r.rationale).toBe(source!.rationale)
      expect(r.suggestedFrequency).toBe(source!.suggestedFrequency)
    }
  })
})
