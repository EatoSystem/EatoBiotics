import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
})

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
    const paid = session.payment_status === "paid"

    return NextResponse.json({
      paid,
      clientReferenceId: session.client_reference_id ?? null,
    })
  } catch (err) {
    console.error("Stripe verify error:", err)
    return NextResponse.json({ paid: false }, { status: 500 })
  }
}
