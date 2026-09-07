import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, chmodSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * Migration 48's coherence CHECK, executed against a real PostgreSQL.
 *
 * ══ WHY TEXT ASSERTIONS WERE NOT ENOUGH ═════════════════════════════════════
 *
 * The first draft of this constraint used ordinary `=` comparisons and looked
 * correct. It was not: a CHECK accepts TRUE *or UNKNOWN*, and extracting a
 * missing key from jsonb yields SQL NULL, so a sealed row with a NULL `answers`,
 * an empty object, or a state missing `kind`, `phase` or `currentQuestionId`
 * evaluated to UNKNOWN and was ACCEPTED. Four of the six shapes the constraint
 * exists to reject would have been stored.
 *
 * The contract test passed the whole time, because it asserted that the SQL
 * MENTIONED the right strings. Only running it finds this class of bug, so this
 * file runs it: a throwaway cluster, the real DDL parsed out of
 * `supabase/migrations.sql`, and the truth table inserted row by row.
 *
 * ══ WHAT THIS DOES NOT TOUCH ════════════════════════════════════════════════
 *
 * Nothing outside its own temporary directory. No network, no container
 * runtime, no Supabase, no production — `initdb` into a temp dir, a unix socket,
 * and `rm -rf` afterwards. The cluster trusts local connections because nothing
 * else can reach it.
 *
 * ══ WHY IT SKIPS RATHER THAN FAILS ══════════════════════════════════════════
 *
 * CI's runner has no PostgreSQL server binaries, and adding a service container
 * for one constraint is not a trade this phase should make. So this is the
 * stronger check where it can run, and `migration-48-seal-contract.test.ts`
 * remains the always-on guard that the SQL is written two-valued. A skip is
 * visible in the run output; a silently-absent guard would not be.
 */

const PG_BIN = "/usr/lib/postgresql/16/bin"
const HAVE_PG = existsSync(join(PG_BIN, "initdb")) && existsSync(join(PG_BIN, "pg_ctl"))

/**
 * PostgreSQL refuses to run as root, so when the test IS root it drops to the
 * `postgres` system user. Elsewhere it runs as whoever invoked vitest.
 */
const isRoot = typeof process.getuid === "function" && process.getuid() === 0
const havePostgresUser = spawnSync("id", ["-u", "postgres"]).status === 0
const RUNNABLE = HAVE_PG && (!isRoot || havePostgresUser)

/** Run a command, dropping privileges when necessary. Returns the exit status. */
function run(command: string): { status: number; stderr: string; stdout: string } {
  const result = isRoot
    ? spawnSync("su", ["postgres", "-c", command], { encoding: "utf8" })
    : spawnSync("sh", ["-c", command], { encoding: "utf8" })
  return {
    status: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  }
}

/*
 * A SHORT directory, deliberately not the repository's scratchpad.
 *
 * A unix socket path is capped at 107 bytes by the kernel, and the usual
 * per-session temp paths are longer than that on their own.
 */
let dir = ""
let sock = ""

/*
 * SQL goes through a FILE, never `-c`.
 *
 * Dropping privileges means the command crosses a shell, and a shell does not
 * interpret `\n` inside double quotes — psql then reads the two characters as
 * one of its own backslash commands and fails on statements that span lines.
 */
let queryFile = ""
function psql(sql: string) {
  writeFileSync(queryFile, sql, "utf8")
  chmodSync(queryFile, 0o644)
  return run(`${PG_BIN}/psql -h ${sock} -U postgres -d postgres -v ON_ERROR_STOP=1 -f ${queryFile}`)
}

/** Migration 48's real DDL, parsed out of the file rather than retyped here. */
function migration48(): string {
  const raw = readFileSync("supabase/migrations.sql", "utf8")
  const start = raw.indexOf("-- Migration 48:")
  expect(start, "Migration 48 must exist").toBeGreaterThan(-1)
  return raw.slice(start)
}

