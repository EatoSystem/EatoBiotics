import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

// Map report titles to their demo URLs
const REPORT_URL_MAP: Record<string, string> = {
  "The Food System Inside You": "/report-you",
  "The Food System Inside Your Family": "/report-family",
  "The Food System Inside Your Mind": "/report-mind",
}

export async function POST(req: NextRequest) {
  try {
    const { email, reportTitle } = (await req.json()) as {
      email?: string
      reportTitle?: string
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 })
    }

    const title = reportTitle ?? "The Food System Inside You"
    const slug = REPORT_URL_MAP[title] ?? "/report-you"
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
    const reportUrl = `${baseUrl}${slug}`
    const assessmentUrl = `${baseUrl}/assessment`

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your EatoBiotics Sample Report</title>
</head>
<body style="margin:0;padding:0;background:#f6f9f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f9f3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4ade80,#14b8a6);border-radius:20px 20px 0 0;padding:40px 40px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.7);">
                EatoBiotics — Sample Report
              </p>
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#ffffff;line-height:1.3;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 20px 20px;">

              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Here's your link to the EatoBiotics sample report you were reading. Open it any time to review the full breakdown, 7-day plan, food prescription, and 30-day roadmap.
              </p>

              <!-- View Report Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(90deg,#84cc16,#22c55e,#14b8a6);border-radius:50px;padding:16px 36px;text-align:center;">
                    <a href="${reportUrl}" style="color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                      View Sample Report →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 28px;" />

              <!-- Personalised nudge -->
              <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">
                Want your own personalised report?
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
                This sample shows what an EatoBiotics report looks like — but your real report is built from your own assessment answers. Different scores, different insights, different plan. It takes about 5 minutes and the score is free.
              </p>

              <!-- Assessment Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:#f0fdf4;border:2px solid #22c55e;border-radius:50px;padding:14px 32px;text-align:center;">
                    <a href="${assessmentUrl}" style="color:#16a34a;font-size:15px;font-weight:700;text-decoration:none;display:block;">
                      Start Free Assessment →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's in your report -->
              <div style="background:#f8fafc;border-radius:16px;padding:24px;margin-bottom:24px;">
                <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;">
                  Your report includes
                </p>
                ${[
                  ["🧬", "Prebiotics · Probiotics · Postbiotics scores"],
                  ["🪪", "Your personal gut health profile type"],
                  ["📅", "A personalised 7-day starter plan"],
                  ["🛒", "5 foods chosen specifically for your scores"],
                  ["🗓️", "A full 30-day gut reset roadmap"],
                ].map(([icon, text]) => `
                <p style="margin:0 0 8px;font-size:14px;color:#374151;">
                  ${icon} &nbsp;${text}
                </p>`).join("")}
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                EatoBiotics · The Food System Inside You<br />
                You received this because you requested it from the sample report page.<br />
                <a href="${baseUrl}" style="color:#9ca3af;">eatobiotics.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
    const ownerEmail = process.env.OWNER_EMAIL

    if (resendKey) {
      const resend = new Resend(resendKey)
      const { error } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: email,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject: `Your EatoBiotics Sample Report — ${title}`,
        html,
      })
      if (error) {
        console.error("[email-sample-report] Resend error:", error.message)
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
      }
    } else {
      // Dev: log instead of sending
      console.log(`[email-sample-report] Would send to ${email} — RESEND_API_KEY not set`)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[email-sample-report]", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
