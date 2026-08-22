#!/usr/bin/env node
/**
 * Fails the build when code reads or writes a table that is not recorded as
 * existing in production.
 *
 * This is a HERMETIC REPOSITORY SCHEMA-ACCOUNTING GUARD, not a live
 * production-schema comparison. It checks two things entirely inside the
 * repo: that every table the source code references appears in
 * supabase/applied-schema.json (as `applied` or `pending`), and that the
 * manifest itself is internally consistent. It never queries Supabase, so it
 * cannot tell you that production silently gained or lost a table the
 * manifest doesn't mention, or that a human applied a migration and forgot to
 * update the manifest — that half stays a human, apply-time responsibility.
 * See "Residual limitation" below.
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
 *
 * ── Three findings from this guard's own pre-merge review, fixed here ─────
 *
 *   1. SILENT EMPTY SCAN. The old `walk()` swallowed any directory-read
 *      error and returned an empty list, so a missing/renamed/unreadable
 *      `app`, `lib` or `components` made the check print "passed" having
 *      examined nothing. Fixed: every scan directory is asserted to exist,
 *      be a directory and be readable before scanning; a file-read failure
 *      propagates instead of being skipped; and the run fails if it scanned
 *      zero files or found zero table references, because either one means
 *      the scan broke, not that the codebase stopped using its database.
 *
 *   2. QUOTE-STYLE BLIND SPOT. The old parser matched only double-quoted
 *      string literals with a hand-rolled regex — `.from('table')` and
 *      `` .from(`table`) `` were invisible to it: not flagged as a
 *      reference, not flagged as unresolved. Nothing in this repo's ESLint
 *      config enforces double quotes, so that was a live, silent bypass of
 *      the entire guard. Fixed: this file now parses each source file with
 *      the TypeScript compiler API and inspects the actual AST, so quote
 *      style is irrelevant (`ts.isStringLiteral` covers both), a template
 *      literal with no interpolation is a literal too, and anything else
 *      (an interpolated template, an identifier, a call) is a dynamic
 *      reference requiring the marker — the same trichotomy as before, just
 *      derived from real syntax instead of a regex guessing at it. Text
 *      inside comments or string contents was never a call expression to
 *      begin with, so it is structurally invisible now, not merely excluded.
 *
 *   3. UNENFORCED STATE TRANSITION. Nothing stopped a table from sitting in
 *      both `applied` and `pending` at once — exactly the state a human
 *      leaves behind by applying a migration and forgetting to remove the
 *      stale `pending` entry in the same PR. The guard kept printing that
 *      entry as "awaiting a human apply" forever, incorrectly, without
 *      failing. Fixed: `loadManifest` now rejects duplicate entries within
 *      either list and any table present in both.
 *
 * ── Residual limitation (still true, stated plainly) ──────────────────────
 *
 * CI is hermetic and never queries live Supabase. If a human applies a
 * migration and simply never touches this manifest at all — doesn't add the
 * table to `applied`, doesn't remove it from `pending`, doesn't touch the
 * file — nothing here can detect that, because there is no live signal to
 * compare against. This guard can only catch the manifest contradicting
 * itself (finding 3) or code referencing something the manifest never
 * mentions at all; it cannot verify the manifest against production. That
 * verification remains a human, apply-time responsibility (see #237's
 * runbook and CLAUDE.md's production-database rule). A networked variant
 * querying production in CI was considered and rejected in #230 for keeping
 * CI hermetic — this file does not introduce Supabase credentials or network
 * access, and should not.
 */
import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const MANIFEST = "supabase/applied-schema.json"
const SCAN_DIRS = ["app", "lib", "components"]

/** Postgres-safe, unquoted identifier shape — what a real table name looks like. */
const TABLE_NAME = /^[a-z_][a-z0-9_]*$/

/**
 * Marker for a `.from(...)` call whose argument isn't a literal, e.g. the
 * retention route's `.from(table)` over a constant list.
 *
 * Deliberately line-scoped: `\s` matches newlines, so a greedy class would run
 * past the end of the comment and swallow the following line of code into the
 * table list. Scoped to the whole file, same as before — not to a single
 * line adjacent to the call — because the marker lives on the declaration of
 * the table list, not necessarily beside every place it's looped over.
 */
const MARKER = /schema-drift-tables:[ \t]*([a-z0-9_]+(?:[ \t]*,[ \t]*[a-z0-9_]+)*)/i

