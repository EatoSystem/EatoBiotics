import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"
import { sendEmail } from "@/lib/email/send"
import { buildGlp1ReminderEmail } from "@/lib/email/glp1-reminder-email"

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
   Daily nudge for GLP-1 Companion members who have onboarded and logged
   recently, but haven't logged today. Gentle by design: we never email the
   never-started or the fully-lapsed — only engaged members missing today.
──────────────────────────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

  const resendKey = process.env.RESEND_API_KEY
  const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
  if (!resendKey) {
    console.warn("[glp1-reminder] RESEND_API_KEY not set — skipping run")
    return NextResponse.json({ skipped: true, reason: "No Resend key" })
  }

  const sb = getSupabase()
  if (!sb) return NextResponse.json({ error: "Database not configured" }, { status: 503 })

  const todayStr = new Date().toISOString().slice(0, 10)

  // Members with GLP-1 Companion access (member/restore/transform, active).
  const { data: members, error: membersErr } = await sb
    .from("profiles")
    .select("id, email, name")
    .in("membership_tier", ["member", "restore", "transform"])
    .eq("membership_status", "active")

  if (membersErr) {
    console.error("[glp1-reminder] member fetch failed:", membersErr.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Onboarded members (have a glp1_profile row).
  const { data: profs } = await sb.from("glp1_profile").select("user_id")
  const onboarded = new Set((profs ?? []).map((p) => p.user_id as string))

  // Logs from the last 14 days → who's engaged, who logged today, and streaks.
  const since = new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10)
  const { data: recentLogs } = await sb
    .from("glp1_logs")
    .select("user_id, log_date")
    .gte("log_date", since)

  const datesByUser = new Map<string, string[]>()
  const loggedToday = new Set<string>()
  for (const row of recentLogs ?? []) {
    const uid = row.user_id as string
    const d = row.log_date as string
    if (!datesByUser.has(uid)) datesByUser.set(uid, [])
    datesByUser.get(uid)!.push(d)
    if (d === todayStr) loggedToday.add(uid)
  }

  const targets = (members ?? []).filter(
    (m) => onboarded.has(m.id as string) && datesByUser.has(m.id as string) && !loggedToday.has(m.id as string),
  )

  let processed = 0
  let failed = 0
  for (const m of targets) {
    try {
      const streak = computeStreak(datesByUser.get(m.id as string) ?? [])
      const { subject, html } = buildGlp1ReminderEmail({
        name: (m.name as string | null) ?? null,
        streak,
        baseUrl: BASE_URL,
      })
      const sent = await sendEmail({ from: `EatoBiotics <${emailFrom}>`, to: m.email as string, subject, html })
      if (!sent.ok) {
        if (sent.error) throw new Error(sent.error)
        continue // opted out — skip silently
      }
      processed++
    } catch (err) {
      console.error(`[glp1-reminder] failed for ${m.id}:`, err)
      failed++
    }
  }

  console.log(`[glp1-reminder] Processed: ${processed}, Failed: ${failed}, Targets: ${targets.length}`)
  return NextResponse.json({ processed, failed, targets: targets.length })
}
