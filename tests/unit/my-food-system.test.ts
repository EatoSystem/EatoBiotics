import { describe, it, expect } from "vitest"
import { existsSync, readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import { DOMAIN_SCHEMA_VERSION, FSS_DOMAINS } from "@/lib/fss/questions/domain-schema"
import { compareSystems } from "@/lib/fss/system/compare-systems"
import { OBSERVATION_COMPARISONS, readWhatChanged } from "@/lib/fss/system/changed"
import {
  CHANGED_COPY,
  COMPARATIVE_COPY_REVIEW,
  DOMAIN_CHANGE_COPY,
} from "@/lib/fss/presentation/changed"
import { CONSTRAINT_LABELS, SPOKEN_ORDER } from "@/lib/fss/presentation/plan"
import { canCompare } from "@/lib/fss/engine/compare"
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
  type StoredAssessmentDraft,
  type StoredFoodSystem,
  type StoredPlanDecision,
  type StoredPriorityDecision,
  type StoredScore,
} from "@/lib/fss/persistence/repository"
import { establishFoodSystem } from "@/lib/fss/system/establish"
import {
  abandonDraft,
  loadCurrentDraft,
  reconcileIndex,
  startDraft,
  updateDraft,
} from "@/lib/fss/system/draft"
import { loadCurrentFoodSystem } from "@/lib/fss/system/load"
import { moveAction } from "@/lib/fss/system/actions"
import {
  AI_INTENTS,
  INTENT_DENIED,
  INTENT_FIELDS,
  toAiContext,
  type AiIntent,
} from "@/lib/fss/system/ai-context"
import { SYSTEM_MODEL_VERSION } from "@/lib/fss/system/version"
import { isMintedId, newId } from "@/lib/fss/system/identity"
import {
  CLAIM_BASIS_KEYS,
  validateClaimBinding,
  type ClaimBasis,
} from "@/lib/fss/system/ai-claims"
import { priorityIdFor } from "@/lib/fss/action/priority"
import { toStoredPlanDecision, toStoredPriorityDecision } from "@/lib/fss/system/decisions"
import { composeMyFoodSystem } from "@/lib/fss/system/compose"
import { MY_FOOD_SYSTEM_KEYS } from "@/lib/fss/system/types"
import { resolveReviewPoint, daysUntil } from "@/lib/fss/system/review"
import {
  LEGACY_ASSESSMENT_ID,
  SYSTEM_CHECKS,
  validateFoodSystem,
} from "@/lib/fss/system/validate"
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

