import { NextRequest, NextResponse } from "next/server"
import { getSupabase } from "@/lib/supabase"
import { isUnderMinimumAge, UNDER_MINIMUM_AGE_MESSAGE } from "@/lib/age-brackets"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"
import { waitlistConfirmationEmail } from "@/lib/email/waitlist-email"
import { waitlistResultEmail } from "@/lib/email/waitlist-result-email"
import { sendEmail } from "@/lib/email/send"
import { generateShareCode } from "@/lib/waitlist-result"
import { logServerEvent } from "@/lib/statsig-server"
import type { AssessmentResult } from "@/lib/assessment-scoring"

interface WaitlistBody {
  email?: string
  name?: string
  ageBracket?: string
  country?: string
  diet?: string
  mainGoal?: string
  foodChallenge?: string
  referredBy?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  result?: AssessmentResult
}

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

/**
 * Public waitlist capture for the pre-launch landing page (/enter + /waitlist).
 * Stores the lead in the existing `leads` table, tagged with assessment_type
 * "waitlist" so it never collides with assessment leads. When the quick "Food
 * System Type" quiz is completed it also persists the profile + scores and the
 * segmentation context (country/diet/goal/challenge), and emails the result.
 *
 * Backward compatible: a bare { email } still works and sends the generic
 * confirmation. Tolerant by design — never blocks the visitor, email is
 * non-fatal.
 */
export async function POST(req: NextRequest) {
  try {
    // Per-IP rate limit — public, unauthenticated, and now sends email.
    const limit = rateLimit(`waitlist:${getClientIp(req)}`, 5, 10 * 60_000)
    if (!limit.allowed) {
      const { body: rlBody, init } = rateLimitResponse(limit)
      return NextResponse.json(rlBody, init)
    }

    const body = (await req.json()) as WaitlistBody
    const email = (body.email ?? "").toLowerCase().trim()

    // Lightweight email sanity check.
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 })
    }

    // Same age floor as the assessment routes. The waitlist quiz stores a Food
    // System profile and scores alongside the email, so it is health-adjacent
    // capture and belongs behind the 16+ line the Terms draw, not in front of it.
    if (isUnderMinimumAge(body.ageBracket)) {
      return NextResponse.json(
        { error: UNDER_MINIMUM_AGE_MESSAGE, code: "under_minimum_age" },
        { status: 400 },
      )
    }

    const result = body.result
    const clean = (s?: string) => {
      const t = (s ?? "").trim()
      return t ? t.slice(0, 120) : undefined
    }

    // Only persist columns we actually received, so a bare { email } stays minimal.
    const row: Record<string, unknown> = { email, assessment_type: "waitlist" }
    if (clean(body.name)) row.name = clean(body.name)
    if (clean(body.ageBracket)) row.age_bracket = clean(body.ageBracket)
    if (clean(body.country)) row.country = clean(body.country)
    if (clean(body.diet)) row.diet = clean(body.diet)
    if (clean(body.mainGoal)) row.main_goal = clean(body.mainGoal)
    if (clean(body.foodChallenge)) row.food_challenge = clean(body.foodChallenge)
    if (result) {
      row.overall_score = result.overall
      row.profile_type = result.profile?.type
      row.sub_scores = result.subScores
    }

    let isNew = true
    // The public code for the mini-report page / share / referral. Assigned when
    // a quiz result is present; reused on repeat submissions so the link is stable.
    let shareCode: string | undefined
    const referredBy = clean(body.referredBy)
    const supabase = getSupabase()
    if (supabase) {
      // Detect repeat signups (email once) and reuse any existing share code.
      const { data: existing } = await supabase
        .from("leads")
        .select("email, share_code")
        .eq("email", email)
        .eq("assessment_type", "waitlist")
        .maybeSingle()
      isNew = !existing

      if (result) {
        shareCode = (existing?.share_code as string | undefined) ?? generateShareCode()
        row.share_code = shareCode
        if (isNew && referredBy && referredBy !== shareCode) row.referred_by = referredBy
      }

      // First-touch UTM attribution: only set on the initial signup so a repeat
      // submission never overwrites the original campaign source.
      if (isNew) {
        for (const k of UTM_KEYS) {
          const v = clean(body[k])
          if (v) row[k] = v
        }
      }

      const { error } = await supabase
        .from("leads")
        .upsert(row, { onConflict: "email,assessment_type" })
      if (error) {
        console.error("[waitlist] Supabase error:", error.message)
      }

      // Credit the referrer (best-effort; pre-launch volumes make races a non-issue).
      if (isNew && referredBy && referredBy !== shareCode) {
        const { data: referrer } = await supabase
          .from("leads")
          .select("referral_count")
          .eq("share_code", referredBy)
          .maybeSingle()
        if (referrer) {
          await supabase
            .from("leads")
            .update({ referral_count: (referrer.referral_count ?? 0) + 1 })
            .eq("share_code", referredBy)
          await logServerEvent("waitlist_referral_credited", referredBy, { referrer_code: referredBy })
        }
      }

      // Funnel analytics (server-truth — survives ad-blockers / consent). Anonymous
      // visitors, so we key on email. Non-fatal; logServerEvent swallows errors.
      await logServerEvent("waitlist_signup", email, {
        is_new: String(isNew),
        has_result: String(!!result),
        country: clean(body.country) ?? "",
        profile_type: (result?.profile?.type as string | undefined) ?? "",
        referred: String(!!referredBy),
        utm_source: clean(body.utm_source) ?? "",
        utm_medium: clean(body.utm_medium) ?? "",
        utm_campaign: clean(body.utm_campaign) ?? "",
      })
    } else {
      console.log("[waitlist] New signup (Supabase not configured):", email)
      if (result) shareCode = generateShareCode()
    }

    // Send the appropriate email to new signups (non-fatal; sendEmail attaches
    // List-Unsubscribe headers and skips opted-out addresses).
    if (isNew) {
      const ownerEmail = process.env.OWNER_EMAIL
      const { subject, html } = result
        ? waitlistResultEmail(result, clean(body.name), shareCode, email)
        : waitlistConfirmationEmail(email)
      const sent = await sendEmail({
        to: email,
        bcc: ownerEmail ? [ownerEmail] : undefined,
        subject,
        html,
      })
      if (sent.ok) {
        console.log(`[waitlist] ${result ? "Result" : "Confirmation"} emailed to ${email}`)
      } else if (sent.skipped) {
        console.log(`[waitlist] Email skipped (${sent.skipped}) for ${email}`)
      } else {
        console.error("[waitlist] Email error:", sent.error)
      }
    }

    return NextResponse.json({ ok: true, shareCode })
  } catch (err) {
    console.error("[waitlist] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
