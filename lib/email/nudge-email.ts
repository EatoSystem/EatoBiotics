interface NudgeEmailOpts {
  name: string | null
  mealsLoggedThisWeek: number
  bestScoreThisWeek: number | null
  currentStreak: number
  weeklyCheckinContent: string | null
  membershipTier: string
  baseUrl: string
  weakestPillar: string | null
  weakestPillarAction: string | null
}

function scoreColor(score: number): string {
  if (score >= 70) return "#4caf7d"
  if (score >= 50) return "#e6b84a"
  return "#e07b4a"
}

function tierLabel(tier: string): string {
  if (tier === "transform") return "Transform"
  if (tier === "restore")   return "Restore"
  if (tier === "grow")      return "Grow"
  return "Free"
}

function streakPhrase(streak: number): string {
  if (streak === 0) return "No active streak — this is a great week to start one."
  if (streak === 1) return "You&apos;re on a 1-day streak. Keep it going tomorrow."
  if (streak < 7)  return `You&apos;re on a ${streak}-day streak. Keep the momentum.`
  if (streak < 14) return `${streak}-day streak — that&apos;s a full week of consistency.`
  return `${streak}-day streak — impressive commitment.`
}

function mealsPhrase(count: number): string {
  if (count === 0) return "No meals logged yet this week."
  if (count === 1) return "1 meal logged this week — every log counts."
  if (count < 5)  return `${count} meals logged this week.`
  return `${count} meals logged this week — great consistency.`
}

