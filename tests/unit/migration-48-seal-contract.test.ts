/**
 * Migration 48 — deterministic Consultation finalisation & trusted handoff.
 *
 * DRAFTED and unapplied: a human applies it. That is exactly why these
 * assertions matter. Once the SQL runs, immutability and seal coherence are
 * baked into production and are painful to change — and the review that catches
 * a mistake has to happen HERE, against text, rather than afterwards against a
 * customer's sealed record.
 *
 * There is no disposable Postgres in this repository's test tooling, so the
 * constraints cannot be exercised for real here; the route tests instead run
 * against a fake whose seal semantics are written to match this SQL. Both halves
 * are needed: this file says what the database will enforce, and those say the
 * application behaves correctly given that it does.
 *
 * Comments are stripped before matching, because the migration explains at
 * length WHY each rule exists and matching prose would pass on the rationale
 * rather than on the statement.
 */
import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"

const RAW = readFileSync("supabase/migrations.sql", "utf8")

/** Migration 48's own text, comments included — for header assertions. */
const RAW_48 = RAW.slice(RAW.indexOf("-- Migration 48:"))

/*
 * Migration 48's STATEMENTS, comments stripped.
 *
 * Scoped to this migration rather than the whole file. `deep_assessments` has
 * been altered before and the file holds dozens of indexes, so a search over
 * everything would slice from some earlier migration's statement and assert
 * against text this one never wrote.
 */
const SQL = RAW_48.split("\n")
  .filter((l) => !l.trimStart().startsWith("--"))
  .join("\n")

/* ══ It must not be applied by anything here ═══════════════════════════════ */

describe("Migration 48 is drafted, not applied", () => {
  it("says so in its header", () => {
    expect(RAW).toContain("-- Migration 48:")
    expect(RAW_48).toContain("PROPOSED — DO NOT APPLY WITHOUT EXPLICIT AUTHORISATION")
  })

  it("nothing in the repository applies it", () => {
    // A migration that a script could run is not drafted, whatever the header
    // says. The only route to production is a human in the SQL editor.
    const scripts = readFileSync("package.json", "utf8")
    expect(scripts).not.toMatch(/migrations\.sql/)
  })

  it("is additive, with no backfill and no rewrite of existing rows", () => {
    // An UPDATE or INSERT here would touch live customer rows the moment it is
    // applied. Asserted against the STATEMENTS, not the prose: the migration
    // explains at length that it performs no backfill, and a guard that read
    // the explanation would be satisfied by the word rather than the absence.
    expect(SQL).not.toMatch(/\bUPDATE\s+deep_assessments/i)
    expect(SQL).not.toMatch(/\bINSERT\s+INTO\b/i)
  })
})

/* ══ The columns ═══════════════════════════════════════════════════════════ */

describe("it adds exactly the two seal columns", () => {
  it("both are nullable, so every existing row stays valid", () => {
    const add = SQL.slice(0, SQL.indexOf("CREATE UNIQUE INDEX"))
    expect(add).toMatch(/ADD COLUMN IF NOT EXISTS consultation_finalisation jsonb/)
    expect(add).toMatch(/ADD COLUMN IF NOT EXISTS consultation_handoff_id\s+uuid/)
    // NOT NULL on either would fail the moment it met a legacy row.
    expect(add).not.toMatch(/NOT NULL/)
    expect(add).not.toMatch(/DEFAULT/)
  })

  it("the handoff is unique, so one identity cannot describe two Consultations", () => {
    expect(SQL).toMatch(
      /CREATE UNIQUE INDEX IF NOT EXISTS idx_deep_assessments_handoff\s+ON deep_assessments \(consultation_handoff_id\)\s+WHERE consultation_handoff_id IS NOT NULL/,
    )
  })
})

/* ══ Coherence ═════════════════════════════════════════════════════════════ */

