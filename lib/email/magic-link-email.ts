import { renderBrandEmail, BRAND_GRADIENT, BRAND_GREEN, BRAND_INK, BRAND_MUTED, SERIF, SANS } from "./brand-layout"

/**
 * Branded magic-link sign-in email. Uses the shared EatoBiotics email shell.
 */
export function buildMagicLinkEmail({ magicUrl, name }: { magicUrl: string; name?: string }): {
  subject: string
  html: string
} {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"
  const subject = "Your EatoBiotics sign-in link"

  const pill = (emoji: string, label: string, pad: string) => `
    <td style="${pad}width:33%;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 8px;text-align:center;">
        <div style="font-size:20px;margin-bottom:5px;">${emoji}</div>
        <p style="margin:0;font-size:11px;font-weight:bold;color:#15803d;font-family:${SANS};">${label}</p>
      </div>
    </td>`

  const contentHtml = `
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding:36px 40px 0;">
          <p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:${BRAND_INK};font-family:${SERIF};">${greeting}</p>
          <p style="margin:0 0 28px;font-size:15px;color:${BRAND_MUTED};line-height:1.65;font-family:${SANS};">
            Here&rsquo;s your sign-in link for EatoBiotics &mdash; your personalised food system health app. Tap below to access your account.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
            <tr>
              ${pill("📊", "Your gut score", "padding:0 4px 0 0;")}
              ${pill("🌱", "Food recommendations", "padding:0 4px;")}
              ${pill("🔬", "Food system insights", "padding:0 0 0 4px;")}
            </tr>
          </table>

          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 26px;">
            <tr>
              <td style="background-color:${BRAND_GREEN};background-image:${BRAND_GRADIENT};border-radius:50px;">
                <a href="${magicUrl}" style="display:block;padding:15px 40px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;font-family:${SANS};">
                  Sign in to EatoBiotics →
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 6px;font-size:13px;color:${BRAND_MUTED};line-height:1.5;text-align:center;font-family:${SANS};">
            This link expires in <strong>60 minutes</strong> and can only be used once.
          </p>
          <p style="margin:0 0 4px;font-size:12px;color:#9aa896;line-height:1.5;text-align:center;font-family:${SANS};">
            If you didn&rsquo;t request this, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>`

  const html = renderBrandEmail({
    subject,
    preheader: "Your secure sign-in link for EatoBiotics (expires in 60 minutes).",
    contentHtml,
  })

  return { subject, html }
}
