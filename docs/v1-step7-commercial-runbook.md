# V1 Step 7 — external commercial verification runbook

**Status: NOT YET RUN.** Until a human completes it, Step 7 is
*implementation and CI proof complete, external commercial verification
pending* — not "Step 7 complete."

---

## Why this document exists

Step 7's automated proof runs in a container with **no Stripe credentials, no
Stripe CLI, and no network route to `api.stripe.com`** (the agent proxy refuses
`CONNECT` with 403). Supabase application credentials are absent too.

So the repository can prove a great deal about **its own handlers** — real
webhook signatures, duplicate and replayed delivery, idempotency, the
entitlement window — and nothing at all about **Stripe's behaviour, this
account's configuration, storage, or real email delivery.**

Those are the two evidence categories, and they must never be collapsed:

| Category | Where it comes from |
|---|---|
| **PROVEN IN CI** | `tests/unit/v1-paid-journey.test.ts`, `v1-paid-identity.test.ts`, `reconcile-account.test.ts`, `stripe-mock-coverage.test.ts`. Database effects are observed through a **double** (`tests/unit/support/postgrest-double.ts`) — never call that "Supabase verified". |
| **PROVEN BY HUMAN EXTERNAL RUN** | This document, once completed and signed off. |
| **UNVERIFIED** | Anything neither has covered. Listed at the end. |

Run this in **Stripe test mode**, against a **non-production** deployment, with
a **test** Supabase project. Never against the production project
`ephmojiwlcebenholhpc`.

---

## R1 — Environment preflight

- [ ] `STRIPE_SECRET_KEY` is a **test-mode** key (`sk_test_…`).
- [ ] `STRIPE_WEBHOOK_SECRET` matches the endpoint you will use.
- [ ] `NEXT_PUBLIC_SITE_URL` points at the deployment under test.
- [ ] `RESEND_API_KEY` + `EMAIL_FROM` set, and you can read the inbox.
- [ ] `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` point at a **non-production**
      project.
- [ ] `UNSUBSCRIBE_SECRET` set (carried forward from Step 6).

Record: deployment URL, Stripe account id, Supabase project ref.

## R2 — **MANDATORY: which payment methods are enabled?**

*This step decides a known defect. Do not skip it.*

In the Stripe Dashboard, for the account used by `/api/checkout`, list every
payment method enabled for a one-time EUR Checkout Session.

- [ ] Methods enabled: ______________________________________________

**Then apply the rule:**

- **All enabled methods settle synchronously** (cards, Apple/Google Pay, Link)
  → record the delayed-notification branch as **unreachable for V1**. Defect 2
  stays deferred. Note it here and move on.
- **Any delayed-notification method is enabled or reachable** — SEPA Direct
  Debit, iDEAL, Bancontact, Sofort, Przelewy24, BLIK, multibanco, customer
  balance — → **this is a Step 7 blocker.** `checkout.session.completed`
  arrives `payment_status: "unpaid"`, the handler breaks, the event is recorded
  as processed, and `checkout.session.async_payment_succeeded` is not handled
  at all. The buyer pays €49 and receives nothing. **Stop and repair before
  Step 7 closes.**

The exact current behaviour is pinned in
`tests/unit/v1-paid-journey.test.ts` → *"PINNED CURRENT BEHAVIOUR:
delayed-notification payment methods"*.

- [ ] Outcome: ☐ unreachable, deferred  ☐ **reachable — BLOCKER**

## R3 — The normal purchase

- [ ] Complete the free Food System Assessment at `/assessment/you`.
- [ ] Reach the €49 offer; tick the health-data consent and the
      start-now confirmation.
- [ ] Pay with `4242 4242 4242 4242`, any future expiry, any CVC.
- [ ] Land on `/assessment/deep?session_id=cs_test_…`.

Record the `cs_test_…` session id: ______________________

**Check in Stripe:** the session shows `payment_status: paid`,
`amount_total: 4900`, `currency: eur`, and metadata carries `summary_token`,
`report_tier`, `requested_immediate_start`, `requested_at` — **and nothing
describing the buyer's answers or health data.**

- [ ] Confirmed: Stripe holds no health-derived data.

## R4 — Real webhook delivery

- [ ] The endpoint received `checkout.session.completed` and returned 200.
- [ ] `deep_assessments` has a row for this session id with
      **`email` populated**, `tier`, `free_scores`, `created_at`.
- [ ] `stripe_processed_events` has exactly one row for this event id.
- [ ] If the buyer had an account: `profiles.trial_expires_at` is **30 days
      after the purchase**, not 30 days after the webhook fired.

## R5 — Deep assessment and Report

- [ ] Complete the questionnaire.
- [ ] The Report generates; `deep_assessments.status` reaches completion and
      `report_json` is populated.
- [ ] `/assessment/report?session_id=…` renders the buyer's own Report.

## R6 — PDF and storage

- [ ] `pdf_status` is `uploaded` and the object exists in storage.
- [ ] The download link works from the Report page.
- [ ] Re-load the page later: a **fresh signed URL** is minted (the stored
      7-day URL is not reused).

## R7 — Real email delivery

