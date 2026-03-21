import { cookies } from "next/headers"
import { getSupabase } from "@/lib/supabase"
import { AdminLogin } from "./admin-login"
import { AdminDashboard } from "./admin-dashboard"

export const metadata = {
  title: "Admin — EatoBiotics",
  robots: { index: false, follow: false },
}

// Group an array of objects by a key into a count map
function countBy<T>(arr: T[], key: keyof T): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of arr) {
    const val = String(item[key] ?? "unknown")
    result[val] = (result[val] ?? 0) + 1
  }
  return result
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const isAuthed = cookieStore.get("admin_auth")?.value === "eatobiotics-admin-ok"

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

  // Fetch all stats in parallel
  const [
    { count: totalLeads },
    { count: completedAssessments },
    { count: accounts },
    { count: paidReports },
    { count: referrals },
    { data: profileRows },
    { data: tierRows },
    { data: ageRows },
    { data: recentLeads },
  ] = await Promise.all([
    db.from("leads").select("*", { count: "exact", head: true }),
    db.from("leads").select("*", { count: "exact", head: true }).not("overall_score", "is", null),
    db.from("profiles").select("*", { count: "exact", head: true }),
    db.from("deep_assessments").select("*", { count: "exact", head: true }).eq("status", "complete"),
    db.from("referrals").select("*", { count: "exact", head: true }),
    db.from("leads").select("profile_type").not("profile_type", "is", null),
    db.from("deep_assessments").select("tier").eq("status", "complete"),
    db.from("leads").select("age_bracket").not("age_bracket", "is", null),
    db.from("leads")
      .select("name, email, overall_score, profile_type, age_bracket, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const stats = {
    totalLeads: totalLeads ?? 0,
    completedAssessments: completedAssessments ?? 0,
    accounts: accounts ?? 0,
    paidReports: paidReports ?? 0,
    referrals: referrals ?? 0,
    profileTypes: countBy(profileRows ?? [], "profile_type"),
    tierCounts: countBy(tierRows ?? [], "tier"),
    ageBrackets: countBy(ageRows ?? [], "age_bracket"),
    recentLeads: (recentLeads ?? []) as Array<{
      name: string | null
      email: string
      overall_score: number | null
      profile_type: string | null
      age_bracket: string | null
      created_at: string
    }>,
  }

  return <AdminDashboard stats={stats} />
}
