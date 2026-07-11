import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"

/* Content Studio — append-only version history for one content item.
   POST snapshots the item's CURRENT saved state as the next version number
   (used by the editor's "save version" and autosave checkpoints). Versions
   are never updated or deleted. Admin-gated; cms_* tables only. */

const postSchema = z.object({
  change_note: z.string().trim().max(500).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data, error } = await sb
    .from("cms_content_versions")
    .select("id, version_number, title, change_note, created_at")
    .eq("content_id", id)
    .order("version_number", { ascending: false })
    .limit(50)
  if (error) return NextResponse.json({ error: "List failed" }, { status: 500 })
  return NextResponse.json({ versions: data ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof postSchema>
  try {
    input = postSchema.parse(await req.json().catch(() => ({})))
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { data: content } = await sb
    .from("cms_content")
    .select("id, title, summary, body, status, availability_status, content_type")
    .eq("id", id)
    .maybeSingle()
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: latest } = await sb
    .from("cms_content_versions")
    .select("version_number")
    .eq("content_id", id)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextVersion = ((latest?.version_number as number | undefined) ?? 0) + 1

  const { data: created, error } = await sb
    .from("cms_content_versions")
    .insert({
      content_id: id,
      version_number: nextVersion,
      title: content.title,
      summary: content.summary,
      body: content.body,
      metadata_json: {
        status: content.status,
        availability_status: content.availability_status,
        content_type: content.content_type,
      },
      change_note: input.change_note ?? null,
    })
    .select("id, version_number")
    .single()

  if (error || !created) {
    console.error("[cms/versions] snapshot failed:", error?.message)
    return NextResponse.json({ error: "Snapshot failed" }, { status: 500 })
  }

  await recordCmsAudit(sb, "version_created", "cms_content", id, { version: nextVersion })
  return NextResponse.json({ id: created.id, version_number: created.version_number }, { status: 201 })
}
