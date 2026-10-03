import { createHash } from "node:crypto"
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"

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

export const AUDIT_ROOT = "docs/experience/audit"
export const CORPUS_ROOT = `${AUDIT_ROOT}/corpus`
export const COMMITTED_ROOT = `${AUDIT_ROOT}/screenshots`
export const MANIFEST_JSON = `${AUDIT_ROOT}/manifest.json`

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
    existing = (JSON.parse(readFileSync(MANIFEST_JSON, "utf8")) as { rows: ManifestRow[] }).rows ?? []
  } catch {
    existing = []
  }
  const merged = [...existing.filter((r) => !dropping.has(r.surface)), ...rows].sort(
    (a, b) => a.surface.localeCompare(b.surface) || a.file.localeCompare(b.file),
  )

  mkdirSync(AUDIT_ROOT, { recursive: true })
  writeFileSync(
    MANIFEST_JSON,
    `${JSON.stringify({ generatedBy: "tests/e2e/audit-capture*.spec.ts", rows: merged }, null, 2)}\n`,
    "utf8",
  )
  return merged
}
