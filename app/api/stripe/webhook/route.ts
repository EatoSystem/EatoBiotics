import { NextRequest, NextResponse } from "next/server"
import type Stripe from "stripe"
import { sendEmail } from "@/lib/email/send"
import { stripe } from "@/lib/stripe-server"
import { getSupabase } from "@/lib/supabase"
import { tierFromPriceId, isFoundingMember } from "@/lib/membership"
import { logServerEvent } from "@/lib/statsig-server"
import { welcomeSubscriptionEmailHtml } from "@/lib/email/welcome-subscription-email"
import { cancellationEmail } from "@/lib/email/paid-onboarding-email"
import { resolvePaidReportSummary, isCheckoutSessionSettled } from "@/lib/paid-report-session"
import { decideTrialActivation } from "@/lib/auth/reconcile-account"
import { entitlementAnchorFromSession } from "@/lib/auth/entitlement-anchor"
import { reportError } from "@/lib/report-error"

// Stripe v20 with the clover API version uses slightly different type shapes.
// We use a helper to safely access fields that may not be in the TS types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function field<T>(obj: unknown, key: string): T | undefined { return (obj as any)?.[key] as T | undefined }

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const sub = invoice.parent?.subscription_details?.subscription
    ?? field<string | Stripe.Subscription>(invoice, "subscription")
  return typeof sub === "string" ? sub : sub?.id
}

async function requireDb<T>(query: PromiseLike<{ data: T; error: { message: string } | null }>): Promise<T> {
  const { data, error } = await query
  if (error) throw new Error(`[webhook] Database operation failed: ${error.message}`)
  return data
}

type BillingProfile = {
  id: string
  membership_tier: string | null
  stripe_subscription_id: string | null
  membership_started_at?: string | null
  membership_status?: string | null
  trial_expires_at?: string | null
}

function isSuperseded(profile: BillingProfile, sub: Stripe.Subscription, rejectCancelled = true): boolean {
  const startedAt = Date.parse(profile.membership_started_at ?? "")
  const incomingAt = sub.created * 1000
  if (Number.isFinite(startedAt) && incomingAt < startedAt) return true
  if (profile.stripe_subscription_id && profile.stripe_subscription_id !== sub.id) {
    if (!Number.isFinite(startedAt) || !Number.isFinite(incomingAt) || incomingAt === startedAt) {
      throw new Error("Cannot establish subscription ordering; retry required")
    }
  }
  return rejectCancelled && !profile.stripe_subscription_id && profile.membership_status === "cancelled"
    && Number.isFinite(startedAt) && incomingAt <= startedAt
}

async function updateMembership(profile: BillingProfile, updates: Record<string, unknown>) {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Database not configured")
  let query = supabase.from("profiles").update(updates, { count: "exact" }).eq("id", profile.id)
  query = profile.membership_tier === null
    ? query.is("membership_tier", null) : query.eq("membership_tier", profile.membership_tier)
  query = profile.stripe_subscription_id
    ? query.eq("stripe_subscription_id", profile.stripe_subscription_id) : query.is("stripe_subscription_id", null)
  if (profile.trial_expires_at !== undefined) {
    query = profile.trial_expires_at === null
      ? query.is("trial_expires_at", null) : query.eq("trial_expires_at", profile.trial_expires_at)
  }
  const { error, count } = await query
  if (error) throw new Error(`[webhook] Membership update failed: ${error.message}`)
  if (count !== 1) throw new Error("Membership changed during webhook processing; retry required")
}

// Next.js must NOT parse the body — we need the raw bytes for signature verification

