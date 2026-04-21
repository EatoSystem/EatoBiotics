import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getUser } from "@/lib/supabase-server"

/* ── UGC Submission Endpoint ─────────────────────────────────────────────
   Called when a user opts in to share their meal result with @EatoBiotics.
   Sends a Resend notification email to OWNER_EMAIL with the OG card URL so
   the team can review and repost manually. No DB writes needed — email is
   the queue.
────────────────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  // Auth required — only logged-in users can submit
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  let body: {
    score: number
    percentile: number
    label: string
    emoji: string
    ogCardUrl: string
  }

  try {
    body = await req.json() as typeof body
    if (!body.score || !body.label || !body.ogCardUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const resendKey  = process.env.RESEND_API_KEY
  const ownerEmail = process.env.OWNER_EMAIL
  const emailFrom  = process.env.EMAIL_FROM ?? "noreply@eatobiotics.com"
  const appUrl     = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

  if (!ownerEmail) {
    console.warn("[social/submit] OWNER_EMAIL not set — skipping UGC notification")
    return NextResponse.json({ ok: true })
  }

  const subject = `New EatoBiotics UGC submission — ${body.emoji} ${body.label} scored ${body.score}/100`

  const absoluteOgUrl = body.ogCardUrl.startsWith("http")
    ? body.ogCardUrl
    : `${appUrl}${body.ogCardUrl}`

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h2 style="margin: 0 0 16px; font-size: 20px; color: #1A2E12;">
        📲 New UGC submission
      </h2>
      <p style="margin: 0 0 8px; color: #5A6E50;">
        A user has opted in to be featured on @EatoBiotics.
      </p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1A2E12; background: #f5f9f3; border: 1px solid #D6E8CC;">Score</td>
          <td style="padding: 8px 12px; color: #1A2E12; border: 1px solid #D6E8CC;">${body.score}/100</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1A2E12; background: #f5f9f3; border: 1px solid #D6E8CC;">Identity</td>
          <td style="padding: 8px 12px; color: #1A2E12; border: 1px solid #D6E8CC;">${body.emoji} ${body.label}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1A2E12; background: #f5f9f3; border: 1px solid #D6E8CC;">Percentile</td>
          <td style="padding: 8px 12px; color: #1A2E12; border: 1px solid #D6E8CC;">Better than ${body.percentile}% of people</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; font-weight: bold; color: #1A2E12; background: #f5f9f3; border: 1px solid #D6E8CC;">User</td>
          <td style="padding: 8px 12px; color: #1A2E12; border: 1px solid #D6E8CC;">${user.email ?? user.id}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 8px; font-weight: bold; color: #1A2E12;">OG Card Preview:</p>
      <a href="${absoluteOgUrl}" style="display: inline-block; margin-bottom: 16px; color: #4CB648;">
        ${absoluteOgUrl}
      </a>
      <br />
      <img src="${absoluteOgUrl}" alt="Meal score card" style="max-width: 100%; border-radius: 12px; border: 1px solid #D6E8CC;" />
      <p style="margin-top: 24px; font-size: 12px; color: #5A6E50;">
        User opted in voluntarily via the meal analysis share card.
      </p>
    </div>
  `

  if (resendKey) {
    try {
      const resend = new Resend(resendKey)
      const { error } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: ownerEmail,
        subject,
        html,
      })
      if (error) {
        console.error("[social/submit] Resend error:", error.message)
      }
    } catch (err) {
      console.error("[social/submit] Failed to send notification:", err)
    }
  } else {
    console.log("[social/submit] RESEND_API_KEY not set — UGC submission from", user.email ?? user.id)
    console.log("[social/submit] OG card:", absoluteOgUrl)
  }

  return NextResponse.json({ ok: true })
}
