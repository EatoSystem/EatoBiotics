import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"

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

    const [profileRes, analysesRes, checkinsRes, leadsRes] = await Promise.all([
      adminSupabase.from("profiles").select("*").eq("id", userId).single(),
      adminSupabase.from("analyses").select("*").eq("user_id", userId),
      adminSupabase.from("weekly_checkins").select("*").eq("user_id", userId),
      adminSupabase.from("leads").select("*").or(`user_id.eq.${userId},email.eq.${email}`),
    ])

    const exportData = {
      exportedAt:    new Date().toISOString(),
      profile:       profileRes.data ?? null,
      analyses:      analysesRes.data ?? [],
      weeklyReports: checkinsRes.data ?? [],
      assessments:   leadsRes.data ?? [],
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
