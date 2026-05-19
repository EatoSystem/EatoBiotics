import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { buildResultsEmail } from "@/lib/email/results-email"

type LeadRow = {
  email: string
  name: string | null
  age_bracket: string | null
  overall_score: number | null
  profile_type: string | null
  sub_scores: Record<string, number> | null
  created_at: string
}

const FOLLOWUP_DELAY_MINUTES = 45

function profileTagline(profileType: string): string {
  return `${profileType} is your current food system pattern.`
}

function profileDescription(profileType: string): string {
  return `Your score is a starting point, not a diagnosis. The full report turns this pattern into a practical 30-day food system plan.`
}

function nextActions(subScores: Record<string, number>): string[] {
  const scores = {
    prebiotics: subScores.prebiotics ?? subScores.feed ?? 0,
    probiotics: subScores.probiotics ?? subScores.seed ?? 0,
    postbiotics: subScores.postbiotics ?? subScores.heal ?? 0,
  }
  const weakest = Object.entries(scores).sort(([, a], [, b]) => a - b)[0]?.[0] ?? "prebiotics"

  if (weakest === "prebiotics") {
    return [
      "Add one fibre-rich plant food to a meal you already eat.",
      "Repeat one plant-rich breakfast three times this week.",
      "Notice energy and digestion after your highest-fibre meal.",
    ]
  }
  if (weakest === "probiotics") {
    return [
      "Try one small serving of live yogurt, kefir, sauerkraut, kimchi, or miso if tolerated.",
      "Pair fermented foods with fibre-rich meals.",
      "Track whether bloating, regularity, or energy changes over the next day.",
    ]
  }
  return [
    "Build one balanced plate with protein, colourful plants, slow carbohydrates, and healthy fats.",
    "Keep meal timing steady for two days.",
    "Write down how you feel one hour after your main meal.",
  ]
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

  const cutoff = new Date(Date.now() - FOLLOWUP_DELAY_MINUTES * 60_000).toISOString()
  const { data: leads, error } = await supabase
    .from("leads")
    .select("email, name, age_bracket, overall_score, profile_type, sub_scores, created_at")
    .eq("assessment_type", "gut")
    .not("overall_score", "is", null)
    .or("email_sent.is.null,email_sent.eq.false")
    .lte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[assessment-followup] Lead query error:", error.message)
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  const resend = new Resend(resendKey)
  const emailFrom = process.env.EMAIL_FROM ?? "results@eatobiotics.com"
  const ownerEmail = process.env.OWNER_EMAIL
  let sent = 0
  let suppressed = 0
  const errors: string[] = []

  for (const lead of (leads ?? []) as LeadRow[]) {
    const email = lead.email.toLowerCase().trim()

    const { data: purchase } = await supabase
      .from("deep_assessments")
      .select("stripe_session_id")
      .eq("email", email)
      .limit(1)
      .maybeSingle()

    if (purchase) {
      suppressed++
      continue
    }

    const profileType = lead.profile_type ?? "Emerging Balance"
    const subScores = lead.sub_scores ?? {}
    const { subject, html } = buildResultsEmail({
      name: lead.name ?? "there",
      email,
      overall: lead.overall_score ?? 0,
      profileType,
      tagline: profileTagline(profileType),
      profileDescription: profileDescription(profileType),
      subScores: {
        prebiotics: subScores.prebiotics ?? subScores.feed ?? 0,
        probiotics: subScores.probiotics ?? subScores.seed ?? 0,
        postbiotics: subScores.postbiotics ?? subScores.heal ?? 0,
      },
      nextActions: nextActions(subScores),
      ageBracket: lead.age_bracket ?? undefined,
      assessmentType: "gut",
    })

    try {
      const { error: sendError } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: email,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject,
        html,
      })

      if (sendError) {
        errors.push(`${email}: ${sendError.message}`)
        continue
      }

      await supabase
        .from("leads")
        .update({ email_sent: true })
        .eq("email", email)
        .eq("assessment_type", "gut")

      sent++
    } catch (err) {
      errors.push(`${email}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return NextResponse.json({ ok: true, sent, suppressed, errors })
}
