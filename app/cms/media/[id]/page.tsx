import { notFound } from "next/navigation"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase"
import { MediaDetailClient, type MediaDetail } from "./media-detail-client"

const SIGNED_URL_TTL_SECONDS = 5 * 60

interface Props {
  params: Promise<{ id: string }>
}

/* Media asset detail: preview via a fresh short-TTL signed URL (private
   bucket), editable metadata + provenance, and where the asset is used.
   Server component, post-gate, cms_* tables only. */
export default async function CmsMediaDetailPage({ params }: Props) {
  const { id } = await params
  const sb = getSupabase()
  if (!sb) return <p className="text-sm text-muted-foreground">Supabase not configured.</p>

  const { data: media } = await sb.from("cms_media").select("*").eq("id", id).maybeSingle()
  if (!media) notFound()

  const { data: signed } = await sb.storage
    .from((media.storage_bucket as string) || "cms-media")
    .createSignedUrl(media.storage_path as string, SIGNED_URL_TTL_SECONDS)

  const { data: usage } = await sb
    .from("cms_content_media")
    .select("content_id, role, cms_content(title, status)")
    .eq("media_id", id)

  const detail: MediaDetail = {
    id: media.id as string,
    filename: media.filename as string,
    media_type: media.media_type as string,
    mime_type: media.mime_type as string,
    file_size: (media.file_size as number | null) ?? null,
    status: media.status as string,
    alt_text: (media.alt_text as string | null) ?? "",
    caption: (media.caption as string | null) ?? "",
    generation_prompt: (media.generation_prompt as string | null) ?? "",
    source: (media.source as string | null) ?? "",
    copyright_owner: (media.copyright_owner as string | null) ?? "",
    licence: (media.licence as string | null) ?? "",
    usage_restrictions: (media.usage_restrictions as string | null) ?? "",
  }

  type RawUsage = { content_id: string; role: string; cms_content: { title: string; status: string } | { title: string; status: string }[] | null }
  const usageRows = ((usage ?? []) as unknown as RawUsage[]).map((u) => {
    const c = Array.isArray(u.cms_content) ? u.cms_content[0] ?? null : u.cms_content
    return { content_id: u.content_id, role: u.role, cms_content: c }
  })

  return (
    <div className="space-y-6">
      <Link href="/cms/media" className="text-sm text-muted-foreground hover:text-foreground">← Media library</Link>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Preview */}
        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">Preview</h2>
          <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--icon-green) 5%, transparent)" }}>
            {media.media_type === "image" && signed?.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={signed.signedUrl} alt={detail.alt_text || detail.filename} className="max-h-[360px] max-w-full rounded-lg object-contain" />
            ) : (
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">{detail.filename}</p>
                <p className="mt-1 text-xs text-muted-foreground">{detail.media_type} · {detail.mime_type}</p>
                {signed?.signedUrl && (
                  <a
                    href={signed.signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex rounded-full border border-icon-green/30 bg-icon-green/5 px-5 py-2 text-sm font-semibold text-icon-green"
                  >
                    Open {detail.media_type}
                  </a>
                )}
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Preview link expires in 5 minutes (private asset).</p>
        </section>

        {/* Metadata + provenance form */}
        <MediaDetailClient detail={detail} />
      </div>

      {/* Usage */}
      <section className="rounded-2xl border border-border p-5">
        <h2 className="font-serif text-lg font-semibold text-foreground">Used by</h2>
        {usageRows.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Not attached to any content yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {usageRows.map((u) => (
              <li key={`${u.content_id}-${u.role}`} className="flex items-center justify-between gap-3 py-2.5">
                <Link href={`/cms/library/${u.content_id}`} className="text-sm font-semibold text-foreground hover:text-icon-green">
                  {u.cms_content?.title ?? "Untitled"}
                </Link>
                <span className="text-xs text-muted-foreground">{u.role} · {u.cms_content?.status ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
