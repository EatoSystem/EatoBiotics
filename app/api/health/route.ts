import { NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * Public health check for uptime monitoring. Verifies the app is running and
 * the database is reachable. Deliberately does NOT enumerate which secrets are
 * configured (no config disclosure) — it returns a simple ok/degraded status.
 */
export async function GET() {
  let database: "ok" | "error" | "unconfigured" = "unconfigured"
  try {
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase.from("profiles").select("id").limit(1)
      database = error ? "error" : "ok"
    }
  } catch {
    database = "error"
  }

  const healthy = database !== "error"
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", database, time: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  )
}
