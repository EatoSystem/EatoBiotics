# EatoBiotics

Gut-health assessment, meal analysis, subscription membership, and AI consultation — a Next.js 16 App Router app on Supabase + Stripe + Anthropic.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **DB + Auth:** Supabase (Postgres + Auth)
- **Payments:** Stripe v20 (one-time reports + subscription tiers)
- **AI:** Claude (`@anthropic-ai/sdk`) for consultations, reports, weekly check-ins; OpenAI for plate-builder recipes/images
- **Email:** Resend
- **Styling:** Tailwind v4 + shadcn/ui (Radix primitives)
- **Hosting:** Vercel (Fluid Compute, Vercel Cron)

See [CLAUDE.md](CLAUDE.md) for the full architecture reference (key file locations, database schema, environment variables, architectural decisions).

## Prerequisites

- Node.js (any recent LTS — no `engines` field is set; Vercel uses Node 24 LTS by default)
- A Supabase project
- A Stripe account with subscription products created (Grow / Member / Restore / Transform)
- API keys for Anthropic, OpenAI, Resend
- Optional: Statsig + PostHog projects for feature flagging / analytics

## Local development

```sh
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# fill in the values — see .env.example for every key + comment

# 3. Run the database migrations
# Either via Supabase Studio (SQL editor) or psql, against your project:
#   supabase/migrations.sql

# 4. Start the dev server
npm run dev
```

The app boots at <http://localhost:3000>. The home page is gated by the preview password (`DEV_PASSWORD`) — set that, or set `EATOBIOTICS_PASSWORD_GATE_DISABLED=true` to skip it locally.

## Scripts

| Command         | What it does                  |
|-----------------|-------------------------------|
| `npm run dev`   | Next.js dev server (Turbopack) |
| `npm run build` | Production build              |
| `npm run start` | Run the production build      |
| `npm run lint`  | ESLint                        |

(There is currently no `test` script — see CLAUDE.md / the project audit for the testing gap.)

## Stripe setup

1. Create one **subscription** product per tier (Grow, Member, Restore, Transform). Capture each Price ID into the matching `STRIPE_*_PRICE_ID` and `NEXT_PUBLIC_STRIPE_*_PRICE_ID` env var.
2. Create a webhook endpoint pointing at `/api/stripe/webhook` for these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
3. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Enable the Customer Portal in Stripe so `/api/stripe/create-portal-session` can issue portal links.

## Cron

Vercel Cron is configured in [vercel.json](vercel.json) to hit `/api/weekly-checkin` every Monday at 08:00 UTC. The route is gated by `CRON_SECRET` (bearer token). Add the same secret to your Vercel project for the cron's Authorization header to validate.

## Deployment

Pushes to `main` auto-deploy on Vercel. Before promoting:

1. Ensure every env var in [.env.example](.env.example) is set on the Vercel project (Production + Preview as appropriate).
2. Run the Stripe webhook locally via `stripe listen --forward-to localhost:3000/api/stripe/webhook` if you need to verify event handling.
3. Walk through the manual test checklist in [TESTING.md](TESTING.md) — at minimum Priority 1–3 (webhook, checkout, portal) before any production deploy.

## Project structure

```
app/                  Next.js App Router — pages and API routes
  api/                Server endpoints (auth, checkout, webhook, consult, cron…)
  account/            Member dashboard (server component + 6-tab client)
  assessment/         Free + paid gut-health assessment flow
  analyse/            Meal-analysis flow
  pricing/            Pricing page + subscription checkout
components/           React components (organised by feature)
lib/                  Server-side helpers (supabase, stripe, membership, email…)
supabase/migrations.sql  Database schema
```

## Key docs

- [CLAUDE.md](CLAUDE.md) — architecture reference, schema, env vars, architectural decisions
- [.env.example](.env.example) — full env-var inventory with inline comments
- [TESTING.md](TESTING.md) — manual QA checklist
- [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) — pre-launch tasks

## Status

Pre-launch. See the most recent development-readiness assessment for the prioritised remaining work (security/RLS, webhook edge cases, test coverage, CI). The audit is in the local plan folder; high-priority blockers are tracked separately.
