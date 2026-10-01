import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { execSync } from "node:child_process"
import {
  LocalStorageRepository,
  SupabaseRepositoryDisabled,
  foodSystemRepository,
} from "@/lib/fss/persistence/local"
import { RepositoryWriteRefused } from "@/lib/fss/persistence/repository"
import { resolveQuestionSetV1 } from "@/lib/fss/questions/resolve"
import { computeFoodSystemScore } from "@/lib/fss/engine/score"
import {
  DEV_ONLY_FSS_V1_FIXTURE_WEIGHTS,
  nonProductionFixture,
} from "@/lib/fss/engine/weights"
import { FSS_V1_PROVENANCE } from "@/lib/fss/engine/provenance"
import { buildPlan } from "@/lib/fss/action/plan"
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

  it("works server-side, where there is no window at all", async () => {
    ;(globalThis as { window?: unknown }).window = undefined
    const repo = new LocalStorageRepository()
    await expect(repo.loadLatestScore()).resolves.toBeNull()
    await expect(repo.saveScore({
      id: "s", assessmentId: "a", state: "scored", score: 50, domains: [],
      completeness: 1,
      provenance: {
        fssMethodVersion: "fss-v1.0", assessmentVersion: "assessment-v1.0",
        questionSetVersion: "questions-v1.0", calculationVersion: "calc-v1.0",
        interpretationVersion: "interpretation-v1.0",
      },
      computedAt: "",
    })).resolves.toBeUndefined()
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
    expect(await repo.loadLatestScore()).toBeNull()
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
    status: "proposed",
    createdAt: "2026-10-01T09:00:00.000Z",
  })

  it("carries both versions, the ids, and no sentence", () => {
    expect(Object.keys(stored).sort()).toEqual([
      "actionCategory",
      "actionSetVersion",
      "createdAt",
      "id",
      "provenance",
      "recommendationId",
      "scoreId",
      "sourceDomain",
      "sourcePriority",
      "status",
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

describe("the contract is complete but still has no caller", () => {
  it("saveAction and saveScore are both uncalled, and that is deliberate", () => {
    /*
     * Your Plan is deterministic from the answers, so nothing about it needs
     * storing. StoredAction.scoreId would need a StoredScore.id, and the walk
     * holds its score in component state — so both calls arrive together or
     * not at all. Minting a scoreId for nothing would be half a feature.
     *
     * This test is here so that when a later gate DOES wire them, it has to
     * come past this assertion and say so.
     */
    const callers = execSync(
      "git grep -l -E 'saveAction\\(|saveScore\\(' -- 'lib/**' 'components/**' 'app/**' || true",
      { encoding: "utf-8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .filter((f) => !f.startsWith("lib/fss/persistence/"))

    expect(callers, "a caller appeared — wire the pair together and update this").toEqual([])
  })
})
