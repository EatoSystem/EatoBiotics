import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { buildCombinedReportEmail } from "@/lib/email/combined-report-email"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import type { AssessmentSummary } from "@/lib/assessment/registry"

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function POST(req: NextRequest) {
  try {
    // Public endpoint that emails a caller-supplied address — rate limit per IP.
    const limit = rateLimit(`email-report:${getClientIp(req)}`, 10, 10 * 60_000)
    if (!limit.allowed) {
      const { body: rlBody, init } = rateLimitResponse(limit)
      return NextResponse.json(rlBody, init)
    }

    const { lead, foundation, addon } = (await req.json()) as {
      lead: { name?: string; email: string }
      foundation: AssessmentSummary
      addon: AssessmentSummary | null
    }

    if (!lead?.email || !foundation?.score) {
      return NextResponse.json({ error: "Missing lead or foundation" }, { status: 400 })
    }
    if (!isValidEmail(lead.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://eatobiotics.com"
    const { subject, html } = buildCombinedReportEmail({
      name: lead.name,
      foundation,
      addon: addon ?? null,
      reportUrl: `${siteUrl}/assessment/results`,
    })

    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "results@eatobiotics.com"
    const ownerEmail = process.env.OWNER_EMAIL

    if (resendKey) {
      const resend = new Resend(resendKey)
      const { error } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: lead.email,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject,
        html,
      })
      if (error) console.error("[email-report] Resend error:", error.message)
    } else {
      console.log("[email-report] RESEND_API_KEY not set — skipping email for:", lead.email)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[email-report] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
