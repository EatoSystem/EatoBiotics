import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { SIZE_CAPS, isMediaType } from "@/lib/cms/media"

/* Step 2 of a media upload: confirm the object landed and catalogue it.
   The actual stored size is re-verified against the cap (the browser controls
   the real bytes, so the declared size from step 1 is not trusted), then a
   cms_media row is inserted 'ready'. GET lists/filters the library. */

const confirmSchema = z.object({
  storagePath: z.string().trim().min(1).max(400),
  filename: z.string().trim().min(1).max(300),
  mediaType: z.string(),
  mime: z.string().trim().min(1).max(150),
  alt_text: z.string().trim().max(1000).optional(),
  caption: z.string().trim().max(2000).optional(),
  generation_prompt: z.string().trim().max(4000).optional(),
  source: z.string().trim().max(200).optional(),
  copyright_owner: z.string().trim().max(300).optional(),
  licence: z.string().trim().max(300).optional(),
  usage_restrictions: z.string().trim().max(1000).optional(),
})

export async function POST(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof confirmSchema>
  try {
    input = confirmSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (!isMediaType(input.mediaType)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 })
  }

  // Verify the object actually exists and re-check its real size against the cap.
  const { data: info, error: infoError } = await sb.storage.from("cms-media").info(input.storagePath)
  if (infoError || !info) {
    return NextResponse.json({ error: "Upload not found — please retry" }, { status: 400 })
  }
  const actualSize = typeof info.size === "number" ? info.size : null
  if (actualSize !== null && actualSize > SIZE_CAPS[input.mediaType]) {
    return NextResponse.json({ error: "File exceeds the size limit" }, { status: 400 })
  }

  const { data, error } = await sb
    .from("cms_media")
    .insert({
      filename: input.filename,
      storage_bucket: "cms-media",
      storage_path: input.storagePath,
      media_type: input.mediaType,
      mime_type: input.mime,
      file_size: actualSize,
      alt_text: input.alt_text ?? null,
      caption: input.caption ?? null,
      generation_prompt: input.generation_prompt ?? null,
      source: input.source ?? "upload",
      copyright_owner: input.copyright_owner ?? null,
      licence: input.licence ?? null,
      usage_restrictions: input.usage_restrictions ?? null,
      status: "ready",
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[cms/media] confirm insert failed:", error?.message)
    return NextResponse.json({ error: "Could not catalogue upload" }, { status: 500 })
  }

  await recordCmsAudit(sb, "media_uploaded", "cms_media", data.id as string, {
    media_type: input.mediaType,
    filename: input.filename,
  })

  return NextResponse.json({ id: data.id }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const p = req.nextUrl.searchParams
  let query = sb
    .from("cms_media")
    .select("id, filename, media_type, mime_type, file_size, alt_text, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200)

  const type = p.get("type")
  const status = p.get("status") ?? "ready"
  const q = p.get("q")
  if (type) query = query.eq("media_type", type)
  if (status !== "all") query = query.eq("status", status)
  if (q) query = query.ilike("filename", `%${q.replace(/[%_]/g, "")}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: "List failed" }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
