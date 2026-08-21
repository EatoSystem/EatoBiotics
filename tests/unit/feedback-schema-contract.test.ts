/**
 * Migrations 45 (`reviews`) and 46 (`feedback`) — schema contract (#229).
 *
 * Both tables are DRAFTED and unapplied: a human applies them. That is exactly
 * why these assertions matter. Once the SQL is run, the deletion semantics and
 * the retention window are baked into production and are painful to change,
 * and the review that catches a mistake has to happen HERE, against text, not
 * afterwards against customer data.
 *
 * These guards are about what the SQL does, so comments are stripped before
 * matching — both migrations explain at length why the earlier draft was wrong,
 * and matching prose would fail on the rationale itself.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"

const RAW = readFileSync("supabase/migrations.sql", "utf8")

/** SQL with `--` comments removed. */
const SQL = RAW.split("\n")
  .filter((l) => !l.trimStart().startsWith("--"))
  .join("\n")

/** The body of one CREATE TABLE statement, comments stripped. */
function createTable(name: string): string {
  const i = SQL.indexOf(`CREATE TABLE IF NOT EXISTS ${name} (`)
  expect(i, `${name} must be created in migrations.sql`).toBeGreaterThan(-1)
  const open = SQL.indexOf("(", i)
  let depth = 0
  for (let j = open; j < SQL.length; j++) {
    if (SQL[j] === "(") depth++
    else if (SQL[j] === ")" && --depth === 0) return SQL.slice(open, j + 1)
  }
  throw new Error(`unbalanced parentheses in ${name}`)
}

const TABLES = ["feedback", "reviews"] as const

/* ══ Deletion semantics ═════════════════════════════════════════════════ */

describe("account deletion removes the customer's words", () => {
  it.each(TABLES)("%s cascades from auth.users", (table) => {
    const body = createTable(table)
    const fk = body.match(/user_id[^,]*REFERENCES\s+auth\.users\(id\)\s+ON DELETE (\w+(?:\s+\w+)?)/)
    expect(fk, `${table}.user_id must declare an ON DELETE rule`).not.toBeNull()
    expect(
      fk![1],
      `SET NULL would leave a deleted member's free text behind as unattributed health-adjacent prose — unlinking is not deleting`,
    ).toBe("CASCADE")
  })

  it("app/api/account/delete does not enumerate these tables, so the FK is the enforcement", () => {
    const src = readFileSync("app/api/account/delete/route.ts", "utf8")
    for (const table of TABLES) {
      expect(src).not.toMatch(new RegExp(`from\\("${table}"\\)`))
    }
    // …which is precisely why the CASCADE assertions above are load-bearing.
  })
})

/* ══ Retention ══════════════════════════════════════════════════════════ */

