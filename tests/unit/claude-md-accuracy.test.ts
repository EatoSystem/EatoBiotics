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
import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

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

/** The one project this repository may ever talk to. */
const EATOBIOTICS_PRODUCTION = "ephmojiwlcebenholhpc"

/**
 * EatoSystem projects. A different product, in the same Supabase org.
 *
 * Classified by the founder on 2026-08-23 — the only authority that can say
 * what a project is for. They are listed in CLAUDE.md so that an agent reading
 * `list_projects` can recognise and avoid them, NOT because this codebase has
 * any business with them.
 */
const EATOSYSTEM_PROJECTS = ["hwuzbxsaxsifpdzqhqaq", "ohwzmulsvbfgaxgziqeo"]

const ALL_REFS = [EATOBIOTICS_PRODUCTION, ...EATOSYSTEM_PROJECTS]

/**
 * The TABLE ROW for a ref — not merely the first line mentioning it.
 *
 * The prose around the table names refs too, so a plain
 * `.find(l => l.includes(ref))` could match explanatory text instead of the
 * row and then pass or fail for the wrong reason.
 */
function projectRow(ref: string): string {
  const row = DOC.split("\n").find((l) => new RegExp(`^\\s*\\|\\s*\`${ref}\``).test(l))
  if (!row) throw new Error(`no table row found for project ${ref}`)
  return row
}

describe("the Supabase project list records ownership, not status", () => {
  it("names all three refs, so 'name the ref explicitly' has a full list to name from", () => {
    for (const ref of ALL_REFS) {
      expect(DOC, `project ${ref} must be listed`).toContain(ref)
      expect(() => projectRow(ref), `project ${ref} must have a table row`).not.toThrow()
    }
  })

  it("identifies the production ref as the EatoBiotics production project", () => {
    const row = projectRow(EATOBIOTICS_PRODUCTION)
    expect(row).toMatch(/EatoBiotics production project/i)
    expect(row, "the doc must say this is the only project the repo may target").toMatch(
      /only project this repository may target/i,
    )
  })

  it("identifies both EatoSystem projects as unrelated and forbidden targets", () => {
    for (const ref of EATOSYSTEM_PROJECTS) {
      const row = projectRow(ref)
      expect(row, `${ref} must be marked unrelated`).toMatch(/unrelated to EatoBiotics/i)
      expect(row, `${ref} must be marked a forbidden target`).toMatch(/never a target/i)
    }
  })

  it("does not label an EatoSystem project staging, preview, safe, or production", () => {
    // The founder's classification is "unrelated". Anything softer reopens the
    // door this closed — a future reader must not find a hint that one of these
    // could serve as an EatoBiotics environment.
    for (const ref of EATOSYSTEM_PROJECTS) {
      const row = projectRow(ref)
      expect(row, `${ref} must not be given an EatoBiotics role`).not.toMatch(
        /staging|preview|safe to use|production|role not established/i,
      )
    }
  })

  it("attaches no mutable status to any project row", () => {
    // The table used to carry ACTIVE/INACTIVE and went stale without anyone
    // editing the file. Status is also not ownership, which is the actual
    // question this table answers.
    for (const ref of ALL_REFS) {
      expect(projectRow(ref), `a status in this row goes stale on Supabase's schedule`).not.toMatch(
        /\bACTIVE\b|\bINACTIVE\b|\bPAUSED\b|\bHEALTHY\b/i,
      )
    }
  })

  it("records that no EatoBiotics staging project exists yet", () => {
    expect(DOC).toMatch(/There is no EatoBiotics staging project/i)
  })

  it("points at a live read rather than a written-down status", () => {
    expect(DOC).toMatch(/`list_projects`/)
  })
})

describe("no EatoBiotics code may select an EatoSystem project", () => {
  it("names an EatoSystem ref nowhere but this documentation and this test", () => {
    // The strongest form of "never a target": the strings do not appear in any
    // route, library, component, script, migration, manifest or config. A
    // future edit that wires one in fails here rather than at runtime against
    // someone else's database.
    const roots = ["app", "lib", "components", "scripts", "supabase", "tests"]
    const offenders: string[] = []

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && !entry.name.startsWith(".")) walk(full)
          continue
        }
        if (full === join("tests", "unit", "claude-md-accuracy.test.ts")) continue
        if (!/\.(ts|tsx|mjs|js|json|sql)$/.test(entry.name)) continue
        const source = readFileSync(full, "utf8")
        if (EATOSYSTEM_PROJECTS.some((ref) => source.includes(ref))) offenders.push(full)
      }
    }

    for (const root of roots) walk(root)
    expect(offenders, "an EatoSystem project ref must never reach EatoBiotics code").toEqual([])
  })

  it("uses the production ref for the live-read instruction it gives", () => {
    expect(DOC).toMatch(new RegExp(`\`list_tables\` against \`${EATOBIOTICS_PRODUCTION}\``))
    for (const ref of EATOSYSTEM_PROJECTS) {
      expect(DOC, `the doc must never instruct a read against ${ref}`).not.toMatch(
        new RegExp(`(list_tables|execute_sql|against)[^\\n]*${ref}`),
      )
    }
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
