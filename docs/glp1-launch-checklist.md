# GLP-1 Companion — Go-Live Checklist

Status reference for shipping the EatoBetics GLP-1 Companion to production.
Last reviewed: 2026-06-06.

---

## 1. Database

- [ ] **Apply Migration 19** (`glp1_logs`) from `supabase/migrations.sql` in the
      production Supabase project. The tracker writes/read fail without it.
  - Verify: table `glp1_logs` exists with `UNIQUE (user_id, log_date)` and RLS
    policy `users_manage_own_glp1_logs` enabled.
- [ ] **Apply Migration 20** (`glp1_profile`) — stores onboarding (medication,
      start/goal weight). First-run setup fails to persist without it.
  - Verify: table `glp1_profile` exists with `UNIQUE (user_id)` and RLS policy
    `users_manage_own_glp1_profile` enabled.
- [ ] Confirm Migrations 17 (`stripe_processed_events`) and 18 (`household_members`)
      are also applied (prior builds).

## 2. Access gating (no new env vars required)

The Companion reuses existing infrastructure — **no new environment variables.**

- [x] Feature flag `glp1_companion` → `["member", "restore", "transform"]`
      (`lib/membership.ts`).
- [x] Page gate: `/account/glp1` redirects unauthenticated users and soft-gates
      tiers without access (`app/account/glp1/page.tsx`).
- [x] API gate: `POST /api/glp1/log` returns 403 for tiers without access
      (`app/api/glp1/log/route.ts`).
- [ ] Manual check: a **free** account at `/account/glp1` sees the upsell (not the
      tracker); a **member/restore/transform** account sees the tracker.

## 3. Monetization mapping

The live pricing page sells the **Member plan (€24.99/mo)**, which maps to
`member` access — and `member` is in the `glp1_companion` allow-list, so the
Companion is **included with membership**. Copy reflects this:

- [x] `/pricing?feature=glp1-companion` shows the GLP-1 highlight banner.
- [x] "GLP-1 Companion — daily protein & muscle tracker" listed in Member benefits.
- [x] Soft-gate CTA reads "Unlock with membership" (not a specific legacy tier).
- [ ] If the purchasable plan name changes, re-check these three copy points.

## 4. Funnel surfaces (all linked)

- [x] Public landing: `/eatobetics/glp1` (free calculator + tracker promo band).
- [x] Assessment report GLP-1 section links to `/eatobetics/glp1`.
- [x] `/eatobetics` page has a GLP-1 Companion callout.
- [x] `/account` dashboard shows the GLP-1 Companion card (both overview states).
- [ ] Smoke-test each link in production once deployed.

## 5. Weekly check-in engagement loop

- [x] `/api/weekly-checkin` folds GLP-1 weekly progress (protein days hit,
      strength sessions, avg protein) into the Transform check-in when the member
      has `glp1_logs` for the week.
- [ ] Confirm `CRON_SECRET` is set in production (route fails closed without it).
- [ ] Cron schedule `0 8 * * 1` (Mon 08:00 UTC) confirmed in `vercel.json`.

## 6. Clinical / compliance

- [x] Protein factors + target math centralized in `lib/glp1.ts` (single tuning
      point) — review with a clinician/dietitian before launch if desired.
- [x] Educational disclaimers on the landing page, calculator, and tracker
      ("not medical/dietetic advice; follow your clinician").
- [ ] Final sign-off on protein targets (currently 1.4 / 1.6 / 1.9 g/kg by activity).

## 7. Pre-launch QA pass

- [ ] Onboarding: first visit shows setup (medication, start/goal weight); saving
      reveals the tracker; "Setup" reopens it; "Skip for now" doesn't re-prompt.
- [ ] Calculator: kg/lb toggle, activity change, meals change → target updates.
- [ ] Tracker: log a day → progress ring, weekly summary, and history update;
      reload persists the day.
- [ ] Tracker upsert: logging the same day twice updates the row (no duplicate).
- [ ] Mobile layout check on `/eatobetics/glp1` and `/account/glp1`.
