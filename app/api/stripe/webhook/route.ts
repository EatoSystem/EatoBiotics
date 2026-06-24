import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { sendEmail } from "@/lib/email/send"
import { stripe } from "@/lib/stripe-server"
import { getSupabase } from "@/lib/supabase"
import { tierFromPriceId, isFoundingMember } from "@/lib/membership"
import { logServerEvent } from "@/lib/statsig-server"
import { welcomeSubscriptionEmailHtml } from "@/lib/email/welcome-subscription-email"
import { cancellationEmail } from "@/lib/email/paid-onboarding-email"
import { getPaidReportSummaryFromSession, isCheckoutSessionSettled } from "@/lib/paid-report-session"
import { decideTrialActivation } from "@/lib/auth/reconcile-account"
import { reportError } from "@/lib/report-error"

// Stripe v20 with the clover API version uses slightly different type shapes.
// We use a helper to safely access fields that may not be in the TS types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field<T>(obj: unknown, key: string): T | undefined { return (obj as any)?.[key] as T | undefined }

// Next.js must NOT parse the body — we need the raw bytes for signature verification

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

  // Idempotency: Stripe redelivers events on retry. Skip any we've already
  // processed so we don't double-apply membership changes or log duplicates.
  // (If the stripe_processed_events table isn't present yet, this read errors
  //  harmlessly and processing continues as before.)
  const { data: alreadyProcessed } = await supabase
    .from("stripe_processed_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle()

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, deduped: true })
  }

  try {
    switch (event.type) {

      // ── One-time report purchase (personal / starter / full / premium) ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "payment") break  // skip subscription checkouts
        if (!isCheckoutSessionSettled(session)) break

        // Identify the user via customer_email or user_id from metadata
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
                foundationType: summary.foundationType ?? null,
                selectedAddon: summary.selectedAddon ?? null,
              },
              status: "in_progress",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_session_id" }
          )
        }

        // Find user profile by email
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, membership_tier, trial_expires_at")
          .eq("email", email)
          .maybeSingle()

        // If the buyer has no account yet, access can't be granted now — it's
        // activated the first time they sign in (see lib/auth/reconcile-account.ts).
        if (!profile) break

        // Activate the 30-day report trial. Shared decision with the auth path so
        // both behave identically: only free/trial accounts (never downgrade a
        // subscriber), never shorten an existing trial, idempotent.
        const decision = decideTrialActivation(
          profile.membership_tier as string | null,
          profile.trial_expires_at as string | null,
          true // a settled payment just landed
        )
        let trialGranted = false
        if (decision.activate) {
          await supabase
            .from("profiles")
            .update({
              membership_tier:   "trial",
              membership_status: "active",
              trial_expires_at:  decision.expiresAt,
            })
            .eq("id", profile.id)
          trialGranted = true
        }

        // Revenue analytics: report purchase + trial start
        await logServerEvent("report_purchased", profile.id, {
          tier:            summary?.tier ?? "personal",
          amount:          String((session.amount_total ?? 0) / 100),
          currency:        (session.currency ?? "eur").toUpperCase(),
          stripe_event_id: event.id,
        })
        if (trialGranted) {
          await logServerEvent("trial_started", profile.id, {
            source:          "report_purchase",
            stripe_event_id: event.id,
          })
        }
        break
      }

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
            trial_expires_at:         null,  // clear any pending trial
          })
          .eq("id", profile.id)

        await logEvent({
          userId:      profile.id,
          eventType:   "subscribed",
          fromTier:    null,
          toTier:      tier,
          stripeEventId: event.id,
        })

        // Welcome email
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
              // New-subscription welcome (transactional) — bypasses the marketing opt-out.
              await sendEmail({
                from:    `EatoBiotics <${emailFrom}>`,
                to:      prof.email as string,
                subject: `Welcome to EatoBiotics ${tier.charAt(0).toUpperCase() + tier.slice(1)} 🎉`,
                html:    welcomeSubscriptionEmailHtml({ name: (prof.name as string | null) ?? null, tier }),
                skipOptOutCheck: true,
              })
            }
          }
        } catch (emailErr) {
          console.error("[webhook] Welcome email failed:", emailErr)
          // Non-fatal — don't throw
        }

        // Statsig: subscription_started — fires once when a new subscription is created.
        // TODO: Replace profile.id with the Supabase user ID linked to a Statsig userID
        //       once you call client.updateUser({ userID: user.id }) after login.
        await logServerEvent("subscription_started", profile.id, {
          tier,
          amount:             String((sub.items.data[0]?.price.unit_amount ?? 0) / 100),
          currency:           (sub.items.data[0]?.price.currency ?? "eur").toUpperCase(),
          interval:           sub.items.data[0]?.price.recurring?.interval ?? "month",
          is_founding_member: String(founding),
          stripe_event_id:    event.id,
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
          const tierOrder: Record<string, number> = { free: 0, trial: 1, grow: 1, member: 2, restore: 2, transform: 3 }
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

        // Analytics: only surface real tier changes (not status-only updates).
        if (eventType === "upgraded" || eventType === "downgraded") {
          await logServerEvent(`subscription_${eventType}`, profile.id, {
            from_tier:       oldTier ?? "unknown",
            to_tier:         newTier ?? "unknown",
            stripe_event_id: event.id,
          })
        }
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

        await logServerEvent("subscription_cancelled", profile.id, {
          from_tier:       (existing?.membership_tier as string | null) ?? "unknown",
          stripe_event_id: event.id,
        })

        // Goodbye / win-back email
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
              const { subject, html } = cancellationEmail({
                name: (prof.name as string | null) ?? null,
                tier: (existing?.membership_tier as string | null) ?? "membership",
              })
              // Cancellation confirmation (transactional account email).
              await sendEmail({
                from: `EatoBiotics <${emailFrom}>`,
                to:   prof.email as string,
                subject,
                html,
                skipOptOutCheck: true,
              })
            }
          }
        } catch (emailErr) {
          console.error("[webhook] Cancellation email failed:", emailErr)
          // Non-fatal — don't throw
        }
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
    await reportError("stripe-webhook", err)
    // Don't record as processed — let Stripe retry this event.
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  // Record only after successful handling so a failed run can be safely retried.
  const { error: recordError } = await supabase
    .from("stripe_processed_events")
    .insert({ event_id: event.id, event_type: event.type })
  if (recordError && recordError.code !== "23505") {
    console.error("[webhook] Failed to record processed event:", recordError.message)
  }

  return NextResponse.json({ received: true })
}
