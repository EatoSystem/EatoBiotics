import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { isMediaRole } from "@/lib/cms/media"

/* Content ↔ media relationships. POST attaches an asset to a content item in
   a role; DELETE detaches. GET lists a content item's attached media. Every
   generated adaptation keeps its own links; attaching never mutates the asset
   or the content body. */

type Params = { params: Promise<{ id: string }> }

const attachSchema = z.object({
  media_id: z.string().uuid(),
  role: z.string().default("inline"),
  sort_order: z.number().int().min(0).max(9999).default(0),
})

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data } = await sb
    .from("cms_content_media")
    .select("media_id, role, sort_order, cms_media(filename, media_type, status)")
    .eq("content_id", id)
    .order("sort_order", { ascending: true })
  return NextResponse.json({ media: data ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof attachSchema>
  try {
    input = attachSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (!isMediaRole(input.role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  // Both sides must exist.
  const [{ data: content }, { data: media }] = await Promise.all([
    sb.from("cms_content").select("id").eq("id", id).maybeSingle(),
    sb.from("cms_media").select("id").eq("id", input.media_id).maybeSingle(),
  ])
  if (!content || !media) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { error } = await sb.from("cms_content_media").upsert(
    { content_id: id, media_id: input.media_id, role: input.role, sort_order: input.sort_order },
    { onConflict: "content_id,media_id,role" }
  )
  if (error) return NextResponse.json({ error: "Attach failed" }, { status: 500 })

  await recordCmsAudit(sb, "media_attached", "cms_content", id, { media_id: input.media_id, role: input.role })
  return NextResponse.json({ ok: true }, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const mediaId = req.nextUrl.searchParams.get("media_id")
  const role = req.nextUrl.searchParams.get("role") ?? "inline"
  if (!mediaId) return NextResponse.json({ error: "media_id required" }, { status: 400 })

  const { error } = await sb
    .from("cms_content_media")
    .delete()
    .eq("content_id", id)
    .eq("media_id", mediaId)
    .eq("role", role)
  if (error) return NextResponse.json({ error: "Detach failed" }, { status: 500 })

  await recordCmsAudit(sb, "media_detached", "cms_content", id, { media_id: mediaId, role })
  return NextResponse.json({ ok: true })
}
