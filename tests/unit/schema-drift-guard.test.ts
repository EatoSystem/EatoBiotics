/**
 * scripts/check-schema-drift.mjs — the guard for code/schema drift (#230).
 *
 * Drift here has failed silently three times: a migration applied against its
 * own "DO NOT APPLY" header, two migrations written but never applied (killing
 * cross-device sync for weeks), and two more drafted while the feedback widget
 * shipped site-wide. Every one was found by a human doing a live read, long
 * after the fact.
 *
 * So the guard's own parsing has to be right — a false positive floods the
 * output and trains people to ignore it, and a false negative is the silence
 * this exists to end. These tests pin the three cases the real codebase proved
 * are easy to get wrong.
 */
import { describe, it, expect } from "vitest"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

import { referencesIn, loadManifest, check } from "../../scripts/check-schema-drift.mjs"

const refs = (src: string) => referencesIn(src) as { tables: Set<string>; unresolved: number }

/* ══ Parsing hazards found in the real codebase ═════════════════════════ */

describe("table names are parsed exactly, not approximately", () => {
  it("keeps digits — glp1_logs is a table, `glp` is not", () => {
    // A `[a-z_]+` capture truncates this and reports undeclared drift on a
    // table that has existed in production for months.
    const { tables } = refs('await supabase.from("glp1_logs").select("*")')
    expect(tables.has("glp1_logs")).toBe(true)
    expect(tables.has("glp")).toBe(false)
  })

  it("reads a plain table query", () => {
    expect(refs('db.from("profiles").select()').tables).toEqual(new Set(["profiles"]))
  })

  it("handles the receiver being on a previous line", () => {
    const { tables } = refs(`const { data } = await supabase\n  .from("leads")\n  .select("id")`)
    expect(tables.has("leads")).toBe(true)
  })
})

describe("storage buckets are not tables", () => {
  it("ignores sb.storage.from(\"cms-media\")", () => {
    // Identical syntax, unrelated namespace — and because the bucket name is
    // hyphenated, a loose capture would invent a table called `cms`.
    const { tables } = refs('await sb.storage.from("cms-media").info(p)')
    expect(tables.size).toBe(0)
  })

  it("ignores a dynamic storage bucket without demanding a declaration", () => {
    const { tables, unresolved } = refs("supabase.storage.from(bucket).upload(p, b)")
    expect(tables.size).toBe(0)
    expect(unresolved).toBe(0)
  })
})

describe("JS statics are not queries", () => {
  it.each([
    ["Array.from(selected)", "Array"],
    ["Buffer.from(value)", "Buffer"],
    ["Uint8Array.from(Buffer.from(b64, 'base64'))", "Uint8Array"],
  ])("ignores %s", (src) => {
    const { tables, unresolved } = refs(src)
    expect(tables.size).toBe(0)
    expect(unresolved).toBe(0)
  })

  it("ignores Array.from over a string, which would otherwise look like a table", () => {
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
    // Erring toward demanding a declaration is the safe direction for a guard
    // whose purpose is catching what nobody noticed.
    expect(refs("getSupabase().from(name).select()").unresolved).toBe(1)
  })
})

/* ══ The manifest ═══════════════════════════════════════════════════════ */

describe("the manifest is a record, not a wish", () => {
  it("lists every table the checker finds referenced", () => {
    const { undeclared, dynamic } = check() as {
      undeclared: Map<string, string[]>
      dynamic: string[]
    }
    expect([...undeclared.keys()], "undeclared tables — see the manifest").toEqual([])
    expect(dynamic, "unresolved dynamic .from(...) — add a marker comment").toEqual([])
  })

  it("declares today's real drift rather than hiding it", () => {
    const { pending } = loadManifest() as { pending: Map<string, { migration: number; issue: number }> }
    // These two are genuinely absent from production (#229). Declared, not
    // silently allowed — and printed on every run.
    expect([...pending.keys()].sort()).toEqual(["feedback", "reviews"])
    expect(pending.get("feedback")!.migration).toBe(46)
    expect(pending.get("reviews")!.migration).toBe(45)
  })

  it("stays sorted, so a diff shows what changed", () => {
    const raw = JSON.parse(readFileSync("supabase/applied-schema.json", "utf8"))
    expect(raw.applied).toEqual([...raw.applied].sort())
  })

  it("matches the 40 tables read from production", () => {
    const raw = JSON.parse(readFileSync("supabase/applied-schema.json", "utf8"))
    expect(raw.applied.length).toBe(40)
  })
})

describe("a pending entry without provenance is rejected", () => {
  it("requires table, migration and issue", () => {
    // Otherwise `pending` becomes a place to silence the guard, which is the
    // failure mode this whole check exists to prevent.
    const bad = { applied: [], pending: [{ table: "orphan" }] }
    const dir = path.join(tmpdir(), `drift-${Date.now()}`)
    mkdirSync(path.join(dir, "supabase"), { recursive: true })
    writeFileSync(path.join(dir, "supabase", "applied-schema.json"), JSON.stringify(bad))
    expect(() => loadManifest(dir)).toThrow(/migration and issue/)
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
