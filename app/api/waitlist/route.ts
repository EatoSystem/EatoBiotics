import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { waitlistConfirmationEmail } from "@/lib/email/waitlist-email"

/**
 * Public waitlist capture for the pre-launch landing page (/enter).
 * Stores the email in the existing `leads` table, tagged with
 * assessment_type "waitlist" so it never collides with assessment leads, and
 * sends a branded confirmation email to new signups. Tolerant by design — it
 * never blocks the visitor, and email failure is non-fatal.
 */
export async function POST(req: NextRequest) {
  try {
    // Per-IP rate limit — public, unauthenticated, and now sends email.
    const limit = rateLimit(`waitlist:${getClientIp(req)}`, 5, 10 * 60_000)
    if (!limit.allowed) {
      const { body: rlBody, init } = rateLimitResponse(limit)
      return NextResponse.json(rlBody, init)
    }

    const body = (await req.json()) as { email?: string }
    const email = (body.email ?? "").toLowerCase().trim()

    // Lightweight email sanity check.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 })
    }

    let isNew = true
    const supabase = getSupabase()
    if (supabase) {
      // Detect repeat signups so we only email someone once.
      const { data: existing } = await supabase
        .from("leads")
        .select("email")
        .eq("email", email)
        .eq("assessment_type", "waitlist")
        .maybeSingle()
      isNew = !existing

      const { error } = await supabase.from("leads").upsert(
        { email, assessment_type: "waitlist" },
        { onConflict: "email,assessment_type" }
      )
      if (error) {
        console.error("[waitlist] Supabase error:", error.message)
      }
    } else {
      console.log("[waitlist] New signup (Supabase not configured):", email)
    }

    // Send the confirmation email to new signups (non-fatal).
    if (isNew) {
      const resendKey = process.env.RESEND_API_KEY
      const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
      if (resendKey) {
        try {
          const { Resend } = await import("resend")
          const resend = new Resend(resendKey)
          const { subject, html } = waitlistConfirmationEmail()
          const ownerEmail = process.env.OWNER_EMAIL
          const { error: sendError } = await resend.emails.send({
            from: `EatoBiotics <${emailFrom}>`,
            to: email,
            bcc: ownerEmail ? [ownerEmail] : undefined,
            subject,
            html,
          })
          if (sendError) {
            console.error("[waitlist] Resend error:", sendError.message)
          } else {
            console.log(`[waitlist] Confirmation emailed to ${email}`)
          }
        } catch (err) {
          console.error("[waitlist] Email step error:", err)
        }
      } else {
        console.warn("[waitlist] RESEND_API_KEY not set — skipping confirmation email")
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[waitlist] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
