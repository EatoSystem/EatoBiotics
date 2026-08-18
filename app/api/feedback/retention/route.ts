import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"

/* ── Private-feedback retention sweep (cron) ───────────────────────────────
   Deletes feedback and review rows whose server-set `expires_at` has passed.

   This is what makes "90-day retention" a fact rather than a sentence in a
   policy document. The window is enforced in two places that have to agree:
   the column DEFAULT sets `expires_at` (no route ever sends it, so a client
   cannot extend its own retention), and this job removes what it marks.

   Why a cron route and not pg_cron: the extension is available on the project
   but NOT installed, and installing it is a production DDL change no agent
   session should make. Vercel Cron + verifyCronRequest is already how all
   eight scheduled jobs in this repo run, so this needs no new infrastructure
   and no dashboard-only step. See vercel.json.

   Not client-invokable: verifyCronRequest fails CLOSED — with no CRON_SECRET
   configured it returns 503 rather than running unauthenticated.

   The delete predicate is deliberately narrow and identical for both tables:
   `expires_at <= now`. It never filters on user, content or status, so it
   cannot be nudged into deleting live feedback.
──────────────────────────────────────────────────────────────────────── */

export const dynamic = "force-dynamic"

/** Tables swept here. Both hold raw customer text under the same 90-day rule. */
const RETAINED_TABLES = ["feedback", "reviews"] as const

async function sweep(): Promise<NextResponse> {
  const supabase = getSupabase()
  if (!supabase) {
    console.error("[feedback/retention] Supabase not configured")
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const cutoff = new Date().toISOString()
  const deleted: Record<string, number> = {}

  for (const table of RETAINED_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .lte("expires_at", cutoff)
      .select("id")

    if (error) {
      // Report the failure rather than a partial success that reads as a
      // completed sweep — expired customer text still being present is
      // exactly the thing someone needs to know about.
      console.error(`[feedback/retention] ${table} sweep failed:`, error.message)
      return NextResponse.json({ error: "Retention sweep failed" }, { status: 500 })
    }
    deleted[table] = data?.length ?? 0
  }

  console.log("[feedback/retention] swept:", JSON.stringify(deleted))
  return NextResponse.json({ ok: true, cutoff, deleted })
}

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised
  return sweep()
}

export async function POST(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised
  return sweep()
}
