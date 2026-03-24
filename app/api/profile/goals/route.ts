import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"

const ALLOWED_GOALS = [
  "Digestive health and IBS management",
  "Immune system support",
  "Energy and fatigue reduction",
  "Mood and mental clarity",
  "Weight management",
  "Sleep improvement",
  "Skin health",
  "General gut health maintenance",
] as const

const bodySchema = z.object({
  goals: z
    .array(z.enum(ALLOWED_GOALS))
    .max(8),
})

export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "restore" && tier !== "transform") {
    return NextResponse.json(
      { error: "Health goals require a Restore or Transform membership" },
      { status: 403 }
    )
  }

  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const { error } = await supabase
    .from("profiles")
    .update({ health_goals: body.goals })
    .eq("id", user.id)

  if (error) {
    console.error("[goals] update error:", error)
    return NextResponse.json({ error: "Failed to save goals" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
