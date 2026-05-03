import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"

const bodySchema = z.object({
  priceId: z.string().min(1, "priceId is required"),
})

const VALID_PRICE_IDS = new Set([
  process.env.STRIPE_GROW_PRICE_ID,
  process.env.STRIPE_RESTORE_PRICE_ID,
  process.env.STRIPE_TRANSFORM_PRICE_ID,
  process.env.STRIPE_MEMBER_PRICE_ID,
].filter(Boolean))

export async function POST(req: NextRequest) {
  // 1. Authenticate
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 })
  }

  // 2. Validate body
  let body: z.infer<typeof bodySchema>
  try {
    body = bodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  // 3. Verify the price ID is one of ours
  if (!VALID_PRICE_IDS.has(body.priceId)) {
    return NextResponse.json({ error: "Invalid price ID" }, { status: 400 })
  }

  const adminSupabase = getSupabase()
  if (!adminSupabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  try {
    // 4. Get or create Stripe customer
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_customer_id, email, name")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        name:  (profile?.name as string | null) ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Persist the customer ID immediately so we can look it up in webhooks
      await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // 5. Create checkout session
    const origin = req.headers.get("origin") ?? "https://eatobiotics.com"

    const session = await stripe.checkout.sessions.create({
      mode:     "subscription",
      customer: customerId,
      line_items: [{ price: body.priceId, quantity: 1 }],
      success_url: `${origin}/account?subscription=success`,
      cancel_url:  `${origin}/pricing`,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[create-subscription-checkout]", err)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
