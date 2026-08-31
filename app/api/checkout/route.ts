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
import {
  HEALTH_CONSENT_FIELD,
  HEALTH_CONSENT_REQUIRED_MESSAGE,
  hasHealthConsent,
  recordHealthConsent,
} from "@/lib/health-consent"

const TIER_CONFIG = {
  // The single one-time report offering. The legacy starter/full/premium tiers
  // were retired — any request still carrying one of those names falls back to
  // `personal` via the `tier in TIER_CONFIG` guard below.
  personal: {
    amount: 4900,
    name: "EatoBiotics Food System Report",
    // The Stripe product `name` above is frozen — it is what appears on the
    // customer's card statement and receipt, and existing purchases carry it.
    // The DESCRIPTION names the experience in current vocabulary: what they buy
    // is the Consultation, and it produces the Report. Nothing here derives from
    // the buyer's answers — see the metadata note below.
    description:
      "The Personal Food System Consultation — a guided digital process that produces your Personal Food System Report, and includes 30 days of EatoBiotics access.",
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
      requestedImmediateStart,
    } = body as {
      tier?: PaidReportTier
      overall?: number
      profile?: { type: string; tagline: string; description: string; color?: string }
      subScores?: Record<string, number>
      email?: string
      foundationType?: string
      selectedAddon?: string
      requestedImmediateStart?: boolean
    }

    // Two questions, checked separately, because they are two different things.
    //
    // They used to be one field: `acknowledgedImmediateSupply`, which carried a
    // consent to immediate supply AND stood in for the health-data consent. That
    // conflation is why `recordHealthConsent` below wrote the hash of
    // HEALTH_CONSENT_STATEMENT against a buyer who had been shown different
    // words — the hash exists precisely so a record says what was agreed.
    //
    // The immediate-supply half is gone with the policy behind it. EatoBiotics
    // refunds €49 in full for 14 days from purchase whether or not the report
    // has been generated (Terms section 5), so nothing is waived here; what is
    // left is a request to start now rather than wait.
    //
    // Both are checked before Stripe is called, so a request that fails either
    // check reaches no payment page and nobody is charged. That is also what
    // makes it safe to refuse the retired field shape outright: a browser
    // holding a stale bundle gets an error and a reload, not a charge. An alias
    // would not have helped it anyway — the old client sends no health consent,
    // so it fails the check below regardless — and accepting the old field for
    // BOTH would let it skip the health checkbox and record a statement it never
    // displayed, which is the defect being fixed.
    if (!hasHealthConsent(body?.[HEALTH_CONSENT_FIELD])) {
      return NextResponse.json(
        { error: HEALTH_CONSENT_REQUIRED_MESSAGE, code: "health_consent_required" },
        { status: 400 },
      )
    }

    if (requestedImmediateStart !== true) {
      return NextResponse.json(
        {
          error:
            "Please confirm you'd like to start your Consultation now before continuing to payment.",
          code: "immediate_start_required",
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

    // The health consent, recorded from the statement the buyer was actually
    // shown: checkout now renders the same HealthConsentCheckbox as the four
    // other collection points, so the hash written here matches the words on
    // screen. It lands in `consents`, not in Stripe — whether someone consented
    // to health-data processing is not a payment fact, and #244 exists because
    // buyer-describing data had drifted into the payment processor.
    //
    // This no-ops without an email, so every caller that has one must send it.
    // For a while only /assessment/results did: Mind and Family reach checkout
    // through personal-report-cta.tsx, which took no email prop, so those
    // buyers ticked the box and no deep_assessment row was written. Both
    // results components already held the address for SaveResultsCard; it is
    // now passed on. A lawful basis was never the issue — they consented at
    // their assessment intro (assessment_mind / assessment_family) — the
    // missing thing was a record of the action they took here.
    //
    // Fail-open, deliberately: the boolean is discarded, as it is at the other
    // two call sites. A failed audit insert does not block a purchase. See the
    // note in lib/health-consent.ts.
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
        // The durable record that the buyer asked to start now. Kept on the
        // session because that object survives independently of our database,
        // and the request needs to outlive the call that made it. Sessions
        // created before this change carry acknowledged_immediate_supply /
        // acknowledged_at instead; nothing reads either key, so those stay as
        // they are rather than being rewritten.
        requested_immediate_start: "true",
        requested_at: new Date().toISOString(),
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
