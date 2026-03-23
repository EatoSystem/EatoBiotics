import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser, getSupabaseServer } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { DashboardClient } from "@/components/account/dashboard-client"

export const metadata: Metadata = {
  title: "My Account — EatoBiotics",
  description: "Your assessment history, reports, and food system progress.",
}

export default async function AccountPage() {
  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const adminSupabase = getSupabase()

  // Load profile
  let profile = null
  let assessments: Array<{
    overall_score: number | null
    profile_type: string | null
    sub_scores: Record<string, number> | null
    created_at: string
    email_sent: boolean | null
  }> = []
  let paidReports: Array<{
    stripe_session_id: string
    tier: string
    pdf_url: string | null
    created_at: string
    free_scores: { overall: number; profile: { type: string } } | null
  }> = []
  let plateData: { plate: unknown; plants: string[] | null; updated_at: string } | null = null

  if (adminSupabase) {
    const { data: profileData } = await adminSupabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = profileData

    const { data: leadsData } = await adminSupabase
      .from("leads")
      .select("overall_score, profile_type, sub_scores, created_at, email_sent")
      .or(`email.eq.${user.email!},user_id.eq.${user.id}`)
      .not("overall_score", "is", null)
      .order("created_at", { ascending: false })
    assessments = leadsData ?? []

    const { data: reportsData } = await adminSupabase
      .from("deep_assessments")
      .select("stripe_session_id, tier, pdf_url, created_at, free_scores")
      .eq("email", user.email!)
      .eq("status", "complete")
      .order("created_at", { ascending: false })
    paidReports = reportsData ?? []

    const { data: plateDataRow } = await adminSupabase
      .from("plate_data")
      .select("plate, plants, updated_at")
      .eq("user_id", user.id)
      .single()
    plateData = plateDataRow
  }

  // If no profile yet (edge case — callback didn't create it), create a minimal one
  if (!profile) {
    profile = {
      id: user.id,
      email: user.email!,
      name: null,
      age_bracket: null,
      membership: "free" as const,
      referral_code: "??????",
      referred_by: null,
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <DashboardClient
        profile={profile}
        assessments={assessments}
        paidReports={paidReports}
        plateData={plateData}
      />
    </div>
  )
}
