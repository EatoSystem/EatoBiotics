import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"
import { computeStreak } from "@/lib/streak"
import type { DailyLoopData } from "@/components/account/daily-loop-card"
import { TodayClient } from "@/components/account/today-client"

export const metadata: Metadata = {
  title: "Today — EatoBiotics",
  robots: { index: false, follow: false },
}

const todayKey = () => new Date().toISOString().slice(0, 10)

export default async function TodayPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const sb = getSupabase()
  const today = todayKey()

  let name: string | null = null
  /*
   * 0R-5 · `bioticsProfile` is gone from this route. Its ONLY consumer was the
   * `dailyNudge` weakest-Biotic focus, and the query that fed it goes with it:
   * a route that still averaged the member's per-Biotic columns for no reader
   * would be collecting exactly what the construct needed to come back.
   */
  let score: number | null = null
  let todayMealCount = 0
  let streakRows: string[] = []
  const glp1 = { active: false, proteinToday: null as number | null, proteinTarget: null as number | null }
  const stability = { active: false, loggedToday: false, eventsToday: 0, stabilityScore: null as number | null }

  if (sb) {
    const startOfTodayIso = `${today}T00:00:00.000Z`
    const [
      profileRes, leadRes, todayCountRes, streakRes,
      glp1ProfRes, glp1TodayRes, stabAssessRes, stabTodayRes, stabCountRes,
    ] = await Promise.all([
      sb.from("profiles").select("name").eq("id", user.id).single(),
      sb.from("leads").select("overall_score").or(ownerOrFilter(user.id, user.email)).not("overall_score", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfTodayIso),
      sb.from("analyses").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      sb.from("glp1_profile").select("user_id").eq("user_id", user.id).maybeSingle(),
      sb.from("glp1_logs").select("protein_grams, protein_target").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      sb.from("stability_assessments").select("score").eq("user_id", user.id).maybeSingle(),
      sb.from("stability_logs").select("data").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      sb.from("stability_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ])

    name = (profileRes.data?.name as string | null) ?? null

    score = (leadRes.data?.overall_score as number | null) ?? null
    todayMealCount = todayCountRes.count ?? 0
    streakRows = (streakRes.data ?? []).map((r) => r.created_at as string)

    glp1.active = !!glp1ProfRes.data
    if (glp1TodayRes.data) {
      glp1.proteinToday = (glp1TodayRes.data.protein_grams as number | null) ?? null
      glp1.proteinTarget = (glp1TodayRes.data.protein_target as number | null) ?? null
    }

    const stabScore = stabAssessRes.data?.score as { totalScore?: number } | null
    stability.stabilityScore = stabScore?.totalScore ?? null
    stability.active = !!stabAssessRes.data || (stabCountRes.count ?? 0) > 0
    if (stabTodayRes.data) {
      stability.loggedToday = true
      const data = stabTodayRes.data.data as { events?: unknown[] } | null
      stability.eventsToday = Array.isArray(data?.events) ? data.events.length : 0
    }
  }

  const streakInfo = computeStreak(streakRows)
  // 0R-5 · the weakest-Biotic `focus` nudge is gone from `DailyLoopData`.
  // This route is POST_V1-refused, but it is the second producer of the same
  // construct and repairing only the live one would leave it waiting here.
  const dailyLoop: DailyLoopData = { streak: streakInfo }

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      <TodayClient
        firstName={name ? name.split(" ")[0] : null}
        dailyLoop={dailyLoop}
        todayMealCount={todayMealCount}
        score={score}
        glp1={glp1}
        stability={stability}
      />
    </div>
  )
}
