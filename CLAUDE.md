# EatoBiotics — Project Architecture Reference

This file is the authoritative reference for Claude Code sessions. Read it before making any changes.

---

## Production Database Rule (binding for all agent sessions)

**Agent sessions are READ-ONLY against production Supabase.** Any schema or
data change — including "safe" ADD-only/idempotent migrations — must be
**drafted, not applied**: commit the SQL to `supabase/migrations.sql`, write
the exact apply steps and pre-checks into the PR description, and a human
applies it (Supabase dashboard SQL editor or CLI) and verifies.

- A past instruction to apply one specific migration is **not** standing
  authorization for the next one. "Consistent with how you handled X" does
  not count. Each production write needs its own explicit, current,
  named-migration instruction from a human.
- This rule exists because it has failed twice: Migration 41 was applied to
  production despite a "DO NOT APPLY" header (origin unknown), and
  Migrations 42–43 were applied by an agent session citing a prior one-off
  authorization as precedent. Both audits are in REVIEW.md.
- Read-only verification (`list_tables`, `SELECT` via `execute_sql`) is
  fine and encouraged — checking that docs match reality is how the
  Migration 36 gap was found. Take care to target the right project. The
  org contains three, and naming the ref explicitly in every call is the
  only reliable way to hit the one you meant:

  | Ref | Name | What it is |
  |---|---|---|
  | `ephmojiwlcebenholhpc` | EatoBiotics | **the EatoBiotics production project** — the only project this repository may target |
  | `hwuzbxsaxsifpdzqhqaq` | EatoSystem-Ireland | an EatoSystem project, unrelated to EatoBiotics — never a target |
  | `ohwzmulsvbfgaxgziqeo` | EatoSystem | an EatoSystem project, unrelated to EatoBiotics — never a target |

  Ownership classified by the founder on 2026-08-23, which is the only
  authority that can say what a project is for. The two EatoSystem projects
  belong to a different product and **must never be targeted by EatoBiotics
  code, migrations, scripts, tests, rehearsals or agent tooling** — not
  read, not written, not named in an environment variable.

  **Operational status is deliberately not recorded here.** Supabase pauses
  and restores projects on its own schedule, so a status typed into this
  file describes the day it was typed and nothing after — and status is not
  ownership in any case. Run `list_projects` if you need live state.

  **There is no EatoBiotics staging project.** When one is created it must
  be a separate project, explicitly designated and documented here by the
  founder as the EatoBiotics non-production target. Neither EatoSystem
  project may be adopted for that role.
- Enforcement note for whoever configures agent environments: the Supabase
  MCP server supports a read-only mode — enabling it turns this rule from
  a request into a guarantee.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database + Auth | Supabase (PostgreSQL + Supabase Auth) |
| Payments | Stripe v20 |
| AI | Anthropic Claude (`@anthropic-ai/sdk`) |
| Email | Resend |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Language | TypeScript (strict) |

---

## Router

**App Router only.** All pages live under `app/`. No `pages/` directory.

---

## Key File Locations

### Auth
- `lib/supabase.ts` — service-role client (server-only, uses `SUPABASE_SERVICE_ROLE_KEY`)
- `lib/supabase-server.ts` — SSR client (`getSupabaseServer()`, `getUser()`)
- `lib/supabase-browser.ts` — browser client (`getSupabaseBrowser()`)
- `app/api/auth/send-magic-link/route.ts` — sends passwordless login email
- `app/api/auth/callback/route.ts` — OAuth callback, creates profiles, handles referrals
- `app/api/auth/setup-profile/route.ts` — fallback profile setup, links user_id to leads
- `app/auth/callback/page.tsx` — client-side callback page

### Payments (One-time Reports)
- `app/api/checkout/route.ts` — creates Stripe checkout session (mode: payment)
- `app/api/verify-payment/route.ts` — verifies payment status
- `app/api/generate-deep-questions/route.ts` — post-payment deep assessment
- `app/api/submit-deep-assessment/route.ts` — generates PDF report via Claude

