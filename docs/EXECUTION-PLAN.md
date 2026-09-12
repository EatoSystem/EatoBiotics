# Execution plan — laptop session

> One sequenced runbook to go from "9 open PRs on a phone" to "merged,
> deployed, and ready for customer testing." Work top to bottom. Each phase
> has a **done-when** so you know it's safe to move on. Companion docs:
> `docs/MERGE-MAP.md` (conflict resolutions), `GO-LIVE.md` (full launch
> checklist), `CLAUDE.md` (architecture + the production-DB rule).

Estimated hands-on time: **~1.5–2 hours**, most of it waiting on CI and one
Supabase paste.

---

## Phase 0 — Prep (5 min)

```bash
git fetch --all --prune
git checkout main && git pull
npm ci                     # match the lockfile exactly (includes next@16.2.10 once #169 lands)
```

- [ ] Working tree clean, on `main`, up to date.
- [ ] Open the PR list; confirm each of the 11 has **green CI**. Any red → fix
      that PR before merging it (don't merge red).

**Done when:** local `main` is current and all 11 PRs show green checks.

---

## Phase 1 — Merge the queue (30–40 min)

Merge in **this order** (from `docs/MERGE-MAP.md`). 8 are clean; the 3 marked ⚠️
need a *keep-both* resolution — no logic, just don't delete either side.

1. [ ] **#170** deploy fix ✅ — merge first; it unblocks Vercel.
2. [ ] **#169** Next.js security ✅
3. [ ] **#166** score-persistence fix ✅
4. [ ] **#167** `/help` ✅
5. [ ] **#162** meal_scans PII (Migration 44) ✅
6. [ ] **#168** review loop (Migration 45) ✅ — base is #162; merge after it.
7. [ ] **#165** analyse consolidation ✅
8. [ ] **#171** feedback bot (Migration 46) ⚠️ `supabase/migrations.sql`
       → **keep all three blocks: Migration 44, then 45, then 46.**
       ⚠️ Do NOT "take one side" — that deletes 44 & 45. Both-sides keep only.
9. [ ] **#172** Gut Trend ⚠️ `live-dashboard.tsx` → **keep all imports + all
       render blocks.**
10. [ ] **#173** 30 Plants ⚠️ `live-dashboard.tsx` → **keep all three imports
        (FeedbackPrompt, GutTrend, PlantsThisWeek) + all three render blocks.**
11. [ ] **#174** first-win CTA ✅

Resolve the ⚠️ ones in GitHub's web conflict editor (all trivial) or locally:
```bash
git checkout main && git pull
git merge origin/claude/<branch>       # resolve, keep both sides, delete markers
npx tsc --noEmit && npx vitest run     # sanity before pushing the merge
```

**Done when:** all 11 are merged into `main` and the PRs show "Merged."

---

## Phase 2 — Verify merged main (10 min)

```bash
git checkout main && git pull
rm -rf .next && npm ci
npx tsc --noEmit
node scripts/check-supabase-scoping.mjs && node scripts/check-ai-guard.mjs
npx vitest run
npx next build
```

- [ ] tsc clean · both guardrails pass · full suite green · `next build` compiles.

**Done when:** the combined `main` is green locally. If the build's edge-size
error recurs, #170 didn't land — re-check step 1.

---

## Phase 3 — Apply database migrations (15 min · Supabase SQL editor)

**Per the production-DB rule in CLAUDE.md, a human applies these.** Target
project **`ephmojiwlcebenholhpc`** (EatoBiotics, eu-central-2) — NOT the
inactive `EatoSystem-Ireland` lookalike.

First reconcile the baseline (GO-LIVE.md lists up to 36; the file now goes to 46):
- [ ] Confirm Migrations 37–43 are already applied in production (read-only
      check — `list_tables` / a `SELECT` against each new table/column). Apply
      any gaps from `supabase/migrations.sql`.

Then this session's three (all idempotent `CREATE TABLE IF NOT EXISTS` / `DROP
POLICY IF EXISTS`):
- [ ] **Migration 44** (#162) — drop `meal_scans` public-read policy. *Security
      — apply first.* Verify: the policy is gone, RLS still enabled.
- [ ] **Migration 45** (#168) — `reviews` table. Verify: table exists, RLS on,
      zero policies.
- [ ] **Migration 46** (#171) — `feedback` table. Verify: table exists, RLS on,
      zero policies, three indexes present.

**Done when:** all three verified live. (App still boots without them —
features degrade gracefully — but the bot/review loop stay inert until applied.)

---

## Phase 4 — Deploy & confirm green (10 min)

- [ ] Trigger the production deploy (push to `main` / Vercel auto-deploy).
- [ ] **Deploy succeeds** — the 1 MB edge-function error is gone (#170).
- [ ] Site loads at the production URL.

**Done when:** the Vercel deployment is green and live.

---

## Phase 5 — Smoke-test the NEW features (20 min)

Beyond `GO-LIVE.md` §6, verify what this session added:

- [ ] **First-win** — logged out, homepage hero shows "Analyse a Meal Free" as
      the primary CTA → `/analyse` → guest scan flow runs → score renders.
- [ ] **Feedback bot** — the 💬 Feedback launcher appears site-wide (not on
      `/admin` or `/cms`). Submit a rating + message → thank-you → a row lands
      in `feedback` (check `/admin/feedback`). Confirm the follow-up question
      appears when the AI returns one.
- [ ] **Feedback digest** — manually fire the cron with the bearer:
      `curl -H "Authorization: Bearer $CRON_SECRET" https://<site>/api/feedback/digest`
      → owner email arrives; a second call same week is safe (no dupes needed,
      but confirm it sends). Confirm it's on the Monday `0 7 * * 1` schedule.
- [ ] **Gut Trend** — as a member with ≥3 days of logged meals, the trend card
      renders at the top-left of the overview with the right direction/delta.
- [ ] **30 Plants** — the plant ring shows in the overview right column and the
      detected-plant chips match the week's meals.
- [ ] **Review loop** (#168) — the `FeedbackPrompt` shows to engaged members
      (≥3 meals); a submitted review lands in `reviews` with `approved=false`.

**Done when:** all six behave as described in production.

---

## Phase 6 — Launch configuration (15 min)

Follow **`GO-LIVE.md` §2–§4** in full. The must-not-miss items:

- [ ] **Env secrets** set in Vercel Production — `CRON_SECRET`,
      `ADMIN_SESSION_SECRET`, `STATSIG_SERVER_KEY`, live `STRIPE_*`,
      `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL`,
      `NEXT_PUBLIC_SITE_URL`. (Fail-closed without the first two.)
- [ ] **Crons** — verify each returns 401/503 when curled without the bearer,
      and that `/api/feedback/digest` is now in the schedule.
- [ ] **The gate flip** — decide private beta vs public:
      - Private beta: strong `DEV_PASSWORD` set.
      - Public: `EATOBIOTICS_PASSWORD_GATE_DISABLED=true` (or unset the gate).
      (The temporary hardcoded fallback is already removed — LAUNCH_CHECKLIST.md
      is stale on that point; nothing to delete.)

**Done when:** secrets are set, crons fail-closed, and the gate is where you
want it for launch day.

---

## Phase 7 — Customer-testing readiness (10 min)

- [ ] Agree the 3 launch metrics (GO-LIVE.md §5) and confirm the events fire in
      Statsig/PostHog on a real production run.
- [ ] Confirm the **feedback loop is live end-to-end** — this is what turns
      testing into signal: testers can send feedback, it's triaged, and you get
      the weekly digest. Consider firing the digest manually after day 1 to see
      early themes rather than waiting for Monday.
- [ ] Line up your test cohort + the one task you want them to attempt first
      (recommend: the first-win meal scan → sign up → log 3 meals).

**Done when:** you can watch feedback + the 3 metrics for your first testers.

---

## Phase 8 — Follow-ups (after launch, not blocking)

- [ ] Switch 30-Plants (#173) source from meal-name matching to the
      `analyses.foods[]` from #165 (now merged) for exact recall.
- [ ] Decide #174's hero CTA as a Statsig A/B (scan-primary vs assessment-
      primary) rather than a permanent guess.
- [ ] Security hardening: escape `<` in `components/json-ld.tsx`;
      `timingSafeEqual` for the cron/admin secret comparisons.
- [ ] Triage the stragglers: #21, #27, #124–#129, #163 (close/rewrite/merge).
- [ ] Delete `docs/MERGE-MAP.md` and `docs/EXECUTION-PLAN.md` — throwaways.
- [ ] Let the **feedback digests** steer Roadmap Waves 2–3, not a guess.

---
_Throwaway doc — delete once the queue is cleared and you've launched._
