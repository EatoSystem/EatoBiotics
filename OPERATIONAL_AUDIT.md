# EatoBiotics — Operational Audit & Repair

_Full assessment of the customer journey: **assessment → payment → report → email → magic link → account**._

This document records what was broken, the root causes, the code fixes applied,
and the **manual configuration you must verify** in Vercel / Supabase / Stripe /
Resend before the flow is fully live. No branding, copy, or page structure was
changed — only operational/functional code.

---

## 1. Executive summary — what was broken

| # | Reported symptom | Verdict | Primary cause |
|---|------------------|---------|---------------|
| 1 | Stripe payments not working | **Partly code, partly config** | Post-payment success URL was blocked by the password gate (code, fixed). Live/test keys + webhook need verifying (config). |
| 2 | Report not emailed after payment | **Mostly config** | Report email fires from `/api/submit-deep-assessment`, which the customer could never reach because the gate blocked `/assessment/deep` (code, fixed). Also requires `RESEND_API_KEY` + verified sender domain (config). |
| 3 | Customers not receiving magic link | **Code + config** | Magic-link callback only handled one of Supabase's two auth flows (code, fixed). Supabase redirect-URL allowlist + Resend must be set (config). |
| 4 | Account broken / only opens a "Dev Account" | **Code** | The password gate redirected every authenticated route (`/account`, `/auth/callback`) to `/enter`. There is **no shared dev account** in the real path. (Fixed.) |
| 5 | Verify full flow operational | **Done** | End-to-end flow traced and repaired; test plan in §9. |

### The single biggest root cause
`lib/dev-password-gate.ts` contained a **hardcoded fallback password (`"Monkstown"`)**.
Because of it, `isPasswordGateEnabled()` returned `true` **unconditionally**,
regardless of environment variables. `proxy.ts` therefore redirected **every**
route — `/assessment`, the Stripe success URL `/assessment/deep`, `/auth/callback`,
and `/account` — to the `/enter` gate. A real customer literally could not pay,
receive a report, use a magic link, or reach their account. This one bug explains
issues #1, #3, #4, and #5. (CLAUDE.md already flagged this: _"remove before launch."_)

---

## 2. Root causes & fixes (code)

### Fix A — Password gate stays on now, one switch to go live _(CRITICAL)_
**File:** `lib/dev-password-gate.ts`
- The gate **stays ON by default** (waitlist mode): the public sees the waitlist at
  `/enter` and only the founder password unlocks the site. `DEV_PASSWORD` (Vercel)
  overrides the fallback password.
- **To go fully live, set `EATOBIOTICS_PASSWORD_GATE_DISABLED=true`** — a single
  kill-switch that takes the site public. That is the one and only flip needed at
  launch; everything downstream (assessment → payment → report → magic link →
  account) then works because of Fixes B–D.
- Originally the gate was forced on *unconditionally* (it ignored env), so it could
  never be turned off. The kill-switch ordering is now reliable.

### Fix B — Auth always works, even with the waitlist gate on
**File:** `proxy.ts`
- `/auth/callback` and `/api/auth/*` are now allowed through the gate.
- **Effect:** a paying customer's magic-link sign-in completes even if you later
  turn the waitlist back on. Previously the callback bounced to `/enter`.

### Fix C — Magic-link callback handles all Supabase auth flows
**File:** `app/auth/callback/page.tsx`
- Previously only read implicit-flow tokens from the URL hash. If the Supabase
  project used the **PKCE flow** (`?code=`) or **email OTP** (`?token_hash=`),
  sign-in silently failed and dumped the user on the sign-in screen.
- Now handles hash tokens **and** `?code=` **and** `?token_hash=`, surfaces
  provider errors, and logs failures instead of failing silently.

### Fix D — Visible logging, no silent failures
**Files:** `app/api/checkout/route.ts`, `app/api/verify-payment/route.ts`,
`app/api/auth/send-magic-link/route.ts`
- `[checkout]` logs session id, amount, `hasEmail`, and `livemode` (test vs live).
- `[verify-payment]` logs `paid` / `status` / `payment_status`.
- `[send-magic-link]` now logs success and **returns `emailSent: true/false`** so a
  missing `RESEND_API_KEY` or send failure is no longer invisible.
- No secrets are logged.

---

## 3. Flow walkthrough (how it actually works — verified)

1. **Assessment** (`components/assessment/assessment-client.tsx`) — client-side,
   email collected up front. On completion it fires three calls:
   `/api/submit-lead` (saves the lead + score), `/api/send-results-email`
   (deferred), and **`/api/auth/send-magic-link`** (so the user can reach `/account`).
   Answers/score are saved to the `leads` table, keyed to the submitted email. ✅