export function buildNudgeEmail(opts: NudgeEmailOpts): { subject: string; html: string } {
  const { name, mealsLoggedThisWeek, bestScoreThisWeek, currentStreak, weeklyCheckinContent, membershipTier, baseUrl, weakestPillar, weakestPillarAction } = opts

  const PILLAR_DISPLAY_NAMES: Record<string, string> = {
    adding: "Live Foods", diversity: "Plant Diversity", feeding: "Feeding",
    consistency: "Consistency", feeling: "Body Awareness",
  }

  const pillarDisplayName = weakestPillar ? (PILLAR_DISPLAY_NAMES[weakestPillar] ?? weakestPillar) : null

  const focusBlock = (weakestPillar && weakestPillarAction && pillarDisplayName)
    ? `<tr><td style="padding:0 0 20px;">
        <div style="border-left:3px solid #4CB648;background:#f0fdf4;border-radius:0 10px 10px 0;padding:14px 16px;">
          <p style="margin:0 0 5px;font-size:11px;font-weight:700;color:#4CB648;text-transform:uppercase;letter-spacing:1px;">This week&apos;s focus &mdash; ${pillarDisplayName}</p>
          <p style="margin:0;font-size:14px;color:#1A2E12;line-height:1.6;">${weakestPillarAction}</p>
        </div>
      </td></tr>`
    : ""

  const firstName = name?.split(" ")[0] ?? null
  const greeting  = firstName ? `Hi ${firstName},` : "Hi there,"

  const subject =
    mealsLoggedThisWeek > 0
      ? `Your EatoBiotics week — ${mealsLoggedThisWeek} meal${mealsLoggedThisWeek !== 1 ? "s" : ""} logged${bestScoreThisWeek != null ? `, best score ${bestScoreThisWeek}` : ""}`
      : "Your gut deserves a check-in this week"

  const ctaHref  = `${baseUrl}/analyse`
  const dashHref = `${baseUrl}/account`

  const scoreBlock =
    bestScoreThisWeek != null
      ? `
        <tr>
          <td style="padding: 0 0 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px; background:#f8faf8; border:1px solid #e8f0e8;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#888;">Best biotics score this week</p>
                  <p style="margin:0; font-size:36px; font-weight:700; color:${scoreColor(bestScoreThisWeek)}; font-family:Georgia, serif;">${bestScoreThisWeek}<span style="font-size:18px; color:#aaa;">/100</span></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : ""

  const checkinBlock =
    weeklyCheckinContent
      ? `
        <tr>
          <td style="padding: 0 0 20px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:16px; background:#f0f9f5; border:1px solid #c8e8d8; border-left:4px solid #4caf7d;">
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0 0 8px 0; font-size:11px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#4caf7d;">Your weekly check-in</p>
                  <p style="margin:0; font-size:14px; line-height:1.7; color:#374151;">${weeklyCheckinContent.replace(/\n/g, "<br/>")}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : ""

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0; padding:0; background:#f5f5f0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0; padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding:0 0 24px 0; text-align:center;">
              <a href="${baseUrl}" style="text-decoration:none;">
                <span style="font-family:Georgia,serif; font-size:22px; font-weight:700; color:#1a2e1a; letter-spacing:-0.02em;">EatoBiotics</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff; border-radius:24px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06);">

              <!-- Top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height:4px; background:linear-gradient(90deg,#a3d977,#4caf7d,#3ab0a0);"></td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:32px 32px 8px 32px;">
                    <p style="margin:0 0 6px 0; font-size:13px; font-weight:600; color:#888; text-transform:uppercase; letter-spacing:0.06em;">${tierLabel(membershipTier)} member</p>
                    <h1 style="margin:0 0 16px 0; font-family:Georgia,serif; font-size:26px; font-weight:700; color:#1a2e1a; line-height:1.2;">Your week in food</h1>
                    <p style="margin:0 0 24px 0; font-size:15px; color:#374151; line-height:1.6;">${greeting}</p>
                  </td>
                </tr>

                <!-- Stats row -->
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-right:8px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px; background:#fafafa; border:1px solid #ebebeb;">
                            <tr>
                              <td style="padding:16px;">
                                <p style="margin:0 0 4px 0; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#999;">Meals logged</p>
                                <p style="margin:0; font-size:28px; font-weight:700; color:#1a2e1a; font-family:Georgia,serif;">${mealsLoggedThisWeek}</p>
                                <p style="margin:4px 0 0 0; font-size:11px; color:#999;">this week</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td width="50%" style="padding-left:8px;">
                          <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:14px; background:#fafafa; border:1px solid #ebebeb;">
                            <tr>
                              <td style="padding:16px;">
                                <p style="margin:0 0 4px 0; font-size:10px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#999;">Current streak</p>
                                <p style="margin:0; font-size:28px; font-weight:700; color:#1a2e1a; font-family:Georgia,serif;">${currentStreak}</p>
                                <p style="margin:4px 0 0 0; font-size:11px; color:#999;">day${currentStreak !== 1 ? "s" : ""}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Score block (if available) -->
                ${scoreBlock ? `<tr><td style="padding:0 32px 0 32px;"><table width="100%" cellpadding="0" cellspacing="0">${scoreBlock}</table></td></tr>` : ""}

                <!-- Streak / meals summary -->
                <tr>
                  <td style="padding:0 32px 24px 32px;">
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.65;">
                      ${mealsPhrase(mealsLoggedThisWeek)}<br/>
                      ${streakPhrase(currentStreak)}
                    </p>
                  </td>
                </tr>

                <!-- Weekly check-in (Transform only) -->
                ${checkinBlock ? `<tr><td style="padding:0 32px 0 32px;"><table width="100%" cellpadding="0" cellspacing="0">${checkinBlock}</table></td></tr>` : ""}

                <!-- Focus pillar block -->
                ${focusBlock ? `<tr><td style="padding:0 32px 0 32px;"><table width="100%" cellpadding="0" cellspacing="0">${focusBlock}</table></td></tr>` : ""}

                <!-- CTA -->
                <tr>
                  <td style="padding:${checkinBlock ? "24px" : "8px"} 32px 32px 32px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="border-radius:100px; background:linear-gradient(135deg,#a3d977,#4caf7d);">
                          <a href="${ctaHref}" style="display:inline-block; padding:14px 28px; font-size:14px; font-weight:700; color:#ffffff; text-decoration:none; letter-spacing:0.01em;">Log a Meal &rarr;</a>
                        </td>
                        <td style="width:12px;"></td>
                        <td>
                          <a href="${dashHref}" style="display:inline-block; padding:14px 20px; font-size:14px; font-weight:600; color:#4caf7d; text-decoration:none;">Dashboard</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 8px 0 8px; text-align:center;">
              <p style="margin:0 0 8px 0; font-size:12px; color:#aaa; line-height:1.6;">
                You&apos;re receiving this because you&apos;re an EatoBiotics member.<br/>
                <a href="${baseUrl}/account" style="color:#aaa; text-decoration:underline;">Manage your account</a>
              </p>
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
