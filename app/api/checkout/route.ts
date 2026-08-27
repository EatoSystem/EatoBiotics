import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import {
  asFoundation,
  asAddon,
  paidReportSummaryMetadata,
  type PaidReportTier,
} from "@/lib/paid-report-session"

const TIER_CONFIG = {
  // The single one-time report offering. The legacy starter/full/premium tiers
  // were retired — any request still carrying one of those names falls back to
  // `personal` via the `tier in TIER_CONFIG` guard below.
  personal: {
    amount: 4900,
    name: "EatoBiotics Food System Report",
    description:
      "Your personalised Food System score, report, and plan — built from your foundation assessment and, where selected, your deeper support assessment. Includes a free 30-day EatoBiotics account.",
  },
} as const

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
      { status: 503 }
    )
  }

  try {
    const body = await req.json()
    const { overall, profile, subScores, email, foundationType, selectedAddon } = body as {
      tier?: PaidReportTier
      overall?: number
      profile?: { type: string; tagline: string; description: string; color?: string }
      subScores?: Record<string, number>
      email?: string
      foundationType?: string
      selectedAddon?: string
    }

    // Validate the new product-architecture context through the canonical
    // validators (ignored if absent/invalid so older clients and the anonymous
    // free-assessment flow keep working). An unknown add-on becomes null here
    // and never reaches Stripe metadata, so it cannot resurface downstream as
    // an unrecognised lens key.
    const foundation = asFoundation(foundationType)
    const addon = asAddon(selectedAddon)

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
    // Stripe caps each metadata value at 500 chars, so the shared helper splits
    // the base64 payload into numbered chunks and the downstream decoder
    // reassembles them after payment verification.
    const summaryMetadata = paidReportSummaryMetadata({
      overall,
      profile,
      subScores,
      tier: reportTier,
      email: email?.toLowerCase().trim() || null,
      foundationType: foundation,
      selectedAddon: addon,
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
      // Store the summary in Stripe-safe metadata chunks instead of
      // client_reference_id, which has a 200-char limit. The flat
      // foundation/add-on keys are duplicated for easy reading in the Stripe
      // dashboard + webhooks.
      metadata: {
        ...summaryMetadata,
        ...(foundation ? { foundation_type: foundation } : {}),
        ...(addon ? { selected_addon: addon } : {}),
      },
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
    // Surface the real Stripe error so failures are diagnosable instead of a
    // generic 500. (Stripe errors carry a safe, user-presentable `message`.)
    const detail = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: "Failed to create checkout session", detail },
      { status: 500 }
    )
  }
}