2. **Payment** — results page → `/api/checkout` creates a Stripe Checkout session
   (`mode: payment`, dynamic `price_data` €49 — **no Stripe Price ID needed**).
   The free-assessment scores **and email** are encoded into `metadata.result_summary`.
   `success_url = {SITE_URL}/assessment/deep?session_id=…`. ✅
3. **Report** — on the success page (`app/assessment/deep/page.tsx`) the payment is
   re-verified server-side, the customer answers deep questions, then
   `/api/submit-deep-assessment` generates the report via Claude (with a
   deterministic fallback if AI is down), renders a PDF, uploads it, and **emails it
   via Resend**. Idempotent on `stripe_session_id`. ✅
4. **Webhook** (`/api/stripe/webhook`) — verifies the Stripe signature, is
   idempotent (`stripe_processed_events`), and on `checkout.session.completed`
   grants a **30-day trial** + logs revenue analytics. ⚠️ **Important:** the report
   itself is **not** webhook-dependent — it is generated in step 3. The webhook only
   affects trial/membership. So a misconfigured webhook does **not** stop reports,
   but it will stop the trial from activating.
5. **Magic link** — `/auth/callback` establishes the session, calls
   `/api/auth/setup-profile` (creates the profile, links `leads` +
   `deep_assessments` rows by email to `user_id`), then redirects to `/account`. ✅
6. **Account** (`app/account/page.tsx`) — requires a real authenticated user
   (`getUser()`), redirects to sign-in otherwise. **Every query is scoped to the
   signed-in user** (`user_id` / `email`). ✅

### On the "Dev Account" concern
There is **no shared dev/owner account** in the real `/account` route. Mock data
appears **only** on intentionally-demo routes (`/demo/account`, `/account-you`,
`/account-you-live`). The "Dev Account" symptom was the gate bouncing users to
`/enter`, or someone navigating to a demo URL. Confirm production links point to
`/account`, not the demo routes.

---

## 4. Account / data isolation

- All dashboard reads in `app/account/page.tsx` filter by `user_id` (assessment
  scores additionally by `email`). No cross-user leakage in code.
- Reads use the **service-role** client but are always scoped by the authenticated
  `user.id`, so they're safe — provided `getUser()` is the only source of identity
  (it is).
- **Manual check required:** verify Row-Level Security is enabled on
  `profiles`, `leads`, `deep_assessments`, `analyses`, `weekly_checkins`,
  `glp1_logs`, `glp1_profile`, `household_members`, `stability_*` (policies should
  scope to `auth.uid()`). RLS cannot be inspected from the codebase — see §6.

---

## 5. Stripe audit

| Item | Status | Notes |
|------|--------|-------|
| Checkout session creation | ✅ Correct | `mode: payment`, EUR, dynamic price (€49). No Price ID dependency for the report. |
| Success / cancel URLs | ✅ Fixed | `success_url` `/assessment/deep` was gate-blocked; now reachable. Uses `NEXT_PUBLIC_SITE_URL`. |
| Live vs test mode | ⚠️ Verify | Determined solely by `STRIPE_SECRET_KEY` (`sk_live_…` vs `sk_test_…`). The webhook secret must match the same mode. |
| Webhook signature | ✅ Correct | Verified with `STRIPE_WEBHOOK_SECRET`, raw body, idempotent. Fails closed if secret missing. |
| Webhook → DB | ✅ Correct | Grants trial, updates membership, logs events. |
| Subscriptions | ✅ Correct | Needs the `STRIPE_*_PRICE_ID` env vars to map prices → tiers. |

---

## 6. Database / Supabase

- Production uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server) and
  `NEXT_PUBLIC_SUPABASE_*` (browser/SSR). Confirm all point at the **production**
  project, not a local/branch instance.
- Apply outstanding migrations from `supabase/migrations.sql` /
  `supabase/go-live-migrations.sql` (17–24) — see CLAUDE.md go-live note.
- Orphan-record safety: `leads` and `deep_assessments` are linked to `user_id` on
  every sign-in (`/api/auth/setup-profile` + `/api/auth/callback`), so records
  created before the account are adopted. ✅
- **Manual:** confirm RLS policies (see §4) and that the `pdf-reports` storage
  bucket exists (report PDFs are uploaded there).

---

## 7. Environment variables to verify

> Do not paste secret values anywhere public. Check presence + correctness only.

