import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { encodePaidReportSummary, type PaidReportTier } from "@/lib/paid-report-session"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
})

const TIER_CONFIG = {
  // ── New primary tier ──────────────────────────────────────────────────
  personal: {
    amount: 4900,
    name: "EatoBiotics Personal Report",
    description:
      "Your full Feed · Seed · Heal analysis, 30-day gut reset plan, top 10 food recommendations, and a free 30-day EatoBiotics account.",
  },
  // ── Legacy tiers (kept for backward compatibility) ─────────────────────
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
    const { tier = "personal", overall, profile, subScores, email } = body as {
      tier?: PaidReportTier
      overall?: number
      profile?: { type: string; tagline: string; description: string; color?: string }
      subScores?: Record<string, number>
      email?: string
    }

    const reportTier: PaidReportTier = tier && tier in TIER_CONFIG ? tier : "personal"
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
      cancel_url: `${origin}/assessment?checkout=cancelled`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