### Payments (Subscriptions — added in membership build)
- `lib/stripe-server.ts` — Stripe singleton (import here, never inline)
- `lib/membership.ts` — `getUserMembershipTier()`, `canAccess()`, `FEATURES`, `TIER_META`
- `app/api/stripe/create-subscription-checkout/route.ts`
- `app/api/stripe/webhook/route.ts` — handles subscription lifecycle events
- `app/api/stripe/create-portal-session/route.ts`

### Dashboard
- `app/account/page.tsx` — server component, fetches all user data, renders
  `components/account/live-dashboard.tsx` — the real production dashboard.
  5 tabs (`overview | meals | reports | consultations | account`), defaults
  to "overview". Reaches the daily-habit surfaces via `ExperienceNav` links
  to the separate routes `/account/today`, `/account/this-week`,
  `/account/twin`.
- `components/account/dashboard-client.tsx` — a **10-tab** client component
  (Today, Overview, Reports, Membership, My Plate, My Meals, Refer,
  EatoBiotic, Intelligence, Story), but it is **demo/mock-data only** —
  used by `app/account-you/page.tsx` and `app/demo/account/[tier]/page.tsx`,
  never by the real `/account` route. Do not confuse the two when reasoning
  about what a signed-in member actually sees.
- `app/demo/account/page.tsx` — demo mode with mock data (no auth required)

### AI Consultation (Transform only)
- `app/account/consult/page.tsx` — server component, auth + tier gate
- `app/account/consult/consult-client.tsx` — streaming chat UI
- `app/api/consult/route.ts` — Claude streaming API route

### Analysis Gating
- `components/analyse/analyse-gate.tsx` — soft gate wrapper for free-tier users
- `app/api/analyses/log/route.ts` — logs an analysis to `analyses` table
- `app/api/analyses/daily-count/route.ts` — returns today's analysis count

### Weekly Check-in (Transform cron)
- `app/api/weekly-checkin/route.ts` — cron target, generates check-ins for all Transform members
- `vercel.json` — configures Vercel Cron (`0 8 * * 1` = Monday 8am UTC)

### Trial win-back + revenue analytics
- `app/api/email/trial-winback/route.ts` — daily cron; emails trial users ~3 days
  before expiry ("pre") and just after ("post"); idempotent via `email_sends`
  (Migration 23); fires the `trial_expired` analytics event. Schedule `0 10 * * *`.
- `lib/email/trial-winback-email.ts` — the two-phase email template.
- Revenue events via `logServerEvent` (`lib/statsig-server.ts`) in
  `app/api/stripe/webhook/route.ts`: `report_purchased` (with amount/currency),
  `trial_started`, and amount/interval added to `subscription_started`.

### Customer Feedback Bot (feedback capture → weekly owner digest)
Site-wide feedback capture + AI triage + a weekly synthesised report emailed to
the owner. Built for the pre-customer-testing loop (Loyalty/Support touchpoints).
- `components/feedback/feedback-widget.tsx` — dismissible floating launcher
  (mounted in `app/layout.tsx`, hidden on `/admin` + `/cms`). Optional 1–5 rating
  + free-text; on submit shows one AI-generated follow-up question. Fails soft.
- `app/api/feedback/route.ts` — POST capture. **Auth-optional** (anonymous
  visitors welcome). One Claude extraction call → `category | sentiment |
  severity | feature_area | summary | suggested_improvement | follow_up`; the
  raw message is stored even if extraction/DB fails. Cost cap: authed →
  `guardAiUsage(user.id, "feedback")`; anon → per-IP `rateLimit`.
- `app/api/feedback/digest/route.ts` — **weekly cron** (`0 7 * * 1`,
  `verifyCronRequest`). Pulls 7 days of feedback, Claude synthesises a
  decision-ready report (themes ranked by frequency×impact, sentiment, verbatims,
  journey-mapped next moves), emails it to `OWNER_EMAIL` via `sendEmail`. Fails
  safe (quiet-week note / raw fallback if AI or key absent).
