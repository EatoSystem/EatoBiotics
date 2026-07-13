import { createHash } from "crypto"

/* ── MDX → CMS chapter-import core (pure, testable) ─────────────────────────
   Implements docs/cms-chapter-import-spec.md. MDX stays canonical; these CMS
   rows are an editable editorial mirror that never feeds the public book.

   Everything here is a PURE function of its inputs — no filesystem, no DB. The
   route reads the source (fs) and the existing CMS state (DB) and passes both
   in, so the plan resolution — including the non-empty-production safety rules
   — is unit-testable without either. The resolver NEVER assumes production is
   empty: it is driven entirely by the `existing` snapshot it is handed. */

export const BOOK_SLUG = "eatobiotics-book"
export const CHAPTER_SLUG_PREFIX = "mdx-"

/** Prefix a canonical chapter slug ('chapter-1') into its CMS mirror slug
 *  ('mdx-chapter-1') — deterministic, collision-avoiding, idempotent. */
export function mirrorSlug(sourceSlug: string): string {
  return `${CHAPTER_SLUG_PREFIX}${sourceSlug}`
}

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex")
}

/** A canonical chapter resolved from lib/chapters.ts + its MDX file. */
export interface SourceChapter {
  number: number
  sourceSlug: string           // 'chapter-1'
  mirrorSlug: string           // 'mdx-chapter-1'
  sourcePath: string           // 'content/book/chapter-1.mdx'
  title: string
  summary: string
  part: string
  partTitle: string
  body: string                 // raw MDX, verbatim
  sourcePublished: boolean     // chapter.status === 'published'
  publicationTarget: string[]
  sourceSha256: string         // hash of MDX bytes
  bodySha256: string           // hash of the snapshot to be written
  metaSha256: string           // hash of the mapped metadata fields
}

/** An existing CMS chapter belonging to the TARGET book (the eatobiotics-book
 *  record), as read from the DB. `status` is the cms_content.status. */
export interface ExistingChapter {
  chapterId: string
  contentId: string
  chapterNumber: number
  status: string
  mirrorSourcePath: string | null   // set iff this chapter is itself a mirror row
}

/** An existing mirror row (global — keyed by canonical source_path). */
export interface ExistingMirror {
  sourcePath: string
  chapterId: string
  sourceSha256: string
  bodySha256: string
  metaSha256: string
  /** True once this mirror's import batch was soft-rolled-back (content archived,
   *  mirror retained for provenance). Such rows are excluded from ordinary
   *  SKIP/UPDATE matching and block a silent re-create (see resolveOne). */
  rolledBack: boolean
}

/** Snapshot of relevant CMS state, read before planning. */
export interface ExistingState {
  /** The eatobiotics-book record, or null if it does not exist yet. */
  book: { contentId: string; bookId: string } | null
  /** Active/archived chapters of the TARGET book only (empty if no book). */
  targetBookChapters: ExistingChapter[]
  /** All mirror rows, keyed by source_path (global). */
  mirrors: ExistingMirror[]
  /** Owner of each `mdx-chapter-N` slug that already exists globally. */
  slugOwners: Record<string, { contentId: string; contentType: string }>
}

export type ImportAction = "CREATE" | "SKIP" | "UPDATE_AVAILABLE" | "CONFLICT"
export type ImportVerdict = "READY" | "BLOCKED" | "NOOP"

export interface PlanItem {
  number: number
  sourceSlug: string
  action: ImportAction
  reason: string
}

export interface ImportPlan {
  bookAction: "CREATE" | "REUSE"
  bookContentId: string | null
  items: PlanItem[]
  counts: Record<ImportAction, number>
  verdict: ImportVerdict
}

const ARCHIVED = "archived"

/** Resolve the full, deterministic import plan for `sources` against the
 *  `existing` CMS snapshot. Pure. Writes nothing. This is the single place the
 *  non-empty-production safety rules live (spec §4.1 + acceptance criterion). */
