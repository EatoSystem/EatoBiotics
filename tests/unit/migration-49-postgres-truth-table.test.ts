import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

/**
 * Migration 49, executed — Phase 4A-S4.
 *
 * ══ WHY THIS FILE EXISTS ════════════════════════════════════════════════════
 *
 * Migration 48's review found a constraint that read correctly and accepted
 * four of the six rows it existed to reject, because a CHECK accepts UNKNOWN as
 * well as TRUE. Text assertions could not see it; running it could. The claims
 * this migration makes are of the same kind — a composite foreign key that must
 * reject a mismatched pair, a delete trigger that must tell a cascade from a
 * direct delete, a TRUNCATE that row triggers never see — and every one of them
 * is the sort of thing that is either true of PostgreSQL or is not.
 *
 * So this applies Migration 48 and then Migration 49, both parsed out of the
 * real file, to a throwaway cluster in a temp directory, and asserts the truth
 * table row by row. Nothing outside that directory is touched: no network, no
 * container, no Supabase, no production.
 *
 * It SKIPS where the binaries are absent (CI has none) rather than failing, and
 * `migration-49-source-contract.test.ts` is the always-on guard that the file
 * still says what it should. A skip is visible in the output; a silently-absent
 * guard would not be.
 */

const PG_BIN = "/usr/lib/postgresql/16/bin"
const HAVE_PG = existsSync(join(PG_BIN, "initdb")) && existsSync(join(PG_BIN, "pg_ctl"))
const isRoot = typeof process.getuid === "function" && process.getuid() === 0
const havePostgresUser = spawnSync("id", ["-u", "postgres"]).status === 0
const RUNNABLE = HAVE_PG && (!isRoot || havePostgresUser)

function run(command: string): { status: number; stderr: string; stdout: string } {
  const result = isRoot
    ? spawnSync("su", ["postgres", "-c", command], { encoding: "utf8" })
    : spawnSync("sh", ["-c", command], { encoding: "utf8" })
  return { status: result.status ?? 1, stderr: result.stderr ?? "", stdout: result.stdout ?? "" }
}

let dir = ""
let sock = ""
let queryFile = ""

function psql(sql: string) {
  writeFileSync(queryFile, sql, "utf8")
  chmodSync(queryFile, 0o644)
  return run(`${PG_BIN}/psql -h ${sock} -U postgres -d postgres -v ON_ERROR_STOP=1 -f ${queryFile}`)
}

/** The real DDL, sliced from the file rather than retyped. */
function migrationSlice(from: string, to?: string): string {
  const raw = readFileSync("supabase/migrations.sql", "utf8")
  const start = raw.indexOf(from)
  expect(start, `${from} must exist`).toBeGreaterThan(-1)
  const end = to ? raw.indexOf(to) : raw.length
  return raw.slice(start, end > start ? end : raw.length)
}

const HANDOFF_A = "11111111-1111-4111-8111-111111111111"
const HANDOFF_B = "22222222-2222-4222-8222-222222222222"
const HANDOFF_C = "33333333-3333-4333-8333-333333333333"
const DIGEST = "a".repeat(64)

