import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"

function magicLinkEmailHtml({ magicUrl, name }: { magicUrl: string; name?: string }) {
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,"
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in to EatoBiotics</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7bc67e,#56C135);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">EatoBiotics</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Your gut health food system</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#111827;font-size:15px;">${greeting}</p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Click the button below to sign in and access your assessment results. This link expires in 60 minutes and can only be used once.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#7bc67e,#56C135);border-radius:12px;">
                    <a href="${magicUrl}" style="display:block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.1px;">
                      Sign in to EatoBiotics →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.5;">
                If you didn't request this link, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                EatoBiotics · Gut health for every body
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

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json() as { email?: string; name?: string }

    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

    // Gracefully skip if not configured (dev environments without keys)
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log("[send-magic-link] Supabase not configured — skipping for:", email)
      return NextResponse.json({ ok: true, skipped: true })
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${siteUrl}/api/auth/callback?next=/account`,
      },
    })

    if (linkError || !data?.properties?.action_link) {
      console.error("[send-magic-link] generateLink error:", linkError?.message)
      return NextResponse.json({ ok: true, skipped: true }) // non-fatal
    }

    const magicUrl = data.properties.action_link

    if (resendKey) {
      const resend = new Resend(resendKey)
      const { error: sendError } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: email,
        subject: "Your EatoBiotics sign-in link",
        html: magicLinkEmailHtml({ magicUrl, name }),
      })
      if (sendError) {
        console.error("[send-magic-link] Resend error:", sendError.message)
      }
    } else {
      console.log("[send-magic-link] RESEND_API_KEY not set — magic link:", magicUrl)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-magic-link] Error:", err)
    return NextResponse.json({ ok: true, skipped: true }) // always non-fatal
  }
}
