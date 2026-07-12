import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { slugify } from "@/lib/cms/statuses"

/* Content Studio — books collection. A book is a cms_content row
   (content_type 'book') plus a thin cms_books row for the one field
   (subtitle) that doesn't fit cms_content's generic shape. POST creates
   both, rolling the content row back on partial failure. GET lists books
   joined to their cms_books row. Admin-gated; cms_* tables only. */

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  subtitle: z.string().trim().max(300).optional(),
  summary: z.string().trim().max(2000).optional(),
})

export async function POST(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof createSchema>
  try {
    input = createSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

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
    .insert({
      title: input.title,
      slug,
      content_type: "book",
      summary: input.summary ?? null,
      status: "draft",
    })
    .select("id, slug")
    .single()

  if (contentError || !content) {
    console.error("[cms/books] content create failed:", contentError?.message)
    return NextResponse.json({ error: "Create failed" }, { status: 500 })
  }

  const { data: book, error: bookError } = await sb
    .from("cms_books")
    .insert({ content_id: content.id, subtitle: input.subtitle ?? null })
    .select("id")
    .single()

  if (bookError || !book) {
    console.error("[cms/books] books row create failed:", bookError?.message)
    // Best-effort cleanup of the orphaned content row.
    await sb.from("cms_content").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", content.id)
    return NextResponse.json({ error: "Create failed" }, { status: 500 })
  }

  await recordCmsAudit(sb, "content_created", "cms_content", content.id as string, {
    content_type: "book",
    title: input.title,
  })

  return NextResponse.json({ id: content.id, slug: content.slug }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data, error } = await sb
    .from("cms_content")
    .select("id, title, slug, status, updated_at, cms_books(id, subtitle)")
    .eq("content_type", "book")
    .order("updated_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: "List failed" }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
