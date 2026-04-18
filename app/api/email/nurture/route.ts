import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"

/* ── Nurture Email Sequence ──────────────────────────────────────────────
   Runs daily via Vercel Cron (see vercel.json: "0 9 * * *").
   Sends timed emails to users at days 1, 3, 7, and 14 after signup.

   Each day is detected by looking at profiles.created_at within a
   ±2-hour window around the target interval (avoids double-sends while
   tolerating cron drift).

   Sequence:
   - Day 1  → "Here's what your score actually means"
   - Day 3  → "Have you tried today's action?" (pillar-specific nudge)
   - Day 7  → "You've completed your 7-day starter — what's next"
   - Day 14 → "It's been two weeks — your gut has been changing"
────────────────────────────────────────────────────────────────────── */

const CRON_SECRET = process.env.CRON_SECRET
const EMAIL_FROM  = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

/* ── Email HTML templates ────────────────────────────────────────────── */

function baseTemplate(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#f7f7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e5e5;max-width:560px;width:100%;">
          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(135deg,#A8E063,#4CB648,#2DAA6E);padding:28px 40px 24px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">EatoBiotics</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:11px;">The Food System Inside You</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f3f3;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                EatoBiotics &middot; <a href="${SITE_URL}/account" style="color:#4CB648;text-decoration:none;">View your account</a> &middot;
                <a href="${SITE_URL}/unsubscribe" style="color:#9ca3af;text-decoration:none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
    <tr>
      <td style="background:linear-gradient(135deg,#A8E063,#4CB648);border-radius:50px;">
        <a href="${href}" style="display:block;padding:14px 32px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:-0.1px;">
          ${label} →
        </a>
      </td>
    </tr>
  </table>`
}

function pillarInsight(label: string, action: string, color: string): string {
  return `<div style="background:${color}18;border-left:3px solid ${color};border-radius:0 10px 10px 0;padding:14px 16px;margin:20px 0;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:1px;">${label}</p>
    <p style="margin:0;font-size:14px;color:#1A2E12;line-height:1.6;">${action}</p>
  </div>`
}

/* Day 1 — What your score means */
function day1Email(name: string, score: number | null, profileType: string | null, weakestPillar: string | null): string {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"
  const scoreText = score != null ? `You scored <strong style="color:#4CB648;">${score}/100</strong>` : "You have a Biotics Score"
  const profileText = profileType ? ` — that makes you a <strong>${profileType}</strong>` : ""

  const PILLAR_INSIGHTS: Record<string, { label: string; action: string; color: string }> = {
    adding:      { label: "Live Foods is your biggest opportunity", action: "Add one fermented food today — yogurt, kefir, sauerkraut, or kimchi. Just one. It starts the shift.", color: "#2DAA6E" },
    diversity:   { label: "Plant Diversity is where to start", action: "Count how many different plants you ate yesterday. Most people are surprised by how low the number is.", color: "#A8E063" },
    feeding:     { label: "Feeding is your first focus", action: "Anchor your next meal with a fibre-rich food — oats, lentils, or sweet potato. Your gut bacteria need it.", color: "#4CB648" },
    consistency: { label: "Consistency is your unlock", action: "Set three fixed meal times for tomorrow and protect them. Your gut microbiome runs on a clock.", color: "#F5C518" },
    feeling:     { label: "Body Awareness is your starting point", action: "Write one word describing how you feel one hour after your next meal. That word is data.", color: "#F5A623" },
  }

  const insight = weakestPillar ? PILLAR_INSIGHTS[weakestPillar] : PILLAR_INSIGHTS.adding

  return baseTemplate(`
    <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greeting}</p>
    <p style="margin:0 0 24px;color:#5A6E50;font-size:15px;line-height:1.7;">
      ${scoreText}${profileText}. Here&apos;s what that actually means — and the one thing that will move it.
    </p>

    <p style="margin:0 0 12px;color:#1A2E12;font-size:15px;font-weight:600;">Your score is a baseline, not a verdict</p>
    <p style="margin:0 0 20px;color:#5A6E50;font-size:14px;line-height:1.7;">
      It reflects the state of your food system <em>right now</em>. The five pillars — Plant Diversity, Feeding, Live Foods, Consistency, and Feeling — each scored individually. Your weakest is where the most movement happens fastest.
    </p>

    ${insight ? pillarInsight(insight.label, insight.action, insight.color) : ""}

    <p style="margin:20px 0 8px;color:#5A6E50;font-size:14px;line-height:1.7;">
      Your account is ready. Log your first meal, check your pillar scores, and take one small action today.
    </p>
    ${ctaButton(`${SITE_URL}/account`, "Go to your account")}
  `)
}

/* Day 3 — Habit check-in */
function day3Email(name: string, weakestPillar: string | null): string {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"

  const PILLAR_DAY3: Record<string, { label: string; action: string }> = {
    adding:      { label: "Day 3 Live Foods action", action: "Swap a regular drink for a fermented one today — water kefir, kombucha, or kefir milk. Liquid ferments colonise faster than solids." },
    diversity:   { label: "Day 3 Plant action", action: "Include a legume in one meal today — lentils, chickpeas, or beans. They&apos;re the most impactful single plant group for gut diversity." },
    feeding:     { label: "Day 3 Feeding action", action: "Replace a refined carb with a whole-grain alternative today. Whole grains retain the bran — the part your gut bacteria actually eat." },
    consistency: { label: "Day 3 Rhythm action", action: "Avoid eating within 2 hours of sleep tonight. Late eating disrupts gut-brain signalling during the window when microbiome restoration happens." },
    feeling:     { label: "Day 3 Body Awareness action", action: "Track your digestion after your largest meal today. Bloating, sluggishness, or discomfort after meals are signals from your microbiome." },
  }

  const action = weakestPillar ? PILLAR_DAY3[weakestPillar] : PILLAR_DAY3.adding

  return baseTemplate(`
    <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greeting}</p>
    <p style="margin:0 0 24px;color:#5A6E50;font-size:15px;line-height:1.7;">
      Day 3. The first two days are about deciding. Day 3 is where a habit either takes hold or gets forgotten.
    </p>

    <p style="margin:0 0 16px;color:#1A2E12;font-size:15px;font-weight:600;">Your action for today</p>
    ${action ? pillarInsight(action.label, action.action, "#4CB648") : ""}

    <p style="margin:20px 0 8px;color:#5A6E50;font-size:14px;line-height:1.7;">
      The science is straightforward: <strong style="color:#1A2E12;">three days of consistent action</strong> is when your gut microbiome starts responding. You&apos;re right at the threshold.
    </p>
    <p style="margin:0 0 8px;color:#5A6E50;font-size:14px;line-height:1.7;">
      Check in on your account — see your pillar scores and complete today&apos;s 7-day guide action.
    </p>
    ${ctaButton(`${SITE_URL}/account`, "Check in on your account")}
  `)
}

/* Day 7 — Starter complete */
function day7Email(name: string, score: number | null): string {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"
  const scoreText = score != null ? `Your current score is <strong style="color:#4CB648;">${score}/100</strong>.` : ""

  return baseTemplate(`
    <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greeting}</p>
    <p style="margin:0 0 24px;color:#5A6E50;font-size:15px;line-height:1.7;">
      Seven days. You&apos;ve completed your EatoBiotics starter programme. ${scoreText}
    </p>

    <p style="margin:0 0 12px;color:#1A2E12;font-size:15px;font-weight:600;">What one week of consistent action actually does</p>
    <p style="margin:0 0 20px;color:#5A6E50;font-size:14px;line-height:1.7;">
      In seven days of consistent change, your gut has already begun shifting. Microbiome research shows measurable changes in bacterial populations in as little as <strong style="color:#1A2E12;">72 hours</strong>. After seven days, diversity scores begin moving. The foundation is there.
    </p>

    <p style="margin:0 0 12px;color:#1A2E12;font-size:15px;font-weight:600;">The next step: 30 days</p>
    <p style="margin:0 0 8px;color:#5A6E50;font-size:14px;line-height:1.7;">
      This is where the shift becomes measurable in how you feel — not just in your score. Your account has a 30-day challenge waiting for you. It continues exactly where your 7-day guide left off.
    </p>
    ${ctaButton(`${SITE_URL}/account`, "Start your 30-day challenge")}

    <p style="margin:24px 0 4px;color:#5A6E50;font-size:13px;line-height:1.6;border-top:1px solid #f3f3f3;padding-top:20px;">
      <strong style="color:#1A2E12;">Want to go deeper?</strong> A Grow membership adds daily meal tracking, real-time score movement, and a streak to keep you accountable — €9.99/mo, cancel any time.
    </p>
    <a href="${SITE_URL}/pricing" style="display:inline-block;margin-top:8px;color:#4CB648;font-size:13px;font-weight:600;text-decoration:none;">
      See what Grow includes →
    </a>
  `)
}

/* Day 14 — Two-week check-in */
function day14Email(name: string, score: number | null): string {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"

  return baseTemplate(`
    <p style="margin:0 0 6px;color:#1A2E12;font-size:16px;font-weight:600;">${greeting}</p>
    <p style="margin:0 0 24px;color:#5A6E50;font-size:15px;line-height:1.7;">
      Two weeks since your assessment. Your gut has been changing whether you noticed or not.
    </p>

    <p style="margin:0 0 12px;color:#1A2E12;font-size:15px;font-weight:600;">This is the moment most people miss</p>
    <p style="margin:0 0 20px;color:#5A6E50;font-size:14px;line-height:1.7;">
      Week two and three are where people either build a system or revert to defaults. The people who keep going don&apos;t have more willpower. They have a clearer picture of what they&apos;re building — and why it matters to their specific gut.
    </p>

    ${score != null ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:16px 20px;margin:0 0 20px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#4CB648;text-transform:uppercase;letter-spacing:1px;">Your score</p>
      <p style="margin:0;font-size:28px;font-weight:800;color:#1A2E12;">${score}<span style="font-size:16px;font-weight:400;color:#5A6E50;">/100</span></p>
      <p style="margin:6px 0 0;font-size:13px;color:#5A6E50;">Two weeks of action on your weakest pillar can move this by 5–12 points.</p>
    </div>` : ""}

    <p style="margin:0 0 8px;color:#5A6E50;font-size:14px;line-height:1.7;">
      Your account has your full pillar breakdown. Check which pillar moved most and which one needs the next round of attention.
    </p>
    ${ctaButton(`${SITE_URL}/account`, "Check your account")}

    <p style="margin:24px 0 4px;color:#5A6E50;font-size:13px;line-height:1.6;border-top:1px solid #f3f3f3;padding-top:20px;">
      Ready to track your meals, see your score move daily, and get a monthly gut plan? <a href="${SITE_URL}/pricing" style="color:#4CB648;font-weight:600;text-decoration:none;">See membership options →</a>
    </p>
  `)
}

