import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import {
  LocalStorageRepository,
  SupabaseRepositoryDisabled,
  foodSystemRepository,
} from "@/lib/fss/persistence/local"
import { RepositoryWriteFailed, RepositoryWriteRefused } from "@/lib/fss/persistence/repository"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import { computeFoodSystemScore } from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import { FSS_V1_PROVENANCE } from "@/lib/fss/engine/provenance"
import { buildPlan } from "@/lib/fss/action/plan"
import { resolvePriorities } from "@/lib/fss/action/priority"
import {
  toStoredPlanDecision,
  toStoredPriorityDecision,
} from "@/lib/fss/system/decisions"
import { ACTION_CATALOGUE } from "@/lib/fss/action/catalogue"
import { resolveStoredAction, toStoredAction } from "@/lib/fss/action/stored"
import { ACTION_SET_VERSION } from "@/lib/fss/action/types"

/**
 * ══ THE SEAM, AND THE REFUSAL ═══════════════════════════════════════════════
 *
 * Two things are being protected here.
 *
 * The seam: no UI component may know which backend is active, or the eventual
 * move from local storage to Supabase stops being a substitution and becomes a
 * product rewrite.
 *
 * The refusal: nothing in the candidate product may write to production
 * Supabase. No FSS table exists, no migration is authorised, and the columns
 * would encode a methodology decision nobody has taken.
 */

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
  clear() { this.map.clear() }
}

beforeEach(() => {
  ;(globalThis as { window?: unknown }).window = { localStorage: new MemoryStorage() }
})

