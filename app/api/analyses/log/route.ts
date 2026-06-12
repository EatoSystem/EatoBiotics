import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { logServerEvent } from "@/lib/statsig-server"

const bodySchema = z.object({
  biotics_score:    z.number().int().min(0).max(100).optional(),
  meal_description: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ ok: true }) // non-fatal if DB not configured
  }

  const tier = await getUserMembershipTier(user.id)

  // Detect the activation moment: is this the user's first logged analysis?
  const { count: priorCount } = await adminSupabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const { error } = await adminSupabase.from("analyses").insert({
    user_id:                  user.id,
    biotics_score:            body.biotics_score ?? null,
    meal_description:         body.meal_description ?? null,
    tier_at_time_of_analysis: tier,
  })

  if (error) {
    console.error("[analyses/log]", error.message)
  } else {
    const meta = {
      tier,
      has_score: String(body.biotics_score != null),
    }
    await logServerEvent("meal_logged", user.id, meta)
    if ((priorCount ?? 0) === 0) {
      await logServerEvent("first_meal_logged", user.id, meta)
    }
  }

  return NextResponse.json({ ok: true })
}
