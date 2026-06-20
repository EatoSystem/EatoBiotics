import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe-server"
import { getPaidReportSummaryFromSession, isCheckoutSessionSettled } from "@/lib/paid-report-session"

export async function GET(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ paid: false, error: "Stripe not configured" }, { status: 503 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ paid: false }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = isCheckoutSessionSettled(session)
    const summary = getPaidReportSummaryFromSession(session)

    console.log(
      `[verify-payment] Session ${sessionId}: paid=${paid}, status=${session.status}, payment_status=${session.payment_status}`
    )

    return NextResponse.json({
      paid,
      summary,
      // Backward-compatible field for older clients.
      clientReferenceId: session.metadata?.result_summary ?? session.client_reference_id ?? null,
    })
  } catch (err) {
    console.error("Stripe verify error:", err)
    return NextResponse.json({ paid: false }, { status: 500 })
  }
}
