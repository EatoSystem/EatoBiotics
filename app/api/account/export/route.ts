import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { ownerOrFilter } from "@/lib/supabase-filters"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminSupabase = getSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const userId = user.id
    const email  = user.email ?? ""

    // Portability (GDPR Art. 20). This previously returned four tables and
    // omitted `deep_assessments` — the paid deep answers and the report the
    // customer bought — which is the most conspicuous thing a portability export
    // could leave out. The rest of the daily-use surfaces were missing too.
    const owned = ownerOrFilter(userId, email)
    const [
      profileRes,
      analysesRes,
      checkinsRes,
      leadsRes,
      deepRes,
      journalRes,
      plateRes,
      consultationsRes,
      stabilityAssessmentRes,
      stabilityLogsRes,
      glp1ProfileRes,
      glp1LogsRes,
      householdRes,
      twinRes,
    ] = await Promise.all([
      adminSupabase.from("profiles").select("*").eq("id", userId).single(),
      adminSupabase.from("analyses").select("*").eq("user_id", userId),
      adminSupabase.from("weekly_checkins").select("*").eq("user_id", userId),
      adminSupabase.from("leads").select("*").or(owned),
      // Keyed by user_id OR email: a paid report can exist for a guest checkout
      // that was never linked to an account.
      adminSupabase.from("deep_assessments").select("*").or(owned),
      adminSupabase.from("journal_entries").select("*").eq("user_id", userId),
      adminSupabase.from("plate_data").select("*").eq("user_id", userId),
      adminSupabase.from("consultations").select("*").eq("user_id", userId),
      adminSupabase.from("stability_assessments").select("*").eq("user_id", userId),
      adminSupabase.from("stability_logs").select("*").eq("user_id", userId),
      adminSupabase.from("glp1_profile").select("*").eq("user_id", userId),
      adminSupabase.from("glp1_logs").select("*").eq("user_id", userId),
      adminSupabase.from("household_members").select("*").eq("owner_id", userId),
      adminSupabase.from("twin_state").select("*").eq("user_id", userId),
    ])

    const exportData = {
      exportedAt:    new Date().toISOString(),
      profile:       profileRes.data ?? null,
      analyses:      analysesRes.data ?? [],
      weeklyReports: checkinsRes.data ?? [],
      assessments:   leadsRes.data ?? [],
      paidReports:   deepRes.data ?? [],
      journal:       journalRes.data ?? [],
      plate:         plateRes.data ?? [],
      consultations: consultationsRes.data ?? [],
      stability: {
        assessment: stabilityAssessmentRes.data ?? [],
        logs:       stabilityLogsRes.data ?? [],
      },
      glp1: {
        profile: glp1ProfileRes.data ?? [],
        logs:    glp1LogsRes.data ?? [],
      },
      household: householdRes.data ?? [],
      twinState: twinRes.data ?? [],
    }

    const today = new Date().toISOString().slice(0, 10)
    const json  = JSON.stringify(exportData, null, 2)

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type":        "application/json",
        "Content-Disposition": `attachment; filename="eatobiotics-data-${today}.json"`,
      },
    })
  } catch (err) {
    console.error("[account/export]", err)
    return NextResponse.json({ error: "Export failed" }, { status: 500 })
  }
}
