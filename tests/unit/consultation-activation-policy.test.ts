/**
 * Who may open a PERSISTED deterministic Consultation — Phase 3C-C2B.
 *
 * ══ WHAT IS ACTUALLY BEING PROTECTED ════════════════════════════════════════
 *
 * Two separate failures, either of which is enough on its own:
 *
 *  1. Phase 4A does not exist. A real buyer routed into the deterministic flow
 *     would pay €49, answer twenty minutes of questions, have the record sealed
 *     at `ready-for-report` — and be standing in front of nothing.
 *  2. Migration 48 is drafted and NOT applied. `consultation_finalisation` and
 *     `consultation_handoff_id` are not columns in production, and every
 *     deterministic route selects them. Against the live schema they error.
 *
 * So this is not a feature flag with a nice default. It is the thing standing
 * between a paying customer and a dead end, and the matrix below is its whole
 * contract: anything that is not an explicit opt-in in a runtime that can be
 * PROVEN non-production must be `false`.
 *
 * Deliberately the same shape as `paid-flow-policy.test.ts`. Two safety gates
 * that disagree about what "non-production" means would be two answers to the
 * same question.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import {
  isPersistedConsultationAllowed,
  PERSISTED_CONSULTATION_FLAG,
} from "@/lib/consultation/persisted-activation-policy"

/** Build an env WITHOUT inheriting the runner's own NODE_ENV/VERCEL_ENV. */
function env(overrides: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return overrides as NodeJS.ProcessEnv
}
const ON = { [PERSISTED_CONSULTATION_FLAG]: "true" }

describe("persisted activation requires an opt-in AND a provably non-production runtime", () => {
  it("A — Vercel production + flag true → denied", () => {
    // The single most important row. A variable pasted into the wrong Vercel
    // project must not activate an unfinished product path for real buyers.
    expect(isPersistedConsultationAllowed(env({ ...ON, VERCEL_ENV: "production" }))).toBe(false)
  })

  it("B — Vercel production + flag absent → denied", () => {
    expect(isPersistedConsultationAllowed(env({ VERCEL_ENV: "production" }))).toBe(false)
  })

  it("C — Vercel preview + flag absent → denied", () => {
    // Non-production is not consent. The opt-in is the other half of the rule.
    expect(isPersistedConsultationAllowed(env({ VERCEL_ENV: "preview" }))).toBe(false)
  })

  it("D — Vercel preview + flag true → allowed", () => {
    expect(isPersistedConsultationAllowed(env({ ...ON, VERCEL_ENV: "preview" }))).toBe(true)
  })

  it("E — Vercel development + flag true → allowed", () => {
    expect(isPersistedConsultationAllowed(env({ ...ON, VERCEL_ENV: "development" }))).toBe(true)
  })

  it("F — no Vercel + NODE_ENV development or test + flag true → allowed", () => {
    // The local dev server and this test runner. Both prove non-production
    // positively rather than by the absence of evidence.
    expect(isPersistedConsultationAllowed(env({ ...ON, NODE_ENV: "development" }))).toBe(true)
    expect(isPersistedConsultationAllowed(env({ ...ON, NODE_ENV: "test" }))).toBe(true)
  })

  it("G — no Vercel + NODE_ENV production + flag true → denied", () => {
    // A self-hosted production build has no VERCEL_ENV to check. Absence of a
    // Vercel variable is not evidence of safety.
    expect(isPersistedConsultationAllowed(env({ ...ON, NODE_ENV: "production" }))).toBe(false)
  })

  it("H — no Vercel + no NODE_ENV at all + flag true → denied", () => {
    // Nothing to prove anything with. Deny is the only defensible answer.
    expect(isPersistedConsultationAllowed(env({ ...ON }))).toBe(false)
  })

  it("I — an unrecognised VERCEL_ENV + flag true → denied", () => {
    // Not an allow-list miss to be patched later: a runtime this policy does
    // not understand is a runtime it cannot clear.
    expect(isPersistedConsultationAllowed(env({ ...ON, VERCEL_ENV: "staging" }))).toBe(false)
    expect(isPersistedConsultationAllowed(env({ ...ON, VERCEL_ENV: "" }))).toBe(false)
  })

  it("J — only the exact string \"true\" is an opt-in", () => {
    // "1", "yes" and "TRUE" are the shapes a config accident takes. An accident
    // is not a decision to put customers into an unfinished flow.
    for (const value of ["1", "yes", "TRUE", "True", "on", " true"]) {
      expect(
        isPersistedConsultationAllowed(env({ [PERSISTED_CONSULTATION_FLAG]: value, NODE_ENV: "test" })),
        `"${value}" must not activate`,
      ).toBe(false)
    }
  })
})

describe("the switch cannot reach the browser", () => {
  it("the flag is not NEXT_PUBLIC_ prefixed", () => {
    // A NEXT_PUBLIC_ variable is inlined into the client bundle. Activation
    // would then be a value the browser holds, and anything the browser holds
    // is something a request can imitate.
    expect(PERSISTED_CONSULTATION_FLAG.startsWith("NEXT_PUBLIC_")).toBe(false)
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
})
