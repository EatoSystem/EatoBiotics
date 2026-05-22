import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { Resend } from "resend"
import * as Sentry from "@sentry/nextjs"
import { stripe } from "@/lib/stripe-server"
import { getSupabase } from "@/lib/supabase"
import { tierFromPriceId, isFoundingMember } from "@/lib/membership"
import { logServerEvent } from "@/lib/statsig-server"
import { welcomeSubscriptionEmailHtml } from "@/lib/email/welcome-subscription-email"
import { getPaidReportSummaryFromSession, isCheckoutSessionSettled } from "@/lib/paid-report-session"

/** Forward a swallowed webhook error to Sentry tagged with event metadata so
 *  it's findable in production. console.error stays in place so Vercel logs
 *  still show the failure context. */
function reportWebhookError(err: unknown, event: { id: string; type: string }, where: string) {
  Sentry.captureException(err, {
    tags:    { stripe_event_id: event.id, event_type: event.type, area: "webhook" },
    extra:   { where },
  })
}

// Stripe v20 with the clover API version uses slightly different type shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field<T>(obj: unknown, key: string): T | undefined { return (obj as any)?.[key] as T | undefined }

// Tier-order map used to classify subscription_events as upgrade/downgrade.
// Must include EVERY tier the app supports, otherwise legitimate upgrades are
// logged as plain "updated" and the funnel metrics drift.
const TIER_ORDER: Record<string, number> = {
  free: 0, trial: 1, grow: 2, member: 3, restore: 4, transform: 5,
}

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
    // Genuine config error — let Stripe retry after we fix it.
    console.error("[webhook] Supabase client not configured")
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  // ── Idempotency: once a stripe_event_id is recorded as processed, we ack ──
  // Stripe will retry on any non-2xx, so we MUST acknowledge events we've
  // already seen even if they failed downstream the first time.
  const { data: alreadyProcessed } = await supabase
    .from("processed_stripe_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle()

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  // ── Per-case handlers ──
  // Every handler is wrapped in its own try/catch. A failure in one case
  // is logged but never bubbles out — we always return 200 below so Stripe
  // doesn't poison the queue retrying a poison-pill event.
  try {
    switch (event.type) {

      // ── One-time report purchase ──
      case "checkout.session.completed": {
        try {
          const session = event.data.object as Stripe.Checkout.Session
          if (session.mode !== "payment") break
          if (!isCheckoutSessionSettled(session)) break

          const summary = getPaidReportSummaryFromSession(session)
          const email = summary?.email ?? session.customer_details?.email ?? null
          if (!email) break

          if (summary) {
            await supabase.from("deep_assessments").upsert(
              {
                stripe_session_id: session.id,
                email: email.toLowerCase().trim(),
                tier: summary.tier,
                free_scores: {
                  overall: summary.overall,
                  subScores: summary.subScores,
                  profile: summary.profile,
                },
                status: "in_progress",
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_session_id" }
            )
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("id, membership_tier")
            .eq("email", email.toLowerCase().trim())
            .maybeSingle()

          if (!profile) break // trial grant happens on first sign-in instead

          const currentTier = (profile.membership_tier as string) ?? "free"
          if (["free", "trial"].includes(currentTier)) {
            const trialExpiresAt = new Date()
            trialExpiresAt.setDate(trialExpiresAt.getDate() + 30)
            await supabase
              .from("profiles")
              .update({
                membership_tier:   "trial",
                membership_status: "active",
                trial_expires_at:  trialExpiresAt.toISOString(),
              })
              .eq("id", profile.id)
          }
        } catch (err) {
          console.error("[webhook] checkout.session.completed failed:", err, "event:", event.id)
          reportWebhookError(err, event, "checkout.session.completed")
        }
        break
      }

      // ── Subscription created ──
      case "customer.subscription.created": {
        try {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string
          const priceId = sub.items.data[0]?.price.id ?? ""
          const tier = tierFromPriceId(priceId)
          if (!tier) break

          const profile = await getProfileByCustomerId(customerId)
          if (!profile) break

          const founding = isFoundingMember(new Date(sub.created * 1000))
          const periodEnd = field<number>(sub, "current_period_end")

          await supabase
            .from("profiles")
            .update({
              membership_tier:        tier,
              membership_status:      "active",
              stripe_subscription_id: sub.id,
              membership_started_at:  new Date(sub.created * 1000).toISOString(),
              membership_expires_at:  periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              is_founding_member:     founding,
              trial_expires_at:       null,
            })
            .eq("id", profile.id)

          await logEvent({
            userId:        profile.id,
            eventType:     "subscribed",
            toTier:        tier,
            stripeEventId: event.id,
          })

          // Welcome email — non-fatal
          try {
            const resendKey = process.env.RESEND_API_KEY
            const emailFrom = process.env.EMAIL_FROM ?? "hello@eatobiotics.com"
            if (resendKey) {
              const { data: prof } = await supabase
                .from("profiles")
                .select("email, name")
                .eq("id", profile.id)
                .single()
              if (prof?.email) {
                const resend = new Resend(resendKey)
                await resend.emails.send({
                  from:    `EatoBiotics <${emailFrom}>`,
                  to:      prof.email as string,
                  subject: `Welcome to EatoBiotics ${tier.charAt(0).toUpperCase() + tier.slice(1)} 🎉`,
                  html:    welcomeSubscriptionEmailHtml({ name: (prof.name as string | null) ?? null, tier }),
                })
              }
            }
          } catch (emailErr) {
            console.error("[webhook] Welcome email failed:", emailErr, "event:", event.id)
          }

          // Statsig analytics — non-fatal
          try {
            await logServerEvent("subscription_started", profile.id, {
              tier,
              is_founding_member: String(founding),
              stripe_event_id: event.id,
            })
          } catch (analyticsErr) {
            console.error("[webhook] Statsig log failed:", analyticsErr, "event:", event.id)
          }
        } catch (err) {
          console.error("[webhook] customer.subscription.created failed:", err, "event:", event.id)
          reportWebhookError(err, event, "customer.subscription.created")
        }
        break
      }

      // ── Subscription updated (upgrade / downgrade / status change) ──
      case "customer.subscription.updated": {
        try {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string
          const priceId = sub.items.data[0]?.price.id ?? ""
          const newTier = tierFromPriceId(priceId)

          const profile = await getProfileByCustomerId(customerId)
          if (!profile) break

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

          const periodEnd = field<number>(sub, "current_period_end")
          const updates: Record<string, unknown> = {
            membership_status:     statusMap[sub.status] ?? "inactive",
            membership_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
          }
          if (newTier) updates.membership_tier = newTier

          await supabase.from("profiles").update(updates).eq("id", profile.id)

          let eventType = "updated"
          if (newTier && oldTier && newTier !== oldTier) {
            eventType = (TIER_ORDER[newTier] ?? 0) > (TIER_ORDER[oldTier] ?? 0)
              ? "upgraded" : "downgraded"
          }

          await logEvent({
            userId:        profile.id,
            eventType,
            fromTier:      oldTier,
            toTier:        newTier ?? oldTier,
            stripeEventId: event.id,
          })
        } catch (err) {
          console.error("[webhook] customer.subscription.updated failed:", err, "event:", event.id)
          reportWebhookError(err, event, "customer.subscription.updated")
        }
        break
      }

      // ── Subscription deleted / cancelled ──
      case "customer.subscription.deleted": {
        try {
          const sub = event.data.object as Stripe.Subscription
          const customerId = sub.customer as string

          const profile = await getProfileByCustomerId(customerId)
          if (!profile) break

          const { data: existing } = await supabase
            .from("profiles")
            .select("membership_tier")
            .eq("id", profile.id)
            .single()

          const periodEnd = field<number>(sub, "current_period_end")

          await supabase
            .from("profiles")
            .update({
              membership_tier:        "free",
              membership_status:      "cancelled",
              stripe_subscription_id: null,
              membership_expires_at:  periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            })
            .eq("id", profile.id)

          await logEvent({
            userId:        profile.id,
            eventType:     "cancelled",
            fromTier:      (existing?.membership_tier as string | null) ?? null,
            toTier:        "free",
            stripeEventId: event.id,
          })
        } catch (err) {
          console.error("[webhook] customer.subscription.deleted failed:", err, "event:", event.id)
          reportWebhookError(err, event, "customer.subscription.deleted")
        }
        break
      }

      // ── Payment failed ──
      case "invoice.payment_failed": {
        try {
          const invoice = event.data.object as Stripe.Invoice
          const customerId = invoice.customer as string

          const profile = await getProfileByCustomerId(customerId)
          if (!profile) break

          await supabase
            .from("profiles")
            .update({ membership_status: "past_due" })
            .eq("id", profile.id)

          await logEvent({
            userId:        profile.id,
            eventType:     "payment_failed",
            stripeEventId: event.id,
          })
        } catch (err) {
          console.error("[webhook] invoice.payment_failed failed:", err, "event:", event.id)
          reportWebhookError(err, event, "invoice.payment_failed")
        }
        break
      }

      // ── Payment succeeded ──
      case "invoice.payment_succeeded": {
        try {
          const invoice = event.data.object as Stripe.Invoice
          const customerId = invoice.customer as string

          const profile = await getProfileByCustomerId(customerId)
          if (!profile) break

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
        } catch (err) {
          console.error("[webhook] invoice.payment_succeeded failed:", err, "event:", event.id)
          reportWebhookError(err, event, "invoice.payment_succeeded")
        }
        break
      }

      default:
        // Unknown event type — acknowledged below with the 200 response.
        break
    }
  } catch (err) {
    // Defensive: should never reach here because every case has its own catch.
    console.error("[webhook] Unhandled outer error:", err, "event:", event.id)
  }

  // Mark this event as processed so retries become no-ops. Even if the case
  // handler errored above, we record processing — Stripe retries do not help
  // recover from logic bugs, they only amplify them. Operators replay via
  // the Stripe dashboard after fixing the underlying issue.
  try {
    await supabase
      .from("processed_stripe_events")
      .insert({ stripe_event_id: event.id, event_type: event.type })
  } catch (err) {
    // Race: another concurrent webhook may have inserted first. That's fine —
    // the primary-key conflict is the dedup working correctly.
    console.warn("[webhook] processed_stripe_events insert race:", err)
  }

  return NextResponse.json({ received: true })
}
