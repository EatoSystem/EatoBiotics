import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawnSync } from "node:child_process"
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

/**
 * Migration 50, executed — Phase 4B-S1.
 *
 * ══ WHY RUNNING IT IS NOT OPTIONAL ══════════════════════════════════════════
 *
 * Migration 48's review found a CHECK that read correctly and accepted four of
 * the six rows it existed to reject, because a CHECK accepts UNKNOWN as well as
 * TRUE. Text assertions could not see it; running it could. Migration 49's
 * review found that PostgreSQL refuses a PARTIAL unique index as a foreign-key
 * target — a fact nobody had asserted either way until a cluster said so.
 *
 * Migration 50's claims are of the same kind. A composite foreign key that must
 * reject a mismatched pair. A compare-and-set that must match zero rows when it
 * loses. A trigger that must refuse identity changes while permitting rotation.
 * Each is either true of PostgreSQL or is not, and reading the DDL cannot tell
 * you which.
 *
 * Applies 48, then 49, then 50, all parsed out of the real file, to a throwaway
 * cluster in a temp directory. Nothing outside it is touched: no network, no
 * container, no Supabase, no production. SKIPS where the binaries are absent
 * (CI has none) rather than failing — `migration-50-source-contract.test.ts` is
 * the always-on guard, because a skip is visible and a missing guard is not.
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

function psql(sql: string, flags = "") {
  writeFileSync(queryFile, sql, "utf8")
  chmodSync(queryFile, 0o644)
  return run(
    `${PG_BIN}/psql -h ${sock} -U postgres -d postgres -v ON_ERROR_STOP=1 ${flags} -f ${queryFile}`,
  )
}

/**
 * A single value, trimmed.
 *
 * `-t -A` as command-line flags rather than `\pset` meta-commands: `\pset`
 * prints "Output format is unaligned." to stdout, which then becomes part of
 * every value this returns. The first version of this helper did that, and
 * fourteen assertions failed with a uuid that had a sentence glued to the
 * front of it.
 */
function scalar(sql: string): string {
  const result = psql(sql, "-t -A")
  expect(result.status, result.stderr).toBe(0)
  return result.stdout.trim()
}

/**
 * A compare-and-set UPDATE, reporting only the rows it actually returned.
 *
 * Wrapped in a CTE because psql prints the command tag ("UPDATE 0") to stdout
 * alongside the result, so a bare `RETURNING` cannot be distinguished from a
 * zero-row one by reading stdout. The whole point of these assertions is
 * telling a winner from a loser, and the tag would have made every loser look
 * like it returned something.
 *
 * Pass the UPDATE WITHOUT a trailing semicolon.
 */
