// lib/email/paid-report-email.ts
// Builds the HTML email for paid deep assessment reports (starter / full / premium).
// Uses the same inline-styles HTML table pattern as results-email.ts.

interface PaidReportEmailOpts {
  name: string
  tier: "starter" | "full" | "premium"
  overall: number
  profileType: string
  tagline: string
  profileDescription?: string
  subScores: { [key: string]: number }
  topTrigger: string
  topTriggerExplanation: string
  sessionId: string
  pdfUrl: string | null
  ageBracket?: string
}

/* ── Constants ──────────────────────────────────────────────────────── */

const PILLAR_LABELS: Record<string, string> = {
  diversity: "Plant Diversity",
  feeding: "Feeding",
  adding: "Live Foods",
  consistency: "Consistency",
  feeling: "Feeling",
}

const PILLAR_COLORS: Record<string, string> = {
  diversity: "#7fc47e",
  feeding: "#4caf7d",
  adding: "#3ab0a0",
  consistency: "#e6b84a",
  feeling: "#e07b4a",
}

const PILLAR_BG: Record<string, string> = {
  diversity: "#f3faf3",
  feeding: "#f0faf5",
  adding: "#f0f9f8",
  consistency: "#fdf8ee",
  feeling: "#fdf5f0",
}

const TIER_LABELS: Record<string, string> = {
  starter: "Starter Insights",
  full: "Full Report",
  premium: "Premium Report",
}

const TIER_HIGHLIGHTS: Record<string, string[]> = {
  starter: [
    "7-day personalised starter plan",
    "Your top 5 priority foods",
    "Strengths & focus areas analysis",
    "Your key deep insight",
  ],
  full: [
    "7-day personalised starter plan",
    "Your top 5 priority foods",
    "Strengths & focus areas analysis",
    "Your key deep insight",
    "30-day rebuilding roadmap",
    "Pillar-by-pillar deep dives",
    "5 foods chosen specifically for you",
    "Lifestyle & rhythm analysis",
  ],
  premium: [
    "7-day personalised starter plan",
    "Your top 5 priority foods",
    "Strengths & focus areas analysis",
    "Your key deep insight",
    "30-day rebuilding roadmap",
    "Pillar-by-pillar deep dives",
    "5 foods chosen specifically for you",
    "Lifestyle & rhythm analysis",
    "90-day strategy & milestones",
    "Priority map (biggest blocker & builder)",
    "Gut diagnostic analysis",
    "Your system story",
  ],
}

function retestDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 75)
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })
}

/* ── Main export ────────────────────────────────────────────────────── */

