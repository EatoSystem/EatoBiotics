import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"

/* One media asset. GET returns the row plus a fresh short-TTL signed view URL
   (the object is private). PATCH edits metadata. DELETE archives — the row is
   flagged 'archived' and the storage object is NEVER removed, so any published
   content still referencing it keeps resolving. */

const SIGNED_URL_TTL_SECONDS = 5 * 60

const patchSchema = z.object({
  alt_text: z.string().trim().max(1000).nullish(),
  caption: z.string().trim().max(2000).nullish(),
  generation_prompt: z.string().trim().max(4000).nullish(),
  source: z.string().trim().max(200).nullish(),
  copyright_owner: z.string().trim().max(300).nullish(),
  licence: z.string().trim().max(300).nullish(),
  usage_restrictions: z.string().trim().max(1000).nullish(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data: media } = await sb.from("cms_media").select("*").eq("id", id).maybeSingle()
  if (!media) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Fresh short-TTL signed URL for private viewing (key from the verified row).
  let viewUrl: string | null = null
  const { data: signed } = await sb.storage
    .from((media.storage_bucket as string) || "cms-media")
    .createSignedUrl(media.storage_path as string, SIGNED_URL_TTL_SECONDS)
  viewUrl = signed?.signedUrl ?? null

  // Where this asset is used (content relationships).
  const { data: usage } = await sb
    .from("cms_content_media")
    .select("content_id, role, cms_content(title, status)")
    .eq("media_id", id)

  return NextResponse.json({ item: media, viewUrl, usage: usage ?? [] })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof patchSchema>
  try {
    input = patchSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { data: current } = await sb.from("cms_media").select("id").eq("id", id).maybeSingle()
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const edited: string[] = []
  for (const key of ["alt_text", "caption", "generation_prompt", "source", "copyright_owner", "licence", "usage_restrictions"] as const) {
    if (key in input && input[key] !== undefined) {
      update[key] = input[key]
      edited.push(key)
    }
  }

  const { error } = await sb.from("cms_media").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  if (edited.length > 0) {
    await recordCmsAudit(sb, "media_updated", "cms_media", id, { fields: edited })
  }
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data: current } = await sb.from("cms_media").select("id, status").eq("id", id).maybeSingle()
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Archive only — never storage.remove (published references must resolve).
  const { error } = await sb
    .from("cms_media")
    .update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: "Archive failed" }, { status: 500 })

  await recordCmsAudit(sb, "media_archived", "cms_media", id, {})
  return NextResponse.json({ ok: true })
}
