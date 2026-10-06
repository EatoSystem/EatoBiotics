import { createHash } from "node:crypto"
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"

/* ════════════════════════════════════════════════════════════════════════════
   EXPERIENCE 0 — THE AUDIT ARTIFACT PROTOCOL.

   One module shared by every surface's capture spec, so the corpus obeys one
   set of rules rather than each spec inventing its own.

   ══ WHY ROWS GO TO DISK ONE AT A TIME ══════════════════════════════════════

   `playwright.config.ts` sets `fullyParallel`, so the tests in a spec are
   distributed across workers and EACH WORKER LOADS ITS OWN COPY OF THIS
   MODULE. A module-level array therefore collects one worker's rows, and a
   per-worker `afterAll` that wrote the index overwrote it with that subset —
   which is how the account corpus first produced a 45-row index beside 75
   images and still read as complete.

   So every capture writes its own shard, and the merge reads whatever is on
   disk and STATES its own completeness.

   ══ WHAT IS COMMITTED, AND WHAT IS NOT ═════════════════════════════════════

   The full corpus outgrew Git at one surface. From the second surface onward:

     corpus/<surface>/**        the complete deterministic corpus — GITIGNORED,
                                archived at Experience 0 close
     screenshots/<surface>/**   a small representative set — COMMITTED, so the
                                findings are legible on GitHub
     manifest.json              every row, with SHA-256 — COMMITTED

   `screenshots/account/**` is the exception: 75 images committed at `496fa76`
   under the pre-protocol convention, deliberately left in place rather than
   rewritten out of history mid-audit.

   Every row carries `storage`, so the manifest never implies an image is in
   the repository when it is only in the archive.
   ════════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════════════
   0R-6R · THE FROZEN CORPUS IS NOT WRITABLE BY AN ORDINARY REGRESSION RUN.

   ══ THE DEFECT, MEASURED ════════════════════════════════════════════════════

   `docs/experience/audit/screenshots/` and `manifest.json` were last written at
   `5274e03` (Experience 0 step 8, the freeze). EVERY `playwright test` run
   since has rewritten them — so 0R-1, 0R-2, 0R-3, 0R-4, 0R-5 and 0R-6 each left
   those files dirty and each restored them by hand.

   That is Experience 0's before-evidence. Its `findings` column still names
   defects this programme has since repaired, which is the entire point of
   keeping it: it is what the audit cites. Correctness depended on the operator
   remembering to `git restore` after a verification run, and on nobody typing
   `git add -A`.

       FROZEN BEFORE-EVIDENCE MUST BE IMMUTABLE TO NORMAL REGRESSION RUNS.

   ══ THE CHANGE, WHICH IS AS NARROW AS IT CAN BE ═════════════════════════════

   Three write paths reached the frozen tree:

     1. each capture spec's `copyFileSync(corpus → screenshots/)` for the
        representative subset;
     2. `mergeIntoManifest()` → `manifest.json`;
     3. `audit-capture.spec.ts` → `SCREENSHOT_INDEX.md`.

   All three now go through `frozenWritesAllowed()`. Without
   `EATOBIOTICS_AUDIT_WRITE_FROZEN=1` the manifest and index are written to the
   ALREADY-GITIGNORED `corpus/` tree instead, and the representative copy is
   skipped. A normal run still produces the complete corpus and a complete
   index; it just cannot touch the committed evidence.

   The corpus is NOT redesigned: same paths, same rows, same sha256s, same
   completeness check. Only the destination moves, and only by default.
   ════════════════════════════════════════════════════════════════════════════ */

export const AUDIT_ROOT = "docs/experience/audit"
export const CORPUS_ROOT = `${AUDIT_ROOT}/corpus`
export const COMMITTED_ROOT = `${AUDIT_ROOT}/screenshots`
export const MANIFEST_JSON = `${AUDIT_ROOT}/manifest.json`
export const SCREENSHOT_INDEX_MD = `${AUDIT_ROOT}/SCREENSHOT_INDEX.md`

/** The one opt-in. Exact string, so a stray truthy value cannot open it. */
export const WRITE_FROZEN_FLAG = "EATOBIOTICS_AUDIT_WRITE_FROZEN"

/**
 * Whether this run may write the committed audit evidence.
 *
 * Fails closed: anything but the exact string "1" keeps the frozen tree
 * read-only, including the flag being absent, empty, "true" or "0".
 */