beforeAll(() => {
  if (!RUNNABLE) return
  dir = mkdtempSync(join(tmpdir(), "m49pg-"))
  chmodSync(dir, 0o777)
  sock = join(dir, "s")
  queryFile = join(dir, "q.sql")
  run(`mkdir -p ${dir}/data ${sock}`)
  if (isRoot) spawnSync("chown", ["-R", "postgres:postgres", dir])

  const init = run(`${PG_BIN}/initdb -D ${dir}/data -A trust -U postgres`)
  expect(init.status, `initdb failed: ${init.stderr}`).toBe(0)
  const up = run(
    `${PG_BIN}/pg_ctl -D ${dir}/data -o "-k ${sock} -h ''" -l ${dir}/server.log start -w -t 30`,
  )
  expect(up.status, `pg_ctl failed: ${up.stderr}`).toBe(0)

  // The production shape, as the live database actually holds it: `id` is the
  // primary key and `stripe_session_id` is unique, which is what makes the
  // composite foreign key in 49 possible.
  const create = psql(`
    CREATE TABLE deep_assessments (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      stripe_session_id text UNIQUE,
      questions         jsonb,
      answers           jsonb,
      status            text,
      report_json       jsonb,
      updated_at        timestamptz
    );
  `)
  expect(create.status, create.stderr).toBe(0)

  const m48 = psql(migrationSlice("-- Migration 48:", "-- Migration 49:"))
  expect(m48.status, `Migration 48 did not apply: ${m48.stderr}`).toBe(0)
  const m49 = psql(migrationSlice("-- Migration 49:"))
  expect(m49.status, `Migration 49 did not apply: ${m49.stderr}`).toBe(0)

  const sealed = psql(`
    INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
    VALUES ('cs_a', '{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":null}'::jsonb, '{}'::jsonb, '${HANDOFF_A}'),
           ('cs_b', '{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":null}'::jsonb, '{}'::jsonb, '${HANDOFF_B}'),
           ('cs_c2', '{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":null}'::jsonb, '{}'::jsonb, '${HANDOFF_C}');
    INSERT INTO deep_assessments (stripe_session_id) VALUES ('cs_unsealed');
  `)
  expect(sealed.status, `fixtures failed: ${sealed.stderr}`).toBe(0)
}, 120_000)

afterAll(() => {
  if (!RUNNABLE || !dir) return
  run(`${PG_BIN}/pg_ctl -D ${dir}/data stop -m immediate -w -t 20`)
  rmSync(dir, { recursive: true, force: true })
})

const insertFor = (session: string, handoff: string, digest = DIGEST, text = "{}") => `
  INSERT INTO consultation_reports (consultation_handoff_id, assessment_id, canonical_report, canonical_report_sha256)
  SELECT '${handoff}', id, '${text}', '${digest}' FROM deep_assessments WHERE stripe_session_id = '${session}';
`

