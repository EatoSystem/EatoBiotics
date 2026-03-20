interface ResultsEmailOpts {
  name: string
  overall: number
  profileType: string
  tagline: string
  subScores: { [key: string]: number }
  nextActions: string[]
}

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

function scoreBar(score: number): string {
  const filled = Math.round(score / 10)
  const empty = 10 - filled
  return "▓".repeat(filled) + "░".repeat(empty)
}

export function buildResultsEmail(opts: ResultsEmailOpts): {
  subject: string
  html: string
} {
  const { name, overall, profileType, tagline, subScores, nextActions } = opts

  const subject = `Your EatoBiotics Score: ${overall}/100 — ${profileType}`

  const pillarsHtml = Object.entries(subScores)
    .sort(([, a], [, b]) => b - a)
    .map(([key, score]) => {
      const label = PILLAR_LABELS[key] ?? key
      const color = PILLAR_COLORS[key] ?? "#4caf7d"
      const bar = scoreBar(score)
      return `
        <tr>
          <td style="padding: 6px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="font-size: 13px; color: #555555; font-family: Arial, sans-serif; width: 140px;">${label}</td>
                <td style="font-size: 12px; font-family: 'Courier New', monospace; color: ${color}; letter-spacing: 1px;">${bar}</td>
                <td style="font-size: 13px; font-weight: bold; color: #222222; font-family: Arial, sans-serif; text-align: right; white-space: nowrap;">${score}/100</td>
              </tr>
            </table>
          </td>
        </tr>`
    })
    .join("")

  const actionsHtml = nextActions
    .slice(0, 3)
    .map(
      (action, i) => `
        <tr>
          <td style="padding: 8px 0; vertical-align: top;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="width: 28px; vertical-align: top; padding-top: 1px;">
                  <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #7fc47e, #3ab0a0); border-radius: 50%; text-align: center; line-height: 22px; font-size: 12px; font-weight: bold; color: white; font-family: Arial, sans-serif;">${i + 1}</span>
                </td>
                <td style="font-size: 14px; color: #333333; font-family: Arial, sans-serif; line-height: 1.5; padding-left: 10px;">${action}</td>
              </tr>
            </table>
          </td>
        </tr>`
    )
    .join("")

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
            <td style="background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.8); font-family: Arial, sans-serif;">EatoBiotics</p>
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #ffffff; font-family: Georgia, serif;">Your Food System Score</h1>
            </td>
          </tr>

          <!-- Score hero -->
          <tr>
            <td style="padding: 40px 40px 0; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 15px; color: #666666; font-family: Arial, sans-serif;">Hi ${name}, your assessment is ready.</p>
              <div style="display: inline-block; margin: 16px auto;">
                <p style="margin: 0; font-size: 72px; font-weight: bold; color: #222222; line-height: 1; font-family: Georgia, serif;">${overall}<span style="font-size: 32px; color: #999999;">/100</span></p>
              </div>
              <p style="margin: 8px 0 4px; font-size: 18px; font-weight: bold; color: #3ab0a0; font-family: Georgia, serif;">${profileType}</p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #666666; font-family: Arial, sans-serif; font-style: italic;">${tagline}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" />
            </td>
          </tr>

          <!-- Pillar scores -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">Your 5 Pillars</p>
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

          <!-- Next actions -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 16px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">Your Next 3 Actions</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${actionsHtml}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 20px; font-size: 16px; color: #333333; font-family: Georgia, serif; font-style: italic;">Ready to see exactly what to eat, what to add, and a plan to get there?</p>
              <a href="https://eatobiotics.com/assessment" style="display: inline-block; background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif; padding: 14px 32px; border-radius: 50px;">Unlock Your Full Report →</a>
            </td>
          </tr>

          <!-- Mission note -->
          <tr>
            <td style="padding: 0 40px 24px;">
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
            <td style="background: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #eeeeee;">
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
