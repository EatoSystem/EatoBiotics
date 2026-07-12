import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { isPublicationTarget } from "@/lib/cms/taxonomy"
import { slugify } from "@/lib/cms/statuses"

/* Content Studio — a book's chapters. `id` is the book's cms_content id.
   GET lists the book's chapters in order. POST creates a chapter: a
   cms_content row (content_type 'book_chapter', book_id set for cheap
   filtered queries) plus its cms_chapters structural row (chapter_number,
   part, publication_target). Admin-gated; cms_* tables only. */

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  chapter_number: z.number().int().min(1).max(9999),
  part: z.string().trim().max(50).optional(),
  part_title: z.string().trim().max(200).optional(),
  publication_target: z.array(z.string()).default([]),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data: book } = await sb.from("cms_books").select("id").eq("content_id", id).maybeSingle()
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: chapters } = await sb
    .from("cms_chapters")
    .select("id, chapter_number, part, part_title, publication_target, cms_content(id, title, status, slug)")
    .eq("book_id", book.id)
    .order("chapter_number", { ascending: true })

  return NextResponse.json({ items: chapters ?? [] })
}

export async function POST(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof createSchema>
  try {
    input = createSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  if (!input.publication_target.every(isPublicationTarget)) {
    return NextResponse.json({ error: "Invalid publication target" }, { status: 400 })
  }

  const { data: book } = await sb.from("cms_books").select("id").eq("content_id", id).maybeSingle()
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Unique slug: base from title, suffixed on collision.
  const base = slugify(input.title)
  let slug = base
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: existing } = await sb.from("cms_content").select("id").eq("slug", slug).maybeSingle()
    if (!existing) break
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }

  const { data: content, error: contentError } = await sb
    .from("cms_content")
    .insert({ title: input.title, slug, content_type: "book_chapter", status: "draft", book_id: book.id })
    .select("id, slug")
    .single()

  if (contentError || !content) {
    console.error("[cms/books/chapters] content create failed:", contentError?.message)
    return NextResponse.json({ error: "Create failed" }, { status: 500 })
  }

  const { error: chapterError } = await sb.from("cms_chapters").insert({
    book_id: book.id,
    content_id: content.id,
    chapter_number: input.chapter_number,
    part: input.part ?? null,
    part_title: input.part_title ?? null,
    publication_target: input.publication_target,
  })

  if (chapterError) {
    console.error("[cms/books/chapters] chapters row create failed:", chapterError.message)
    // Best-effort cleanup of the orphaned content row.
    await sb.from("cms_content").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", content.id)
    return NextResponse.json({ error: "Create failed" }, { status: 500 })
  }

  await recordCmsAudit(sb, "content_created", "cms_content", content.id as string, {
    content_type: "book_chapter",
    book_id: book.id,
    chapter_number: input.chapter_number,
  })

  return NextResponse.json({ id: content.id, slug: content.slug }, { status: 201 })
}
