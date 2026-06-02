# EatoBiotics — Monitoring & Observability

A layered solution to continually analyse and monitor the live site. Alerts go to **email via Resend** (`OWNER_EMAIL`).

## Layers

### 1. CI gate — `.github/workflows/ci.yml`
Runs on every PR and push to `main`: **unit tests** (Vitest), **type check** (`tsc`), and a full **`next build`** (with dummy env so module-load succeeds). Stops regressions before they reach production. No setup required.

### 2. Health endpoint — `app/api/health/route.ts`
`GET /api/health` → `{ status: "ok" | "degraded", database, time }` (200 / 503). Checks the app is running and the database is reachable; does **not** disclose which secrets are set. Point any uptime service at it.

### 3. Uptime + synthetic page checks — `.github/workflows/uptime.yml`
Scheduled (~every 30 min) + manual. Curl-checks `/`, `/assessment`, `/pricing`, `/api/health` return 200; on failure it **emails via Resend** and fails the run. **Dormant until you set `MONITOR_BASE_URL`.**

**To activate (after launch):** in the repo → Settings:
- **Variables:** `MONITOR_BASE_URL` (e.g. `https://eatobiotics.com`), `MONITOR_ALERT_EMAIL` (`OWNER_EMAIL`), `MONITOR_ALERT_FROM` (a verified Resend sender).
- **Secret:** `RESEND_API_KEY`.

> Optional/redundant: a hosted pinger (BetterStack, Checkly, UptimeRobot — free tiers) pointed at `/api/health` gives sub-minute checks + a status page without using a Vercel cron (you're at the Hobby 2-cron cap).

### 4. Error tracking
- **Server:** `lib/report-error.ts` — `reportError(context, err)` logs and (in prod) emails the owner, throttled to 3/context/hour. Wired into the Stripe webhook; add to other critical `catch` blocks as needed.
- **Client:** `app/global-error.tsx` — root error boundary that reports render crashes to **PostHog** as `$exception` events and shows a recoverable fallback.

### 5. Product analytics (already live)
PostHog + Statsig + Vercel Analytics, plus the `report_purchased` / `subscription_activated` conversion events. Build funnel dashboards/alerts there.

## Roadmap (next iterations)
- **Full funnel E2E (Playwright):** author against the live site so selectors are verified (home → assessment submit → results → Stripe test checkout → account), run on schedule. *Needs the dev gate off to author reliably — do at/after launch.*
- **Daily "site analysis" digest:** one scheduled job summarising uptime + error volume + funnel conversion + Web Vitals into an email (optionally AI-summarised).
- **Auto-investigate:** wire failing checks to open a GitHub issue → trigger a Claude Code session to diagnose / open a fix PR.
- **Lighthouse CI** for performance/SEO regression tracking.
