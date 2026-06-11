import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"
import { buildStabilityReminderEmail } from "@/lib/email/stability-reminder-email"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

/** Consecutive logged-day streak ending today/yesterday, from log_date strings (desc). */
function computeStreak(dates: string[]): number {
  if (!dates.length) return 0
  const days = Array.from(new Set(dates)).sort((a, b) => (a > b ? -1 : 1))
  const todayStr = new Date().toISOString().slice(0, 10)
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
    } else break
  }
  return count
}

/* ── Route handler ──────────────────────────────────────────────────────
   Daily nudge for EatoBiotics Stability™ users who have completed an
   assessment and logged recently, but haven't logged today. The tracker is
   free, so this targets everyone engaged — gentle by design: we never email
   the never-started or the fully-lapsed, only engaged users missing today.
──────────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

  const resendKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
  if (!resendKey) {
    console.warn("[stability-reminder] RESEND_API_KEY not set — skipping run")
    return NextResponse.json({ skipped: true, reason: "No Resend key" })
  }

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const resend = new Resend(resendKey)
  const todayStr = new Date().toISOString().slice(0, 10)

  // Logs from the last 14 days → who's engaged, who logged today, and streaks.
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10)
  const { data: recentLogs, error: logsErr } = await sb
    .from("stability_logs")
    .select("user_id, log_date")
    .gte("log_date", since)

  if (logsErr) {
    console.error("[stability-reminder] log fetch failed:", logsErr.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const datesByUser = new Map<string, string[]>()
  const loggedToday = new Set<string>()
  for (const row of recentLogs ?? []) {
    const uid = row.user_id as string
    const d = row.log_date as string
    if (!datesByUser.has(uid)) datesByUser.set(uid, [])
    datesByUser.get(uid)!.push(d)
    if (d === todayStr) loggedToday.add(uid)
  }

  // Engaged but missing today.
  const candidateIds = [...datesByUser.keys()].filter((uid) => !loggedToday.has(uid))
  if (candidateIds.length === 0) {
    return NextResponse.json({ processed: 0, failed: 0, targets: 0 })
  }

  // Only users who have actually completed a Stability assessment.
  const { data: assessed } = await sb
    .from("stability_assessments")
    .select("user_id")
    .in("user_id", candidateIds)
  const assessedSet = new Set((assessed ?? []).map((a) => a.user_id as string))

  const targetIds = candidateIds.filter((uid) => assessedSet.has(uid))
  if (targetIds.length === 0) {
    return NextResponse.json({ processed: 0, failed: 0, targets: 0 })
  }

  // Resolve emails/names.
  const { data: profiles } = await sb
    .from("profiles")
    .select("id, email, name")
    .in("id", targetIds)

  let processed = 0
  let failed = 0
  for (const p of profiles ?? []) {
    const email = p.email as string | null
    if (!email) continue
    try {
      const streak = computeStreak(datesByUser.get(p.id as string) ?? [])
      const { subject, html } = buildStabilityReminderEmail({
        name: (p.name as string | null) ?? null,
        streak,
        baseUrl: BASE_URL,
      })
      const { error } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: email,
        subject,
        html,
      })
      if (error) throw new Error(error.message)
      processed++
    } catch (err) {
      console.error(`[stability-reminder] failed for ${p.id}:`, err)
      failed++
    }
  }

  console.log(`[stability-reminder] Processed: ${processed}, Failed: ${failed}, Targets: ${targetIds.length}`)
  return NextResponse.json({ processed, failed, targets: targetIds.length })
}
