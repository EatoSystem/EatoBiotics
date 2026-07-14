# EatoBiotics — Critical Review

Companion to `ANALYSIS.md` (read-only codebase inventory). This document
adds judgment: what's wrong, why it matters, and what to do about it,
ranked by impact. Where `ANALYSIS.md` already established a fact, it's
cited rather than re-derived. Verification reads were done directly against
the repo, including the unmerged `claude/newhome-concept` branch (PR #125),
which predates and is not covered by `ANALYSIS.md`.

Positioning this review holds the site to: **"The Food System Inside
You"** — the personal gateway into EatoSystem, a long-term platform, not a
one-time report. **"Understand within. Improve daily. Participate
outward."** **"The science is global. The food is local."** Glucose and
Performance are pathways within EatoBiotics, not separate products.

---

## 1. Homepage decision — production `/` vs. `/newhome` (PR #125)

### What each one is

**Production (`app/page.tsx` + `components/home/*`)**: Hero → PowersEverything
→ HowItWorks → DigitalTwinSection → TheFramework → ScorePreview → Ecosystem
→ MembershipTeaser → ClosingCta. Built, live, indexed, converting today.

**`/newhome` concept (branch `claude/newhome-concept`, PR #125, open,
unmerged, noindex)**: ConceptHero → ScoreExample → FeedSeedHeal → Journey →
StateOfProduct → Pathways → MealMap → GlobalDirection →
TrustAndConnection. Explicitly a review-only design exercise ("Do not
merge" in the PR body), reviewed via a Vercel preview.

### Hero

Production's subhead is transactional and gut-only: *"Discover what your
gut is actually doing — and get a plan to improve it in 30 days."* CTA:
*"Understand My Food System."* Footer tags: "3-minute assessment /
Personalised Food System Score / 30-day action plan." This is a
**one-time-report pitch** — it undersells the platform and contradicts
"not a one-time report."

The concept's subhead: *"Your digestion, energy, cravings, gut comfort,
mood, daily rhythm, and relationship with food are connected. EatoBiotics
helps you understand your own food system, see how it is being fed, and
take practical steps to improve it over time."* Followed by: *"Understand
the Food System Inside You. Learn how to feed it better. Watch it
improve."* CTA: *"Get My Food System Score"* + secondary *"See How It
Works"* anchor. This is a direct paraphrase of "Understand within. Improve
daily." and reads as platform-first, not report-first.

**Inconsistency to fix regardless of outcome**: production says the
assessment takes "3 minutes," the concept says "about 5 minutes." Pick one
and make `lib/assessment-data.ts`/hero copy agree everywhere (this
number also appears in `/enter`, `/assessment`, and multiple vertical
pages — audit all of them together, not just the two heroes).

**Verdict: the concept's copy should win.** The visual shell (video,
layout, CTA styling) is close to identical between the two — the concept
explicitly built on top of the production shell rather than replacing it,
so adopting its copy is low-risk. The food-photography drift-strip under
the hero is a nice food-first touch and cheap to keep (uses only existing
`/food-N.webp` assets, respects `prefers-reduced-motion`), but it's
decorative-only — ship it as a fast-follow, not a blocker.

### Six-systems / ecosystem layout

Production's `Ecosystem` section (`components/home/ecosystem.tsx`) is
**more architecturally correct** than the concept's `Pathways`: it renders
all 11 systems from `lib/systems.ts` grouped by family (2 Foundation + 6
Health + 3 Life), each carrying live/scaffold status from the same
catalog that drives the account "Explore Your Food System" surface and
`tests/unit/systems.test.ts`. It's data-driven, not hand-coded — adding a
12th system means one entry in `lib/systems.ts`, not a new homepage
component.

The concept's `Pathways` section is narrower (4 of 6 Health systems only —
Recovery/Longevity, both `scaffold`, are correctly omitted) but has two
things production lacks: (1) an explicit sentence anchoring the whole
section — *"Four pathways, all part of EatoBiotics, all building on your
You or Family foundation"* — which is exactly the "not separate products"
positioning stated nowhere in production copy (see §3); (2) a genuinely
strong emotional hook: the two side-by-side Digital Twin videos ("Her food
system" / "His food system") captioned *"Two people, two different food
systems — same foundation. Yours is just as personal."*

**Recommendation**: keep production's `Ecosystem` component (it's the
correct long-term architecture — catalog-driven, extensible, already
covers Life systems the concept drops), but **port two things from the
concept into it**: the explicit "all part of EatoBiotics, none stand
alone" framing sentence (production's current copy — *"Every system builds
on your foundation; none stand alone"* — is close, just needs the explicit
"pathways within EatoBiotics" language added, see §3), and the twin-video
pairing as an optional lead-in above the system grid.

