import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { encodePaidReportSummary, type PaidReportTier } from "@/lib/paid-report-session"

const TIER_CONFIG = {
  // The single one-time report offering. The legacy starter/full/premium tiers
  // were retired — any request still carrying one of those names falls back to
  // `personal` via the `tier in TIER_CONFIG` guard below.
  personal: {
    amount: 4900,
    name: "EatoBiotics Personal Report",
    description:
      "Your full Feed · Seed · Heal analysis, 30-day gut reset plan, top 10 food recommendations, and a free 30-day EatoBiotics account.",
  },
} as const

type Tier = keyof typeof TIER_CONFIG

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { overall, profile, subScores, email } = body as {
      tier?: PaidReportTier
      overall?: number
      profile?: { type: string; tagline: string; description: string; color?: string }
      subScores?: Record<string, number>
      email?: string
    }

    // Only the €49 Personal Report is sold now; any legacy tier in the request
    // is ignored and falls back to `personal`.
    const reportTier = "personal" as const
    const config = TIER_CONFIG[reportTier]

    if (typeof overall !== "number" || !profile || !subScores) {
      return NextResponse.json(
        { error: "Complete the free assessment before checkout." },
        { status: 400 }
      )
    }

    // Encode result summary + tier so the report page can reconstruct it.
    // metadata.result_summary is canonical because Stripe limits client_reference_id to 200 chars.
    const resultSummary = encodePaidReportSummary({
      overall,
      profile,
      subScores,
      tier: reportTier,
      email: email?.toLowerCase().trim() || null,
    })

    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? req.headers.get("origin") ?? "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: config.amount,
            product_data: {
              name: config.name,
              description: config.description,
            },
          },
          quantity: 1,
        },
      ],
      // Store result summary in metadata (no length limit) instead of
      // client_reference_id which has a 200-char Stripe limit
      metadata: { result_summary: resultSummary },
      ...(email ? { customer_email: email.toLowerCase().trim() } : {}),
      allow_promotion_codes: true,
      success_url: `${origin}/assessment/deep?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assessment`,
    })

    console.log(
      `[checkout] Session ${session.id} created (mode=payment, amount=${config.amount}, hasEmail=${Boolean(email)}, livemode=${session.livemode})`
    )

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[checkout] Stripe checkout error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
