import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { z } from "zod"
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
} from "@/lib/cms/chapter-import"
import { StateError, failOn, readExistingState, toCreatePayload } from "@/lib/cms/chapter-import-db"

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
    // A canonical-source change is the MDX body OR the mapped metadata
    // (title/summary/part/part_title/source_published/publication_target) —
    // both hashes are compared, so a metadata-only edit in lib/chapters.ts is
    // correctly classified as source_changed (never silently in_sync).
    if (input.mode === "check") {
      const sourceByPath = new Map(loaded.sources.map((s) => [s.sourcePath, s]))
      const mirrorRes = await sb
        .from("cms_chapter_mirror")
        .select("id, chapter_id, source_path, source_sha256, meta_sha256, body_sha256")
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
          storedMetaSha: m.meta_sha256 as string,
          storedBodySha: m.body_sha256 as string,
          currentSourceSha: src ? src.sourceSha256 : null,
          currentMetaSha: src ? src.metaSha256 : null,
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