beforeAll(() => {
  if (!RUNNABLE) return
  dir = mkdtempSync(join(tmpdir(), "c2apg-"))
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

  // The columns Migration 48 touches, in the shapes production holds them.
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

  const applied = psql(migration48())
  expect(applied.status, `Migration 48 did not apply: ${applied.stderr}`).toBe(0)
}, 120_000)

afterAll(() => {
  if (!RUNNABLE || !dir) return
  run(`${PG_BIN}/pg_ctl -D ${dir}/data stop -m immediate -w -t 20`)
  rmSync(dir, { recursive: true, force: true })
})

/* ══ The truth table ═══════════════════════════════════════════════════════ */

const SEAL = `'{"kind":"deterministic-consultation-finalisation"}'::jsonb`
const HANDOFF = `'11111111-1111-4111-8111-111111111111'::uuid`

let seq = 0
/** Insert a sealed row carrying `answers`, and say whether the database took it. */
function insertSealed(answers: string): { accepted: boolean; stderr: string } {
  seq += 1
  const result = psql(
    `INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
     VALUES ('cs_${seq}', ${answers}, ${SEAL}, gen_random_uuid());`,
  )
  return { accepted: result.status === 0, stderr: result.stderr }
}

const READY = `'{"kind":"deterministic-consultation-state","schemaVersion":1,"candidateAnswers":{},"touchedQuestionIds":[],"skippedOptionalQuestionIds":[],"currentQuestionId":null,"phase":"ready-for-report"}'::jsonb`