### Pricing

Production's `MembershipTeaser` ("Two ways to start": €49 one-time Gut
Report vs. €24.99/mo Membership) is complete, has real Stripe-linked CTAs,
and a money-back-guarantee line. **The concept has no equivalent pricing
section at all** — `journey.tsx` mentions "membership" once in passing and
`state-of-product.tsx` lists "Membership plans" as an "available" item, but
there's no priced, CTA'd pricing card anywhere in the 9 concept sections.

**Verdict: keep production's `MembershipTeaser` unchanged**, insert
verbatim into whichever homepage ships. This is a hard gap in the concept,
not a design choice — flag it back to whoever reviews PR #125 rather than
silently patching around it.

### Social proof

Neither homepage has real social proof. Production's `/api/community-stats`
route exists (public, 1-hour revalidate, pulls from `analyses`/`leads`) but
**is not called from any homepage component** — its only consumer is
`components/account/community-pulse-card.tsx`, which lives inside the
authenticated dashboard, not the public homepage. The concept has zero
social-proof section (no member counts, testimonials, or trust badges
beyond the honesty grid in §1.6 below).

**This is a genuine gap in both.** The site has a live-data endpoint built
for exactly this purpose and it's mounted nowhere a visitor can see it.

### What's missing from both

1. **No social proof on the homepage in either version** (above).
2. **No "Honest By Design" readiness section in production.** The
   concept's `StateOfProduct` section — a three-column honesty grid
   ("Use it today" / "Being built now" / "Where this is going") — is
   good practice independent of which hero copy wins, and costs nothing to
   adopt: it's static content, no new data dependencies. Recommend
   porting it whole into production regardless of the hero decision.
3. **No "science is global, food is local" section in production at
   all.** Verified via repo-wide grep: the phrase and its variants
   ("understand within," "improve daily," "participate outward,"
   "gateway into EatoSystem") appear **nowhere** in shipped code — only in
   the `GlobalDirection` concept section. If this is the locked strategic
   line, production is currently silent on it. Recommend porting
   `GlobalDirection` (or a trimmed version) into production even if the
   rest of the hero/pathways sections are left alone — it's the only place
   in the whole codebase this positioning is stated to a visitor.
4. **`MealMap` in the concept is presented as speculative/future**
   ("Photograph a meal, map it through Feed, Seed, and Heal... Add it to
   your journey" — explicitly labelled "Being built now"), but the real
   product **already has this feature**: `/analyse` (live, tier-aware, via
   `AnalyseGate`) plus the Twin's `meal-reveal`/`meal-reaction` components
   already do photograph → Feed/Seed/Heal scoring → journey update. See
   §6 — recommend replacing the speculative `MealMap` concept art with a
   real screenshot/recording of `/analyse`, since presenting a working
   feature as a future concept undersells the product.

### Recommendation

Don't ship `/newhome` wholesale and don't leave production as-is either.
Take production's **information architecture** (full systems catalog,
priced membership section, existing component shells) and the concept's
**copy and two new sections** (`StateOfProduct`, `GlobalDirection`, plus
the reframed hero paragraph and the "pathways, not products" sentence).
Concretely: edit `components/home/hero.tsx`'s copy in place, add the two
new sections from `components/newhome/state-of-product.tsx` and
`global-direction.tsx` (renamed into `components/home/`) into
`app/page.tsx` between `Ecosystem` and `MembershipTeaser`, and delete
`app/newhome/` + `components/newhome/` per the branch's own stated
promotion path. Do not merge PR #125 as-is.

---

## 2. The duplication problem

`ANALYSIS.md` §2 documents three parallel structures precisely (adhd/
anxiety/depression/bipolar — 8 files × 4; start/start-family/start-mind —
10 files × 3; Framework/ScoreShowcase/Hero × 5 verticals). Verified
directly: `components/adhd/adhd-hero.tsx` and
`components/anxiety/anxiety-hero.tsx` differ **only** in one icon import,
one accent color, and the paragraph copy — everything else (layout,
classes, structure) is byte-for-byte identical. This is not
coincidental-similarity, it's the same component with find-and-replace
applied.

**The codebase already has the right pattern for this, in production,
today**: `components/book/chapter/chapter-page-factory.tsx` renders all 25
book chapters from one shared template plus a `getChapterByNumber(n)` data
lookup (`lib/chapters.ts`), with a single MDX-component map. That's the
model to replicate.

### Proposed architecture

**(a) Condition verticals (adhd/anxiety/depression/bipolar → 1 shared set)**

