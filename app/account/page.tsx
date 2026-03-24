import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"
import { DashboardClient } from "@/components/account/dashboard-client"

export const metadata: Metadata = {
  title: "My Account — EatoBiotics",
  description: "Your assessment history, reports, and food system progress.",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field<T>(obj: unknown, key: string): T | undefined { return (obj as any)?.[key] as T | undefined }

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
  let nextBillingDate: string | null = null
  let dailyConsultCount = 0
  let monthlyConsultCount = 0
  let weeklyCheckin: { content: string; week_starting: string } | null = null
  let monthlyGutPlan: { content: string; month: string } | null = null
  let bioticsProfile: { prebiotic: number; probiotic: number; postbiotic: number; analysisCount: number } | null = null

  if (adminSupabase) {
    const { data: profileData } = await adminSupabase
      .from("profiles")
      .select("id, email, name, age_bracket, membership, referral_code, referred_by, membership_tier, membership_status, stripe_customer_id, stripe_subscription_id, membership_started_at, membership_expires_at, is_founding_member, health_goals")
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

    // Fetch next billing date from Stripe if subscription exists
    if (profile?.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id as string)
        const periodEnd = field<number>(sub, "current_period_end")
        if (periodEnd) {
          nextBillingDate = new Date(periodEnd * 1000).toISOString()
        }
      } catch (err) {
        console.error("[account] Failed to fetch subscription from Stripe:", err)
      }
    }

    // Consultation usage counts (Transform members)
    if (profile?.membership_tier === "transform" && profile?.membership_status === "active") {
      const today = new Date().toISOString().slice(0, 10)
      const { count: dc } = await adminSupabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("date", today)
      dailyConsultCount = dc ?? 0

      const firstOfMonth = new Date()
      firstOfMonth.setUTCDate(1)
      firstOfMonth.setUTCHours(0, 0, 0, 0)
      const { count: mc } = await adminSupabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("date", firstOfMonth.toISOString().slice(0, 10))
      monthlyConsultCount = mc ?? 0
    }

    // Latest weekly check-in (Transform members)
    if (profile?.membership_tier === "transform") {
      const { data: checkin } = await adminSupabase
        .from("weekly_checkins")
        .select("content, week_starting")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (checkin) {
        weeklyCheckin = {
          content:       checkin.content as string,
          week_starting: (checkin.week_starting as string | null) ?? "",
        }
      }
    }

    // Latest monthly gut plan (Restore+ members)
    if (
      profile?.membership_tier === "restore" ||
      profile?.membership_tier === "transform"
    ) {
      const { data: plan } = await adminSupabase
        .from("monthly_gut_plans")
        .select("content, month")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (plan) {
        monthlyGutPlan = {
          content: plan.content as string,
          month:   plan.month as string,
        }
      }
    }
  }

    // Biotics profile — from last 5 analyses (prebiotic_score, probiotic_score, postbiotic_score)
    if (adminSupabase) {
      const { data: analysesData } = await adminSupabase
        .from("analyses")
        .select("prebiotic_score, probiotic_score, postbiotic_score")
        .eq("user_id", user.id)
        .not("biotics_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(5)

      const recent = (analysesData ?? []).filter(
        (a) => a.prebiotic_score != null && a.probiotic_score != null && a.postbiotic_score != null
      )
      if (recent.length > 0) {
        const avg = (key: string) =>
          Math.round(recent.reduce((s: number, a: Record<string, unknown>) => s + ((a[key] as number) ?? 0), 0) / recent.length)
        bioticsProfile = {
          prebiotic:     avg("prebiotic_score"),
          probiotic:     avg("probiotic_score"),
          postbiotic:    avg("postbiotic_score"),
          analysisCount: recent.length,
        }
      }
    }

  // If no profile yet (edge case — callback didn't create it), create a minimal one
  if (!profile) {
    profile = {
      id:                      user.id,
      email:                   user.email!,
      name:                    null,
      age_bracket:             null,
      membership:              "free" as const,
      referral_code:           "??????",
      referred_by:             null,
      membership_tier:         "free" as const,
      membership_status:       "inactive" as const,
      stripe_customer_id:      null,
      stripe_subscription_id:  null,
      membership_started_at:   null,
      membership_expires_at:   null,
      is_founding_member:      false,
      health_goals:            [] as string[],
    }
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      <DashboardClient
        profile={profile}
        assessments={assessments}
        paidReports={paidReports}
        plateData={plateData}
        nextBillingDate={nextBillingDate}
        dailyConsultCount={dailyConsultCount}
        monthlyConsultCount={monthlyConsultCount}
        weeklyCheckin={weeklyCheckin}
        monthlyGutPlan={monthlyGutPlan}
        bioticsProfile={bioticsProfile}
      />
    </div>
  )
}
