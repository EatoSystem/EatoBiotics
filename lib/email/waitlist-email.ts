/**
 * Branded confirmation email sent when someone joins the EatoBiotics waitlist.
 * Mirrors the gradient-header style used by the magic-link / results emails.
 */
import { unsubscribeUrl } from "./unsubscribe"

export function waitlistConfirmationEmail(email?: string): { subject: string; html: string } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
  const subject = "You're on the EatoBiotics waitlist 🌱"
  const unsubLink = email
    ? ` &middot; <a href="${unsubscribeUrl(email)}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>`
    : ""

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623);padding:40px 40px;text-align:center;">
              <div style="font-size:34px;margin-bottom:10px;">🌱</div>
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">You&rsquo;re on the list</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.92);font-size:14px;">The Food System Inside You</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;color:#1A2E12;font-size:18px;font-weight:600;">Welcome to EatoBiotics 👋</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.65;">
                Thank you for joining the waitlist. You&rsquo;re now first in line for early access to
                the EatoBiotics assessment, your personal report, AI meal scoring, recipes, and
                membership. We&rsquo;ll email you the moment it opens.
              </p>

              <!-- What's coming -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:0 4px 8px 0;width:33%;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 8px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:6px;">📊</div>
                      <p style="margin:0;font-size:11px;font-weight:600;color:#15803d;">Your score</p>
                    </div>
                  </td>
                  <td style="padding:0 4px 8px;width:33%;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 8px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:6px;">🍽️</div>
                      <p style="margin:0;font-size:11px;font-weight:600;color:#15803d;">Meal scoring</p>
                    </div>
                  </td>
                  <td style="padding:0 0 8px 4px;width:33%;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 8px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:6px;">🌿</div>
                      <p style="margin:0;font-size:11px;font-weight:600;color:#15803d;">Recipes</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 6px;color:#1A2E12;font-size:15px;font-weight:600;font-style:italic;line-height:1.6;">
                &ldquo;EatoBiotics is built to help individuals and families eat optimal for health,
                community, and environment.&rdquo;
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;">— A note from the founder</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;">EatoBiotics</p>
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                The Food System Inside You &middot;
                <a href="${siteUrl}" style="color:#9ca3af;text-decoration:none;">eatobiotics.com</a>${unsubLink}
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
