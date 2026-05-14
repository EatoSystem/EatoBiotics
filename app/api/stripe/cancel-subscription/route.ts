import { NextResponse } from "next/server"
import { getUser } from "@/lib/supabase-server"
import { getSupabase } from "@/lib/supabase"
import { stripe } from "@/lib/stripe-server"

export async function POST() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const adminSupabase = getSupabase()
    if (!adminSupabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_subscription_id, membership_tier, membership_status")
      .eq("id", user.id)
      .single()

    const subId = profile?.stripe_subscription_id as string | null

    if (!subId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 400 })
    }

    // Schedule cancellation at period end — user keeps access until billing period closes
    const updated = await stripe.subscriptions.update(subId, {
      cancel_at_period_end: true,
    })

    // Reflect the pending-cancel state in the DB so the UI can update immediately
    await adminSupabase
      .from("profiles")
      .update({ membership_status: "cancelled" })
      .eq("id", user.id)

    const periodEnd = (updated as unknown as { current_period_end: number }).current_period_end
    const accessUntil = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

    return NextResponse.json({ ok: true, accessUntil })
  } catch (err) {
    console.error("[cancel-subscription]", err)
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 })
  }
}
