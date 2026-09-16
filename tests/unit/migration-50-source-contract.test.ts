import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * Migration 50, read as text — Phase 4B-S1.
 *
 * The always-on companion to the executed truth table, which skips where the
 * PostgreSQL binaries are absent. A skip is visible in the output; a silently
 * absent guard is not, so the claims that can be checked as text are checked
 * here unconditionally.
 */

const RAW = readFileSync(join(process.cwd(), "supabase/migrations.sql"), "utf8")

/**
 * Bounded at both ends even though Migration 50 is currently last. The
 * Migration 48 and 49 slices each had to be narrowed after a later migration
 * was appended, and each time the open-ended version had silently started
 * asserting against someone else's SQL. Writing the bound now costs nothing;
 * discovering it later costs a review round.
 */
const NEXT = RAW.indexOf("-- Migration 51:")
const SQL = RAW.slice(
  RAW.indexOf("-- Migration 50:"),
  NEXT > -1 ? NEXT : RAW.length,
)

/**
 * Two derived views, because a single raw string cannot answer both kinds of
 * question and trying made three of these assertions wrong on first run.
 *
 * `CODE` — comments stripped. Every "must NOT contain" assertion runs against
 * this. The migration EXPLAINS why there is no `generation` column and how it
 * differs from `consultation_reports`, so a raw scan matches its own prose. The
 * tempting fix is to delete the explanation; stripping comments keeps it.
 *
 * `PROSE` — comment markers removed and lines joined. SQL comments wrap at
 * column 80, so "Migration 41" is written across a line break and is NOT a
 * contiguous substring of the file. REVIEW.md records this exact failure shape
 * three times over ("contiguous phrase vs element-split"); this is the fourth,
 * and it happened inside the guard written to honour the lesson.
 */
const CODE = SQL.replace(/^\s*--.*$/gm, "")
const PROSE = SQL.split("\n")
  .filter((line) => line.trimStart().startsWith("--"))
  .map((line) => line.trimStart().replace(/^--\s?/, ""))
  .join(" ")
  .replace(/\s+/g, " ")

describe("the slice is real", () => {
  it("found Migration 50 and it is not empty", () => {
    expect(RAW.indexOf("-- Migration 50:")).toBeGreaterThan(-1)
    expect(SQL.length).toBeGreaterThan(1000)
  })

  it("does not reach into a neighbouring migration", () => {
    expect(SQL).not.toContain("-- Migration 49:")
    expect(SQL).not.toContain("-- Migration 51:")
    // Against CODE: the prose legitimately contrasts this table with
    // `consultation_reports`, and that contrast is worth keeping.
    expect(CODE).not.toContain("consultation_reports")
  })
})

describe("it says it is proposed and dependent", () => {
  it("carries the unapplied status header", () => {
    expect(SQL).toContain("STATUS: PROPOSED — DO NOT APPLY WITHOUT EXPLICIT AUTHORISATION.")
  })

  it("names its dependency on Migration 49, and 49's on 48", () => {
    expect(SQL).toContain("DEPENDS ON MIGRATION 49")
    expect(SQL).toContain("Migration 48")
  })

  it("records WHY the dependency is on 49 rather than 48", () => {
    // The composite foreign key targets the NON-PARTIAL unique constraint that
    // 49 adds. 48's handoff index is partial, and PostgreSQL refuses a partial
    // unique index as a foreign-key target — proven by execution in S4.
    expect(SQL).toContain("PARTIAL")
  })

  it("repeats the Migration 41 warning about stale headers", () => {
    // Against PROSE, not SQL: the sentence wraps, so "Migration 41" is split
    // across a line break and never appears contiguously in the raw file.
    expect(PROSE).toContain("Migration 41")
    expect(PROSE).toContain("fact about a day")
  })
})

