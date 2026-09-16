import { describe, it, expect } from "vitest"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Migration 49, read as text — Phase 4A-S4.
 *
 * The Postgres truth table proves what the SQL DOES. This proves what the file
 * SAYS, which is a different failure mode: a rule quietly removed from the
 * source still passes an executed test if that test was written against an
 * older copy. Sliced from the header so an assertion cannot accidentally be
 * satisfied by an earlier migration's statement.
 */

const RAW = readFileSync(join(process.cwd(), "supabase/migrations.sql"), "utf8")
// Bounded at BOTH ends. Phase 4B-S1 appended Migration 50 after this one, and
// an open-ended slice would have quietly started reading it — every "Migration
// 49 contains X" assertion below would then be satisfiable by a later
// migration's text. Exactly the weakening the Migration 48 slice needed fixing
// for when this file was written.
const SQL = RAW.slice(RAW.indexOf("-- Migration 49:"), RAW.indexOf("-- Migration 50:"))

describe("Migration 48 is untouched", () => {
  it("still carries its own unapplied status and write-once trigger", () => {
    const m48 = RAW.slice(RAW.indexOf("-- Migration 48:"), RAW.indexOf("-- Migration 49:"))
    expect(m48).toContain("STATUS: PROPOSED — DO NOT APPLY WITHOUT EXPLICIT AUTHORISATION.")
    expect(m48).toContain("deep_assessments_seal_is_write_once")
    expect(m48).toContain("CREATE UNIQUE INDEX IF NOT EXISTS idx_deep_assessments_handoff")
    // The partial index stays partial: 49 adds its own FK-able constraint
    // rather than widening this one.
    expect(m48).toContain("WHERE consultation_handoff_id IS NOT NULL")
  })

  it("is byte-identical to the merged baseline", () => {
    /*
     * Pinned by DIGEST, not by phrases. An assertion that looks for the strings
     * it cares about passes an edit that keeps those strings and changes
     * everything around them; this one does not. The value is the sha256 of
     * Migration 48 as it stands at b500c4f — the commit this branch was cut
     * from — so any byte changing inside it fails here.
     *
     * Everything from the header to end of file at that commit, which is how
     * the slice is taken below: at the baseline, 48 was the last migration.
     */
    const m48 = RAW.slice(RAW.indexOf("-- Migration 48:"), RAW.indexOf("\n-- ─────", RAW.indexOf("-- Migration 49:") - 70))
    expect(createHash("sha256").update(m48).digest("hex")).toBe(
      "789b086667e29624e6af13b3c887ab423eddb6df60349b793b63b3b4b8297bb7",
    )
  })
})

describe("Migration 49 says it is proposed and dependent", () => {
  it("carries the DO NOT APPLY header", () => {
    expect(SQL).toContain("STATUS: PROPOSED — DO NOT APPLY WITHOUT EXPLICIT AUTHORISATION.")
  })

  it("states the dependency on Migration 48 in the file itself", () => {
    expect(SQL).toContain("DEPENDS ON MIGRATION 48")
  })
})

describe("the schema", () => {
  it("makes the parent pair referenceable without touching the partial index", () => {
    expect(SQL).toContain(
      "ADD CONSTRAINT deep_assessments_id_handoff_uq UNIQUE (id, consultation_handoff_id)",
    )
  })

  it("keys the Report by its handoff and holds one per assessment", () => {
    expect(SQL).toContain("consultation_handoff_id  uuid PRIMARY KEY")
    expect(SQL).toContain("assessment_id            uuid NOT NULL UNIQUE")
  })

  it("stores canonical TEXT, not jsonb", () => {
    expect(SQL).toContain("canonical_report         text NOT NULL")
    expect(SQL).not.toMatch(/canonical_report\s+jsonb/)
  })

  it("constrains the digest to lowercase hex of exactly 64 characters", () => {
    expect(SQL).toContain("CHECK (canonical_report_sha256 ~ '^[0-9a-f]{64}$')")
  })

  it("binds assessment and handoff together in one composite foreign key", () => {
    const fk = SQL.slice(SQL.indexOf("CONSTRAINT consultation_reports_parent_fk"))
    expect(fk).toContain("FOREIGN KEY (assessment_id, consultation_handoff_id)")
    expect(fk).toContain("REFERENCES deep_assessments (id, consultation_handoff_id)")
    expect(fk).toContain("ON DELETE CASCADE")
  })

  it("enables RLS and grants nothing", () => {
    expect(SQL).toContain("ALTER TABLE consultation_reports ENABLE ROW LEVEL SECURITY")
    expect(SQL).not.toContain("CREATE POLICY")
    expect(SQL).not.toContain("GRANT ")
  })
})

describe("the database backstops", () => {
  const writeOnce = SQL.slice(
    SQL.indexOf("CREATE OR REPLACE FUNCTION consultation_reports_is_write_once"),
    SQL.indexOf("DROP TRIGGER IF EXISTS trg_consultation_reports_write_once"),
  )

  it("covers every column, so none is quietly mutable", () => {
    for (const column of [
      "consultation_handoff_id",
      "assessment_id",
      "canonical_report",
      "canonical_report_sha256",
      "persisted_at",
    ]) {
      expect(writeOnce, `write-once does not cover ${column}`).toContain(
        `NEW.${column}`,
      )
    }
  })

  it("compares NULL-safely, so an equal-value re-send is not refused", () => {
    expect(writeOnce.match(/IS DISTINCT FROM/g) ?? []).toHaveLength(5)
  })

  it("refuses a direct child delete by asking whether the parent still exists", () => {
    const del = SQL.slice(SQL.indexOf("CREATE OR REPLACE FUNCTION consultation_reports_parent_only_delete"))
    expect(del).toContain("SELECT 1 FROM deep_assessments WHERE id = OLD.assessment_id")
    expect(del).toContain("restrict_violation")
  })

  it("creates each trigger under the name it drops, so a rename cannot orphan it", () => {
    /*
     * A sabotage case renamed only the CREATE TRIGGER identifier, leaving a
     * trigger that is never dropped on re-apply and never matched by name. The
     * DROP and CREATE names are therefore compared as a pair.
     */
    for (const name of [
      "trg_consultation_reports_write_once",
      "trg_consultation_reports_parent_only_delete",
      "trg_consultation_reports_no_truncate",
    ]) {
      expect(SQL, `${name} is not dropped first`).toContain(`DROP TRIGGER IF EXISTS ${name} ON`)
      expect(SQL, `${name} is not created`).toMatch(
        new RegExp(`CREATE TRIGGER ${name}\\s`),
      )
    }
  })

  it("refuses TRUNCATE at statement level, where row triggers do not fire", () => {
    expect(SQL).toContain("BEFORE TRUNCATE ON consultation_reports")
    expect(SQL).toContain("FOR EACH STATEMENT")
  })

  it("offers no registration function and no bypass", () => {
    expect(SQL).not.toContain("SECURITY DEFINER")
    expect(SQL).not.toMatch(/CREATE OR REPLACE FUNCTION\s+\w*register/)
  })
})
