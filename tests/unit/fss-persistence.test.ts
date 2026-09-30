import { describe, it, expect, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import {
  LocalStorageRepository,
  SupabaseRepositoryDisabled,
  foodSystemRepository,
} from "@/lib/fss/persistence/local"
import { RepositoryWriteRefused } from "@/lib/fss/persistence/repository"

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
