/**
 * scripts/check-schema-drift.mjs — the guard for code/schema drift (#230).
 *
 * Drift here has failed silently three times: a migration applied against its
 * own "DO NOT APPLY" header, two migrations written but never applied (killing
 * cross-device sync for weeks), and two more drafted while the feedback widget
 * shipped site-wide. Every one was found by a human doing a live read, long
 * after the fact.
 *
 * This guard's OWN pre-merge review then found three more ways the same
 * silence could recur inside the guard itself: a swallowed directory-read
 * error that let it report "passed" having scanned nothing, a double-quote-
 * only parser that a single-quoted or template-literal `.from()` call could
 * walk straight past, and a manifest that tolerated a table sitting in both
 * `applied` and `pending` at once (exactly what a human leaves behind by
 * applying a migration and forgetting to update the manifest). These tests
 * pin all three fixes alongside the original parsing hazards.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, mkdirSync, mkdtempSync, writeFileSync, chmodSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { referencesIn, loadManifest, check } from "../../scripts/check-schema-drift.mjs"

const refs = (src: string, fileName = "source.ts") =>
  referencesIn(src, fileName) as { tables: Set<string>; unresolved: number }

const isRoot = typeof process.getuid === "function" && process.getuid() === 0

/** A throwaway repo-shaped fixture: app/lib/components + a manifest. */
function makeFixture({
  app = {},
  lib = {},
  components = {},
  manifest = { applied: [], pending: [] },
  skipDirs = [] as string[],
}: {
  app?: Record<string, string>
  lib?: Record<string, string>
  components?: Record<string, string>
  manifest?: unknown
  skipDirs?: string[]
} = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), "sdg-fixture-"))
  const writeTree = (base: string, files: Record<string, string>) => {
    mkdirSync(path.join(dir, base), { recursive: true })
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, base, rel)
      mkdirSync(path.dirname(full), { recursive: true })
      writeFileSync(full, content)
    }
  }
  if (!skipDirs.includes("app")) writeTree("app", app)
  if (!skipDirs.includes("lib")) writeTree("lib", lib)
  if (!skipDirs.includes("components")) writeTree("components", components)
  mkdirSync(path.join(dir, "supabase"), { recursive: true })
  writeFileSync(path.join(dir, "supabase", "applied-schema.json"), JSON.stringify(manifest))
  return dir
}

/* ══ Finding 1: fail closed on a broken scan ═══════════════════════════════ */

describe("finding 1 — scanning fails closed instead of silently examining nothing", () => {
  it("fails when a required scan directory is missing entirely", () => {
    const dir = makeFixture({ skipDirs: ["lib"] })
    expect(() => check(dir)).toThrow(/lib.*does not exist|does not exist.*lib/i)
  })

  it("fails when all scan directories exist but contain zero source files", () => {
    const dir = makeFixture() // app/lib/components exist, all empty
    expect(() => check(dir)).toThrow(/scanned zero source files/)
  })

  it("fails when files are scanned but zero table references are found anywhere", () => {
    const dir = makeFixture({ app: { "page.tsx": "export default function Page() { return null }" } })
    expect(() => check(dir)).toThrow(/zero table references/)
  })

  it.skipIf(isRoot)("fails when a scan directory exists but is not readable", () => {
    const dir = makeFixture({ app: { "x.ts": 'db.from("profiles").select()' } })
    const lib = path.join(dir, "lib")
    chmodSync(lib, 0o000)
    try {
      expect(() => check(dir)).toThrow(/not readable/)
    } finally {
      chmodSync(lib, 0o755) // so the fixture can be cleaned up
    }
  })

  it.skipIf(isRoot)("fails when a scanned file cannot be read, rather than skipping it", () => {
    const dir = makeFixture({ app: { "a.ts": 'db.from("profiles").select()', "b.ts": 'db.from("leads").select()' } })
    const file = path.join(dir, "app", "b.ts")
    chmodSync(file, 0o000)
    try {
      expect(() => check(dir)).toThrow(/could not read/)
    } finally {
      chmodSync(file, 0o644)
    }
  })

  it("a real undeclared table still fails once the scan itself is healthy", () => {
    const dir = makeFixture({
      app: { "x.ts": 'await supabase.from("not_a_real_table").select("*")' },
      manifest: { applied: ["not_a_real_table_but_different"], pending: [] },
    })
    const { undeclared } = check(dir)
    expect([...undeclared.keys()]).toEqual(["not_a_real_table"])
  })

  it("the real repository passes with a healthy, non-empty scan", () => {
    const { undeclared, dynamic, scannedFiles, referenced } = check() as {
      undeclared: Map<string, string[]>
      dynamic: string[]
      scannedFiles: number
      referenced: Set<string>
    }
    expect([...undeclared.keys()], "undeclared tables — see the manifest").toEqual([])
    expect(dynamic, "unresolved dynamic .from(...) — add a marker comment").toEqual([])
    expect(scannedFiles).toBeGreaterThan(0)
    expect(referenced.size).toBeGreaterThan(0)
  })
})

