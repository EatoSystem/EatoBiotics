import { notFound } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { compileMDX } from "next-mdx-remote/rsc"
import { timeAgo } from "@/app/admin/admin-ui"
import { readingTimeMinutes, wordCount } from "@/lib/cms/statuses"
import { EditorClient } from "./editor-client"

/* Content Studio editor page. The server component owns the record, the
   version list, and a rendered preview of the LAST SAVED body (via the site's
   existing MDX pipeline); the client editor edits + saves, then refreshes.
   Post-gate, cms_* tables only. */

interface Props {
  params: Promise<{ id: string }>
}

async function SavedPreview({ body }: { body: string }) {
  // AWAIT compileMDX inside the try so malformed MDX (free-text Markdown is
  // frequently invalid MDX — `<3`, `{braces}`, unclosed `<tag`) is caught here
  // and degrades to a fallback, instead of throwing during React's later async
  // render of <MDXRemote>. A route-level error.tsx is the belt-and-suspenders.
  try {
    const { content } = await compileMDX({ source: body })
    return (
      <div className="prose prose-sm max-w-none font-serif [&_h1]:font-serif [&_h2]:font-serif">
        {content}
      </div>
    )
  } catch {
    return (
      <p className="text-xs text-red-500">
        Preview unavailable — this isn&apos;t valid MDX yet. Your text is saved and safe to keep editing.
      </p>
    )
  }
}

export default async function CmsEditorPage({ params }: Props) {
  const { id } = await params
  const sb = getSupabase()
  if (!sb) return <p className="text-sm text-muted-foreground">Supabase not configured.</p>

  const [{ data: item }, { data: versions }] = await Promise.all([
    sb.from("cms_content").select("*").eq("id", id).maybeSingle(),
    sb
      .from("cms_content_versions")
      .select("id, version_number, change_note, created_at")
      .eq("content_id", id)
      .order("version_number", { ascending: false })
      .limit(20),
  ])
  if (!item) notFound()

  const body = (item.body as string | null) ?? ""
  const words = wordCount(body)

  return (
    <div className="space-y-6">
      <EditorClient
        item={{
          id: item.id as string,
          title: item.title as string,
          summary: (item.summary as string | null) ?? "",
          body,
          content_type: item.content_type as string,
          status: item.status as string,
          availability_status: item.availability_status as string,
          brand: (item.brand as string | null) ?? "",
          audience: (item.audience as string | null) ?? "",
          pathway: (item.pathway as string | null) ?? "",
          foundation: (item.foundation as string | null) ?? "",
        }}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-semibold text-foreground">Preview (last saved)</h2>
            <p className="text-xs text-muted-foreground">
              {words} words · {readingTimeMinutes(body)} min read
            </p>
          </div>
          <div className="mt-4">
            {body.trim() ? (
              <SavedPreview body={body} />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing saved yet — write in the editor and save.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border p-5">
          <h2 className="font-serif text-lg font-semibold text-foreground">Version history</h2>
          {(versions ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No versions yet — &ldquo;Save version&rdquo; snapshots the current saved state.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {(versions ?? []).map((v) => (
                <li key={v.id as string} className="py-2.5">
                  <p className="text-sm font-semibold text-foreground">v{v.version_number as number}</p>
                  <p className="text-xs text-muted-foreground">
                    {timeAgo(v.created_at as string)}
                    {v.change_note ? ` — ${v.change_note as string}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
