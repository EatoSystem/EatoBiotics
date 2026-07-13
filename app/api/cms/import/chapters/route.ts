import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { loadCanonicalChapters } from "@/lib/cms/chapter-import-source"
import {
  resolveChapterImportPlan,
  renderPlanText,
  classifyDivergence,
  sha256,
  BOOK_SLUG,
  type ExistingState,
  type ExistingChapter,
  type ExistingMirror,
  type SourceChapter,
} from "@/lib/cms/chapter-import"

/* Content Studio — MDX → CMS chapter mirror import (docs/cms-chapter-import-spec.md).
   Admin-gated; cms_* tables only. MDX stays canonical — this only ever writes
   CMS mirror rows and never touches MDX, lib/chapters.ts, or public routes.

   Modes (POST body { mode }):
   - dry_run  : resolve + return the full plan. Writes NOTHING. Allocates no batch id.
   - apply    : resolve; refuse unless verdict READY; create the CREATE set in ONE
                atomic RPC (cms_import_chapters). Never overwrites an existing body.
   - check    : recompute divergence for existing mirror rows (read-mostly).
   - rollback : reverse one import batch (soft archives + retains mirror; hard deletes).

   NOTE: cms_import_chapters / cms_rollback_import_batch (Migration 41) are
   PROPOSED and not applied to production yet; apply/rollback therefore only
   function once that migration is deployed. */

const bodySchema = z.object({
  mode: z.enum(["dry_run", "apply", "check", "rollback"]).default("dry_run"),
  batch_id: z.string().uuid().optional(),
  hard: z.boolean().optional(),
})

