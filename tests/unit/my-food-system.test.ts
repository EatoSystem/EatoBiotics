import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import { computeFoodSystemScore, type Answers } from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import { FSS_V1_PROVENANCE, LEGACY_PROVENANCE } from "@/lib/fss/engine/provenance"
import { resolvePriorities } from "@/lib/fss/action/priority"
import { DOMAIN_PRESENTATION, PRIORITY_COPY } from "@/lib/fss/presentation/domains"
import { buildPlan } from "@/lib/fss/action/plan"
import { toStoredAction } from "@/lib/fss/action/stored"
import { ACTION_SET_VERSION } from "@/lib/fss/action/types"
import {
  ACTION_STATES,
  RepositoryWriteFailed,
  type FoodSystemRepository,
  type StoredAction,
  type StoredAssessment,
  type StoredFoodSystem,
  type StoredPlanDecision,
  type StoredPriorityDecision,
  type StoredScore,
} from "@/lib/fss/persistence/repository"
import { establishFoodSystem } from "@/lib/fss/system/establish"
import { loadCurrentFoodSystem } from "@/lib/fss/system/load"
import { moveAction } from "@/lib/fss/system/actions"
import { toAiContext } from "@/lib/fss/system/ai-context"
import { SYSTEM_MODEL_VERSION } from "@/lib/fss/system/version"
import { isMintedId, newId } from "@/lib/fss/system/identity"
import { toStoredPlanDecision, toStoredPriorityDecision } from "@/lib/fss/system/decisions"
import { composeMyFoodSystem } from "@/lib/fss/system/compose"
import { MY_FOOD_SYSTEM_KEYS } from "@/lib/fss/system/types"
import { resolveReviewPoint, daysUntil } from "@/lib/fss/system/review"
import { SYSTEM_CHECKS, validateFoodSystem } from "@/lib/fss/system/validate"
import { BIOTICS, SECTIONS, SECTION_LIST, TODAY, PROGRESS } from "@/lib/fss/system/sections"
import {
  DEFAULT_SECTION,
  SECTION_COPY,
  SECTION_ORDER,
  UNAVAILABLE_COPY,
} from "@/lib/fss/presentation/system"

/* ════════════════════════════════════════════════════════════════════════════
   GATE 4 — MY FOOD SYSTEM.

   The rule under test, in four clauses:

     Persist facts. Persist decisions. Persist human state. Derive explanations.

   The clause this file exists for is the SECOND, because it is the one that was
   missing: a selection is a decision EatoBiotics made for somebody under a
   named policy, and reopening their Food System must not silently re-make it
   under a newer rule.
   ════════════════════════════════════════════════════════════════════════════ */

const SET = resolveQuestionSetV1()
const FIXTURE = nonProductionFixture("unit test")
const NOW = "2026-10-01T09:00:00.000Z"

/** The all-2s sheet the gate's walk uses. */
function allTwos(): Answers {
  return Object.fromEntries(SET.questions.map((q) => [q.id, 2]))
}

/** A sheet with one domain at the floor, so the priority is unambiguous. */
function fermentedAtZero(): Answers {
  return Object.fromEntries(
    SET.questions.map((q) => [
      q.id,
      q.contributes === "fss" && q.domain === "fermentedFoods" ? 0 : 3,
    ]),
  )
}

interface Records {
  system: StoredFoodSystem
  assessment: StoredAssessment
  score: StoredScore
  priorityDecision: StoredPriorityDecision
  planDecision: StoredPlanDecision
  actions: readonly StoredAction[]
}

/**
 * The records a real establishment would have written, built directly.
 *
 * Deliberately NOT by calling `establishFoodSystem`: that needs a repository,
 * and a composer test that needed a store would be testing two things. The
 * ordered write path has its own assertions in `fss-persistence.test.ts`.
 */
function records(answers: Answers = allTwos(), overrides: Partial<Records> = {}): Records {
  const score = computeFoodSystemScore({
    set: SET,
    answers,
    weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
    fixtureContext: FIXTURE,
  })
  const priorities = resolvePriorities({ score, set: SET, answers })
  const plan = buildPlan({ score, set: SET, answers })

  const scoreId = "score_fixture"
  const assessment: StoredAssessment = {
    id: "assessment_fixture",
    assessmentVersion: SET.assessmentVersion,
    questionSetVersion: SET.questionSetVersion,
    answers,
    startedAt: "2026-10-01T08:40:00.000Z",
    completedAt: NOW,
  }

  const stored: StoredScore = {
    id: scoreId,
    assessmentId: assessment.id,
    state: score.state,
    ...(typeof score.score === "number" ? { score: score.score } : {}),
    domains: score.domains.map((d) => ({
      domain: d.domain,
      state: d.state,
      ...(d.state === "scored" ? { score: d.score } : {}),
    })),
    completeness: score.completeness,
    provenance: score.provenance,
    computedAt: NOW,
  }

  const actions: StoredAction[] = [...(plan.today ? [plan.today] : []), ...plan.thisWeek].map(
    (recommendation, i) =>
      toStoredAction({
        id: `action_fixture_${i}`,
        scoreId,
        recommendation,
        state: "planned",
        createdAt: NOW,
      }),
  )

  return {
    system: {
      id: "system_fixture",
      assessmentId: assessment.id,
      scoreId,
      establishedAt: NOW,
      systemModelVersion: SYSTEM_MODEL_VERSION,
      actionSetVersion: ACTION_SET_VERSION,
    },
    assessment,
    score: stored,
    priorityDecision: toStoredPriorityDecision({ scoreId, priorities, decidedAt: NOW }),
    planDecision: toStoredPlanDecision({ scoreId, plan, decidedAt: NOW }),
    actions,
    ...overrides,
  }
}

const compose = (r: Records = records()) => composeMyFoodSystem({ ...r, set: SET })

/* ════════════════════════════════════════════════════════════════════════════
   1 · A COMPOSITION, NOT A RECORD
   ════════════════════════════════════════════════════════════════════════════ */

