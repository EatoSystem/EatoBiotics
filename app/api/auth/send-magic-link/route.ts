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
            <td style="background:linear-gradient(135deg,#7bc67e,#56C135);padding:36px 40px;text-align:center;">
              <div style="font-size:32px;margin-bottom:12px;">🌿</div>
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">EatoBiotics</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.9);font-size:14px;letter-spacing:0.1px;">The Food System Inside You</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 6px;color:#111827;font-size:16px;font-weight:600;">${greeting}</p>
              <p style="margin:0 0 28px;color:#374151;font-size:15px;line-height:1.65;">
                Here&rsquo;s your sign-in link for EatoBiotics &mdash; your personalised food system health app. Click below to access your account.
              </p>
              <!-- Context pills -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:0 4px 0 0;width:33%;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 8px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:5px;">📊</div>
                      <p style="margin:0;font-size:11px;font-weight:600;color:#15803d;">Your gut score</p>
                    </div>
                  </td>
                  <td style="padding:0 4px;width:33%;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 8px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:5px;">🌱</div>
                      <p style="margin:0;font-size:11px;font-weight:600;color:#15803d;">Food recommendations</p>
                    </div>
                  </td>
                  <td style="padding:0 0 0 4px;width:33%;">
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px 8px;text-align:center;">
                      <div style="font-size:20px;margin-bottom:5px;">🔬</div>
                      <p style="margin:0;font-size:11px;font-weight:600;color:#15803d;">Food system insights</p>
                    </div>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#7bc67e,#56C135);border-radius:12px;">
                    <a href="${magicUrl}" style="display:block;padding:15px 36px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.1px;">
                      Sign in to EatoBiotics →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;color:#6b7280;font-size:13px;line-height:1.5;text-align:center;">
                This link expires in <strong>60 minutes</strong> and can only be used once.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;text-align:center;">
                If you didn&rsquo;t request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0 0 4px;color:#6b7280;font-size:12px;font-weight:600;">EatoBiotics</p>
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                The Food System Inside You &middot; <a href="https://eatobiotics.com" style="color:#9ca3af;text-decoration:none;">eatobiotics.com</a>
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

function safeNextPath(next: unknown): string {
  if (typeof next !== "string") return "/account"
  if (!next.startsWith("/") || next.startsWith("//")) return "/account"
  if (next.startsWith("/auth/") || next.startsWith("/api/")) return "/account"
  return next
}

function safeId(id: unknown): string | null {
  if (typeof id !== "string") return null
  const trimmed = id.trim()
  return /^[a-zA-Z0-9_-]{6,80}$/.test(trimmed) ? trimmed : null
}

function callbackUrl(siteUrl: string, nextPath: string, assessmentId: string | null, reportId: string | null): string {
  const url = new URL("/auth/callback", siteUrl)
  url.searchParams.set("next", nextPath)
  if (assessmentId) url.searchParams.set("assessmentId", assessmentId)
  if (reportId) url.searchParams.set("reportId", reportId)
  return url.toString()
}

async function sendSupabaseOtpEmail({
  supabaseUrl,
  supabaseAnonKey,
  email,
  siteUrl,
  nextPath,
  assessmentId,
  reportId,
}: {
  supabaseUrl: string
  supabaseAnonKey: string
  email: string
  siteUrl: string
  nextPath: string
  assessmentId: string | null
  reportId: string | null
}) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl(siteUrl, nextPath, assessmentId, reportId),
      shouldCreateUser: true,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, next, assessmentId: rawAssessmentId, reportId: rawReportId } = await req.json() as { email?: string; name?: string; next?: string; assessmentId?: string; reportId?: string }

    const nextPath = safeNextPath(next)
    let assessmentId = safeId(rawAssessmentId)
    let reportId = safeId(rawReportId)
    const normalizedEmail = email?.toLowerCase().trim()

    if (!normalizedEmail) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.SUPABASE_SERVICE_KEY ??
      process.env.SUPABASE_SECRET_KEY
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY
    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

    if (!supabaseUrl) {
      console.error("[send-magic-link] Supabase URL missing")
      return NextResponse.json(
        { error: "Magic link auth is not configured." },
        { status: 503 }
      )
    }

    // Preferred path: generate the link with the service role and send the branded email through Resend.
    if (supabaseServiceKey && resendKey) {
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      if (!assessmentId) {
        const { data: lead } = await adminSupabase
          .from("leads")
          .select("id")
          .ilike("email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        assessmentId = (lead?.id as string | undefined) ?? null
      }
      if (!reportId) {
        const { data: report } = await adminSupabase
          .from("deep_assessments")
          .select("id")
          .ilike("email", normalizedEmail)
          .order("created_at", { ascending: false })
          .limit(1)
          .single()
        reportId = (report?.id as string | undefined) ?? null
      }

      const { data, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: normalizedEmail,
        options: {
          redirectTo: callbackUrl(siteUrl, nextPath, assessmentId, reportId),
        },
      })

      if (!linkError && data?.properties?.action_link) {
        const magicUrl = data.properties.action_link
        const resend = new Resend(resendKey)
        const { error: sendError } = await resend.emails.send({
          from: `EatoBiotics <${emailFrom}>`,
          to: normalizedEmail,
          subject: "Your EatoBiotics sign-in link",
          html: magicLinkEmailHtml({ magicUrl, name }),
        })

        if (!sendError) {
          return NextResponse.json({ ok: true, provider: "resend" })
        }

        console.error("[send-magic-link] Resend error:", sendError.message)
      } else {
        console.error("[send-magic-link] generateLink error:", linkError?.message)
      }
    } else {
      if (!supabaseServiceKey) console.error("[send-magic-link] Supabase service role key missing")
      if (!resendKey) console.error("[send-magic-link] RESEND_API_KEY missing")
    }

    // Fallback path: let Supabase send its own OTP/magic-link email with the anon key.
    if (supabaseAnonKey) {
      const { error: otpError } = await sendSupabaseOtpEmail({
        supabaseUrl,
        supabaseAnonKey,
        email: normalizedEmail,
        siteUrl,
        nextPath,
        assessmentId,
        reportId,
      })

      if (!otpError) {
        return NextResponse.json({ ok: true, provider: "supabase-otp" })
      }

      console.error("[send-magic-link] signInWithOtp error:", otpError.message)
      return NextResponse.json(
        { error: "Could not create sign-in link." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: "Magic link email delivery is not configured." },
      { status: 503 }
    )
  } catch (err) {
    console.error("[send-magic-link] Error:", err)
    return NextResponse.json(
      { error: "Could not send sign-in email." },
      { status: 500 }
    )
  }
}
