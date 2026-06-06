interface Glp1ReminderEmailOpts {
  name?: string | null
  /** Consecutive days the member has logged, for a little momentum nudge. */
  streak?: number
  baseUrl: string
}

/**
 * Gentle daily nudge for GLP-1 Companion members who haven't logged today.
 * Plain, table-based HTML for broad email-client support.
 */
export function buildGlp1ReminderEmail(opts: Glp1ReminderEmailOpts): { subject: string; html: string } {
  const { name, streak = 0, baseUrl } = opts
  const firstName = name ? name.split(" ")[0] : null
  const link = `${baseUrl}/account/glp1`

  const subject = streak > 1
    ? `Keep your ${streak}-day streak — log today's protein`
    : "Did you hit your protein today?"

  const streakLine = streak > 1
    ? `<p style="margin: 0 0 16px; font-size: 15px; color: #555555; font-family: Arial, sans-serif;">You're on a <strong style="color:#2e8c2a;">${streak}-day streak</strong>. A quick log keeps it alive.</p>`
    : ""

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f8f0; padding: 24px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border-radius: 16px; overflow:hidden; box-shadow: 0 2px 12px rgba(26,46,18,0.08);">
        <tr><td style="height:5px; background: linear-gradient(90deg,#e6b84a,#e07b4a,#2e8c2a);"></td></tr>
        <tr><td style="padding: 28px 32px;">
          <p style="margin:0 0 4px; font-size:11px; font-weight:bold; letter-spacing:1.5px; text-transform:uppercase; color:#e07b4a; font-family: Arial, sans-serif;">GLP-1 Companion</p>
          <h1 style="margin:0 0 12px; font-size:22px; color:#1a2e12; font-family: Georgia, serif;">${firstName ? `${firstName}, did you log today?` : "Did you log today?"}</h1>
          <p style="margin:0 0 16px; font-size:15px; line-height:1.5; color:#555555; font-family: Arial, sans-serif;">
            A few seconds to log your protein keeps your muscle-protecting target on track while you're on your medication. Your weight trend stays accurate when you log consistently.
          </p>
          ${streakLine}
          <table cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 4px;">
            <tr><td style="border-radius: 999px; background: linear-gradient(135deg,#2e8c2a,#0a7d6b);">
              <a href="${link}" style="display:inline-block; padding: 13px 28px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; font-family: Arial, sans-serif;">Log today &rarr;</a>
            </td></tr>
          </table>
          <p style="margin:18px 0 0; font-size:12px; color:#999999; font-family: Arial, sans-serif;">
            Educational tracking, not medical advice. Follow the guidance of the clinician managing your care.
          </p>
        </td></tr>
      </table>
      <p style="margin:14px 0 0; font-size:11px; color:#aaaaaa; font-family: Arial, sans-serif;">EatoBiotics · You receive this because you use the GLP-1 Companion.</p>
    </td></tr>
  </table>`

  return { subject, html }
}