/* ── Route handler ───────────────────────────────────────────────────── */

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json({ skipped: true, reason: "RESEND_API_KEY not set" })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ skipped: true, reason: "Supabase not configured" })
  }

  const resend = new Resend(resendKey)
  const now    = Date.now()
  const HOUR   = 3_600_000

  // Target intervals (hours since signup) and a ±2h window to absorb cron drift
  const SEQUENCE: Array<{ dayLabel: string; minHours: number; maxHours: number }> = [
    { dayLabel: "day1",  minHours:  22, maxHours:  26 },
    { dayLabel: "day3",  minHours:  70, maxHours:  74 },
    { dayLabel: "day7",  minHours: 166, maxHours: 170 },
    { dayLabel: "day14", minHours: 334, maxHours: 338 },
  ]

  let totalSent = 0
  const errors: string[] = []

  for (const seq of SEQUENCE) {
    const minDate = new Date(now - seq.maxHours * HOUR).toISOString()
    const maxDate = new Date(now - seq.minHours * HOUR).toISOString()

    // Fetch profiles created in this window with their lead score data
    const { data: profiles, error: profileError } = await adminSupabase
      .from("profiles")
      .select("id, email, name")
      .gte("created_at", minDate)
      .lte("created_at", maxDate)

    if (profileError) {
      errors.push(`${seq.dayLabel}: profile query error — ${profileError.message}`)
      continue
    }

    if (!profiles || profiles.length === 0) continue

    for (const profile of profiles) {
      try {
        // Get their latest assessment data from leads table
        const { data: lead } = await adminSupabase
          .from("leads")
          .select("overall_score, profile_type, sub_scores")
          .eq("email", profile.email.toLowerCase())
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        const score       = (lead?.overall_score ?? null) as number | null
        const profileType = (lead?.profile_type  ?? null) as string | null
        const subScores   = lead?.sub_scores as Record<string, number> | null

        // Derive weakest pillar
        let weakestPillar: string | null = null
        if (subScores) {
          const pillars = ["diversity", "feeding", "adding", "consistency", "feeling"]
          const sorted  = pillars
            .filter((k) => typeof subScores[k] === "number")
            .sort((a, b) => subScores[a] - subScores[b])
          weakestPillar = sorted[0] ?? null
        }

        let subject = ""
        let html    = ""

        if (seq.dayLabel === "day1") {
          subject = "What your EatoBiotics score actually means"
          html    = day1Email(profile.name ?? "", score, profileType, weakestPillar)
        } else if (seq.dayLabel === "day3") {
          subject = "Day 3 — your action for today"
          html    = day3Email(profile.name ?? "", weakestPillar)
        } else if (seq.dayLabel === "day7") {
          subject = "You've completed your 7-day starter — what's next"
          html    = day7Email(profile.name ?? "", score)
        } else if (seq.dayLabel === "day14") {
          subject = "Two weeks in — your gut has been changing"
          html    = day14Email(profile.name ?? "", score)
        }

        if (subject && html) {
          await resend.emails.send({
            from: `EatoBiotics <${EMAIL_FROM}>`,
            to:   profile.email,
            subject,
            html,
          })
          totalSent++
        }
      } catch (err) {
        errors.push(`${seq.dayLabel} for ${profile.email}: ${String(err)}`)
      }
    }
  }

  return NextResponse.json({ ok: true, sent: totalSent, errors })
}
