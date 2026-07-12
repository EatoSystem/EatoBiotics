import { CreateClient } from "./create-client"

/* Content Studio — "What are you creating?" The type picker + per-type
   metadata form live in the client component; creation posts to
   /api/cms/content (admin-gated) and redirects into the editor.
   searchParams optionally pre-fill the form — used by the "Create extract
   from this chapter" link on a chapter's editor page, which pre-links a new
   chapter_extract via source_content_id/book_id/chapter_id. */
interface Props {
  searchParams: Promise<{
    type?: string
    title?: string
    source_content_id?: string
    book_id?: string
    chapter_id?: string
  }>
}

export default async function CmsCreatePage({ searchParams }: Props) {
  const initial = await searchParams
  return <CreateClient initial={initial} />
}