function casUpdate(update: string): string {
  return scalar(`WITH u AS (${update}) SELECT coalesce(string_agg(token_hash, ','), '') FROM u;`)
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
const HASH_1 = "1".repeat(64)
const HASH_2 = "2".repeat(64)
const HASH_3 = "3".repeat(64)

let idA = ""
let idB = ""

beforeAll(() => {
  if (!RUNNABLE) return
  dir = mkdtempSync(join(tmpdir(), "m50pg-"))
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
  const m49 = psql(migrationSlice("-- Migration 49:", "-- Migration 50:"))
  expect(m49.status, `Migration 49 did not apply: ${m49.stderr}`).toBe(0)
  const m50 = psql(migrationSlice("-- Migration 50:"))
  expect(m50.status, `Migration 50 did not apply: ${m50.stderr}`).toBe(0)

  const sealed = psql(`
    INSERT INTO deep_assessments (stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
    VALUES ('cs_a', '{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":null}'::jsonb, '{}'::jsonb, '${HANDOFF_A}'),
           ('cs_b', '{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":null}'::jsonb, '{}'::jsonb, '${HANDOFF_B}');
  `)
  expect(sealed.status, `fixtures failed: ${sealed.stderr}`).toBe(0)
  idA = scalar(`SELECT id FROM deep_assessments WHERE stripe_session_id = 'cs_a';`)
  idB = scalar(`SELECT id FROM deep_assessments WHERE stripe_session_id = 'cs_b';`)
}, 120_000)

afterAll(() => {
  if (!RUNNABLE || !dir) return
  run(`${PG_BIN}/pg_ctl -D ${dir}/data stop -m immediate -w -t 20`)
  rmSync(dir, { recursive: true, force: true })
})

const maybe = RUNNABLE ? describe : describe.skip

function clean() {
  expect(psql(`DELETE FROM report_access_capabilities;`).status).toBe(0)
}

maybe("Migration 50 applies on top of 48 and 49", () => {
  it("creates the table with RLS on and zero policies", () => {
    expect(
      scalar(`SELECT relrowsecurity FROM pg_class WHERE relname = 'report_access_capabilities';`),
    ).toBe("t")
    expect(
      scalar(`SELECT count(*) FROM pg_policies WHERE tablename = 'report_access_capabilities';`),
    ).toBe("0")
  })

  it("has no generation column", () => {
    expect(
      scalar(`SELECT count(*) FROM information_schema.columns
              WHERE table_name = 'report_access_capabilities' AND column_name = 'generation';`),
    ).toBe("0")
  })
})

maybe("the composite foreign key", () => {
  it("accepts a capability whose assessment and handoff agree", () => {
    clean()
    const ok = psql(`
      INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
      VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');
    `)
    expect(ok.status, ok.stderr).toBe(0)
  })

  it("REJECTS assessment A carrying handoff B", () => {
    // The whole reason the key is composite. A credential that unlocks the
    // wrong Report must be unstorable, not merely unexpected.
    clean()
    const bad = psql(`
      INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
      VALUES ('${idA}', '${HANDOFF_B}', '${HASH_1}');
    `)
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("report_access_capabilities_parent_fk")
  })

  it("rejects an assessment that does not exist", () => {
    clean()
    const bad = psql(`
      INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
      VALUES ('99999999-9999-4999-8999-999999999999', '${HANDOFF_A}', '${HASH_1}');
    `)
    expect(bad.status).not.toBe(0)
  })
})

maybe("at most one active capability", () => {
  it("a second insert for the same assessment loses on the primary key", () => {
    // The first-mint race, arbitrated by the database rather than by
    // application code. The loser must return no secret at all.
    clean()
    expect(
      psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
            VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`).status,
    ).toBe(0)
    const second = psql(`
      INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
      VALUES ('${idA}', '${HANDOFF_A}', '${HASH_2}');
    `)
    expect(second.status).not.toBe(0)
    expect(second.stderr).toContain("report_access_capabilities_pkey")
  })

  it("two assessments may each hold one, so Reports coexist", () => {
    clean()
    const both = psql(`
      INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
      VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}'),
             ('${idB}', '${HANDOFF_B}', '${HASH_2}');
    `)
    expect(both.status, both.stderr).toBe(0)
    expect(scalar(`SELECT count(*) FROM report_access_capabilities;`)).toBe("2")
  })
})

maybe("the token_hash CHECK", () => {
  it("rejects uppercase hex, short input and non-hex", () => {
    clean()
    for (const bad of ["A".repeat(64), "a".repeat(63), `${"a".repeat(63)}z`, ""]) {
      const result = psql(`
        INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
        VALUES ('${idA}', '${HANDOFF_A}', '${bad}');
      `)
      expect(result.status, `accepted ${JSON.stringify(bad)}`).not.toBe(0)
    }
  })
})

maybe("rotation by compare-and-set", () => {
  it("the winner's UPDATE returns its own hash", () => {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    const returned = casUpdate(`
      UPDATE report_access_capabilities
         SET token_hash = '${HASH_2}', rotated_at = now()
       WHERE assessment_id = '${idA}' AND token_hash = '${HASH_1}' AND revoked_at IS NULL
      RETURNING token_hash
    `)
    expect(returned).toBe(HASH_2)
  })

  it("the LOSER matches zero rows and gets nothing back", () => {
    // The safety property the whole design rests on: a secret is released only
    // by the request whose own hash comes back committed. Two concurrent
    // rotations read the same observed hash; exactly one UPDATE matches.
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    // Winner rotates 1 -> 2.
    casUpdate(`UPDATE report_access_capabilities SET token_hash = '${HASH_2}'
                WHERE assessment_id = '${idA}' AND token_hash = '${HASH_1}' AND revoked_at IS NULL
               RETURNING token_hash`)
    // Loser still believes the observed hash is 1, and tries 1 -> 3.
    const loser = casUpdate(`
      UPDATE report_access_capabilities
         SET token_hash = '${HASH_3}'
       WHERE assessment_id = '${idA}' AND token_hash = '${HASH_1}' AND revoked_at IS NULL
      RETURNING token_hash
    `)
    expect(loser).toBe("")
    // And the committed value is the winner's, not the loser's.
    expect(scalar(`SELECT token_hash FROM report_access_capabilities WHERE assessment_id = '${idA}';`))
      .toBe(HASH_2)
  })

  it("refuses to rotate a revoked capability", () => {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash, revoked_at)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}', now());`)
    const rotated = casUpdate(`
      UPDATE report_access_capabilities
         SET token_hash = '${HASH_2}'
       WHERE assessment_id = '${idA}' AND token_hash = '${HASH_1}' AND revoked_at IS NULL
      RETURNING token_hash
    `)
    expect(rotated).toBe("")
  })
})