### Must be correct for the core flow
| Variable | Where | Why |
|----------|-------|-----|
| `STRIPE_SECRET_KEY` | Vercel | Checkout + verification. `sk_live_` for real payments. |
| `STRIPE_WEBHOOK_SECRET` | Vercel | Must match the **live** webhook endpoint's signing secret. |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Vercel | Server DB + admin auth (magic link generation). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | SSR/browser auth + session. |
| `RESEND_API_KEY` | Vercel | Report email + magic-link email. Without it, **no emails send**. |
| `EMAIL_FROM` | Vercel | Must be on a **Resend-verified domain** (e.g. `reports@eatobiotics.com`). |
| `NEXT_PUBLIC_SITE_URL` | Vercel | Used for the checkout `success_url` **and** the magic-link `redirectTo`. Must be the production domain. |
| `ANTHROPIC_API_KEY` | Vercel | Report generation (falls back to a deterministic report if absent). |

### Gate / launch control
| Variable | Pre-launch (now) | Go-live |
|----------|------------------|---------|
| `DEV_PASSWORD` | Set to your founder password (or rely on the built-in fallback) | Can stay set — ignored once disabled below |
| `EATOBIOTICS_PASSWORD_GATE_DISABLED` | Unset (gate ON → waitlist shows) | **Set to `true`** → site goes fully public |

**Launch = set `EATOBIOTICS_PASSWORD_GATE_DISABLED=true` in Vercel.** Nothing else
needs to change for the customer flow to work.

### Subscriptions (if selling memberships)
`STRIPE_GROW_PRICE_ID`, `STRIPE_RESTORE_PRICE_ID`, `STRIPE_TRANSFORM_PRICE_ID`
(+ their `NEXT_PUBLIC_` twins), `FOUNDING_MEMBER_CUTOFF_DATE`, `CRON_SECRET`,
`ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET`.

---

## 8. Manual setup you must complete (not fixable in code)

1. **Supabase → Authentication → URL Configuration**
   - Site URL = your production domain.
   - **Redirect Allow List** must include `https://<domain>/auth/callback` and
     `https://<domain>/account`. _This is the #1 cause of "magic link doesn't work."_
2. **Resend**
   - Verify the sending domain; ensure `EMAIL_FROM` uses it (both `reports@` and
     `hello@` senders must be on a verified domain).
3. **Stripe**
   - Create a webhook endpoint → `https://<domain>/api/stripe/webhook` for events:
     `checkout.session.completed`, `customer.subscription.created/updated/deleted`,
     `invoice.payment_succeeded`, `invoice.payment_failed`. Copy its signing secret
     into `STRIPE_WEBHOOK_SECRET`. Ensure the key is **live** mode for real sales.
4. **Gate** — to go live, set `EATOBIOTICS_PASSWORD_GATE_DISABLED=true` in Vercel.
   Leave it unset to keep the waitlist showing.
5. **DB** — apply outstanding migrations; confirm RLS + the `pdf-reports` bucket.

---

## 9. End-to-end test plan

Run on the production domain with the gate **off**:

- [ ] New user completes the free assessment (enters real email).
- [ ] `leads` row created with score + email; magic-link + results emails attempted (check Vercel logs: `[send-magic-link] Sign-in link emailed…`).
- [ ] Click "Generate My Personal Report" → redirected to Stripe ( `[checkout] Session … livemode=true` ).
- [ ] Pay with a real (or live-test) card → redirected to `/assessment/deep?session_id=…` (NOT to `/enter`).
- [ ] `[verify-payment] … paid=true` in logs; deep questions render.
- [ ] Complete deep questions → report generates → **report email arrives** with PDF link.
- [ ] Stripe Dashboard shows the webhook `checkout.session.completed` delivered 200; trial granted on the profile.
- [ ] **Magic-link email arrives** → click it → lands on `/account` (NOT sign-in, NOT `/enter`).
- [ ] `/account` shows the user's **own** score, report, and membership — no demo data.
- [ ] Repeat with a **second** user → each sees only their own data (isolation).

---

## 10. Production-readiness checklist

- [x] Password gate stays ON now (waitlist) with a reliable go-live kill-switch.
- [x] Auth routes bypass the gate (magic-link sign-in works even with the gate on).
- [x] Magic-link callback handles all Supabase auth flows.
- [x] Logging added across checkout / verify / magic-link.
- [x] Production build compiles cleanly (all routes valid).
- [ ] `RESEND_API_KEY` + verified `EMAIL_FROM` domain (manual).
- [ ] Supabase auth redirect allow-list includes `/auth/callback` + `/account` (manual).
- [ ] Stripe **live** keys + live webhook endpoint & secret (manual).
- [ ] `NEXT_PUBLIC_SITE_URL` = production domain (manual).
- [ ] **Launch flip:** set `EATOBIOTICS_PASSWORD_GATE_DISABLED=true` (manual).
- [ ] Migrations applied + RLS verified + `pdf-reports` bucket exists (manual — I can verify via Supabase if you approve the connection).
- [ ] End-to-end test (§9) passes for two separate users (manual).
