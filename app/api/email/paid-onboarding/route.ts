import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { verifyCronRequest } from "@/lib/cron-auth"
import {
  paidDay1Email,
  paidDay3Email,
  paidDay7Email,
  paidDay14Email,
  type PaidOnboardingOpts,
} from "@/lib/email/paid-onboarding-email"

/* ── Paid-member onboarding sequence ─────────────────────────────────────
   Runs daily via Vercel Cron (vercel.json: "0 11 * * *"). Sends timed
   emails to ACTIVE paid members at days 1, 3, 7 and 14 after
   membership_started_at — the highest-churn window of a subscription.

   Dedup follows the proven nurture pattern (app/api/email/nurture):
   each day is detected by a ±2-hour window around the target interval, so
   a daily cron can only ever hit each window once per member. (No
   email_sends dependency — Migration 23 may not be applied yet.)

   - Day 1  → set your baseline (first meal log)
   - Day 3  → tier-aware feature discovery
   - Day 7  → first-week recap with their actual numbers
   - Day 14 → habit + value reinforcement (clinician report)
──────────────────────────────────────────────────────────────────────── */

const EMAIL_FROM = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
const PAID_TIERS = ["grow", "member", "restore", "transform"]

export async function GET(req: NextRequest) {
  const unauthorised = verifyCronRequest(req)
  if (unauthorised) return unauthorised

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not set" })
  }

  const sb = getSupabase()
  if (!sb) {
    return NextResponse.json({ skipped: true, reason: "Supabase not configured" })
  }

  const resend = new Resend(resendKey)
  const now    = Date.now()
  const HOUR   = 3_600_000

  // ±2h windows around each interval (absorbs cron drift, prevents double-sends)
  const SEQUENCE = [
    { day: "day1",  minHours:  22, maxHours:  26 },
    { day: "day3",  minHours:  70, maxHours:  74 },
    { day: "day7",  minHours: 166, maxHours: 170 },
    { day: "day14", minHours: 334, maxHours: 338 },
  ] as const

  let sent = 0
  const errors: string[] = []

  for (const seq of SEQUENCE) {
    const minDate = new Date(now - seq.maxHours * HOUR).toISOString()
    const maxDate = new Date(now - seq.minHours * HOUR).toISOString()

    const { data: members, error } = await sb
      .from("profiles")
      .select("id, email, name, membership_tier")
      .in("membership_tier", PAID_TIERS)
      .eq("membership_status", "active")
      .gte("membership_started_at", minDate)
      .lte("membership_started_at", maxDate)

    if (error) {
      errors.push(`${seq.day}: ${error.message}`)
      continue
    }

    for (const m of members ?? []) {
      const email = m.email as string | null
      if (!email) continue
      try {
        const opts: PaidOnboardingOpts = {
          name: (m.name as string | null) ?? null,
          tier: (m.membership_tier as string) ?? "grow",
        }

        // D7 recap pulls their actual first-week numbers.
        if (seq.day === "day7") {
          const weekAgo = new Date(now - 7 * 24 * HOUR).toISOString()
          const [{ count: meals }, { data: lead }] = await Promise.all([
            sb.from("analyses").select("id", { count: "exact", head: true })
              .eq("user_id", m.id).gte("created_at", weekAgo),
            sb.from("leads").select("overall_score")
              .eq("email", email.toLowerCase()).not("overall_score", "is", null)
              .order("created_at", { ascending: false }).limit(1).maybeSingle(),
          ])
          opts.mealsLogged = meals ?? 0
          opts.latestScore = (lead?.overall_score as number | null) ?? null
        }

        const { subject, html } =
          seq.day === "day1"  ? paidDay1Email(opts)  :
          seq.day === "day3"  ? paidDay3Email(opts)  :
          seq.day === "day7"  ? paidDay7Email(opts)  :
                                paidDay14Email(opts)

        const { error: sendErr } = await resend.emails.send({
          from: `EatoBiotics <${EMAIL_FROM}>`,
          to: email,
          subject,
          html,
        })
        if (sendErr) throw new Error(sendErr.message)
        sent++
      } catch (err) {
        errors.push(`${seq.day} for ${m.id}: ${String(err)}`)
      }
    }
  }

  console.log(`[paid-onboarding] Sent: ${sent}, Errors: ${errors.length}`)
  return NextResponse.json({ ok: true, sent, errors })
}
