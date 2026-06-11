import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { canAccess, getUserMembershipTier } from "@/lib/membership"
import { computeReport } from "@/lib/stability/insights"
import type { StabilityAssessment, StabilityDailyLog, StabilityReportData } from "@/lib/stability/types"
import { DoctorReportClient, type ClinicianReportData } from "./doctor-report-client"

export const metadata: Metadata = {
  title: "Food System Health Report — EatoBiotics",
  description: "A structured health summary for your doctor, nutritionist, or healthcare provider.",
}

export default async function DoctorReportPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const tier = await getUserMembershipTier(user.id)
  if (!canAccess(tier, "pdf_reports")) redirect("/pricing?feature=doctor-report")

  const sb = getSupabase()

  const data: ClinicianReportData = {
    memberName: null,
    healthGoals: [],
    consultSummaries: [],
    biotics: null,
    glp1: null,
    stability: null,
  }

  if (sb) {
    const [profileRes, leadRes, analysesRes, glp1ProfileRes, glp1LogsRes, stabilityRes, stabilityLogsRes, consultRes] =
      await Promise.all([
        sb.from("profiles").select("name, health_goals").eq("id", user.id).single(),
        sb
          .from("leads")
          .select("overall_score, sub_scores, created_at")
          .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
          .not("overall_score", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        sb
          .from("analyses")
          .select("biotics_score, meal_description, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),
        sb
          .from("glp1_profile")
          .select("medication, start_weight_kg, goal_weight_kg, started_at")
          .eq("user_id", user.id)
          .maybeSingle(),
        sb
          .from("glp1_logs")
          .select("log_date, protein_grams, protein_target, weight_kg, strength_session, side_effects")
          .eq("user_id", user.id)
          .order("log_date", { ascending: false })
          .limit(30),
        sb.from("stability_assessments").select("answers, flags, score").eq("user_id", user.id).maybeSingle(),
        sb
          .from("stability_logs")
          .select("data")
          .eq("user_id", user.id)
          .order("log_date", { ascending: false })
          .limit(120),
        sb
          .from("consultations")
          .select("summary")
          .eq("user_id", user.id)
          .not("summary", "is", null)
          .order("created_at", { ascending: false })
          .limit(3),
      ])

    data.memberName = (profileRes.data?.name as string | null) ?? null
    data.healthGoals = (profileRes.data?.health_goals as string[] | null) ?? []
    data.consultSummaries = (consultRes.data ?? []).map((c) => c.summary as string)

    // ── Biotics ──
    if (leadRes.data) {
      data.biotics = {
        overallScore: (leadRes.data.overall_score as number | null) ?? null,
        subScores: (leadRes.data.sub_scores as Record<string, number> | null) ?? null,
        assessmentDate: (leadRes.data.created_at as string | null) ?? null,
        recentAnalyses: (analysesRes.data ?? []).map((a) => ({
          date: a.created_at as string,
          score: (a.biotics_score as number | null) ?? null,
          meal: (a.meal_description as string | null) ?? null,
        })),
      }
    }

    // ── GLP-1 ──
    if (glp1ProfileRes.data || (glp1LogsRes.data && glp1LogsRes.data.length > 0)) {
      const logs = (glp1LogsRes.data ?? []) as Array<{
        log_date: string
        protein_grams: number | null
        protein_target: number | null
        weight_kg: number | null
        strength_session: boolean
        side_effects: string[] | null
      }>
      const weights = logs.filter((l) => l.weight_kg != null).map((l) => l.weight_kg as number)
      const proteinDays = logs.filter((l) => l.protein_grams != null && l.protein_target != null)
      const hitTarget = proteinDays.filter((l) => (l.protein_grams as number) >= (l.protein_target as number)).length
      const sideEffectCounts: Record<string, number> = {}
      for (const l of logs) for (const s of l.side_effects ?? []) sideEffectCounts[s] = (sideEffectCounts[s] ?? 0) + 1

      data.glp1 = {
        medication: (glp1ProfileRes.data?.medication as string | null) ?? null,
        startWeightKg: (glp1ProfileRes.data?.start_weight_kg as number | null) ?? null,
        goalWeightKg: (glp1ProfileRes.data?.goal_weight_kg as number | null) ?? null,
        startedAt: (glp1ProfileRes.data?.started_at as string | null) ?? null,
        latestWeightKg: weights[0] ?? null,
        logCount: logs.length,
        proteinAdherencePct: proteinDays.length ? Math.round((hitTarget / proteinDays.length) * 100) : null,
        strengthSessions: logs.filter((l) => l.strength_session).length,
        topSideEffects: Object.entries(sideEffectCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([name, count]) => ({ name, count })),
      }
    }

    // ── Stability ──
    if (stabilityRes.data) {
      const assessment = {
        answers: stabilityRes.data.answers,
        flags: stabilityRes.data.flags,
        score: stabilityRes.data.score,
      } as StabilityAssessment
      const logs = (stabilityLogsRes.data ?? []).map((r) => r.data as StabilityDailyLog)
      const report: StabilityReportData | null = logs.length >= 3 ? computeReport(logs, 30) : null
      data.stability = { score: assessment.score, report }
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <DoctorReportClient data={data} />
    </div>
  )
}
