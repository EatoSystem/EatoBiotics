/**
 * CLAUDE.md must not describe code that no longer exists (#231).
 *
 * This file is the one every agent session is told to treat as authoritative,
 * and it carries the production-database rule — the rule that exists because it
 * has already failed twice and that asks readers to trust the document over
 * their own assumptions. A governing file that is demonstrably wrong on an
 * easily-checked fact teaches its readers to spot-check everything in it, which
 * erodes exactly the rule most needing to be followed on faith.
 *
 * Two drifts were found by hand in #231. This pins the one that is cheaply
 * checkable from the repo itself.
 *
 * Deliberately NOT pinned: the table count. Any assertion tying a number in
 * prose to production would need either a live query in CI (rejected in #230,
 * for keeping CI hermetic) or a second hardcoded number that drifts in step
 * with the first. Removing the number was the fix.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const DOC = readFileSync("CLAUDE.md", "utf8")
const GATE = readFileSync("lib/dev-password-gate.ts", "utf8")

describe("the password-gate documentation matches the code", () => {
  it("has no hardcoded fallback password in the gate", () => {
    // The guard below is only meaningful while this holds. If a fallback is
    // ever reintroduced, this fails first and says so plainly.
    expect(
      GATE,
      "a hardcoded fallback would make the site reachable without DEV_PASSWORD",
    ).not.toMatch(/const\s+FALLBACK\w*\s*=\s*["'`]/)
  })

  it("does not warn about a hardcoded fallback that no longer exists", () => {
    // The exact stale claim #231 found: "a temporary fallback password is
    // hardcoded in lib/dev-password-gate.ts — remove before launch".
    const staleWarning = /fallback password is\s+#?\s*hardcoded|hardcoded in lib\/dev-password-gate/i
    expect(
      DOC,
      "CLAUDE.md describes a hardcoded fallback password; the gate has none",
    ).not.toMatch(staleWarning)
  })

  it("records the consequence that replaced it — unset DEV_PASSWORD means a public site", () => {
    // This is the fact the stale warning was obscuring, and it is a go-live
    // decision rather than a code smell.
    expect(DOC).toMatch(/THE GATE IS OFF AND THE SITE IS PUBLIC/)
    expect(DOC).toMatch(/`DEV_PASSWORD` must be set in the deploy env/)
  })
})

describe("the Supabase project list is complete", () => {
  it("names all three project refs, so 'name the ref explicitly' has a full list", () => {
    for (const ref of ["ephmojiwlcebenholhpc", "hwuzbxsaxsifpdzqhqaq", "ohwzmulsvbfgaxgziqeo"]) {
      expect(DOC, `project ${ref} must be listed`).toContain(ref)
    }
  })

  it("does not classify the undocumented project", () => {
    // #225 is explicit that establishing its role needs someone with the
    // authority to say so. Recording that it exists is a fact; guessing what
    // it is for would be the opposite of what that issue asks.
    const row = DOC.split("\n").find((l) => l.includes("ohwzmulsvbfgaxgziqeo"))!
    expect(row).toMatch(/role not established/i)
    expect(row).not.toMatch(/staging|production target|safe to use/i)
  })
})

describe("the table-count claim is gone rather than merely updated", () => {
  it("quotes no fixed table count", () => {
    expect(
      DOC,
      "a number in prose drifts; point at a live read instead",
    ).not.toMatch(/\d+\s+distinct tables exist/)
  })

  it("says how to obtain a current count", () => {
    expect(DOC).toMatch(/`list_tables` against `ephmojiwlcebenholhpc`/)
  })
})
