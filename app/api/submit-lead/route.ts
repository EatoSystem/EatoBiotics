import { NextRequest, NextResponse } from "next/server"
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
    const { name, ageBracket, referralCode, assessmentType } = body as {
      name: string
      ageBracket: string
      referralCode?: string
      assessmentType?: "gut" | "mind"
    }
    const email = ((body as { email: string }).email ?? "").toLowerCase().trim()

    if (!name || !email || !ageBracket) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Store in Supabase if configured
    const supabase = getSupabase()
    if (supabase) {
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
