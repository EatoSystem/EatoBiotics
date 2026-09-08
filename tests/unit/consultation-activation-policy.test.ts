/**
 * Who may open, and who may continue, a persisted deterministic Consultation.
 *
 * ══ WHY THIS FILE WAS REWRITTEN ═════════════════════════════════════════════
 *
 * It used to test ONE function that answered both questions, and its guards
 * pinned that conflation in place — one of them asserted the same policy was
 * called exactly twice, for the claim and for the render. That is the defect,
 * asserted as if it were the contract.
 *
 * The two decisions are not the same decision:
 *
 *   runtime eligibility — may this runtime execute the persisted stack at all?
 *                         Fail-closed, because Phase 4A does not exist and
 *                         Migration 48 is unapplied, so a real buyer routed
 *                         here would pay €49, answer for twenty minutes, be
 *                         sealed, and be standing in front of nothing.
 *   new-claim rollout   — may an UNCLAIMED paid session be newly claimed?
 *                         An opt-in on top of the above.
 *
 * Conflating them means switching the rollout off strands whoever was already
 * mid-Consultation: their answers stay in the row, and the page stops showing
 * them the only flow that can read it.
 *
 * Deliberately the same shape as `paid-flow-policy.test.ts` for the runtime
 * half. Two safety gates that disagree about what "non-production" means would
 * be two answers to the same question.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import {
  isNewDeterministicClaimAllowed,
  isPersistedRuntimeEligible,
  NEW_DETERMINISTIC_CLAIM_FLAG,
} from "@/lib/consultation/persisted-activation-policy"

/** Build an env WITHOUT inheriting the runner's own NODE_ENV/VERCEL_ENV. */
function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return overrides as NodeJS.ProcessEnv
}
const ON = { [NEW_DETERMINISTIC_CLAIM_FLAG]: "true" }

/* ══ The truth table ═══════════════════════════════════════════════════════ */

describe("runtime eligibility and new-claim rollout, as one table", () => {
  const rows: Array<{
    name: string
    env: Record<string, string | undefined>
    runtime: boolean
    claim: boolean
  }> = [
    // The single most important row: a flag pasted into the wrong Vercel
    // project must not activate an unfinished product path for real buyers.
    { name: "Vercel production + flag", env: { ...ON, VERCEL_ENV: "production" }, runtime: false, claim: false },
    { name: "Vercel production, no flag", env: { VERCEL_ENV: "production" }, runtime: false, claim: false },
    // Non-production runtime alone is NOT consent to claim — but it is enough
    // to keep serving a session that already exists.
    { name: "Vercel preview, no flag", env: { VERCEL_ENV: "preview" }, runtime: true, claim: false },
    { name: "Vercel preview + flag", env: { ...ON, VERCEL_ENV: "preview" }, runtime: true, claim: true },
    { name: "Vercel development + flag", env: { ...ON, VERCEL_ENV: "development" }, runtime: true, claim: true },
    // The local dev server and this test runner: non-production proven
    // positively rather than by the absence of evidence.
    { name: "no Vercel, NODE_ENV=development + flag", env: { ...ON, NODE_ENV: "development" }, runtime: true, claim: true },
    { name: "no Vercel, NODE_ENV=test + flag", env: { ...ON, NODE_ENV: "test" }, runtime: true, claim: true },
    { name: "no Vercel, NODE_ENV=test, no flag", env: { NODE_ENV: "test" }, runtime: true, claim: false },
    // A self-hosted production build has no VERCEL_ENV to check. Absence of a
    // Vercel variable is not evidence of safety.
    { name: "no Vercel, NODE_ENV=production + flag", env: { ...ON, NODE_ENV: "production" }, runtime: false, claim: false },
    { name: "nothing at all + flag", env: { ...ON }, runtime: false, claim: false },
    // Not an allow-list miss to be patched later: a runtime this policy does
    // not understand is a runtime it cannot clear.
    { name: "unrecognised VERCEL_ENV + flag", env: { ...ON, VERCEL_ENV: "staging" }, runtime: false, claim: false },
    { name: "empty VERCEL_ENV + flag", env: { ...ON, VERCEL_ENV: "" }, runtime: false, claim: false },
  ]

  for (const row of rows) {
    it(`${row.name} → runtime ${row.runtime}, claim ${row.claim}`, () => {
      expect(isPersistedRuntimeEligible(env(row.env)), "runtime eligibility").toBe(row.runtime)
      expect(isNewDeterministicClaimAllowed(env(row.env)), "new-claim rollout").toBe(row.claim)
    })
  }

  it("a claim is never allowed where the runtime is not", () => {
    // The one relationship between the two. Stated as its own assertion so a
    // future edit cannot make the claim policy a peer of the runtime check
    // rather than a narrowing of it.
    for (const row of rows) {
      if (!row.runtime) {
        expect(isNewDeterministicClaimAllowed(env(row.env)), row.name).toBe(false)
      }
    }
  })

  it("only the exact string \"true\" opts in to new claims", () => {
    // "1", "yes" and "TRUE" are the shapes a config accident takes. An accident
    // is not a decision to put customers into an unfinished flow.
    for (const value of ["1", "yes", "TRUE", "True", "on", " true", ""]) {
      const e = env({ [NEW_DETERMINISTIC_CLAIM_FLAG]: value, NODE_ENV: "test" })
      expect(isNewDeterministicClaimAllowed(e), `"${value}" must not enable claiming`).toBe(false)
      // …and the runtime is still eligible, so nobody already claimed is lost.
      expect(isPersistedRuntimeEligible(e), `"${value}" must not disable the runtime`).toBe(true)
    }
  })
})

