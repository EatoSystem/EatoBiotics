// app/api/email/sequence/route.ts
// Vercel Cron target: daily at 9am UTC (0 9 * * *)
// Finds all leads that need the next email in the nurture sequence and sends it.
// Sequence day is calculated from lead.created_at offset — no new DB columns required.

import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { buildSequenceEmail } from "@/lib/email/sequence-email"
import { Resend } from "resend"

// ── Sequence day schedule ──────────────────────────────────────────────────
// Maps from days-since-signup to email day offset key
const SEQUENCE_DAYS = [0, 1, 2, 3, 5, 7, 10, 14, 21, 28]

/** Returns the day offset to send today for a given lead created_at */
function getSequenceDayForLead(createdAt: string): number | null {
  const daysSinceSignup = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 86_400_000
  )
  // Find the closest scheduled day that matches today
  const match = SEQUENCE_DAYS.find((d) => d === daysSinceSignup)
  return match ?? null
}

// ── Pillar helpers ─────────────────────────────────────────────────────────

function getWeakestPillar(subScores: Record<string, number> | null): "feed" | "seed" | "heal" {
  if (!subScores) return "seed"
  const pillars: Array<"feed" | "seed" | "heal"> = ["feed", "seed", "heal"]
  const available = pillars.filter((p) => typeof subScores[p] === "number")
  if (!available.length) return "seed"
  return available.sort((a, b) => (subScores[a] ?? 100) - (subScores[b] ?? 100))[0]
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
  const resend = new Resend(resendKey)

  // Fetch leads who:
  // - have an overall_score (completed assessment)
  // - have not already purchased (email_sent = true means results email was sent, not that they bought)
  // - created within last 30 days (sequence ends at day 28)
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86_400_000).toISOString()
  const { data: leads, error } = await supabase
    .from("leads")
    .select("email, name, overall_score, profile_type, sub_scores, created_at")
    .not("overall_score", "is", null)
    .not("email", "is", null)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("[email/sequence] Supabase error:", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const lead of leads ?? []) {
    const dayOffset = getSequenceDayForLead(lead.created_at)
    if (dayOffset === null) { skipped++; continue }

    // Skip day 0 — handled by the assessment completion email (send-results-email)
    if (dayOffset === 0) { skipped++; continue }

    const subScores = (lead.sub_scores as Record<string, number> | null) ?? {}
    const weakestPillar = getWeakestPillar(subScores)

    const opts = {
      name:           (lead.name as string | null) ?? "there",
      email:          lead.email as string,
      score:          (lead.overall_score as number) ?? 0,
      profileType:    (lead.profile_type as string | null) ?? "Emerging Balance",
      weakestPillar,
      feedScore:      subScores.feed  ?? 0,
      seedScore:      subScores.seed  ?? 0,
      healScore:      subScores.heal  ?? 0,
      dayOffset,
    }

    try {
      const { subject, html } = buildSequenceEmail(opts)
      const { error: sendError } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: lead.email as string,
        subject,
        html,
      })

      if (sendError) {
        errors.push(`${lead.email}: ${sendError.message}`)
      } else {
        sent++
      }
    } catch (err) {
      errors.push(`${lead.email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  console.log(`[email/sequence] sent=${sent} skipped=${skipped} errors=${errors.length}`)

  return NextResponse.json({
    ok: true,
    sent,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  })
}