// ── Read the CMS state the resolver needs (never assumes production is empty) ──
async function readExistingState(sb: SupabaseClient, mirrorSlugs: string[]): Promise<ExistingState> {
  // The target book: the cms_content row with the canonical book slug.
  const { data: bookContent } = await sb
    .from("cms_content")
    .select("id")
    .eq("slug", BOOK_SLUG)
    .eq("content_type", "book")
    .maybeSingle()

  let book: ExistingState["book"] = null
  const targetBookChapters: ExistingChapter[] = []
  if (bookContent) {
    const { data: bookRow } = await sb.from("cms_books").select("id").eq("content_id", bookContent.id).maybeSingle()
    if (bookRow) {
      book = { contentId: bookContent.id as string, bookId: bookRow.id as string }
      const { data: rows } = await sb
        .from("cms_chapters")
        .select("id, content_id, chapter_number, cms_content(status), cms_chapter_mirror(source_path)")
        .eq("book_id", bookRow.id)
      for (const r of rows ?? []) {
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

  // All mirror rows (global), keyed by source_path.
  const { data: mirrorRows } = await sb
    .from("cms_chapter_mirror")
    .select("source_path, chapter_id, source_sha256, body_sha256, meta_sha256")
  const mirrors: ExistingMirror[] = (mirrorRows ?? []).map((m) => ({
    sourcePath: m.source_path as string,
    chapterId: m.chapter_id as string,
    sourceSha256: m.source_sha256 as string,
    bodySha256: m.body_sha256 as string,
    metaSha256: m.meta_sha256 as string,
  }))

  // Global owners of any mdx-chapter-N slug we intend to write.
  const slugOwners: ExistingState["slugOwners"] = {}
  if (mirrorSlugs.length > 0) {
    const { data: owners } = await sb.from("cms_content").select("id, slug, content_type").in("slug", mirrorSlugs)
    for (const o of owners ?? []) {
      slugOwners[o.slug as string] = { contentId: o.id as string, contentType: o.content_type as string }
    }
  }

  return { book, targetBookChapters, mirrors, slugOwners }
}

function toCreatePayload(sources: SourceChapter[], plan: ReturnType<typeof resolveChapterImportPlan>, batchId: string) {
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
    book: plan.bookContentId
      ? { create: false, content_id: plan.bookContentId }
      : { create: true, content_id: null, title: "EatoBiotics", slug: BOOK_SLUG, subtitle: "The Food System Inside You", summary: null },
    chapters,
  }
}

export async function POST(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof bodySchema>
  try {
    input = bodySchema.parse(await req.json().catch(() => ({})))
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  // ── rollback: reverse one import batch ──
  if (input.mode === "rollback") {
    if (!input.batch_id) return NextResponse.json({ error: "batch_id required" }, { status: 400 })
    const { data, error } = await sb.rpc("cms_rollback_import_batch", { p_batch: input.batch_id, p_hard: input.hard ?? false })
    if (error) return NextResponse.json({ error: "Rollback failed" }, { status: 500 })
    await recordCmsAudit(sb, "import_rolled_back", "cms_chapter_mirror", null, { batch_id: input.batch_id, hard: input.hard ?? false })
    return NextResponse.json({ ok: true, result: data })
  }

  const loaded = await loadCanonicalChapters()

  // ── check: recompute divergence for existing mirror rows (read-mostly) ──
  if (input.mode === "check") {
    const sourceByPath = new Map(loaded.sources.map((s) => [s.sourcePath, s]))
    const { data: mirrorRows } = await sb
      .from("cms_chapter_mirror")
      .select("id, chapter_id, source_path, source_sha256, body_sha256")
    const report: Record<string, number> = {}
    for (const m of mirrorRows ?? []) {
      const src = sourceByPath.get(m.source_path as string)
      const { data: chapter } = await sb.from("cms_chapters").select("content_id").eq("id", m.chapter_id).maybeSingle()
      let currentBodySha = m.body_sha256 as string
      if (chapter) {
        const { data: content } = await sb.from("cms_content").select("body").eq("id", chapter.content_id).maybeSingle()
        currentBodySha = sha256(((content?.body as string | null) ?? ""))
      }
      const state = classifyDivergence({
        storedSourceSha: m.source_sha256 as string,
        storedBodySha: m.body_sha256 as string,
        currentSourceSha: src ? src.sourceSha256 : null,
        currentBodySha,
      })
      report[state] = (report[state] ?? 0) + 1
      await sb.from("cms_chapter_mirror").update({ divergence_state: state, last_checked_at: new Date().toISOString() }).eq("id", m.id)
    }
    return NextResponse.json({ ok: true, report })
  }

  // dry_run + apply both resolve the plan first.
  const mirrorSlugs = loaded.sources.map((s) => s.mirrorSlug)
  const existing = await readExistingState(sb, mirrorSlugs)
  const plan = resolveChapterImportPlan(loaded.sources, existing)
  const planText = renderPlanText(plan, { sourcesScanned: loaded.scanned, sourcesExpected: loaded.expected })

  if (input.mode === "dry_run") {
    // Writes nothing; allocates no import_batch_id.
    return NextResponse.json({ mode: "dry_run", verdict: plan.verdict, plan, planText, missing: loaded.missing })
  }

  // ── apply ──
  if (plan.verdict === "BLOCKED") {
    return NextResponse.json({ error: "Import blocked by conflicts", plan, planText }, { status: 409 })
  }
  if (plan.verdict === "NOOP") {
    return NextResponse.json({ ok: true, verdict: "NOOP", plan, planText })
  }

  const batchId = randomUUID()
  const payload = toCreatePayload(loaded.sources, plan, batchId)
  const { data, error } = await sb.rpc("cms_import_chapters", { payload })
  if (error) {
    console.error("[cms/import/chapters] apply failed:", error.message)
    return NextResponse.json({ error: "Import failed" }, { status: 500 })
  }
  await recordCmsAudit(sb, "chapters_imported", "cms_books", (data?.book_id as string) ?? null, {
    batch_id: batchId,
    created: data?.created ?? 0,
    book_action: plan.bookAction,
  })
  return NextResponse.json({ ok: true, verdict: "READY", batch_id: batchId, result: data, plan })
}