/** Throws with a useful diagnostic instead of returning something misleading. */
function assertScannable(dir, label) {
  let st
  try {
    st = statSync(dir)
  } catch (err) {
    throw new Error(
      `required scan directory "${label}" does not exist or is not accessible (${err.code ?? err.message}). ` +
        `A schema-drift check that silently skips a missing directory is worse than no check at all.`,
    )
  }
  if (!st.isDirectory()) {
    throw new Error(`required scan directory "${label}" exists but is not a directory.`)
  }
  try {
    readdirSync(dir)
  } catch (err) {
    throw new Error(`required scan directory "${label}" is not readable (${err.code ?? err.message}).`)
  }
}

/**
 * Recursive `.ts`/`.tsx` file walk. Any error reading a directory PROPAGATES
 * — it used to be swallowed here, which let a broken scan report "passed"
 * having examined nothing (see finding 1 above).
 */
function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch (err) {
    throw new Error(`could not read directory ${dir} (${err.code ?? err.message}).`)
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
 * The name written immediately before `.from(`, i.e. what a human would call
 * "the receiver" — `x` in `x.from(...)`, or the last segment of a property
 * chain (`storage` in `sb.storage.from(...)`). `undefined` for anything more
 * complex (`getSupabase().from(...)`), which is deliberately NOT excluded by
 * `isNotAQuery` below — erring toward treating it as a real query is the safe
 * direction for a guard whose whole purpose is catching what nobody noticed.
 */
function immediateReceiverName(expr) {
  if (ts.isIdentifier(expr)) return expr.text
  if (ts.isPropertyAccessExpression(expr)) return expr.name.text
  return undefined
}

/**
 * True when a `.from(...)` is not a Supabase table query.
 *
 * Two distinct receivers to reject, for different reasons:
 *
 *   - `storage` — `sb.storage.from("cms-media")` reads a BUCKET. Identical
 *     syntax, unrelated namespace.
 *   - A capitalised receiver — `Array.from(x)`, `Buffer.from(x)`,
 *     `Uint8Array.from(x)`, any typed-array or static constructor. These are
 *     JS statics and vastly outnumber the real query sites; treating them as
 *     tables floods the output and trains people to ignore it. Supabase
 *     clients are lowercase (`supabase`, `db`, `sb`, or any alias).
 */
function isNotAQuery(receiver) {
  if (!receiver) return false
  if (receiver === "storage") return true
  return /^[A-Z]/.test(receiver)
}

function scriptKindFor(fileName) {
  return fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
}

/** Every `x.from(...)` CallExpression in a parsed source file, via real AST — not text. */
function collectFromCalls(sourceFile) {
  const calls = []
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "from"
    ) {
      calls.push(node)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return calls
}

/**
 * Table references in one file, plus a count of dynamic `.from(...)` calls
 * this could not resolve to a literal.
 *
 * Parses with the TypeScript compiler API rather than a regex, so:
 *
 *   - double-quoted, single-quoted and no-substitution template-literal
 *     arguments are all real string literals to the parser — quote style
 *     cannot hide a reference from this the way it could from a
 *     double-quote-only regex (finding 2 above);
 *   - an interpolated template (`` `${x}` ``), an identifier, or any other
 *     non-literal argument is a dynamic reference, exactly like the old
 *     `.from(identifier)` case, and needs the marker;
 *   - `.from(...)` written inside a comment or inside another string's text
 *     is not a CallExpression at all, so it is structurally invisible
 *     rather than merely excluded by a heuristic.
 *
 * Throws if the file cannot be parsed as TypeScript/TSX, so a genuinely
 * broken source file fails the check instead of silently contributing zero
 * references.
 */
export function referencesIn(source, fileName = "source.ts") {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, scriptKindFor(fileName))
  if (sourceFile.parseDiagnostics && sourceFile.parseDiagnostics.length > 0) {
    const message = ts.flattenDiagnosticMessageText(sourceFile.parseDiagnostics[0].messageText, " ")
    throw new Error(`${fileName}: could not be parsed as TypeScript (${message}).`)
  }

  const tables = new Set()
  let unresolved = 0

  for (const call of collectFromCalls(sourceFile)) {
    const receiver = immediateReceiverName(call.expression.expression)
    if (isNotAQuery(receiver)) continue
    if (call.arguments.length !== 1) continue

    const arg = call.arguments[0]
    if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
      // Buckets are hyphenated/dotted; table identifiers are not — a literal
      // that isn't schema-safe (e.g. a bucket name that reached here some
      // other way) is simply not a table, not an error.
      if (TABLE_NAME.test(arg.text)) tables.add(arg.text)
    } else {
      // Interpolated template, identifier, call, member access, etc. — not
      // resolvable by reading source, so it needs the marker rather than
      // silence.
      unresolved++
    }
  }

  if (unresolved > 0) {
    const declared = source.match(MARKER)
    if (declared) {
      for (const t of declared[1].split(",").map((s) => s.trim()).filter(Boolean)) tables.add(t)
      unresolved = 0
    }
  }

  return { tables, unresolved }
}