/** Look up a profile by Stripe customer ID */
async function getProfileByCustomerId(customerId: string) {
  const supabase = getSupabase()
  if (!supabase) throw new Error("Database not configured")
  return requireDb(supabase
    .from("profiles")
    .select("id, membership_tier, stripe_subscription_id, membership_started_at, membership_status")
    .eq("stripe_customer_id", customerId)
    .maybeSingle())
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
  if (!supabase) throw new Error("Database not configured")
  const existing = await requireDb(supabase.from("subscription_events")
    .select("stripe_event_id").eq("user_id", opts.userId).eq("stripe_event_id", opts.stripeEventId)
    .limit(1).maybeSingle())
  if (existing) return
  await requireDb(supabase.from("subscription_events").insert({
    user_id:         opts.userId,
    event_type:      opts.eventType,
    from_tier:       opts.fromTier ?? null,
    to_tier:         opts.toTier   ?? null,
    stripe_event_id: opts.stripeEventId,
  }))
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

  /* ══ IDEMPOTENCY: FAIL CLOSED, RECORD COMPLETION AFTER DURABLE WRITES ═════
   *
   * Stripe redelivers on retry, and two deliveries of one event can overlap.
   *
   * This used to read, then run every side effect, then insert the marker —
   * and swallow the insert's 23505. Two concurrent deliveries therefore both
   * passed the read and both ran: two `report_purchased` revenue events, two
   * `subscription_events` rows. The unique violation was caught, but it was
   * caught far too late to prevent anything. The read also discarded its own
   * error, so any transient read failure silently read as "not processed yet"
   * and re-ran everything — fail-open idempotency.
   *
   * The read remains fail-closed. Completion ordering is deliberately different:
   *
   *   1. A read error is fatal. If the store cannot say whether this event was
   *      handled, the safe answer is not "run all the side effects again" —
   *      it is to fail and let Stripe retry. (The old comment justified the
   *      swallow with "if the table isn't present yet"; `stripe_processed_
   *      events` has been in production since Migration 17, verified.)
   *
   *   2. Previously the marker was INSERTED AS A CLAIM before any side effect.
   *      The primary key excluded concurrent deliveries, but a crash or failed
   *      compensating delete permanently marked unfinished work as processed.
   *      A duplicate could even receive 200 while the claimant was failing.
   *      Now every required database operation is checked, and the marker is
   *      inserted only AFTER they succeed. No failed operation needs cleanup.
   *      Only the completion-marker winner sends optional email and analytics.
   *
   * ══ THE RESIDUAL WINDOW, STATED RATHER THAN IMPLIED ══════════════════════
   *
   * Completion-only markers cannot serialize durable writes across instances.
   * Profile writes use optimistic guards; paid rows preserve progress; audit
   * lookup prevents sequential retry duplicates but is NOT an atomic unique
   * constraint. Concurrent audit duplicates remain possible. Exactly-once
   * durable processing needs a transaction or leased claimed/completed state,
   * which requires a migration, excluded from this change. A crash after the
   * completion marker can lose optional email/analytics; an outbox is needed
   * for guaranteed delivery. Historical early claims are indistinguishable
   * from completed rows and are not repaired by this code.
   *
   * What bounds the damage today: the one commercially load-bearing effect —
   * the 30-day entitlement — is recoverable without this event, because the
   * paid row carries the buyer's email and `reconcileAccountAfterAuth` grants
   * the purchase-anchored window at their next sign-in.
   */
  let alreadyProcessed
  try {
    alreadyProcessed = await requireDb(supabase.from("stripe_processed_events")
      .select("event_id").eq("event_id", event.id).maybeSingle())
  } catch (err) {
    console.error("[webhook] idempotency read failed:", err)
    return NextResponse.json({ error: "Idempotency store unavailable" }, { status: 500 })
  }

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, deduped: true })
  }

  const afterCompletion: Array<() => Promise<void>> = []
  try {
    switch (event.type) {

      // ── One-time report purchase (personal / starter / full / premium) ──
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== "payment") break  // skip subscription checkouts
        if (!isCheckoutSessionSettled(session)) break

        // Identify the user via customer_email or user_id from metadata
        const summary = await resolvePaidReportSummary(session, supabase, { failOnReadError: true })
        const email = summary?.email ?? session.customer_details?.email ?? null
        if (!email) break

        if (summary) {
          const reportData = {
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
          }
          await requireDb(supabase.from("deep_assessments").upsert(
            {
              ...reportData,
              status: "in_progress",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "stripe_session_id", ignoreDuplicates: true }
          ))
          await requireDb(supabase.from("deep_assessments").update(reportData)
            .eq("stripe_session_id", session.id))
        }

        // Find user profile by email
        const profile = await requireDb(supabase
          .from("profiles")
          .select("id, membership_tier, trial_expires_at, stripe_subscription_id")
          .eq("email", email)
          .maybeSingle())

        // If the buyer has no account yet, access can't be granted now — it's
        // activated the first time they sign in (see lib/auth/reconcile-account.ts).
        if (!profile) break

        // Activate the 30-day report trial. Shared decision with the auth path so
        // both behave identically: only free/trial accounts (never downgrade a
        // subscriber), and the window is anchored to the PURCHASE rather than
        // to now — so a redelivered or replayed event recomputes the same
        // expiry instead of sliding it forward.
        //
        // The 30-day clock starts at the LATEST instant this checkout could
        // have settled — not at `created`, which is when the buyer STARTED
        // checkout. Anchoring at the start would sell 30 days and deliver 29
        // to anyone who finished late. The same pure rule runs on the sign-in
        // path, so the two can never compute different expiries for one
        // purchase. See lib/auth/entitlement-anchor.ts for the proof.
        //
        // This deliberately does NOT read `deep_assessments.created_at`: that
        // column is "when the row was first written", and the row can be
        // created by the questionnaire days after the purchase whenever this
        // webhook did not run.
        const anchorAt = entitlementAnchorFromSession(session)

        const decision = decideTrialActivation(
          profile.membership_tier as string | null,
          profile.trial_expires_at as string | null,
          anchorAt,
        )
        let trialGranted = false
        if (decision.activate) {
          await updateMembership(profile, {
              membership_tier:   "trial",
              membership_status: "active",
              trial_expires_at:  decision.expiresAt,
            })
          trialGranted = true
        }

        // Revenue analytics: report purchase + trial start
        afterCompletion.push(async () => {
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
        })
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
        if (isSuperseded(profile, sub)) break

        const founding = isFoundingMember(new Date(sub.created * 1000))

        await updateMembership(profile, {
            membership_tier:          tier,
            membership_status:        "active",
            stripe_subscription_id:   sub.id,
            membership_started_at:    new Date(sub.created * 1000).toISOString(),
            membership_expires_at:    (() => { const pe = field<number>(sub, "current_period_end"); return pe ? new Date(pe * 1000).toISOString() : null })(),
            is_founding_member:       founding,
            trial_expires_at:         null,  // clear any pending trial
          })

        await logEvent({
          userId:      profile.id,
          eventType:   "subscribed",
          fromTier:    null,
          toTier:      tier,
          stripeEventId: event.id,
        })

        afterCompletion.push(async () => {
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
        if (isSuperseded(profile, sub)) break

        // Fetch existing tier for change detection
        const oldTier = (profile.membership_tier as string | null) ?? null

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

        /* ══ CONVERGENCE: THIS BRANCH WRITES THE WHOLE DURABLE TRUTH ═══════
         *
         * `stripe_subscription_id`, `membership_started_at` and
         * `is_founding_member` used to be written ONLY by
         * `customer.subscription.created`. That was survivable while a failed
         * handler left the event unmarked and Stripe's retry re-ran it. The
         * previous early claim could survive a mid-handler crash and leave
         * those fields never written. Founding-member status is a real
         * benefit; losing it to a crash is not acceptable, and it is not
         * analytics. Keep convergence even with completion-only markers: it
         * also repairs historical early claims that were never cleaned up.
         *
         * Every one of them is derivable from the Stripe object this branch is
         * already holding, so membership state converges to Stripe's truth
         * instead of depending on one historical event having completed. A
         * later legitimate `updated` fully repairs a lost `created`.
         *
         * Derived, never incremented or toggled, so a replay recomputes the
         * same values and changes nothing.
         */
        const pe2 = field<number>(sub, "current_period_end")
        const status = statusMap[sub.status] ?? "inactive"
        const updates: Record<string, unknown> = {
          membership_status:      status,
          membership_expires_at:  pe2 ? new Date(pe2 * 1000).toISOString() : null,
          stripe_subscription_id: sub.id,
          membership_started_at:  new Date(sub.created * 1000).toISOString(),
          is_founding_member:     isFoundingMember(new Date(sub.created * 1000)),
        }

        if (newTier) updates.membership_tier = newTier

        // Only while the subscription is actually live. Clearing it on a
        // cancellation or a failed payment would destroy a separately-bought
        // €49 report entitlement that has nothing to do with this subscription.
        if (status === "active") updates.trial_expires_at = null

        await updateMembership(profile, updates)

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
          afterCompletion.push(() => logServerEvent(`subscription_${eventType}`, profile.id, {
            from_tier:       oldTier ?? "unknown",
            to_tier:         newTier ?? "unknown",
            stripe_event_id: event.id,
          }))
        }
        break
      }

      // ── Subscription deleted / cancelled ─────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription
        const customerId = sub.customer as string

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break
        if (profile.stripe_subscription_id && profile.stripe_subscription_id !== sub.id) break
        if (isSuperseded(profile, sub, false)) break

        await updateMembership(profile, {
            membership_tier:        "free",
            membership_status:      "cancelled",
            stripe_subscription_id: null,
            membership_expires_at:  (() => { const pe = field<number>(sub, "current_period_end"); return pe ? new Date(pe * 1000).toISOString() : null })(),
          })

        await logEvent({
          userId:       profile.id,
          eventType:    "cancelled",
          fromTier:     profile.membership_tier ?? null,
          toTier:       "free",
          stripeEventId: event.id,
        })

        afterCompletion.push(async () => {
          await logServerEvent("subscription_cancelled", profile.id, {
            from_tier:       (profile.membership_tier as string | null) ?? "unknown",
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
                  tier: (profile.membership_tier as string | null) ?? "membership",
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
        })
        break
      }

      // ── Payment failed ────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const profile = await getProfileByCustomerId(customerId)
        if (!profile) break
        const subId = invoiceSubscriptionId(invoice)
        if (subId && profile.stripe_subscription_id && subId !== profile.stripe_subscription_id) break
        if (subId && !profile.stripe_subscription_id && profile.membership_status === "cancelled") break

        await updateMembership(profile, { membership_status: "past_due" })

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
        const subId = invoiceSubscriptionId(invoice)
        if (subId && profile.stripe_subscription_id && subId !== profile.stripe_subscription_id) break
        if (subId && !profile.stripe_subscription_id && profile.membership_status === "cancelled") break

        const updates: Record<string, unknown> = { membership_status: "active" }

        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          const periodEnd = field<number>(sub, "current_period_end")
          if (periodEnd) {
            updates.membership_expires_at = new Date(periodEnd * 1000).toISOString()
          }
        }

        await updateMembership(profile, updates)
        break
      }

      default:
        // Unknown event — acknowledge without error
        break
    }
  } catch (err) {
    await reportError("stripe-webhook", err)

    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  try {
    const { error: markerError } = await supabase.from("stripe_processed_events")
      .insert({ event_id: event.id, event_type: event.type })
    if (markerError?.code === "23505") return NextResponse.json({ received: true, deduped: true })
    if (markerError) throw new Error(`Completion marker failed: ${markerError.message}`)
  } catch (err) {
    await reportError("stripe-webhook", err)
    return NextResponse.json({ error: "Idempotency store unavailable" }, { status: 500 })
  }
  for (const effect of afterCompletion) {
    try {
      await effect()
    } catch (err) {
      console.error("[webhook] Non-critical notification failed:", err)
    }
  }
  return NextResponse.json({ received: true })
}