describe("MyFoodSystem is a composition and re-exports nothing", () => {
  it("its keys are exactly the pinned list", () => {
    expect(Object.keys(compose()).sort()).toEqual([...MY_FOOD_SYSTEM_KEYS])
  })

  it("it holds no convenience copy of a field another object owns", () => {
    const system = compose() as unknown as Record<string, unknown>
    /*
     * The three that would be written first, by somebody who found reading
     * through tiresome. Each one would be a second copy, and a second copy is
     * how two parts of one screen come to disagree about the same number.
     */
    for (const forbidden of [
      "scoreValue",
      "priorityDomain",
      "todayAction",
      "completeness",
      "domains",
      "answers",
    ]) {
      expect(system[forbidden], `MyFoodSystem.${forbidden} is a second copy`).toBeUndefined()
    }
  })

  it("the score and the assessment are referenced WHOLE, not spread", () => {
    const r = records()
    const system = compose(r)
    expect(system.score).toBe(r.score)
    expect(system.assessment).toBe(r.assessment)
  })

  it("and the all-2s sheet scores 67, which is the walk's anchor", () => {
    expect(compose().score.score).toBe(67)
  })
})

describe("the composer is pure", () => {
  it("two runs over the same records are byte-identical", () => {
    const r = records()
    expect(JSON.stringify(compose(r))).toBe(JSON.stringify(compose(r)))
  })

  it("it reads no clock — the review point is an absolute date", () => {
    const system = compose()
    expect(system.review.state).toBe("set")
    if (system.review.state !== "set") return
    // 30 days after establishment, stated absolutely. "in 24 days" is the
    // component's job, from a `now` it was handed.
    expect(system.review.dueAt).toBe("2026-10-31T09:00:00.000Z")
  })

  it("no module under lib/fss/system reads a clock, except the id minter", () => {
    /*
     * The whole point of `now` being a parameter everywhere. One `Date.now()`
     * or bare `new Date()` in a resolver would make the composer
     * unreproducible, and a composed view nobody can reproduce is one nobody
     * can review.
     *
     * ── THE ONE EXEMPTION, AND WHY IT IS NOT A WEAKENING ──────────────────
     *
     * `identity.ts` reads a clock in `newId`'s fallback, and this rule caught
     * it on its first run. The rule was over-broad rather than the code wrong:
     * MINTING AN ID IS CREATING NEW INFORMATION, which is the one thing in this
     * layer that is allowed to be non-deterministic — and must be, because two
     * people who answer identically have two Food Systems, not one.
     *
     * So the exemption is pinned BY VALUE rather than by a pattern. Adding a
     * second file to it is a visible act with an argument attached, which is the
     * opposite of a rule that quietly stopped looking.
     *
     * `review.ts` is NOT exempt: it constructs a Date from an ISO string it was
     * handed, which is arithmetic rather than a clock read.
     */
    const CLOCK_IS_ALLOWED = ["lib/fss/system/identity.ts"]

    const files = execSync("git ls-files --cached --others --exclude-standard lib/fss/system", {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter((f) => f.endsWith(".ts"))

    expect(files.length).toBeGreaterThan(8)
    expect(CLOCK_IS_ALLOWED, "the exemption list is pinned, not pattern-matched").toEqual([
      "lib/fss/system/identity.ts",
    ])

    for (const file of files) {
      if (CLOCK_IS_ALLOWED.includes(file)) continue
      const src = readFileSync(file, "utf-8")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ")
      expect(src, `${file} reads a clock`).not.toMatch(/Date\.now\(\)|new Date\(\s*\)/)
    }

    // NON-VACUITY: the rule really does find a clock read when there is one.
    expect("const t = Date.now()").toMatch(/Date\.now\(\)|new Date\(\s*\)/)
    expect("const d = new Date()").toMatch(/Date\.now\(\)|new Date\(\s*\)/)
    expect('const d = new Date("2026-10-01")').not.toMatch(/Date\.now\(\)|new Date\(\s*\)/)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   2 · THE COMPOSER DOES NOT DECIDE
   ════════════════════════════════════════════════════════════════════════════ */

describe("a selection is read back, never re-made", () => {
  it("the stored domain is what is shown, even when it is not the lowest", () => {
    /*
     * THE CENTRAL TEST OF THIS GATE.
     *
     * The decision says Meal Rhythm. The score's lowest domain is Fermented
     * Foods. A composer that re-selected would show Fermented Foods and nobody
     * would be told. It must show what was decided.
     */
    const r = records(fermentedAtZero())
    const fresh = resolvePriorities({
      score: computeFoodSystemScore({
        set: SET,
        answers: fermentedAtZero(),
        weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
        fixtureContext: FIXTURE,
      }),
      set: SET,
      answers: fermentedAtZero(),
    })
    expect(fresh[0].sourceDomain, "fixture precondition").toBe("fermentedFoods")

    const tampered = records(fermentedAtZero(), {
      priorityDecision: {
        ...r.priorityDecision,
        selected: [{ priorityId: "priority:mealRhythm", sourceDomain: "mealRhythm", rank: 0 }],
      },
    })

    const system = compose(tampered)
    expect(system.priorities.state).toBe("resolved")
    if (system.priorities.state !== "resolved") return
    expect(system.priorities.priorities[0].sourceDomain).toBe("mealRhythm")
  })

  it("a moved POLICY version refuses rather than re-explaining", () => {
    const r = records()
    const system = compose(
      records(allTwos(), {
        priorityDecision: { ...r.priorityDecision, systemModelVersion: "system-model-v0.9" },
      }),
    )
    expect(system.priorities.state).toBe("unresolvable")
    if (system.priorities.state !== "unresolvable") return
    expect(system.priorities.reason).toBe("policy-version-moved")
    // What was chosen is still NAMED. Only the explanation is withheld.
    expect(system.priorities.storedDomains.length).toBeGreaterThan(0)
  })

  it("a moved CONTENT version refuses the whole plan, not part of it", () => {
    const r = records()
    const system = compose(
      records(allTwos(), {
        planDecision: { ...r.planDecision, actionSetVersion: "actions-v0.9" },
      }),
    )
    expect(system.plan.state).toBe("unresolvable")
    if (system.plan.state !== "unresolvable") return
    expect(system.plan.reason).toBe("content-version-moved")
  })

  it("a withdrawn catalogue entry refuses rather than substituting another", () => {
    const r = records()
    const system = compose(
      records(allTwos(), {
        planDecision: { ...r.planDecision, todayRecommendationId: "diversity-today-withdrawn" },
      }),
    )
    expect(system.plan.state).toBe("unresolvable")
    if (system.plan.state !== "unresolvable") return
    expect(system.plan.reason).toBe("entry-withdrawn")
  })

  it("a recorded id that disagrees with its own domain is surfaced", () => {
    const r = records()
    const system = compose(
      records(allTwos(), {
        priorityDecision: {
          ...r.priorityDecision,
          selected: r.priorityDecision.selected.map((s) => ({ ...s, priorityId: "priority:wrong" })),
        },
      }),
    )
    expect(system.priorities.state).toBe("unresolvable")
    if (system.priorities.state !== "unresolvable") return
    expect(system.priorities.reason).toBe("decision-inconsistent")
  })

  it("an unresolvable priority takes the plan down with it", () => {
    // A plan bound to priorities we cannot explain would be a plan whose
    // reasoning is missing, presented as complete.
    const r = records()
    const system = compose(
      records(allTwos(), {
        priorityDecision: { ...r.priorityDecision, systemModelVersion: "system-model-v0.9" },
      }),
    )
    expect(system.plan.state).toBe("unresolvable")
  })

  it("the decision records carry no prose, so no copy edit is a migration", () => {
    const r = records()
    const asText = JSON.stringify({ p: r.priorityDecision, q: r.planDecision })
    expect(asText).not.toMatch(/[a-z]{3,}\s[a-z]{3,}\s[a-z]{3,}[.!?]/)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   3 · THE REVIEW POINT
   ════════════════════════════════════════════════════════════════════════════ */

describe("the review point resolves through the POLICY version", () => {
  it("a current policy gives an absolute date and the prospective rule", () => {
    const point = resolveReviewPoint({
      establishedAt: NOW,
      systemModelVersion: SYSTEM_MODEL_VERSION,
    })
    expect(point.state).toBe("set")
    if (point.state !== "set") return
    expect(point.afterDays).toBe(30)
    expect(point.dueAt).toBe("2026-10-31T09:00:00.000Z")
    // PROSPECTIVE, not past tense. The Gate 3.5 defect was shipping
    // `methodChanged` — "changed between these two results" — to somebody who
    // had taken the assessment once.
    expect(point.comparabilityRule).toMatch(/can only be compared/)
    expect(point.comparabilityRule).not.toMatch(/changed between these two results/)
  })

  it("a moved policy gives NO DATE, because the cadence is unknown", () => {
    const point = resolveReviewPoint({
      establishedAt: NOW,
      systemModelVersion: "system-model-v0.9",
    })
    expect(point.state).toBe("unresolvable")
    expect(point).not.toHaveProperty("dueAt")
  })

  it("it does NOT resolve through the action-set version", () => {
    /*
     * The amendment this gate took. Reassessment cadence is a policy decision;
     * `REASSESSMENT.afterDays` living in `catalogue.ts` is a location, not an
     * argument. Hanging it on the content version would make every reviewed
     * wording edit read as a policy change.
     */
    const src = readFileSync("lib/fss/system/review.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    expect(src).not.toMatch(/actionSetVersion|ACTION_SET_VERSION/)
  })

  it("daysUntil rounds towards the longer wait", () => {
    // 23.2 days away reads as 24, never 23: telling somebody "23 days" when it
    // is really 24 makes the date arrive a day late.
    const now = new Date("2026-10-01T09:00:00.000Z")
    expect(daysUntil("2026-10-31T09:00:00.000Z", now)).toBe(30)
    expect(daysUntil("2026-10-24T14:00:00.000Z", now)).toBe(24)
    expect(daysUntil("2026-10-01T09:00:00.000Z", now)).toBe(0)
    expect(daysUntil("2026-09-28T09:00:00.000Z", now)).toBe(-3)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   4 · HUMAN STATE INFERS NOTHING
   ════════════════════════════════════════════════════════════════════════════ */

describe("action state records what somebody did and nothing else", () => {
  it("a ResolvedAction has no outcome, benefit or effect field", () => {
    const system = compose()
    expect(system.actions.length).toBeGreaterThan(0)
    for (const action of system.actions) {
      expect(Object.keys(action).sort()).toEqual([
        "actionCategory",
        "changedAt",
        "content",
        "createdAt",
        "id",
        "state",
        "timeHorizon",
      ])
    }
  })

  it("no outcome vocabulary sits near a transition anywhere in the layer", () => {
    /*
     * ── THIS RULE CAUGHT ITS OWN PROHIBITION ON ITS FIRST RUN ─────────────
     *
     * It flagged `sections.ts` for "an outcome for a completed action" — an
     * entry in `MY_PLAN.refuses`, which is the DECLARATION of the very thing
     * being refused. A guard that reads a prohibition as a violation is reading
     * prose about the rule rather than code that breaks it, and the recurring
     * form of that defect in this codebase is a guard matching a comment.
     *
     * So the `refuses` arrays are stripped alongside the comments, for the same
     * reason and with the same risk — a stripper that removed too much would
     * blind the rule. The non-vacuity block below proves it did not.
     */
    /*
     * ── AND IT MATCHES BOTH WORD ORDERS, WHICH IT DID NOT AT FIRST ────────
     *
     * The first version required the outcome word FIRST: "improvement since
     * marking it done". But the natural way to write the defect is the other
     * way round —
     *
     *     if (a.state === "done") showBenefit(a)
     *
     * — and the rule sailed past it. Found by a non-vacuity case I wrote
     * expecting it to pass, which is the only reason it was found at all. The
     * rule is bidirectional now; the case stayed as written.
     */
    /*
     * ── AND IT SEES camelCase, WHICH TOOK A SECOND REPAIR ─────────────────
     *
     * `\b(benefit\w*)` does not match inside `showBenefit`, because there is no
     * word boundary before a capital in the middle of an identifier. In a
     * TypeScript codebase that is where the defect would actually live —
     * `showBenefit`, `outcomeFor`, `effectOf` — so a rule that only read prose
     * spacing was blind to the most likely form of the thing it refuses.
     *
     * So each stem matches at a word boundary OR after a lowercase letter.
     */
    const OUTCOME = String.raw`(?:\b|(?<=[a-z]))(?:improve|benefit|effect|outcome|boost)\w*`
    const TRANSITION = String.raw`(?:\b|(?<=[a-z]))(?:state|done|complete|skipped)\w*`
    const OUTCOME_NEAR_TRANSITION = new RegExp(
      `(?:${OUTCOME})[^;\\n]{0,40}(?:${TRANSITION})|(?:${TRANSITION})[^;\\n]{0,40}(?:${OUTCOME})`,
      "i",
    )

    const strip = (src: string) =>
      src
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ")
        // The declared prohibitions. Data about the rule, not an instance of it.
        .replace(/refuses:\s*\[[\s\S]*?\]/g, " refuses: [] ")

    const files = execSync("git ls-files --cached --others --exclude-standard lib/fss/system", {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter((f) => f.endsWith(".ts"))

    for (const file of files) {
      expect(
        strip(readFileSync(file, "utf-8")),
        `${file} attaches an outcome to a state change`,
      ).not.toMatch(OUTCOME_NEAR_TRANSITION)
    }

    // NON-VACUITY, in both directions: a real violation survives stripping,
    // and only the declaration form is removed.
    expect(strip("if (a.state === 'done') showBenefit(a)")).toMatch(OUTCOME_NEAR_TRANSITION)
    expect(strip("const msg = `your improvement since marking it done`")).toMatch(
      OUTCOME_NEAR_TRANSITION,
    )
    expect(strip('refuses: ["an outcome for a completed action"],')).not.toMatch(
      OUTCOME_NEAR_TRANSITION,
    )
    expect(strip("/* no outcome for a completed action */")).not.toMatch(OUTCOME_NEAR_TRANSITION)
  })

  it("marking an action moves no number but the count", () => {
    const base = records()
    const marked = records(allTwos(), {
      actions: base.actions.map((a, i) =>
        i === 0 ? { ...a, state: "done", changedAt: "2026-10-02T09:00:00.000Z" } : a,
      ),
    })

    const before = PROGRESS.select(compose(base))
    const after = PROGRESS.select(compose(marked))

    expect(after.progress.actionsDone).toBe(before.progress.actionsDone + 1)
    expect(after.progress.actionsPlanned).toBe(before.progress.actionsPlanned - 1)
    // Everything else in Progress is byte-identical.
    const strip = (p: typeof before) => ({
      ...p,
      progress: { ...p.progress, actionsDone: 0, actionsPlanned: 0 },
    })
    expect(JSON.stringify(strip(after))).toBe(JSON.stringify(strip(before)))
  })

  it("an unresolvable action is KEPT, carrying its refusal", () => {
    const base = records()
    const system = compose(
      records(allTwos(), {
        actions: base.actions.map((a, i) =>
          i === 0 ? { ...a, actionSetVersion: "actions-v0.9" } : a,
        ),
      }),
    )
    // Dropping it would make the method change invisible AND would silently
    // reduce the person's own counts.
    expect(system.actions.length).toBe(base.actions.length)
    const unresolved = system.actions.filter((a) => a.content.state === "unresolvable")
    expect(unresolved).toHaveLength(1)
    expect(unresolved[0].state).toBe("planned")
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   5 · PROGRESS CLAIMS NOTHING
   ════════════════════════════════════════════════════════════════════════════ */

describe("Progress states four facts and no fifth", () => {
  it("scoresAvailable is 1, so there is nothing to compare", () => {
    expect(compose().progress.scoresAvailable).toBe(1)
  })

  it("comparability and 'a comparison exists' are different questions", () => {
    // A current-method score COULD be compared one day; that is not the same as
    // a comparison being available now, and both facts are carried so no
    // surface can read one as the other.
    expect(compose().progress.comparability.comparable).toBe(true)
    expect(compose().progress.scoresAvailable).toBe(1)
  })

  it("a legacy-unversioned score says so, permanently", () => {
    const r = records()
    const system = compose(
      records(allTwos(), {
        score: { ...r.score, provenance: LEGACY_PROVENANCE },
      }),
    )
    expect(system.progress.comparability.comparable).toBe(false)
    if (system.progress.comparability.comparable) return
    expect(system.progress.comparability.because).toBe("legacy-unversioned")
  })

  it("the section is not even PASSED the score", () => {
    // The surest way not to render a comparison is not to hold the thing one
    // would be made from.
    const slice = PROGRESS.select(compose()) as unknown as Record<string, unknown>
    expect(slice.score).toBeUndefined()
    expect(Object.keys(slice).sort()).toEqual(["progress", "review"])
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   6 · THE SECTIONS
   ════════════════════════════════════════════════════════════════════════════ */

describe("there are exactly seven areas, and Biotics gets nothing", () => {
  it("SECTION_ORDER is the seven, pinned by value", () => {
    expect([...SECTION_ORDER]).toEqual([
      "today",
      "score",
      "my-food",
      "biotics",
      "my-plan",
      "progress",
      "learn",
    ])
  })

  it("every id has copy, a descriptor and a place in the list", () => {
    for (const id of SECTION_ORDER) {
      expect(SECTION_COPY[id].label.length).toBeGreaterThan(0)
      expect(SECTION_COPY[id].says.length).toBeGreaterThan(0)
      expect(SECTIONS[id].id).toBe(id)
      expect(SECTIONS[id].refuses.length).toBeGreaterThan(0)
    }
    expect(SECTION_LIST).toHaveLength(7)
    expect(Object.keys(SECTIONS).sort()).toEqual([...SECTION_ORDER].sort())
  })

  it("Today is the default landing", () => {
    expect(DEFAULT_SECTION).toBe("today")
  })

  it("BIOTICS.select returns null — it is handed nothing at all", () => {
    expect(BIOTICS.select(compose())).toBeNull()
  })

  it("and its component takes no props, so there is nothing to render personally", () => {
    const src = readFileSync("components/fss/system/biotics.tsx", "utf-8")
    expect(src).toMatch(/export function BioticsSection\(\)/)
    expect(src, "a slice parameter would reopen the whole class of defect").not.toMatch(
      /BioticsSection\(\s*\{/,
    )
  })

  it("Today is handed one action, not one per priority", () => {
    const slice = TODAY.select(compose(records(fermentedAtZero())))
    expect(slice.today).not.toBeNull()
    // `today` is a single Recommendation, by type. The assertion that matters
    // is that it is not an array, which no amount of copy could fix.
    expect(Array.isArray(slice.today)).toBe(false)
  })

  it("Today holds the score as a number and no band word", () => {
    const slice = TODAY.select(compose())
    expect(slice.score).toBe(67)
    const asText = JSON.stringify(slice)
    for (const band of ["excellent", "good", "moderate", "poor", "needs work", "thriving"]) {
      expect(asText.toLowerCase(), `a band word reached Today: ${band}`).not.toContain(band)
    }
  })

  it("Today's one insight explains the RANKING, and cannot contradict the focus", () => {
    /*
     * ── FOUND BY READING THE RENDERED SCREEN, NOT BY A TEST ───────────────
     *
     * The gate's plan said the insight should be
     * `DOMAIN_PRESENTATION[d].whereYouAre(domainScore)`. On the all-2s sheet
     * that produced this, on one screen:
     *
     *     YOUR FOCUS   Diversity: widen the range, not the amount
     *     Your answers described a wide range of plant foods across a typical week.
     *
     * Two reviewed, individually true sentences that contradict each other
     * where they appear. A tie at 67 makes Diversity the LOWEST OF FIVE and
     * also puts it in the TOP BAND of its own ladder — those are different
     * claims, and the screen was presenting them as agreeing.
     *
     * This is the same defect class as the two week-story sentences one gate
     * earlier: the unit tests were green because each sentence was correct in
     * isolation, and only reading the page showed that the pair was not.
     */
    const slice = TODAY.select(compose())
    expect(slice.focus).not.toBeNull()
    expect(slice.insight).toBe(PRIORITY_COPY.explanation)

    // The specific contradiction, refused by name: a "widen" headline beside a
    // "wide range" description.
    const together = `${slice.focus?.headline} ${slice.insight}`.toLowerCase()
    expect(together, "the focus and the insight disagree about the same domain").not.toMatch(
      /widen[^.]*\bwide\b|\bwide\b[^.]*widen/,
    )

    // NON-VACUITY: the sentence that WAS there would have failed this.
    const was = `${slice.focus?.headline} ${DOMAIN_PRESENTATION[slice.focus!.sourceDomain].whereYouAre(67)}`.toLowerCase()
    expect(was).toMatch(/widen[^.]*\bwide\b|\bwide\b[^.]*widen/)
  })

  it("and the band description is still available, in My Food where it belongs", () => {
    // A correction is never a deletion. `whereYouAre` describes a domain beside
    // the other four, which is a place it cannot contradict a priority.
    const src = readFileSync("components/fss/system/my-food.tsx", "utf-8")
    expect(src).toMatch(/whereYouAre\(/)
    expect(src).toMatch(/whereYouAreUnknown/)
  })

  it("Learn is handed domain KEYS and nothing else", () => {
    const system = compose()
    const slice = SECTIONS.learn.select(system) as { domains: readonly string[] }
    expect(Object.keys(slice)).toEqual(["domains"])
    expect(JSON.stringify(slice)).not.toContain("67")
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   7 · VALIDATION REFUSES, AND NEVER REPAIRS
   ════════════════════════════════════════════════════════════════════════════ */

describe("a current Food System validates or fails closed", () => {
  it("the happy path validates", () => {
    expect(validateFoodSystem(records()).ok).toBe(true)
  })

  it.each([
    ["assessment-missing", { assessment: null }],
    ["score-missing", { score: null }],
    ["priority-decision-missing", { priorityDecision: null }],
    ["plan-decision-missing", { planDecision: null }],
  ] as const)("%s is caught by name", (failed, override) => {
    const verdict = validateFoodSystem({ ...records(), ...(override as object) } as never)
    expect(verdict.ok).toBe(false)
    if (verdict.ok) return
    expect(verdict.failed).toBe(failed)
  })

  it("a dangling scoreId is caught as an identity disagreement", () => {
    const r = records()
    const verdict = validateFoodSystem({ ...r, system: { ...r.system, scoreId: "score_other" } })
    expect(verdict.ok).toBe(false)
    if (verdict.ok) return
    expect(verdict.failed).toBe("identities-disagree")
  })

  it("an incomplete provenance is caught, but legacy-unversioned is NOT", () => {
    const r = records()
    const broken = validateFoodSystem({
      ...r,
      score: { ...r.score, provenance: { ...FSS_V1_PROVENANCE, calculationVersion: "" } },
    })
    expect(broken.ok).toBe(false)
    if (!broken.ok) expect(broken.failed).toBe("provenance-malformed")

    // A legacy provenance is COMPLETE — five fields that all say "we do not
    // know". It passes here and is refused by `canCompare`, which is where that
    // refusal belongs.
    expect(validateFoodSystem({ ...r, score: { ...r.score, provenance: LEGACY_PROVENANCE } }).ok).toBe(
      true,
    )
  })

  it("a moved policy or content version on the SYSTEM fails closed", () => {
    const r = records()
    const policy = validateFoodSystem({
      ...r,
      system: { ...r.system, systemModelVersion: "system-model-v0.9" },
    })
    expect(policy.ok).toBe(false)
    if (!policy.ok) expect(policy.failed).toBe("policy-version-unresolvable")

    const content = validateFoodSystem({
      ...r,
      system: { ...r.system, actionSetVersion: "actions-v0.9" },
    })
    expect(content.ok).toBe(false)
    if (!content.ok) expect(content.failed).toBe("action-set-version-unresolvable")
  })

  it("every named check has a plain-words sentence", () => {
    for (const check of SYSTEM_CHECKS) {
      expect(UNAVAILABLE_COPY[check], `no sentence for ${check}`).toBeTruthy()
      expect(UNAVAILABLE_COPY[check].length).toBeGreaterThan(20)
    }
    expect(Object.keys(UNAVAILABLE_COPY).sort()).toEqual([...SYSTEM_CHECKS].sort())
  })

  it("the validator contains no repair, and the loader deletes nothing", () => {
    /*
     * A validator that repaired its input would be the silent-recalculation
     * defect wearing a different hat. And "fixing" a failed read by clearing
     * somebody's Food System is the most destructive thing this layer could
     * do — so the loader must not call the one method that could.
     */
    const validate = readFileSync("lib/fss/system/validate.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    expect(validate).not.toMatch(/\bsave\w*\(|\bclear\w*\(|\bremove\w*\(|=\s*\{\s*\.\.\./)

    const load = readFileSync("lib/fss/system/load.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    expect(load, "a failed read must not clear the pointer").not.toMatch(
      /clearCurrentSystem|setCurrentSystem|save/,
    )
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   8 · THE FENCE, AND THE AI INTERFACE WITH NO CALLER
   ════════════════════════════════════════════════════════════════════════════ */

describe("lib/fss/system imports nothing it has no business in", () => {
  const FORBIDDEN: readonly [string, RegExp][] = [
    ["an AI SDK", /@anthropic-ai|\bopenai\b/i],
    ["the AI cost guard", /@\/lib\/ai-guard/],
    ["the consultation layer", /@\/lib\/consultation/],
    ["the Report layer", /@\/lib\/report/],
    ["the pillars module", /@\/lib\/pillars/],
    ["a Supabase client", /@\/lib\/supabase|createClient/],
  ]

  /**
   * PARSED, not grepped: only real import statements count.
   *
   * A comment in `ai-context.ts` explains at length why there is no prompt
   * field and names the Report layer while doing it. A guard that read prose
   * would fail on the explanation of the rule it is enforcing — which is the
   * same defect `fss-priority.test.ts` records in its own stripper.
   */
  function importsOf(file: string): string[] {
    const src = readFileSync(file, "utf-8")
    return [...src.matchAll(/^\s*import[\s\S]*?from\s+"([^"]+)"/gm)].map((m) => m[1])
  }

  const files = execSync("git ls-files --cached --others --exclude-standard lib/fss/system", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter((f) => f.endsWith(".ts"))

  it("the fence covers every module in the directory", () => {
    expect(files.length).toBeGreaterThan(8)
  })

  it.each(FORBIDDEN)("nothing imports %s", (_label, pattern) => {
    for (const file of files) {
      for (const specifier of importsOf(file)) {
        expect(pattern.test(specifier), `${file} imports ${specifier}`).toBe(false)
      }
    }
  })

  it("NON-VACUITY: the parser finds the imports that are really there", () => {
    expect(importsOf("lib/fss/system/compose.ts")).toContain("@/lib/fss/engine/compare")
    expect(importsOf("lib/fss/system/ai-context.ts").length).toBeGreaterThan(3)
  })

  it("lib/fss still does not import the science contract", () => {
    const all = execSync("git ls-files --cached --others --exclude-standard lib/fss", {
      encoding: "utf-8",
    })
      .trim()
      .split("\n")
      .filter((f) => f.endsWith(".ts"))
    for (const file of all) {
      for (const specifier of importsOf(file)) {
        expect(/science-contract/.test(specifier), `${file} imports ${specifier}`).toBe(false)
      }
    }
  })
})

describe("the AI context package is an interface and nothing more", () => {
  it("toAiContext has no caller", () => {
    const callers = execSync(
      "git grep -l --untracked -E 'toAiContext\\(' -- 'lib/**' 'components/**' 'app/**' || true",
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .filter((f) => f !== "lib/fss/system/ai-context.ts")

    expect(callers, "Gate 6 is where this gets a caller, and it needs its own review").toEqual([])
  })

  it("and it has no prompt field, which is the interface's whole content", () => {
    const src = readFileSync("lib/fss/system/ai-context.ts", "utf-8")
    const body = src.slice(src.indexOf("export interface FoodSystemAiContext"))
    for (const field of ["systemPrompt", "instructions", "narrative", "persona", "tone"]) {
      expect(body, `${field} would be a second source for methodology`).not.toMatch(
        new RegExp(`\\breadonly ${field}\\b`),
      )
    }
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   9 · THE WRITE PATH, EXERCISED RATHER THAN READ

   ── WHY THIS SECTION EXISTS ────────────────────────────────────────────────

   Everything above reads records or source. The first sabotage run over this
   gate slipped TWELVE cases, and five of them slipped for one reason: the
   ordered write path, the loader and `moveAction` had no behavioural test at
   all. Breaking `if (!verdict.ok)` to `if (false)`, making the strict write
   swallow its failure, making `done` irreversible, and reporting the wrong
   failed check were all invisible, because nothing ever called those functions.

   This is the same lesson `tests/unit/agent-loop-claims.test.ts` records one
   gate earlier: a source scan catches the shape of a defect, and only CALLING
   the thing catches the defect.
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * An in-memory repository with the same two write behaviours as the real one.
 *
 * `failAt` makes one key's STRICT write throw, which is how a quota or a
 * private-browsing failure arrives. `saveAssessment` stays lenient, because
 * that difference is the thing being tested.
 */
function memoryRepo(options: { failAt?: string } = {}): FoodSystemRepository & {
  readonly writes: string[]
  readonly store: Map<string, unknown>
} {
  const store = new Map<string, unknown>()
  const writes: string[] = []

  const strict = (key: string, value: unknown) => {
    writes.push(key)
    if (options.failAt && key.startsWith(options.failAt)) {
      throw new RepositoryWriteFailed(key)
    }
    store.set(key, value)
  }

  return {
    backend: "local",
    writable: true,
    writes,
    store,
    async loadAssessment(id) {
      return (store.get(`assessment.${id}`) as StoredAssessment) ?? null
    },
    async saveAssessment(a) {
      writes.push(`assessment.${a.id}`)
      // Lenient: a failure here is swallowed, as in the real adapter.
      if (!options.failAt || !`assessment.${a.id}`.startsWith(options.failAt)) {
        store.set(`assessment.${a.id}`, a)
      }
    },
    async loadScore(id) {
      return (store.get(`score.${id}`) as StoredScore) ?? null
    },
    async saveScore(s) {
      strict(`score.${s.id}`, s)
    },
    async loadActions(scoreId) {
      return (store.get(`actions.${scoreId}`) as StoredAction[]) ?? []
    },
    async saveAction(a) {
      const existing = (store.get(`actions.${a.scoreId}`) as StoredAction[]) ?? []
      strict(`actions.${a.scoreId}`, [...existing.filter((x) => x.id !== a.id), a])
    },
    async loadPriorityDecision(scoreId) {
      return (store.get(`priority-decision.${scoreId}`) as StoredPriorityDecision) ?? null
    },
    async savePriorityDecision(d) {
      strict(`priority-decision.${d.scoreId}`, d)
    },
    async loadPlanDecision(scoreId) {
      return (store.get(`plan-decision.${scoreId}`) as StoredPlanDecision) ?? null
    },
    async savePlanDecision(d) {
      strict(`plan-decision.${d.scoreId}`, d)
    },
    async loadSystem(id) {
      return (store.get(`system.${id}`) as StoredFoodSystem) ?? null
    },
    async saveSystem(s) {
      strict(`system.${s.id}`, s)
    },
    async loadCurrentSystemId() {
      return (store.get("system.current") as string) ?? null
    },
    async setCurrentSystem(id) {
      strict("system.current", id)
    },
    async clearCurrentSystem() {
      writes.push("clear")
      store.delete("system.current")
    },
  }
}

function establishArgs(repo: FoodSystemRepository, answers: Answers = allTwos()) {
  return {
    repo,
    set: SET,
    answers,
    score: computeFoodSystemScore({
      set: SET,
      answers,
      weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
      fixtureContext: FIXTURE,
    }),
    assessment: {
      id: "candidate",
      assessmentVersion: SET.assessmentVersion,
      questionSetVersion: SET.questionSetVersion,
      answers,
      startedAt: "2026-10-01T08:40:00.000Z",
      completedAt: NOW,
    },
    now: NOW,
  }
}

describe("establishment writes in order, and the pointer is the commit point", () => {
  it("the happy path writes all six, with system.current last", async () => {
    const repo = memoryRepo()
    const result = await establishFoodSystem(establishArgs(repo))
    expect(result.ok).toBe(true)

    const kinds = repo.writes.map((k) => k.split(".")[0])
    expect(kinds[0]).toBe("assessment")
    expect(kinds).toContain("score")
    expect(kinds).toContain("priority-decision")
    expect(kinds).toContain("plan-decision")
    expect(kinds).toContain("actions")
    expect(repo.writes[repo.writes.length - 1]).toBe("system.current")
  })

  it("a composed view loads back from exactly what was written", async () => {
    const repo = memoryRepo()
    await establishFoodSystem(establishArgs(repo))
    const load = await loadCurrentFoodSystem({ repo, set: SET })
    expect(load.state).toBe("ready")
    if (load.state !== "ready") return
    expect(load.system.score.score).toBe(67)
    expect(load.system.priorities.state).toBe("resolved")
    expect(load.system.plan.state).toBe("resolved")
    expect(load.system.actions.length).toBeGreaterThan(0)
  })

  it.each([
    ["the score", "score."],
    ["a decision", "priority-decision."],
    ["the actions", "actions."],
    // `system.system_` and not `system.` — the latter would also match
    // `system.current`, so the test would be failing the pointer write rather
    // than the record it points at, and would pass for the wrong reason.
    ["the system record", "system.system_"],
  ])("a failed write of %s stops before the pointer", async (_label, failAt) => {
    const repo = memoryRepo({ failAt })
    const result = await establishFoodSystem(establishArgs(repo))
    expect(result.ok).toBe(false)
    // THE PROPERTY THAT MATTERS: nothing is current, so nothing half-created
    // can be rendered. Orphaned records may exist, and that is the accepted
    // cost — an orphan is invisible, a half-written current system is not.
    expect(await repo.loadCurrentSystemId()).toBeNull()
    expect((await loadCurrentFoodSystem({ repo, set: SET })).state).toBe("none")
  })

  it("a lenient assessment write that silently did nothing is caught by read-back", async () => {
    /*
     * `saveAssessment` cannot report failure — it is the one lenient write, so
     * that twenty answers are never lost to a thrown error. Step 1 therefore
     * verifies by READING BACK, which also catches a store that accepts a
     * write and discards it. No exception would have.
     */
    const repo = memoryRepo({ failAt: "assessment." })
    const result = await establishFoodSystem(establishArgs(repo))
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.failure.step).toBe(1)
    expect(await repo.loadCurrentSystemId()).toBeNull()
  })

  it("a failed validation stops the commit", async () => {
    /*
     * Reached by handing establishment a score whose provenance is incomplete,
     * so step 6 refuses. The pointer must not be written.
     */
    const repo = memoryRepo()
    const args = establishArgs(repo)
    const result = await establishFoodSystem({
      ...args,
      score: { ...args.score, provenance: { ...FSS_V1_PROVENANCE, calculationVersion: "" } },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.failure.step).toBe(6)
    expect(await repo.loadCurrentSystemId()).toBeNull()
  })
})

describe("the loader names the right failure and changes nothing", () => {
  async function established() {
    const repo = memoryRepo()
    await establishFoodSystem(establishArgs(repo))
    return repo
  }

  it("a pointer to a missing system record says SYSTEM record, not assessment", async () => {
    const repo = await established()
    const id = (await repo.loadCurrentSystemId()) as string
    repo.store.delete(`system.${id}`)

    const load = await loadCurrentFoodSystem({ repo, set: SET })
    expect(load.state).toBe("unavailable")
    if (load.state !== "unavailable") return
    expect(load.failed).toBe("system-record-missing")
  })

  it.each([
    ["assessment-missing", (r: ReturnType<typeof memoryRepo>) => r.store.delete("assessment.candidate")],
    [
      "score-missing",
      (r: ReturnType<typeof memoryRepo>) =>
        [...r.store.keys()].filter((k) => k.startsWith("score.")).forEach((k) => r.store.delete(k)),
    ],
    [
      "priority-decision-missing",
      (r: ReturnType<typeof memoryRepo>) =>
        [...r.store.keys()]
          .filter((k) => k.startsWith("priority-decision."))
          .forEach((k) => r.store.delete(k)),
    ],
  ] as const)("%s is reported by name", async (failed, tamper) => {
    const repo = await established()
    tamper(repo)
    const load = await loadCurrentFoodSystem({ repo, set: SET })
    expect(load.state).toBe("unavailable")
    if (load.state !== "unavailable") return
    expect(load.failed).toBe(failed)
  })

  it("and a failed load DELETES NOTHING — the pointer survives", async () => {
    const repo = await established()
    const before = new Set(repo.store.keys())
    repo.store.delete("assessment.candidate")

    const load = await loadCurrentFoodSystem({ repo, set: SET })
    expect(load.state).toBe("unavailable")
    expect(await repo.loadCurrentSystemId()).not.toBeNull()
    expect(repo.writes).not.toContain("clear")
    // Only the key the test removed is gone. Nothing else was touched.
    const after = new Set(repo.store.keys())
    expect([...before].filter((k) => !after.has(k))).toEqual(["assessment.candidate"])
  })
})

describe("moveAction records a state and nothing else", () => {
  async function withActions() {
    const repo = memoryRepo()
    await establishFoodSystem(establishArgs(repo))
    const load = await loadCurrentFoodSystem({ repo, set: SET })
    if (load.state !== "ready") throw new Error("fixture")
    return { repo, scoreId: load.system.scoreId, actions: load.system.actions }
  }

  it("moves planned to done, and persists it", async () => {
    const { repo, scoreId, actions } = await withActions()
    const result = await moveAction({
      repo,
      scoreId,
      actionId: actions[0].id,
      state: "done",
      now: "2026-10-02T09:00:00.000Z",
    })
    expect(result.ok).toBe(true)
    const stored = await repo.loadActions(scoreId)
    expect(stored.find((a) => a.id === actions[0].id)?.state).toBe("done")
  })

  it("BOTH terminal states are reversible back to planned", async () => {
    /*
     * A mistyped tap must not become a verdict. This is asserted by actually
     * moving through every transition, because an early return that quietly
     * ignored a reversal would look identical from the outside.
     */
    const { repo, scoreId, actions } = await withActions()
    const id = actions[0].id
    const move = (state: "planned" | "done" | "skipped") =>
      moveAction({ repo, scoreId, actionId: id, state, now: "2026-10-02T09:00:00.000Z" })

    for (const [from, to] of [
      ["done", "planned"],
      ["skipped", "planned"],
      ["done", "skipped"],
    ] as const) {
      await move(from)
      expect((await repo.loadActions(scoreId)).find((a) => a.id === id)?.state).toBe(from)
      await move(to)
      expect(
        (await repo.loadActions(scoreId)).find((a) => a.id === id)?.state,
        `${from} → ${to} was refused`,
      ).toBe(to)
    }
  })

  it("it touches nothing but that one action's state and changedAt", async () => {
    const { repo, scoreId, actions } = await withActions()
    const before = await repo.loadActions(scoreId)
    await moveAction({
      repo,
      scoreId,
      actionId: actions[0].id,
      state: "done",
      now: "2026-10-02T09:00:00.000Z",
    })
    const after = await repo.loadActions(scoreId)

    expect(after).toHaveLength(before.length)
    for (const row of after) {
      const was = before.find((b) => b.id === row.id)
      const expected =
        row.id === actions[0].id ? { ...was, state: "done", changedAt: "2026-10-02T09:00:00.000Z" } : was
      expect(row).toEqual(expected)
    }
    // And the score is untouched: marking an action cannot move a number.
    expect((await repo.loadScore(scoreId))?.score).toBe(67)
  })

  it("an unknown action is reported, not invented", async () => {
    const { repo, scoreId } = await withActions()
    const result = await moveAction({
      repo,
      scoreId,
      actionId: "action_nope",
      state: "done",
      now: NOW,
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe("action-not-found")
  })
})

describe("toAiContext is an interface, and calling it says so", () => {
  it("it throws rather than returning a hollow object", () => {
    // A `return {} as FoodSystemAiContext` would satisfy every type and every
    // source scan while pretending the package exists.
    expect(() => toAiContext(compose())).toThrow(/interface, not an implementation/)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   10 · THE TYPE-LEVEL INVARIANTS

   ── WHY THESE READ SOURCE WHEN EVERYTHING ELSE CALLS ───────────────────────

   Four sabotage cases widened a TYPE: a fourth `ActionState`, an eighth
   `SectionId`, an `improvement` field on `ResolvedAction`, and
   `scoresAvailable: number`. Every one of them slipped, and they slipped for a
   reason worth writing down: THIS HARNESS RUNS VITEST, AND VITEST DOES NOT
   TYPE-CHECK. A widened union changes no runtime value, so `Object.keys` and
   `toEqual` see exactly what they saw before.

   `tsc --noEmit` is in the gate and would catch some of them — but not all: a
   union with an eighth member is perfectly well-typed until something tries to
   be exhaustive over it. So the invariant is asserted where it lives, in the
   source, and the stripper keeps it from reading its own documentation.
   ════════════════════════════════════════════════════════════════════════════ */

describe("the type-level invariants, asserted in source", () => {
  const strip = (file: string) =>
    readFileSync(file, "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")

  it("the two version anchors are DISTINCT values", () => {
    /*
     * Collapsing them is the quiet version of the mistake this gate's
     * amendment fixed: one anchor cannot say both "the policy that decided" and
     * "the wording that was shown", because they move independently.
     */
    expect(SYSTEM_MODEL_VERSION).not.toBe(ACTION_SET_VERSION)
    expect(SYSTEM_MODEL_VERSION).toMatch(/^system-model-/)
    expect(ACTION_SET_VERSION).toMatch(/^actions-/)
  })

  it("ActionState has exactly three members, pinned by value", () => {
    expect([...ACTION_STATES]).toEqual(["planned", "done", "skipped"])
    const src = strip("lib/fss/persistence/repository.ts")
    const match = src.match(/export type ActionState\s*=\s*([^\n]+)/)
    expect(match).toBeTruthy()
    expect(match?.[1].match(/"/g)?.length, "a fourth state was added to the union").toBe(6)
  })

  it("SectionId has exactly seven members, in the source and at runtime", () => {
    expect(SECTION_ORDER).toHaveLength(7)
    const src = strip("lib/fss/presentation/system.ts")
    const match = src.match(/export type SectionId\s*=\s*([^\n]+)/)
    expect(match).toBeTruthy()
    expect(match?.[1].match(/"/g)?.length, "an eighth section was added to the union").toBe(14)
  })

  it("ResolvedAction declares no outcome field", () => {
    /*
     * The runtime key check above cannot see this: adding `improvement: string`
     * to the interface leaves the composed object unchanged.
     */
    const src = strip("lib/fss/system/types.ts")
    const block = src.slice(
      src.indexOf("export interface ResolvedAction"),
      src.indexOf("export type ReviewPoint"),
    )
    expect(block.length).toBeGreaterThan(50)
    expect(block).not.toMatch(
      /readonly\s+(improvement|benefit|effect|outcome|boost|progress)\w*\s*[?:]/i,
    )
  })

  it("scoresAvailable is the LITERAL 1, not a number", () => {
    // `number` would make a second score representable without Gate 5 having
    // decided anything, which is the whole point of the literal.
    const src = strip("lib/fss/system/types.ts")
    expect(src).toMatch(/readonly scoresAvailable:\s*1\b/)
    expect(src).not.toMatch(/readonly scoresAvailable:\s*number/)
  })

  it("the result component imports no selector, not merely calls none", () => {
    /*
     * The first version of this guard checked for `resolvePriorities(`. An
     * IMPORT has no parenthesis, so adding the import back — the first half of
     * reintroducing the second selector — slipped straight past it.
     */
    const src = strip("components/fss/candidate-result.tsx")
    expect(src).not.toMatch(/import[\s\S]{0,120}(resolvePriorities|buildPlan)/)
    expect(src).not.toMatch(/resolvePriorities\(|buildPlan\(/)
  })

  it("the unresolvable review point is prospective too, not past tense", () => {
    // Both branches. The first version of this assertion only checked the
    // branch that HAS a date, so swapping the other one's sentence slipped.
    const point = resolveReviewPoint({
      establishedAt: NOW,
      systemModelVersion: "system-model-v0.9",
    })
    expect(point.state).toBe("unresolvable")
    expect(point.comparabilityRule).toMatch(/can only be compared/)
    expect(
      point.comparabilityRule,
      "past tense asserts a change between two results somebody may not have",
    ).not.toMatch(/changed between these two results/)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   11 · IDENTITY
   ════════════════════════════════════════════════════════════════════════════ */

describe("ids are minted, not derived from content", () => {
  it("two calls differ, because two identical walks are two Food Systems", () => {
    expect(newId("system")).not.toBe(newId("system"))
  })

  it("each carries its prefix, so a tampered pointer is recognisable", () => {
    expect(newId("score").startsWith("score_")).toBe(true)
    expect(isMintedId(newId("action"), "action")).toBe(true)
    expect(isMintedId(newId("action"), "score")).toBe(false)
    expect(isMintedId("candidate")).toBe(false)
    expect(isMintedId("")).toBe(false)
  })
})
