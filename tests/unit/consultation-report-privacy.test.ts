import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Lifecycle, retention and the activation prerequisite — Phase 4A-S4.
 *
 * ══ IMMUTABLE IS NOT UNDELETABLE ════════════════════════════════════════════
 *
 * A canonical Report is write-once while it exists, and erasable with the
 * Consultation it belongs to. It has no TTL of its own and no delete path of
 * its own: deleting it while its parent survived would leave a sealed handoff
 * with no Report, and lazy generation would then write a NEW one under whatever
 * composer happened to be current — one customer, two accounts of what they
 * were told.
 *
 * ══ AND WHY THE EXPORT ROUTE IS NOT TOUCHED YET ═════════════════════════════
 *
 * `consultation_reports` does not exist in production: Migrations 48 and 49 are
 * both unapplied. Adding an unconditional query to the live portability
 * endpoint would make that route fail for every customer, to retrieve rows that
 * cannot exist because nothing can create them. The export is an ACTIVATION
 * PREREQUISITE instead, recorded in CLAUDE.md and asserted below.
 */

const migrations = readFileSync(join(process.cwd(), "supabase/migrations.sql"), "utf8")
const m49 = migrations.slice(migrations.indexOf("-- Migration 49:"))

describe("the delete contract, in the migration source", () => {
  it("cascades from the parent assessment", () => {
    expect(m49).toContain("ON DELETE CASCADE")
    expect(m49).toContain("REFERENCES deep_assessments (id, consultation_handoff_id)")
  })

  it("refuses a direct child delete while the parent survives", () => {
    expect(m49).toContain("consultation_reports_parent_only_delete")
    expect(m49).toContain("SELECT 1 FROM deep_assessments WHERE id = OLD.assessment_id")
    expect(m49).toContain("BEFORE DELETE ON consultation_reports")
  })

  it("refuses TRUNCATE, which row triggers do not see", () => {
    expect(m49).toContain("BEFORE TRUNCATE ON consultation_reports")
    expect(m49).toContain("consultation_reports cannot be truncated")
  })

  it("gives the Report no TTL and no expiry column of its own", () => {
    expect(m49).not.toContain("expires_at")
    expect(m49).not.toContain("interval '")
  })
})

describe("the service touches no retention machinery", () => {
  const entry = readFileSync(join(process.cwd(), "lib/report/persisted/ensure-report.ts"), "utf8")

  it("never deletes anything", () => {
    expect(entry).not.toContain(".delete(")
  })

  it("reads exactly two tables and writes exactly one", () => {
    const tables = [...entry.matchAll(/\.from\("([a-z_]+)"\)/g)].map((m) => m[1])
    expect([...new Set(tables)].sort()).toEqual(["consultation_reports", "deep_assessments"])
  })
})

describe("the live account routes are untouched in S4", () => {
  const exportRoute = readFileSync(join(process.cwd(), "app/api/account/export/route.ts"), "utf8")
  const deleteRoute = readFileSync(join(process.cwd(), "app/api/account/delete/route.ts"), "utf8")

  it("the portability export does not query a table that does not exist yet", () => {
    expect(exportRoute).not.toContain("consultation_reports")
  })

  it("the deletion route is unchanged and still hard-deletes the parent", () => {
    expect(deleteRoute).not.toContain("consultation_reports")
    expect(deleteRoute).toContain('for (const table of ["deep_assessments", "leads"] as const)')
  })
})

describe("the activation prerequisite is written down", () => {
  const claude = readFileSync(join(process.cwd(), "CLAUDE.md"), "utf8")

  it("CLAUDE.md records the ordered steps before any customer caller", () => {
    for (const phrase of [
      "consultation_reports",
      "Migration 49",
      "ACTIVATION PREREQUISITE",
      "portability export",
    ]) {
      expect(claude, `CLAUDE.md does not mention ${phrase}`).toContain(phrase)
    }
  })

  it("says plainly that a missing table must not be masked as an absence", () => {
    expect(claude.toLowerCase()).toContain("must not be masked")
  })
})
