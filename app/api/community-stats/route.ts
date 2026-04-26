import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"
export const revalidate = 3600

export async function GET() {
  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ mealsThisWeek: 0, activeStreakers: 0, totalAssessments: 0 })
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString()
  const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString()

  const { count: mealsThisWeek } = await adminSupabase
    .from("analyses")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo)

  const { data: recentAnalyses } = await adminSupabase
    .from("analyses")
    .select("user_id")
    .gte("created_at", threeDaysAgo)

  const activeStreakers = new Set((recentAnalyses ?? []).map((r: { user_id: string }) => r.user_id)).size

  const { count: totalAssessments } = await adminSupabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .not("overall_score", "is", null)

  return NextResponse.json({
    mealsThisWeek: mealsThisWeek ?? 0,
    activeStreakers,
    totalAssessments: totalAssessments ?? 0,
  })
}
