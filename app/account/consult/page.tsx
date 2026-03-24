import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { getUserMembershipTier } from "@/lib/membership"
import { ConsultClient } from "./consult-client"

export const metadata: Metadata = {
  title: "AI Gut Health Consultation — EatoBiotics",
  description: "Your personal EatoBiotics gut health advisor, powered by Claude.",
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
  let pastConsultations: Array<{ id: string; message_count: number; created_at: string }> = []

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

    const { data: consultData } = await adminSupabase
      .from("consultations")
      .select("id, message_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)

    pastConsultations = consultData ?? []
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <ConsultClient
        memberName={memberName}
        overallScore={overallScore}
        subScores={subScores}
        pastConsultations={pastConsultations}
      />
    </div>
  )
}
