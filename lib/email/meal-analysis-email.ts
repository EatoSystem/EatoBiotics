interface MealAnalysisEmailOpts {
  name?: string
  email: string
  mealName?: string
  score: number
  prebioticScore?: number
  probioticScore?: number
  postbioticScore?: number
  whatThisMealDoes?: string
  suggestions?: string[]
  shareHash?: string
}

function scoreBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Exceptional",       color: "#4caf7d" }
  if (score >= 65) return { label: "Strong Foundation", color: "#7fc47e" }
  if (score >= 50) return { label: "Good Start",        color: "#e6b84a" }
  if (score >= 35) return { label: "Getting There",     color: "#e07b4a" }
  return              { label: "Starting Out",       color: "#ef5350" }
}

function bioticBar(label: string, icon: string, score: number | undefined, color: string, bg: string): string {
  if (score === undefined) return ""
  const pct = Math.round(score)
  const statusLabel = pct >= 70 ? "Strong" : pct >= 50 ? "Moderate" : pct >= 30 ? "Building" : "Low"
  return `
    <tr>
      <td style="padding: 5px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${bg}; border-radius: 10px; padding: 10px 14px;">
          <tr>
            <td style="font-size: 13px; font-weight: bold; color: #333333; font-family: Arial, sans-serif; width: 24px;">${icon}</td>
            <td style="font-size: 13px; font-weight: bold; color: #333333; font-family: Arial, sans-serif;">${label}</td>
            <td style="text-align: right; font-size: 13px; font-weight: bold; color: ${color}; font-family: Arial, sans-serif; white-space: nowrap;">${statusLabel} &nbsp; ${pct}<span style="font-size: 11px; color: #aaaaaa;">/100</span></td>
          </tr>
          <tr>
            <td colspan="3" style="padding-top: 6px;">
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
    </tr>`
}