/* ══ Finding 2: the AST parser sees past quote style ═══════════════════════ */

describe("finding 2 — every quoting style is a real reference, not just double quotes", () => {
  it("detects a double-quoted literal", () => {
    expect(refs('db.from("profiles").select()').tables).toEqual(new Set(["profiles"]))
  })

  it("detects a single-quoted literal — invisible to the old regex", () => {
    expect(refs("db.from('profiles').select()").tables).toEqual(new Set(["profiles"]))
  })

  it("detects a no-substitution template-literal — also invisible to the old regex", () => {
    expect(refs("db.from(`profiles`).select()").tables).toEqual(new Set(["profiles"]))
  })

  it("treats an interpolated template as unresolved, not as a literal", () => {
    const src = 'const t = "profiles"\ndb.from(`${t}`).select()'
    const { tables, unresolved } = refs(src)
    expect(tables.size).toBe(0)
    expect(unresolved).toBe(1)
  })

  it("resolves an interpolated template via the same marker mechanism as an identifier", () => {
    const src = '// schema-drift-tables: feedback, reviews\nconst t = "feedback"\ndb.from(`${t}`).select()'
    const { tables, unresolved } = refs(src)
    expect(unresolved).toBe(0)
    expect(tables).toEqual(new Set(["feedback", "reviews"]))
  })

  it("ignores a .from() call written inside a // comment — never a real CallExpression", () => {
    const src = '// example: await supabase.from("totally_fake_table").select("*")\nconst x = 1'
    const { tables, unresolved } = refs(src)
    expect(tables.size).toBe(0)
    expect(unresolved).toBe(0)
  })

  it("ignores a .from() call written inside a /* */ block comment", () => {
    const src = '/* legacy: db.from("also_fake").select() */\nconst x = 1'
    expect(refs(src).tables.size).toBe(0)
  })

  it("ignores .from() text that only exists inside another string's contents", () => {
    const src = 'const note = \'call it like db.from("fake_in_string").select()\''
    expect(refs(src).tables.size).toBe(0)
  })

  it("keeps digits — glp1_logs is a table, `glp` is not", () => {
    const { tables } = refs('await supabase.from("glp1_logs").select("*")')
    expect(tables.has("glp1_logs")).toBe(true)
    expect(tables.has("glp")).toBe(false)
  })

  it("handles the receiver being on a previous line (multiline/chained builder)", () => {
    const { tables } = refs(`const { data } = await supabase\n  .from("leads")\n  .select("id")`)
    expect(tables.has("leads")).toBe(true)
  })

  it("works through any lowercase alias, not one hardcoded client name", () => {
    expect(refs('myWeirdAliasedClient.from("profiles").select()').tables).toEqual(new Set(["profiles"]))
  })

  it("throws a useful diagnostic when a scanned file cannot be parsed as TypeScript", () => {
    expect(() => refs("const x = {{{ not valid ts (((", "broken.ts")).toThrow(/could not be parsed/)
  })
})

describe("storage buckets and JS statics are still excluded, across quote styles", () => {
  it("ignores sb.storage.from(\"cms-media\")", () => {
    expect(refs('await sb.storage.from("cms-media").info(p)').tables.size).toBe(0)
  })

  it("ignores sb.storage.from('cms-media') single-quoted", () => {
    expect(refs("await sb.storage.from('cms-media').info(p)").tables.size).toBe(0)
  })

  it("ignores a dynamic storage bucket without demanding a declaration", () => {
    const { tables, unresolved } = refs("supabase.storage.from(bucket).upload(p, b)")
    expect(tables.size).toBe(0)
    expect(unresolved).toBe(0)
  })

  it.each([
    ["Array.from(selected)", "Array"],
    ["Buffer.from(value)", "Buffer"],
    ["Uint8Array.from(Buffer.from(b64, 'base64'))", "Uint8Array"],
    ["Int8Array.from(bytes)", "Int8Array"],
  ])("ignores %s", (src) => {
    const { tables, unresolved } = refs(src)
    expect(tables.size).toBe(0)
    expect(unresolved).toBe(0)
  })

  it("ignores Array.from over a string literal, which would otherwise look like a table", () => {
    expect(refs('Array.from("abc")').tables.size).toBe(0)
  })
})

