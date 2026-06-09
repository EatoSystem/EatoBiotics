import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { canAccess, getUserMembershipTier } from "@/lib/membership"

const bodySchema = z.object({
  log_date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // defaults to today (UTC)
  protein_grams:    z.number().int().min(0).max(500).nullable().optional(),
  protein_target:   z.number().int().min(0).max(500).nullable().optional(),
  weight_kg:        z.number().min(20).max(400).nullable().optional(),
  strength_session: z.boolean().optional(),
  notes:            z.string().max(500).nullable().optional(),
  side_effects:     z.array(z.string().max(40)).max(10).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // Tier gate — the in-app tracker is a paid (Restore+) feature.
  const tier = await getUserMembershipTier(user.id)
  if (!canAccess(tier, "glp1_companion")) {
    return NextResponse.json({ error: "Upgrade required" }, { status: 403 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
  }

  const log_date = body.log_date ?? new Date().toISOString().slice(0, 10)

  const { data, error } = await adminSupabase
    .from("glp1_logs")
    .upsert(
      {
        user_id:          user.id,
        log_date,
        protein_grams:    body.protein_grams ?? null,
        protein_target:   body.protein_target ?? null,
        weight_kg:        body.weight_kg ?? null,
        strength_session: body.strength_session ?? false,
        notes:            body.notes ?? null,
        side_effects:     body.side_effects && body.side_effects.length ? body.side_effects : null,
        updated_at:       new Date().toISOString(),
      },
      { onConflict: "user_id,log_date" },
    )
    .select()
    .single()

  if (error) {
    console.error("[glp1/log]", error.message)
    return NextResponse.json({ error: "Could not save log" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, log: data })
}
