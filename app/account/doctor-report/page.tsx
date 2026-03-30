import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { DoctorReportClient } from "./doctor-report-client"

export const metadata: Metadata = {
  title: "Food System Health Report — EatoBiotics",
  description: "A structured health summary for your doctor, nutritionist, or healthcare provider.",
}

export default async function DoctorReportPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (tier !== "transform") redirect("/pricing?feature=doctor-report")

  const adminSupabase = getSupabase()
  let profileData = null
  let latestAssessment = null
  let consultSummaries: string[] = []

  if (adminSupabase) {
    const { data: p } = await adminSupabase
      .from("profiles")
      .select("name, health_goals")
      .eq("id", user.id)
      .single()
    profileData = p

    const { data: la } = await adminSupabase
      .from("leads")
      .select("overall_score, sub_scores, created_at")
      .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    latestAssessment = la

    const { data: cs } = await adminSupabase
      .from("consultations")
      .select("summary")
      .eq("user_id", user.id)
      .not("summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(3)
    consultSummaries = (cs ?? []).map((c) => c.summary as string)
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <DoctorReportClient
        memberName={(profileData?.name as string | null) ?? null}
        healthGoals={(profileData?.health_goals as string[] | null) ?? []}
        overallScore={(latestAssessment?.overall_score as number | null) ?? null}
        subScores={(latestAssessment?.sub_scores as Record<string, number> | null) ?? null}
        assessmentDate={(latestAssessment?.created_at as string | null) ?? null}
        consultSummaries={consultSummaries}
      />
    </div>
  )
}