describe("90 days is enforced by the schema, not just documented", () => {
  it.each(TABLES)("%s stores a server-derived expires_at defaulting to 90 days", (table) => {
    const body = createTable(table)
    expect(body).toMatch(/expires_at\s+timestamptz\s+NOT NULL\s+DEFAULT\s*\(\s*now\(\)\s*\+\s*interval\s*'90 days'\s*\)/)
  })

  it.each(TABLES)("%s bounds expiry with a CHECK so a wider window cannot be written", (table) => {
    const body = createTable(table)
    expect(body).toMatch(/CHECK\s*\(\s*[\s\S]*expires_at\s*>\s*created_at/)
    expect(body).toMatch(/expires_at\s*<=\s*created_at\s*\+\s*interval\s*'90 days'/)
  })

  it.each(TABLES)("%s indexes expires_at so the sweep does not table-scan", (table) => {
    expect(SQL).toMatch(new RegExp(`CREATE INDEX IF NOT EXISTS\\s+\\w+\\s+ON\\s+${table}\\s*\\(expires_at\\)`))
  })

  it("no route ever writes expires_at", () => {
    for (const f of [
      "app/api/feedback/route.ts",
      "app/api/reviews/route.ts",
      "app/api/feedback/retention/route.ts",
    ]) {
      const src = readFileSync(f, "utf8")
      expect(src, `${f} must not set expires_at`).not.toMatch(/expires_at\s*:/)
    }
  })
})

/* ══ Every reader excludes expired rows ═════════════════════════════════ */

describe("nothing reads text the retention policy says is gone", () => {
  /**
   * Physical deletion is a daily sweep, so expiry and deletion are up to ~24h
   * apart. In that window the rows are still in the table, and a reader without
   * a filter would show 90-day-old customer text — retention past the stated
   * policy, by accident rather than by design.
   *
   * So the rule is: every SELECT against either table constrains `expires_at`.
   * This enumerates the readers and fails when one is added without it.
   */
  const READERS = [
    "app/admin/feedback/page.tsx",
    "app/api/feedback/digest/route.ts",
  ]

  /** Files that touch either table at all, so a new one cannot slip in unseen. */
  function tableTouchers(): string[] {
    const out: string[] = []
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = `${dir}/${entry.name}`
        if (entry.isDirectory()) {
          if (entry.name !== "node_modules" && !entry.name.startsWith(".")) walk(full)
        } else if (/\.tsx?$/.test(entry.name)) {
          const src = readFileSync(full, "utf8")
          // Literal `.from("feedback")`, and the sweep, which loops a table
          // list rather than naming them inline.
          const literal = /\.from\("(feedback|reviews)"\)/.test(src)
          const viaList = /RETAINED_TABLES\s*=\s*\[[^\]]*"feedback"/.test(src)
          if (literal || viaList) out.push(full)
        }
      }
    }
    walk("app")
    walk("lib")
    walk("components")
    return out.sort()
  }

  it("the set of files touching either table is exactly what we expect", () => {
    expect(tableTouchers()).toEqual(
      [
        "app/admin/feedback/page.tsx",
        "app/api/feedback/digest/route.ts",
        "app/api/feedback/retention/route.ts",
        "app/api/feedback/route.ts",
        "app/api/reviews/route.ts",
      ].sort(),
    )
  })

  it.each(READERS)("%s constrains expires_at", (file) => {
    const src = readFileSync(file, "utf8")
    expect(
      src,
      `${file} reads customer text — it must exclude rows past their retention horizon`,
    ).toMatch(/\.gt\(\s*"expires_at"/)
  })

  it("the writers and the sweep are the only files that legitimately skip the filter", () => {
    // Writers insert; the sweep deletes ON expiry (`lte`, the inverse). Neither
    // is a read, so neither needs `gt`.
    for (const f of ["app/api/feedback/route.ts", "app/api/reviews/route.ts"]) {
      expect(readFileSync(f, "utf8")).not.toMatch(/\.select\(\s*"[^"]*message/)
    }
    expect(readFileSync("app/api/feedback/retention/route.ts", "utf8")).toMatch(
      /\.lte\(\s*"expires_at"/,
    )
  })
})

/* ══ Access ═════════════════════════════════════════════════════════════ */

describe("service-role only — nothing reaches these tables directly", () => {
  it.each(TABLES)("%s has RLS enabled", (table) => {
    expect(SQL).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`))
  })

  it.each(TABLES)("%s has zero RLS policies — deny-all to anon and authenticated", (table) => {
    expect(
      SQL,
      `a policy on ${table} would expose private feedback through the public anon key`,
    ).not.toMatch(new RegExp(`CREATE POLICY[^;]*ON ${table}`, "i"))
  })

  it("the migrations file grants nothing to anon or authenticated, anywhere", () => {
    // Zero GRANTs is the repo-wide convention; service-role bypasses RLS.
    expect(SQL).not.toMatch(/\bGRANT\b/i)
  })
})

/* ══ No publication surface ═════════════════════════════════════════════ */

describe("reviews carry no publication machinery", () => {
  it("has no `approved` column", () => {
    // Staff moderation is not a member's consent to be quoted. Leaving the flag
    // in place would invite exactly that conflation the next time someone
    // builds a testimonial page.
    expect(createTable("reviews")).not.toMatch(/\bapproved\b/)
  })

  it("has no index built for public display", () => {
    expect(SQL).not.toMatch(/idx_reviews_approved/)
  })

  it("stores a comment, not a quote", () => {
    const body = createTable("reviews")
    expect(body).toMatch(/comment\s+text/)
    expect(body).not.toMatch(/\bquote\b/)
  })
})

/* ══ Validation parity ══════════════════════════════════════════════════ */

describe("database constraints are at least as strict as the routes", () => {
  it("feedback.message length matches the route's 1–4000", () => {
    expect(createTable("feedback")).toMatch(/char_length\(message\)\s+BETWEEN 1 AND 4000/)
    expect(readFileSync("app/api/feedback/route.ts", "utf8")).toMatch(/min\(1[^)]*\)\.max\(4000\)/)
  })

  it("reviews.comment length matches the route's 500", () => {
    expect(createTable("reviews")).toMatch(/char_length\(comment\)\s*<=\s*500/)
    expect(readFileSync("app/api/reviews/route.ts", "utf8")).toMatch(/max\(500\)/)
  })

  it.each(TABLES)("%s constrains rating to 1–5", (table) => {
    expect(createTable(table)).toMatch(/rating[\s\S]*?BETWEEN 1 AND 5/)
  })

  it("feedback.status is constrained to the four known values", () => {
    expect(createTable("feedback")).toMatch(/status[\s\S]*?CHECK \(status IN \('new','triaged','resolved','archived'\)\)/)
  })

  it("reviews.source is constrained to the four capture points the route accepts", () => {
    expect(createTable("reviews")).toMatch(/source[\s\S]*?IN \('account','meal','retest','milestone'\)/)
  })
})

/* ══ Still unapplied ════════════════════════════════════════════════════ */

describe("both migrations are marked as awaiting a human", () => {
  it.each([45, 46])("migration %i states it is drafted, not applied", (n) => {
    const i = RAW.indexOf(`-- Migration ${n}:`)
    expect(i).toBeGreaterThan(-1)
    const header = RAW.slice(i, i + 900)
    expect(header).toMatch(/DRAFTED — NOT APPLIED/)
  })
})