/** Every answer one notch better, so a comparison has real movement to find. */
function allThrees(): Answers {
  return Object.fromEntries(SET.questions.map((q) => [q.id, 3]))
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
    domainSchemaVersion: DOMAIN_SCHEMA_VERSION,
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
      previousSystemId: null,
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

  /*
   * ── NO METHODOLOGY MAY ENTER THE AI LAYER ───────────────────────────────
   *
   * The import-level form of the one-engine rule, and the thing that would
   * erode first: a selection or scoring function imported "just to check".
   * This layer receives VERDICTS AND DECISIONS, never the functions that make
   * them.
   *
   * Pinned BY FILENAME rather than by directory glob. A glob silently covers a
   * new file — which sounds like a feature until the directory is renamed and
   * it silently covers nothing. A pinned list makes adding a third AI module a
   * visible diff.
   */
  it("the AI layer imports no methodology", () => {
    const AI_MODULES = ["lib/fss/system/ai-context.ts", "lib/fss/system/ai-claims.ts"]
    const FORBIDDEN = [
      "computeFoodSystemScore",
      "resolvePriorities",
      "buildPlan",
      "canCompare",
      "canCompareDomains",
      "compareSystems",
      "readWhatChanged",
      "getScoreBand",
      "resolveWeights",
      "DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS",
    ]

    for (const file of AI_MODULES) {
      if (!existsSync(file)) continue
      const src = readFileSync(file, "utf-8")
      const imports = [...src.matchAll(/^import[\s\S]*?from "[^"]+"/gm)].map((m) => m[0]).join("\n")
      for (const fn of FORBIDDEN) {
        expect(
          imports.includes(fn),
          `${file} imports ${fn} — the AI layer receives verdicts, not the engines`,
        ).toBe(false)
      }
    }

    // NON-VACUITY: at least one module exists and really does import things.
    const present = AI_MODULES.filter((f) => existsSync(f))
    expect(present.length).toBeGreaterThan(0)
    expect(readFileSync(present[0], "utf-8")).toMatch(/^import/m)
  })

  it("and it has no prompt field, which is the interface's whole content", () => {
    const src = readFileSync("lib/fss/system/ai-context.ts", "utf-8")
    const body = src.slice(src.indexOf("export interface FoodSystemAiContextCeiling"))
    for (const field of ["systemPrompt", "instructions", "narrative", "persona", "tone"]) {
      expect(body, `${field} would be a second source for methodology`).not.toMatch(
        new RegExp(`\\breadonly ${field}\\b`),
      )
    }

    /*
     * ── AND NO METHODOLOGY FIELD, WHICH IS THE SAME DEFECT BY DATA ──────────
     *
     * The import guard above stops a function arriving. This stops the NUMBERS
     * arriving without it — weights, band thresholds, a ranking rule — which
     * would let a model recompute a score or a band and reach a figure no
     * deterministic component produced. The ceiling carries values and
     * versions the engine PRODUCED, never the parameters it used.
     */
    for (const field of [
      "weights",
      "weight",
      "bands",
      "bandThresholds",
      "thresholds",
      "ranking",
      "scoringRule",
    ]) {
      expect(body, `${field} would let the model recompute what the engine decided`).not.toMatch(
        new RegExp(`\\breadonly ${field}\\b`),
      )
    }
  })

  /*
   * ── THE COMPARATIVE COPY CANNOT ENTER THIS LAYER AT ALL ─────────────────
   *
   * The behavioural test below ("no intent's object carries a reviewed
   * comparative sentence") catches prose that reaches the built object. This
   * catches it one step earlier, at the import — because a sentence that is in
   * the module is a sentence one edit away from being in the object, and
   * `COMPARATIVE_COPY_REVIEW.state` is "pending".
   *
   * The route it closes is specific: pending copy → model context → newly
   * generated customer copy, which would route around the review entirely
   * through a door the `CANDIDATE_ROOTS` fence does not watch — that fence
   * permits `lib/fss`, and this layer lives there.
   *
   * Pinned by filename for the same reason the methodology guard is: a glob
   * silently covers a new file, and silently covers nothing once the directory
   * is renamed.
   */
  it("the AI layer imports no comparative prose, reviewed or otherwise", () => {
    const AI_MODULES = ["lib/fss/system/ai-context.ts", "lib/fss/system/ai-claims.ts"]
    const present = AI_MODULES.filter((f) => existsSync(f))
    expect(present.length, "both AI modules are gone — is this guard still aimed at anything?")
      .toBeGreaterThan(0)

    for (const file of present) {
      const src = readFileSync(file, "utf-8")
      const imports = [...src.matchAll(/^import[\s\S]*?from "([^"]+)"/gm)].map((m) => m[1])
      for (const specifier of imports) {
        expect(
          /presentation\/changed|presentation\/domains|DOMAIN_CHANGE_COPY/.test(specifier),
          `${file} imports ${specifier} — the AI layer takes facts, never sentences`,
        ).toBe(false)
      }
      // NON-VACUITY: the parser found this file's real imports.
      expect(imports.length, `${file} parsed to zero imports`).toBeGreaterThan(0)
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
  /** Start or stop failing mid-life, so one repo can hold a baseline AND fail. */
  failAt: (prefix: string | undefined) => void
} {
  const store = new Map<string, unknown>()
  const writes: string[] = []
  let failing = options.failAt

  const strict = (key: string, value: unknown) => {
    writes.push(key)
    if (failing && key.startsWith(failing)) {
      throw new RepositoryWriteFailed(key)
    }
    store.set(key, value)
  }

  return {
    backend: "local",
    writable: true,
    writes,
    store,
    failAt(prefix) {
      failing = prefix
    },
    async loadAssessment(id) {
      return (store.get(`assessment.${id}`) as StoredAssessment) ?? null
    },
    async saveAssessment(a) {
      writes.push(`assessment.${a.id}`)
      // Lenient: a failure here is swallowed, as in the real adapter.
      if (!failing || !`assessment.${a.id}`.startsWith(failing)) {
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
    /* ── The draft namespace: lenient, exactly like the real adapter ─────── */
    async loadDraft(id) {
      return (store.get(`assessment.draft.${id}`) as StoredAssessmentDraft) ?? null
    },
    async saveDraft(d) {
      writes.push(`assessment.draft.${d.id}`)
      if (!failing || !`assessment.draft.${d.id}`.startsWith(failing)) {
        store.set(`assessment.draft.${d.id}`, d)
      }
    },
    async deleteDraft(id) {
      writes.push("delete-draft")
      store.delete(`assessment.draft.${id}`)
    },
    async loadCurrentDraftId() {
      return (store.get("assessment.draft.current") as string) ?? null
    },
    async setCurrentDraft(id) {
      store.set("assessment.draft.current", id)
    },
    async clearCurrentDraft() {
      store.delete("assessment.draft.current")
    },
  }
}

let draftSeq = 0

/** A completed draft, ready to be established from. */
function draftFor(answers: Answers, previousSystemId: string | null = null): StoredAssessmentDraft {
  return {
    // NOT derived from `previousSystemId`: a fixture id that embedded it made
    // a substring assertion below match the NEW assessment's key and report it
    // as a write to the OLD system. Distinct, and independent of the chain.
    id: `assessment_fixture_${draftSeq++}`,
    previousSystemId,
    assessmentVersion: SET.assessmentVersion,
    questionSetVersion: SET.questionSetVersion,
    startedAt: "2026-10-01T08:40:00.000Z",
    answers,
    index: 0,
  }
}

function establishArgs(
  repo: FoodSystemRepository,
  answers: Answers = allTwos(),
  previousSystemId: string | null = null,
) {
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
    draft: draftFor(answers, previousSystemId),
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

    /*
     * THE POINTER IS THE LAST THING THAT MAKES ANYTHING TRUE — and the draft
     * deletion comes after it, which is the Gate 5 rule stated as an order:
     *
     *   …records → system.current → delete the draft
     *
     * Clearing the draft before the pointer would discard somebody's answers
     * while the establishment could still fail, leaving them with neither the
     * new system nor the attempt they spent ten minutes on.
     */
    const pointerAt = repo.writes.indexOf("system.current")
    /*
     * The FIRST deletion, not the last. `lastIndexOf` let a mutation that
     * ADDED an early `abandonDraft` slip, because the later one was still
     * after the pointer — so the assertion was true and the defect was real.
     */
    const draftGoneAt = repo.writes.indexOf("delete-draft")
    expect(pointerAt).toBeGreaterThan(-1)
    expect(draftGoneAt, "the draft outlived the commit point").toBeGreaterThan(pointerAt)
    // Nothing else is written after the pointer.
    expect(repo.writes.slice(pointerAt + 1).filter((w) => w !== "delete-draft")).toEqual([])
  })

  /*
   * ── THE SCORE RECORDS WHICH PARTS IT IS MADE OF ─────────────────────────
   *
   * Gate 5 step 2a. Read back through the repository rather than asserted on
   * the object `establishFoodSystem` returned, because the question is whether
   * the field SURVIVED THE WRITE — a value present in memory and absent from
   * storage is the whole defect, and it is what the GLP-1-shaped version of
   * this bug looks like.
   *
   * Without this, dropping the field from the write site changes no behaviour
   * any test can see: the type says required, `tsc` would catch a missing
   * literal, and nothing in vitest would notice a `delete` or a conditional
   * spread. The sabotage case needs a behavioural assertion to land on.
   */
  it("the stored score records the domain schema it was composed under", async () => {
    const repo = memoryRepo()
    const result = await establishFoodSystem(establishArgs(repo))
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const stored = await repo.loadScore(result.scoreId)
    expect(stored).not.toBeNull()
    expect(stored?.domainSchemaVersion).toBe(DOMAIN_SCHEMA_VERSION)

    /*
     * And it is NOT inside provenance. The five keys are pinned by value in
     * `fss-action-model.test.ts` for the reason `repository.ts` gives —
     * widening them changes what every score already written claims about
     * itself — so this asserts the field landed beside provenance, not in it.
     */
    expect(Object.keys(stored?.provenance ?? {})).not.toContain("domainSchemaVersion")
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

/* ════════════════════════════════════════════════════════════════════════════
   GATE 5 step 1 · THE DEFINING INVARIANT OF LONGITUDINAL EATOBIOTICS

     A reassessment creates a new Food System state in history.
     It never rewrites the one that came before it.

   Every assertion below fails on the Gate 4 code, and not subtly: the
   in-progress assessment was written to the literal `"candidate"`, so a second
   assessment landed on the first one's record. `validateFoodSystem` could not
   catch it either, because its identity check compared `"candidate"` with
   `"candidate"` and found them equal — the baseline would have kept its score,
   its decisions and its actions while silently presenting the NEW answers as
   the evidence behind them.
   ════════════════════════════════════════════════════════════════════════════ */

describe("a reassessment creates history and never rewrites it", () => {
  /** Everything stored about one system, as bytes, for comparison. */
  function snapshotOf(repo: ReturnType<typeof memoryRepo>, systemId: string): string {
    const system = repo.store.get(`system.${systemId}`) as StoredFoodSystem
    const keys = [
      `system.${systemId}`,
      `assessment.${system.assessmentId}`,
      `score.${system.scoreId}`,
      `priority-decision.${system.scoreId}`,
      `plan-decision.${system.scoreId}`,
      `actions.${system.scoreId}`,
    ]
    return JSON.stringify(keys.map((k) => [k, repo.store.get(k) ?? null]))
  }

  async function establishChain(repo: ReturnType<typeof memoryRepo>, sheets: Answers[]) {
    const ids: string[] = []
    for (const answers of sheets) {
      const previousSystemId = await repo.loadCurrentSystemId()
      const result = await establishFoodSystem(establishArgs(repo, answers, previousSystemId))
      expect(result.ok, "fixture: establishment failed").toBe(true)
      if (!result.ok) throw new Error("fixture")
      ids.push(result.systemId)
    }
    return ids
  }

  it("THE INVARIANT — every baseline record is byte-identical afterwards", async () => {
    const repo = memoryRepo()
    const [a] = await establishChain(repo, [allTwos()])
    const baselineBefore = snapshotOf(repo, a)

    await establishChain(repo, [fermentedAtZero()])

    expect(
      snapshotOf(repo, a),
      "the baseline changed when a second system was established",
    ).toBe(baselineBefore)
  })

  it("the chain links backwards, and only the baseline has no predecessor", async () => {
    const repo = memoryRepo()
    const [a, b, c] = await establishChain(repo, [allTwos(), fermentedAtZero(), allTwos()])

    const sys = (id: string) => repo.store.get(`system.${id}`) as StoredFoodSystem
    expect(sys(a).previousSystemId, "the baseline must have no predecessor").toBeNull()
    expect(sys(b).previousSystemId).toBe(a)
    expect(sys(c).previousSystemId).toBe(b)

    // And the current pointer is the newest, not the first.
    expect(await repo.loadCurrentSystemId()).toBe(c)
  })

  it("A AND B are both byte-identical after C is created", async () => {
    const repo = memoryRepo()
    const [a, b] = await establishChain(repo, [allTwos(), fermentedAtZero()])
    const before = [snapshotOf(repo, a), snapshotOf(repo, b)]

    await establishChain(repo, [allTwos()])

    expect([snapshotOf(repo, a), snapshotOf(repo, b)]).toEqual(before)
  })

  it("no system is ever updated to point FORWARD at its successor", async () => {
    /*
     * The other half of "backward-linked". A forward pointer would mean
     * writing to a finished system every time a later one is created, which is
     * two-sided mutation — and is the thing that makes "immutable" stop being
     * true while every byte-comparison above still passes, because the
     * comparison would simply include the mutated field.
     */
    const repo = memoryRepo()
    const [a] = await establishChain(repo, [allTwos()])
    const writesBefore = [...repo.writes]

    await establishChain(repo, [fermentedAtZero()])

    /*
     * EXACT keys belonging to A, not a substring sweep. The first version of
     * this used `k.includes(a)` and matched the new assessment's key, because
     * the fixture happened to build its id out of the predecessor's — a test
     * reporting a defect that was not there, which is as bad as missing one.
     */
    const systemA = repo.store.get(`system.${a}`) as StoredFoodSystem
    const keysOfA = new Set([
      `system.${a}`,
      `assessment.${systemA.assessmentId}`,
      `score.${systemA.scoreId}`,
      `priority-decision.${systemA.scoreId}`,
      `plan-decision.${systemA.scoreId}`,
      `actions.${systemA.scoreId}`,
    ])
    const touchedA = repo.writes.slice(writesBefore.length).filter((k) => keysOfA.has(k))
    expect(touchedA, "an earlier system's records were written to").toEqual([])

    const src = readFileSync("lib/fss/system/establish.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    expect(src, "establishment must never write a successor onto an older record").not.toMatch(
      /nextSystemId|successorId|saveSystem\(\s*previous/,
    )
  })

  it("every assessment in the chain has its own minted id", async () => {
    const repo = memoryRepo()
    const [a, b] = await establishChain(repo, [allTwos(), fermentedAtZero()])
    const sys = (id: string) => repo.store.get(`system.${id}`) as StoredFoodSystem

    expect(sys(a).assessmentId).not.toBe(sys(b).assessmentId)
    expect(sys(a).assessmentId).not.toBe("candidate")
    // Both records still exist. The second did not land on the first.
    expect(repo.store.get(`assessment.${sys(a).assessmentId}`)).toBeTruthy()
    expect(repo.store.get(`assessment.${sys(b).assessmentId}`)).toBeTruthy()
  })

  it("the link is the attempt's predecessor, not whatever is current at the end", async () => {
    /*
     * An attempt begun against A must chain to A, even if the pointer moved in
     * between — two tabs, or a reassessment finished elsewhere. Reading the
     * pointer at completion would claim a lineage that never happened.
     *
     * Nothing distinguished the two while every fixture had them equal, which
     * is how a sabotage case found it rather than a test.
     */
    const repo = memoryRepo()
    const [a] = await establishChain(repo, [allTwos()])

    // An attempt begun against A…
    const draft = draftFor(fermentedAtZero(), a)

    // …while the pointer moves to B underneath it.
    const [b] = await establishChain(repo, [allTwos()])
    expect(await repo.loadCurrentSystemId()).toBe(b)

    const result = await establishFoodSystem({
      repo,
      set: SET,
      answers: fermentedAtZero(),
      score: computeFoodSystemScore({
        set: SET,
        answers: fermentedAtZero(),
        weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
        fixtureContext: FIXTURE,
      }),
      draft,
      now: NOW,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const made = repo.store.get(`system.${result.systemId}`) as StoredFoodSystem
    expect(made.previousSystemId, "the chain followed the pointer, not the attempt").toBe(a)
  })

  it("a system naming a predecessor that is gone FAILS CLOSED", async () => {
    const repo = memoryRepo()
    const [a] = await establishChain(repo, [allTwos(), fermentedAtZero()])
    repo.store.delete(`system.${a}`)

    const load = await loadCurrentFoodSystem({ repo, set: SET })
    expect(load.state).toBe("unavailable")
    if (load.state !== "unavailable") return
    expect(load.failed).toBe("previous-system-unresolvable")
  })

  it("a legacy `candidate` assessment is accepted, and never rewritten", () => {
    /*
     * Anyone holding a baseline from before Gate 5 has one. It is valid — it
     * simply predates minted ids — and silently re-keying it would be exactly
     * the rewrite this gate refuses, performed on the record the whole
     * invariant is about.
     */
    const r = records()
    const legacy = validateFoodSystem({
      ...r,
      system: { ...r.system, assessmentId: LEGACY_ASSESSMENT_ID },
      assessment: { ...r.assessment, id: LEGACY_ASSESSMENT_ID },
      score: { ...r.score, assessmentId: LEGACY_ASSESSMENT_ID },
    })
    expect(legacy.ok).toBe(true)

    // But an id that is neither minted nor the legacy one is refused.
    const nonsense = validateFoodSystem({
      ...r,
      system: { ...r.system, assessmentId: "whatever" },
      assessment: { ...r.assessment, id: "whatever" },
      score: { ...r.score, assessmentId: "whatever" },
    })
    expect(nonsense.ok).toBe(false)
    if (nonsense.ok) return
    expect(nonsense.failed).toBe("assessment-id-not-minted")
  })
})

describe("an attempt in progress changes nothing that is established", () => {
  it("ABANDONED REASSESSMENT — the baseline is still current and unchanged", async () => {
    const repo = memoryRepo()
    const established = await establishFoodSystem(establishArgs(repo))
    expect(established.ok).toBe(true)
    if (!established.ok) return

    const before = JSON.stringify([...repo.store.entries()].sort())
    const currentBefore = await repo.loadCurrentSystemId()

    // Begin an attempt and answer several questions into it.
    const draft = await startDraft({
      repo,
      set: SET,
      previousSystemId: currentBefore,
      now: NOW,
    })
    const partial = Object.fromEntries(SET.questions.slice(0, 5).map((q) => [q.id, 1]))
    await updateDraft({ repo, draft, answers: partial, index: 5 })

    // The pointer has not moved and the Food System still loads.
    expect(await repo.loadCurrentSystemId()).toBe(currentBefore)
    expect((await loadCurrentFoodSystem({ repo, set: SET })).state).toBe("ready")

    // Abandon it. Everything that was there before is exactly as it was.
    await abandonDraft({ repo, draftId: draft.id })
    expect(await repo.loadCurrentSystemId()).toBe(currentBefore)
    expect(JSON.stringify([...repo.store.entries()].sort())).toBe(before)
  })

  it("FAILED SECOND ESTABLISHMENT — at every stage, the baseline stays current", async () => {
    for (const failAt of ["score.", "priority-decision.", "actions.", "system.system_"]) {
      const repo = memoryRepo()
      const first = await establishFoodSystem(establishArgs(repo))
      expect(first.ok).toBe(true)
      if (!first.ok) return

      const baselineBefore = JSON.stringify([...repo.store.entries()].sort())

      // Now make the SECOND establishment fail at this stage.
      repo.failAt(failAt)
      const second = await establishFoodSystem(
        establishArgs(repo, fermentedAtZero(), first.systemId),
      )
      repo.failAt(undefined)

      expect(second.ok, `${failAt} should have failed`).toBe(false)
      expect(await repo.loadCurrentSystemId(), `${failAt} moved the pointer`).toBe(first.systemId)

      const load = await loadCurrentFoodSystem({ repo, set: SET })
      expect(load.state, `${failAt} left a partial system current`).toBe("ready")
      if (load.state === "ready") expect(load.system.systemId).toBe(first.systemId)

      // Orphans may exist; the BASELINE's own records are untouched.
      const stillThere = JSON.stringify(
        [...repo.store.entries()].filter(([k]) => baselineBefore.includes(k)).sort(),
      )
      expect(stillThere.length).toBeGreaterThan(0)
    }
  })

  it("a failed establishment leaves the DRAFT recoverable, not discarded", async () => {
    const repo = memoryRepo()
    const first = await establishFoodSystem(establishArgs(repo))
    if (!first.ok) throw new Error("fixture")

    const draft = await startDraft({
      repo,
      set: SET,
      previousSystemId: first.systemId,
      now: NOW,
    })
    await updateDraft({ repo, draft, answers: allTwos(), index: 3 })

    repo.failAt("score.")
    const second = await establishFoodSystem({
      repo,
      set: SET,
      answers: allTwos(),
      score: computeFoodSystemScore({
        set: SET,
        answers: allTwos(),
        weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
        fixtureContext: FIXTURE,
      }),
      draft,
      now: NOW,
    })
    repo.failAt(undefined)

    expect(second.ok).toBe(false)
    // The attempt survives, with its answers, so it can be resumed.
    const after = await loadCurrentDraft({ repo, set: SET })
    expect(after.state, "a failure discarded somebody's answers").toBe("open")
    if (after.state !== "open") return
    expect(Object.keys(after.draft.answers).length).toBeGreaterThan(0)
  })

  it("a stale draft is reported, not resumed and not deleted", async () => {
    const repo = memoryRepo()
    const draft = await startDraft({ repo, set: SET, previousSystemId: null, now: NOW })
    await updateDraft({ repo, draft, answers: allTwos(), index: 4 })

    // The instrument moved under the attempt.
    const moved = { ...SET, questionSetVersion: "questions-v2.0" }
    const state = await loadCurrentDraft({ repo, set: moved })
    expect(state.state).toBe("stale")
    // And the answers are still there — the person decides, not the code.
    expect(await repo.loadDraft(draft.id)).toBeTruthy()
  })

  it("the resume cursor is a hint; the answers are the authority", () => {
    const answered = Object.fromEntries(SET.questions.slice(0, 6).map((q) => [q.id, 2]))
    const base = { ...draftFor(answered), answers: answered }

    // Paged backwards and left: honoured, because it does not skip work.
    expect(reconcileIndex(SET, { ...base, index: 2 })).toBe(2)
    /*
     * IN RANGE and still too far — the case that matters, and the one the
     * first version of this test missed by only ever passing out-of-range
     * numbers, which the bounds check rejected before the reconciliation was
     * reached. A cursor at question 10 with six answers would put somebody in
     * the middle of work they have not done.
     */
    expect(reconcileIndex(SET, { ...base, index: 10 })).toBe(6)
    // Out of range: the answers win too.
    expect(reconcileIndex(SET, { ...base, index: 40 })).toBe(6)
    // Nonsense: the answers win.
    expect(reconcileIndex(SET, { ...base, index: -3 })).toBe(6)
    expect(reconcileIndex(SET, { ...base, index: 9_999 })).toBe(6)
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
    [
      "assessment-missing",
      (r: ReturnType<typeof memoryRepo>) =>
        // A MINTED key now, not the `"candidate"` literal — which is the whole
        // of Gate 5 step 1 visible in one line of a fixture.
        [...r.store.keys()]
          .filter((k) => k.startsWith("assessment_") || /^assessment\.(?!draft)/.test(k))
          .forEach((k) => r.store.delete(k)),
    ],
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
    const assessmentKey = [...repo.store.keys()].find((k) => /^assessment\.(?!draft)/.test(k))!
    repo.store.delete(assessmentKey)

    const load = await loadCurrentFoodSystem({ repo, set: SET })
    expect(load.state).toBe("unavailable")
    expect(await repo.loadCurrentSystemId()).not.toBeNull()
    expect(repo.writes).not.toContain("clear")
    // Only the key the test removed is gone. Nothing else was touched.
    const after = new Set(repo.store.keys())
    expect([...before].filter((k) => !after.has(k))).toEqual([assessmentKey])
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

/* ════════════════════════════════════════════════════════════════════════════
   GATE 6.0 · THE AI CONTEXT BOUNDARY

   ── TWO ANCHORS GATE 6 LEGITIMATELY INVALIDATED ───────────────────────────

   `toAiContext` threw, and two assertions said so: that it throws, and that
   its source says it throws. `ai-context.ts`'s own header anticipated this —
   "Gate 6 is where something uses it" — and this is that gate. Both are
   replaced by the real contract rather than deleted.

   The NO-CALLER guard above is NOT replaced. It scopes to lib/, components/
   and app/, so it keeps passing while the only callers are tests, and it must
   keep passing through the whole of 6.0. It gets re-pointed deliberately when
   6.1 introduces the first real caller.
   ════════════════════════════════════════════════════════════════════════════ */

describe("context is capability: each intent receives exactly its contract", () => {
  const whatChangedFixture = async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())
    return readWhatChanged({ repo, set: SET, systemId: b })
  }

  it("the intents are a closed set of three, pinned by value", () => {
    expect([...AI_INTENTS]).toEqual([
      "explain-current-priority",
      "help-today-action",
      "explain-what-changed",
    ])
  })

  /*
   * ── EXACT, NOT SUBSET, IN BOTH DIRECTIONS ───────────────────────────────
   *
   * A missing required field is as much a failure as an undeclared extra one.
   * Subset-only validation silently drops grounding, and a model missing its
   * grounding substitutes something — which is the whole failure mode this
   * boundary exists to prevent, arriving by omission instead of excess.
   */
  it("every intent's key set EQUALS its declaration, pinned by value", async () => {
    const changed = await whatChangedFixture()
    const expected: Record<AiIntent, readonly string[]> = {
      "explain-current-priority": [
        "claimBoundary",
        "decisionsUnresolvable",
        "priority",
        "provenance",
        "systemId",
        "systemModelVersion",
      ],
      "help-today-action": [
        "actionSetVersion",
        "claimBoundary",
        "contextAnswered",
        "limitingConstraints",
        "priority",
        "systemId",
        "todayAction",
      ],
      "explain-what-changed": [
        "claimBoundary",
        "comparisonVerdict",
        "previousSystemId",
        "provenance",
        "systemId",
        "whatChanged",
      ],
    }

    for (const intent of AI_INTENTS) {
      const ctx = toAiContext(intent, { system: compose(), changed })
      expect(Object.keys(ctx).sort(), `${intent} does not match its contract`).toEqual(
        [...expected[intent]],
      )
      // And it matches the DECLARATION, not just this list.
      expect(Object.keys(ctx).sort()).toEqual([...INTENT_FIELDS[intent]].sort())
    }
  })

  /*
   * The denied list is the reviewed statement of the limit, so it is asserted
   * against the built object rather than only against the declaration — `not
   * in`, never "is undefined". A field present and undefined has still been
   * handed over.
   */
  it("no denied field is present on any intent's object", async () => {
    const changed = await whatChangedFixture()
    for (const intent of AI_INTENTS) {
      const ctx = toAiContext(intent, { system: compose(), changed }) as Record<string, unknown>
      for (const denied of INTENT_DENIED[intent]) {
        expect(denied in ctx, `${intent} received denied field "${denied}"`).toBe(false)
      }
    }
  })

  it("the declaration and the deny-list never intersect", () => {
    for (const intent of AI_INTENTS) {
      const allowed = new Set<string>(INTENT_FIELDS[intent])
      for (const denied of INTENT_DENIED[intent]) {
        expect(allowed.has(denied), `${intent} both allows and denies "${denied}"`).toBe(false)
      }
      // NON-VACUITY: both lists are real.
      expect(INTENT_FIELDS[intent].length).toBeGreaterThan(3)
      expect(INTENT_DENIED[intent].length).toBeGreaterThan(3)
    }
  })

  /*
   * ── THE TWO TIGHTENINGS, ASSERTED ON THE REAL OBJECT ────────────────────
   *
   * Both exist so that `toAiContext` makes no relevance judgement of its own,
   * which would be selection by a quieter name.
   */
  it("the priority intent gets rank and a count, NOT the other four scores", () => {
    const ctx = toAiContext("explain-current-priority", { system: compose() })
    expect("domains" in ctx, "all five domain scores reached the model").toBe(false)
    expect(ctx.priority.rank).toBe(0)
    expect(ctx.priority.scoredDomainCount).toBeGreaterThan(1)
    // "The lowest of five" is explainable from rank + count alone.
    expect(typeof ctx.priority.domainScore).toBe("number")
    expect(ctx.priority.evidence.length).toBeGreaterThan(0)
  })

  it("the action intent gets the LIMITING constraints only", () => {
    // fc1 limiting, the rest not — so a filtered set is distinguishable.
    const ctx = toAiContext("help-today-action", {
      system: compose(records({ ...allTwos(), fc1: 0 })),
    })
    expect(ctx.limitingConstraints).toEqual(["time"])
    expect("observations" in ctx).toBe(false)
    expect("score" in ctx).toBe(false)
  })

  /*
   * The ANSWER Gate 5 reached, not the ingredients to reach another one.
   */
  it("the what-changed intent gets facts and cannot rebuild the comparison", async () => {
    const changed = await whatChangedFixture()
    const ctx = toAiContext("explain-what-changed", { system: compose(), changed })

    expect(ctx.whatChanged?.state).toBe("available")
    expect(ctx.comparisonVerdict?.comparable).toBe(true)
    expect(ctx.previousSystemId).toBeTruthy()

    // No raw answers anywhere in the object, at any depth.
    const serialised = JSON.stringify(ctx)
    expect(serialised).not.toContain("\"answers\"")
    expect("observations" in ctx, "raw observations reached the comparison intent").toBe(false)
  })

  /*
   * ── NO COMPARATIVE PROSE, AT ANY DEPTH ──────────────────────────────────
   *
   * The structural reason this matters: COMPARATIVE_COPY_REVIEW is "pending",
   * so pending copy → model context → generated customer copy would route
   * around the review entirely.
   */
  it("no intent's object carries a reviewed comparative sentence", async () => {
    const changed = await whatChangedFixture()
    for (const intent of AI_INTENTS) {
      const serialised = JSON.stringify(toAiContext(intent, { system: compose(), changed }))
      expect(serialised, `${intent} carried comparative prose`).not.toContain(
        "than at your previous assessment",
      )
      expect(serialised).not.toContain("Your answers described")
    }
  })

  it("the ceiling is a TYPE: no value of that shape is exported", () => {
    const src = readFileSync("lib/fss/system/ai-context.ts", "utf-8")
    // Declared as an interface, never as a const.
    expect(src).toMatch(/export interface FoodSystemAiContextCeiling/)
    expect(src).not.toMatch(/export const (?:FOOD_SYSTEM_AI_CONTEXT|ceiling|CEILING)/)

    /*
     * The escape-hatch scan runs over CODE, not comments. The first version
     * scanned the whole file and fired on the module's own sentence recording
     * that there is no `"raw"` and no `"all"` — a comment documenting an
     * absence, flagged for naming it. The same false-positive class as
     * "caused" inside a disclaimer and `proven` inside `provenance`.
     */
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
    expect(code, "an escape-hatch intent exists").not.toMatch(/"raw"|"all"|"everything"/)
    // NON-VACUITY: the stripped code still holds the module.
    expect(code).toMatch(/export function toAiContext/)
  })

  /*
   * ── THE SOURCE BRIDGE, BECAUSE A TYPE IS INVISIBLE TO VITEST ────────────
   *
   * Fourth application of the lesson this session kept relearning: a field
   * added to the ceiling TYPE and to no intent is invisible to every runtime
   * assertion above. This reads the ceiling's keys out of the source and
   * asserts every one is either granted by some intent or explicitly recorded
   * as ungranted — so a new ceiling field cannot sit there unclassified.
   */
  it("every ceiling field is either granted to an intent or recorded as ungranted", () => {
    const src = readFileSync("lib/fss/system/ai-context.ts", "utf-8")
    const block = /export interface FoodSystemAiContextCeiling \{([\s\S]*?)\n\}/.exec(src)
    expect(block, "the ceiling declaration moved").not.toBeNull()
    /*
     * Anchored to the interface's OWN indentation level. An unanchored match
     * also captured `question` and `answer` from the inline object inside
     * `observations`, which are not ceiling fields and have no intent to be
     * granted to.
     */
    const declared = [...(block?.[1] ?? "").matchAll(/^ {2}readonly (\w+)[?]?:/gm)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(15)

    const granted = new Set<string>(AI_INTENTS.flatMap((i) => [...INTENT_FIELDS[i]]))

    /*
     * Present in the ceiling and granted to NO intent. Each is here because it
     * is a plausible future grant that no current question needs — recorded by
     * value so adding a ceiling field is a visible decision rather than a
     * field nobody classified.
     */
    const UNGRANTED = [
      "actions",
      "completeness",
      "domains",
      "observations",
      "score",
      "scoreId",
      "scoreState",
    ]

    const unclassified = declared.filter((f) => !granted.has(f) && !UNGRANTED.includes(f))
    expect(
      unclassified,
      "a ceiling field is neither granted to an intent nor recorded as ungranted",
    ).toEqual([])

    // Pinned in both directions: an entry that became granted must leave.
    expect(UNGRANTED.filter((f) => granted.has(f))).toEqual([])
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

/* ════════════════════════════════════════════════════════════════════════════
   12 · COMPARING TWO FOOD SYSTEMS — Gate 5 step 2b

   "Can these two be compared, and in what ways?" and nothing beyond that.
   No prose is produced here, so nothing here reads one.
   ════════════════════════════════════════════════════════════════════════════ */

/** Establish a system against `previousSystemId`, at a distinct instant. */
async function chainOne(
  repo: FoodSystemRepository,
  previousSystemId: string | null,
  now: string,
  answers: Answers = allTwos(),
): Promise<string> {
  const result = await establishFoodSystem({
    repo,
    set: SET,
    answers,
    score: computeFoodSystemScore({
      set: SET,
      answers,
      weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
      fixtureContext: FIXTURE,
    }),
    draft: draftFor(answers, previousSystemId),
    now,
  })
  if (!result.ok) throw new Error(`fixture: ${result.failure.reason}`)
  return result.systemId
}

/** Overwrite a stored score in place, to stage a provenance counterfactual. */
async function tamperScore(
  repo: FoodSystemRepository & { store: Map<string, unknown> },
  systemId: string,
  patch: (s: StoredScore) => StoredScore,
): Promise<void> {
  const system = (await repo.loadSystem(systemId))!
  const score = (await repo.loadScore(system.scoreId))!
  repo.store.set(`score.${score.id}`, patch(score))
}

describe("a comparison is a relationship between two systems, not two scores", () => {
  it("a baseline has no predecessor, and that is not a failure", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const c = await compareSystems({ repo, systemId: a })
    expect(c.state).toBe("no-predecessor")
  })

  it("two systems from one instrument are fully comparable", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("fully-comparable")
    if (c.state !== "fully-comparable") return

    expect(c.previousSystemId).toBe(a)
    expect(c.currentSystemId).toBe(b)
    expect(c.score).not.toBeNull()
    // Better answers, so the number went up. Arithmetic, not interpretation.
    expect(c.score?.direction).toBe("higher")
    expect(c.score?.delta).toBe((c.score?.current ?? 0) - (c.score?.previous ?? 0))
    expect(c.domains.length).toBe(FSS_DOMAINS.length)
  })

  it("identical answers twice produce `same`, not manufactured movement", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allTwos())

    const c = await compareSystems({ repo, systemId: b })
    if (c.state !== "fully-comparable") throw new Error(c.state)
    expect(c.score?.delta).toBe(0)
    expect(c.score?.direction).toBe("same")
    for (const d of c.domains) {
      if (d.state === "both-scored") expect(d.direction).toBe("same")
    }
  })

  /*
   * ── THE TEST THAT MAKES "THE PAIR IS RESOLVED, NEVER CHOSEN" PROVABLE ───
   *
   * Asking only "viewing C compares B↔C" cannot distinguish the chain from
   * "the latest two by date" — both answer B↔C. So this views B while C
   * exists and is newer. The chain says A↔B; any date-ordering implementation
   * says B↔C, and fails here.
   */
  it("viewing B compares A↔B even though C exists and is newer", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z")
    const cc = await chainOne(repo, b, "2026-12-01T09:00:00.000Z")

    const viewingB = await compareSystems({ repo, systemId: b })
    expect(viewingB.state).not.toBe("unavailable")
    if (viewingB.state === "no-predecessor" || viewingB.state === "unavailable") return
    expect(viewingB.previousSystemId, "the pair was chosen by date, not by the chain").toBe(a)
    expect(viewingB.currentSystemId).toBe(b)

    const viewingC = await compareSystems({ repo, systemId: cc })
    if (viewingC.state === "no-predecessor" || viewingC.state === "unavailable") return
    expect(viewingC.previousSystemId).toBe(b)
    expect(viewingC.currentSystemId).toBe(cc)
  })

  /* ── The two axes, and the state that exists because they disagree ────── */

  it("a moved QUESTION SET refuses, and still carries both scores", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z")

    await tamperScore(repo, b, (s) => ({
      ...s,
      provenance: { ...s.provenance, questionSetVersion: "questions-v1.1" },
    }))

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("refused")
    if (c.state !== "refused") return
    expect(c.scoreVerdict.comparable).toBe(false)
    // The RECORDS survive a refusal. Only the relationship is suppressed.
    expect(c.previousScore.id).toBeTruthy()
    expect(c.currentScore.id).toBeTruthy()
    expect("score" in c, "a refusal carried a delta").toBe(false)
    expect("domains" in c, "a refusal carried domain deltas").toBe(false)
  })

  it("a moved DOMAIN SCHEMA compares the score and NOT the domains", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())

    await tamperScore(repo, b, (s) => ({ ...s, domainSchemaVersion: "domains-v2.0" }))

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("score-only-comparable")
    if (c.state !== "score-only-comparable") return

    expect(c.scoreVerdict.comparable).toBe(true)
    expect(c.domainVerdict.comparable).toBe(false)
    expect(c.score?.direction).toBe("higher")

    /*
     * THE POINT OF THE THIRD STATE. Not "domains is empty" — the field is not
     * there at all, so a renderer cannot reach for it and find nothing
     * interesting to say. It has nowhere to look.
     */
    expect("domains" in c, "a moved domain schema still produced domain deltas").toBe(false)
  })

  it("a legacy score refuses, and is NOT upgraded by its neighbour", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z")

    await tamperScore(repo, a, (s) => ({ ...s, provenance: LEGACY_PROVENANCE }))

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("refused")
    if (c.state !== "refused") return
    expect(c.scoreVerdict.comparable).toBe(false)
    if (!c.scoreVerdict.comparable) expect(c.scoreVerdict.because).toBe("legacy-unversioned")
  })

  /*
   * A score written before `domainSchemaVersion` existed — the pre-2a record
   * sitting in somebody's localStorage right now. The score still compares;
   * the domains cannot, because nothing records which parts they were.
   */
  it("a score with no recorded domain schema loses its domains, not its score", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())

    await tamperScore(repo, a, (s) => {
      const { domainSchemaVersion: _gone, ...rest } = s
      return rest as StoredScore
    })

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("score-only-comparable")
    if (c.state !== "score-only-comparable") return
    expect(c.score).not.toBeNull()
  })

  /* ── Availability is not comparability ───────────────────────────────── */

  it("a WITHHELD score yields a null change, and still compares", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z")

    await tamperScore(repo, b, (s) => ({ ...s, state: "withheld", score: undefined }))

    const c = await compareSystems({ repo, systemId: b })
    /*
     * NOT "refused". The methods agree; there is simply no number. Reporting a
     * method change here would say something false about why the product is
     * quiet — and treating the absence as 0 would invent a collapse.
     */
    expect(c.state).toBe("fully-comparable")
    if (c.state !== "fully-comparable") return
    expect(c.score, "a withheld score produced a number").toBeNull()
  })

  /* ── Record problems report themselves as record problems ────────────── */

  it("a missing predecessor record is UNAVAILABLE, never a refusal", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z")

    repo.store.delete(`system.${a}`)

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("unavailable")
    if (c.state !== "unavailable") return
    expect(c.failed).toBe("previous-system-record-missing")
  })

  it("a system id that resolves to nothing is unavailable", async () => {
    const repo = memoryRepo()
    const c = await compareSystems({ repo, systemId: "system_nope" })
    expect(c.state).toBe("unavailable")
    if (c.state !== "unavailable") return
    expect(c.failed).toBe("system-record-missing")
  })

  /*
   * The schema version said these were composed of the same parts and they are
   * not. That is provenance having stopped being reliable, so it FAILS rather
   * than quietly comparing the intersection — the same posture `canCompare`
   * takes when a method version lies about its question set.
   */
  it("agreeing schema versions over disagreeing domain sets FAILS", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z")

    await tamperScore(repo, b, (s) => ({
      ...s,
      domains: [...s.domains.slice(1), { domain: "hydration", state: "scored", score: 50 }],
    }))

    const c = await compareSystems({ repo, systemId: b })
    expect(c.state).toBe("unavailable")
    if (c.state !== "unavailable") return
    expect(c.failed).toBe("domain-sets-disagree")
  })
})

describe("the comparison carries facts, and has nowhere to put a sentence", () => {
  /*
   * A KEY-SET PIN, the same instrument that keeps `ScoreProvenance` at five
   * fields. Adding `headline: string` — or any other prose field — fails here
   * rather than shipping, which is what makes "this module writes no prose" a
   * property instead of a comment.
   */
  it("each state's keys are pinned by value", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())

    const full = await compareSystems({ repo, systemId: b })
    expect(Object.keys(full).sort()).toEqual([
      "currentScore",
      "currentSystemId",
      "domainVerdict",
      "domains",
      "previousScore",
      "previousSystemId",
      "score",
      "scoreVerdict",
      "state",
    ])

    await tamperScore(repo, b, (s) => ({ ...s, domainSchemaVersion: "domains-v2.0" }))
    const scoreOnly = await compareSystems({ repo, systemId: b })
    expect(Object.keys(scoreOnly).sort()).toEqual([
      "currentScore",
      "currentSystemId",
      "domainVerdict",
      "previousScore",
      "previousSystemId",
      "score",
      "scoreVerdict",
      "state",
    ])

    await tamperScore(repo, b, (s) => ({
      ...s,
      provenance: { ...s.provenance, fssMethodVersion: "fss-v2.0" },
    }))
    const refused = await compareSystems({ repo, systemId: b })
    expect(Object.keys(refused).sort()).toEqual([
      "currentScore",
      "currentSystemId",
      "domainVerdict",
      "previousScore",
      "previousSystemId",
      "scoreVerdict",
      "state",
    ])
  })

  it("the module reaches for no interpretation and no selection engine", () => {
    const src = readFileSync("lib/fss/system/compare-systems.ts", "utf8")
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

    // `interpretation-v1.0` is deliberately unregistered and getScoreBand throws.
    expect(code).not.toMatch(/getScoreBand|interpretation|scoreBand/i)
    // A comparison must not re-decide anything. B owns its own decisions.
    expect(code).not.toMatch(/resolvePriorities|buildPlan/)
    // And it resolves the pair from the chain, never from the pointer or a date.
    expect(code).not.toMatch(/loadCurrentSystemId|establishedAt/)
  })

  /*
   * NON-VACUITY. The three assertions above are negative, so they would all
   * pass over an empty file. This proves the module really does hold the two
   * things it is supposed to hold.
   */
  it("NON-VACUITY: it really does call both comparability authorities", () => {
    const src = readFileSync("lib/fss/system/compare-systems.ts", "utf8")
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
    expect(code).toMatch(/canCompare\(/)
    expect(code).toMatch(/canCompareDomains\(/)
    expect(code).toMatch(/previousSystemId/)
  })
})

/*
 * NO SUBTRACTION OUTSIDE THE COMPARISON MODULE.
 *
 * Invariant 3 of step 2b, and it starts from a verified-clean baseline: before
 * this was written, a search of these roots found zero score subtraction. So
 * the guard grandfathers nothing, and the first component that computes its own
 * delta fails it.
 */
describe("only the comparison module subtracts two scores", () => {
  it("no candidate surface computes its own delta", () => {
    const files = execSync(
      "git ls-files lib/fss components/fss app/preview/food-system-v1 " +
        "&& git ls-files --others --exclude-standard lib/fss components/fss app/preview/food-system-v1",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter((f) => /\.tsx?$/.test(f))
      .filter((f) => f !== "lib/fss/system/compare-systems.ts")

    expect(files.length).toBeGreaterThan(10)

    /*
     * BOTH SIDES must be score-ish, because a delta is a subtraction between
     * two score-like things. The first draft of this rule only constrained the
     * LEFT side and produced ten false positives — every one a hyphen inside a
     * string literal (`"score-missing"`, `"previous-system-unresolvable"`) or a
     * kebab-case import path (`score-ring`). Asking for both sides rejects all
     * of them on their own terms: `missing`, `ring` and `system` are not
     * scores. It also leaves `i - 1` and date arithmetic alone, which matters
     * because a guard that cries wolf gets switched off.
     *
     * HONEST ABOUT ITS REACH: `getScore(b) - getScore(a)` is not matched, and
     * nor is a subtraction against a literal. This catches the natural way a
     * component would compute a delta, not every conceivable spelling — the
     * TYPE is what makes the refused and score-only states unrenderable, and
     * this is the backstop for the surfaces the type does not reach.
     */
    const TOKEN = String.raw`(?:\w+\??\.)*(?:\w*[Ss]core\w*|previous\w*|current\w*|baseline\w*)(?:\??\.\w+)*`
    const SUBTRACTION = new RegExp(`${TOKEN}\\s*-\\s*${TOKEN}`)

    /*
     * NON-VACUITY FOR THE GUARD ITSELF. A rule this specific can be weakened
     * into something that matches nothing, and a passing test would then mean
     * only that the regex is broken. Gate 3.6's claims guard caught 1 of 9
     * interpolated claims for exactly this reason.
     */
    expect(SUBTRACTION.test("const d = current.score - previous.score")).toBe(true)
    expect(SUBTRACTION.test("const d = b.score - a.score")).toBe(true)
    expect(SUBTRACTION.test("const d = currentScore - previousScore")).toBe(true)
    expect(SUBTRACTION.test('failed: "score-missing",')).toBe(false)
    expect(SUBTRACTION.test("for (let i = n - 1; i >= 0; i--)")).toBe(false)

    const offenders: string[] = []
    for (const file of files) {
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
      for (const [i, line] of code.split("\n").entries()) {
        // A sort comparator orders one list at one moment — see the note in
        // the lib/account guard below for why that needs no verdict.
        if (/\.sort\(/.test(line)) continue
        if (SUBTRACTION.test(line)) offenders.push(`${file}:${i + 1} ${line.trim()}`)
      }
    }

    expect(
      offenders,
      "a delta computed outside lib/fss/system/compare-systems.ts, where canCompare cannot gate it",
    ).toEqual([])
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   13 · WHAT CHANGED — Gate 5 step 2c

   2b decided whether a comparison is allowed. This is what may be said about
   an allowed one — and the facts are asserted before any sentence is.
   ════════════════════════════════════════════════════════════════════════════ */

describe("what changed is structured before it is phrased", () => {
  it("a baseline has nothing to compare, and that is not a failure", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const w = await readWhatChanged({ repo, set: SET, systemId: a })
    expect(w.state).toBe("no-predecessor")
  })

  /*
   * ── THE ACTIONS COUNTED ARE THE PREVIOUS SYSTEM'S ───────────────────────
   *
   * The single most consequential call in this step, and the one that is wrong
   * in the obvious implementation. A's actions are the plan that was in force
   * during the period being compared — what the person marked while living
   * between the two assessments. B's were created moments ago by the
   * reassessment and are all still `planned`.
   *
   * So counting B's would show "0 of N done" immediately after EVERY
   * reassessment, erasing the period's record at the exact moment somebody
   * came back to look at it.
   */
  it("counts the actions from the system being compared FROM, not the new one", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())

    // Live the period: mark A's plan.
    const aSystem = (await repo.loadSystem(a))!
    const aActions = await repo.loadActions(aSystem.scoreId)
    expect(aActions.length).toBeGreaterThan(1)
    await moveAction({
      repo,
      scoreId: aSystem.scoreId,
      actionId: aActions[0].id,
      state: "done",
      now: "2026-10-15T09:00:00.000Z",
    })
    /*
     * And one SKIPPED, which the first version of this test did not do — so
     * sabotage 1341 (a total that adds only `planned + done`) slipped. A
     * skipped action silently leaving the denominator turns "7 of 9" into
     * "7 of 8" and quietly improves the person's record for them.
     */
    await moveAction({
      repo,
      scoreId: aSystem.scoreId,
      actionId: aActions[1].id,
      state: "skipped",
      now: "2026-10-16T09:00:00.000Z",
    })

    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())
    const w = await readWhatChanged({ repo, set: SET, systemId: b })
    if (w.state !== "available") throw new Error(w.state)

    expect(w.actions.done, "the new system's untouched plan was counted").toBe(1)
    expect(w.actions.skipped).toBe(1)
    expect(w.actions.planned).toBe(aActions.length - 2)
    // THE DENOMINATOR COVERS ALL THREE STATES, skipped included.
    expect(w.actions.total, "a state dropped out of the total").toBe(aActions.length)
    expect(w.actions.total).toBe(w.actions.planned + w.actions.done + w.actions.skipped)
    // And the new system's own actions really were all still planned.
    const bSystem = (await repo.loadSystem(b))!
    const bActions = await repo.loadActions(bSystem.scoreId)
    expect(bActions.every((x) => x.state === "planned")).toBe(true)
  })

  it("the unscored classes are present when the score verdict permits", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())

    const w = await readWhatChanged({ repo, set: SET, systemId: b })
    if (w.state !== "available") throw new Error(w.state)

    expect(w.observations?.length).toBeGreaterThan(0)
    expect(w.context?.length).toBe(4)

    // Every answer moved 2 → 3, so every observation changed its selection.
    expect(w.observations?.every((o) => o.state === "changed-selection")).toBe(true)

    /*
     * AN OBSERVATION HAS NO DIRECTION AND NO NUMBER. Asserted on the real
     * object rather than on the type, because a type is invisible to vitest —
     * the Gate 4 lesson. Both answers are carried so a surface can QUOTE them.
     */
    for (const o of w.observations ?? []) {
      expect(Object.keys(o).sort()).toEqual([
        "current",
        "order",
        "previous",
        "question",
        "questionId",
        "state",
      ])
      expect(typeof o.previous).toBe("string")
      expect(typeof o.current).toBe("string")
    }

    /* A CONTEXT CHANGE CARRIES NO VALUE. Three states and a name. */
    for (const c of w.context ?? []) {
      expect(Object.keys(c).sort()).toEqual(["constraint", "state"])
    }
  })

  /*
   * The boundary flagged in 2b and taken rather than invented: observations
   * have no provenance, but comparing two answers still needs the same
   * question set — and `canCompare` already refuses `different-question-set`.
   * So a refused score verdict declines them too, rather than a sixth axis.
   */
  it("a refused score verdict withholds the observations ENTIRELY", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())

    await tamperScore(repo, b, (s) => ({
      ...s,
      provenance: { ...s.provenance, questionSetVersion: "questions-v1.1" },
    }))

    const w = await readWhatChanged({ repo, set: SET, systemId: b })
    if (w.state !== "available") throw new Error(w.state)

    /*
     * ABSENT, not empty. An empty list renders as "nothing changed", which is
     * a claim — and the honest statement is that we cannot tell.
     */
    expect("observations" in w, "a refused comparison still compared answers").toBe(false)
    expect("context" in w).toBe(false)
    // The action facts survive: counting what somebody marked needs no permission.
    expect(w.actions.total).toBeGreaterThan(0)
  })

  it("a moved domain schema keeps the observations and drops the domains", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())
    await tamperScore(repo, b, (s) => ({ ...s, domainSchemaVersion: "domains-v2.0" }))

    const w = await readWhatChanged({ repo, set: SET, systemId: b })
    if (w.state !== "available") throw new Error(w.state)
    expect(w.comparison.state).toBe("score-only-comparable")
    expect("domains" in w.comparison).toBe(false)
    // The questions did not move, so the answers are still comparable.
    expect(w.observations?.length).toBeGreaterThan(0)
  })

  /*
   * A KEY-SET PIN over the aggregate. The thing it exists to refuse is a field
   * that joins two classes — `causedBy`, `because`, `attribution`, or a
   * `headline` that could hold one. Adding any of them fails here.
   */
  it("the aggregate's keys are pinned, so nothing can join two classes", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())
    const w = await readWhatChanged({ repo, set: SET, systemId: b })

    expect(Object.keys(w).sort()).toEqual([
      "actions",
      "comparison",
      "context",
      "observations",
      "state",
    ])
    if (w.state !== "available") return
    expect(Object.keys(w.actions).sort()).toEqual(["done", "planned", "skipped", "total"])
  })

  it("Progress reports two scores available once there is a predecessor", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z")
    const first = await loadCurrentFoodSystem({ repo, set: SET })
    if (first.state !== "ready") throw new Error(first.state)
    expect(first.system.progress.scoresAvailable).toBe(1)

    await chainOne(repo, a, "2026-11-01T09:00:00.000Z")
    const second = await loadCurrentFoodSystem({ repo, set: SET })
    if (second.state !== "ready") throw new Error(second.state)
    expect(second.system.progress.scoresAvailable).toBe(2)

    /*
     * Still no delta anywhere on `ProgressFacts`. `scoresAvailable: 2` says a
     * comparison is possible to attempt; `WhatChanged` says whether it was
     * permitted and what came of it. Pinned so the widening did not smuggle
     * a number in beside it.
     */
    expect(Object.keys(second.system.progress).sort()).toEqual([
      "actionsDone",
      "actionsPlanned",
      "actionsSkipped",
      "baselineEstablishedAt",
      "comparability",
      "scoresAvailable",
    ])
  })

  /* ── A context constraint lifting is never rendered as an outcome ─────── */

  it("a constraint that lifted reads as a changed circumstance", async () => {
    const repo = memoryRepo()
    // fc1 (time) limiting at the first assessment, free at the second.
    const constrained = { ...allTwos(), fc1: 0 }
    const eased = { ...allTwos(), fc1: 3 }
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", constrained)
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", eased)

    const w = await readWhatChanged({ repo, set: SET, systemId: b })
    if (w.state !== "available") throw new Error(w.state)
    const time = w.context?.find((c) => c.constraint === "time")
    expect(time?.state).toBe("disappeared")

    /*
     * THE INSTRUMENT'S ORDER, not alphabetical. Reading the page rendered
     * showed "access, cost, kitchen, time" — an order nothing else in the
     * product uses. `plan.ts` already answered this question, so this asserts
     * the two orders are the SAME array rather than two copies that agree
     * today.
     */
    expect(w.context?.map((c) => c.constraint)).toEqual([...SPOKEN_ORDER])
    expect(SPOKEN_ORDER).toEqual(["time", "cost", "access", "kitchen"])

    // The reviewed sentence describes the person's own description, not a result.
    const sentence = CHANGED_COPY.contextDisappeared(CONSTRAINT_LABELS.time)
    expect(sentence).toMatch(/you no longer describe/i)
    expect(sentence).not.toMatch(/\b(improved|better|easier|progress|thanks to)\b/i)
  })
})

