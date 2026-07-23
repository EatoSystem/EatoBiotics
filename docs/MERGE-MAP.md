# Merge map — open PR queue (verified)

> Empirically verified by simulating the full cumulative merge against `main`.
> Everything here is a fact from a real test-merge, not an estimate. Built for
> a laptop session: clear this queue top-to-bottom and you're launch-ready.

## Order to merge (top → bottom)

| Step | PR | What | DB migration | Merge |
|------|-----|------|--------------|-------|
| 1 | **#170** | Deploy fix — analyse OG image → nodejs (1 MB edge limit) | — | ✅ clean |
| 2 | **#169** | Security — Next.js 16.0.10 → 16.2.10 (middleware-bypass CVEs) | — | ✅ clean |
| 3 | **#166** | Fix — persist assessment score via upsert (no silent loss) | — | ✅ clean |
| 4 | **#167** | `/help` — getting-started + FAQ (Support/Onboarding) | — | ✅ clean |
| 5 | **#162** | Security — drop `meal_scans` public-read RLS policy | **44** | ✅ clean |
| 6 | **#168** | Loyalty review loop — feedback capture + moderated proof | **45** | ✅ clean (stacked on #162) |
| 7 | **#165** | Analyse consolidation — shared `lib/analysis` core + `foods[]` | — | ✅ clean |
| 8 | **#171** | Customer feedback bot — capture + AI triage + weekly digest | **46** | ⚠️ `migrations.sql` |
| 9 | **#172** | Gut Trend — biotics score over time (dashboard, left col) | — | ⚠️ `live-dashboard.tsx` |
| 10 | **#173** | 30 Plants a Week — plant ring (dashboard, right col) | — | ⚠️ `live-dashboard.tsx` |
| 11 | **#174** | First-win onboarding — hero leads with instant meal scan | — | ✅ clean |

**8 of 11 merge clean. The 3 conflicts are all trivial "keep both" — zero logic to reconcile.**

Every open PR was also confirmed to merge cleanly into `main` *individually* — none is stale.

## The 3 conflicts + exact resolution

### #171 → `supabase/migrations.sql`
Append-append. By this step `main` has Migrations 44 (#162) and 45 (#168); #171 adds 46. All three are separate blocks appended at the end of the file.

**Resolution: keep ALL THREE blocks, in order — 44, then 45, then 46.**

> ⚠️ **Verified trap:** do *not* "take one side" of this conflict. A test that
> took the incoming (#171) side silently **deleted Migrations 44 and 45**,
> because #171's branch was cut from `main` before they existed. It must be a
> *both-sides* keep. In the GitHub web conflict editor, both blocks are shown —
> keep both; delete only the `<<<<<<<`, `=======`, `>>>>>>>` markers.

Correct end state (tail of the file):
```
-- Migration 44: drop meal_scans public-read policy (PII leak fix)   [#162]
-- Migration 45: reviews (member feedback / testimonial loop)         [#168]
-- Migration 46: feedback (customer feedback bot → owner digests)     [#171]
```

### #172 → `components/account/live-dashboard.tsx`
By this step #168 (FeedbackPrompt) already added an import next to the same
anchor and a render block. #172 adds a `GutTrend` import + a render block in the
**left** column + a `scoreHistory` prop.

**Resolution: keep all import lines and all render blocks.** They're purely
additive and don't share a render location.

### #173 → `components/account/live-dashboard.tsx`
Same shape. #173 adds a `PlantsThisWeek` import + a render block in the
**right** column.

**Resolution: keep all three imports (FeedbackPrompt, GutTrend, PlantsThisWeek)
and all three render blocks.** Left column = FeedbackPrompt + GutTrend; right
column = PlantsThisWeek. No overlap.

## After merging — apply the migrations (human-only, per the DB rule)

All three are drafted in `supabase/migrations.sql`, idempotent, and applied by a
human in the Supabase SQL editor (project `ephmojiwlcebenholhpc`):

- **Migration 44** (#162) — `meal_scans` PII fix. *Security — apply promptly.*
- **Migration 45** (#168) — `reviews` table. Review loop fails soft until applied.
- **Migration 46** (#171) — `feedback` table. Feedback bot fails soft until applied.

None is required for the app to boot; features degrade gracefully. #162 closes a
real (if low-volume) data exposure, so do it first.

## Follow-ups queued (not blocking)

- Once **#165** lands, switch the 30-Plants source (PR #173) from meal-name
  matching to the structured `analyses.foods[]` for exact recall.
- **#174** flips the hero's primary CTA to the meal scan — a reversible funnel
  call; natural Statsig A/B given the existing `free_first_meal_scan` gate.
- Low-severity security hardening (from the security review): escape `<` in
  `components/json-ld.tsx`; use `timingSafeEqual` for the cron/admin secret
  comparisons.
- Stragglers to triage: #21 (superseded?), #27 (monitoring), #124–#129, #163.

---
_This file is a throwaway aid — delete it (or close its PR unmerged) once the
queue is cleared._
