import { cookies } from "next/headers"
import { getSupabase } from "@/lib/supabase"
import { ADMIN_COOKIE, verifyAdminCookie } from "@/lib/admin-auth"
import { countBy, bucketDailyCounts, sumBy } from "@/lib/admin-stats"
import { rankCountries } from "@/lib/market"
import { AdminLogin } from "../admin-login"
import { WaitlistOpsClient } from "./waitlist-ops-client"

export const metadata = {
  title: "Waitlist — EatoBiotics Admin",
  robots: { index: false, follow: false },
}

const WAITLIST = "waitlist"

export default async function WaitlistOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const isAuthed = verifyAdminCookie(cookieStore.get(ADMIN_COOKIE)?.value)

  if (!isAuthed) {
    return <AdminLogin error={params.error === "1"} />
  }

  const db = getSupabase()
  if (!db) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Supabase not configured.
      </div>
    )
  }

  // 14-day window for the signup sparkline.
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 13)
  since.setUTCHours(0, 0, 0, 0)

  const [
    { count: total },
    { count: completed },
    { count: unlocked },
    { data: countryRows },
    { data: profileRows },
    { data: dietRows },
    { data: goalRows },
    { data: challengeRows },
    { data: referralRows },
    { data: recentRows },
    { data: createdRows },
  ] = await Promise.all([
    db.from("leads").select("*", { count: "exact", head: true }).eq("assessment_type", WAITLIST),
    db.from("leads").select("*", { count: "exact", head: true }).eq("assessment_type", WAITLIST).not("overall_score", "is", null),
    db.from("leads").select("*", { count: "exact", head: true }).eq("assessment_type", WAITLIST).not("reward_code", "is", null),
    db.from("leads").select("country").eq("assessment_type", WAITLIST).not("country", "is", null),
    db.from("leads").select("profile_type").eq("assessment_type", WAITLIST).not("profile_type", "is", null),
    db.from("leads").select("diet").eq("assessment_type", WAITLIST).not("diet", "is", null),
    db.from("leads").select("main_goal").eq("assessment_type", WAITLIST).not("main_goal", "is", null),
    db.from("leads").select("food_challenge").eq("assessment_type", WAITLIST).not("food_challenge", "is", null),
    // All referrers (pre-launch volumes are small) — used for the total credited
    // and, sliced, the leaderboard.
    db.from("leads")
      .select("name, email, country, referral_count, reward_code")
      .eq("assessment_type", WAITLIST)
      .gt("referral_count", 0)
      .order("referral_count", { ascending: false }),
    db.from("leads")
      .select("name, email, country, overall_score, profile_type, created_at")
      .eq("assessment_type", WAITLIST)
      .order("created_at", { ascending: false })
      .limit(20),
    db.from("leads")
      .select("created_at")
      .eq("assessment_type", WAITLIST)
      .gte("created_at", since.toISOString()),
  ])

  const referrers = (referralRows ?? []) as Array<{
    name: string | null
    email: string
    country: string | null
    referral_count: number | null
    reward_code: string | null
  }>

  const stats = {
    total: total ?? 0,
    completed: completed ?? 0,
    unlocked: unlocked ?? 0,
    totalReferrals: sumBy(referrers, "referral_count"),
    countries: rankCountries((countryRows ?? []).map((r) => r.country as string | null)),
    profileTypes: countBy(profileRows ?? [], "profile_type"),
    diets: countBy(dietRows ?? [], "diet"),
    goals: countBy(goalRows ?? [], "main_goal"),
    challenges: countBy(challengeRows ?? [], "food_challenge"),
    leaders: referrers.slice(0, 20),
    recent: (recentRows ?? []) as Array<{
      name: string | null
      email: string
      country: string | null
      overall_score: number | null
      profile_type: string | null
      created_at: string
    }>,
    daily: bucketDailyCounts((createdRows ?? []).map((r) => r.created_at as string), 14),
  }

  return <WaitlistOpsClient stats={stats} />
}
