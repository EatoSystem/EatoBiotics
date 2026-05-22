# EatoBiotics — Project Architecture Reference

This file is the authoritative reference for Claude Code sessions. Read it before making any changes.

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
- `app/account/page.tsx` — server component, fetches all user data
- `components/account/dashboard-client.tsx` — 6-tab client component
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

### Pricing
- `app/pricing/page.tsx` — server component (public)
- `app/pricing/pricing-client.tsx` — interactive pricing cards

---

## Database Tables

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
| membership_tier | text | `free \| trial \| member \| grow \| restore \| transform` — subscription tier (see Membership System below) |
| trial_expires_at | timestamptz | nullable — expiry for `trial` tier granted by one-time report purchase |
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

### Other tables
- `referrals` — `referrer_code`, `referred_email`, `referred_id`
- `plate_data` — `user_id`, `plate`, `plants`, `updated_at`
- `journal_entries` — `user_id`, `date`, `energy`, `digestion`, `mood`, `notes`, `plants_this_week`

---

## Environment Variables

The authoritative, copy-paste list lives in [.env.example](.env.example). Summary of what each group is for:

### Supabase (required)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_URL                   # server fallback, same value as the NEXT_PUBLIC one
SUPABASE_SERVICE_ROLE_KEY      # server-only
SUPABASE_RECIPE_IMAGE_BUCKET   # storage bucket for plate-builder images
```

### Stripe (required for payments)
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Subscription price IDs — one per tier
STRIPE_GROW_PRICE_ID           # Grow (€9.99/mo)
STRIPE_RESTORE_PRICE_ID        # Restore (€49/mo)
STRIPE_TRANSFORM_PRICE_ID      # Transform (€99/mo)
STRIPE_MEMBER_PRICE_ID         # Member (€24.99/mo) — sits between Grow and Restore

# Public mirrors used by pricing-client.tsx
NEXT_PUBLIC_STRIPE_GROW_PRICE_ID
NEXT_PUBLIC_STRIPE_RESTORE_PRICE_ID
NEXT_PUBLIC_STRIPE_TRANSFORM_PRICE_ID
NEXT_PUBLIC_STRIPE_MEMBER_PRICE_ID

# Optional promo coupon IDs — auto-applied when set
STRIPE_WIN_COUPON_ID
STRIPE_LOW_SCORE_COUPON_ID
STRIPE_SHARE_COUPON_ID
```

### AI providers
```
ANTHROPIC_API_KEY              # Claude — consult, reports, weekly check-ins
OPENAI_API_KEY                 # plate-builder recipes + images
OPENAI_RECIPE_MODEL            # optional override, e.g. gpt-4o-mini
OPENAI_IMAGE_MODEL             # optional override, e.g. gpt-image-1
NEXT_PUBLIC_ELEVENLABS_AGENT_ID # voice agent
```

### Email (Resend)
```
RESEND_API_KEY
EMAIL_FROM                     # e.g. "EatoBiotics <hello@eatobiotics.com>"
OWNER_EMAIL                    # internal BCC / notifications
```

### Analytics & feature flags
```
NEXT_PUBLIC_STATSIG_CLIENT_KEY
STATSIG_SERVER_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

### Cron / admin / preview gate
```
CRON_SECRET                    # bearer token for /api/weekly-checkin, /api/email/*, etc.
ADMIN_PASSWORD                 # /admin login
DEV_PASSWORD                   # preview-site password — required in production preview
EATOBIOTICS_PASSWORD_GATE      # "on" to force preview gate on
EATOBIOTICS_PASSWORD_GATE_DISABLED  # "true" to bypass gate entirely
```

### Misc
```
NEXT_PUBLIC_SITE_URL                    # e.g. https://eatobiotics.com
FOUNDING_MEMBER_CUTOFF_DATE             # ISO date — subscriptions before this = founding member
NEXT_PUBLIC_FOUNDING_MEMBER_CUTOFF_DATE  # public mirror for pricing badge
```

---

## Membership System

Two parallel membership fields exist on `profiles`:

1. **`membership`** (`free | early_access | member | premium`) — the OLD referral-based system. Do not modify this logic. Referral upgrades still write to this field.

2. **`membership_tier`** (`free | trial | member | grow | restore | transform`) — the subscription tier. All paid feature gating reads from this field, via `getUserMembershipTier()` in `lib/membership.ts`.

Tier semantics (see [lib/membership.ts](lib/membership.ts)):
- **free** — no subscription.
- **trial** — 30-day grace granted by a one-time report purchase. Uses the `trial_expires_at` column; downgrades to `free` automatically when expired. Feature access mirrors `grow`.
- **grow** (€9.99/mo) — unlimited analyses, score history, plate builder, 30-day plan.
- **member** (€24.99/mo) — everything in `grow` plus condition calibration, monthly gut plan, PDF reports, 90-day history. Effectively a "mid-tier" sitting between Grow and Restore.
- **restore** (€49/mo) — same feature flags as `member` today; positioned for future expansion.
- **transform** (€99/mo) — adds AI consultation, weekly check-ins, weekly meal plans, founding-member status.

The `getUserMembershipTier()` function:
- Returns `trial` only while `trial_expires_at > now()`.
- Returns the stored tier when `membership_status = 'active'`.
- Allows a grace period for `past_due` while `membership_expires_at > now()`.
- Otherwise returns `free`.

The canonical feature → tier mapping lives in the `FEATURES` constant in [lib/membership.ts](lib/membership.ts). Use `canAccess(tier, feature)` rather than inline tier comparisons.

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
- Nav and footer components

---

## Architectural Decisions

1. **Separate `membership_tier` from `membership`** — avoids breaking the referral system while adding subscriptions alongside it.

2. **Webhook-driven, not poll-driven** — subscriptions are updated via Stripe webhook events only. The checkout success URL redirects to `/account` which reads the updated DB state.

3. **No custom upgrade/downgrade UI** — Stripe Customer Portal handles all plan changes. `/api/stripe/create-portal-session` creates a session and redirects.

4. **Soft gate on analyse page** — free users see a banner, not a hard block. They can still submit; the gate only triggers after they've used their daily allowance.

5. **AI consultation at `/account/consult`** — the spec said `/dashboard/consult` but no `/dashboard` route exists. Using `/account/consult` to match existing routing pattern.

6. **Weekly check-in UTC schedule** — `0 8 * * 1` = Monday 8am UTC (= 8am Irish time in winter, 9am in summer with DST). Jason to confirm preferred time.

7. **`FOUNDING_MEMBER_CUTOFF_DATE` env var** — founding member status depends on a date Jason will confirm. Set this before go-live.
