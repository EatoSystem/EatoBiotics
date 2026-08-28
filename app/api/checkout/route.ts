import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { randomBytes } from "node:crypto"
import {
  asFoundation,
  asAddon,
  SUMMARY_TOKEN_BYTES,
  SUMMARY_TOKEN_KEY,
  type PaidReportTier,
} from "@/lib/paid-report-session"
import { getSupabase } from "@/lib/supabase"
import { recordHealthConsent } from "@/lib/health-consent"

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
    const {
      overall,
      profile,
      subScores,
      email,
      foundationType,
      selectedAddon,
      acknowledgedImmediateSupply,
    } = body as {
      tier?: PaidReportTier
      overall?: number
      profile?: { type: string; tagline: string; description: string; color?: string }
      subScores?: Record<string, number>
      email?: string
      foundationType?: string
      selectedAddon?: string
      acknowledgedImmediateSupply?: boolean
    }

    // Express consent to immediate supply of digital content, without which the
    // 14-day right to cancel is not lost (Consumer Rights Directive; Irish
    // Consumer Rights Act 2022). Terms sections 4 and 5 state that this is asked
    // at checkout, so it has to be true of every path that reaches Stripe — a
    // checkbox in one caller is neither an enforcement point nor a record.
    if (acknowledgedImmediateSupply !== true) {
      return NextResponse.json(
        {
          error:
            "Please confirm you're asking us to prepare your report straight away before continuing to payment.",
          code: "acknowledgement_required",
        },
        { status: 400 },
      )
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

    // The summary is stored server-side and Stripe is given only an opaque
    // token. It used to travel in Stripe metadata — score, sub-scores, profile
    // type and description, foundation, add-on and email — which put
    // health-derived data in a payment processor for no payment reason (#244).
    //
    // Written BEFORE the session is created, so a failure here costs nothing:
    // no session means no payment page and nobody is charged. Authority stays
    // server-side, which is what #232 established when it stopped taking these
    // values from the request body downstream.
    const supabase = getSupabase()
    if (!supabase) {
      console.error("[checkout] Supabase not configured — refusing to start a paid checkout")
      return NextResponse.json(
        { error: "We couldn't start checkout just now. Please try again shortly.", code: "checkout_unavailable" },
        { status: 503 },
      )
    }

    const summaryToken = randomBytes(SUMMARY_TOKEN_BYTES).toString("hex")
    const { error: intentError } = await supabase.from("paid_report_intents").insert({
      token: summaryToken,
      summary: {
        overall,
        profile,
        subScores,
        tier: reportTier,
        email: email?.toLowerCase().trim() || null,
        foundationType: foundation,
        selectedAddon: addon,
      },
    })

    if (intentError) {
      console.error("[checkout] paid_report_intents insert failed:", intentError.message)
      return NextResponse.json(
        { error: "We couldn't start checkout just now. Please try again shortly.", code: "checkout_unavailable" },
        { status: 503 },
      )
    }

    // The checkout acknowledgement covers both consents in one statement: the
    // buyer asks for immediate supply AND agrees their answers are
    // health-related data used to produce the report. Recording them here, from
    // the text they actually saw, avoids asking a second time for something
    // already agreed — and puts the record somewhere durable rather than only
    // in Stripe metadata.
    const consentEmail = email?.toLowerCase().trim() || null
    if (consentEmail) {
      await recordHealthConsent(supabase, { email: consentEmail, source: "deep_assessment" })
    }

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
      // Four keys, none of them health data. The foundation/add-on keys that
      // used to be duplicated here for dashboard convenience are gone: which
      // health system someone selected is exactly the kind of thing that should
      // not be legible in a payments dashboard.
      metadata: {
        // The only reference to the buyer's answers that Stripe ever sees.
        [SUMMARY_TOKEN_KEY]: summaryToken,
        report_tier: reportTier,
        // The durable record that the buyer asked for immediate supply. Kept on
        // the session because that object survives independently of our
        // database, and the consent needs to outlive the request that gave it.
        acknowledged_immediate_supply: "true",
        acknowledged_at: new Date().toISOString(),
      },
      ...(email ? { customer_email: email.toLowerCase().trim() } : {}),
      allow_promotion_codes: true,
      success_url: `${origin}/assessment/deep?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/assessment`,
    })

    // Bind the intent to the session it was issued for. Readers match on the
    // token AND the session id, so until this lands the token resolves to
    // nothing — which is the safe direction: a failure here degrades to the
    // buyer being unable to load a report they have not yet paid for, and the
    // row expires on its own after 30 days.
    const { error: bindError } = await supabase
      .from("paid_report_intents")
      .update({ stripe_session_id: session.id })
      .eq("token", summaryToken)

    if (bindError) {
      // Fail closed. The session exists but the buyer has not been redirected,
      // so nobody has been charged and an orphaned session costs nothing. The
      // alternative — returning the URL anyway — takes €49 for a report whose
      // summary can never be resolved, because the legacy metadata that used to
      // back it up is no longer written.
      console.error(`[checkout] intent bind failed for session ${session.id}:`, bindError.message)
      return NextResponse.json(
        { error: "We couldn't start checkout just now. Please try again shortly.", code: "checkout_unavailable" },
        { status: 503 },
      )
    }

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
