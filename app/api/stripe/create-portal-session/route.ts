import { NextRequest, NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  try {
    // 2. Get or create Stripe customer ID
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_customer_id, email, name")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    user.email ?? (profile?.email as string | undefined),
        name:     (profile?.name as string | null) ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // 3. Create billing portal session
    const origin = req.headers.get("origin") ?? "https://eatobiotics.com"

    const session = await stripe.billingPortal.sessions.create({
      customer:   customerId,
      return_url: `${origin}/account`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[create-portal-session]", err)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
