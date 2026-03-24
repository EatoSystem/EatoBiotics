import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe-server"
import { getSupabase } from "@/lib/supabase"
import { tierFromPriceId, isFoundingMember } from "@/lib/membership"

// Stripe v20 with the clover API version uses slightly different type shapes.
// We use a helper to safely access fields that may not be in the TS types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field<T>(obj: unknown, key: string): T | undefined { return (obj as any)?.[key] as T | undefined }

// Next.js must NOT parse the body — we need the raw bytes for signature verification
export const config = { api: { bodyParser: false } }

/** Look up a profile by Stripe customer ID */
async function getProfileByCustomerId(customerId: string) {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single()
  return data
}

/** Write a subscription_events row */
async function logEvent(opts: {
  userId: string
  eventType: string
  fromTier?: string | null
  toTier?: string | null
  stripeEventId: string
}) {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.from("subscription_events").insert({
    user_id:         opts.userId,
    event_type:      opts.eventType,
    from_tier:       opts.fromTier ?? null,
    to_tier:         opts.toTier   ?? null,
    stripe_event_id: opts.stripeEventId,
  })
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error("[webhook] Signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  try {
    switch (event.type) {

      // ── Subscription created ──────────────────────────────────────────
      case "customer.subscription.created": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id ?? ""
        const tier = tierFromPriceId(priceId)
        if (!tier) break

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break

        const founding = isFoundingMember(new Date(sub.created * 1000))

        await supabase
          .from("profiles")
          .update({
            membership_tier:          tier,
            membership_status:        "active",
            stripe_subscription_id:   sub.id,
            membership_started_at:    new Date(sub.created * 1000).toISOString(),
            membership_expires_at:    (() => { const pe = field<number>(sub, "current_period_end"); return pe ? new Date(pe * 1000).toISOString() : null })(),
            is_founding_member:       founding,
          })
          .eq("id", profile.id)

        await logEvent({
          userId:      profile.id,
          eventType:   "subscribed",
          fromTier:    null,
          toTier:      tier,
          stripeEventId: event.id,
        })
        break
      }

      // ── Subscription updated (upgrade / downgrade / status change) ────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string
        const priceId = sub.items.data[0]?.price.id ?? ""
        const newTier = tierFromPriceId(priceId)

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break

        // Fetch existing tier for change detection
        const { data: existing } = await supabase
          .from("profiles")
          .select("membership_tier")
          .eq("id", profile.id)
          .single()
        const oldTier = (existing?.membership_tier as string | null) ?? null

        const statusMap: Record<Stripe.Subscription.Status, string> = {
          active:             "active",
          past_due:           "past_due",
          canceled:           "cancelled",
          unpaid:             "past_due",
          incomplete:         "inactive",
          incomplete_expired: "inactive",
          trialing:           "active",
          paused:             "inactive",
        }

        const pe2 = field<number>(sub, "current_period_end")
        const updates: Record<string, unknown> = {
          membership_status:    statusMap[sub.status] ?? "inactive",
          membership_expires_at: pe2 ? new Date(pe2 * 1000).toISOString() : null,
        }

        if (newTier) updates.membership_tier = newTier

        await supabase.from("profiles").update(updates).eq("id", profile.id)

        // Determine event type for logging
        let eventType = "updated"
        if (newTier && oldTier && newTier !== oldTier) {
          const tierOrder: Record<string, number> = { free: 0, grow: 1, restore: 2, transform: 3 }
          eventType = (tierOrder[newTier] ?? 0) > (tierOrder[oldTier] ?? 0)
            ? "upgraded" : "downgraded"
        }

        await logEvent({
          userId:       profile.id,
          eventType,
          fromTier:     oldTier,
          toTier:       newTier ?? oldTier,
          stripeEventId: event.id,
        })
        break
      }

      // ── Subscription deleted / cancelled ─────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break

        const { data: existing } = await supabase
          .from("profiles")
          .select("membership_tier")
          .eq("id", profile.id)
          .single()

        await supabase
          .from("profiles")
          .update({
            membership_tier:        "free",
            membership_status:      "cancelled",
            stripe_subscription_id: null,
            membership_expires_at:  (() => { const pe = field<number>(sub, "current_period_end"); return pe ? new Date(pe * 1000).toISOString() : null })(),
          })
          .eq("id", profile.id)

        await logEvent({
          userId:       profile.id,
          eventType:    "cancelled",
          fromTier:     existing?.membership_tier ?? null,
          toTier:       "free",
          stripeEventId: event.id,
        })
        break
      }

      // ── Payment failed ────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break

        await supabase
          .from("profiles")
          .update({ membership_status: "past_due" })
          .eq("id", profile.id)

        await logEvent({
          userId:       profile.id,
          eventType:    "payment_failed",
          stripeEventId: event.id,
        })
        break
      }

      // ── Payment succeeded ─────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break

        // Fetch current subscription to get period end
        const invoiceSub = field<string | Stripe.Subscription>(invoice, "subscription")
        const subId = typeof invoiceSub === "string"
          ? invoiceSub
          : (invoiceSub as Stripe.Subscription | null)?.id

        const updates: Record<string, unknown> = { membership_status: "active" }

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const periodEnd = field<number>(sub, "current_period_end")
          if (periodEnd) {
            updates.membership_expires_at = new Date(periodEnd * 1000).toISOString()
          }
        }

        await supabase.from("profiles").update(updates).eq("id", profile.id)
        break
      }

      default:
        // Unknown event — acknowledge without error
        break
    }
  } catch (err) {
    console.error("[webhook] Handler error:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
