import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { buildNudgeEmail } from "@/lib/email/nudge-email"

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

/** Compute consecutive-day streak from a list of analysis rows (most recent first). */
function computeStreak(rows: { created_at: string }[]): number {
  if (!rows.length) return 0
  const days = Array.from(
    new Set(rows.map((r) => (r.created_at as string).slice(0, 10)))
  ).sort((a, b) => (a > b ? -1 : 1))
  const todayStr     = new Date().toISOString().slice(0, 10)
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
    } else {
      break
    }
  }
  return count
}

/** Send a weekly nudge email to a single member. */
async function sendNudge(
  userId: string,
  email: string,
  name: string | null,
  membershipTier: string,
  resend: Resend,
  emailFrom: string
): Promise<void> {
  const adminSupabase = getSupabase()
  if (!adminSupabase) return

  // Analyses in the past 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weekAnalyses } = await adminSupabase
    .from("analyses")
    .select("biotics_score, created_at")
    .eq("user_id", userId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })

  const mealsLoggedThisWeek = weekAnalyses?.length ?? 0
  const scores = (weekAnalyses ?? [])
    .map((a) => a.biotics_score as number | null)
    .filter((s): s is number => s != null)
  const bestScoreThisWeek = scores.length > 0 ? Math.max(...scores) : null

  // Streak — from all analyses ordered desc
  const { data: allAnalyses } = await adminSupabase
    .from("analyses")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  const currentStreak = computeStreak(allAnalyses ?? [])

  // Latest weekly check-in (Transform members only)
  let weeklyCheckinContent: string | null = null
  if (membershipTier === "transform") {
    const { data: checkin } = await adminSupabase
      .from("weekly_checkins")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    weeklyCheckinContent = (checkin?.content as string | null) ?? null
  }

  // Skip email if member has zero activity and no streak — avoid spamming inactive free users
  if (mealsLoggedThisWeek === 0 && currentStreak === 0 && membershipTier === "free") {
    console.log(`[weekly-nudge] Skipping inactive free user ${userId}`)
    return
  }

  const { subject, html } = buildNudgeEmail({
    name,
    mealsLoggedThisWeek,
    bestScoreThisWeek,
    currentStreak,
    weeklyCheckinContent,
    membershipTier,
    baseUrl: BASE_URL,
  })

  const { error } = await resend.emails.send({
    from: `EatoBiotics <${emailFrom}>`,
    to:   email,
    subject,
    html,
  })

  if (error) {
    console.error(`[weekly-nudge] Resend error for ${userId}:`, error.message)
    throw new Error(error.message)
  }
}

/* ── Route handler ──────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  // Protect with CRON_SECRET
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }
  }

  const resendKey  = process.env.RESEND_API_KEY
  const emailFrom  = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"

  if (!resendKey) {
    console.warn("[weekly-nudge] RESEND_API_KEY not set — skipping nudge run")
    return NextResponse.json({ skipped: true, reason: "No Resend key" })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const resend = new Resend(resendKey)

  // Fetch all members with any subscription OR with at least one analysis (engaged free users)
  // We send to: active paid members + free users who have logged ≥1 meal
  const { data: paidMembers, error: paidErr } = await adminSupabase
    .from("profiles")
    .select("id, email, name, membership_tier")
    .in("membership_tier", ["grow", "restore", "transform"])
    .eq("membership_status", "active")

  if (paidErr) {
    console.error("[weekly-nudge] Failed to fetch paid members:", paidErr.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  // Engaged free users — those who have logged at least one meal in the past 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: activeFreeRows } = await adminSupabase
    .from("analyses")
    .select("user_id")
    .gte("created_at", thirtyDaysAgo.toISOString())

  const activeFreeUserIds = Array.from(
    new Set((activeFreeRows ?? []).map((r) => r.user_id as string))
  )

  let freeMembers: Array<{ id: string; email: string; name: string | null; membership_tier: string }> = []
  if (activeFreeUserIds.length > 0) {
    const { data: freeData } = await adminSupabase
      .from("profiles")
      .select("id, email, name, membership_tier")
      .in("id", activeFreeUserIds)
      .eq("membership_tier", "free")
    freeMembers = (freeData ?? []) as typeof freeMembers
  }

  const allMembers = [
    ...(paidMembers ?? []) as Array<{ id: string; email: string; name: string | null; membership_tier: string }>,
    ...freeMembers,
  ]

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const member of allMembers) {
    try {
      await sendNudge(
        member.id,
        member.email,
        member.name,
        member.membership_tier,
        resend,
        emailFrom
      )
      sent++
    } catch (err) {
      console.error(`[weekly-nudge] Failed for user ${member.id}:`, err)
      // If the error is from our skip logic, count as skipped; otherwise failed
      const msg = err instanceof Error ? err.message : ""
      if (msg.includes("Skipping")) skipped++
      else failed++
    }
  }

  // Note: skips inside sendNudge() are silent (no throw), so they won't be counted here.
  // Only errors are caught above.

  console.log(`[weekly-nudge] Done. sent=${sent} failed=${failed} total=${allMembers.length}`)
  return NextResponse.json({ sent, failed, total: allMembers.length })
}
