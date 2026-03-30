import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { ConsultClient } from "./consult-client"

export const metadata: Metadata = {
  title: "AI Food System Consultation — EatoBiotics",
  description: "Your personal EatoBiotics food system consultant, powered by Claude.",
}

export default async function ConsultPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") {
    redirect("/pricing?feature=ai-consultation")
  }

  const adminSupabase = getSupabase()

  let overallScore: number | null = null
  let subScores: Record<string, number> | null = null
  let memberName: string | null = null
  let pastConsultations: Array<{ id: string; turn_count: number; created_at: string; summary: string | null }> = []
  let dailyCount = 0
  let monthlyCount = 0

  if (adminSupabase) {
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    memberName = profile?.name ?? null

    const { data: latestAssessment } = await adminSupabase
      .from("leads")
      .select("overall_score, sub_scores")
      .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (latestAssessment) {
      overallScore = latestAssessment.overall_score as number | null
      subScores    = latestAssessment.sub_scores as Record<string, number> | null
    }

    // Past consultation sessions with summaries
    const { data: consultData } = await adminSupabase
      .from("consultations")
      .select("id, turn_count, created_at, summary")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    pastConsultations = (consultData ?? []) as typeof pastConsultations

    // Daily count
    const today = new Date().toISOString().slice(0, 10)
    const { count: dc } = await adminSupabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("date", today)
    dailyCount = dc ?? 0

    // Monthly count
    const firstOfMonth = new Date()
    firstOfMonth.setUTCDate(1)
    firstOfMonth.setUTCHours(0, 0, 0, 0)
    const { count: mc } = await adminSupabase
      .from("consultations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("date", firstOfMonth.toISOString().slice(0, 10))
    monthlyCount = mc ?? 0
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><span className="text-sm text-muted-foreground">Loading advisor…</span></div>}>
        <ConsultClient
          memberName={memberName}
          overallScore={overallScore}
          subScores={subScores}
          pastConsultations={pastConsultations}
          dailyCount={dailyCount}
          monthlyCount={monthlyCount}
        />
      </Suspense>
    </div>
  )
}