- `app/admin/feedback/page.tsx` — admin-gated dashboard (aggregate tiles +
  category/sentiment breakdowns + latest 300 submissions with triage).
- `lib/feedback/{types,prompts}.ts` — shared types/coercion + pure prompt & email
  builders (Claude calls live in the routes so the AI-guard check sees them).
- Table `feedback` (**Migration 46**, drafted); AI limit `feedback` in
  `AI_LIMITS` (`lib/ai-guard.ts`).

### Pricing
- `app/pricing/page.tsx` — server component (public)
- `app/pricing/pricing-client.tsx` — interactive pricing cards

### GLP-1 Companion
- `lib/glp1.ts` — protein factors + target math (single clinical tuning point)
- `app/glucose/glp1/page.tsx` — public landing + free protein calculator
- `components/eatobetics/protein-calculator.tsx` — interactive calculator (free)
- `app/glucose/glp1/check/page.tsx` + `components/eatobetics/glp1-check.tsx` — public muscle-preservation readiness check (client-scored, no backend)
- `app/account/glp1/page.tsx` — gated tracker (Restore+; soft upsell otherwise)
- `app/account/glp1/glp1-client.tsx` — onboarding + daily protein/weight/strength/side-effect tracker, weight-trend chart (goal line + projection), protein-adherence + side-effect analytics
- `app/api/glp1/log/route.ts` — upserts a day's log (auth + `glp1_companion` gate)
- `app/api/glp1/profile/route.ts` — upserts the onboarding profile (medication, start/goal weight)
- `app/api/glp1/reminder/route.ts` — daily cron; emails onboarded members who logged recently but not today (`lib/email/glp1-reminder-email.ts`, schedule `0 18 * * *`)

### EatoBiotics Stability™ (digestive-stability module)
Educational self-tracking tool — **not** a medical device (no diagnosis/treatment).
**localStorage-first** so it works standalone for everyone; when signed in it also
syncs to Supabase (`stability_assessments`, `stability_logs` — Migration 24) via
`app/api/stability/route.ts`. `lib/stability/storage.ts` keeps a synchronous
local cache and `hydrateFromServer()` pulls/merges server data on mount; writes
push in the background (gated on an authed flag). Surfaced on the account
dashboard via `StabilityCard` (`components/account/dashboard-parts.tsx`). The
Transform AI consultant (`app/api/consult/route.ts`) reads the member's stability
assessment + recent logs (via `computeReport`) into its prompt, with
non-diagnostic + red-flag→GP guardrails baked into the cached knowledge base.
- `lib/stability/{types,questions,scoring,insights,storage,sample-data}.ts` —
  data model, assessment questions, `calculateStabilityScore`, rule-based
  insights/report, localStorage persistence, demo seed data.
- `app/stability/page.tsx` — public landing (`StabilityHero` + measures + score
  bands + how-it-works + red-flag box).
- `app/stability/assessment/page.tsx` → results, tracker, insights, report
  (the latter four `noindex`; client components in `components/stability/*`).