export function buildMealAnalysisEmail(opts: MealAnalysisEmailOpts): { subject: string; html: string } {
  const {
    name,
    mealName,
    score,
    prebioticScore,
    probioticScore,
    postbioticScore,
    whatThisMealDoes,
    suggestions = [],
    shareHash,
  } = opts

  const greeting = name ? name : "there"
  const displayMeal = mealName ?? "your meal"
  const band = scoreBand(score)

  const subject = `EatoBiotics - Your Meal Analysis`

  const bioticBarsHtml = [
    bioticBar("Prebiotics",  "🌱", prebioticScore,  "#7fc47e", "#f3faf3"),
    bioticBar("Probiotics",  "🦠", probioticScore,  "#3ab0a0", "#f0f9f8"),
    bioticBar("Postbiotics", "✨", postbioticScore, "#4caf7d", "#f0faf5"),
  ].join("")

  const whatItDoesHtml = whatThisMealDoes ? `
    <!-- What this meal does well -->
    <tr>
      <td style="padding: 24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0faf5; border-left: 4px solid #4caf7d; border-radius: 0 10px 10px 0; padding: 16px 20px;">
          <tr>
            <td>
              <p style="margin: 0 0 6px; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #4caf7d; font-family: Arial, sans-serif;">✨ What this meal does well</p>
              <p style="margin: 0; font-size: 14px; color: #444444; font-family: Arial, sans-serif; line-height: 1.6;">${whatThisMealDoes}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : ""

  const suggestionsHtml = suggestions.length > 0 ? `
    <!-- Suggestions -->
    <tr>
      <td style="padding: 24px 40px 0;">
        <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">How to boost this meal</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${suggestions.slice(0, 3).map((s, i) => `
          <tr>
            <td style="padding: 6px 0; vertical-align: top;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 32px; vertical-align: top; padding-top: 1px;">
                    <span style="display: inline-block; width: 26px; height: 26px; background: linear-gradient(135deg, #7fc47e, #3ab0a0); border-radius: 50%; text-align: center; line-height: 26px; font-size: 13px; font-weight: bold; color: white; font-family: Arial, sans-serif;">${i + 1}</span>
                  </td>
                  <td style="font-size: 14px; color: #333333; font-family: Arial, sans-serif; line-height: 1.6; padding-left: 10px;">${s}</td>
                </tr>
              </table>
            </td>
          </tr>`).join("")}
        </table>
      </td>
    </tr>` : ""

  const shareUrl = shareHash
    ? `https://eatobiotics.com/analyse/result/${shareHash}`
    : "https://eatobiotics.com/analyse"

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
              <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #ffffff; font-family: Georgia, serif;">Your Meal Analysis</h1>
            </td>
          </tr>

          <!-- Score hero -->
          <tr>
            <td style="padding: 36px 40px 0; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 15px; color: #666666; font-family: Arial, sans-serif;">Hi ${greeting}, here are your results for</p>
              <p style="margin: 4px 0 0; font-size: 17px; font-weight: bold; color: #222222; font-family: Georgia, serif;">${displayMeal}</p>
              <div style="margin: 20px auto 0;">
                <p style="margin: 0; font-size: 80px; font-weight: bold; color: ${band.color}; line-height: 1; font-family: Georgia, serif;">${score}<span style="font-size: 30px; color: #aaaaaa;">/100</span></p>
              </div>
              <p style="margin: 10px 0 0; font-size: 18px; font-weight: bold; color: ${band.color}; font-family: Georgia, serif;">${band.label}</p>
            </td>
          </tr>

          <!-- Divider -->
          <tr><td style="padding: 24px 40px 0;"><hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" /></td></tr>

          <!-- Biotic scores -->
          <tr>
            <td style="padding: 24px 40px 0;">
              <p style="margin: 0 0 12px; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; color: #999999; font-family: Arial, sans-serif;">Your 3 Biotics</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                ${bioticBarsHtml}
              </table>
            </td>
          </tr>

          ${whatItDoesHtml}

          <!-- Divider -->
          <tr><td style="padding: 24px 40px 0;"><hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" /></td></tr>

          ${suggestionsHtml}

          <!-- Divider -->
          <tr><td style="padding: 24px 40px 0;"><hr style="border: none; border-top: 1px solid #eeeeee; margin: 0;" /></td></tr>

          <!-- Assessment CTA -->
          <tr>
            <td style="padding: 32px 40px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #3ab0a0; font-family: Arial, sans-serif;">Take the next step</p>
              <h2 style="margin: 0 0 12px; font-size: 26px; font-weight: bold; color: #222222; font-family: Georgia, serif; line-height: 1.3;">The Food System<br/>Inside You</h2>
              <p style="margin: 0 0 20px; font-size: 14px; color: #555555; font-family: Arial, sans-serif; line-height: 1.7; max-width: 440px; margin-left: auto; margin-right: auto;">
                A 15-question assessment revealing how well you&rsquo;re feeding your gut microbiome &mdash; scored across five pillars with a personalised 7-day action plan sent to your inbox.
              </p>
              <a href="https://eatobiotics.com/assessment"
                 style="display: inline-block; background: linear-gradient(135deg, #7fc47e 0%, #3ab0a0 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: bold; font-family: Arial, sans-serif; padding: 16px 36px; border-radius: 50px;">
                Get My Free Biotics Score →
              </a>
              <p style="margin: 12px 0 0; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">Free · 3 minutes · No account needed</p>
            </td>
          </tr>

          <!-- Share nudge -->
          <tr>
            <td style="padding: 0 40px 24px; text-align: center;">
              <a href="${shareUrl}"
                 style="display: inline-block; border: 1.5px solid #4caf7d; color: #4caf7d; text-decoration: none; font-size: 13px; font-weight: bold; font-family: Arial, sans-serif; padding: 10px 24px; border-radius: 50px;">
                View &amp; share your result →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9f9f9; padding: 20px 40px; text-align: center; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #aaaaaa; font-family: Arial, sans-serif;">© EatoBiotics · <a href="https://eatobiotics.com" style="color: #aaaaaa; text-decoration: none;">eatobiotics.com</a></p>
              <p style="margin: 0; font-size: 11px; color: #cccccc; font-family: Arial, sans-serif;">For educational purposes only — not medical advice.</p>
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
