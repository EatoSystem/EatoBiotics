import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { canAccess, getUserMembershipTier } from "@/lib/membership"

const bodySchema = z.object({
  medication:      z.enum(["ozempic", "wegovy", "mounjaro", "other", "not_started"]).nullable().optional(),
  start_weight_kg: z.number().min(20).max(400).nullable().optional(),
  goal_weight_kg:  z.number().min(20).max(400).nullable().optional(),
  started_at:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // Tier gate — the GLP-1 Companion is a paid (Restore+/member) feature.
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

  const { data, error } = await adminSupabase
    .from("glp1_profile")
    .upsert(
      {
        user_id:         user.id,
        medication:      body.medication ?? null,
        start_weight_kg: body.start_weight_kg ?? null,
        goal_weight_kg:  body.goal_weight_kg ?? null,
        started_at:      body.started_at ?? null,
        updated_at:      new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select("medication, start_weight_kg, goal_weight_kg, started_at")
    .single()

  if (error) {
    console.error("[glp1/profile]", error.message)
    return NextResponse.json({ error: "Could not save profile" }, { status: 500 })
  }

  return NextResponse.json({ ok: true, profile: data })
}
