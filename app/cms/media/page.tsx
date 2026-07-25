import { getSupabase } from "@/lib/supabase"
import { MediaLibraryClient, type MediaRow } from "./media-client"

/* Content Studio media library. Server component fetches the catalogue
   post-gate (cms_* tables only); the client handles upload + filtering. */
interface Props {
  searchParams: Promise<{ type?: string; status?: string; q?: string }>
}

export default async function CmsMediaPage({ searchParams }: Props) {
  const { type, status, q } = await searchParams
  const sb = getSupabase()
  if (!sb) return <p className="text-sm text-muted-foreground">Supabase not configured.</p>

  let query = sb
    .from("cms_media")
    .select("id, filename, media_type, mime_type, file_size, alt_text, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200)
  if (type) query = query.eq("media_type", type)
  const effectiveStatus = status ?? "ready"
  if (effectiveStatus !== "all") query = query.eq("status", effectiveStatus)
  if (q) query = query.ilike("filename", `%${q.replace(/[%_]/g, "")}%`)

  const { data } = await query
  const items = (data ?? []) as MediaRow[]

  return (
    <MediaLibraryClient
      items={items}
      filters={{ type: type ?? "", status: effectiveStatus, q: q ?? "" }}
    />
  )
}
