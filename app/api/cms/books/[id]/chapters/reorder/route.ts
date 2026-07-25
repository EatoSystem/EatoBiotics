import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { reorderPair, type OrderableChapter } from "@/lib/cms/chapter-order"

/* Content Studio — atomic chapter reorder. `id` is the book's cms_content id.
   Replaces the old two-request client swap (PATCH chapter A, then PATCH
   chapter B — a mid-way failure left a duplicate/gap). The client now sends a
   single { chapter_id, direction } and the swap runs in ONE transaction
   (cms_swap_chapter_order, Migration 40): all-or-nothing, so a failure leaves
   the ordering unchanged. Neighbours are chosen among the book's ACTIVE
   chapters only (archived rows never participate). Admin-gated; cms_* only. */

const reorderSchema = z.object({
  chapter_id: z.string().uuid(),
  direction: z.union([z.literal(-1), z.literal(1)]),
})

type Params = { params: Promise<{ id: string }> }

type ChapterStatusRow = {
  id: string
  chapter_number: number
  created_at: string | null
  cms_content: { status?: string | null } | { status?: string | null }[] | null
}
function toOrderable(rows: ChapterStatusRow[] | null): OrderableChapter[] {
  return (rows ?? []).map((r) => {
    const content = Array.isArray(r.cms_content) ? r.cms_content[0] : r.cms_content
    return {
      id: r.id,
      chapter_number: r.chapter_number,
      created_at: r.created_at,
      status: content?.status ?? null,
    }
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  let input: z.infer<typeof reorderSchema>
  try {
    input = reorderSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { data: book } = await sb.from("cms_books").select("id").eq("content_id", id).maybeSingle()
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: rows } = await sb
    .from("cms_chapters")
    .select("id, chapter_number, created_at, cms_content(status)")
    .eq("book_id", book.id)

  const pair = reorderPair(toOrderable(rows), input.chapter_id, input.direction)
  if (!pair) return NextResponse.json({ error: "Cannot move" }, { status: 400 })

  // One atomic swap. If it errors the transaction rolled back — ordering is
  // untouched — so we surface a failure and change nothing else.
  const { error } = await sb.rpc("cms_swap_chapter_order", { a_id: pair.a, b_id: pair.b })
  if (error) {
    console.error("[cms/chapters/reorder] swap failed:", error.message)
    return NextResponse.json({ error: "Reorder failed" }, { status: 500 })
  }

  await recordCmsAudit(sb, "chapters_reordered", "cms_books", book.id as string, {
    chapter_id: input.chapter_id,
    direction: input.direction,
  })

  return NextResponse.json({ ok: true })
}
