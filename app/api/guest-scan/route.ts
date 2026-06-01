import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSupabase } from "@/lib/supabase"
import { buildMealAnalysisEmail } from "@/lib/email/meal-analysis-email"
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/** Lightweight email shape check — rejects obviously invalid/garbage addresses. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

interface GuestScanBody {
  email?: string
  name?: string
  result: Record<string, unknown>
  hash: string
}

export async function POST(req: NextRequest) {
  try {
    // Public endpoint that writes leads and sends email — rate limit per IP
    // to prevent lead-table spam and outbound-email abuse to arbitrary addresses.
    const limit = rateLimit(`guest-scan:${getClientIp(req)}`, 10, 10 * 60_000)
    if (!limit.allowed) {
      const { body, init } = rateLimitResponse(limit)
      return NextResponse.json(body, init)
    }

    const body = await req.json() as GuestScanBody
    const { name, result, hash } = body

    if (!result || !hash) {
      return NextResponse.json({ error: "Missing result or hash" }, { status: 400 })
    }

    // Email is optional, but if supplied it must be valid — we store it and
    // send mail to it, so reject garbage rather than spamming arbitrary strings.
    let email: string | null = null
    if (body.email) {
      const normalized = body.email.toLowerCase().trim()
      if (!isValidEmail(normalized)) {
        return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
      }
      email = normalized
    }

    const supabase = getSupabase()
    if (!supabase) {
      // DB unavailable — non-fatal, return success anyway
      return NextResponse.json({ success: true, shareUrl: `/analyse/result/${hash}` })
    }

    const biotics_score = typeof result.score === "number" ? Math.round(result.score) : null

    // 1. Insert into meal_scans
    const { error: scanError } = await supabase
      .from("meal_scans")
      .insert({
        hash,
        email: email || null,
        name: name || null,
        result_json: result,
        biotics_score,
      })

    if (scanError) {
      console.error("[guest-scan] meal_scans insert error:", scanError.message)
      // Non-fatal — continue to lead upsert
    }

    // 2. If email provided, upsert into leads
    if (email) {
      const { error: leadError } = await supabase
        .from("leads")
        .upsert(
          {
            email,
            name: name || null,
            overall_score: null,
          },
          { onConflict: "email", ignoreDuplicates: false }
        )

      if (leadError) {
        console.error("[guest-scan] leads upsert error:", leadError.message)
        // Non-fatal
      }
    }

    // 3. Send results email if email provided
    if (email) {
      try {
        const resendKey = process.env.RESEND_API_KEY
        const rawFrom = process.env.EMAIL_FROM ?? "results@eatobiotics.com"
        // Ensure sender shows as "EatoBiotics" not the raw address or Resend default
        const emailFrom = rawFrom.includes("<") ? rawFrom : `EatoBiotics <${rawFrom}>`

        if (resendKey) {
          const resend = new Resend(resendKey)
          const { subject, html } = buildMealAnalysisEmail({
            name: name || undefined,
            email,
            mealName:       typeof result.mealName       === "string" ? result.mealName       : undefined,
            score:          typeof result.score          === "number" ? Math.round(result.score) : 50,
            prebioticScore: typeof result.prebioticScore === "number" ? result.prebioticScore  : undefined,
            probioticScore: typeof result.probioticScore === "number" ? result.probioticScore  : undefined,
            postbioticScore:typeof result.postbioticScore=== "number" ? result.postbioticScore : undefined,
            whatThisMealDoes: typeof result.whatThisMealDoes === "string" ? result.whatThisMealDoes : undefined,
            suggestions:    Array.isArray(result.suggestions) ? result.suggestions as string[] : [],
            shareHash: hash,
          })

          await resend.emails.send({
            from: emailFrom,
            to: email,
            subject,
            html,
          })
        }
      } catch (emailErr) {
        console.error("[guest-scan] email send error:", emailErr)
        // Non-fatal — result is already saved
      }
    }

    return NextResponse.json({ success: true, shareUrl: `/analyse/result/${hash}` })
  } catch (err) {
    console.error("[guest-scan] error:", err)
    // Always return success — don't block the user experience on DB errors
    return NextResponse.json({ success: true })
  }
}