- `components/stability/{MedicalDisclaimer,RedFlagWarning}.tsx` — appear on every
  Stability page. All copy is non-diagnostic ("possible contributor", "may be
  associated with") and points red-flag symptoms to a GP.

---

## Database Tables

> Tables span profiles/leads/deep_assessments/subscriptions/analyses/
> family/GLP-1/stability (documented individually below), plus the CMS
> subsystem and Living Twin tables in their own subsections near the end
> of this section.
>
> **No count is quoted here on purpose.** This line previously asserted a
> fixed number, and by the time anyone read it the number was wrong — the
> same drift the warning below is about, in the document doing the
> warning. For a current count, read production:
> `list_tables` against `ephmojiwlcebenholhpc` (read-only, always safe).
> **The migrations file and the live database have drifted in the past**
> — see the CMS subsection (Migration 41: written as "do not apply,"
> applied anyway) and the Living Twin subsection (Migration 36: written
> and idempotent, but not actually applied until 2026-07-15, after a
> live read on 2026-07-14 caught the gap). Both are reconciled as of
> 2026-07-15, but the lesson stands: do not assume
> `supabase/migrations.sql`'s own comments describe the current
> production state — verify against the live database when it matters.

### profiles
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | Supabase auth user ID |
| email | text | |
| name | text | nullable |
| age_bracket | text | nullable |
| membership | text | `free \| early_access \| member \| premium` — referral system |
| referral_code | text | unique |
| referred_by | text | nullable |
| membership_tier | text | `free \| trial \| member \| grow \| restore \| transform` — subscription tier (DB CHECK allows all six) |
| membership_status | text | `active \| inactive \| cancelled \| past_due` |
| stripe_customer_id | text | nullable |
| stripe_subscription_id | text | nullable |
| membership_started_at | timestamptz | nullable |
| membership_expires_at | timestamptz | nullable |
| is_founding_member | boolean | default false |

### leads
| Column | Type | Notes |
|--------|------|-------|
| email | text unique | |
| name | text | nullable |
| age_bracket | text | nullable |
| user_id | uuid | nullable, linked after auth |
| overall_score | integer | nullable — free assessment result |
| profile_type | text | nullable |
| sub_scores | jsonb | `{diversity, feeding, adding, consistency, feeling}` |
| email_sent | boolean | nullable |
| assessment_type | text | `gut \| mind \| family \| waitlist` (DB CHECK; default `gut`). Unique key is `(email, assessment_type)` |
| country | text | nullable — waitlist segmentation (Discover flow) |
| diet | text | nullable — waitlist segmentation |
| main_goal | text | nullable — waitlist segmentation |
| food_challenge | text | nullable — waitlist segmentation |
| created_at | timestamptz | |

### deep_assessments
| Column | Type | Notes |
|--------|------|-------|
| stripe_session_id | text PK | |
| user_id | uuid | nullable |
| email | text | nullable |
| tier | text | `starter \| full \| premium` |
| free_scores | jsonb | |
| answers | jsonb | |
| questions | jsonb | nullable |
| status | text | `in_progress \| analysing \| complete` |
| report_json | jsonb | nullable |
| pdf_url | text | nullable |
| email_sent_at | timestamptz | nullable |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### subscription_events *(new)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users |
| event_type | text | `subscribed \| upgraded \| downgraded \| cancelled \| payment_failed` |
| from_tier | text | nullable |
| to_tier | text | nullable |
| stripe_event_id | text | |
| created_at | timestamptz | |

### analyses *(new)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users |
| created_at | timestamptz | |
| biotics_score | integer | nullable |
| meal_description | text | nullable |
| tier_at_time_of_analysis | text | nullable |

### weekly_checkins *(new — Transform only)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users |
| content | text | AI-generated summary |
| biotics_score_start | integer | nullable |
| biotics_score_end | integer | nullable |
| created_at | timestamptz | |

### consultations *(new — Transform only)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users |
| message_count | integer | |
| tokens_used | integer | nullable |
| created_at | timestamptz | |

### household_members *(new — Family Mode)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_id | uuid | FK auth.users — the account holder; RLS scopes all access to `owner_id = auth.uid()` |
| name | text | member display name |
| age_band | text | nullable — `child \| teen \| adult` or age bracket |
| relationship | text | nullable — `child \| partner \| parent \| self` |
| latest_score | integer | nullable — most recent food-system score (0–100) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

Family food-system score = average of members' `latest_score` plus the owner's own score (`lib/family.ts`). Members are sub-profiles with **no separate login**; the account holder manages them.

### glp1_logs *(new — GLP-1 Companion, Restore+ only)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users — RLS scopes to `user_id = auth.uid()` |
| log_date | date | one row per user per day (`UNIQUE(user_id, log_date)`) |
| protein_grams | integer | nullable — protein eaten that day |
| protein_target | integer | nullable — the day's target at time of logging |
| weight_kg | numeric(5,1) | nullable |
| strength_session | boolean | default false |
| notes | text | nullable |
| side_effects | text[] | nullable — per-day symptom tags (nausea, fullness, …) |
| created_at / updated_at | timestamptz | |

All GLP-1 protein/muscle assumptions (factors, target math) live in **`lib/glp1.ts`** — the single clinical tuning point used by both the public calculator and the in-app tracker.

### glp1_profile *(new — GLP-1 Companion onboarding, Restore+ only)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK auth.users — UNIQUE, RLS scopes to `user_id = auth.uid()` |
| medication | text | `ozempic \| wegovy \| mounjaro \| other \| not_started` |
| start_weight_kg | numeric(5,1) | nullable — anchors the weight-trend baseline |
| goal_weight_kg | numeric(5,1) | nullable |
| started_at | date | nullable — when they started the medication / tracking |
| created_at / updated_at | timestamptz | |

Captured on first run of the in-app tracker (`Glp1Onboarding`); upserted via `app/api/glp1/profile/route.ts`. One row per user.

### feedback *(new — Customer Feedback Bot)*
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| user_id | uuid | nullable, FK auth.users `ON DELETE CASCADE` (anon feedback allowed; account deletion removes the row, not just the link) |
| source_page | text | nullable — path it was sent from |
| rating | integer | nullable — 1–5 |
| message | text | required, ≤ 4000 chars |
| category | text | AI-derived: `bug \| feature \| ux \| pricing \| content \| praise \| other` |
| sentiment | text | AI-derived: `positive \| neutral \| negative` |
| severity | text | AI-derived: `low \| medium \| high` (bugs/UX) |
| feature_area | text | AI-derived area label |
| summary / suggested_improvement | text | AI-derived one-liners |
| status | text | `new \| triaged \| resolved \| archived` (default `new`) |
| created_at | timestamptz | |
| expires_at | timestamptz | server-derived default `created_at + 90 days`; no route ever sends it |

Service-role only (RLS on, zero policies). One row **per submission** (not per user). Migration 46 (drafted; table not yet in `supabase/applied-schema.json`'s `applied` list — see #239's schema-drift guard). 90-day retention enforced by `app/api/feedback/retention/route.ts` (daily cron); `reviews` (Migration 45, also drafted) shares the same expiry + cascade pattern.

### Other tables
- `referrals` — `referrer_code`, `referred_email`, `referred_id`
- `plate_data` — `user_id`, `plate`, `plants`, `updated_at`
- `journal_entries` — `user_id`, `date`, `energy`, `digestion`, `mood`, `notes`, `plants_this_week`

### CMS / Content Studio tables *(new — `/cms` admin tool)*
`cms_content`, `cms_content_versions`, `cms_tags`, `cms_content_tags`,
`cms_audit_log`, `cms_media`, `cms_content_media`, `cms_books`,
`cms_chapters`. Service-role-only access (RLS enabled, zero policies) —
gated entirely at the route/layout level via `lib/cms/auth.ts`'s
`requireCmsAdmin`, not by row-level policies. See `app/cms/*` and
`app/api/cms/*`.

> `cms_chapter_mirror` and `cms_import_batch` (Migration 41) are still
> commented in `supabase/migrations.sql` as **"PROPOSED — DO NOT APPLY
> until the 25-chapter import is explicitly approved,"** but a live
> read of the production database (2026-07-14) found both tables
> **already present in production — APPLIED TO PRODUCTION
> (unintended; see REVIEW.md's "Second Pass" → Additions #5 and the
> Implementation Status log for how this was found).** Treat the
> migration-file comment as stale, not as the current gate: the schema
> exists live regardless of what the comment says. This drift is
> exactly the failure mode that section of REVIEW.md warns about —
> confirm with whoever has deploy access how/when this was applied
> before writing any code that assumes either state.

### Living Twin / daily ritual tables *(new)*
- `twin_state` (Migration 36) — daily ritual taps + milestone seen-set,
  synced cross-device via `/api/twin-state`
  (localStorage-first, same pattern as Stability — see
  `lib/account/twin-state-sync.ts`). The route serves two clients: the
  web app (session cookie) and the mobile companion app
  (`Authorization: Bearer <supabase access token>`, via
  `getUserFromRequest` in `lib/supabase-server.ts`; also allowlisted
  through the pre-launch password gate in `proxy.ts`). PUT validation
  lives in `lib/account/twin-state-schema.ts` and must list every
  `RitualDay` key — zod strips unknown keys, which once silently
  dropped `moved`/`slept` from cross-device sync.
- `profiles.sex` (Migration 35) — Twin figure personalisation.
- **Both applied to production on 2026-07-15** (verified: table +
  column + `twin_state_own` RLS policy all present, RLS enabled).
  History worth knowing: a live read on 2026-07-14 found neither
  existed in production despite the migration being written and
  idempotent since Migration 36 — because `/api/twin-state` and
  `lib/account/twin-state-sync.ts` fail silently offline/unauthed, the
  cross-device ritual/milestone sync feature was silently
  non-functional the whole time. The gap was closed the next day (see
  REVIEW.md's Implementation Status log). Follow-up worth doing: test
  the sync on two devices signed into the same account — watch
  `/api/twin-state` (GET hydrate, PUT push) in the network tab.

### Assessment / plate / review tables *(new)*
- `assessment_journeys` (Migration 25) — foundation→add-on journey
  persistence.
- `plate_recipes` (Migration 16) — Plate Builder generated recipes
  (`app/api/plate-builder`, surfaced at `/recipe/[slug]`).
- `monthly_gut_plans`, `meal_plans`, `food_protocols`, `monthly_reviews`
  (Migrations 10, 12, 13, 14) — Restore+/Transform monthly and meal
  planning features.
- `meal_scans` — guest (unauthenticated) meal-scan captures
  (`app/api/guest-scan`).
- `food_intelligence_reports` — deep pattern-analysis output
  (`app/api/food-intelligence`, `app/api/gut-health-story`).
- `email_optouts` (Migration 32) — central unsubscribe ledger, distinct
  from `email_sends` (idempotency log).

---

## Environment Variables

### Required (existing)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
ANTHROPIC_API_KEY
RESEND_API_KEY
EMAIL_FROM
OWNER_EMAIL
```

### New (added in membership build)
```
STRIPE_GROW_PRICE_ID          # Stripe Price ID for Grow (€9.99/mo)
STRIPE_RESTORE_PRICE_ID       # Stripe Price ID for Restore (€49/mo)
STRIPE_TRANSFORM_PRICE_ID     # Stripe Price ID for Transform (€99/mo)

# These NEXT_PUBLIC_ versions are used in pricing-client.tsx
NEXT_PUBLIC_STRIPE_GROW_PRICE_ID
NEXT_PUBLIC_STRIPE_RESTORE_PRICE_ID
NEXT_PUBLIC_STRIPE_TRANSFORM_PRICE_ID

FOUNDING_MEMBER_CUTOFF_DATE   # ISO date — subscriptions before this = founding member
NEXT_PUBLIC_FOUNDING_MEMBER_CUTOFF_DATE  # Same value, public for pricing page badge

CRON_SECRET                   # REQUIRED in prod — bearer token for all cron routes (they now fail closed: no secret = 503)

ADMIN_SESSION_SECRET          # Secret used to sign the admin session cookie (lib/admin-auth.ts).
                              # Falls back to ADMIN_PASSWORD if unset. Admin login fails closed without one.
ADMIN_PASSWORD                # Admin login password (also the fallback signing secret)
```

### Integrations & analytics
```
CLAUDE_MODEL                  # Claude model override (lib/anthropic.ts). Default: claude-sonnet-4-20250514
OPENAI_API_KEY                # SECOND AI provider — used ONLY by the plate-builder
OPENAI_RECIPE_MODEL           # (app/api/plate-builder) for recipe generation. Default: gpt-4.1-mini
OPENAI_IMAGE_MODEL            # …and recipe images. Provider split is deliberate:
                              # Claude = coaching/reports/chat, OpenAI = plate-builder recipes/images.
SUPABASE_RECIPE_IMAGE_BUCKET  # Storage bucket for generated recipe images. Default: plate-recipes

ELEVENLABS_API_KEY            # Voice agent for /eatobiotic (signed URLs minted server-side in
ELEVENLABS_AGENT_ID           # app/api/eatobiotic/voice-token — voice shows "being set up" until both are set)

STATSIG_SERVER_KEY            # Server-side analytics events (lib/statsig-server.ts logServerEvent).
                              # Without it ALL server funnel events (signup, first meal, checkout,
                              # churn, chat) are silently dropped — set in prod.
NEXT_PUBLIC_STATSIG_CLIENT_KEY # Statsig browser SDK (gates + client events)
NEXT_PUBLIC_POSTHOG_KEY       # PostHog browser analytics + $exception error capture
NEXT_PUBLIC_POSTHOG_HOST      # PostHog host (defaults to PostHog cloud)

SENTRY_DSN                    # Server/edge error tracking (sentry.server.config.ts,
                              # sentry.edge.config.ts, instrumentation.ts). Unset = fully
                              # inert; next build/dev never require it.
NEXT_PUBLIC_SENTRY_DSN         # Browser error tracking (instrumentation-client.ts). Same
                              # unset-is-inert behaviour as SENTRY_DSN.
SENTRY_AUTH_TOKEN              # Build-time source-map upload (next.config.mjs
SENTRY_ORG                    # withSentryConfig). All three optional — upload is skipped,
SENTRY_PROJECT                 # not failed, when SENTRY_AUTH_TOKEN is unset.

NEXT_PUBLIC_SITE_URL          # Canonical site origin used in emails + redirects.
                              # Default: https://eatobiotics.com

STRIPE_MEMBER_PRICE_ID        # Price ID for the Member tier (€24.99/mo)
NEXT_PUBLIC_STRIPE_MEMBER_PRICE_ID
STRIPE_LOW_SCORE_COUPON_ID    # Promo coupons: low-score offer (submit-lead),
STRIPE_SHARE_COUPON_ID        # share reward, and assessment-lottery win
STRIPE_WIN_COUPON_ID          # (app/api/promo/generate, app/api/submit-lead)

DEV_PASSWORD                  # Site-wide preview password gate (lib/dev-password-gate.ts; proxy.ts
EATOBIOTICS_PASSWORD_GATE     # redirects to /enter). The gate is ON when DEV_PASSWORD is set, or
EATOBIOTICS_PASSWORD_GATE_DISABLED # when EATOBIOTICS_PASSWORD_GATE is explicitly true/1/on.
                              # WITH NEITHER SET THE GATE IS OFF AND THE SITE IS PUBLIC.
                              # EATOBIOTICS_PASSWORD_GATE_DISABLED=true is the go-live kill-switch
                              # and always wins. (The old hardcoded fallback password is gone.)
```

> `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is listed above for completeness but is
> currently unreferenced in code (checkout uses server-created sessions).

> **Go-live note:** the cron and admin routes are fail-closed. Set `CRON_SECRET`
> and `ADMIN_SESSION_SECRET` (or `ADMIN_PASSWORD`) in production. **To stay in
> private beta, `DEV_PASSWORD` must be set in the deploy env** — with it unset
> and no explicit `EATOBIOTICS_PASSWORD_GATE`, the gate is off and the site is
> public. Also apply
> Migration 17 (`stripe_processed_events`), Migration 18 (`household_members`),
> Migration 19 (`glp1_logs`), Migration 20 (`glp1_profile`), Migration 21
> (`glp1_logs.side_effects`), Migration 22 (`ai_usage` — AI daily caps), and
> Migration 23 (`email_sends` — lifecycle-email idempotency) from
> `supabase/migrations.sql` before/at deploy. The latest two (22 + 23) are also
> in **`supabase/go-live-migrations.sql`** — paste straight into the Supabase
> SQL editor (idempotent; validated against Postgres). One-time report pricing
> is **personal-only (€49)** — the legacy starter/full/premium tiers were retired
> (`/reports` now redirects to `/pricing`).

### AI cost guard
All user-triggered Claude endpoints must be capped. `lib/ai-guard.ts` provides
`guardAiUsage(userId, feature)` — an in-memory burst limit plus a DB-backed
daily cap (table `ai_usage`, Migration 22; per-feature limits in `AI_LIMITS`).
Wired into: `meal-plan/generate`, `weekly-report/generate`,
`monthly-review/generate`, `monthly-plan/generate`, `report-chat`.
(`analyse`, `consult`, and `food-intelligence` have their own table-count caps.)
New AI routes must call `guardAiUsage` (or implement an equivalent cap).

---

## Membership System

Two parallel membership fields exist on `profiles`:

1. **`membership`** (`free | early_access | member | premium`) — the OLD referral-based system. Do not modify this logic. Referral upgrades still write to this field.

2. **`membership_tier`** (`free | grow | restore | transform`) — the NEW subscription tier. All paid feature gating reads from this field, via `getUserMembershipTier()` in `lib/membership.ts`.

The `getUserMembershipTier()` function enforces grace periods for `past_due` accounts.

---

## What NOT to Modify

- `app/api/checkout/route.ts` — one-time report payments (not subscriptions)
- `app/api/verify-payment/route.ts` — one-time payment verification
- `app/api/generate-deep-questions/route.ts`
- `app/api/submit-deep-assessment/route.ts`
- `app/assessment/` and `app/demo/assessment/` pages
- `app/api/auth/` routes (auth flow)
- Any existing Supabase table columns — only ADD, never modify or drop
- The referral system (`membership` column, referral upgrade logic)
- `app/api/cms/import/chapters/route.ts` and the `cms_import_chapters`
  Postgres function (migration 40) — the atomic import/rollback logic has
  hand-documented invariants about `ON DELETE SET NULL` vs `CASCADE` and
  batch-id reuse; changes here need a full re-read of the migration's
  inline comments, not a quick patch.

> Nav + footer are maintained via the shared config in **`lib/nav.ts`** — edit
> the config (not the components) to add or move destinations; header and
> footer consume it together.

---

## Architectural Decisions

1. **Separate `membership_tier` from `membership`** — avoids breaking the referral system while adding subscriptions alongside it.

2. **Webhook-driven, not poll-driven** — subscriptions are updated via Stripe webhook events only. The checkout success URL redirects to `/account` which reads the updated DB state.

3. **No custom upgrade/downgrade UI** — Stripe Customer Portal handles all plan changes. `/api/stripe/create-portal-session` creates a session and redirects.

4. **Soft gate on analyse page** — free users see a banner, not a hard block. They can still submit; the gate only triggers after they've used their daily allowance.

5. **AI consultation at `/account/consult`** — the spec said `/dashboard/consult` but no `/dashboard` route exists. Using `/account/consult` to match existing routing pattern.

6. **Weekly check-in UTC schedule** — `0 8 * * 1` = Monday 8am UTC (= 8am Irish time in winter, 9am in summer with DST). Jason to confirm preferred time.

7. **`FOUNDING_MEMBER_CUTOFF_DATE` env var** — founding member status depends on a date Jason will confirm. Set this before go-live.
