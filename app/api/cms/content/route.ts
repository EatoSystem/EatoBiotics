import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit } from "@/lib/cms/audit"
import { isPhase1ContentType, BRANDS, AUDIENCES, PATHWAYS, FOUNDATIONS } from "@/lib/cms/taxonomy"
import { isAvailabilityStatus, slugify } from "@/lib/cms/statuses"

/* Content Studio — canonical content collection.
   POST creates a new item (always status "idea" or "draft" — never beyond).
   GET lists with filters. Admin-gated; cms_* tables only. */

const createSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content_type: z.string(),
  summary: z.string().trim().max(2000).optional(),
  body: z.string().max(400_000).optional(),
  status: z.enum(["idea", "draft"]).default("draft"),
  availability_status: z.string().default("our_direction"),
  brand: z.enum(BRANDS).nullish(),
  audience: z.enum(AUDIENCES).nullish(),
  pathway: z.enum(PATHWAYS).nullish(),
  foundation: z.enum(FOUNDATIONS).nullish(),
  country_code: z.string().trim().length(2).nullish(),
  language_code: z.string().trim().min(2).max(10).nullish(),
  source_content_id: z.string().uuid().nullish(),
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
  if (!isPhase1ContentType(input.content_type)) {
    return NextResponse.json({ error: "Content type not available yet" }, { status: 400 })
  }
  if (!isAvailabilityStatus(input.availability_status)) {
    return NextResponse.json({ error: "Invalid availability status" }, { status: 400 })
  }

  // Unique slug: base from title, suffixed on collision.
  const base = slugify(input.title)
  let slug = base
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data: existing } = await sb.from("cms_content").select("id").eq("slug", slug).maybeSingle()
    if (!existing) break
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
  }

  const { data, error } = await sb
    .from("cms_content")
    .insert({
      title: input.title,
      slug,
      content_type: input.content_type,
      summary: input.summary ?? null,
      body: input.body ?? null,
      status: input.status,
      availability_status: input.availability_status,
      brand: input.brand ?? null,
      audience: input.audience ?? null,
      pathway: input.pathway ?? null,
      foundation: input.foundation ?? null,
      country_code: input.country_code?.toUpperCase() ?? null,
      language_code: input.language_code ?? null,
      source_content_id: input.source_content_id ?? null,
    })
    .select("id, slug")
    .single()

  if (error || !data) {
    console.error("[cms/content] create failed:", error?.message)
    return NextResponse.json({ error: "Create failed" }, { status: 500 })
  }

  await recordCmsAudit(sb, "content_created", "cms_content", data.id as string, {
    content_type: input.content_type,
    title: input.title,
  })

  return NextResponse.json({ id: data.id, slug: data.slug }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const p = req.nextUrl.searchParams
  let query = sb
    .from("cms_content")
    .select("id, title, slug, content_type, status, availability_status, brand, pathway, updated_at")
    .order("updated_at", { ascending: false })
    .limit(100)

  const status = p.get("status")
  const type = p.get("type")
  const q = p.get("q")
  if (status) query = query.eq("status", status)
  if (type) query = query.eq("content_type", type)
  if (q) query = query.ilike("title", `%${q.replace(/[%_]/g, "")}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: "List failed" }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}
