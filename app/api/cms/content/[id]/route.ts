import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSupabase } from "@/lib/supabase"
import { requireCmsAdmin } from "@/lib/cms/auth"
import { recordCmsAudit, type CmsAuditAction } from "@/lib/cms/audit"
import { BRANDS, AUDIENCES, PATHWAYS, FOUNDATIONS } from "@/lib/cms/taxonomy"
import {
  canTransition, isAvailabilityStatus, isContentStatus, PHASE1_SETTABLE,
  type ContentStatus,
} from "@/lib/cms/statuses"

/* Content Studio — single content item.
   PATCH saves edits (bumping updated_at) and/or performs a guarded status
   transition. Approval is an explicit transition to "approved" — the only
   path towards any future publishing state. DELETE archives (no hard delete).
   Admin-gated; cms_* tables only. */

const patchSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  summary: z.string().trim().max(2000).nullish(),
  body: z.string().max(400_000).nullish(),
  availability_status: z.string().optional(),
  brand: z.enum(BRANDS).nullish(),
  audience: z.enum(AUDIENCES).nullish(),
  pathway: z.enum(PATHWAYS).nullish(),
  foundation: z.enum(FOUNDATIONS).nullish(),
  country_code: z.string().trim().length(2).nullish(),
  language_code: z.string().trim().min(2).max(10).nullish(),
  status: z.string().optional(),
  change_note: z.string().trim().max(500).optional(),
})

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data } = await sb.from("cms_content").select("*").eq("id", id).maybeSingle()
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

  const { data: current } = await sb
    .from("cms_content")
    .select("id, status, title, summary, body")
    .eq("id", id)
    .maybeSingle()
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString(), updated_by: "admin" }
  const edited: string[] = []
  for (const key of ["title", "summary", "body", "brand", "audience", "pathway", "foundation", "language_code"] as const) {
    if (key in input && input[key] !== undefined) {
      update[key] = input[key]
      edited.push(key)
    }
  }
  if (input.country_code !== undefined) {
    update.country_code = input.country_code ? input.country_code.toUpperCase() : null
    edited.push("country_code")
  }
  if (input.availability_status !== undefined) {
    if (!isAvailabilityStatus(input.availability_status)) {
      return NextResponse.json({ error: "Invalid availability status" }, { status: 400 })
    }
    update.availability_status = input.availability_status
    edited.push("availability_status")
  }

  // Guarded status transition (separate from content edits, same request allowed).
  let transition: { from: ContentStatus; to: ContentStatus } | null = null
  if (input.status !== undefined) {
    if (!isContentStatus(input.status) || !PHASE1_SETTABLE.includes(input.status)) {
      return NextResponse.json({ error: "Status not settable" }, { status: 400 })
    }
    const from = current.status as ContentStatus
    if (input.status !== from) {
      if (!canTransition(from, input.status)) {
        return NextResponse.json({ error: `Cannot move ${from} → ${input.status}` }, { status: 409 })
      }
      transition = { from, to: input.status }
      update.status = input.status
      if (input.status === "approved") {
        update.approved_by = "admin"
      }
      if (input.status === "archived") {
        update.archived_at = new Date().toISOString()
      }
    }
  }

  const { error } = await sb.from("cms_content").update(update).eq("id", id)
  if (error) {
    console.error("[cms/content] update failed:", error.message)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  if (edited.length > 0) {
    await recordCmsAudit(sb, "content_updated", "cms_content", id, { fields: edited })
  }
  if (transition) {
    const action: CmsAuditAction =
      transition.to === "approved" ? "content_approved"
      : transition.to === "changes_requested" ? "changes_requested"
      : transition.to === "archived" ? "content_archived"
      : "status_changed"
    await recordCmsAudit(sb, action, "cms_content", id, transition)
  }

  return NextResponse.json({ ok: true, status: transition?.to ?? current.status })
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const denied = requireCmsAdmin(req)
  if (denied) return denied
  const { id } = await params

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const { data: current } = await sb.from("cms_content").select("id, status").eq("id", id).maybeSingle()
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Archive, never hard-delete (published history must stay traceable).
  const { error } = await sb
    .from("cms_content")
    .update({ status: "archived", archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id)
  if (error) return NextResponse.json({ error: "Archive failed" }, { status: 500 })

  await recordCmsAudit(sb, "content_archived", "cms_content", id, { from: current.status })
  return NextResponse.json({ ok: true })
}