Create `lib/conditions.ts` modeled on `lib/systems.ts`:
```ts
export interface ConditionDef {
  key: "adhd" | "anxiety" | "depression" | "bipolar"
  label: string                // "ADHD"
  icon: LucideIcon
  accent: string                // "var(--icon-yellow)"
  heroCopy: { eyebrow: string; body: string }
  scienceCopy: { intro: string; mechanisms: string[] }
  pathwayCopy: string[]
  foodSupport: { title: string; items: FoodItem[] }
  foods: FoodProfile[]
  ctaCopy: string
  disclaimer: string           // condition-specific safety line
  seo: { title: string; description: string }
}
export const CONDITIONS: Record<ConditionKey, ConditionDef> = { adhd: {...}, anxiety: {...}, ... }
```
Replace the 32 files in `components/{adhd,anxiety,depression,bipolar}/`
with 8 shared components in `components/condition/`
(`condition-hero.tsx`, `condition-body.tsx`, `condition-science.tsx`,
`condition-pathway.tsx`, `condition-food-support.tsx`,
`condition-foods.tsx`, `condition-cta.tsx`, `condition-disclaimer.tsx`),
each taking `{ condition: ConditionDef }` as a prop. Replace the 4 page
files with a factory: `createConditionPage(key)` in
`components/condition/condition-page-factory.tsx`, and each of
`app/adhd/page.tsx` etc. shrinks to the same 4-line shape as
`app/book-chapter-N/page.tsx`.

**(b) Start funnels (start/start-family/start-mind → 1 shared set)**

Same treatment: `lib/funnels.ts` with a `FunnelDef` per vertical (hero
copy, problem/pressure/solution/how/trust/value/final copy blocks, the
score-mock data, sticky-CTA copy), 10 shared components in
`components/funnel/`, one factory. Collapses 30 files to 10 + 1 config
file.

**(c) Framework/ScoreShowcase/Hero trio (5 verticals)**

Lower priority than (a)/(b) — these are **less** structurally identical
(`ANALYSIS.md` notes inconsistent PascalCase vs. kebab-case naming
already, suggesting they were written by different sessions/times, so the
underlying JSX may have drifted more than the condition pages). Recommend
a lighter consolidation: keep 3 separate components but extract a shared
`VerticalHeroShell`/`VerticalFrameworkShell` wrapper that each vertical's
thin component passes copy/image props into — don't force a single
factory here on the first pass, since the components are large (100+
lines each in some cases) and the risk of subtly breaking one vertical's
specific layout is higher for a marginal file-count win.

### Migration path

1. Do (a) first — highest file-count win (32→9), lowest risk (verified
   byte-identical structure), and it's a literal transplant of the
   `chapter-page-factory` pattern that already ships in production.
2. Migrate one vertical at a time behind no feature flag needed (these are
   static marketing pages, not stateful features) — just PR per vertical,
   diff the rendered HTML against the old page before merging (a simple
   Playwright snapshot test per vertical, since `tests/unit/` already has
   the Vitest infra and pattern for this kind of page-shape assertion —
   see `tests/unit/vertical-scoring.test.ts` for precedent).
3. Delete the old per-vertical files only after all 4 (or 3, for funnels)
   are cut over and the snapshot tests pass — don't do a big-bang delete.
4. Do (b) next using the same recipe.
5. Leave (c) until there's a concrete reason to touch those pages (e.g. a
   copy change requested across all 5 verticals) — don't refactor for its
   own sake there.

### Risk

- Low technical risk for (a)/(b): these are presentational marketing
  pages with no state, no Supabase calls, no auth — a rendering regression
  is visually obvious and has zero data-integrity blast radius.
- The main risk is **losing condition-specific nuance in the copy** during
  the config extraction — the anxiety-hero science paragraph (GABA, vagus
  nerve, stress response) is meaningfully different content from ADHD's
  (dopamine, neuroinflammation), not just a template with swapped nouns.
  Whoever writes `lib/conditions.ts` must copy-paste the existing prose
  verbatim into the config rather than re-writing it, to guarantee no
  clinical-accuracy drift during the refactor.
- SEO risk is near-zero: URLs don't change, `generateMetadata` output stays
  identical if the `seo` config field is populated from the current
  `metadata` exports verbatim.

---

## 3. Messaging consistency

### The one real violation: `/glucose` markets itself as a standalone brand

This is the single clearest contradiction of the locked positioning found
in the review. `app/glucose/page.tsx` (576 lines) and
`app/glucose/assessment/page.tsx` refer to **"EatoBetics"** as if it were
its own product throughout:

- Page `<title>`: `"EatoBetics | The Glucose System Inside You"` (not
  `"The Glucose Food System | EatoBiotics"`, which is the pattern
  `/performance` correctly uses — see below).
- Meta description: *"EatoBetics is a glucose intelligence platform that
  helps people understand how food affects energy, cravings, glucose
  stability, and long-term metabolic health."* — this describes a
  separate platform, not a pathway.
