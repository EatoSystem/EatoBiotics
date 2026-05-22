/**
 * Abandoned-cart recovery cron.
 *
 * Targets users who:
 *  - Completed the free assessment (`leads.overall_score` is set)
 *  - Received their immediate results email (`email_sent = true`)
 *  - Have NOT purchased a deep report (no row in `deep_assessments` for their email)
 *  - Took the assessment between 24 and 72 hours ago
 *  - Have NOT already received the abandoned-cart email
 *
 * Sends a single recovery email pointing them back to /assessment. The
 * `abandoned_cart_email_sent_at` timestamp prevents repeat sends.
 *
 * Triggered by Vercel Cron — see vercel.json. Protected by CRON_SECRET when set.
 */
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { buildAbandonedCartEmail } from "@/lib/email/abandoned-cart-email"

const MIN_AGE_HOURS = 24
const MAX_AGE_HOURS = 72

type LeadRow = {
  email: string
  name: string | null
  overall_score: number | null
  profile_type: string | null
  created_at: string
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not set" })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ skipped: true, reason: "Supabase not configured" })
  }

  const now = Date.now()
  const youngest = new Date(now - MIN_AGE_HOURS * 3_600_000).toISOString()
  const oldest   = new Date(now - MAX_AGE_HOURS * 3_600_000).toISOString()

  const { data: leads, error } = await supabase
    .from("leads")
    .select("email, name, overall_score, profile_type, created_at")
    .eq("assessment_type", "gut")
    .eq("email_sent", true)
    .is("abandoned_cart_email_sent_at", null)
    .not("overall_score", "is", null)
    .gte("created_at", oldest)
    .lte("created_at", youngest)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    console.error("[abandoned-cart] Lead query error:", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const resend     = new Resend(resendKey)
  const emailFrom  = process.env.EMAIL_FROM ?? "results@eatobiotics.com"
  const baseUrl    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
  let sent       = 0
  let suppressed = 0
  const errors: string[] = []

  for (const lead of (leads ?? []) as LeadRow[]) {
    const email = lead.email.toLowerCase().trim()

    // Skip if the user has already purchased — no recovery needed.
    const { data: purchase } = await supabase
      .from("deep_assessments")
      .select("stripe_session_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle()
    if (purchase) {
      suppressed++
      await supabase
        .from("leads")
        .update({ abandoned_cart_email_sent_at: new Date().toISOString() })
        .eq("email", email)
        .eq("assessment_type", "gut")
      continue
    }

    const { subject, html } = buildAbandonedCartEmail({
      name:         lead.name,
      profileType:  lead.profile_type,
      overallScore: lead.overall_score,
      baseUrl,
    })

    try {
      const { error: sendError } = await resend.emails.send({
        from:    `EatoBiotics <${emailFrom}>`,
        to:      email,
        subject,
        html,
      })

      if (sendError) {
        errors.push(`${email}: ${sendError.message}`)
        continue
      }

      // Mark as sent so we never re-email this lead even if the cron runs again
      // before the row falls out of the time window.
      await supabase
        .from("leads")
        .update({ abandoned_cart_email_sent_at: new Date().toISOString() })
        .eq("email", email)
        .eq("assessment_type", "gut")

      sent++
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, suppressed, errors })
}
