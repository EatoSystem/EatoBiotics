# EatoBiotics — Go-Live Checklist

Work through this top to bottom before pointing real traffic at production.
(Everything here is also referenced from CLAUDE.md; this file is the single
actionable list.)

## 1. Database migrations (Supabase SQL editor)

Apply from `supabase/migrations.sql` (all idempotent). The recent ones are also
collected in `supabase/go-live-migrations.sql` for a single paste.

- [ ] Migration 17 — `stripe_processed_events`
- [ ] Migration 18 — `household_members`
- [ ] Migration 19 — `glp1_logs`
- [ ] Migration 20 — `glp1_profile`
- [ ] Migration 21 — `glp1_logs.side_effects`
- [ ] Migration 22 — `ai_usage` (AI daily caps — without it the caps fall back to burst-only)
- [ ] Migration 23 — `email_sends` (lifecycle-email idempotency)
- [ ] Migrations 24–33 — stability, waitlist/UTM, opt-outs, deep-assessment status (if not yet applied)
- [ ] Migration 34 — Realtime on `analyses` (live Twin updates)
- [ ] Migration 35 — `profiles.sex` (Twin figure personalisation)
- [ ] Migration 36 — `twin_state` (ritual + milestone sync across devices)

## 2. Environment secrets (Vercel → Production)

Fail-closed items — the feature is OFF or erroring without them:

- [ ] `CRON_SECRET` — ALL cron routes return 503 without it
- [ ] `ADMIN_SESSION_SECRET` (or `ADMIN_PASSWORD`) — admin login fails closed
- [ ] `STATSIG_SERVER_KEY` — without it every server funnel event (signup,
      first meal, checkout, churn) is silently dropped
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` (+ host) — browser analytics & error capture
- [ ] `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — LIVE mode values
- [ ] `STRIPE_MEMBER_PRICE_ID` + `NEXT_PUBLIC_STRIPE_MEMBER_PRICE_ID` — live Price IDs
- [ ] `FOUNDING_MEMBER_CUTOFF_DATE` + `NEXT_PUBLIC_FOUNDING_MEMBER_CUTOFF_DATE`
- [ ] `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (plate-builder), `RESEND_API_KEY`,
      `EMAIL_FROM`, `OWNER_EMAIL`
- [ ] `NEXT_PUBLIC_SITE_URL=https://eatobiotics.com`
- [ ] Optional: `ELEVENLABS_API_KEY` + `ELEVENLABS_AGENT_ID` (voice), promo coupon IDs

## 3. Remove the dev gate fallback

- [ ] `lib/dev-password-gate.ts` contains a TEMPORARY hardcoded fallback
      password — **delete it** and set the gate env explicitly:
      `EATOBIOTICS_PASSWORD_GATE_DISABLED=true` (public launch) or a strong
      `DEV_PASSWORD` (private beta).

## 4. Cron schedule (vercel.json — verify after deploy)

The V1 scope freeze reduced scheduled automation from nine jobs to **one**.

| Route | Schedule | Purpose |
|---|---|---|
| `/api/feedback/retention` | `0 3 * * *` | Deletes `paid_report_intents` rows past their 30-day `expires_at` — the only thing enforcing that retention promise |

- [ ] It returns 503/401 when curled WITHOUT the bearer (fail-closed check).
- [ ] It returns `{"ok":true}` with the bearer, and `deleted.paid_report_intents`
      is a number rather than the job reporting a skip. A skip means the table
      is missing, which would mean something is wrong with the deploy.

**Dormant — on disk, protected by `CRON_SECRET`, but NOT scheduled.** Nothing
here should run in V1, and finding any of them on the schedule means the set
drifted: `/api/email/sequence`, `/api/weekly-checkin`, `/api/email/week-inside`,
`/api/stability/reminder`, `/api/email/trial-winback`,
`/api/email/paid-onboarding`, `/api/glp1/reminder`, `/api/feedback/digest`.

`tests/unit/v1-cron-surface.test.ts` pins the scheduled set exactly, in both
directions, so this table and `vercel.json` cannot drift apart silently.

## 5. Launch metrics (agree the definitions before day one)

1. **D1 return** — % of assessment completers who come back the next day.
2. **Meals per member-week** — median logged meals per active member.
3. **Trial → paid** — % of trials converting inside the window.

Verify events fire in Statsig/PostHog on a production smoke run before launch.

## 6. Smoke test (production, one pass)

- [ ] Assessment → results → magic link → `/account` (Twin renders, stage + mood)
- [ ] QuickLog a meal (text AND photo) → score returns → Twin bursts → feed updates
- [ ] Daily ritual taps persist after a hard refresh AND on a second device (Migration 36)
- [ ] Stripe test-clock or live €0 coupon checkout → webhook → `membership_tier` flips
- [ ] `/method`, `/digital-twin`, `/pricing` load logged-out; nav + footer links resolve
- [ ] Week-inside cron: manual bearer curl → email received once, second run skipped (idempotent)
- [ ] Share my Twin downloads a PNG on desktop and opens the share sheet on mobile
