import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { isPublicationTarget } from "@/lib/cms/taxonomy"
import { activeChapterNumbers, type OrderableChapter } from "@/lib/cms/chapter-order"

type ChapterStatusRow = {
  id: string
  chapter_number: number
  cms_content: { status?: string | null } | { status?: string | null }[] | null
}
function toOrderable(rows: ChapterStatusRow[] | null): OrderableChapter[] {
  return (rows ?? []).map((r) => {
    const content = Array.isArray(r.cms_content) ? r.cms_content[0] : r.cms_content
    return { id: r.id, chapter_number: r.chapter_number, status: content?.status ?? null }
  })
}

/* Content Studio — a single chapter's structural row. `id` is the
   cms_chapters id (distinct from the chapter's own cms_content id — the
   chapter's title/summary/body/status are edited via the normal
   /api/cms/content/[id] route since a chapter IS a cms_content row; this
   route only covers the fields specific to cms_chapters). Admin-gated;
   cms_* tables only. */

const patchSchema = z.object({
  chapter_number: z.number().int().min(1).max(9999).optional(),
  part: z.string().trim().max(50).nullish(),
  part_title: z.string().trim().max(200).nullish(),
  publication_target: z.array(z.string()).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data } = await sb
    .from("cms_chapters")
    .select("id, book_id, content_id, chapter_number, part, part_title, publication_target, cms_content(id, title, status, slug)")
    .eq("id", id)
    .maybeSingle()
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ item: data })
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
  if (input.publication_target !== undefined && !input.publication_target.every(isPublicationTarget)) {
    return NextResponse.json({ error: "Invalid publication target" }, { status: 400 })
  }

  const { data: current } = await sb.from("cms_chapters").select("id, book_id").eq("id", id).maybeSingle()
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // If the chapter_number is changing, reject a value already used by another
  // ACTIVE chapter of the same book (archived chapters free their number).
  if (input.chapter_number !== undefined) {
    const { data: siblings } = await sb
      .from("cms_chapters")
      .select("id, chapter_number, cms_content(status)")
      .eq("book_id", current.book_id)
    if (activeChapterNumbers(toOrderable(siblings), id).includes(input.chapter_number)) {
      return NextResponse.json({ error: "Chapter number already in use" }, { status: 409 })
    }
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  const edited: string[] = []
  for (const key of ["chapter_number", "part", "part_title", "publication_target"] as const) {
    if (input[key] !== undefined) {
      update[key] = input[key]
      edited.push(key)
    }
  }

  const { error } = await sb.from("cms_chapters").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  if (edited.length > 0) {
    await recordCmsAudit(sb, "chapter_updated", "cms_chapters", id, { fields: edited })
  }
  return NextResponse.json({ ok: true })
}
