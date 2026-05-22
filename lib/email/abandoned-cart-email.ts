interface AbandonedCartEmailOpts {
  name: string | null
  profileType: string | null
  overallScore: number | null
  baseUrl: string
}

export function buildAbandonedCartEmail(opts: AbandonedCartEmailOpts): { subject: string; html: string } {
  const first = (opts.name?.trim().split(/\s+/)[0]) || "there"
  const scoreLine = opts.overallScore != null
    ? `Your Food System Score: <strong>${opts.overallScore}/100</strong>${opts.profileType ? ` — ${opts.profileType}` : ""}.`
    : "Your assessment results are saved and ready when you are."

  const subject = `${first}, your gut-health plan is one step away`
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2a23;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f6f5f1;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e8e5dd;">
          <tr>
            <td style="background:linear-gradient(135deg,#4CB648,#2DAA6E);padding:24px 28px;color:#ffffff;">
              <p style="margin:0;font-size:13px;letter-spacing:0.06em;text-transform:uppercase;opacity:0.85;">EatoBiotics</p>
              <h1 style="margin:6px 0 0;font-family:'Iowan Old Style',Georgia,serif;font-size:24px;line-height:1.2;font-weight:700;">Pick up where you left off</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 14px;font-size:16px;line-height:1.55;">Hi ${first},</p>
              <p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3a4a40;">${scoreLine}</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#3a4a40;">
                We saved your spot. Your detailed report turns this score into a clear, 30-day food-system plan — top foods for your profile, daily actions, and shopping framework. Most people read theirs in 10 minutes and start the next morning.
              </p>
              <p style="margin:0 0 22px;text-align:center;">
                <a href="${opts.baseUrl}/assessment" style="display:inline-block;padding:13px 28px;background:linear-gradient(135deg,#4CB648,#2DAA6E);color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;border-radius:999px;box-shadow:0 4px 12px rgba(45,170,110,0.30);">Continue to my report</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.6;color:#7a8a82;text-align:center;">
                Not ready yet? No worries — your free results stay in your inbox.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px;border-top:1px solid #ebe8df;background:#faf8f3;">
              <p style="margin:0;font-size:11px;line-height:1.5;color:#8a958a;text-align:center;">
                EatoBiotics · educational guidance, not medical advice · <a href="${opts.baseUrl}" style="color:#4CB648;text-decoration:none;">eatobiotics.com</a>
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
