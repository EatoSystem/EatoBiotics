import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { computeStreak } from "@/lib/streak"
import { dailyNudge } from "@/lib/habit"
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
  let bioticsProfile: { prebiotic: number; probiotic: number; postbiotic: number } | null = null
  let score: number | null = null
  let todayMealCount = 0
  let streakRows: string[] = []
  const glp1 = { active: false, proteinToday: null as number | null, proteinTarget: null as number | null }
  const stability = { active: false, loggedToday: false, eventsToday: 0, stabilityScore: null as number | null }

  if (sb) {
    const startOfTodayIso = `${today}T00:00:00.000Z`
    const [
      profileRes, bioticsRes, leadRes, todayCountRes, streakRes,
      glp1ProfRes, glp1TodayRes, stabAssessRes, stabTodayRes, stabCountRes,
    ] = await Promise.all([
      sb.from("profiles").select("name").eq("id", user.id).single(),
      sb.from("analyses").select("prebiotic_score, probiotic_score, postbiotic_score").eq("user_id", user.id).not("biotics_score", "is", null).order("created_at", { ascending: false }).limit(5),
      sb.from("leads").select("overall_score").or(`email.eq.${user.email!},user_id.eq.${user.id}`).not("overall_score", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      sb.from("analyses").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", startOfTodayIso),
      sb.from("analyses").select("created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      sb.from("glp1_profile").select("user_id").eq("user_id", user.id).maybeSingle(),
      sb.from("glp1_logs").select("protein_grams, protein_target").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      sb.from("stability_assessments").select("score").eq("user_id", user.id).maybeSingle(),
      sb.from("stability_logs").select("data").eq("user_id", user.id).eq("log_date", today).maybeSingle(),
      sb.from("stability_logs").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ])

    name = (profileRes.data?.name as string | null) ?? null

    const rows = (bioticsRes.data ?? []).filter((a) => a.prebiotic_score != null && a.probiotic_score != null && a.postbiotic_score != null)
    if (rows.length) {
      const avg = (k: string) => Math.round(rows.reduce((s: number, a: Record<string, unknown>) => s + ((a[k] as number) ?? 0), 0) / rows.length)
      bioticsProfile = { prebiotic: avg("prebiotic_score"), probiotic: avg("probiotic_score"), postbiotic: avg("postbiotic_score") }
    }

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
  const dailyLoop: DailyLoopData = {
    streak: streakInfo,
    focus: bioticsProfile
      ? (() => {
          const n = dailyNudge({ prebiotics: bioticsProfile.prebiotic, probiotics: bioticsProfile.probiotic, postbiotics: bioticsProfile.postbiotic })
          return { key: n.pillar.key, color: n.pillar.color, score: n.score }
        })()
      : null,
  }

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