describe("the database refuses to hold an incoherent seal", () => {
  it("the pair is all-or-nothing", () => {
    // A finalisation with no handoff cannot be referred to; a handoff with no
    // finalisation refers to nothing. Either is the visible symptom of a write
    // that was meant to be atomic and was not.
    const c = SQL.slice(SQL.indexOf("deep_assessments_seal_pair"))
    expect(c).toMatch(/consultation_finalisation IS NULL AND consultation_handoff_id IS NULL/)
    expect(c).toMatch(/consultation_finalisation IS NOT NULL AND consultation_handoff_id IS NOT NULL/)
  })

  const coherence = () =>
    SQL.slice(SQL.indexOf("deep_assessments_seal_state_coherent"), SQL.indexOf("END $$"))

  it("a sealed row must carry a finished deterministic state", () => {
    const c = coherence()
    expect(c).toContain("'deterministic-consultation-state'")
    expect(c).toContain("'ready-for-report'")
    // (ready, questionId) is a finished Consultation that is also mid-edit.
    expect(c).toMatch(/answers -> 'currentQuestionId' = 'null'::jsonb/)
  })

  it("every comparison is TWO-VALUED, so a missing key is FALSE and not UNKNOWN", () => {
    /*
     * The defect this pins. A CHECK accepts TRUE *or UNKNOWN*, and extracting a
     * missing key from jsonb yields SQL NULL — so the first draft of this
     * constraint, written with ordinary `=`, ACCEPTED a sealed row with a NULL
     * `answers`, an empty object, or a state missing `kind`, `phase` or
     * `currentQuestionId`. Four of the six shapes it exists to reject.
     *
     * `migration-48-postgres-truth-table.test.ts` proves the behaviour against a
     * real server where one is available; this asserts the SQL is written the
     * way that behaviour depends on, and runs everywhere.
     */
    const c = coherence()
    expect(c, "a SQL NULL answers must be FALSE, not UNKNOWN").toMatch(/answers IS NOT NULL/)
    expect(c, "kind must use NULL-safe equality").toMatch(
      /\(answers ->> 'kind'\) IS NOT DISTINCT FROM/,
    )
    expect(c, "phase must use NULL-safe equality").toMatch(
      /\(answers ->> 'phase'\) IS NOT DISTINCT FROM/,
    )
    // Key EXISTENCE, which is what separates "absent" from "JSON null".
    expect(c, "the cursor key must be required to exist").toMatch(/answers \? 'currentQuestionId'/)
  })

  it("no bare `=` comparison is left on an extracted key", () => {
    // The exact shape of the original bug: `answers ->> 'x' = '...'` is UNKNOWN
    // when the key is missing, and UNKNOWN passes a CHECK.
    const c = coherence()
    expect(c).not.toMatch(/answers ->> '\w+' = '/)
    expect(c).not.toMatch(/jsonb_typeof\(answers -> '\w+'\)/)
  })
})

/* ══ Idempotency must not be fooled by another table ═══════════════════════ */

describe("re-applying the migration is scoped to this table", () => {
  it("both constraint lookups check conrelid, not just the name", () => {
    // `pg_constraint.conname` is not globally unique. A same-named constraint
    // on any other table would satisfy an unscoped EXISTS and silently skip the
    // ADD — leaving the migration reporting success with no constraint added.
    for (const name of ["deep_assessments_seal_pair", "deep_assessments_seal_state_coherent"]) {
      const lookup = SQL.slice(SQL.indexOf(name), SQL.indexOf(name) + 220)
      expect(lookup, name).toMatch(/conrelid = 'deep_assessments'::regclass/)
    }
  })

  it("it says nothing about UNSEALED rows", () => {
    // One-directional on purpose: every legacy row, every in-progress
    // Consultation and every legacy `answers` object stays valid with both
    // columns NULL. A constraint that also described unsealed rows would fail
    // against data written years before any of this existed.
    const c = SQL.slice(
      SQL.indexOf("deep_assessments_seal_state_coherent"),
      SQL.indexOf("END $$"),
    )
    expect(c).toMatch(/consultation_finalisation IS NULL\s*\n?\s*OR/)
  })
})

/* ══ Write-once ════════════════════════════════════════════════════════════ */

describe("the seal is write-once below the application", () => {
  const fn = SQL.slice(
    SQL.indexOf("CREATE OR REPLACE FUNCTION deep_assessments_seal_is_write_once"),
    SQL.indexOf("DROP TRIGGER IF EXISTS"),
  )

  it("refuses any change to a persisted finalisation or handoff", () => {
    expect(fn).toMatch(
      /OLD\.consultation_finalisation IS NOT NULL[\s\S]*?NEW\.consultation_finalisation IS DISTINCT FROM OLD\.consultation_finalisation[\s\S]*?RAISE EXCEPTION/,
    )
    expect(fn).toMatch(
      /OLD\.consultation_handoff_id IS NOT NULL[\s\S]*?NEW\.consultation_handoff_id IS DISTINCT FROM OLD\.consultation_handoff_id[\s\S]*?RAISE EXCEPTION/,
    )
  })

  it("allows the first assignment and an identical re-assignment", () => {
    // `IS DISTINCT FROM` rather than `<>`: NULLs are comparable, so the first
    // NULL → sealed transition passes and a retry writing byte-identical values
    // is not refused for a change it is not making.
    expect(fn).toContain("IS DISTINCT FROM")
    expect(fn).not.toMatch(/NEW\.consultation_finalisation\s*<>/)
  })

  it("is scoped to the two immutable columns and nothing else", () => {
    // Not a Consultation state machine in SQL. It expresses no opinion about
    // `answers`, `status` or the Report columns, all of which keep changing.
    const trg = SQL.slice(SQL.indexOf("CREATE TRIGGER trg_deep_assessments_seal_write_once"))
    expect(trg).toMatch(
      /BEFORE UPDATE OF consultation_finalisation, consultation_handoff_id ON deep_assessments/,
    )
    for (const other of ["answers", "status", "report_json", "pdf_url"]) {
      expect(fn, other).not.toContain(`OLD.${other}`)
    }
  })

  it("does not block DELETE", () => {
    // Account erasure removes the row. A record somebody has the right to have
    // deleted must not be made undeletable by a rule about not editing it.
    const trg = SQL.slice(SQL.indexOf("CREATE TRIGGER trg_deep_assessments_seal_write_once"))
    expect(trg).not.toMatch(/DELETE/)
    expect(trg).toContain("FOR EACH ROW")
  })

  it("does not run as SECURITY DEFINER", () => {
    // It needs no privilege the writer does not already have, and granting one
    // would make this function a way to reach the table with elevated rights.
    expect(fn).not.toMatch(/SECURITY\s+DEFINER/i)
  })
})

/* ══ Phase 4A firewall, in SQL ═════════════════════════════════════════════ */

describe("Migration 48 creates nothing a Report would need", () => {
  it("no Report table, job table or queue", () => {
    for (const forbidden of [
      "report_jobs",
      "consultation_reports",
      "report_queue",
      "food_system_reports",
    ]) {
      expect(RAW_48, forbidden).not.toContain(forbidden)
    }
    expect(RAW_48).not.toMatch(/CREATE TABLE/i)
  })

  it("adds no report id or status column", () => {
    expect(RAW_48).not.toMatch(/ADD COLUMN[^\n]*report/i)
  })
})
