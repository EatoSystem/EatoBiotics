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

    // Fail closed on a read error. A portability export is a factual claim
    // about everything we hold, so silently coercing a failed read to `[]`
    // produces a document that looks complete and is not — and the person
    // receiving it has no way to tell. Better to say we could not build it.
    const reads: { name: string; error: unknown }[] = [
      { name: "profiles", error: profileRes.error },
      { name: "analyses", error: analysesRes.error },
      { name: "weekly_checkins", error: checkinsRes.error },
      { name: "leads", error: leadsRes.error },
      { name: "deep_assessments", error: deepRes.error },
      { name: "journal_entries", error: journalRes.error },
      { name: "plate_data", error: plateRes.error },
      { name: "consultations", error: consultationsRes.error },
      { name: "stability_assessments", error: stabilityAssessmentRes.error },
      { name: "stability_logs", error: stabilityLogsRes.error },
      { name: "glp1_profile", error: glp1ProfileRes.error },
      { name: "glp1_logs", error: glp1LogsRes.error },
      { name: "household_members", error: householdRes.error },
      { name: "twin_state", error: twinRes.error },
    ]

    const failed = reads
      .filter(({ name, error }) => {
        if (!error) return false
        // `.single()` on profiles returns PGRST116 when there is genuinely no
        // row — a new account with nothing in it is not a failed read.
        if (name === "profiles" && (error as { code?: string })?.code === "PGRST116") return false
        return true
      })
      .map(({ name, error }) => {
        console.error(`[account/export] ${name} read failed:`, (error as { message?: string })?.message)
        return name
      })

    if (failed.length > 0) {
      return NextResponse.json(
        {
          error:
            "We couldn't build a complete copy of your data just now, so we haven't given you a partial one. Please try again shortly.",
          code: "export_incomplete",
          stages: failed,
        },
        { status: 503 },
      )
    }

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
