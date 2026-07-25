import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { sendEmail } from "@/lib/email/send"
import { buildResultsEmail } from "@/lib/email/results-email"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { getUser } from "@/lib/supabase-server"
import { hasServerFoundation } from "@/lib/assessment/foundation-server"
import type { AssessmentResult } from "@/lib/assessment-scoring"
import type { LeadData } from "@/lib/assessment-storage"
import { appendScore, parseScoreHistory } from "@/lib/account/retest"

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
      assessmentType?: "gut" | "mind" | "family"
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

    const normalizedEmail = lead.email.toLowerCase().trim()

    // Foundation before Health/Life: Mind is an add-on and, unlike gut/family,
    // may only have its score recorded once a You/Family foundation is on file.
    // This route is public (anonymous free-assessment flow), so there may be no
    // session — check by email, and additionally by user_id when one is present.
    // Fails closed: if Supabase is unavailable the proof can't be verified, so
    // Mind must not proceed to build/send the email or persist anything.
    if (assessmentType === "mind") {
      const sbCheck = getSupabase()
      if (!sbCheck) {
        return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
      }
      const user = await getUser().catch(() => null)
      const hasFoundation = await hasServerFoundation(sbCheck, { userId: user?.id, email: normalizedEmail })
      if (!hasFoundation) {
        return NextResponse.json({ error: "Foundation assessment required before add-on assessment." }, { status: 403 })
      }
    }

    // Mind & Family present their five native pillars (carried on result.insights);
    // gut keeps the three biotics. Gut subScores path is unchanged.
    const isFivePillar = assessmentType === "mind" || assessmentType === "family"
    const pillars = isFivePillar
      ? (result.insights ?? []).map((i) => ({ label: i.label, score: i.score }))
      : undefined
    const subScores: Record<string, number> = {
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
      pillars,
      nextActions: result.nextActions,
      ageBracket: lead.ageBracket,
      assessmentType: assessmentType ?? "gut",
    })

    // Send email via Resend if configured
    const resendKey = process.env.RESEND_API_KEY
    const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
    const ownerEmail = process.env.OWNER_EMAIL

    if (resendKey && shouldSendEmail) {
      // User-requested results email (transactional) — bypasses the marketing opt-out.
      const sent = await sendEmail({
        from: `EatoBiotics <${emailFrom}>`,
        to: lead.email,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject,
        html,
        skipOptOutCheck: true,
      })
      if (!sent.ok && sent.error) {
        console.error("[send-results-email] send error:", sent.error)
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
      const email = lead.email.toLowerCase().trim()
      const type = assessmentType ?? "gut"

      // Score history (Migration 42) — retakes used to silently overwrite the
      // single leads row; appending here is what makes the Day-75 before/after
      // possible. Read-then-append is best-effort: on any failure (e.g. the
      // column isn't applied yet) fall back to the legacy update shape.
      let scoreHistory: unknown = undefined
      try {
        const { data: existing, error: readError } = await supabase
          .from("leads")
          .select("score_history")
          .eq("email", email)
          .eq("assessment_type", type)
          .maybeSingle()
        if (!readError) {
          scoreHistory = appendScore(parseScoreHistory(existing?.score_history), result.overall)
        }
      } catch {
        /* history stays undefined — legacy update below */
      }

      // UPSERT, not UPDATE: the lead row is normally created by /api/submit-lead
      // at assessment start, but that call is fire-and-forget from the client —
      // if it failed (mobile network blip) or hasn't landed yet, a plain UPDATE
      // matches zero rows and the score silently vanishes, so the member's
      // /account shows no result after they complete the assessment. Upserting
      // on the (email, assessment_type) key persists the score regardless, and
      // carries name/age_bracket so the row can be created if it's missing.
      const row: Record<string, unknown> = {
        email,
        assessment_type: type,
        name: lead.name,
        age_bracket: lead.ageBracket,
        overall_score: result.overall,
        profile_type: result.profile.type,
        sub_scores: result.subScores,
        email_sent: shouldSendEmail && !!resendKey,
      }
      if (scoreHistory !== undefined) row.score_history = scoreHistory

      let { error } = await supabase.from("leads").upsert(row, { onConflict: "email,assessment_type" })
      if (error && scoreHistory !== undefined) {
        // Column may not exist yet (Migration 42 unapplied) — retry without it.
        delete row.score_history
        ;({ error } = await supabase.from("leads").upsert(row, { onConflict: "email,assessment_type" }))
      }
      if (error) {
        console.error("[send-results-email] Supabase upsert error:", error.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-results-email] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
