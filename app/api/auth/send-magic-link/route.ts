import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@supabase/supabase-js"
import { buildMagicLinkEmail } from "@/lib/email/magic-link-email"
import { getClientIp, rateLimit, rateLimitResponse } from "@/lib/rate-limit"

/**
 * Send a passwordless sign-in link.
 *
 * ══ WHY THIS NEEDED A LIMIT ════════════════════════════════════════════════
 *
 * It is unauthenticated and takes an arbitrary address. Without a limit, a
 * loop mails sign-in links to anyone — a third party's inbox filled on our
 * domain and our reputation — and mints a Supabase magic link per call at our
 * expense. 5 per IP per ten minutes matches the other mail-sending routes
 * (send-results-email, email-report) and is far above what a person signing in
 * needs.
 *
 * The address is validated in the same breath, BEFORE Supabase or Resend is
 * touched, so a malformed one costs nothing downstream.
 *
 * Per serverless instance, like every other limiter here (lib/rate-limit.ts).
 */

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(`send-magic-link:${getClientIp(req)}`, 5, 10 * 60_000)
    if (!limit.allowed) {
      const { body, init } = rateLimitResponse(limit)
      return NextResponse.json(body, init)
    }

    const { email, name } = await req.json() as { email?: string; name?: string }

    if (!email || !isValidEmail(email)) {
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
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (linkError || !data?.properties?.action_link) {
      console.error("[send-magic-link] generateLink error:", linkError?.message)
      return NextResponse.json({ ok: true, skipped: true }) // non-fatal
    }

    const magicUrl = data.properties.action_link

    if (resendKey) {
      const resend = new Resend(resendKey)
      const { subject, html } = buildMagicLinkEmail({ magicUrl, name })
      const { error: sendError } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: email,
        subject,
        html,
      })
      if (sendError) {
        console.error("[send-magic-link] Resend error:", sendError.message)
        // Surface the failure so the caller (SaveResultsCard) can stop showing
        // a false "sent" and offer a retry. Still HTTP 200 (non-fatal).
        return NextResponse.json({ ok: false, reason: "send_failed" })
      }
      console.log(`[send-magic-link] Sign-in link emailed to ${email} via ${emailFrom}`)
    } else {
      // Never log the link itself — it embeds a single-use auth token.
      console.warn("[send-magic-link] RESEND_API_KEY not set — link generated but NOT emailed")
      return NextResponse.json({ ok: true, emailSent: false, skipped: true })
    }

    return NextResponse.json({ ok: true, emailSent: true })
  } catch (err) {
    console.error("[send-magic-link] Error:", err)
    return NextResponse.json({ ok: true, skipped: true }) // always non-fatal
  }
}
