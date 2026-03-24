# EatoBiotics — Manual Testing Checklist

Test these flows **in order of priority** before deploying the membership build to production.

---

## Pre-flight Checks

Before testing, ensure:
- [ ] All 5 SQL migrations have been run in Supabase (`supabase/migrations.sql`)
- [ ] `STRIPE_GROW_PRICE_ID`, `STRIPE_RESTORE_PRICE_ID`, `STRIPE_TRANSFORM_PRICE_ID` are set
- [ ] `NEXT_PUBLIC_STRIPE_GROW_PRICE_ID` etc. are also set (public versions for client)
- [ ] `STRIPE_WEBHOOK_SECRET` is set and matches the Stripe Dashboard webhook
- [ ] `ANTHROPIC_API_KEY` is set
- [ ] `FOUNDING_MEMBER_CUTOFF_DATE` is set to the agreed date
- [ ] Stripe webhook is registered for: `customer.subscription.created`, `.updated`, `.deleted`, `invoice.payment_failed`, `invoice.payment_succeeded`
- [ ] Stripe Customer Portal is enabled and configured in the Stripe Dashboard

---

## Priority 1 — Stripe Webhook (Critical)

### 1.1 Webhook signature verification
- [ ] Send a POST to `/api/stripe/webhook` with an invalid `stripe-signature` header
- [ ] Verify response is `400` with `{ error: "Invalid signature" }`
- [ ] Send a POST without a `stripe-signature` header
- [ ] Verify response is `400`

### 1.2 Subscription created → DB updated
- [ ] Create a test subscription using Stripe test mode (Grow plan)
- [ ] Verify Stripe fires `customer.subscription.created`
- [ ] Check `profiles` table: `membership_tier = 'grow'`, `membership_status = 'active'`
- [ ] Check `subscription_events` table: row with `event_type = 'subscribed'`

### 1.3 Payment failed → past_due
- [ ] Use Stripe test card `4000000000000341` (always fails payment)
- [ ] Verify Stripe fires `invoice.payment_failed`
- [ ] Check `profiles`: `membership_status = 'past_due'`
- [ ] Check `subscription_events`: row with `event_type = 'payment_failed'`

### 1.4 Subscription cancelled → reverts to free
- [ ] Cancel a test subscription via Stripe Dashboard
- [ ] Verify `customer.subscription.deleted` event fired
- [ ] Check `profiles`: `membership_tier = 'free'`, `membership_status = 'cancelled'`
- [ ] Check `subscription_events`: row with `event_type = 'cancelled'`

### 1.5 Upgrade/downgrade
- [ ] Change a subscription from Grow to Restore via Stripe Dashboard
- [ ] Check `profiles`: `membership_tier = 'restore'`
- [ ] Check `subscription_events`: row with `event_type = 'upgraded'`

---

## Priority 2 — Checkout Flow (End-to-end)

### 2.1 Logged-out user → pricing page → auth → checkout
- [ ] Sign out of all sessions
- [ ] Visit `/pricing`
- [ ] Click "Upgrade" on Grow tier
- [ ] Verify redirect to `/assessment?signin=1&redirect=/pricing`
- [ ] Complete sign-in
- [ ] Verify redirected back to `/pricing`
- [ ] Click "Upgrade" on Grow tier again
- [ ] Verify Stripe Checkout opens
- [ ] Complete with test card `4242 4242 4242 4242`
- [ ] Verify redirect to `/account?subscription=success`
- [ ] Verify `membership_tier = 'grow'` in Supabase `profiles` table

### 2.2 Logged-in user upgrade
- [ ] Log in as a free-tier user
- [ ] Visit `/pricing`
- [ ] Click "Upgrade" on Restore tier
- [ ] Verify Stripe Checkout opens without auth redirect
- [ ] Complete payment
- [ ] Verify `membership_tier = 'restore'`

### 2.3 Invalid price ID rejected
- [ ] POST to `/api/stripe/create-subscription-checkout` with a fake `priceId`
- [ ] Verify `400` response with `{ error: "Invalid price ID" }`

### 2.4 Unauthenticated checkout rejected
- [ ] POST to `/api/stripe/create-subscription-checkout` without a session
- [ ] Verify `401` response

---

## Priority 3 — Customer Portal

### 3.1 Portal session created
- [ ] Log in as an active paid member
- [ ] Click "Manage Subscription" in the dashboard Membership tab
- [ ] Verify redirect to Stripe Customer Portal
- [ ] Cancel subscription via portal
- [ ] Verify redirect back to `/account`
- [ ] Verify webhook fires and DB is updated

### 3.2 Unauthenticated portal rejected
- [ ] POST to `/api/stripe/create-portal-session` without a session
- [ ] Verify `401` response

---

## Priority 4 — Feature Gating