describe.skipIf(!RUNNABLE)("Migration 48 applies and enforces seal coherence for real", () => {
  it("applies cleanly onto a table shaped like production", () => {
    const cols = psql(
      `SELECT 1 FROM information_schema.columns
       WHERE table_name = 'deep_assessments'
         AND column_name IN ('consultation_finalisation','consultation_handoff_id')
       HAVING count(*) = 2;`,
    )
    expect(cols.status, cols.stderr).toBe(0)
  })

  it("is idempotent — applying it twice changes nothing and raises nothing", () => {
    // The `pg_constraint` lookups are scoped to this table's regclass, so a
    // same-named constraint elsewhere cannot make the second run skip the ADD.
    const again = psql(migration48())
    expect(again.status, again.stderr).toBe(0)
  })

  /* ── Accepted ────────────────────────────────────────────────────────── */

  it("a sealed row carrying a valid ready state is ACCEPTED", () => {
    const { accepted, stderr } = insertSealed(READY)
    expect(accepted, stderr).toBe(true)
  })

  it("an UNSEALED row is untouched by the constraint, whatever its answers", () => {
    // The one-directional rule: legacy rows, in-progress Consultations and
    // legacy `answers` objects all stay valid with both columns NULL.
    for (const answers of ["NULL", `'null'::jsonb`, `'{}'::jsonb`, `'{"q1":"legacy"}'::jsonb`]) {
      seq += 1
      const result = psql(
        `INSERT INTO deep_assessments (stripe_session_id, answers) VALUES ('cs_u_${seq}', ${answers});`,
      )
      expect(result.status, `${answers}: ${result.stderr}`).toBe(0)
    }
  })

  /* ── Rejected ────────────────────────────────────────────────────────── */

  it.each([
    ["SQL NULL answers", "NULL"],
    ["JSON null answers", `'null'::jsonb`],
    ["an empty object", `'{}'::jsonb`],
    ["a missing kind", `'{"phase":"ready-for-report","currentQuestionId":null}'::jsonb`],
    ["a wrong kind", `'{"kind":"legacy","phase":"ready-for-report","currentQuestionId":null}'::jsonb`],
    ["a missing phase", `'{"kind":"deterministic-consultation-state","currentQuestionId":null}'::jsonb`],
    ["the review phase", `'{"kind":"deterministic-consultation-state","phase":"review","currentQuestionId":null}'::jsonb`],
    ["a missing cursor key", `'{"kind":"deterministic-consultation-state","phase":"ready-for-report"}'::jsonb`],
    ["a string cursor", `'{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":"core_signals_post_meal_pattern_v1"}'::jsonb`],
  ])("a sealed row with %s is REJECTED", (_name, answers) => {
    const { accepted, stderr } = insertSealed(answers)
    expect(accepted, "the database accepted a malformed seal").toBe(false)
    expect(stderr).toMatch(/deep_assessments_seal_state_coherent/)
  })

  /* ── The other two rules, also executed ──────────────────────────────── */

  it("a finalisation without a handoff is REJECTED", () => {
    const r = psql(
      `INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation)
       VALUES ('cs_pair_1', ${READY}, ${SEAL});`,
    )
    expect(r.status).not.toBe(0)
    expect(r.stderr).toMatch(/deep_assessments_seal_pair/)
  })

  it("a handoff without a finalisation is REJECTED", () => {
    const r = psql(
      `INSERT INTO deep_assessments (stripe_session_id, answers, consultation_handoff_id)
       VALUES ('cs_pair_2', ${READY}, ${HANDOFF});`,
    )
    expect(r.status).not.toBe(0)
    expect(r.stderr).toMatch(/deep_assessments_seal_pair/)
  })

  it("two rows cannot share a handoff id", () => {
    const first = psql(
      `INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
       VALUES ('cs_uniq_1', ${READY}, ${SEAL}, ${HANDOFF});`,
    )
    expect(first.status, first.stderr).toBe(0)
    const second = psql(
      `INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
       VALUES ('cs_uniq_2', ${READY}, ${SEAL}, ${HANDOFF});`,
    )
    expect(second.status).not.toBe(0)
    expect(second.stderr).toMatch(/idx_deep_assessments_handoff/)
  })

  /* ── Write-once, executed ────────────────────────────────────────────── */

  describe("the seal is write-once", () => {
    beforeAll(() => {
      const r = psql(
        `INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
         VALUES ('cs_wo', ${READY}, ${SEAL}, '22222222-2222-4222-8222-222222222222'::uuid);`,
      )
      expect(r.status, r.stderr).toBe(0)
    })

    it("the finalisation cannot be changed", () => {
      const r = psql(
        `UPDATE deep_assessments SET consultation_finalisation = '{"kind":"other"}'::jsonb WHERE stripe_session_id = 'cs_wo';`,
      )
      expect(r.status).not.toBe(0)
      expect(r.stderr).toMatch(/write-once/)
    })

    it("the finalisation cannot be cleared", () => {
      const r = psql(
        `UPDATE deep_assessments SET consultation_finalisation = NULL WHERE stripe_session_id = 'cs_wo';`,
      )
      expect(r.status).not.toBe(0)
    })

    it("the handoff cannot be changed", () => {
      const r = psql(
        `UPDATE deep_assessments SET consultation_handoff_id = gen_random_uuid() WHERE stripe_session_id = 'cs_wo';`,
      )
      expect(r.status).not.toBe(0)
      expect(r.stderr).toMatch(/write-once/)
    })

    it("writing the IDENTICAL values again is allowed", () => {
      // A retry that recomputes the same bytes, or a client resending the whole
      // row, must not be refused for a change it is not making.
      const r = psql(
        `UPDATE deep_assessments
         SET consultation_finalisation = ${SEAL},
             consultation_handoff_id = '22222222-2222-4222-8222-222222222222'::uuid
         WHERE stripe_session_id = 'cs_wo';`,
      )
      expect(r.status, r.stderr).toBe(0)
    })

    it("unrelated columns still change freely", () => {
      const r = psql(
        `UPDATE deep_assessments SET status = 'complete', report_json = '{"x":1}'::jsonb, updated_at = now()
         WHERE stripe_session_id = 'cs_wo';`,
      )
      expect(r.status, r.stderr).toBe(0)
    })

    it("the row can still be DELETED — account erasure is not blocked", () => {
      const r = psql(`DELETE FROM deep_assessments WHERE stripe_session_id = 'cs_wo';`)
      expect(r.status, r.stderr).toBe(0)
    })
  })
})