export function resolveChapterImportPlan(sources: SourceChapter[], existing: ExistingState): ImportPlan {
  const bookAction: "CREATE" | "REUSE" = existing.book ? "REUSE" : "CREATE"

  const mirrorByPath = new Map(existing.mirrors.map((m) => [m.sourcePath, m]))
  // Active (non-archived) target-book chapters that are NOT themselves a mirror
  // of the source being placed — these are the ones that can block a number.
  const activeTargetByNumber = new Map<number, ExistingChapter>()
  for (const c of existing.targetBookChapters) {
    if (c.status !== ARCHIVED) activeTargetByNumber.set(c.chapterNumber, c)
  }

  const items: PlanItem[] = sources
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((s) => resolveOne(s, existing, mirrorByPath, activeTargetByNumber))

  const counts: Record<ImportAction, number> = { CREATE: 0, SKIP: 0, UPDATE_AVAILABLE: 0, CONFLICT: 0 }
  for (const it of items) counts[it.action] += 1

  let verdict: ImportVerdict
  if (counts.CONFLICT > 0) verdict = "BLOCKED"
  else if (counts.CREATE > 0) verdict = "READY"
  else verdict = "NOOP"

  return { bookAction, bookContentId: existing.book?.contentId ?? null, items, counts, verdict }
}

function resolveOne(
  s: SourceChapter,
  existing: ExistingState,
  mirrorByPath: Map<string, ExistingMirror>,
  activeTargetByNumber: Map<number, ExistingChapter>
): PlanItem {
  const base = { number: s.number, sourceSlug: s.sourceSlug }
  const mirror = mirrorByPath.get(s.sourcePath)

  if (mirror) {
    // A soft-rolled-back mirror is retained for provenance but its content is
    // archived. It is NOT a live mirror: it must not SKIP, and it must not be
    // silently re-created over (the UNIQUE(source_kind, source_path) slot is
    // still occupied). Re-import is a deliberate, blocked-by-default action —
    // the retained mirror must be cleared (hard rollback) first.
    if (mirror.rolledBack) {
      return {
        ...base,
        action: "CONFLICT",
        reason: "source was imported then soft-rolled-back; clear the retained mirror (hard rollback) to re-import",
      }
    }
    // Already imported → SKIP if unchanged, else UPDATE_AVAILABLE. apply never
    // overwrites an existing body; updates are report-only (spec §6).
    const unchanged = mirror.sourceSha256 === s.sourceSha256 && mirror.metaSha256 === s.metaSha256
    return unchanged
      ? { ...base, action: "SKIP", reason: "mirror in sync with MDX" }
      : { ...base, action: "UPDATE_AVAILABLE", reason: "MDX changed since import (report-only; apply won't overwrite)" }
  }

  // No mirror yet. Global slug collision: someone else already owns mdx-chapter-N.
  const slugOwner = existing.slugOwners[s.mirrorSlug]
  if (slugOwner) {
    return {
      ...base,
      action: "CONFLICT",
      reason: `slug ${s.mirrorSlug} already owned by ${slugOwner.contentType} ${slugOwner.contentId}`,
    }
  }

  // Chapter-number conflict is evaluated WITHIN THE TARGET BOOK ONLY. Chapters
  // in unrelated (differently-slugged) books never conflict; archived chapters
  // free their number; when the book will be freshly created there are none.
  const clash = activeTargetByNumber.get(s.number)
  if (clash) {
    return {
      ...base,
      action: "CONFLICT",
      reason: `chapter number ${s.number} held by active chapter ${clash.chapterId} in the target book`,
    }
  }

  return { ...base, action: "CREATE", reason: `new mirror; number ${s.number} free` }
}

/** A canonical source file that could not be read (missing or unreadable). */
export interface SourceReadProblem {
  sourcePath: string
  reason: string
}

export interface SourceValidation {
  ok: boolean
  problems: string[]
}

/** Validate the canonical source set BEFORE any plan is trusted. An incomplete
 *  or inconsistent source set must block the whole import — a missing MDX file
 *  must never silently reduce a 25-chapter import to 24 (spec acceptance #2). */