/* ── The reviewed copy ─────────────────────────────────────────────────── */

describe("the What Changed copy says what it may and no more", () => {
  it("fifteen sentences: five domains by three directions, each written out", () => {
    const all: string[] = []
    for (const domain of FSS_DOMAINS) {
      for (const direction of ["higher", "lower", "similar"] as const) {
        const s = DOMAIN_CHANGE_COPY[domain][direction]
        expect(typeof s, `${domain}/${direction} is missing`).toBe("string")
        all.push(s)
      }
    }
    expect(all.length).toBe(15)
    // Written out, not interpolated: no two are the same sentence.
    expect(new Set(all).size).toBe(15)

    for (const s of all) {
      // The anchor is the immediate predecessor, never "baseline".
      expect(s, s).toMatch(/your previous assessment/)
      expect(s, s).not.toMatch(/baseline/i)
      // Measured food behaviour, in the one permitted frame.
      expect(s, s).toMatch(/^Your answers described/)
    }
  })

  /*
   * ── NO CAUSAL, OUTCOME OR BIOLOGICAL VOCABULARY, ANYWHERE IN THE PACK ───
   *
   * Run over every string the module exports — the fifteen plus all of
   * `CHANGED_COPY`, including the values the functions RETURN, because a rule
   * that only reads string constants cannot see a template literal. That is
   * the Gate 3.6 defect, which caught 1 of 9 interpolated claims.
   */
  it("no sentence asserts a cause, an outcome, or a biological state", () => {
    const rendered: string[] = [
      ...Object.values(DOMAIN_CHANGE_COPY).flatMap((d) => Object.values(d)),
      ...Object.values(CHANGED_COPY).map((v) =>
        typeof v === "function"
          ? // Called with plausible arguments, so the interpolated form is read.
            (v as (...a: unknown[]) => string)(7, 9)
          : v,
      ),
    ]
    expect(rendered.length).toBeGreaterThan(30)

    const FORBIDDEN: readonly [string, RegExp][] = [
      ["an asserted cause", /\bbecause (you|your|of)\b|\bcaused\b|\bled to\b|\bresulted in\b/i],
      ["an efficacy claim", /\b(it is|that is|this is) working\b|\bproven\b|\bwhat works for you\b/i],
      ["an outcome attributed to an action", /\b(these|those|your) actions (improved|raised|moved|changed)\b/i],
      ["a score moved by behaviour", /\bmoved your (score|number)\b|\bthis action changed\b/i],
      ["a biological state", /\byour (gut|microbiome|microbes|biology) (is|are|has|have|improved)\b/i],
      ["a personal Biotic state", /\byour (pre|pro|post)biotics?\b/i],
      ["a verdict on the person", /\b(healthier|unhealthier|better overall|worse overall)\b/i],
    ]

    /*
     * ── A DENIAL IS NOT AN ASSERTION, AND MY FIRST RULE COULD NOT TELL ─────
     *
     * This fired on `scoreNote`, which exists to REFUSE causation: "it does
     * not say what caused the difference." A rule that bans the word "caused"
     * bans the sentence that declines to use it — the same false-positive
     * class as `proven` inside `provenance`, and as the unsubscribe footers
     * that tripped the step 0 audit.
     *
     * So each sentence is split on clause boundaries and a clause carrying an
     * explicit negation of the claim is skipped. The assertion is still made
     * on every other clause, so a causal claim sitting NEXT TO a disclaimer is
     * still caught.
     */
    const DENIAL = /\b(?:not|never|cannot|can't|does not|doesn't|do not|don't|no)\b/i

    let clausesChecked = 0
    for (const s of rendered) {
      if (typeof s !== "string") continue
      for (const clause of s.split(/(?<=[.;])\s+|,\s+(?=and |we |it |both )/)) {
        if (DENIAL.test(clause)) continue
        clausesChecked += 1
        for (const [why, rule] of FORBIDDEN) {
          expect(clause.match(rule)?.[0] ?? null, `${why}: ${JSON.stringify(clause)}`).toBeNull()
        }
      }
    }
    // NON-VACUITY: the skip above must not have swallowed the whole pack.
    expect(clausesChecked).toBeGreaterThan(40)

    // NON-VACUITY: the rules bite on the sentences this gate exists to refuse,
    // and the denial skip does NOT swallow an assertion that merely sits near
    // a negation elsewhere in the sentence.
    expect("Because you completed three actions, your score rose".match(FORBIDDEN[0][1])).toBeTruthy()
    expect("Whatever changed, it is working".match(FORBIDDEN[1][1])).toBeTruthy()
    expect("Your gut is improved".match(FORBIDDEN[4][1])).toBeTruthy()
    expect(DENIAL.test("It does not say what caused the difference.")).toBe(true)
    expect(DENIAL.test("Those actions improved your energy.")).toBe(false)
  })

  /*
   * The one sentence touching two classes. It must name both and join
   * neither — so it is asserted to CONTAIN the refusal, not merely to lack a
   * causal verb.
   */
  it("the co-occurrence sentence refuses the join out loud", () => {
    const s = CHANGED_COPY.coOccurrence(7)
    expect(s).toContain("7")
    expect(s).toMatch(/cannot tell you that one produced the other/i)
  })

  it("the action facts say `marked`, because that is what we know", () => {
    expect(CHANGED_COPY.actionsFacts(7, 9)).toBe(
      "You marked 7 of 9 planned actions done during this period.",
    )
    expect(CHANGED_COPY.actionsFacts(7, 9)).not.toMatch(/\b(completed|achieved|did)\b/)
  })
})

/* ── One longitudinal authority, including on the live account surface ──── */

describe("no account surface subtracts two windows without a verdict", () => {
  it("lib/account computes no delta that canCompare has not permitted", () => {
    const files = execSync("git ls-files lib/account", { encoding: "utf8" })
      .split("\n")
      .filter((f) => /\.ts$/.test(f))

    expect(files.length).toBeGreaterThan(5)

    const TOKEN = String.raw`(?:\w+\??\.)*(?:\w*[Ss]core\w*|previous\w*|current\w*|recent\w*|prior\w*|baseline\w*)(?:\??\.\w+)*`
    const SUBTRACTION = new RegExp(`${TOKEN}\\s*-\\s*${TOKEN}`)

    // Non-vacuity for the rule itself.
    expect(SUBTRACTION.test("const d = avg(recent) - avg(prior)")).toBe(false)
    expect(SUBTRACTION.test("const d = recentScore - priorScore")).toBe(true)
    expect(SUBTRACTION.test('id: "score-missing",')).toBe(false)
    // The comparator exclusion, asserted rather than assumed.
    expect(/\.sort\(/.test("[...meals].sort((a, b) => b.score - a.score)[0]")).toBe(true)

    /*
     * ── A SORT COMPARATOR IS NOT A LONGITUDINAL DELTA ─────────────────────
     *
     * This flagged `week-story.ts`'s `[...meals].sort((a, b) => b.score -
     * a.score)` — ordering one list at one moment. Comparability is a question
     * about two measurements ACROSS TIME from possibly different instruments;
     * ranking today's meals against each other needs no verdict, and a guard
     * that demands one would be asking the wrong question loudly.
     *
     * The same exclusion is applied to the `lib/fss` guard above, where no
     * sort-by-score exists yet but would otherwise trip it later.
     */
    for (const file of files) {
      const code = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "")
      const lines = code.split("\n").filter((l) => !/\.sort\(/.test(l))
      if (!lines.some((l) => SUBTRACTION.test(l))) continue
      /*
       * A file that subtracts must ASK. This is the one-authority rule made
       * mechanical: `fortnightTrend` was the only window-to-window comparison
       * on /account, and it held its comparability assumption privately.
       */
      expect(code, `${file} subtracts two score-like values without calling canCompare`).toMatch(
        /canCompare\(/,
      )
    }
  })

  /*
   * ── THE PROPERTY THAT MAKES THE DAY-75 COMPARISON SOUND ────────────────
   *
   * `lib/account/retest.ts` subtracts two scores from `leads.score_history`
   * on the LIVE dashboard. Step 2c routed it through `canCompare`, and the
   * verdict is "comparable" — which is only honest while one instrument writes
   * those points. `RETEST_PROVENANCE` asserts the version rather than reading
   * it off the row, so the constant alone proves nothing: compared with
   * itself it can never refuse.
   *
   * THIS is the real guard. A second caller of `appendScore`, or a caller
   * passing something other than the fifteen-item result, makes every stored
   * pair a comparison between two different things — and that is what fails
   * here, rather than being noticed years later.
   */
  it("exactly one writer feeds the retest history, which is why it compares", () => {
    const callers = execSync(
      "git grep -l 'appendScore' -- app lib || true",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)
      .filter((f) => f !== "lib/account/retest.ts")

    expect(callers, "a second writer of score_history — the Day-75 pair may no longer be comparable").toEqual([
      "app/api/send-results-email/route.ts",
    ])

    // And that one caller passes the fifteen-item foundation result.
    const writer = readFileSync("app/api/send-results-email/route.ts", "utf8")
    expect(writer).toMatch(/appendScore\(parseScoreHistory\([^)]*\), result\.overall\)/)
    expect(writer).toMatch(/from "@\/lib\/assessment-scoring"/)
  })

  it("the retest refuses rather than subtracting when the instrument moves", async () => {
    const { retestState, RETEST_PROVENANCE } = await import("@/lib/account/retest")
    const history = [
      { score: 54, at: "2026-06-01T09:00:00.000Z" },
      { score: 71, at: "2026-09-01T09:00:00.000Z" },
    ]
    const fallback = { score: null, at: null }

    // Today: one instrument, so a delta is permitted.
    const ok = retestState(history, fallback, new Date("2026-09-02T09:00:00.000Z"))
    expect(ok?.kind).toBe("compare")

    // The instrument moves between the two points.
    const moved = retestState(history, fallback, new Date("2026-09-02T09:00:00.000Z"), {
      previous: RETEST_PROVENANCE,
      latest: { ...RETEST_PROVENANCE, fssMethodVersion: "foundation-assessment-v2" },
    })
    expect(moved?.kind).toBe("compare-refused")
    // Both records survive; only the relationship is suppressed.
    if (moved?.kind === "compare-refused") {
      expect(moved.baseline.score).toBe(54)
      expect(moved.latest.score).toBe(71)
      expect("delta" in moved, "a refused retest carried a delta").toBe(false)
      expect(moved.because).toMatch(/different methods/i)
    }
  })

  it("the meal window's provenance is honest about being unknown", async () => {
    const { mealWindowProvenance } = await import("@/lib/account/patterns")
    const p = mealWindowProvenance([])
    /*
     * `legacy-unversioned`, and the reason is checked rather than assumed:
     * `analyses` records no rubric version and CLAUDE_MODEL is an env var, so
     * which instrument scored a stored meal cannot be established.
     */
    expect(p.fssMethodVersion).toBe("legacy-unversioned")
    expect(canCompare(p, p).comparable).toBe(false)

    // And the analyses writer really does record no version, which is why.
    const writer = readFileSync("app/api/analyses/log/route.ts", "utf8")
    expect(writer).not.toMatch(/rubric_version|prompt_version|model_version/)
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   14 · THE OBSERVATION CONTENT MODEL — Gate 5 step 2d

   Three classes, made explicit in the model rather than effectively produced
   by the derivation. No new interpretation: just types, and the tests that
   stop a fourth appearing or two of them collapsing.
   ════════════════════════════════════════════════════════════════════════════ */

describe("an observation comparison is one of exactly three classes", () => {
  it("the three are pinned by value, so a fourth cannot arrive quietly", () => {
    expect([...OBSERVATION_COMPARISONS].sort()).toEqual([
      "changed-selection",
      "not-comparable",
      "same-selection",
    ])
  })

  /*
   * ── AND THE UNION IS READ FROM SOURCE, BECAUSE THE PIN ABOVE IS BLIND ───
   *
   * Sabotage 1351 added `| "improved"` to `ObservationComparison` and slipped:
   * the value pin describes the LIST, and a widened TYPE is invisible to
   * vitest. `changed.ts` now fails `tsc` if the two diverge, but a build
   * failure is not a caught mutation — the harness runs vitest.
   *
   * IF THIS FAILS: a class was added or removed. That is a content-model
   * change, and it needs the renderer, the derivation and this suite updated
   * together — do not edit the list to match.
   */
  it("the union in SOURCE and the list are the same set", () => {
    const src = readFileSync("lib/fss/system/changed.ts", "utf8")
    const decl = /export type ObservationComparison =([^\n]*)/.exec(src)
    expect(decl, "the union was renamed or moved").not.toBeNull()
    const inSource = [...(decl?.[1] ?? "").matchAll(/"([a-z-]+)"/g)].map((m) => m[1])

    expect(inSource.length).toBeGreaterThan(0)
    expect([...inSource].sort()).toEqual([...OBSERVATION_COMPARISONS].sort())
  })

  /** Build A→B over two sheets, differing only in the answers given. */
  async function observationsFor(before: Answers, after: Answers) {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", before)
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", after)
    const w = await readWhatChanged({ repo, set: SET, systemId: b })
    if (w.state !== "available") throw new Error(w.state)
    return w
  }

  /** The What You Notice ids, so a fixture can move exactly one of them. */
  const noticeIds = () =>
    SET.questions.filter((q) => q.contributes === "what-you-notice").map((q) => q.id)

  it("both answered and equal → same-selection", async () => {
    const w = await observationsFor(allTwos(), allTwos())
    expect(w.observations?.map((o) => o.state)).toEqual(
      noticeIds().map(() => "same-selection"),
    )
  })

  it("both answered and different → changed-selection, with both labels", async () => {
    const id = noticeIds()[0]
    const w = await observationsFor({ ...allTwos(), [id]: 1 }, { ...allTwos(), [id]: 3 })
    const moved = w.observations?.find((o) => o.questionId === id)

    expect(moved?.state).toBe("changed-selection")
    expect(typeof moved?.previous).toBe("string")
    expect(typeof moved?.current).toBe("string")
    expect(moved?.previous).not.toBe(moved?.current)

    // And the rest did not move, which is what makes the trailing line honest.
    expect(w.observations?.filter((o) => o.state === "same-selection").length).toBe(
      noticeIds().length - 1,
    )
  })

  /*
   * ── ONE SIDE MISSING IS `not-comparable`, AND THAT NAME IS THE POINT ────
   *
   * It read `newly-answered` / `no-longer-answered`, which are one fact under
   * two names and invite a sentence about what the person DID. There is
   * nothing to compare at an item with no selection on one side, so the state
   * says that and the surface derives which side from the nullable labels.
   */
  it("one side unanswered → not-comparable, either way round", async () => {
    const id = noticeIds()[0]
    const { [id]: _dropped, ...withoutIt } = allTwos()

    const gained = await observationsFor(withoutIt as Answers, allTwos())
    const g = gained.observations?.find((o) => o.questionId === id)
    expect(g?.state).toBe("not-comparable")
    expect(g?.previous).toBeNull()
    expect(typeof g?.current).toBe("string")

    const lost = await observationsFor(allTwos(), withoutIt as Answers)
    const l = lost.observations?.find((o) => o.questionId === id)
    expect(l?.state).toBe("not-comparable")
    expect(typeof l?.previous).toBe("string")
    expect(l?.current).toBeNull()
  })

  it("neither side answered → same-selection, not not-comparable", async () => {
    const id = noticeIds()[0]
    const { [id]: _gone, ...withoutIt } = allTwos()
    const w = await observationsFor(withoutIt as Answers, withoutIt as Answers)
    const item = w.observations?.find((o) => o.questionId === id)
    /*
     * "You have not answered this either time" is a statement about sameness,
     * not a lost comparison. Collapsing it into `not-comparable` would make
     * the item-level state mean two different things at once.
     */
    expect(item?.state).toBe("same-selection")
    expect(item?.previous).toBeNull()
    expect(item?.current).toBeNull()
  })

  /*
   * ── THE ITEM-LEVEL AND CLASS-LEVEL REFUSALS ARE DIFFERENT SHAPES ────────
   *
   * The trap in this refinement. "You skipped this question" and "the
   * instrument changed under you" are not the same statement, and only the
   * second refuses the comparison — so the class-level case must never render
   * as a list of `not-comparable` items.
   */
  it("a moved question set is ABSENCE, never an array of not-comparable items", async () => {
    const repo = memoryRepo()
    const a = await chainOne(repo, null, "2026-10-01T09:00:00.000Z", allTwos())
    const b = await chainOne(repo, a, "2026-11-01T09:00:00.000Z", allThrees())
    await tamperScore(repo, b, (s) => ({
      ...s,
      provenance: { ...s.provenance, questionSetVersion: "questions-v1.1" },
    }))

    const refused = await readWhatChanged({ repo, set: SET, systemId: b })
    if (refused.state !== "available") throw new Error(refused.state)
    expect("observations" in refused).toBe(false)

    // And an item-level refusal still yields a PRESENT array, with items in it.
    const id = noticeIds()[0]
    const { [id]: _gone, ...withoutIt } = allTwos()
    const perItem = await observationsFor(withoutIt as Answers, allTwos())
    expect(perItem.observations?.length).toBe(noticeIds().length)
    expect(perItem.observations?.some((o) => o.state === "not-comparable")).toBe(true)
  })

  it("no observation carries a direction or a number, in any class", async () => {
    const id = noticeIds()[0]
    const { [id]: _gone, ...withoutIt } = allTwos()
    const seen = new Set<string>()

    for (const [before, after] of [
      [allTwos(), allTwos()],
      [{ ...allTwos(), [id]: 1 }, { ...allTwos(), [id]: 3 }],
      [withoutIt as Answers, allTwos()],
    ] as const) {
      const w = await observationsFor(before as Answers, after as Answers)
      for (const o of w.observations ?? []) {
        seen.add(o.state)
        expect(Object.keys(o).sort()).toEqual([
          "current",
          "order",
          "previous",
          "question",
          "questionId",
          "state",
        ])
        for (const value of Object.values(o)) {
          expect(typeof value === "number" ? o.order === value : true).toBe(true)
        }
      }
    }

    // NON-VACUITY: all three classes were actually produced and inspected.
    expect([...seen].sort()).toEqual(["changed-selection", "not-comparable", "same-selection"])
  })

  it("the consolidated sentences exist for both shapes", () => {
    expect(CHANGED_COPY.observationsNoneChanged).toMatch(/the same as at your previous assessment/)
    expect(CHANGED_COPY.observationsRestUnchanged(1)).toBe(
      "One other answer here is the same as last time.",
    )
    expect(CHANGED_COPY.observationsRestUnchanged(3)).toBe(
      "3 other answers here are the same as last time.",
    )
    // Neither asserts a direction or an outcome.
    for (const s of [
      CHANGED_COPY.observationsNoneChanged,
      CHANGED_COPY.observationsRestUnchanged(2),
      CHANGED_COPY.observationNeither,
    ]) {
      expect(s).not.toMatch(/\b(improved|better|worse|more often|less often|increased)\b/i)
    }
  })
})

/* ── The fifteen comparative sentences: a named, pinned dependency ──────── */

describe("the comparative copy has not been reviewed, and cannot graduate quietly", () => {
  /*
   * ── WHY A TEST AND NOT A COMMENT ────────────────────────────────────────
   *
   * A comment saying "unapproved" expires in silence. This fails, and its
   * message names what has to happen first — so the fifteen sentences
   * graduate because somebody decided to, not because nobody noticed.
   */
  it("the review is PENDING, and the six criteria are recorded verbatim", () => {
    expect(
      COMPARATIVE_COPY_REVIEW.state,
      "the comparative copy review was marked complete — the six criteria below must be " +
        "answered by a named human first, and `reviewedBy` must say who",
    ).toBe("pending")
    expect(COMPARATIVE_COPY_REVIEW.reviewedBy).toBeNull()
    expect(COMPARATIVE_COPY_REVIEW.reviewedAt).toBeNull()

    // Pinned by value, so the review cannot be narrowed on the way to passing.
    expect([...COMPARATIVE_COPY_REVIEW.criteria]).toEqual([
      "whether they merely describe answers",
      "whether they imply direction",
      "whether direction is justified",
      "whether they imply health improvement",
      "whether they imply causality",
      "whether they accidentally turn relative ranking into absolute health status",
    ])
  })

  /*
   * ── "APPROVED" CANNOT EXIST WITHOUT A NAMED HUMAN AND A DATE ────────────
   *
   * The pin above refuses `"approved"` outright today, which is right while
   * the review is open — and useless the moment somebody legitimately clears
   * it, because then the only guard left is the one that just got edited.
   *
   * This is the guard that survives ratification. Whatever `state` says,
   * "approved" requires a `reviewedBy` and a `reviewedAt` that parses. So the
   * flag cannot be flipped as a flag: clearing the review means recording WHO
   * cleared it and WHEN, which is the whole content of the claim.
   */
  it("whatever the state, approval requires a reviewer and a date", () => {
    const review = COMPARATIVE_COPY_REVIEW as {
      state: string
      reviewedBy: string | null
      reviewedAt: string | null
    }

    if (review.state === "approved") {
      expect(
        review.reviewedBy,
        "the comparative copy is marked approved with nobody recorded as having reviewed it",
      ).toBeTruthy()
      expect(review.reviewedAt, "approved with no date").toBeTruthy()
      expect(
        Number.isNaN(Date.parse(review.reviewedAt ?? "")),
        "`reviewedAt` is not a parseable date",
      ).toBe(false)
    } else {
      // Not approved, so nobody may be named as having approved it.
      expect(review.reviewedBy, "a reviewer is named but the review is not approved").toBeNull()
      expect(review.reviewedAt).toBeNull()
    }

    /*
     * NON-VACUITY: the branch above must actually bite. Asserted on stand-ins
     * rather than on the real constant, which can only be in one state.
     */
    const approvedWithoutReviewer = { state: "approved", reviewedBy: null, reviewedAt: null }
    expect(approvedWithoutReviewer.state === "approved" && !approvedWithoutReviewer.reviewedBy).toBe(
      true,
    )
    expect(Number.isNaN(Date.parse("not-a-date"))).toBe(true)
  })

  /*
   * ── THE REVIEW'S VERDICTS, MADE LOAD-BEARING ────────────────────────────
   *
   * Sabotage 1360-1362 reverted the three revised sentences and SLIPPED: the
   * pin above checks structure — opens "Your answers described", anchored to
   * "your previous assessment", no causal vocabulary — and "less heavily
   * processed food" satisfies every one of those.
   *
   * The invariant the review actually found is narrower and more useful:
   *
   *   A COMPARATIVE SENTENCE MAY ONLY USE VOCABULARY ITS OWN DOMAIN'S
   *   REVIEWED COPY USES.
   *
   * That is what the `foodQuality` defect was. "Heavily processed" is not a
   * phrase any reviewer signed off; the domain says "whole ingredients" and
   * "ready-made". A sentence that invents its own words for a domain is
   * asserting something adjacent to what was approved, and "adjacent to
   * approved" is how a claim drifts.
   *
   * So each domain declares what its sentences MUST say and what they MUST
   * NOT, taken straight from the 2026-10-02 verdicts.
   */
  const DOMAIN_VOCABULARY: Record<
    string,
    { readonly requires: string; readonly refuses: readonly string[] }
  > = {
    // "the range rather than the amount", in the domain's own words.
    diversity: { requires: "range of plant foods", refuses: ["amount of plant", "variety score"] },
    // The dropped "whole", restored.
    plantsAndFibre: { requires: "fibre-rich whole plant food", refuses: ["fibre-rich plant food"] },
    // The domain's verb is "appear", not "arrive".
    fermentedFoods: { requires: "fermented foods appearing", refuses: ["arriving", "probiotic"] },
    // The substantive finding: unreviewed, loaded, and grammatically ambiguous.
    foodQuality: {
      requires: "starting from whole ingredients",
      refuses: ["heavily processed", "ultra-processed", "junk"],
    },
    mealRhythm: { requires: "eating rhythm", refuses: ["discipline", "willpower"] },
  }

  it("every comparative sentence uses only its own domain's reviewed vocabulary", () => {
    for (const domain of FSS_DOMAINS) {
      const rule = DOMAIN_VOCABULARY[domain]
      expect(rule, `${domain} has no vocabulary rule — add one with its verdict`).toBeDefined()

      for (const direction of ["higher", "lower", "similar"] as const) {
        const sentence = DOMAIN_CHANGE_COPY[domain][direction]
        expect(
          sentence,
          `${domain}/${direction} lost the domain's own phrase "${rule.requires}"`,
        ).toContain(rule.requires)

        for (const refused of rule.refuses) {
          expect(
            sentence.toLowerCase().includes(refused.toLowerCase()),
            `${domain}/${direction} uses vocabulary the review rejected: "${refused}" — ` +
              `the domain's reviewed copy does not use it`,
          ).toBe(false)
        }
      }
    }
  })

  /*
   * And the required phrase really does come from the domain's own reviewed
   * copy, rather than from a second list that happens to agree. Without this
   * the table above is just two places to edit.
   */
  it("NON-VACUITY: each required phrase appears in the domain's own presentation", () => {
    for (const domain of FSS_DOMAINS) {
      const presentation = DOMAIN_PRESENTATION[domain]
      const reviewed = [
        presentation.whatItMeans,
        presentation.whatYouCouldDo,
        presentation.whereYouAre(90),
        presentation.whereYouAre(50),
        presentation.whereYouAre(10),
      ]
        .join(" ")
        .toLowerCase()

      /*
       * Matched on the distinctive HEAD NOUN, because a comparative inflects
       * ("wider range" vs the domain's "wide range") and a test demanding an
       * exact phrase match would fail on correct copy.
       */
      const head = {
        diversity: "range of plant foods",
        plantsAndFibre: "whole plant food",
        fermentedFoods: "fermentation",
        foodQuality: "whole ingredients",
        mealRhythm: "rhythm",
      }[domain]

      expect(
        reviewed.includes(head.toLowerCase()),
        `${domain}: the comparative copy's vocabulary is not in the domain's reviewed copy`,
      ).toBe(true)
    }
  })

  /*
   * ── THE FENCE: the copy stays inside the gated candidate preview ────────
   *
   * The same roots `tests/unit/biotic-claims.test.ts` fences the withheld
   * score name to. This is what stops Gate 6 making these sentences canonical
   * because the AI needed explanatory language to hand.
   */
  it("nothing outside the candidate roots imports the comparative copy", () => {
    const CANDIDATE_ROOTS = ["lib/fss", "components/fss", "app/preview/food-system-v1"]
    const importers = execSync(
      "git grep -l \"presentation/changed\" -- app components lib || true",
      { encoding: "utf8" },
    )
      .split("\n")
      .filter(Boolean)

    expect(importers.length, "nothing imports it at all — is this fence still real?").toBeGreaterThan(0)

    const escaped = importers.filter((f) => !CANDIDATE_ROOTS.some((r) => f.startsWith(r)))
    expect(
      escaped,
      "unreviewed comparative copy reached a file outside the gated candidate preview",
    ).toEqual([])
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   GATE 6.0c · CLAIM BINDINGS

   Validate the claim binding deterministically. Guard the language separately.

   Every test here reads ids and domains. None reads a sentence, because there
   is no sentence parameter to read — the first design of this module was a
   prose validator and was withdrawn for being a second decision engine.
   ════════════════════════════════════════════════════════════════════════════ */

describe("a claim binding is checked structurally, never semantically", () => {
  /** The system whose priority is unambiguous: fermentedFoods at the floor. */
  const fermentedSystem = () => compose(records(fermentedAtZero()))

  /*
   * A system with a TIE at the lowest, so `selected` genuinely holds three.
   *
   * `fermentedSystem` has exactly one priority, which is the normal case and
   * the right fixture for the honest binding. But the two appeals the
   * amendment added are about RANK and about borrowing evidence BETWEEN
   * selected priorities, and neither case exists when there is only one.
   *
   * All-2s ties every domain, so `resolvePriorities` returns the first three in
   * instrument order — diversity, plantsAndFibre, fermentedFoods — and
   * `foodQuality` and `mealRhythm` stay UNSELECTED. That matters: it keeps
   * them usable here as the inconsistent and not-selected cases, so one
   * fixture covers every refusal.
   */
  const tiedSystem = () => compose(records(allTwos()))

  const basisFor = (system: ReturnType<typeof compose>, over: Partial<ClaimBasis> = {}) => {
    if (system.priorities.state !== "resolved") throw new Error("fixture")
    const top = system.priorities.priorities[0]
    return {
      claimClass: "plan-explanation" as const,
      priorityId: top.id,
      priorityDomain: top.sourceDomain,
      evidenceIds: top.evidence.map((e) => e.questionId),
      ...over,
    }
  }

  it("the basis has nowhere to nominate an alternative priority", () => {
    expect([...CLAIM_BASIS_KEYS].sort()).toEqual([
      "actionId",
      "claimClass",
      "evidenceIds",
      "priorityDomain",
      "priorityId",
    ])
    /*
     * The point of the pin: `alternatives`, `consideredDomains`,
     * `suggestedPriority` and `confidence` are not keys, so an appeal is not a
     * thing the type can hold. Adding one fails here.
     */
    for (const forbidden of ["alternatives", "consideredDomains", "suggestedPriority", "confidence"]) {
      expect(CLAIM_BASIS_KEYS).not.toContain(forbidden)
    }
  })

  it("a basis bound to the persisted current priority is permitted", () => {
    const system = fermentedSystem()
    const verdict = validateClaimBinding({ system, basis: basisFor(system) })
    expect(verdict.bound, "the honest case was refused").toBe(true)
  })

  /*
   * ── THE CASE THE AMENDMENT WAS WRITTEN FOR ──────────────────────────────
   *
   * Persisted priority is fermentedFoods; the basis claims diversity. Under
   * the withdrawn design this needed a regex to read "Meal Rhythm is actually
   * more important for you" and decide it disagreed. Here the ids simply do
   * not match a selected priority, and the refusal is exact.
   */
  it("a basis naming a DIFFERENT priority is refused", () => {
    const system = fermentedSystem()
    const verdict = validateClaimBinding({
      system,
      basis: basisFor(system, {
        priorityId: priorityIdFor("mealRhythm"),
        priorityDomain: "mealRhythm",
        evidenceIds: [],
      }),
    })
    expect(verdict.bound).toBe(false)
    if (!verdict.bound) {
      expect(verdict.because).toBe("not-a-selected-priority")
      expect(verdict.explain).toMatch(/nominating a priority rather than explaining one/)
    }
  })

  it("an internally inconsistent basis is refused before anything else", () => {
    const system = fermentedSystem()
    const verdict = validateClaimBinding({
      system,
      // The id says one domain, the field says another.
      basis: basisFor(system, { priorityId: priorityIdFor("foodQuality") }),
    })
    expect(verdict.bound).toBe(false)
    if (!verdict.bound) expect(verdict.because).toBe("basis-internally-inconsistent")
  })

  /*
   * ── SUBTLE APPEAL 1 · SELECTED, BUT NOT THE FOCUS ───────────────────────
   *
   * Added by the amendment. `selected` holds up to three, so every id here is
   * genuinely a priority this system chose — and presenting rank 1 or 2 as
   * "your current focus" reorders a persisted decision while looking correct.
   */
  it("a basis bound to a selected priority at a LOWER RANK is refused", () => {
    const system = tiedSystem()
    if (system.priorities.state !== "resolved") throw new Error("fixture")
    const selected = system.priorities.priorities
    expect(selected.length, "this fixture needs more than one priority").toBeGreaterThan(1)

    const second = selected[1]
    const verdict = validateClaimBinding({
      system,
      basis: {
        claimClass: "plan-explanation",
        priorityId: second.id,
        priorityDomain: second.sourceDomain,
        evidenceIds: second.evidence.map((e) => e.questionId),
      },
    })
    expect(verdict.bound, "a rank-1 priority passed as the current focus").toBe(false)
    if (!verdict.bound) {
      expect(verdict.because).toBe("not-the-current-priority")
      expect(verdict.explain).toMatch(/reorder a persisted decision/)
    }
  })

  /*
   * ── SUBTLE APPEAL 2 · THE RIGHT PRIORITY, THE WRONG EVIDENCE ────────────
   *
   * Also added by the amendment. "Diversity is your focus because [evidence
   * about Meal Rhythm]" has valid ids throughout and argues for a different
   * domain under the right heading.
   */
  it("evidence from another domain is refused even under the right priority", () => {
    const system = tiedSystem()
    if (system.priorities.state !== "resolved") throw new Error("fixture")
    const top = system.priorities.priorities[0]
    const other = system.priorities.priorities.find((p) => p.sourceDomain !== top.sourceDomain)
    expect(other, "this fixture needs a second domain to borrow evidence from").toBeTruthy()

    const verdict = validateClaimBinding({
      system,
      basis: {
        claimClass: "plan-explanation",
        priorityId: top.id,
        priorityDomain: top.sourceDomain,
        evidenceIds: other!.evidence.map((e) => e.questionId),
      },
    })
    expect(verdict.bound, "borrowed evidence passed").toBe(false)
    if (!verdict.bound) {
      expect(verdict.because).toBe("evidence-outside-priority-domain")
      expect(verdict.explain).toMatch(/argues for another domain/)
    }
  })

  it("an action from another plan is refused", () => {
    const system = fermentedSystem()
    const verdict = validateClaimBinding({
      system,
      basis: basisFor(system, { actionId: "action_from_somewhere_else" }),
    })
    expect(verdict.bound).toBe(false)
    if (!verdict.bound) {
      expect(verdict.because).toBe("action-outside-plan")
      expect(verdict.explain).toMatch(/never substitute a different one/)
    }
  })

  it("an action that IS in the plan is permitted", () => {
    const system = fermentedSystem()
    expect(system.actions.length).toBeGreaterThan(0)
    const verdict = validateClaimBinding({
      system,
      basis: basisFor(system, { actionId: system.actions[0].id }),
    })
    expect(verdict.bound).toBe(true)
  })

  /*
   * A product that cannot read its own decision back does not get to explain
   * it. This inherits Gate 4's version refusal rather than adding an anchor.
   */
  it("an unresolvable decision explains nothing", () => {
    const r = records(fermentedAtZero())
    const system = compose({
      ...r,
      priorityDecision: { ...r.priorityDecision, systemModelVersion: "system-model-v9.9" },
    })
    expect(system.priorities.state).not.toBe("resolved")

    const verdict = validateClaimBinding({
      system,
      basis: {
        claimClass: "plan-explanation",
        priorityId: priorityIdFor("fermentedFoods"),
        priorityDomain: "fermentedFoods",
        evidenceIds: [],
      },
    })
    expect(verdict.bound).toBe(false)
    if (!verdict.bound) expect(verdict.because).toBe("decision-unresolvable")
  })

  /*
   * NON-VACUITY over the refusal union: every member is reachable. A refusal
   * nothing can produce is a branch nobody has tested, and this suite would
   * otherwise pass while one of the six appeals was unreachable.
   */
  it("NON-VACUITY: every binding refusal is produced by some case", () => {
    const produced = new Set<string>()
    const system = tiedSystem()
    if (system.priorities.state !== "resolved") throw new Error("fixture")
    const selected = system.priorities.priorities
    const r = records(allTwos())

    const cases: { system: ReturnType<typeof compose>; basis: ClaimBasis }[] = [
      { system, basis: basisFor(system, { priorityId: priorityIdFor("foodQuality") }) },
      {
        system: compose({
          ...r,
          priorityDecision: { ...r.priorityDecision, systemModelVersion: "system-model-v9.9" },
        }),
        basis: basisFor(system),
      },
      {
        system,
        basis: basisFor(system, {
          priorityId: priorityIdFor("mealRhythm"),
          priorityDomain: "mealRhythm",
          evidenceIds: [],
        }),
      },
      {
        system,
        basis: {
          claimClass: "plan-explanation",
          priorityId: selected[1].id,
          priorityDomain: selected[1].sourceDomain,
          evidenceIds: [],
        },
      },
      {
        system,
        basis: basisFor(system, { evidenceIds: ["definitely-not-an-evidence-id"] }),
      },
      { system, basis: basisFor(system, { actionId: "nope" }) },
    ]

    for (const c of cases) {
      const v = validateClaimBinding(c)
      if (!v.bound) produced.add(v.because)
    }

    expect([...produced].sort()).toEqual([
      "action-outside-plan",
      "basis-internally-inconsistent",
      "decision-unresolvable",
      "evidence-outside-priority-domain",
      "not-a-selected-priority",
      "not-the-current-priority",
    ])
  })

  /*
   * ── AND THE VALIDATOR READS NO PROSE ───────────────────────────────────
   *
   * The structural statement of the amendment. If a `sentence` parameter ever
   * appears here, the withdrawn design has come back.
   */
  it("the module takes no sentence and runs no language rule", () => {
    const src = readFileSync("lib/fss/system/ai-claims.ts", "utf-8")
    const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")
    for (const forbidden of ["sentence", "prose", "text:", "toMatch", "RegExp"]) {
      expect(code, `ai-claims.ts reads ${forbidden} — it must bind, not interpret`).not.toContain(
        forbidden,
      )
    }
    // NON-VACUITY: the stripped code still holds the validator.
    expect(code).toMatch(/export function validateClaimBinding/)
  })
})
