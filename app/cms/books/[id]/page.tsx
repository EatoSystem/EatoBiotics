import { notFound } from "next/navigation"
import { getSupabase } from "@/lib/supabase"
import { EditorClient } from "@/app/cms/library/[id]/editor-client"
import { BookChaptersPanel } from "./book-chapters-panel"

/* Content Studio — book detail. A book is a cms_content row, so its own
   title/summary/body/status reuse the existing EditorClient unchanged.
   BookChaptersPanel adds the book-specific pieces: subtitle (the one
   cms_books-only field) and the ordered chapter list. Post-gate,
   cms_* tables only. */

interface Props {
  params: Promise<{ id: string }>
}

export default async function CmsBookPage({ params }: Props) {
  const { id } = await params
  const sb = getSupabase()
  if (!sb) return <p className="text-sm text-muted-foreground">Supabase not configured.</p>

  const { data: item } = await sb
    .from("cms_content")
    .select("*")
    .eq("id", id)
    .eq("content_type", "book")
    .maybeSingle()
  if (!item) notFound()

  const { data: book } = await sb.from("cms_books").select("id, subtitle").eq("content_id", id).maybeSingle()
  if (!book) notFound()

  const { data: chapters } = await sb
    .from("cms_chapters")
    .select("id, chapter_number, part, part_title, publication_target, created_at, cms_content(id, title, status, slug)")
    .eq("book_id", book.id)
    .order("chapter_number", { ascending: true })
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })

  return (
    <div className="space-y-6">
      <EditorClient
        item={{
          id: item.id as string,
          title: item.title as string,
          summary: (item.summary as string | null) ?? "",
          body: (item.body as string | null) ?? "",
          content_type: item.content_type as string,
          status: item.status as string,
          availability_status: item.availability_status as string,
          brand: (item.brand as string | null) ?? "",
          audience: (item.audience as string | null) ?? "",
          pathway: (item.pathway as string | null) ?? "",
          foundation: (item.foundation as string | null) ?? "",
        }}
      />

      <BookChaptersPanel
        bookContentId={id}
        subtitle={(book.subtitle as string | null) ?? ""}
        chapters={(chapters ?? []).map((c) => {
          const content = Array.isArray(c.cms_content) ? c.cms_content[0] : c.cms_content
          return {
            id: c.id as string,
            chapter_number: c.chapter_number as number,
            part: (c.part as string | null) ?? "",
            part_title: (c.part_title as string | null) ?? "",
            publication_target: (c.publication_target as string[]) ?? [],
            content_id: content?.id ?? "",
            title: content?.title ?? "(untitled)",
            status: content?.status ?? "draft",
          }
        })}
      />
    </div>
  )
}
