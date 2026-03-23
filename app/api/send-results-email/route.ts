import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { buildResultsEmail } from "@/lib/email/results-email"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { LeadData } from "@/lib/assessment-storage"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lead, result } = body as { lead: LeadData; result: AssessmentResult }

    if (!lead?.email || !result?.overall) {
      return NextResponse.json({ error: "Missing lead or result" }, { status: 400 })
    }

    const { diversity, feeding, adding, consistency, feeling } = result.subScores
    const { subject, html } = buildResultsEmail({
      name: lead.name,
      email: lead.email,
      overall: result.overall,
      profileType: result.profile.type,
      tagline: result.profile.tagline,
      profileDescription: result.profile.description,
      subScores: { diversity, feeding, adding, consistency, feeling },
      nextActions: result.nextActions,
      ageBracket: lead.ageBracket,
    })

    // Send email via Resend if configured
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
      if (error) {
        console.error("[send-results-email] Resend error:", error.message)
      }
    } else {
      console.log("[send-results-email] RESEND_API_KEY not set — skipping email for:", lead.email)
      console.log("[send-results-email] Subject:", subject)
    }

    // Update Supabase lead with scores
    const supabase = getSupabase()
    if (supabase) {
      const { error } = await supabase
        .from("leads")
        .update({
          overall_score: result.overall,
          profile_type: result.profile.type,
          sub_scores: result.subScores,
          email_sent: !!resendKey,
        })
        .eq("email", lead.email.toLowerCase().trim())
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