### 4.1 Free tier daily analysis limit
- [ ] Log in as a free-tier user
- [ ] Perform one meal analysis on `/analyse`
- [ ] Verify it completes normally
- [ ] Reload `/analyse`
- [ ] Verify soft gate banner appears above upload area: "You've used your free analysis for today"
- [ ] Verify upload area is still visible (not hard-blocked)
- [ ] Verify "Upgrade to Grow" CTA links to `/pricing`

### 4.2 Score history locked on free tier
- [ ] Log in as a free-tier user with assessment data
- [ ] Visit `/account` → Overview tab
- [ ] Verify score history/ProgressChart has FeatureGate overlay
- [ ] Verify "Grow feature" badge is visible
- [ ] Verify "Unlock with Grow" button links to `/pricing`

### 4.3 Paid tier bypasses gate
- [ ] Log in as a Grow-tier user
- [ ] Verify ProgressChart renders without overlay
- [ ] Verify unlimited analyses: perform 2+ analyses in one day — no gate shown

---

## Priority 5 — AI Consultation (Transform only)

### 5.1 Access gate
- [ ] Log in as a free or Grow user
- [ ] Visit `/account/consult`
- [ ] Verify redirect to `/pricing?feature=ai-consultation`
- [ ] Verify pricing page highlights Transform tier

### 5.2 Transform access
- [ ] Log in as an active Transform member
- [ ] Visit `/account/consult`
- [ ] Verify score strip shows current Biotics Score and 5-pillar bars
- [ ] Verify starter questions are displayed before first message

### 5.3 Streaming response
- [ ] Send a message
- [ ] Verify response streams in (text appears progressively, not all at once)
- [ ] Verify "Your next step" box appears at the bottom of the response
- [ ] Verify consultation is logged to `consultations` table

### 5.4 API gate
- [ ] POST to `/api/consult` as a free user (or without auth)
- [ ] Verify `403` or `401` response respectively

---

## Priority 6 — Pricing Page

### 6.1 Public access
- [ ] Visit `/pricing` while logged out
- [ ] Verify all 4 tiers render with correct prices and feature lists
- [ ] Verify "Grow" has "Most Popular" badge
- [ ] Verify "Transform" has "Founding Member" badge (if `FOUNDING_MEMBER_CUTOFF_DATE` is in future)
- [ ] Verify "Get started" buttons redirect to auth flow when clicked

### 6.2 Logged-in current plan
- [ ] Log in as a Grow member
- [ ] Visit `/pricing`
- [ ] Verify Grow tier shows "Current Plan" (disabled)
- [ ] Verify Restore and Transform show "Upgrade"
- [ ] Verify Free shows no CTA (or "-")

---

## Priority 7 — Weekly Check-in Cron

### 7.1 Manual trigger
- [ ] Ensure at least one active Transform member exists in DB
- [ ] GET `/api/weekly-checkin` with `Authorization: Bearer <CRON_SECRET>` header
- [ ] Verify `{ processed: N, failed: 0, total: N }` response
- [ ] Verify row(s) created in `weekly_checkins` table with content

### 7.2 Unauthorised trigger rejected (if CRON_SECRET is set)
- [ ] GET `/api/weekly-checkin` without the correct header
- [ ] Verify `401` response

---

## Priority 8 — Founding Member Flag

### 8.1 Flag set on early subscription
- [ ] Set `FOUNDING_MEMBER_CUTOFF_DATE` to a future date
- [ ] Create a new test subscription via checkout
- [ ] Verify `profiles.is_founding_member = true` after webhook fires

### 8.2 Flag not set after cutoff
- [ ] Set `FOUNDING_MEMBER_CUTOFF_DATE` to a past date
- [ ] Create a new test subscription
- [ ] Verify `profiles.is_founding_member = false`

---

## Regression Checks (Existing flows must still work)

- [ ] Free assessment → report → email delivered
- [ ] Paid report checkout (€20/€40/€50) → Stripe → deep assessment → PDF → email
- [ ] Magic link sign-in
- [ ] Referral system: 3 referrals → `membership = 'early_access'`
- [ ] `/demo/account` still loads with mock data
- [ ] `/analyse` page works for paid users without any gate

---

## Decisions to Review Before Go-Live

1. **`FOUNDING_MEMBER_CUTOFF_DATE`** — confirm the exact date/time with Jason
2. **Weekly check-in schedule** — `0 8 * * 1` = Monday 8am UTC. Confirm whether 8am Irish time (requires `0 7 * * 1` in summer) is required
3. **Stripe Customer Portal configuration** — ensure the portal is enabled and the return URL is set in the Stripe Dashboard
4. **Stripe webhook endpoint URL** — register `https://eatobiotics.com/api/stripe/webhook` in the Stripe Dashboard and copy the signing secret to `STRIPE_WEBHOOK_SECRET`
5. **`CRON_SECRET`** — set a strong random secret in Vercel env vars to protect the weekly-checkin endpoint
