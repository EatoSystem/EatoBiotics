import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"
import type { SupabaseClient, PostgrestError } from "@supabase/supabase-js"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { loadCanonicalChapters } from "@/lib/cms/chapter-import-source"
import {
  resolveChapterImportPlan,
  resolveFinalVerdict,
  renderPlanText,
  classifyDivergence,
  validateCanonicalSources,
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

   FAIL-CLOSED: every DB read/update inspects its error. A failed state query is
   NEVER interpreted as "empty" — it aborts with 503. If the Migration 41 schema
   is absent (undefined_table), every mode returns a clear migration-required 503
   instead of a misleading plan. */

const bodySchema = z.object({
  mode: z.enum(["dry_run", "apply", "check", "rollback"]).default("dry_run"),
  batch_id: z.string().uuid().optional(),
  hard: z.boolean().optional(),
})

const UNDEFINED_TABLE = "42P01" // Postgres: relation does not exist (Migration 41 not applied)

/** Thrown by any state read/update that fails, so the handler can fail closed
 *  with a precise HTTP response instead of proceeding on partial data. */
class StateError extends Error {
  constructor(
    readonly status: number,
    readonly payload: Record<string, unknown>
  ) {
    super(typeof payload.error === "string" ? payload.error : "state error")
  }
}

/** Turn any Postgrest error into a fail-closed StateError. A missing table
 *  (Migration 41 not deployed) becomes an explicit migration-required 503. */
function failOn(error: PostgrestError | null, what: string): void {
  if (!error) return
  if (error.code === UNDEFINED_TABLE) {
    throw new StateError(503, {
      error: "Migration 41 required — the chapter-import schema is not deployed",
      migration_required: true,
      detail: `${what}: ${error.message}`,
    })
  }
  throw new StateError(503, { error: "Database unavailable — import aborted (fail-closed)", detail: `${what}: ${error.message}` })
}

// ── Read the CMS state the resolver needs (never assumes production is empty) ──
async function readExistingState(sb: SupabaseClient, mirrorSlugs: string[]): Promise<ExistingState> {
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

  try {
    // ── rollback: reverse one import batch ──
    if (input.mode === "rollback") {
      if (!input.batch_id) return NextResponse.json({ error: "batch_id required" }, { status: 400 })
      const { data, error } = await sb.rpc("cms_rollback_import_batch", { p_batch: input.batch_id, p_hard: input.hard ?? false })
      failOn(error, "rollback rpc")
      await recordCmsAudit(sb, "import_rolled_back", "cms_chapter_mirror", null, { batch_id: input.batch_id, hard: input.hard ?? false, result: data })
      return NextResponse.json({ ok: true, result: data })
    }

    const loaded = await loadCanonicalChapters()
    const sourceValidation = validateCanonicalSources(loaded)

    // ── check: recompute divergence for existing mirror rows (fail-closed) ──
    if (input.mode === "check") {
      const sourceByPath = new Map(loaded.sources.map((s) => [s.sourcePath, s]))
      const mirrorRes = await sb.from("cms_chapter_mirror").select("id, chapter_id, source_path, source_sha256, body_sha256")
      failOn(mirrorRes.error, "check: read mirrors")
      const report: Record<string, number> = {}
      for (const m of mirrorRes.data ?? []) {
        const src = sourceByPath.get(m.source_path as string)
        const chRes = await sb.from("cms_chapters").select("content_id").eq("id", m.chapter_id).maybeSingle()
        failOn(chRes.error, "check: read chapter")
        let currentBodySha = m.body_sha256 as string
        if (chRes.data) {
          const cRes = await sb.from("cms_content").select("body").eq("id", chRes.data.content_id).maybeSingle()
          failOn(cRes.error, "check: read content body")
          currentBodySha = sha256((cRes.data?.body as string | null) ?? "")
        }
        const state = classifyDivergence({
          storedSourceSha: m.source_sha256 as string,
          storedBodySha: m.body_sha256 as string,
          currentSourceSha: src ? src.sourceSha256 : null,
          currentBodySha,
        })
        report[state] = (report[state] ?? 0) + 1
        const upd = await sb.from("cms_chapter_mirror").update({ divergence_state: state, last_checked_at: new Date().toISOString() }).eq("id", m.id)
        failOn(upd.error, "check: update divergence")
      }
      return NextResponse.json({ ok: true, report })
    }

    // dry_run + apply both resolve the plan first (against a fail-closed read).
    const mirrorSlugs = loaded.sources.map((s) => s.mirrorSlug)
    const existing = await readExistingState(sb, mirrorSlugs)
    const plan = resolveChapterImportPlan(loaded.sources, existing)
    // ONE authoritative verdict, derived once and handed to both the JSON
    // response and the rendered text — they can never disagree. An incomplete
    // canonical source set always blocks, regardless of what the plan says;
    // UPDATE_AVAILABLE items already fold into plan.verdict as BLOCKED.
    const verdict = resolveFinalVerdict(plan, sourceValidation.problems)
    const planText = renderPlanText(plan, {
      sourcesScanned: loaded.scanned,
      sourcesExpected: loaded.expected,
      sourceProblems: sourceValidation.problems,
    })

    if (input.mode === "dry_run") {
      // Writes nothing; allocates no import_batch_id.
      return NextResponse.json({
        mode: "dry_run",
        verdict,
        plan,
        planText,
        sourceProblems: sourceValidation.problems,
        unreadable: loaded.unreadable,
      })
    }

    // ── apply ── refuse before allocating a batch id or calling the RPC.
    if (verdict === "BLOCKED") {
      return NextResponse.json(
        { error: "Import blocked", verdict, sourceProblems: sourceValidation.problems, plan, planText },
        { status: 409 }
      )
    }
    if (verdict === "NOOP") {
      return NextResponse.json({ ok: true, verdict: "NOOP", plan, planText })
    }

    const batchId = randomUUID()
    const payload = toCreatePayload(loaded.sources, plan, batchId)
    const { data, error } = await sb.rpc("cms_import_chapters", { payload })
    failOn(error, "apply rpc")
    await recordCmsAudit(sb, "chapters_imported", "cms_books", (data?.book_id as string) ?? null, {
      batch_id: batchId,
      created: data?.created ?? 0,
      book_created: data?.book_created ?? false,
    })
    return NextResponse.json({ ok: true, verdict: "READY", batch_id: batchId, result: data, plan })
  } catch (err) {
    if (err instanceof StateError) return NextResponse.json(err.payload, { status: err.status })
    throw err
  }
}