export function buildPaidReportEmail(opts: PaidReportEmailOpts): {
  subject: string
  html: string
} {
  const {
    name,
    tier,
    overall,
    profileType,
    tagline,
    profileDescription,
    subScores,
    topTrigger,
    topTriggerExplanation,
    sessionId,
    pdfUrl,
    ageBracket,
  } = opts

  const tierLabel = TIER_LABELS[tier] ?? "Report"
  const subject = `Your EatoBiotics ${tierLabel} is ready, ${name}`

  /* ── Pillar rows ─────────────────────────────────────────────────── */
  const sortedPillars = Object.entries(subScores).sort(([, a], [, b]) => b - a)

  const pillarsHtml = sortedPillars
    .map(([key, score]) => {
      const label = PILLAR_LABELS[key] ?? key
      const color = PILLAR_COLORS[key] ?? "#4caf7d"
      const bg = PILLAR_BG[key] ?? "#f9f9f9"
      const pct = Math.round(score)
      const isStrength = score >= 65
      const badge = isStrength
        ? `<span style="font-size: 10px; font-weight: bold; color: #4caf7d; background: #edf8f0; border-radius: 20px; padding: 2px 8px; margin-left: 6px;">Strength</span>`
        : score < 50
        ? `<span style="font-size: 10px; font-weight: bold; color: #e07b4a; background: #fdf2ec; border-radius: 20px; padding: 2px 8px; margin-left: 6px;">Focus area</span>`
        : ""
      return `
        <tr>
          <td style="padding: 5px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${bg}; border-radius: 10px; border-left: 4px solid ${color}; overflow: hidden;">
              <tr>
                <td style="padding: 10px 14px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="font-size: 13px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">${label}${badge}</td>
                      <td style="text-align: right; font-size: 15px; font-weight: bold; color: ${color}; font-family: Arial, sans-serif; white-space: nowrap;">${pct}<span style="font-size: 11px; color: #aaaaaa;">/100</span></td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top: 6px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="background: #e8e8e8; border-radius: 4px; height: 6px; overflow: hidden;">
                              <div style="background: ${color}; width: ${pct}%; height: 6px; border-radius: 4px;"></div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join("")

  /* ── Report highlights grid ──────────────────────────────────────── */
  const highlights = TIER_HIGHLIGHTS[tier] ?? TIER_HIGHLIGHTS.starter
  // Render as 2-col grid of checkmark items
  const highlightRows: string[] = []
  for (let i = 0; i < highlights.length; i += 2) {
    const left = highlights[i]
    const right = highlights[i + 1]
    highlightRows.push(`
      <tr>
        <td style="padding: 5px 8px; width: 50%; vertical-align: top; font-size: 13px; color: #333333; font-family: Arial, sans-serif;">
          <span style="color: #4caf7d; font-weight: bold; margin-right: 6px;">✓</span>${left}
        </td>
        <td style="padding: 5px 8px; width: 50%; vertical-align: top; font-size: 13px; color: #333333; font-family: Arial, sans-serif;">
          ${right ? `<span style="color: #4caf7d; font-weight: bold; margin-right: 6px;">✓</span>${right}` : ""}
        </td>
      </tr>`)
  }
  const highlightsHtml = highlightRows.join("")

  /* ── Optional blocks ─────────────────────────────────────────────── */
  const ageBracketLine = ageBracket
    ? `<p style="margin: 4px 0 0; font-size: 13px; color: #888888; font-family: Arial, sans-serif;">Age bracket: ${ageBracket}</p>`
    : ""

  const profileDescHtml = profileDescription
    ? `<p style="margin: 12px 0 0; font-size: 14px; color: #555555; font-family: Arial, sans-serif; line-height: 1.6; font-style: italic;">${profileDescription}</p>`
    : ""

  const pdfNoteHtml = pdfUrl
    ? `<p style="margin: 0; font-size: 13px; color: #555555; font-family: Arial, sans-serif;">
        📎 Your full PDF report is attached to this email.
      </p>`
    : `<p style="margin: 0; font-size: 13px; color: #555555; font-family: Arial, sans-serif;">
        📎 Your PDF report is being prepared and will be emailed to you shortly.
      </p>`

  const retestDateStr = retestDate()
  const reportUrl = `https://eatobiotics.com/assessment/report?session_id=${sessionId}`

  /* ── HTML assembly ───────────────────────────────────────────────── */
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f0; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); padding: 28px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.8); font-family: Arial, sans-serif;">EatoBiotics</p>
              <h1 style="margin: 0; font-size: 26px; font-weight: bold; color: #ffffff; font-family: Georgia, serif;">Your ${tierLabel} Report is Ready</h1>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 40px 0; text-align: center;">
              <p style="margin: 0; font-size: 15px; color: #444444; font-family: Arial, sans-serif; line-height: 1.6;">
                Hi <strong style="color: #222222;">${name}!</strong> Your personalised report has been generated.
              </p>
              ${ageBracketLine}
            </td>
          </tr>

          <!-- Score hero -->
          <tr>
            <td style="padding: 20px 40px 0; text-align: center;">
              <div style="margin: 0 auto;">
                <p style="margin: 0; font-size: 76px; font-weight: bold; color: #222222; line-height: 1; font-family: Georgia, serif;">${overall}<span style="font-size: 30px; color: #aaaaaa;">/100</span></p>
              </div>
              <p style="margin: 10px 0 4px; font-size: 20px; font-weight: bold; color: #3ab0a0; font-family: Georgia, serif;">${profileType}</p>
              <p style="margin: 0 0 4px; font-size: 14px; color: #666666; font-family: Arial, sans-serif; font-style: italic;">${tagline}</p>
              ${profileDescHtml}
            </td>
          </tr>

          <!-- Deep Insight callout -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0f9f8; border-left: 4px solid #3ab0a0; border-radius: 0 10px 10px 0; border: 1px solid #c5e8e5; border-left: 4px solid #3ab0a0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px; font-size: 10px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; color: #3ab0a0; font-family: Arial, sans-serif;">🔍 Your Key Insight</p>
                    <p style="margin: 0 0 8px; font-size: 15px; font-weight: bold; color: #222222; font-family: Georgia, serif; line-height: 1.5;">${topTrigger}</p>
                    <p style="margin: 0; font-size: 13px; color: #444444; font-family: Arial, sans-serif; line-height: 1.6;">${topTriggerExplanation}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>

          <!-- Your 5 Pillars -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">Your 5 Pillars</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${pillarsHtml}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>

          <!-- What's in your report -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">What's in Your Report</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f7f7f7; border-radius: 10px;">
                <tr>
                  <td style="padding: 16px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      ${highlightsHtml}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA button -->
          <tr>
            <td style="padding: 32px 40px 0; text-align: center;">
              <a href="${reportUrl}" style="display: inline-block; background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif; padding: 14px 32px; border-radius: 50px;">View Your Full Report →</a>
            </td>
          </tr>

          <!-- PDF note box -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f7f7f7; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    ${pdfNoteHtml}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Retest nudge -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f7f7f7; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; color: #666666; font-family: Arial, sans-serif;">
                      📅 <strong style="color: #333333;">Recommended retest:</strong> ${retestDateStr} — give your habits 75 days to compound, then measure your progress.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mission note -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <div style="background: #f9fdf9; border-left: 3px solid #4caf7d; border-radius: 8px; padding: 16px 20px;">
                <p style="margin: 0; font-size: 13px; color: #555555; font-family: Arial, sans-serif; line-height: 1.6;">
                  <strong style="color: #333333;">Build the food system inside you — and help build the food system around you.</strong><br />
                  Every EatoBiotics report supports the wider EatoSystem mission: a connected, seasonal food future for every community.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; padding: 20px 40px; margin-top: 24px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">© EatoBiotics · <a href="https://eatobiotics.com" style="color: #aaaaaa;">eatobiotics.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #cccccc; font-family: Arial, sans-serif;">This assessment is for educational purposes and is not medical advice.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