describe("the schema is the frozen one", () => {
  it("keys on assessment_id, which is what makes one active capability", () => {
    expect(SQL).toMatch(/assessment_id\s+uuid PRIMARY KEY/)
  })

  it("carries a unique handoff", () => {
    expect(SQL).toMatch(/consultation_handoff_id\s+uuid NOT NULL UNIQUE/)
  })

  it("stores only a hash, constrained to lowercase hex", () => {
    expect(SQL).toMatch(/token_hash\s+text NOT NULL UNIQUE/)
    expect(SQL).toContain("token_hash ~ '^[0-9a-f]{64}$'")
  })

  it("has the mutable credential columns and no others", () => {
    expect(SQL).toMatch(/rotated_at\s+timestamptz/)
    expect(SQL).toMatch(/revoked_at\s+timestamptz/)
    expect(SQL).toMatch(/issued_at\s+timestamptz NOT NULL/)
  })

  it("has NO generation column", () => {
    // Withdrawn deliberately: the cookie carries the same secret, so one write
    // to token_hash kills the raw link, the capability value and every cookie
    // minted from it. A counter would be a second axis to keep in step.
    expect(CODE).not.toContain("generation")
    // ...and the reasoning survives in the prose, where it belongs.
    expect(PROSE).toContain("WHY THERE IS NO generation COLUMN")
  })

  it("binds assessment and handoff together, cascading from the parent", () => {
    const fk = SQL.slice(SQL.indexOf("CONSTRAINT report_access_capabilities_parent_fk"))
    expect(fk).toContain("FOREIGN KEY (assessment_id, consultation_handoff_id)")
    expect(fk).toContain("REFERENCES deep_assessments (id, consultation_handoff_id)")
    expect(fk).toContain("ON DELETE CASCADE")
  })
})

describe("it is service-role only", () => {
  it("enables RLS and grants nothing", () => {
    expect(SQL).toContain("ENABLE ROW LEVEL SECURITY")
    expect(SQL).toContain("zero policies")
    expect(SQL).not.toContain("CREATE POLICY")
    expect(SQL).not.toContain("GRANT ")
  })
})

describe("identity is immutable, the credential is not", () => {
  const trigger = SQL.slice(
    SQL.indexOf("CREATE OR REPLACE FUNCTION report_access_capabilities_identity_is_immutable"),
    SQL.indexOf("DROP TRIGGER IF EXISTS trg_report_access_capabilities_identity"),
  )

  it("guards the three identity columns", () => {
    expect(trigger).toContain("NEW.assessment_id")
    expect(trigger).toContain("NEW.consultation_handoff_id")
    expect(trigger).toContain("NEW.issued_at")
  })

  it("leaves the credential columns free while the capability is live", () => {
    // Rotating is the point of this table, and it is how a lost response is
    // recovered. The identity check must not mention the credential columns —
    // the ONLY thing that may gate them is the revoked-at branch below.
    const identityBranch = trigger.slice(0, trigger.indexOf("IF OLD.revoked_at"))
    expect(identityBranch).not.toContain("NEW.token_hash")
    expect(identityBranch).not.toContain("NEW.rotated_at")
    expect(identityBranch).not.toContain("NEW.revoked_at")
  })

  it("makes revocation terminal, in the database and not just in the CAS", () => {
    // The repair. The application's rotation CAS carries `AND revoked_at IS
    // NULL`, but that only binds the application: a plain
    // `UPDATE ... SET revoked_at = NULL` resurrects the credential, and the
    // revoked secret starts working again.
    const revokedBranch = trigger.slice(trigger.indexOf("IF OLD.revoked_at"))
    expect(revokedBranch).toContain("OLD.revoked_at IS NOT NULL")
    // All three attacks, refused by one rule: un-revoke, re-stamp, rotate under.
    expect(revokedBranch).toContain("NEW.revoked_at")
    expect(revokedBranch).toContain("NEW.token_hash")
    expect(revokedBranch).toContain("NEW.rotated_at")
    expect(revokedBranch).toContain("revocation is final")
  })

  it("points at delete-then-insert as the way back", () => {
    // Terminal must not mean a dead end. Re-issuing is a NEW ROW, which is
    // available because a direct delete is deliberately permitted here.
    expect(PROSE).toContain("DELETE then INSERT")
  })

  it("uses IS DISTINCT FROM so an unchanged re-send is not refused", () => {
    expect(trigger).toContain("IS DISTINCT FROM")
  })
})

describe("revocation stays possible", () => {
  it("has no parent-only-delete trigger", () => {
    // Unlike consultation_reports. Destroying a credential IS revocation, and
    // revocation must always be available.
    expect(CODE).not.toContain("parent_only_delete")
    expect(PROSE).toContain("revocation must always be available")
  })

  it("says token_hash is never exported", () => {
    expect(PROSE).toContain("NEVER included in the customer portability export")
  })
})