/* ══ The switch cannot reach the browser ═══════════════════════════════════ */

describe("no activation control is client-readable", () => {
  it("the flag is not NEXT_PUBLIC_ prefixed", () => {
    // A NEXT_PUBLIC_ variable is inlined into the client bundle. Activation
    // would then be a value the browser holds, and anything the browser holds
    // is something a request can imitate.
    expect(NEW_DETERMINISTIC_CLAIM_FLAG.startsWith("NEXT_PUBLIC_")).toBe(false)
  })

  it("no NEXT_PUBLIC_ variable anywhere names this activation", () => {
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (/\.(ts|tsx|mjs)$/.test(entry.name)) out.push(full)
      }
      return out
    }
    const offenders = ["app", "components", "lib", "scripts"]
      .flatMap((d) => walk(join(process.cwd(), d)))
      .filter((f) =>
        /NEXT_PUBLIC_[A-Z_]*(PERSISTED|DETERMINISTIC|CONSULTATION)/.test(readFileSync(f, "utf8")),
      )
    expect(offenders.map((f) => f.slice(process.cwd().length + 1))).toEqual([])
  })

  it("the policy module reads process.env and nothing else", () => {
    // No request, no header, no cookie, no query parameter, no database. Every
    // one of those is attacker-influenced; the deploy environment is not.
    const source = readFileSync(
      join(process.cwd(), "lib/consultation/persisted-activation-policy.ts"),
      "utf8",
    )
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    expect(/\bimport\b/.test(code), "the policy must depend on nothing").toBe(false)
    for (const forbidden of ["searchParams", "headers(", "cookies(", "request", "supabase"]) {
      expect(code.includes(forbidden), `policy must not consult ${forbidden}`).toBe(false)
    }
  })

  it("the conflated predicate is gone, not merely unused", () => {
    // An available function that answers both questions at once is an
    // invitation to call it again — the same reasoning that deleted the Stripe
    // metadata writer rather than leaving it unreferenced.
    const walk = (dir: string, out: string[] = []): string[] => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".next") continue
        const full = join(dir, entry.name)
        if (entry.isDirectory()) walk(full, out)
        else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
      }
      return out
    }
    const survivors = ["app", "components", "lib", "scripts"]
      .flatMap((d) => walk(join(process.cwd(), d)))
      .filter((f) => readFileSync(f, "utf8").includes("isPersistedConsultationAllowed("))
    expect(survivors.map((f) => f.slice(process.cwd().length + 1))).toEqual([])
  })
})