export function validateCanonicalSources(
  loaded: { sources: SourceChapter[]; unreadable: SourceReadProblem[]; expected: number },
  expectedCount = 25
): SourceValidation {
  const problems: string[] = []

  for (const u of loaded.unreadable) {
    problems.push(`canonical source unreadable: ${u.sourcePath} (${u.reason})`)
  }
  if (loaded.expected !== expectedCount) {
    problems.push(`expected ${expectedCount} chapter metadata entries, found ${loaded.expected}`)
  }

  const numbers = loaded.sources.map((s) => s.number)
  const slugs = loaded.sources.map((s) => s.sourceSlug)
  const dupNumbers = duplicates(numbers)
  const dupSlugs = duplicates(slugs)
  if (dupNumbers.length) problems.push(`duplicate chapter numbers: ${dupNumbers.join(", ")}`)
  if (dupSlugs.length) problems.push(`duplicate chapter slugs: ${dupSlugs.join(", ")}`)

  const present = new Set(numbers)
  const missingNumbers: number[] = []
  for (let n = 1; n <= expectedCount; n++) if (!present.has(n)) missingNumbers.push(n)
  if (missingNumbers.length) problems.push(`missing expected chapter numbers: ${missingNumbers.join(", ")}`)

  return { ok: problems.length === 0, problems }
}

function duplicates<T>(xs: T[]): T[] {
  const seen = new Set<T>()
  const dup = new Set<T>()
  for (const x of xs) {
    if (seen.has(x)) dup.add(x)
    seen.add(x)
  }
  return [...dup]
}

/** Pure decision for what a rollback does to the batch's book. The RPC mirrors
 *  this: the book is only ever affected when THIS batch created it and no
 *  chapters remain; a reused manual book is always left untouched. */
export function resolveRollbackBookAction(args: {
  bookCreatedByBatch: boolean
  remainingChapterCount: number
  hard: boolean
}): "delete_book" | "archive_book" | "leave_book" {
  if (!args.bookCreatedByBatch) return "leave_book"
  if (args.remainingChapterCount > 0) return "leave_book"
  return args.hard ? "delete_book" : "archive_book"
}

/** Divergence classification for the read-only `check` operation (spec §6).
 *  `sourceMissing` means the canonical MDX file is gone. */
export type DivergenceState =
  | "in_sync"
  | "source_changed"
  | "cms_changed"
  | "both_changed"
  | "missing_source"

export function classifyDivergence(args: {
  storedSourceSha: string
  storedBodySha: string
  currentSourceSha: string | null // null when the MDX file is missing
  currentBodySha: string          // hash of the live cms_content.body
}): DivergenceState {
  if (args.currentSourceSha === null) return "missing_source"
  const sourceChanged = args.currentSourceSha !== args.storedSourceSha
  const cmsChanged = args.currentBodySha !== args.storedBodySha
  if (sourceChanged && cmsChanged) return "both_changed"
  if (sourceChanged) return "source_changed"
  if (cmsChanged) return "cms_changed"
  return "in_sync"
}

/** Render the deterministic dry-run plan text (spec §5). No identifier that
 *  implies a real import batch exists — dry runs allocate none. */
export function renderPlanText(plan: ImportPlan, opts: { sourcesScanned: number; sourcesExpected: number }): string {
  const lines: string[] = []
  lines.push(`IMPORT PLAN — book "EatoBiotics" (slug: ${BOOK_SLUG})  [DRY RUN]`)
  lines.push(
    `Book record:            FIND-OR-CREATE  (${plan.bookAction === "REUSE" ? "found → REUSE" : "found: no → will CREATE"})`
  )
  lines.push(`Source files scanned:   ${opts.sourcesScanned} / ${opts.sourcesExpected} present`)
  lines.push("")
  lines.push(" #   slug          action            reason")
  for (const it of plan.items) {
    const num = String(it.number).padEnd(4)
    const slug = it.sourceSlug.padEnd(12)
    const action = it.action.padEnd(16)
    lines.push(` ${num}${slug}  ${action}  ${it.reason}`)
  }
  lines.push("")
  lines.push(
    `Summary:  CREATE ${plan.counts.CREATE}   SKIP ${plan.counts.SKIP}   ` +
      `UPDATE_AVAILABLE ${plan.counts.UPDATE_AVAILABLE}   CONFLICT ${plan.counts.CONFLICT}`
  )
  const verdictLine =
    plan.verdict === "BLOCKED"
      ? `Result:   BLOCKED — resolve ${plan.counts.CONFLICT} conflict(s) first.  No rows written.`
      : plan.verdict === "NOOP"
        ? "Result:   NOOP — CMS mirror already in sync with MDX.  No rows written."
        : `Result:   READY — ${plan.counts.CREATE} chapter(s) to create.  No rows written (dry run).`
  lines.push(verdictLine)
  return lines.join("\n")
}
