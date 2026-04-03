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
    report_json: Record<string, unknown> | null
  }> = []
  let plateData: { plate: unknown; plants: string[] | null; updated_at: string } | null = null
  let nextBillingDate: string | null = null
  let pastConsultations: Array<{
    id: string
    turn_count: number
    created_at: string
    summary: string | null
    messages: Array<{role: string; content: string; turn: number}> | null
  }> = []
  let dailyConsultCount = 0
  let monthlyConsultCount = 0
  let weeklyCheckin: { content: string; week_starting: string } | null = null
  let monthlyGutPlan: { content: string; month: string } | null = null
  let bioticsProfile: { prebiotic: number; probiotic: number; postbiotic: number; analysisCount: number } | null = null
  let streak = 0
  let patterns: {
    bestDay: string
    trendDirection: "up" | "stable" | "down"
    bestStreak: number
    analysisCount: number
  } | null = null

  if (adminSupabase) {
    const { data: profileData } = await adminSupabase
      .from("profiles")
      .select("id, email, name, age_bracket, membership, referral_code, referred_by, membership_tier, membership_status, stripe_customer_id, stripe_subscription_id, membership_started_at, membership_expires_at, is_founding_member, health_goals, food_system_story")
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
      .select("stripe_session_id, tier, pdf_url, created_at, free_scores, report_json")
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

      // Past consultations with messages (for EatoBiotic history tab)
      const { data: consultData } = await adminSupabase
        .from("consultations")
        .select("id, turn_count, created_at, summary, messages")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
      pastConsultations = (consultData ?? []) as typeof pastConsultations
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

  // Pattern insights — best day, trend direction, best streak (90-day window)
  if (adminSupabase) {
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const { data: patternRows } = await adminSupabase
      .from("analyses")
      .select("biotics_score, created_at")
      .eq("user_id", user.id)
      .gte("created_at", ninetyDaysAgo.toISOString())
      .not("biotics_score", "is", null)
      .order("created_at", { ascending: true })
    if (patternRows && patternRows.length >= 3) {
      const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
      const dayBuckets: Record<number, number[]> = {}
      for (const row of patternRows) {
        const dow = new Date(row.created_at as string).getDay()
        dayBuckets[dow] = [...(dayBuckets[dow] ?? []), row.biotics_score as number]
      }
      const bestDowEntry = Object.entries(dayBuckets)
        .map(([dow, scores]) => ({ dow: Number(dow), avg: scores.reduce((a, b) => a + b, 0) / scores.length }))
        .sort((a, b) => b.avg - a.avg)[0]
      const bestDay = DAY_NAMES[bestDowEntry.dow]
      const scores = patternRows.map((r) => r.biotics_score as number)
      const half = Math.min(10, Math.floor(scores.length / 2))
      const firstAvg = scores.slice(0, half).reduce((a, b) => a + b, 0) / half
      const lastAvg = scores.slice(-half).reduce((a, b) => a + b, 0) / half
      const trendDirection: "up" | "stable" | "down" = lastAvg - firstAvg > 3 ? "up" : lastAvg - firstAvg < -3 ? "down" : "stable"
      const uniqueDays = Array.from(new Set(patternRows.map((r) => (r.created_at as string).slice(0, 10)))).sort()
      let bestStreak = 1, currentStreak = 1
      for (let i = 1; i < uniqueDays.length; i++) {
        const diff = (new Date(uniqueDays[i]).getTime() - new Date(uniqueDays[i - 1]).getTime()) / 86_400_000
        if (diff === 1) { currentStreak++; bestStreak = Math.max(bestStreak, currentStreak) }
        else { currentStreak = 1 }
      }
      patterns = { bestDay, trendDirection, bestStreak, analysisCount: patternRows.length }
    }
  }

  // Meal plan — check if current week has a plan
  let hasMealPlan = false
  if (adminSupabase && (profile?.membership_tier === "restore" || profile?.membership_tier === "transform")) {
    try {
      const today = new Date()
      const dow = today.getDay()
      const monday = new Date(today)
      monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1))
      const weekStarting = monday.toISOString().slice(0, 10)
      const { data: mpData } = await adminSupabase
        .from("meal_plans")
        .select("id")
        .eq("user_id", user.id)
        .eq("week_starting", weekStarting)
        .limit(1)
        .single()
      hasMealPlan = !!mpData
    } catch { /* no plan yet */ }
  }

  // Monthly review — latest entry
  let latestMonthlyReview: { month: string } | null = null
  if (adminSupabase && profile?.membership_tier === "transform") {
    try {
      const { data: mrData } = await adminSupabase
        .from("monthly_reviews")
        .select("month")
        .eq("user_id", user.id)
        .order("month", { ascending: false })
        .limit(1)
        .single()
      if (mrData) latestMonthlyReview = { month: mrData.month as string }
    } catch { /* no reviews yet */ }
  }

  // Food system story — last updated
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storyJson = (profile as any)?.food_system_story as { lastUpdated?: string } | null
  const storyLastUpdated: string | null = storyJson?.lastUpdated ?? null

  // Streak computation — consecutive days with at least one meal analysis
  function computeStreak(rows: { created_at: string }[]): number {
    if (!rows.length) return 0
    const days = Array.from(
      new Set(rows.map((r) => (r.created_at as string).slice(0, 10)))
    ).sort((a, b) => (a > b ? -1 : 1))
    const todayStr     = new Date().toISOString().slice(0, 10)
    const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
    if (days[0] !== todayStr && days[0] !== yesterdayStr) return 0
    let count = 0
    let expected = days[0]
    for (const day of days) {
      if (day === expected) {
        count++
        const d = new Date(expected + "T00:00:00Z")
        d.setUTCDate(d.getUTCDate() - 1)
        expected = d.toISOString().slice(0, 10)
      } else { break }
    }
    return count
  }

  if (adminSupabase) {
    const { data: streakRows } = await adminSupabase
      .from("analyses")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    streak = computeStreak(streakRows ?? [])
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

  const dailyPromptIndex = new Date().getDay()

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
        streak={streak}
        dailyPromptIndex={dailyPromptIndex}
        pastConsultations={pastConsultations}
        patterns={patterns}
        hasMealPlan={hasMealPlan}
        latestMonthlyReview={latestMonthlyReview}
        storyLastUpdated={storyLastUpdated}
      />
    </div>
  )
}