maybe("revocation is terminal", () => {
  /**
   * The application's rotation CAS carries `AND revoked_at IS NULL`, so IT will
   * not touch a revoked row. These rows are about what the DATABASE permits
   * when something routes around the application — a plain UPDATE from a
   * console, a future route, a bug. A revocation that can be undone below the
   * application is not a revocation.
   */
  function revoked() {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash, revoked_at)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}', now());`)
  }

  it("REFUSES clearing revoked_at", () => {
    revoked()
    const bad = psql(
      `UPDATE report_access_capabilities SET revoked_at = NULL WHERE assessment_id = '${idA}';`,
    )
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("revocation is final")
    expect(scalar(`SELECT revoked_at IS NOT NULL FROM report_access_capabilities
                    WHERE assessment_id = '${idA}';`)).toBe("t")
  })

  it("REFUSES re-stamping revoked_at", () => {
    revoked()
    const bad = psql(
      `UPDATE report_access_capabilities SET revoked_at = now() + interval '1 day'
        WHERE assessment_id = '${idA}';`,
    )
    expect(bad.status).not.toBe(0)
  })

  it("REFUSES rotating the hash underneath a revocation", () => {
    revoked()
    const bad = psql(
      `UPDATE report_access_capabilities SET token_hash = '${HASH_2}' WHERE assessment_id = '${idA}';`,
    )
    expect(bad.status).not.toBe(0)
    expect(scalar(`SELECT token_hash FROM report_access_capabilities WHERE assessment_id = '${idA}';`))
      .toBe(HASH_1)
  })

  it("REFUSES clearing revocation and rotating in one statement", () => {
    // The combination, in case a single-column check were ordered so that one
    // mutation masked the other.
    revoked()
    const bad = psql(`
      UPDATE report_access_capabilities
         SET revoked_at = NULL, token_hash = '${HASH_2}', rotated_at = now()
       WHERE assessment_id = '${idA}';
    `)
    expect(bad.status).not.toBe(0)
  })

  it("permits an unchanged re-send of a revoked row", () => {
    // Same discipline as the identity check: a client that re-sends identical
    // values is not attempting a change and is not refused for one.
    revoked()
    const resend = psql(`
      UPDATE report_access_capabilities
         SET revoked_at = revoked_at, token_hash = token_hash, rotated_at = rotated_at
       WHERE assessment_id = '${idA}';
    `)
    expect(resend.status, resend.stderr).toBe(0)
  })

  it("re-issues by DELETE then INSERT, so terminal is not a dead end", () => {
    // Forbidding revival AND deletion would leave a customer with a permanently
    // unusable Report and no way to mint a new credential. Deletability is what
    // makes the terminal rule workable.
    revoked()
    expect(
      psql(`DELETE FROM report_access_capabilities WHERE assessment_id = '${idA}';`).status,
    ).toBe(0)
    const reissued = psql(`
      INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
      VALUES ('${idA}', '${HANDOFF_A}', '${HASH_3}');
    `)
    expect(reissued.status, reissued.stderr).toBe(0)
    expect(scalar(`SELECT revoked_at IS NULL FROM report_access_capabilities
                    WHERE assessment_id = '${idA}';`)).toBe("t")
  })

  it("still rotates freely while the capability is LIVE", () => {
    // Non-vacuity for everything above: the terminal rule must bite only after
    // revocation, or it would have broken ordinary rotation instead.
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    const ok = psql(
      `UPDATE report_access_capabilities SET token_hash = '${HASH_2}', rotated_at = now()
        WHERE assessment_id = '${idA}';`,
    )
    expect(ok.status, ok.stderr).toBe(0)
  })
})

