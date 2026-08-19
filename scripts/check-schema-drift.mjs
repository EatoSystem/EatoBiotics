#!/usr/bin/env node
/**
 * Fails the build when code reads or writes a table that does not exist in
 * production.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * Code and schema ship on different clocks, and every time they have diverged
 * here it failed SILENTLY — no error, no alert, just a feature quietly doing
 * nothing, found weeks later by a human doing a live read:
 *
 *   1. Migration 41 was applied to production despite a "DO NOT APPLY" header.
 *   2. Migrations 35/36 were written but never applied, so cross-device Twin
 *      sync was dead the whole time — the sync code fails silently offline.
 *   3. Migrations 45/46 stayed drafted while the feedback widget shipped
 *      site-wide, thanking customers for submissions it discarded.
 *
 * `CLAUDE.md` already documents this risk twice and says to verify against the
 * live database. The rule is good and was followed. It still happened three
 * times, because it relies on someone remembering.
 *
 * ── Why a manifest, and not supabase/migrations.sql ───────────────────────
 *
 * That file cannot answer the question. Eight tables in daily use — profiles,
 * leads, deep_assessments, journal_entries, plate_data, referrals, meal_scans,
 * food_intelligence_reports — are live in production and are never created by
 * it; they predate it. Parsing CREATE TABLE would flag all eight on day one.
 *
 * And that file's comments have been wrong: Migration 41 said "DO NOT APPLY"
 * and was applied. A comment is not a record. supabase/applied-schema.json is.
 */
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MANIFEST = "supabase/applied-schema.json"
const SCAN_DIRS = ["app", "lib", "components"]

/**
 * Marker for a `.from(variable)` call the regex cannot resolve.
 *
 * Deliberately line-scoped: `\s` matches newlines, so a greedy class would run
 * past the end of the comment and swallow the following line of code into the
 * table list.
 */
const MARKER = /schema-drift-tables:[ \t]*([a-z0-9_]+(?:[ \t]*,[ \t]*[a-z0-9_]+)*)/i

/** Manual recursive walk — fs.globSync needs Node 22+, CI runs Node 20. */
function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name !== "node_modules" && !e.name.startsWith(".")) walk(full, out)
    } else if (/\.tsx?$/.test(e.name)) {
      out.push(full)
    }
  }
  return out
}

/**
 * True when a `.from(...)` is not a Supabase table query.
 *
 * Two distinct receivers to reject, for different reasons:
 *
 *   - `storage` — `sb.storage.from("cms-media")` reads a BUCKET. Identical
 *     syntax, unrelated namespace.
 *   - A capitalised receiver — `Array.from(x)`, `Buffer.from(x)`,
 *     `Uint8Array.from(x)`. These are JS statics and vastly outnumber the real
 *     query sites; treating them as tables floods the output and trains people
 *     to ignore it. Supabase clients are lowercase (`supabase`, `db`, `sb`).
 *
 * A receiver of `)` — `getSupabase().from(x)` — is deliberately NOT rejected:
 * that is a real query, and erring toward demanding a declaration is the safe
 * direction for a guard whose whole purpose is catching what nobody noticed.
 */
function isNotAQuery(receiver) {
  if (!receiver) return false
  if (receiver === "storage") return true
  return /^[A-Z]/.test(receiver)
}

/**
 * Table references in one file, plus any dynamic call we could not resolve.
 *
 * Three traps this deliberately handles, each of which a looser pattern gets
 * wrong in a way that is invisible until it matters:
 *
 *   - DIGITS. `glp1_logs` and `glp1_profile` are real tables. A `[a-z_]+`
 *     capture truncates them to `glp`, which then looks like undeclared drift.
 *   - STORAGE BUCKETS ARE NOT TABLES. `sb.storage.from("cms-media")` is
 *     syntactically identical to a table read. Worse, `cms-media` is
 *     hyphenated, so a loose capture invents a table called `cms`.
 *   - DYNAMIC NAMES. `.from(table)` over a constant list is legitimate and
 *     unresolvable by regex, so it needs a declaration rather than silence.
 */
