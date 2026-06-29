import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"
import { stripe } from "@/lib/stripe-server"
import { canAccess, type MembershipTier } from "@/lib/membership"
import { LiveDashboard } from "@/components/account/live-dashboard"
import type { RealAnalysis, RealWeeklyReport } from "@/components/account/live-dashboard"
import { TrackConversion } from "@/components/analytics/track-conversion"
import { computeStreak } from "@/lib/streak"
import { dailyNudge } from "@/lib/habit"
import { buildBaselineFromAccount } from "@/lib/agent-loop"
import type { DailyLoopData } from "@/components/account/daily-loop-card"

export const metadata: Metadata = {
  title: "My Account — EatoBiotics",
  description: "Your assessment history, reports, and food system progress.",
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field<T>(obj: unknown, key: string): T | undefined { return (obj as any)?.[key] as T | undefined }

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>
}) {
  const { subscription } = await searchParams
  const justSubscribed = subscription === "success"

  const user = await getUser()
  if (!user) redirect("/assessment?signin=1")

  const adminSupabase = getSupabase()

  /* ── Profile ── */
  let profile: Record<string, unknown> | null = null
  if (adminSupabase) {
    const { data } = await adminSupabase
      .from("profiles")
      .select("id, email, name, membership_tier, membership_status, stripe_customer_id, stripe_subscription_id, membership_started_at, referral_code")
      .eq("id", user.id)
      .single()
    profile = data as Record<string, unknown> | null
  }

  /* ── Parallel data fetch — these queries are independent (they need only the
       authenticated user and the already-resolved profile), so run them
       concurrently instead of sequentially to cut the dashboard's load time. ── */
  type AssessmentRow = { overall_score: number | null; profile_type: string | null; sub_scores: Record<string, number> | null }

  const [
    assessments,
    bioticsProfile,
    recentAnalyses,
    weeklyReport,
    weeklyReports,
    weeklyCheckin,
    monthlyPlan,
    nextBillingDate,
    streakInfo,
  ] = await Promise.all([
    /* Assessment scores (gut only — for overall score + profile type) */
    (async (): Promise<AssessmentRow[]> => {
      if (!adminSupabase) return []
      const { data } = await adminSupabase
        .from("leads")
        .select("overall_score, profile_type, sub_scores")
        .or(ownerOrFilter(user.id, user.email))
        .eq("assessment_type", "gut")
        .not("overall_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(2)
      return (data ?? []) as AssessmentRow[]
    })(),

    /* Biotics profile — averaged from last 5 analyses */
    (async (): Promise<{ prebiotic: number; probiotic: number; postbiotic: number } | undefined> => {
      if (!adminSupabase) return undefined
      const { data } = await adminSupabase
        .from("analyses")
        .select("prebiotic_score, probiotic_score, postbiotic_score")
        .eq("user_id", user.id)
        .not("biotics_score", "is", null)
        .order("created_at", { ascending: false })
        .limit(5)
      const rows = (data ?? []).filter(
        (a) => a.prebiotic_score != null && a.probiotic_score != null && a.postbiotic_score != null
      )
      if (rows.length === 0) return undefined
      const avg = (key: string) =>
        Math.round(rows.reduce((s: number, a: Record<string, unknown>) => s + ((a[key] as number) ?? 0), 0) / rows.length)
      return { prebiotic: avg("prebiotic_score"), probiotic: avg("probiotic_score"), postbiotic: avg("postbiotic_score") }
    })(),

    /* Recent analyses — last 7 days, full meal detail */
    (async (): Promise<RealAnalysis[]> => {
      if (!adminSupabase) return []
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const { data } = await adminSupabase
        .from("analyses")
        .select("id, meal_name, meal_type, image_url, biotics_score, prebiotic_score, probiotic_score, postbiotic_score, quality_diversity, quality_anti_inflammatory, nutrition_json, insight, tags, created_at")
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(30)
      return (data ?? []) as RealAnalysis[]
    })(),

    /* Latest weekly report */
    (async (): Promise<RealWeeklyReport | null> => {
      if (!adminSupabase) return null
      const { data } = await adminSupabase
        .from("weekly_checkins")
        .select("id, week_starting, content, report_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (!data) return null
      return {
        id:            data.id as string,
        week_starting: data.week_starting as string,
        content:       data.content as string,
        report_json:   data.report_json as RealWeeklyReport["report_json"],
      }
    })(),

    /* All weekly reports for Consultations tab */
    (async (): Promise<RealWeeklyReport[]> => {
      if (!adminSupabase) return []
      const { data } = await adminSupabase
        .from("weekly_checkins")
        .select("id, week_starting, content, report_json")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10)
      return (data ?? []).map((r) => ({
        id:            r.id as string,
        week_starting: r.week_starting as string,
        content:       r.content as string,
        report_json:   r.report_json as RealWeeklyReport["report_json"],
      }))
    })(),

    /* Latest weekly check-in text (Transform) */
    (async (): Promise<string | null> => {
      if (!(adminSupabase && canAccess((profile?.membership_tier ?? "free") as MembershipTier, "weekly_checkin"))) return null
      const { data } = await adminSupabase
        .from("weekly_checkins")
        .select("content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      return (data?.content as string | null) ?? null
    })(),

    /* Monthly gut plan text (Restore+) */
    (async (): Promise<string | null> => {
      if (!(adminSupabase && canAccess((profile?.membership_tier ?? "free") as MembershipTier, "monthly_gut_plan"))) return null
      const { data } = await adminSupabase
        .from("monthly_gut_plans")
        .select("content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      return (data?.content as string | null) ?? null
    })(),

    /* Next billing date from Stripe */
    (async (): Promise<string | null> => {
      if (!profile?.stripe_subscription_id) return null
      try {
        const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id as string)
        const periodEnd = field<number>(sub, "current_period_end")
        return periodEnd ? new Date(periodEnd * 1000).toISOString() : null
      } catch (err) {
        console.error("[account] Stripe fetch failed:", err)
        return null
      }
    })(),

    /* Streak — consecutive days with at least one analysis */
    (async (): Promise<ReturnType<typeof computeStreak>> => {
      if (!adminSupabase) return computeStreak([])
      const { data: streakRows } = await adminSupabase
        .from("analyses")
        .select("created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      return computeStreak((streakRows ?? []).map((r) => r.created_at as string))
    })(),
  ])

  const streak = streakInfo.current

  // Daily loop card data — streak + the weakest-pillar nudge from the Food System Core.
  const dailyLoop: DailyLoopData = {
    streak: streakInfo,
    focus: bioticsProfile
      ? (() => {
          const n = dailyNudge({
            prebiotics:  bioticsProfile.prebiotic,
            probiotics:  bioticsProfile.probiotic,
            postbiotics: bioticsProfile.postbiotic,
          })
          return { key: n.pillar.key, color: n.pillar.color, score: n.score }
        })()
      : null,
  }

  /* ── Food System baseline (immutable root of the Digital Twin) ──
     Derived purely from the data already fetched — assessment score + sub-scores,
     with the analyses-averaged biotics as a fallback. Null when there's no
     assessment yet, in which case the dashboard shows a "start your baseline" prompt. */
  const baseline = buildBaselineFromAccount({
    score: (assessments[0]?.overall_score as number | null) ?? null,
    profileType: (assessments[0]?.profile_type as string | null) ?? null,
    subScores: (assessments[0]?.sub_scores as Record<string, number> | null) ?? null,
    bioticsFallback: bioticsProfile ?? null,
  })

  /* ── Fallback profile if none exists yet ── */
  if (!profile) {
    profile = {
      id:                     user.id,
      email:                  user.email!,
      name:                   null,
      membership_tier:        "free",
      membership_status:      "inactive",
      stripe_customer_id:     null,
      stripe_subscription_id: null,
      membership_started_at:  null,
      referral_code:          null,
    }
  }

  return (
    <div className="min-h-screen bg-background pt-[57px]">
      {justSubscribed && (
        <TrackConversion
          event="subscription_activated"
          dedupeKey={`subscription_activated:${(profile.stripe_subscription_id as string | null) ?? user.id}`}
          properties={{ tier: (profile.membership_tier as string | null) ?? null }}
        />
      )}
      <LiveDashboard
        baseline={baseline}
        name={(profile.name as string | null) ?? null}
        email={user.email ?? null}
        ageBracket={(profile.age_bracket as string | null) ?? null}
        membershipTier={(profile.membership_tier as string | null) ?? null}
        membershipStatus={(profile.membership_status as string | null) ?? null}
        streak={streak}
        dailyLoop={dailyLoop}
        score={(assessments[0]?.overall_score as number | null) ?? null}
        previousScore={(assessments[1]?.overall_score as number | null) ?? null}
        profileType={(assessments[0]?.profile_type as string | null) ?? null}
        biotics={bioticsProfile}
        recentAnalyses={recentAnalyses}
        weeklyReport={weeklyReport}
        weeklyReports={weeklyReports}
        monthlyPlan={monthlyPlan}
        weeklyCheckin={weeklyCheckin}
        memberStartedAt={(profile.membership_started_at as string | null) ?? null}
        nextBillingDate={nextBillingDate}
        referralCode={(profile.referral_code as string | null) ?? null}
      />
    </div>
  )
}
