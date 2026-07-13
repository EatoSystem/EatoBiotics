import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js"
import {
  resolveChapterImportPlan,
  BOOK_SLUG,
  type ExistingState,
  type ExistingChapter,
  type ExistingMirror,
  type SourceChapter,
} from "@/lib/cms/chapter-import"

/* Server-only DB glue for the MDX → CMS chapter mirror import (Migration 41).
   Shared between the admin API route (app/api/cms/import/chapters/route.ts)
   and the one-off local import runner (scripts/cms-import-chapters-runner.ts)
   so both read state and build the apply payload identically — no duplicated,
   possibly-drifting copy of the fail-closed DB logic. */

export const UNDEFINED_TABLE = "42P01" // Postgres: relation does not exist (Migration 41 not applied)
export const RAISE_EXCEPTION = "P0001" // Postgres: default SQLSTATE for a plain RAISE EXCEPTION — our own
                                        // cms_import_chapters/cms_rollback_import_batch revalidation rejections

/** Thrown by any state read/update that fails, so the caller can fail closed
 *  with a precise error instead of proceeding on partial data. */
export class StateError extends Error {
  constructor(
    readonly status: number,
    readonly payload: Record<string, unknown>
  ) {
    super(typeof payload.error === "string" ? payload.error : "state error")
  }
}

/** Turn any Postgrest error into a fail-closed StateError.
 *  - A missing table (Migration 41 not deployed) → explicit migration-required 503.
 *  - A RAISE EXCEPTION from cms_import_chapters/cms_rollback_import_batch → 409.
 *    This is the RPC's own integrity boundary rejecting the call because state
 *    changed since the dry run (see Migration 41's revalidation-under-locks) —
 *    a real, expected outcome, not an infrastructure failure. The caller should
 *    re-run dry_run and retry, not treat it as "the database is down".
 *  - Anything else → generic fail-closed 503 (never silently treated as empty). */
export function failOn(error: PostgrestError | null, what: string): void {
  if (!error) return
  if (error.code === UNDEFINED_TABLE) {
    throw new StateError(503, {
      error: "Migration 41 required — the chapter-import schema is not deployed",
      migration_required: true,
      detail: `${what}: ${error.message}`,
    })
  }
  if (error.code === RAISE_EXCEPTION) {
    throw new StateError(409, {
      error: "Import rejected — state changed since the dry run. Re-run dry_run and retry.",
      race_detected: true,
      detail: `${what}: ${error.message}`,
    })
  }
  throw new StateError(503, { error: "Database unavailable — import aborted (fail-closed)", detail: `${what}: ${error.message}` })
}

// ── Read the CMS state the resolver needs (never assumes production is empty) ──
export async function readExistingState(sb: SupabaseClient, mirrorSlugs: string[]): Promise<ExistingState> {
  // The target book: the cms_content row with the canonical book slug.
  const bookRes = await sb.from("cms_content").select("id").eq("slug", BOOK_SLUG).eq("content_type", "book").maybeSingle()
  failOn(bookRes.error, "read target book")
  const bookContent = bookRes.data

  let book: ExistingState["book"] = null
  const targetBookChapters: ExistingChapter[] = []
  if (bookContent) {
    const bookRowRes = await sb.from("cms_books").select("id").eq("content_id", bookContent.id).maybeSingle()
    failOn(bookRowRes.error, "read cms_books")
    if (bookRowRes.data) {
      book = { contentId: bookContent.id as string, bookId: bookRowRes.data.id as string }
      const chRes = await sb
        .from("cms_chapters")
        .select("id, content_id, chapter_number, cms_content(status), cms_chapter_mirror(source_path, rolled_back_at)")
        .eq("book_id", bookRowRes.data.id)
      failOn(chRes.error, "read target-book chapters")
      for (const r of chRes.data ?? []) {
        const content = Array.isArray(r.cms_content) ? r.cms_content[0] : r.cms_content
        const mir = Array.isArray(r.cms_chapter_mirror) ? r.cms_chapter_mirror[0] : r.cms_chapter_mirror
        targetBookChapters.push({
          chapterId: r.id as string,
          contentId: r.content_id as string,
          chapterNumber: r.chapter_number as number,
          status: (content?.status as string) ?? "draft",
          mirrorSourcePath: (mir?.source_path as string | undefined) ?? null,
        })
      }
    }
  }

  // All mirror rows (global), keyed by source_path. This read also proves the
  // Migration 41 schema exists — a missing table fails closed here.
  const mirrorRes = await sb
    .from("cms_chapter_mirror")
    .select("source_path, chapter_id, source_sha256, body_sha256, meta_sha256, rolled_back_at")
  failOn(mirrorRes.error, "read cms_chapter_mirror")
  const mirrors: ExistingMirror[] = (mirrorRes.data ?? []).map((m) => ({
    sourcePath: m.source_path as string,
    chapterId: m.chapter_id as string,
    sourceSha256: m.source_sha256 as string,
    bodySha256: m.body_sha256 as string,
    metaSha256: m.meta_sha256 as string,
    rolledBack: m.rolled_back_at != null,
  }))

  // Global owners of any mdx-chapter-N slug we intend to write.
  const slugOwners: ExistingState["slugOwners"] = {}
  if (mirrorSlugs.length > 0) {
    const ownersRes = await sb.from("cms_content").select("id, slug, content_type").in("slug", mirrorSlugs)
    failOn(ownersRes.error, "read slug owners")
    for (const o of ownersRes.data ?? []) {
      slugOwners[o.slug as string] = { contentId: o.id as string, contentType: o.content_type as string }
    }
  }

  return { book, targetBookChapters, mirrors, slugOwners }
}

export function toCreatePayload(sources: SourceChapter[], plan: ReturnType<typeof resolveChapterImportPlan>, batchId: string) {
  const createNumbers = new Set(plan.items.filter((i) => i.action === "CREATE").map((i) => i.number))
  const chapters = sources
    .filter((s) => createNumbers.has(s.number))
    .map((s) => ({
      title: s.title,
      slug: s.mirrorSlug,
      summary: s.summary,
      body: s.body,
      chapter_number: s.number,
      part: s.part,
      part_title: s.partTitle,
      publication_target: s.publicationTarget,
      source_path: s.sourcePath,
      source_slug: s.sourceSlug,
      source_sha256: s.sourceSha256,
      body_sha256: s.bodySha256,
      meta_sha256: s.metaSha256,
      source_published: s.sourcePublished,
    }))
  return {
    batch_id: batchId,
    // `slug` is ALWAYS sent (reuse or create) — the RPC re-verifies the target
    // content row's actual slug against it under lock, so it never trusts that
    // "this content_id is still the eatobiotics-book" just because the caller
    // read it that way earlier (see cms_import_chapters, Migration 41).
    book: plan.bookContentId
      ? { create: false, content_id: plan.bookContentId, slug: BOOK_SLUG }
      : { create: true, content_id: null, title: "EatoBiotics", slug: BOOK_SLUG, subtitle: "The Food System Inside You", summary: null },
    chapters,
  }
}
