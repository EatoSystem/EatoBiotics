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

    /* ══ CANCELLING RENEWAL IS NOT CANCELLING ACCESS ═══════════════════════
     *
     * This route used to write `membership_status: "cancelled"` here, "so the
     * UI can update immediately". `getUserMembershipTier` treats `cancelled`
     * as free, so a member who cancelled their renewal lost the period they
     * had already paid for the moment they clicked. The webhook's next
     * `customer.subscription.updated` (still `active`) usually restored it —
     * unless that event was processed first, or failed, in which case the
     * loss lasted until the next event about the subscription.
     *
     * The profile is deliberately left alone. Stripe is the source of truth:
     * the subscription stays `active` with `cancel_at_period_end` until the
     * period ends, access stays bounded by `membership_expires_at`, and only
     * `customer.subscription.deleted` — Stripe saying it has actually ended —
     * moves the member to cancelled/free.
     */

    const periodEnd = (updated as unknown as { current_period_end: number }).current_period_end
    const accessUntil = periodEnd ? new Date(periodEnd * 1000).toISOString() : null

    return NextResponse.json({ ok: true, accessUntil })
  } catch (err) {
    console.error("[cancel-subscription]", err)
    return NextResponse.json({ error: "Cancellation failed" }, { status: 500 })
  }
}