export function frozenWritesAllowed(): boolean {
  return process.env[WRITE_FROZEN_FLAG] === "1"
}

/**
 * Where the manifest and the index go for THIS run.
 *
 * Under the gate they are the committed files. Otherwise they land beside the
 * generated corpus, which `.gitignore` already covers, so a run still produces
 * a complete, readable index — it just is not the frozen one.
 */
export function manifestTarget(): string {
  return frozenWritesAllowed() ? MANIFEST_JSON : `${CORPUS_ROOT}/manifest.json`
}

export function screenshotIndexTarget(): string {
  return frozenWritesAllowed() ? SCREENSHOT_INDEX_MD : `${CORPUS_ROOT}/SCREENSHOT_INDEX.md`
}

/**
 * Copy a capture into the committed representative set — or decline to.
 *
 * Returns the `storage` value the manifest row should record, so the row never
 * claims an image is in the repository when this run did not put it there.
 */
export function copyToCommitted(from: string, committedDir: string, file: string): ManifestStorage {
  if (!frozenWritesAllowed()) return "archive-only"
  mkdirSync(committedDir, { recursive: true })
  copyFileSync(from, `${committedDir}/${file}`)
  return "committed"
}

const SHARDS = `${AUDIT_ROOT}/.manifest-shards`

/** Where an image actually lives, so a reader never has to guess. */
export type ManifestStorage = "committed" | "archive-only"

export interface ManifestRow {
  readonly file: string
  readonly surface: string
  readonly route: string
  readonly state: string
  /** Tab, section or journey step — whatever divides this surface. */
  readonly section: string
  readonly viewport: string
  readonly frozenClock: string
  readonly evidenceKind: string
  readonly component: string
  readonly findings: readonly string[]
  readonly consoleErrors: number
  readonly consoleErrorTexts: readonly string[]
  /** Lowercase hex, 64 chars, of the PNG bytes as written. */
  readonly sha256: string
  readonly storage: ManifestStorage
}

export function sha256Of(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}

/** One shard per capture. Deterministic name, so a re-run overwrites in place. */
export function writeShard(row: ManifestRow): void {
  mkdirSync(SHARDS, { recursive: true })
  writeFileSync(`${SHARDS}/${row.surface}__${row.file}.json`, JSON.stringify(row), "utf8")
}

/**
 * Read every shard belonging to the given surfaces.
 *
 * Filtering by surface rather than deleting stale shards is deliberate: a
 * clear-at-startup would race, because one worker can reach its first capture
 * before another has finished loading this module.
 */
export function readShards(surfaces: readonly string[]): ManifestRow[] {
  const wanted = new Set(surfaces)
  let names: string[]
  try {
    names = readdirSync(SHARDS).filter((n) => n.endsWith(".json"))
  } catch {
    return []
  }
  return names
    .map((n) => JSON.parse(readFileSync(`${SHARDS}/${n}`, "utf8")) as ManifestRow)
    .filter((r) => wanted.has(r.surface))
    .sort(
      (a, b) =>
        a.surface.localeCompare(b.surface) ||
        a.state.localeCompare(b.state) ||
        a.viewport.localeCompare(b.viewport) ||
        a.section.localeCompare(b.section),
    )
}

/**
 * Merge this surface's rows into the committed manifest, leaving other
 * surfaces' rows untouched — each spec owns only its own surface.
 */
export function mergeIntoManifest(surfaces: readonly string[], rows: readonly ManifestRow[]): ManifestRow[] {
  const dropping = new Set(surfaces)
  let existing: ManifestRow[] = []
  try {
    /*
     * Always READ the committed manifest as the base, even when writing
     * elsewhere: other surfaces' rows must survive a partial run, and reading
     * the frozen file is always safe.
     */
    existing = (JSON.parse(readFileSync(MANIFEST_JSON, "utf8")) as { rows: ManifestRow[] }).rows ?? []
  } catch {
    existing = []
  }
  const merged = [...existing.filter((r) => !dropping.has(r.surface)), ...rows].sort(
    (a, b) => a.surface.localeCompare(b.surface) || a.file.localeCompare(b.file),
  )

  const target = manifestTarget()
  mkdirSync(target.slice(0, target.lastIndexOf("/")), { recursive: true })
  writeFileSync(
    target,
    `${JSON.stringify({ generatedBy: "tests/e2e/audit-capture*.spec.ts", rows: merged }, null, 2)}\n`,
    "utf8",
  )
  return merged
}