describe("the local adapter is the active backend", () => {
  it("foodSystemRepository() returns the local one", () => {
    const repo = foodSystemRepository()
    expect(repo.backend).toBe("local")
    expect(repo.writable).toBe(true)
  })

  it("there is no branch that could return the Supabase adapter", () => {
    /*
     * Asserted at source. A conditional here — on an env var, a flag, a user —
     * would be the thing that eventually points the candidate product at
     * production, and it would look reasonable in the diff that added it.
     */
    const src = readFileSync("lib/fss/persistence/local.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
    const fn = src.slice(src.indexOf("export function foodSystemRepository"))
    expect(fn).not.toMatch(/\bif\b|\?|process\.env/)
    expect(fn).toContain("new LocalStorageRepository()")
  })

  it("round-trips an assessment", async () => {
    const repo = new LocalStorageRepository()
    await repo.saveAssessment({
      id: "candidate",
      assessmentVersion: "assessment-v1.0",
      questionSetVersion: "questions-v1.0",
      answers: { q1: 2 },
      startedAt: "2026-09-30T00:00:00.000Z",
    })
    const back = await repo.loadAssessment("candidate")
    expect(back?.answers).toEqual({ q1: 2 })
    expect(back?.questionSetVersion).toBe("questions-v1.0")
  })

  it("returns null rather than throwing for an absent record", async () => {
    expect(await new LocalStorageRepository().loadAssessment("nope")).toBeNull()
  })

  it("survives storage being unavailable — private browsing, blocked site data", async () => {
    /*
     * The failure that matters most in practice. A candidate assessment that
     * CRASHES because localStorage threw would be a worse outcome than one
     * that simply does not remember: losing the answers is recoverable,
     * losing the page is not.
     */
    ;(globalThis as { window?: unknown }).window = {
      localStorage: {
        getItem() { throw new Error("SecurityError") },
        setItem() { throw new Error("QuotaExceededError") },
      },
    }
    const repo = new LocalStorageRepository()
    await expect(repo.saveAssessment({
      id: "x", assessmentVersion: "a", questionSetVersion: "q", answers: {}, startedAt: "",
    })).resolves.toBeUndefined()
    await expect(repo.loadAssessment("x")).resolves.toBeNull()
  })

  it("reads server-side, where there is no window at all", async () => {
    ;(globalThis as { window?: unknown }).window = undefined
    const repo = new LocalStorageRepository()
    await expect(repo.loadScore("s")).resolves.toBeNull()
    await expect(repo.loadCurrentSystemId()).resolves.toBeNull()
  })

  /*
   * The strict half of the two write behaviours, asserted as behaviour rather
   * than trusted as intent.
   *
   * A server-side save REPORTS rather than silently doing nothing, because the
   * establishment path reads a resolved promise as "that write happened" and
   * would go on to write the `system.current` pointer. A no-op that looked
   * like a success is precisely how a half-created Food System becomes current.
   */
  it("a strict write refuses rather than silently doing nothing", async () => {
    ;(globalThis as { window?: unknown }).window = undefined
    const repo = new LocalStorageRepository()
    await expect(repo.saveScore({
      id: "s", assessmentId: "a", state: "scored", score: 50, domains: [],
      completeness: 1,
      provenance: {
        fssMethodVersion: "fss-v1.0", assessmentVersion: "assessment-v1.0",
        questionSetVersion: "questions-v1.0", calculationVersion: "calc-v1.0",
        interpretationVersion: "interpretation-v1.0",
      },
      computedAt: "",
    })).rejects.toThrow(RepositoryWriteFailed)
    await expect(repo.setCurrentSystem("system_x")).rejects.toThrow(RepositoryWriteFailed)
  })

  it("but the ASSESSMENT write stays lenient, because losing answers is recoverable", async () => {
    ;(globalThis as { window?: unknown }).window = undefined
    const repo = new LocalStorageRepository()
    await expect(
      repo.saveAssessment({
        id: "a", assessmentVersion: "a", questionSetVersion: "q", answers: {}, startedAt: "",
      }),
    ).resolves.toBeUndefined()
  })
})

describe("the Supabase adapter refuses every write", () => {
  const repo = new SupabaseRepositoryDisabled()

  it("declares itself unwritable", () => {
    expect(repo.backend).toBe("supabase")
    expect(repo.writable).toBe(false)
  })

  it.each(["saveAssessment", "saveScore", "saveAction"] as const)("%s throws", async (method) => {
    // The refusal precedes any use of arguments, so none are passed.
    await expect(repo[method]()).rejects.toThrow(RepositoryWriteRefused)
  })

  it("the refusal explains that this is a founder gate, not a code change", async () => {
    await expect(repo.saveScore()).rejects.toThrow(/founder approval gate/)
  })

  it("reads return empty rather than throwing", async () => {
    expect(await repo.loadAssessment()).toBeNull()
    expect(await repo.loadScore()).toBeNull()
    expect(await repo.loadActions()).toEqual([])
  })

  it("it is wired to nothing — no Supabase client is imported", () => {
    const src = readFileSync("lib/fss/persistence/local.ts", "utf-8")
    expect(src).not.toMatch(/@\/lib\/supabase|createClient|from\("supabase/)
  })
})

describe("no UI component knows which backend is active", () => {
  it.each([
    "components/fss/candidate-assessment.tsx",
    "components/fss/candidate-result.tsx",
    "app/preview/food-system-v1/candidate-walk.tsx",
  ])("%s names no adapter", (file) => {
    const src = readFileSync(file, "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "")
    for (const leak of ["LocalStorageRepository", "SupabaseRepositoryDisabled", "localStorage"]) {
      expect(src.includes(leak), `${file} references ${leak}`).toBe(false)
    }
  })
})

describe("no FSS migration exists, drafted or applied", () => {
  it("no migration mentions an FSS table", () => {
    /*
     * The ordering rule: no FSS migration is drafted until the domain set has
     * scientific sign-off. Writing the columns first creates pressure to keep
     * them, and a column name is a methodology decision wearing a schema
     * costume.
     */
    const sql = readFileSync("supabase/migrations.sql", "utf-8")
    for (const table of ["food_system_scores", "fss_scores", "fss_assessments", "candidate_scores"]) {
      expect(sql.includes(table), `migrations.sql already defines ${table}`).toBe(false)
    }
  })
})

/* ════════════════════════════════════════════════════════════════════════════
   Gate 3 — the StoredAction contract, completed and deliberately uncalled.

   `StoredAction` was declared empty in Gate 2 "so that the shape Gate 3 has to
   satisfy is agreed while the reasoning is fresh rather than invented alongside
   the content". These assertions are that shape, plus the refusal that would be
   hardest to add later — once there are stored rows, a convenient fallback to
   today's wording would quietly paper over the thing this exists to prevent.
   ════════════════════════════════════════════════════════════════════════════ */
describe("a stored action keeps ids and versions, never the prose", () => {
  const SET = resolveQuestionSetV1()
  const FIXTURE = nonProductionFixture("unit test")

  const answers = Object.fromEntries(
    SET.questions.map((q) => [
      q.id,
      q.contributes === "fss" && q.domain === "fermentedFoods" ? 0 : 3,
    ]),
  )

  const plan = buildPlan({
    score: computeFoodSystemScore({
      set: SET,
      answers,
      weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
      fixtureContext: FIXTURE,
    }),
    set: SET,
    answers,
  })

  const stored = toStoredAction({
    id: "action-1",
    scoreId: "score-1",
    recommendation: plan.today!,
    state: "planned",
    createdAt: "2026-10-01T09:00:00.000Z",
  })

  it("carries both versions, the ids, and no sentence", () => {
    expect(Object.keys(stored).sort()).toEqual([
      "actionCategory",
      "actionSetVersion",
      "changedAt",
      "createdAt",
      "id",
      "provenance",
      "recommendationId",
      "scoreId",
      "sourceDomain",
      "sourcePriority",
      "state",
      "timeHorizon",
    ])
    expect(stored.actionSetVersion).toBe(ACTION_SET_VERSION)
    expect(stored.provenance).toEqual(FSS_V1_PROVENANCE)

    // The prose is absent, and that is the point: it is looked up, not copied.
    const asText = JSON.stringify(stored)
    expect(asText).not.toContain(plan.today!.practicalAction)
    expect(asText).not.toContain(plan.today!.rationale)
    expect(asText).not.toContain(plan.today!.title)
  })

  it("the two versions are separate fields, because they move independently", () => {
    // A content rewording must be expressible without touching the scoring
    // method, and vice versa. One combined field could not say that.
    expect(Object.keys(stored.provenance)).not.toContain("actionSetVersion")
    expect(stored.actionSetVersion).not.toBe(stored.provenance.fssMethodVersion)
  })

  it("round-trips back to the recommendation it was", () => {
    const resolution = resolveStoredAction(stored)
    expect(resolution.state).toBe("resolved")
    if (resolution.state !== "resolved") return
    expect(resolution.recommendation.id).toBe(plan.today!.id)
    expect(resolution.recommendation.practicalAction).toBe(plan.today!.practicalAction)
    expect(resolution.recommendation.rationale).toBe(plan.today!.rationale)
    expect(resolution.recommendation.sourceDomain).toBe(plan.today!.sourceDomain)
    expect(resolution.recommendation.priorityId).toBe(plan.today!.priorityId)
  })

  it("REFUSES when the content version has moved — no fallback to today's wording", () => {
    const old = { ...stored, actionSetVersion: "actions-v0.9" }
    const resolution = resolveStoredAction(old)
    expect(resolution.state).toBe("unresolvable")
    if (resolution.state !== "unresolvable") return
    expect(resolution.reason).toBe("content-version-moved")
    expect(resolution.storedVersion).toBe("actions-v0.9")
  })

  it("refuses even when the id still exists under the new version", () => {
    /*
     * The case the version check exists for, and the reason it runs FIRST: an
     * id matching tells us nothing once the content set has moved, because the
     * sentence under that id may have been reworded. Resolving it would show a
     * person a sentence they were never shown.
     */
    const old = { ...stored, actionSetVersion: "actions-v0.9" }
    expect(ACTION_CATALOGUE.some((e) => e.id === old.recommendationId)).toBe(true)
    expect(resolveStoredAction(old).state).toBe("unresolvable")
  })

  it("refuses when the entry has been withdrawn", () => {
    const gone = { ...stored, recommendationId: "diversity-week-something-removed" }
    const resolution = resolveStoredAction(gone)
    expect(resolution.state).toBe("unresolvable")
    if (resolution.state !== "unresolvable") return
    expect(resolution.reason).toBe("entry-withdrawn")
    expect(resolution.storedRecommendationId).toBe("diversity-week-something-removed")
  })

  it("and the refusal is the ONLY failure mode — no partial or closest match", () => {
    const src = readFileSync("lib/fss/action/stored.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    expect(src, "a fallback to the current catalogue would defeat the refusal").not.toMatch(
      /\?\?\s*ACTION_CATALOGUE|ACTION_CATALOGUE\[0\]|findClosest|fuzzy/i,
    )
  })
})

describe("Gate 4 came past the no-caller assertion, and says so", () => {
  /*
   * ── WHAT THIS TEST USED TO SAY ──────────────────────────────────────────
   *
   * Gate 3 asserted that `saveScore` and `saveAction` had NO CALLER, on the
   * argument that "Your Plan is deterministic from the answers, so nothing
   * about it needs storing", and added: "This test is here so that when a later
   * gate DOES wire them, it has to come past this assertion and say so."
   *
   * This is that gate, and here is the saying-so.
   *
   * The Gate 3 argument was right about the PLAN and wrong about the
   * SELECTION. Rebuilding a plan from stored answers is deterministic only
   * while the selection rule is unchanged. The moment it moves, re-deriving
   * shows a person a different priority and different actions than the ones
   * they were given — silently, with their own completed actions attached to a
   * plan they never saw. So a selection is a DECISION, it is written down under
   * `SYSTEM_MODEL_VERSION`, and the writers are wired.
   *
   * ── WHAT IT SAYS NOW ────────────────────────────────────────────────────
   *
   * The pair is not merely "called together" — they are called in ONE ORDERED
   * PATH whose last write is the `system.current` pointer. That is a stronger
   * statement than co-presence, and it is the statement the safety of the whole
   * thing rests on, so it is the one under test.
   */

  const establish = readFileSync("lib/fss/system/establish.ts", "utf-8")

  function writersOf(methods: string): string[] {
    return execSync(
      `git grep -l --untracked -E '\\.(${methods})\\(' -- 'lib/**' 'components/**' 'app/**' || true`,
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .filter((f) => !f.startsWith("lib/fss/persistence/"))
      .sort()
  }

  it("every ESTABLISHMENT writer is reached from exactly one module", () => {
    /*
     * The five writes that make up establishment, plus the pointer. These must
     * have one owner, because establishment is an ORDER and two paths cannot
     * both own an order — a second one would write the same records in a
     * sequence nobody had reasoned about.
     */
    expect(
      writersOf("saveScore|savePriorityDecision|savePlanDecision|saveSystem|setCurrentSystem"),
      "a second establishment path appeared",
    ).toEqual(["lib/fss/system/establish.ts"])
  })

  it("and human state has exactly one writer of its own", () => {
    /*
     * `saveAction` has TWO legitimate callers and they are different jobs:
     * establishment creates the initial `planned` set, and `moveAction` records
     * where the person stands afterwards. Both are named, so a component that
     * started writing rows directly would fail here.
     */
    expect(writersOf("saveAction")).toEqual([
      "lib/fss/system/actions.ts",
      "lib/fss/system/establish.ts",
    ])
  })

  it("the writes happen in the documented order, with the pointer last", () => {
    const order = [
      "saveAssessment(",
      "saveScore(",
      "savePriorityDecision(",
      "savePlanDecision(",
      "saveAction(",
      "saveSystem(",
      "validateFoodSystem(",
      "setCurrentSystem(",
    ]
    const positions = order.map((call) => {
      const at = establish.indexOf(call)
      expect(at, `establish.ts never calls ${call}`).toBeGreaterThan(-1)
      return at
    })
    for (let i = 1; i < positions.length; i += 1) {
      expect(
        positions[i],
        `${order[i]} must come after ${order[i - 1]} — the order IS the safety property`,
      ).toBeGreaterThan(positions[i - 1])
    }
  })

  it("the pointer is written after validation, not before it", () => {
    // Stated separately from the sequence above because it is the one pair
    // whose inversion is invisible: everything still works, right up until a
    // record is missing and a half-created system is already current.
    expect(establish.indexOf("setCurrentSystem(")).toBeGreaterThan(
      establish.indexOf("validateFoodSystem("),
    )
  })

  it("nothing in the composer re-selects a priority or rebuilds a plan", () => {
    /*
     * The other half of the same rule. Writing the decision down achieves
     * nothing if the read path quietly ignores it, so the composer is asserted
     * NOT to call either engine.
     */
    const compose = readFileSync("lib/fss/system/compose.ts", "utf-8")
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/^\s*\/\/.*$/gm, " ")
    expect(compose, "the composer must resolve the stored decision, never re-decide").not.toMatch(
      /\bresolvePriorities\s*\(|\bbuildPlan\s*\(/,
    )
  })

  it("and only establishment calls the selecting engines at all", () => {
    const callers = execSync(
      "git grep -l --untracked -E '\\b(resolvePriorities|buildPlan)\\(' -- 'lib/fss/system/**' 'components/fss/**' 'app/preview/**' || true",
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)

    expect(callers, "selection happens once, where it is written down").toEqual([
      "lib/fss/system/establish.ts",
    ])
  })
})

describe("no presentation copy is persisted on any record", () => {
  /*
   * Persist facts. Persist decisions. Persist human state. DERIVE EXPLANATIONS.
   *
   * The fourth clause is the one that needs a test, because breaking it is
   * convenient rather than obviously wrong: copying a headline onto a record
   * saves a lookup today and makes every future copy edit a data migration.
   *
   * The heuristic is deliberately crude — a value containing a space and
   * ending in sentence punctuation — and the allowlist is by FIELD NAME rather
   * than by value, so a sentence smuggled into an allowlisted field would have
   * to be smuggled past a reviewer reading this list rather than past a regex.
   */
  const ALLOWED_FREE_TEXT: readonly string[] = []

  function sentences(record: object, path = ""): string[] {
    const found: string[] = []
    for (const [key, value] of Object.entries(record)) {
      const here = path ? `${path}.${key}` : key
      if (ALLOWED_FREE_TEXT.includes(key)) continue
      if (typeof value === "string") {
        if (/\s/.test(value) && /[.!?]$/.test(value.trim())) found.push(`${here}: ${value}`)
      } else if (value && typeof value === "object") {
        found.push(...sentences(value as object, here))
      }
    }
    return found
  }

  /*
   * Its own fixture rather than a shared one: a decision record is only
   * interesting with a real plan behind it, and the fermented-foods-at-zero
   * sheet is the one that puts a Seed action on Today.
   */
  const SET = resolveQuestionSetV1()
  const answers = Object.fromEntries(
    SET.questions.map((q) => [
      q.id,
      q.contributes === "fss" && q.domain === "fermentedFoods" ? 0 : 3,
    ]),
  )
  const score = computeFoodSystemScore({
    set: SET,
    answers,
    weights: DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
    fixtureContext: nonProductionFixture("unit test"),
  })
  const priorities = resolvePriorities({ score, set: SET, answers })
  const plan = buildPlan({ score, set: SET, answers })

  const scoreId = "score_test"
  const decidedAt = "2026-10-01T09:00:00.000Z"
  const priorityDecision = toStoredPriorityDecision({ scoreId, priorities, decidedAt })
  const planDecision = toStoredPlanDecision({ scoreId, plan, decidedAt })
  const action = toStoredAction({
    id: "action_test",
    scoreId,
    recommendation: plan.today!,
    state: "done",
    createdAt: decidedAt,
    changedAt: "2026-10-02T09:00:00.000Z",
  })

  it.each([
    ["the priority decision", priorityDecision],
    ["the plan decision", planDecision],
    ["a stored action", action],
  ])("%s holds ids and versions, never a sentence", (_label, record) => {
    expect(sentences(record)).toEqual([])
  })

  it("and the decision records carry no reviewed copy even by coincidence", () => {
    const asText = JSON.stringify({ priorityDecision, planDecision })
    for (const copy of [
      priorities[0].headline,
      priorities[0].explanation,
      priorities[0].rationale,
      plan.today!.title,
      plan.today!.practicalAction,
      plan.thirtyDays!.behaviour,
    ]) {
      expect(asText, `reviewed copy was copied into a record: ${copy}`).not.toContain(copy)
    }
  })

  it("the allowlist is empty, and an addition has to be argued for here", () => {
    // Stated as a test so that growing the allowlist is a visible act rather
    // than a quiet one. Nothing persisted today needs free text.
    expect(ALLOWED_FREE_TEXT).toEqual([])
  })
})