export function referencesIn(source) {
  const tables = new Set()
  let unresolved = 0

  // Capture the WHOLE quoted literal, then decide — never a partial match.
  for (const m of source.matchAll(/(\w+|\))?\s*\.\s*from\(\s*"([^"]*)"\s*\)/g)) {
    if (isNotAQuery(m[1])) continue
    const name = m[2]
    // Buckets are hyphenated/dotted; table identifiers are not.
    if (/^[a-z0-9_]+$/.test(name)) tables.add(name)
  }

  // `.from(identifier)` — resolvable only via an explicit marker.
  for (const m of source.matchAll(/(\w+|\))?\s*\.\s*from\(\s*([A-Za-z_$][\w$]*)\s*\)/g)) {
    if (isNotAQuery(m[1])) continue
    const declared = source.match(MARKER)
    if (declared) {
      for (const t of declared[1].split(",").map((s) => s.trim()).filter(Boolean)) tables.add(t)
    } else {
      unresolved++
    }
  }

  return { tables, unresolved }
}

export function loadManifest(root = repoRoot) {
  const raw = JSON.parse(readFileSync(path.join(root, MANIFEST), "utf8"))
  const applied = new Set(raw.applied ?? [])
  const pending = new Map()
  for (const entry of raw.pending ?? []) {
    if (!entry.table || !entry.migration || !entry.issue) {
      throw new Error(
        `${MANIFEST}: every \`pending\` entry needs table, migration and issue — ` +
          `got ${JSON.stringify(entry)}. Undocumented pending drift is how this ` +
          `list stops meaning anything.`,
      )
    }
    pending.set(entry.table, entry)
  }
  return { applied, pending }
}

export function check(root = repoRoot) {
  const { applied, pending } = loadManifest(root)
  const undeclared = new Map() // table -> files
  const dynamic = []
  const referenced = new Set()

  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(root, dir))) {
      const rel = path.relative(root, file)
      const { tables, unresolved } = referencesIn(readFileSync(file, "utf8"))
      if (unresolved > 0) dynamic.push(rel)
      for (const t of tables) {
        referenced.add(t)
        if (applied.has(t) || pending.has(t)) continue
        if (!undeclared.has(t)) undeclared.set(t, [])
        undeclared.get(t).push(rel)
      }
    }
  }

  const orphans = [...applied].filter((t) => !referenced.has(t)).sort()
  return { undeclared, dynamic, pending, orphans, referenced }
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result
  try {
    result = check()
  } catch (err) {
    console.error(`Schema drift check failed.\n\n  ${err.message}\n`)
    process.exit(1)
  }

  const { undeclared, dynamic, pending, orphans, referenced } = result
  let failed = false

  if (undeclared.size > 0) {
    failed = true
    console.error("Schema drift check FAILED — code references tables that are not")
    console.error("recorded as existing in production:\n")
    for (const [table, files] of [...undeclared].sort()) {
      console.error(`  ${table}`)
      for (const f of files) console.error(`      ${f}`)
    }
    console.error(`\nIf the table IS applied, add it to \`applied\` in ${MANIFEST}.`)
    console.error("If it is drafted and awaiting a human apply, add it to `pending`")
    console.error("with its migration number and tracking issue.\n")
  }

  if (dynamic.length > 0) {
    failed = true
    console.error("Schema drift check FAILED — unresolvable dynamic `.from(...)` with no")
    console.error("declaration. Add a comment naming the tables, e.g.")
    console.error("`// schema-drift-tables: feedback, reviews`\n")
    for (const f of dynamic) console.error(`  - ${f}`)
    console.error("")
  }

  if (pending.size > 0) {
    // Printed on EVERY run, pass or fail. Declared drift that nobody looks at
    // is the same failure as undeclared drift, just slower.
    console.log(`Schema drift: ${pending.size} table(s) awaiting a human apply —`)
    for (const e of pending.values()) {
      console.log(`  ${e.table} (migration ${e.migration}, issue #${e.issue})`)
    }
  }

  if (orphans.length > 0) {
    console.log(`\nApplied but unreferenced (informational): ${orphans.join(", ")}`)
  }

  if (failed) process.exit(1)
  console.log(
    `\nSchema drift check passed — ${referenced.size} referenced table(s), all accounted for.`,
  )
}