- [ ] The Report email arrives via Resend, to the address used at checkout.
- [ ] `email_sent_at` / `email_status` recorded.
- [ ] `email_sends` holds the idempotency row.
- [ ] Headers carry a working `List-Unsubscribe` (Step 6:
      only when `UNSUBSCRIBE_SECRET` is set).

## R8 — Account access and re-download

- [ ] Sign in with the purchase email (magic link).
- [ ] `/account` shows the purchase.
- [ ] The Report re-downloads with a newly signed URL.
- [ ] **Sign out and back in twice.** `trial_expires_at` **does not move.**
      *(This is Finding 5. Before Step 7 it slid forward on every sign-in.)*

## R9 — Buyer with no account at purchase time

- [ ] Buy with an address that has no account.
- [ ] Confirm no `profiles` row is touched by the webhook.
- [ ] Then sign up with that address.
- [ ] Access is granted on first sign-in, and expires **30 days after the
      purchase**, not 30 days after the signup.

## R10 — Duplicate and replayed delivery, through Stripe's own tooling

- [ ] In the Dashboard, **resend** the `checkout.session.completed` event.
- [ ] The endpoint returns 200 and reports `deduped`.
- [ ] **No second** `report_purchased` analytics event.
- [ ] `trial_expires_at` unchanged.
- [ ] `deep_assessments` still has exactly one row.
- [ ] With `stripe listen`/`stripe trigger` if available, fire the same event
      twice in rapid succession and confirm one outcome.

## R11 — Failure and retry

- [ ] Temporarily break a downstream dependency, deliver an event, and confirm
      the endpoint returns 500.
- [ ] Confirm **no row remains** in `stripe_processed_events` for that event
      (the claim was released).
- [ ] Restore, let Stripe retry, and confirm the event processes **exactly
      once**.

## R12 — The entitlement is anchored to the purchase

*Added by the Step 7 review repair. The 30-day window is now derived from
Stripe's Checkout Session, not from when any database row happened to be
written, so retrieval is part of the mechanism rather than a convenience.*

- [ ] **Retrieve an old session.** Take a `cs_test_…` id from a checkout made
      as long ago as this account has one and call
      `stripe.checkout.sessions.retrieve`. Confirm it still returns, and still
      carries `created`. The entitlement resolves this at sign-in, so if Stripe
      stops returning sessions at some age, the window silently stops being
      grantable. **Record the oldest age you could retrieve.**
      *(Failure here is safe, not wrong: the resolver fails closed, so the
      worst case is a grant deferred to the next sign-in — never a wrong one.)*
- [ ] **The day-10 case.** Buy, then do **not** open the questionnaire. Wait
      (or use a test clock), then start it and sign in. `trial_expires_at` must
      be **30 days after the purchase**, not 30 days after the questionnaire.
- [ ] **A 100%-promo checkout** (`no_payment_required`, no PaymentIntent) still
      yields an entitlement — this is why `session.created` is the datum.

## R13 — Cancellation converges

*`customer.subscription.deleted` is terminal: Stripe sends nothing further, so
nothing can repair a handler that did not finish. Access is therefore bounded
by the paid-through date.*

- [ ] Subscribe, then cancel. Confirm `membership_expires_at` holds the period
      end and access ends at it (plus the 3-day renewal grace).
- [ ] **Simulate the lost cancellation**: leave a profile at
      `membership_status: "active"` with a past `membership_expires_at` and
      confirm `getUserMembershipTier` returns `free`.
- [ ] **Renewal is not disrupted**: let a live subscription renew and confirm
      `membership_expires_at` moves forward and access is unbroken.
- [ ] Confirm a profile with a **null** `membership_expires_at` still has
      access — the deliberate fail-open residual.

## R14 — Refusals

- [ ] A request with a bad signature → 400.
- [ ] A replayed body older than Stripe's tolerance → 400.
- [ ] Cancel a checkout → returns to `/assessment`, no paid row created.

---

## Sign-off

| Field | Value |
|---|---|
| Run by | |
| Date | |
| Deployment | |
| Stripe account | |
| Supabase project | |
| R2 outcome | ☐ deferred ☐ **BLOCKER** |
| All steps passed | ☐ yes ☐ no — see notes |

Notes:

---

## UNVERIFIED after this runbook

Record here anything neither CI nor this run established. Known entries:

- **The residual claim window.** If the process dies between claiming an event
  and completing it, no compensating delete runs and that event's side effects
  are lost. Closing it needs a claimed/completed state on
  `stripe_processed_events`, i.e. a migration — drafted, never applied by an
  agent session. Bounded today because the 30-day entitlement is recoverable at
  the buyer's next sign-in from the paid row's email.
- **Production database behaviour.** Every CI database assertion is against a
  double.
- **How long Stripe keeps a Checkout Session retrievable.** R12 measures it.
  The entitlement resolves `session.created` at sign-in; the resolver fails
  closed, so the risk is a deferred grant, not a wrong one.
- **The welcome email and subscription analytics** remain a bounded loss if a
  process dies mid-handler. Durable membership state converges; a one-time
  message does not. Recorded separately on purpose.
- **Concurrency as Postgres actually schedules it.** CI proves the handler has
  a check-then-act window and that the claim closes it; it does not prove
  Postgres's isolation behaviour.
- **Defect 2**, unless R2 resolved it.
