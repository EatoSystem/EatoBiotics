import { NextRequest, NextResponse } from "next/server"
import { isUnderMinimumAge, UNDER_MINIMUM_AGE_MESSAGE } from "@/lib/age-brackets"
import {
  HEALTH_CONSENT_REQUIRED_MESSAGE,
  hasHealthConsent,
  recordHealthConsent,
} from "@/lib/health-consent"
import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"

/* ── Unique code generator (same charset as /api/promo/generate) ───────── */
function generateUniqueCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  let suffix = ""
  for (const byte of arr) suffix += chars[byte % chars.length]
  return `${prefix}-${suffix}`
}

/* ── Create a single-use Stripe promotion code for lottery winners ──────── */
async function createLotteryPromoCode(email: string): Promise<string | null> {
  const couponId = process.env.STRIPE_WIN_COUPON_ID ?? process.env.STRIPE_LOW_SCORE_COUPON_ID
  if (!couponId || !process.env.STRIPE_SECRET_KEY) return null

  const code = generateUniqueCode("EB-WIN")
  try {
    const promoCode = await stripe.promotionCodes.create({
      promotion:       { type: "coupon", coupon: couponId },
      code,
      max_redemptions: 1,
      metadata: {
        type:         "lottery",
        email,
        generated_at: new Date().toISOString(),
      },
    })
    return promoCode.code
  } catch (err) {
    console.error("[submit-lead] Lottery promo code creation failed:", err)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, ageBracket, referralCode, assessmentType, healthDataConsent } = body as {
      name: string
      ageBracket: string
      referralCode?: string
      assessmentType?: "gut" | "mind" | "family"
      healthDataConsent?: unknown
    }
    const email = ((body as { email: string }).email ?? "").toLowerCase().trim()

    if (!name || !email || !ageBracket) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // The age floor the Terms commit to. The intro forms already refuse this
    // selection, but a form control is not an enforcement point: this route is
    // reachable directly, and it is where a lead row (name, email, health
    // assessment scores) would otherwise be written.
    if (isUnderMinimumAge(ageBracket)) {
      return NextResponse.json(
        { error: UNDER_MINIMUM_AGE_MESSAGE, code: "under_minimum_age" },
        { status: 400 },
      )
    }

    // Affirmative consent before any health-derived data is stored. The intro
    // forms ask, but a form control is not an enforcement point: this route is
    // reachable directly and it is where the lead row — email plus assessment
    // scores — is written. Refusing here is what makes the Privacy Policy's
    // "we treat this as sensitive personal data" a rule rather than a wish.
    if (!hasHealthConsent(healthDataConsent)) {
      return NextResponse.json(
        { error: HEALTH_CONSENT_REQUIRED_MESSAGE, code: "health_consent_required" },
        { status: 400 },
      )
    }

    // Store in Supabase if configured
    const supabase = getSupabase()
    if (supabase) {
      // Record the consent alongside the data it authorises. Deliberately not
      // fail-closed: the person did consent, and refusing their assessment
      // because our bookkeeping failed is a worse outcome than an incomplete
      // audit trail. The failure is logged.
      await recordHealthConsent(supabase, {
        email,
        source:
          assessmentType === "mind"
            ? "assessment_mind"
            : assessmentType === "family"
              ? "assessment_family"
              : "assessment_gut",
      })

      // Check if this is a brand-new lead (not a repeat submission)
      const { data: existing } = await supabase
        .from("leads")
        .select("id")
        .eq("email", email)
        .eq("assessment_type", assessmentType ?? "gut")
        .maybeSingle()

      const isNewLead = !existing

      const { error } = await supabase.from("leads").upsert(
        {
          name,
          email,
          age_bracket: ageBracket,
          assessment_type: assessmentType ?? "gut",
        },
        { onConflict: "email,assessment_type" }
      )
      if (error) {
        console.error("[submit-lead] Supabase error:", error.message)
      }

      // Track referral if a code was provided
      if (referralCode) {
        try {
          await supabase.from("referrals").insert({
            referrer_code: referralCode,
            referred_email: email,
          })
        } catch (refErr) {
          console.error("[submit-lead] Referral insert error:", refErr)
        }
      }

      // ── Lottery: 1 winner per 100 new leads ────────────────────────────
      if (isNewLead && !error) {
        const { count } = await supabase
          .from("leads")
          .select("*", { count: "exact", head: true })

        if (count !== null && count % 100 === 0) {
          const promoCode = await createLotteryPromoCode(email)
          if (promoCode) {
            return NextResponse.json({ ok: true, winner: true, promoCode, milestone: count })
          }
        }
      }
    } else {
      console.log("[submit-lead] New lead (Supabase not configured):", { name, email, ageBracket })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[submit-lead] Error:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