describe.skipIf(!RUNNABLE)("Migration 49, applied to a real PostgreSQL", () => {
  it("both migrations apply in order, and 49 needs 48", () => {
    const check = psql(`
      SELECT 1 FROM information_schema.tables WHERE table_name = 'consultation_reports';
      SELECT 1 FROM information_schema.columns
        WHERE table_name = 'deep_assessments' AND column_name = 'consultation_handoff_id';
    `)
    expect(check.status, check.stderr).toBe(0)
  })

  it("accepts a Report whose assessment and handoff belong together", () => {
    const ok = psql(insertFor("cs_a", HANDOFF_A))
    expect(ok.status, ok.stderr).toBe(0)
  })

  it("REFUSES a Report pairing one assessment with another's handoff", () => {
    /*
     * The state the composite key exists for: both halves real, the pair not.
     *
     * The handoff has to be one no child row has claimed yet, or the primary
     * key fires first and this would pass for the wrong reason — an earlier
     * draft did exactly that, and reported a PK violation as proof of the
     * foreign key.
     */
    const bad = psql(insertFor("cs_c2", HANDOFF_B))
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("consultation_reports_parent_fk")
  })

  it("refuses a second Report for the same handoff", () => {
    const dup = psql(insertFor("cs_a", HANDOFF_A, "b".repeat(64)))
    expect(dup.status).not.toBe(0)
    expect(dup.stderr).toContain("consultation_reports_pkey")
  })

  it("refuses a second Report for the same assessment under another handoff", () => {
    const dup = psql(insertFor("cs_a", HANDOFF_B, "c".repeat(64)))
    expect(dup.status).not.toBe(0)
    expect(dup.stderr.toLowerCase()).toContain("unique")
  })

  it("refuses an uppercase digest", () => {
    const bad = psql(insertFor("cs_b", HANDOFF_B, "A".repeat(64)))
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("canonical_report_sha256")
  })

  it("refuses a digest of the wrong length", () => {
    const bad = psql(insertFor("cs_b", HANDOFF_B, "a".repeat(63)))
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("canonical_report_sha256")
  })

  it("refuses a Report for an unsealed assessment", () => {
    const bad = psql(insertFor("cs_unsealed", HANDOFF_B))
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("consultation_reports_parent_fk")
  })

  for (const column of [
    "canonical_report = '{\"x\":1}'",
    "canonical_report_sha256 = 'd' || repeat('0', 63)",
    "persisted_at = now() + interval '1 day'",
    "assessment_id = gen_random_uuid()",
    `consultation_handoff_id = '${HANDOFF_B}'`,
  ]) {
    it(`refuses UPDATE of ${column.split(" =")[0]}`, () => {
      const bad = psql(`UPDATE consultation_reports SET ${column};`)
      expect(bad.status).not.toBe(0)
      expect(bad.stderr).toMatch(/write-once|foreign key|violates/)
    })
  }

  it("allows an equal-value UPDATE, so a retry is not punished", () => {
    const ok = psql(`UPDATE consultation_reports SET canonical_report = canonical_report;`)
    expect(ok.status, ok.stderr).toBe(0)
  })

  it("refuses a direct child DELETE while the parent survives", () => {
    const bad = psql(`DELETE FROM consultation_reports WHERE consultation_handoff_id = '${HANDOFF_A}';`)
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("deleted only with their parent assessment")
  })

  it("refuses a bulk child DELETE too", () => {
    const bad = psql(`DELETE FROM consultation_reports;`)
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("deleted only with their parent assessment")
  })

  it("refuses TRUNCATE, which row triggers never see", () => {
    const bad = psql(`TRUNCATE consultation_reports;`)
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("cannot be truncated")
  })

  it("refuses to move the parent's handoff while a Report references it", () => {
    const bad = psql(
      `UPDATE deep_assessments SET consultation_handoff_id = '${HANDOFF_B}' WHERE stripe_session_id = 'cs_a';`,
    )
    expect(bad.status).not.toBe(0)
  })

  it("leaves unsealed rows untouched by the new composite unique", () => {
    const ok = psql(`INSERT INTO deep_assessments (stripe_session_id) VALUES ('cs_c'), ('cs_d');`)
    expect(ok.status, ok.stderr).toBe(0)
  })

  it("cascades when the parent assessment is deleted, and blocks regeneration after", () => {
    const gone = psql(`DELETE FROM deep_assessments WHERE stripe_session_id = 'cs_a';`)
    expect(gone.status, gone.stderr).toBe(0)

    const count = psql(
      `SELECT count(*) AS n FROM consultation_reports WHERE consultation_handoff_id = '${HANDOFF_A}';`,
    )
    expect(count.stdout).toContain("0")

    // The parent is gone, so the composite key has nothing to point at: a
    // future composer cannot write a new canonical Report for that handoff.
    const again = psql(`
      INSERT INTO consultation_reports (consultation_handoff_id, assessment_id, canonical_report, canonical_report_sha256)
      VALUES ('${HANDOFF_A}', gen_random_uuid(), '{}', '${DIGEST}');
    `)
    expect(again.status).not.toBe(0)
    expect(again.stderr).toContain("consultation_reports_parent_fk")
  })

  it("has RLS enabled and no policies", () => {
    const rls = psql(`
      SELECT relrowsecurity FROM pg_class WHERE relname = 'consultation_reports';
      SELECT count(*) AS policies FROM pg_policies WHERE tablename = 'consultation_reports';
    `)
    expect(rls.status, rls.stderr).toBe(0)
    expect(rls.stdout).toContain("t")
    expect(rls.stdout).toContain("0")
  })
})