- Section headers in the page body: *"The 3 Systems of EatoBetics,"* *"Why
  EatoBetics,"* *"Three ways to use EatoBetics,"* *"How EatoBetics
  works,"* an *"EatoBetics Score™"* and an *"EatoBetics Report."*
- `app/account/glp1/page.tsx` browser-tab title: `"GLP-1 Companion —
  EatoBetics"` (not "— EatoBiotics").
- `lib/cms/taxonomy.ts` line 34 formally lists `["EatoBiotics",
  "EatoSystem", "EatoBetics", "EatoSports"]` as **four sibling brands** in
  the CMS's content taxonomy — this isn't just page copy, it's the CMS
  data model treating Glucose and Performance's legacy names as
  first-class brand entities alongside the two real ones.

**Compare this to `/performance` (95 lines)**, which gets it right: title
is `` `${system.productName} | EatoBiotics` `` (renders as "The Performance
Food System | EatoBiotics"), and it explicitly states the correct
framing — *"Instead of a standalone sports app → One Food System,
strengthened."* Performance was evidently already aligned to the current
positioning; Glucose was not (`/glucose` is 6x longer, suggesting it's
older content that predates the "pathways not products" decision and
never got the same pass).

**Fix**: rewrite `/glucose`'s metadata and section copy to match
`/performance`'s pattern — title becomes `"The Glucose Food System |
EatoBiotics"`, "EatoBetics Score™" becomes "your Glucose Score" (or
whatever the equivalent Performance-page term is, for consistency —
`/performance` doesn't appear to have a distinctly-named sub-score at
all, which is itself the more correct pattern; consider dropping the
distinct "Score™" trademark styling for Glucose too), "Why EatoBetics" →
"Why this pathway" or similar. Update `app/account/glp1/page.tsx`'s title.
Update `lib/cms/taxonomy.ts`'s `BRANDS` constant — decide deliberately
whether EatoBetics/EatoSports should exist in the CMS taxonomy at all
(if they're needed for tagging legacy content, fine, but they shouldn't
sit as co-equal entries with EatoBiotics/EatoSystem without a comment
explaining they're retired/internal-only names).

Note `lib/systems.ts` itself is clean — `glucose.productName` is already
`"The Glucose Food System"` and `glucose.label` is `"Glucose"`; the
catalog is correct, only the page's own hand-written copy diverges from
it. This means the fix is a copy/metadata edit to one file, not an
architecture change.

### Secondary finding: the locked strategic lines don't appear anywhere in shipped copy

Repo-wide grep for "science is global," "food is local," "understand
within," "improve daily," "participate outward," and "gateway into
EatoSystem" returns **zero matches** outside the unmerged `/newhome`
branch. If these are meant to be load-bearing brand language, right now
they exist only in an internal review artifact, not on the live site.
This isn't a contradiction so much as an absence — see §1's
recommendation to port `GlobalDirection` into production regardless of
the rest of the homepage decision.

### Everything else checked and found consistent

- Main navigation (`lib/nav.ts`) sources vertical labels directly from
  `lib/systems.ts` ("Glucose," "Performance," etc.) — no "EatoBetics"/
  "EatoSports" branding leaks into the nav.
- `app/you/page.tsx`, `app/mind/page.tsx`, `app/family/page.tsx` each
  carry one nav-card reference to `name: "EatoBetics"` (with tagline "The
  Glucose System Inside You") in their own inline "explore other systems"
  card list — smaller-scale instances of the same naming drift, same fix
  (change `"EatoBetics"` to `"Glucose"` in those three card arrays; they
  already carry the correct tagline).
- `/eatosystem` and homepage `Ecosystem` correctly frame EatoSystem as the
  destination the user "participates outward" into (external
  EatoSystem.com links, county/community language) — no contradiction
  found there.

---

## 4. CLAUDE.md corrections

`ANALYSIS.md` established the specific drifts; this section drafts the
literal replacement text.

### 4.1 Dashboard tab count (currently line 53)

```diff
-- `components/account/dashboard-client.tsx` — 6-tab client component
++ `components/account/dashboard-client.tsx` — 10-tab client component
++   (Today, Overview, Reports, Membership, My Plate, My Meals, Refer,
++   EatoBiotic, Intelligence, Story)
```

### 4.2 Database Tables — add the missing sections

Insert after the existing `### Other tables` block (currently line 256),
before `## Environment Variables`:

```markdown
### CMS / Content Studio tables *(new — `/cms` admin tool)*
`cms_content`, `cms_content_versions`, `cms_tags`, `cms_content_tags`,
`cms_audit_log`, `cms_media`, `cms_content_media`, `cms_books`,
`cms_chapters`. Service-role-only access (RLS enabled, zero policies) —
gated entirely at the route/layout level via `lib/cms/auth.ts`'s
`requireCmsAdmin`, not by row-level policies. See `app/cms/*` and
`app/api/cms/*`.

> `cms_chapter_mirror` and `cms_import_batch` (Migration 41) are defined
> in `supabase/migrations.sql` but are explicitly marked **"PROPOSED — DO
> NOT APPLY until the 25-chapter import is explicitly approved."** Do not
> treat these two tables as live schema until that migration is
> deliberately run.

### Living Twin / daily ritual tables *(new)*
- `twin_state` (Migration 36) — daily ritual taps + milestone
  seen-set, synced cross-device via `/api/twin-state`
  (localStorage-first, same pattern as Stability — see
  `lib/account/twin-state-sync.ts`).
- `profiles.sex` (Migration 35) — Twin figure personalisation.

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
```

### 4.3 Full current table list (replace the implied "17 tables" framing)

Add a summary line near the top of `## Database Tables`:

```markdown
> As of Migration 40, 34 distinct tables exist across profiles/leads/
> deep_assessments/subscriptions/analyses/family/GLP-1/stability
> (documented individually below), plus the CMS subsystem and Living Twin
> tables documented in their own subsections. Migration 41 is proposed,
> not applied — see the CMS section below.
```

### 4.4 "What NOT to Modify" — add one line

The existing list doesn't mention the CMS subsystem's atomic-import
machinery, which has unusually strict transactional invariants (see the
`cms_import_chapters` function's own comments in
`supabase/migrations.sql` around migration 40). Add:

```markdown
- `app/api/cms/import/chapters/route.ts` and the `cms_import_chapters`
  Postgres function (migration 40) — the atomic import/rollback logic has
  hand-documented invariants about `ON DELETE SET NULL` vs `CASCADE` and
  batch-id reuse; changes here need a full re-read of the migration's
  inline comments, not a quick patch.
```

---

## 5. Cleanup plan

Straight from `ANALYSIS.md` §5/§7, organized by risk.

### Safe to delete now (verified zero references, low/no risk)

| Item | Verification | Action |
|---|---|---|
| `components/gut-brain/` (2 files) | Zero imports; only consumer route (`/gut-brain`) is a pure `redirect("/mind")` that imports only `next/navigation` | Delete directory |
| `components/theme-provider.tsx` | Zero references anywhere, not wired into `app/layout.tsx` | Delete file |
| `components/substack-card.tsx` | Zero references | Delete file |
| 9 unused `components/home/*.tsx` files (`app-showcase`, `book-showcase`, `eatosystem-teaser`, `founder-teaser`, `go-deeper`, `latest-from-substack`, `manifesto`, `newsletter-cta`, `podcast-teaser`, `try-a-meal-teaser`, `what-were-building`) | Zero import sites for any of the 9; pages that could use them have independent bespoke content | Delete all 9 files. **Exception**: if any of the §1 homepage-merge work wants to reuse copy/structure from these as a starting point (e.g. `what-were-building.tsx` may overlap conceptually with the new `StateOfProduct` section), diff them first before deleting — don't delete blind if a homepage PR is in flight at the same time. |
| 16 root-level PNGs + `Book - You/` directory | Zero references in `app/`, `components/`, `lib/`, `public/` | Move out of the repo (to shared drive/design tool) rather than `git rm` blind — these look like founder-uploaded reference material, not generated artifacts; confirm with whoever added them before deleting, since `ANALYSIS.md` couldn't establish intent, only usage |
| `eatobiotics-design-system/` | Zero references from app code; has its own README/SKILL.md, reads as an intentionally separate design-reference package | Leave in place or move to its own repo — it's not "dead code," it's mis-located documentation. Don't delete without confirming it isn't the working source for the design system referenced in the `artifact-design`/`dataviz` skills setup. |

### Package.json — unused shadcn/radix scaffold

~20 `@radix-ui/react-*` packages, `class-variance-authority`, `cmdk`,
`vaul`, `input-otp`, `react-day-picker`, `react-resizable-panels`,
`recharts`, `date-fns`, `@statsig/js-client` — confirmed zero imports
anywhere in `app/`, `components/`, `lib/`.

**Recommended action**: remove from `package.json` in one PR, run
`npm install`, then `npm run build` + full Vitest suite + a manual smoke
pass of a few pages that use charts/carousels conceptually
(`/account` weekly-progress views use `recharts`-*adjacent* concepts but
verify — if any account chart component turns out to import `recharts`
transitively through a path the static grep missed, this PR's build will
fail loudly rather than silently breaking production, which is the safe
failure mode here). **Risk**: low — a missing-dependency build failure is
caught in CI before merge, not in production. The only way this bites is
if something imports one of these packages via a dynamic
`require()`/`import()` string that a static grep can't see — worth one
extra `grep -rn "require(\|import(" app components lib | grep -iE
"radix|cmdk|vaul|recharts|date-fns|day-picker|resizable-panels"` pass
before merging the removal, since none of the greps run for `ANALYSIS.md`
specifically checked for dynamic imports.

**Do not delete** `components.json` itself yet — either commit to
actually building out `components/ui/` from shadcn at some point (in
which case keep the config and the deps), or explicitly decide the
project doesn't use shadcn primitives (in which case delete
`components.json` too, in the same PR as the dependency removal, so the
two states can't drift again).

### Not dead — leave alone

`lib/admin-auth-edge.ts` was misflagged as orphaned by `ANALYSIS.md`'s
first-pass sub-agent (corrected in that document already) — it's actively
imported by `proxy.ts` for the `/cms` edge gate. Don't touch it.

---

## 6. Account / daily habit flow UX and Meal Map readiness

### Daily ritual system — solid, but the docstring lies about its own architecture

`lib/account/ritual.ts`'s file-header comment says *"Daily Ritual state
(localStorage-first, no backend)"* and *"Three one-tap daily check-ins,"*
but the actual `RITUAL_CHECKS` array has **five** checks (fermented,
plants, moved, slept, feeling), and
`lib/account/twin-state-sync.ts` — a separate file the docstring doesn't
mention — implements exactly the same localStorage-first-with-background-
sync pattern that `ANALYSIS.md` only credited to the Stability module:
local taps are instant, `hydrateTwinState()` merges server state from
`/api/twin-state` on mount, and `pushTwinState()` fire-and-forgets local
changes back up so streaks/milestones survive across devices (Migration
36, `twin_state` table). **This is good architecture, undersold by a
stale comment.** Fix: update `lib/account/ritual.ts`'s header to say "five
one-tap daily check-ins, synced cross-device via `twin-state-sync.ts`
when signed in" — a two-line comment fix, no behavior change.

### 10-tab dashboard — breadth without a clear entry point

`components/account/dashboard-client.tsx`'s 10 tabs (Today, Overview,
Reports, Membership, My Plate, My Meals, Refer, EatoBiotic, Intelligence,
Story) cover a lot of ground, but nothing in the tab bar itself signals
which tab a returning member should land on for their daily habit loop —
"Today" is first alphabetically-by-intent but there's no visual weighting
(badge, pulse, unread indicator) distinguishing "come back for your daily
ritual" from "go read your one-time Story." Given the platform's stated
"Improve daily" positioning, the daily-habit surface (ritual taps, meal
log, streak) deserves to be the assertive default landing tab with the
others visually secondary, rather than 10 co-equal tabs. This is a
UX-hierarchy problem, not a missing-feature problem — the pieces
(`daily-ritual.tsx`, `today-strip.tsx`, streak tracking in
`lib/streak.ts`) already exist.

**Recommendation**: on `/account`, default to the "Today" tab (verify
`dashboard-client.tsx`'s initial `TabKey` state — if it currently defaults
to "overview," that's a one-line default-state change with outsized
retention impact for a habit-loop product) and add a subtle streak-count
badge to the Today tab label so the habit visually earns its place at the
front of the row.

### Meal Map — the concept is describing a feature that already exists

As flagged in §1: the `/newhome` concept's `MealMap` section explicitly
labels itself a provisional/future concept ("Photograph a meal, map it
through Feed, Seed, and Heal... Add it to your journey," status
"in-development"). But `/analyse` (live), `app/api/analyse-meal`,
`app/api/analyse/stream`, and the Twin's `meal-reveal.tsx`/
`meal-reaction.tsx`/`meal-impact.tsx` components already implement
exactly this loop today, tier-gated via `AnalyseGate`. **This isn't a
readiness gap — the feature is more ready than the concept admits.** The
actual readiness question is narrower: is the *specific* Feed/Seed/Heal
visual framing shown in the `MealMap` mockup (one strength + one
opportunity chip, tinted by pillar) how `/analyse`'s real result screen
looks today, or is that a proposed redesign of the existing result screen?
That distinction should be resolved before this section goes anywhere
near production, because right now it reads as vaporware for a feature
that's actually shipped.

**Recommendation**: replace the `MealMap` concept mockup with a real
screenshot or short recording of `/analyse`'s actual result state, and if
the Feed/Seed/Heal chip treatment shown in the mockup is a genuinely
proposed visual change, split that into its own clearly-scoped design
proposal against `components/analyse/result-builder.tsx` rather than
bundling a real-feature redesign inside a homepage concept review.

---

## 7. Supabase patterns, performance, SEO, accessibility

### Supabase patterns

`ANALYSIS.md` §3 already covers the dominant pattern accurately (service-
role client + manual `user_id` scoping, RLS not the primary gate outside
Realtime). Two things worth flagging that weren't called out there as
risks:

- **~110 manually-scoped call sites is a lot of surface area for a single
  missed `.eq("user_id", ...)` to leak another user's data**, since RLS
  isn't a backstop for the service-role client. There's no automated test
  asserting "every `getSupabase()` call in an authenticated route includes
  a user-scoping filter" — worth a lightweight lint rule or a
  grep-based CI check (e.g. flag any `getSupabase()` call in
  `app/api/**` that doesn't have a `.eq(` within N lines) rather than
  relying on code review catching it every time.
- `lib/supabase-filters.ts`'s `ownerOrFilter()`/`pgQuote()` pair is the
  right instinct (prevent PostgREST filter-string injection), but
  `ANALYSIS.md` found it used for `deep_assessments`/`leads` specifically
  — worth confirming every other hand-built `.or()` filter string
  elsewhere in the 92 API routes goes through `pgQuote()` too, rather than
  being interpolated directly. Not verified in this pass; flagging as a
  targeted follow-up grep (`grep -rn '\.or(' app/api` and check each for
  raw string interpolation).

### Performance

- **`next.config.mjs` sets `images: { unoptimized: true }` globally.**
  Given the homepage alone ships a hero video plus (per the `/newhome`
  concept PR body) up to "3 videos + 41 images on page," and the account
  dashboard/Twin surfaces are image-heavy too, this means **no automatic
  resizing, format conversion (WebP/AVIF), or responsive `srcset`
  generation from `next/image` anywhere in the app** — every image ships
  at its source file size to every device. This is very likely the single
  largest real performance lever available site-wide, and it's a
  one-line config change to reconsider (`unoptimized: true` was probably
  set for a specific reason — check whether it was to work around the
  `outputFileTracingExcludes`/plate-builder Vercel function-size issue
  documented in `next.config.mjs`'s own comments, in which case the fix is
  scoping `unoptimized` more narrowly rather than removing it wholesale).
- `remotion/` being a fully separate sub-project (own `package.json`,
  pinned `react@19.2.3` vs. root's `19.2.0`) is good hygiene — it keeps
  video-generation tooling out of the production bundle. No action
  needed, just confirming it's not accidentally pulled into the Next.js
  build.
- The book-chapter pattern (100 pages) reads MDX files from disk with
  `fs.readFileSync` at request time in the `/print`, `/reedsy`,
  `/substack` sub-pages rather than at build time — worth confirming
  these are statically generated (`generateStaticParams`) rather than
  hitting disk on every request in production; `ANALYSIS.md` didn't check
  for `generateStaticParams` on these specific routes.

### SEO

`ANALYSIS.md` §6 is thorough; two additions:

- The three parallel family-assessment URLs (`/assessment/family`,
  `/assessment-family`, `/family-assessment`, all rendering the same
  `FamilyAssessmentClient`) are exactly the kind of duplicate-content
  pattern search engines penalize. Pick one canonical URL, `301` the
  other two (or add `rel="canonical"` pointing at the chosen one), and
  update `app/sitemap.ts`'s `STATIC_PATHS` to list only the canonical
  route (it currently lists `/assessment-family` — confirm this is
  deliberately the chosen canonical, not an oversight).
- `/glucose`'s SEO copy (§3) actively hurts topical authority for the
  EatoBiotics brand — Google sees a page whose own metadata describes a
  different, unrelated-sounding "platform" ("EatoBetics") rather than
  reinforcing EatoBiotics as the entity. Fixing the messaging
  inconsistency in §3 is also an SEO fix.

### Accessibility

Not covered by `ANALYSIS.md` — spot-checked in this pass:

- 147 `alt=` attributes found across `app/`/`components/`, 27 of them
  empty-string (`alt=""`, i.e. deliberately decorative). That's a
  reasonable ratio and the decorative ones seen in this review (food
  strips, gradient blobs) are correctly marked `aria-hidden` or `alt=""`
  — no systemic missing-alt-text problem found in the files read.
  **This was a sample, not exhaustive** — `ANALYSIS.md`'s component count
  (333 files) means most weren't individually read for alt-text
  correctness; treat this as "no red flag found," not "verified clean."
- The `/newhome` PR body claims its own Playwright QA pass checked "single
  h1" and "0px horizontal overflow at 1440/768/375" — no equivalent
  automated a11y/visual-regression check appears to exist for the
  **production** homepage or any of the other 235 pages. Given the size
  of the page inventory, a single Playwright a11y smoke test (axe-core)
  run against a curated list of ~20 representative pages (one per major
  vertical/pattern-cluster, not all 236) would catch systemic issues far
  more cheaply than page-by-page manual review.
- Color-only status communication: several components (e.g. the
  homepage `Ecosystem` system cards, `StateOfProduct`'s status columns)
  use color as the primary signal for live/scaffold/in-development status
  with a text label alongside it — this is done correctly (label +
  color, not color alone) everywhere it was checked in this pass.

---

## Prioritized fix list

### Quick wins (hours, not days)

1. **Fix `/glucose`'s branding copy** (§3) — rewrite page title, meta
   description, and the 6+ "EatoBetics"-branded section headers in
   `app/glucose/page.tsx` and `app/glucose/assessment/page.tsx` to match
   `/performance`'s already-correct pattern. Update
   `app/account/glp1/page.tsx`'s title. Update the three
   `name: "EatoBetics"` nav-card entries in `app/you/page.tsx`,
   `app/mind/page.tsx`, `app/family/page.tsx` to `"Glucose"`.
2. **Fix the assessment-length inconsistency** (§1) — "3 minutes" vs. "5
   minutes" across hero/hero-concept and elsewhere; pick one number, grep
   for all instances, make them agree.
3. **Fix `lib/account/ritual.ts`'s stale docstring** (§6) — it says
   "three checks, no backend"; there are five checks and it does sync via
   `twin-state-sync.ts`. Two-line comment fix.
4. **Correct CLAUDE.md** per §4's drafted diffs — dashboard tab count, the
   missing CMS/Twin/assessment-journey/plate table sections, and the
   Migration 41 "proposed, not applied" caveat.
5. **Delete the 3 confirmed-orphaned component files/dirs** (§5):
   `components/gut-brain/`, `components/theme-provider.tsx`,
   `components/substack-card.tsx`.
6. **Change `/account`'s default dashboard tab to "Today"** if it isn't
   already (§6) — verify current default state first, one-line change if
   not.

### Medium efforts (days)

7. **Rebuild the homepage per §1's recommendation**: keep production's
   `Hero` shell but replace its copy; add `StateOfProduct` and
   `GlobalDirection` as new sections between `Ecosystem` and
   `MembershipTeaser`; keep `Ecosystem`/`MembershipTeaser` as-is; delete
   `app/newhome/` + `components/newhome/` once ported. Close PR #125 with
   a note pointing at the new production PR instead of merging it as-is.
8. **Mount `/api/community-stats` on the public homepage** (§1) — it
   exists, is public, revalidates hourly, and currently only feeds an
   authenticated dashboard card. Add a small social-proof strip to the
   homepage using it.
9. **Remove the ~20 unused Radix/shadcn packages + supporting deps**
   (§5) from `package.json`, verify with a full build + test pass +
   dynamic-import grep first, and decide `components.json`'s fate in the
   same PR.
10. **Replace the `/newhome` `MealMap` concept art with real `/analyse`
    screenshots** (§1/§6), or split any genuine Feed/Seed/Heal result-screen
    redesign into its own scoped proposal against
    `components/analyse/result-builder.tsx`.
11. **Canonicalize the three family-assessment URLs** (§7) — pick one,
    redirect or canonical-tag the other two, fix `app/sitemap.ts`.
12. **Add a lightweight CI grep/lint check** for unscoped `getSupabase()`
    calls in `app/api/**` (§7) — a cheap net given ~110 manually-scoped
    call sites and no automated backstop today.

### Structural work (weeks, needs a migration path)

13. **Consolidate the 4 condition verticals** (§2) into
    `lib/conditions.ts` + shared `components/condition/*` + a page
    factory, following `chapter-page-factory.tsx`'s proven pattern.
    32 files → ~9. Migrate one vertical at a time with a
    rendered-output snapshot test per vertical before deleting the old
    files.
14. **Consolidate the 3 start funnels** (§2) into `lib/funnels.ts` +
    shared `components/funnel/*` + a factory, same recipe as (13).
    30 files → ~11.
15. **Decide the `next.config.mjs` `images.unoptimized: true` question**
    (§7) — likely the single biggest available performance win
    site-wide; needs investigation into why it was set (probably the
    plate-builder function-size workaround already documented in that
    file) before it can be safely scoped down rather than removed
    wholesale.
16. **Introduce a page-inventory-wide Playwright a11y smoke suite**
    (§7) — axe-core against ~20 representative pages covering each major
    pattern cluster (one condition vertical, one start funnel, one book
    chapter format, the homepage, the account dashboard, one assessment
    flow, etc.), run in CI. Lower priority than the fixes above but the
    right long-term backstop given the page count.
