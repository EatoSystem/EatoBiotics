import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
})

const TIER_CONFIG = {
  starter: {
    amount: 2000,
    name: "Starter Insights Report — EatoBiotics",
    description: "Your food system score, top 5 priority foods, and a 7-day daily starter plan.",
  },
  full: {
    amount: 4000,
    name: "Full EatoBiotics Report",
    description:
      "Pillar-by-pillar food recommendations, your top 12 foods ranked by impact, and a personalised 30-day rebuilding plan.",
  },
  premium: {
    amount: 5000,
    name: "Premium EatoBiotics Report",
    description:
      "Everything in the Full Report, plus personalised meal timing, a seasonal food guide, weekly shopping list, 90-day milestone tracker, and 3 Biotic Kitchen recipes.",
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
    const { tier = "full", overall, profile, subScores } = body

    const config = TIER_CONFIG[tier as Tier] ?? TIER_CONFIG.full

    // Encode result summary + tier so the report page can reconstruct it
    const resultSummary = Buffer.from(
      JSON.stringify({ overall, profile, subScores, tier })
    ).toString("base64")

    const origin = req.headers.get("origin") ?? "http://localhost:3000"

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
      client_reference_id: resultSummary,
      success_url: `${origin}/assessment/deep?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assessment`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