describe("dynamic table names need a declaration, not silence", () => {
  const dynamic = `const T = ["feedback", "reviews"] as const
for (const t of T) { await supabase.from(t).delete().lte("expires_at", cutoff) }`

  it("flags an unresolvable .from(variable)", () => {
    expect(refs(dynamic).unresolved).toBe(1)
  })

  it("resolves it when the marker names the tables", () => {
    const declared = `// schema-drift-tables: feedback, reviews\n${dynamic}`
    const { tables, unresolved } = refs(declared)
    expect(unresolved).toBe(0)
    expect(tables).toEqual(new Set(["feedback", "reviews"]))
  })

  it("treats getSupabase().from(x) as a query needing declaration", () => {
    expect(refs("getSupabase().from(name).select()").unresolved).toBe(1)
  })
})

/* ══ Finding 3: the manifest can no longer contradict itself ═══════════════ */

describe("finding 3 — applied and pending must be disjoint, and internally consistent", () => {
  it("rejects a duplicate entry within `applied`", () => {
    const dir = makeFixture({ manifest: { applied: ["profiles", "profiles"], pending: [] } })
    expect(() => loadManifest(dir)).toThrow(/more than once in `applied`/)
  })

  it("rejects a duplicate entry within `pending`", () => {
    const dir = makeFixture({
      manifest: {
        applied: [],
        pending: [
          { table: "feedback", migration: 46, issue: 229 },
          { table: "feedback", migration: 46, issue: 229 },
        ],
      },
    })
    expect(() => loadManifest(dir)).toThrow(/more than once in `pending`/)
  })

  it("rejects a table present in BOTH applied and pending — the stale-transition bug", () => {
    // This is the exact state a human leaves behind by applying migration 46
    // and forgetting to remove `feedback` from `pending` in the same change.
    // Before this fix the guard passed and kept reporting it as "awaiting a
    // human apply", which was simply false.
    const dir = makeFixture({
      manifest: {
        applied: ["feedback"],
        pending: [{ table: "feedback", migration: 46, issue: 229 }],
      },
    })
    expect(() => loadManifest(dir)).toThrow(/BOTH.*applied.*pending/i)
  })

  it("requires table, migration and issue on every pending entry", () => {
    const dir = makeFixture({ manifest: { applied: [], pending: [{ table: "orphan" }] } })
    expect(() => loadManifest(dir)).toThrow(/migration and issue/)
  })

  it("rejects a table identifier that isn't schema-safe", () => {
    const dir = makeFixture({ manifest: { applied: ["cms-media"], pending: [] } })
    expect(() => loadManifest(dir)).toThrow(/not a schema-safe table identifier/)
  })

  it("accepts a clean, disjoint manifest", () => {
    const dir = makeFixture({
      manifest: { applied: ["profiles"], pending: [{ table: "feedback", migration: 46, issue: 229 }] },
    })
    const { applied, pending } = loadManifest(dir)
    expect(applied.has("profiles")).toBe(true)
    expect(pending.has("feedback")).toBe(true)
  })
})

/* ══ The real manifest ═══════════════════════════════════════════════════ */

describe("the real manifest", () => {
  it("declares today's real drift rather than hiding it", () => {
    // Pinned exactly, so pending tables cannot accumulate quietly. Every entry
    // here is a table the code references and production does not have yet —
    // each one is a migration a human still has to apply, and the list is the
    // only place that is visible at a glance.
    const { pending } = loadManifest() as { pending: Map<string, { migration: number; issue: number }> }
    expect([...pending.keys()].sort()).toEqual([
      "feedback",
      "reviews",
    ])
    expect(pending.get("reviews")!.migration).toBe(45)
    expect(pending.get("feedback")!.migration).toBe(46)
    // Migration 47 (paid_report_intents + consents) was applied to production on
    // 2026-08-29 and verified live — table, RLS enabled, zero policies, all
    // constraints and indexes present — so both tables moved to `applied`. They
    // are deliberately NOT asserted here any more: this list is the set still
    // awaiting a human, and leaving an applied table in it is the stale-entry
    // drift the guard exists to prevent.
  })

  it("stays sorted, so a diff shows what changed", () => {
    const raw = JSON.parse(readFileSync("supabase/applied-schema.json", "utf8"))
    expect(raw.applied).toEqual([...raw.applied].sort())
  })

  it("matches the 42 tables read from production", () => {
    const raw = JSON.parse(readFileSync("supabase/applied-schema.json", "utf8"))
    expect(raw.applied.length).toBe(42)
  })

  it("is internally consistent (no duplicates, no overlap) — loadManifest would already throw otherwise", () => {
    expect(() => loadManifest()).not.toThrow()
  })
})

/* ══ CI actually runs it ════════════════════════════════════════════════ */

describe("the guard is wired into CI", () => {
  it("runs next to the other two guard scripts", () => {
    const ci = readFileSync(".github/workflows/ci.yml", "utf8")
    expect(ci, "a guard that CI does not run is documentation").toMatch(
      /run:\s*node scripts\/check-schema-drift\.mjs/,
    )
  })
})