/**
 * Loads and validates supabase/applied-schema.json.
 *
 * Validation enforces that the manifest can only mean one thing:
 *
 *   - no table repeated within `applied`, or within `pending`;
 *   - `applied` and `pending` are disjoint — a table in both is exactly the
 *     state a human leaves behind by applying a migration and forgetting to
 *     remove the stale `pending` entry (finding 3 above);
 *   - every `pending` entry keeps its `table`, `migration` and `issue`, so
 *     `pending` cannot quietly become a place to silence the check;
 *   - every table name (`applied` or `pending`) is a schema-safe identifier.
 */
export function loadManifest(root = repoRoot) {
  const raw = JSON.parse(readFileSync(path.join(root, MANIFEST), "utf8"))

  const applied = new Set()
  for (const t of raw.applied ?? []) {
    if (applied.has(t)) {
      throw new Error(`${MANIFEST}: "${t}" appears more than once in \`applied\`.`)
    }
    applied.add(t)
  }

  const pending = new Map()
  for (const entry of raw.pending ?? []) {
    if (!entry.table || !entry.migration || !entry.issue) {
      throw new Error(
        `${MANIFEST}: every \`pending\` entry needs table, migration and issue — ` +
          `got ${JSON.stringify(entry)}. Undocumented pending drift is how this ` +
          `list stops meaning anything.`,
      )
    }
    if (pending.has(entry.table)) {
      throw new Error(`${MANIFEST}: "${entry.table}" appears more than once in \`pending\`.`)
    }
    pending.set(entry.table, entry)
  }

  const overlap = [...applied].filter((t) => pending.has(t)).sort()
  if (overlap.length > 0) {
    throw new Error(
      `${MANIFEST}: ${overlap.join(", ")} ${overlap.length === 1 ? "appears" : "appear"} in BOTH ` +
        "`applied` and `pending`. That is the state a migration leaves behind when a human applies " +
        "it but forgets to remove the stale `pending` entry in the same change — remove it from " +
        "`pending` now that it is applied. (This guard cannot verify against live Supabase which " +
        "one is true; it can only catch the manifest contradicting itself.)",
    )
  }

  for (const t of [...applied, ...pending.keys()]) {
    if (!TABLE_NAME.test(t)) {
      throw new Error(`${MANIFEST}: "${t}" is not a schema-safe table identifier.`)
    }
  }

  return { applied, pending }
}

export function check(root = repoRoot) {
  const { applied, pending } = loadManifest(root)

  for (const dir of SCAN_DIRS) {
    assertScannable(path.join(root, dir), dir)
  }

  const undeclared = new Map() // table -> files
  const dynamic = []
  const referenced = new Set()
  let scannedFiles = 0

  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(root, dir))) {
      const rel = path.relative(root, file)
      let source
      try {
        source = readFileSync(file, "utf8")
      } catch (err) {
        throw new Error(`could not read ${rel} (${err.code ?? err.message}).`)
      }
      scannedFiles++
      const { tables, unresolved } = referencesIn(source, file)
      if (unresolved > 0) dynamic.push(rel)
      for (const t of tables) {
        referenced.add(t)
        if (applied.has(t) || pending.has(t)) continue
        if (!undeclared.has(t)) undeclared.set(t, [])
        undeclared.get(t).push(rel)
      }
    }
  }

  // A check that examined nothing is not a passing check — see finding 1.
  if (scannedFiles === 0) {
    throw new Error(
      `scanned zero source files across ${SCAN_DIRS.join(", ")} — a schema drift check that ` +
        "examines nothing cannot mean anything. This usually means an empty checkout or a broken " +
        "path, not that the codebase stopped having source files.",
    )
  }
  if (referenced.size === 0) {
    throw new Error(
      `scanned ${scannedFiles} file(s) but found zero table references anywhere — that almost ` +
        "certainly means the scan itself is broken (wrong root, parser regression), not that this " +
        "codebase suddenly stopped using its database.",
    )
  }

  const orphans = [...applied].filter((t) => !referenced.has(t)).sort()
  return { undeclared, dynamic, pending, orphans, referenced, scannedFiles }
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

  const { undeclared, dynamic, pending, orphans, referenced, scannedFiles } = result
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
    `\nSchema drift check passed — ${scannedFiles} file(s) scanned, ` +
      `${referenced.size} referenced table(s), all accounted for.`,
  )
}
