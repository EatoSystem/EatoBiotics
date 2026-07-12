import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"

/* Content Studio — single book. `id` is the book's cms_content id (books are
   addressed the same way as any other content item; cms_books is looked up
   by content_id). GET returns the content row + cms_books row + its ordered
   chapters. PATCH edits the subtitle (the one cms_books-only field). DELETE
   archives the book's content row — chapters are NOT cascade-archived, a
   documented limitation, not an oversight. Admin-gated; cms_* tables only. */

const patchSchema = z.object({
  subtitle: z.string().trim().max(300).nullish(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data: content } = await sb
    .from("cms_content")
    .select("*")
    .eq("id", id)
    .eq("content_type", "book")
    .maybeSingle()
  if (!content) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: book } = await sb.from("cms_books").select("id, subtitle").eq("content_id", id).maybeSingle()
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: chapters } = await sb
    .from("cms_chapters")
    .select("id, chapter_number, part, part_title, publication_target, cms_content(id, title, status, slug)")
    .eq("book_id", book.id)
    .order("chapter_number", { ascending: true })

  return NextResponse.json({ item: content, book, chapters: chapters ?? [] })
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

  const { data: book } = await sb.from("cms_books").select("id").eq("content_id", id).maybeSingle()
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { error } = await sb
    .from("cms_books")
    .update({ subtitle: input.subtitle ?? null, updated_at: new Date().toISOString() })
    .eq("id", book.id)
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  await recordCmsAudit(sb, "content_updated", "cms_books", book.id as string, { fields: ["subtitle"] })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data: current } = await sb
    .from("cms_content")
    .select("id, status")
    .eq("id", id)
    .eq("content_type", "book")
    .maybeSingle()
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Archive, never hard-delete. Chapters are intentionally left as-is.
  const { error } = await sb
    .from("cms_content")
    .update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: "Archive failed" }, { status: 500 })

  await recordCmsAudit(sb, "content_archived", "cms_content", id, { from: current.status, content_type: "book" })
  return NextResponse.json({ ok: true })
}