maybe("identity is immutable, the credential is not", () => {
  it("permits rotating token_hash, rotated_at and revoked_at", () => {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    const ok = psql(`
      UPDATE report_access_capabilities
         SET token_hash = '${HASH_2}', rotated_at = now(), revoked_at = now()
       WHERE assessment_id = '${idA}';
    `)
    expect(ok.status, ok.stderr).toBe(0)
  })

  it("REFUSES repointing a live credential at another Report", () => {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    const bad = psql(`
      UPDATE report_access_capabilities
         SET consultation_handoff_id = '${HANDOFF_B}'
       WHERE assessment_id = '${idA}';
    `)
    expect(bad.status).not.toBe(0)
    expect(bad.stderr).toContain("identity columns are immutable")
  })

  it("REFUSES changing assessment_id or issued_at", () => {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    for (const mutation of [
      `assessment_id = '${idB}'`,
      `issued_at = now() + interval '1 day'`,
    ]) {
      const bad = psql(`UPDATE report_access_capabilities SET ${mutation} WHERE assessment_id = '${idA}';`)
      expect(bad.status, mutation).not.toBe(0)
    }
  })

  it("permits an unchanged re-send of every column", () => {
    // A client library that re-sends an identical row, or a retry that
    // recomputes the same values, is not attempting a change.
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    const resend = psql(`
      UPDATE report_access_capabilities
         SET assessment_id = assessment_id,
             consultation_handoff_id = consultation_handoff_id,
             issued_at = issued_at,
             token_hash = token_hash
       WHERE assessment_id = '${idA}';
    `)
    expect(resend.status, resend.stderr).toBe(0)
  })
})

maybe("deletion", () => {
  it("cascades when the parent assessment is erased", () => {
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idB}', '${HANDOFF_B}', '${HASH_2}');`)
    const removed = psql(`DELETE FROM deep_assessments WHERE id = '${idB}';`)
    expect(removed.status, removed.stderr).toBe(0)
    expect(
      scalar(`SELECT count(*) FROM report_access_capabilities WHERE assessment_id = '${idB}';`),
    ).toBe("0")
    // Put the fixture back for any later test in this file.
    psql(`INSERT INTO deep_assessments (id, stripe_session_id, answers, consultation_finalisation, consultation_handoff_id)
          VALUES ('${idB}', 'cs_b', '{"kind":"deterministic-consultation-state","phase":"ready-for-report","currentQuestionId":null}'::jsonb, '{}'::jsonb, '${HANDOFF_B}');`)
  })

  it("PERMITS a direct delete, because that is revocation", () => {
    // Deliberately unlike `consultation_reports`, which refuses a direct child
    // delete while its parent survives. An immutable Report must not be
    // deletable on its own; a credential must always be destroyable.
    clean()
    psql(`INSERT INTO report_access_capabilities (assessment_id, consultation_handoff_id, token_hash)
          VALUES ('${idA}', '${HANDOFF_A}', '${HASH_1}');`)
    const revoked = psql(`DELETE FROM report_access_capabilities WHERE assessment_id = '${idA}';`)
    expect(revoked.status, revoked.stderr).toBe(0)
    expect(scalar(`SELECT count(*) FROM deep_assessments WHERE id = '${idA}';`)).toBe("1")
  })
})
