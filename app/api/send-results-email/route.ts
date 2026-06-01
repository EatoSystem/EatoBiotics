import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { buildResultsEmail } from "@/lib/email/results-email"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { LeadData } from "@/lib/assessment-storage"

/** Lightweight email shape check — rejects obviously invalid/garbage addresses. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function POST(req: NextRequest) {
  try {
    // Public endpoint that sends mail to a caller-supplied address — rate limit
    // per IP so it can't be abused to send branded email to arbitrary inboxes.
    const limit = rateLimit(`send-results-email:${getClientIp(req)}`, 10, 10 * 60_000)
    if (!limit.allowed) {
      const { body: rlBody, init } = rateLimitResponse(limit)
      return NextResponse.json(rlBody, init)
    }

    const body = await req.json()
    const { lead, result, assessmentType } = body as {
      lead: LeadData
      result: AssessmentResult
      assessmentType?: "gut" | "mind"
      delivery?: "immediate" | "deferred"
    }
    const delivery = (body as { delivery?: "immediate" | "deferred" }).delivery ?? "immediate"
    const shouldSendEmail = delivery !== "deferred"

    if (!lead?.email || !result?.overall) {
      return NextResponse.json({ error: "Missing lead or result" }, { status: 400 })
    }
    if (!isValidEmail(lead.email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }

    const subScores: Record<string, number> =
      assessmentType === "mind"
        ? { ...result.subScores }
        : {
            prebiotics: result.subScores.prebiotics ?? result.subScores.feed ?? 0,
            probiotics: result.subScores.probiotics ?? result.subScores.seed ?? 0,
            postbiotics: result.subScores.postbiotics ?? result.subScores.heal ?? 0,
          }
    const { subject, html } = buildResultsEmail({
      name: lead.name,
      email: lead.email,
      overall: result.overall,
      profileType: result.profile.type,
      tagline: result.profile.tagline,
      profileDescription: result.profile.description,
      subScores,
      nextActions: result.nextActions,
      ageBracket: lead.ageBracket,
      assessmentType: assessmentType ?? "gut",
    })

    // Send email via Resend if configured
    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "results@eatobiotics.com"
    const ownerEmail = process.env.OWNER_EMAIL

    if (resendKey && shouldSendEmail) {
      const resend = new Resend(resendKey)
      const { error } = await resend.emails.send({
        from: `EatoBiotics <${emailFrom}>`,
        to: lead.email,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject,
        html,
      })
      if (error) {
        console.error("[send-results-email] Resend error:", error.message)
      }
    } else if (!resendKey) {
      console.log("[send-results-email] RESEND_API_KEY not set — skipping email for:", lead.email)
      console.log("[send-results-email] Subject:", subject)
    } else {
      console.log("[send-results-email] Deferred results email for:", lead.email)
    }

    // Update Supabase lead with scores (filter by assessment_type to avoid overwriting other assessment rows)
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase
        .from("leads")
        .update({
          overall_score: result.overall,
          profile_type: result.profile.type,
          sub_scores: result.subScores,
          email_sent: shouldSendEmail && !!resendKey,
        })
        .eq("email", lead.email.toLowerCase().trim())
        .eq("assessment_type", assessmentType ?? "gut")
      if (error) {
        console.error("[send-results-email] Supabase update error:", error.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-results-email] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
