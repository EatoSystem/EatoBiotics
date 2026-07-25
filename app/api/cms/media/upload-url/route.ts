import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { deriveStorageKey, validateUpload } from "@/lib/cms/media"

/* Step 1 of a media upload: validate the DECLARED file (MIME allowlist + size
   cap) BEFORE any upload slot is granted, then mint a short-lived signed
   upload URL so the browser uploads bytes directly to the private cms-media
   bucket (never through this serverless function — video can be large). The
   storage key is derived server-side from the media kind + a server-issued
   id; the client's filename/path is never trusted. No DB row is created here
   — that happens on confirm (POST /api/cms/media), after the object exists. */

const schema = z.object({
  filename: z.string().trim().min(1).max(300),
  mime: z.string().trim().min(1).max(150),
  size: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof schema>
  try {
    input = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const validation = validateUpload({ mime: input.mime, size: input.size })
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const mediaId = randomUUID()
  const storagePath = deriveStorageKey(validation.mediaType, mediaId, input.mime)

  const { data, error } = await sb.storage.from("cms-media").createSignedUploadUrl(storagePath)
  if (error || !data) {
    console.error("[cms/media/upload-url] signed upload url failed:", error?.message)
    return NextResponse.json({ error: "Could not start upload" }, { status: 500 })
  }

  return NextResponse.json({
    mediaId,
    mediaType: validation.mediaType,
    storagePath: data.path,
    token: data.token,
  })
}
