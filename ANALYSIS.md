# EatoBiotics — Codebase Inventory

Read-only, factual inventory of the repository as it exists on branch
`claude/codebase-inventory-analysis-fweqir`. No code was changed to produce
this document. Line/file counts were taken via `find`/`grep` at the time of
writing and may drift as the codebase changes.

Stack per `CLAUDE.md`: Next.js 16 (App Router only, no `pages/`), Supabase
(Postgres + Auth), Stripe v20, Anthropic Claude SDK (+ OpenAI for the
plate-builder image/recipe feature only), Resend, Tailwind v4, TypeScript
strict.

---

## 0. Headline facts

- **236** `page.tsx` files under `app/`, **92** `route.ts` files under
  `app/api/`, **333** files under `components/` (47 top-level dirs/files).
- `app/newhome` **does not exist** anywhere in the repo (confirmed via
  `grep`/`find` across the whole tree and git history/branches). There is no
  evidence it ever existed.
- `app/cms` exists exactly as `{books, create, library, media, layout.tsx,
  page.tsx}` — a real, functional, admin-gated "Content Studio," not a stub.
- `supabase/migrations.sql` documents **41 migrations** (through
  `cms_chapter_mirror`/`cms_import_batch`, migration 41 explicitly marked
  "PROPOSED — DO NOT APPLY"). `CLAUDE.md`'s own schema section only documents
  roughly the first 24 migrations — the CMS subsystem (8 tables), Living Twin
  (`twin_state`, `profiles.sex`), `assessment_journeys`, `plate_recipes`,
  `monthly_gut_plans`, `meal_plans`, `food_protocols`, `monthly_reviews`,
  `email_optouts`, and `meal_scans` are all live in the migration file but
  **absent from CLAUDE.md's table list**. Treat `supabase/migrations.sql` as
  the source of truth over `CLAUDE.md` for schema.
- `components/account/dashboard-client.tsx` renders **10 tabs** (Today,
  Overview, Reports, Membership, My Plate, My Meals, Refer, EatoBiotic,
  Intelligence, Story) — `CLAUDE.md` describes it as "6-tab."
- `components/ui/` (shadcn/ui primitives) **does not exist**, despite a fully
  configured `components.json` (style `new-york`, alias `ui: "@/components/ui"`).
  Roughly 20 `@radix-ui/*` packages plus `cmdk`, `vaul`, `input-otp`,
  `react-day-picker`, `react-resizable-panels`, `class-variance-authority`,
  `recharts`, `date-fns` are all present in `package.json` with **zero**
  import sites anywhere in `app/`, `components/`, or `lib/`.
- `remotion/` is a fully separate standalone project (its own
  `package.json`/`tsconfig.json`) for generating video assets — not part of
  the Next.js build.
- 16 large PNGs plus a `Book - You/` directory sit at the repo root and are
  referenced by **nothing** in `app/`, `components/`, `lib/`, or `public/` —
  loose design/reference material, not served assets. `Food Images/` (38
  files) at root **is** partially wired in (2 of 38 files read directly off
  disk by `app/api/plate-builder/route.ts` at runtime, and the whole
  directory is explicitly re-included in `next.config.mjs`'s
  `outputFileTracingIncludes` after being excluded from serverless bundling).

---

## 1. Route Structure

### 1.1 Page routes (`app/**/page.tsx`) — 236 total

**Component type:** only 3 pages are client components at the top level
(`'use client'`): `app/account/consult/deep-dive/page.tsx`,
`app/auth/callback/page.tsx`, `app/preview-access/page.tsx`. The other 233
are server components; ~47 of those are thin wrappers that do an
auth/tier check server-side (`getUser()` → tier gate → `redirect(...)`) and
then delegate rendering to a co-located `*-client.tsx` component.

**Metadata:** 193 of 236 pages export `metadata`/`generateMetadata`. The 18
without one are almost all pure redirect stubs, CMS pages that inherit
`metadata` from `app/cms/layout.tsx`, the 3 client-component pages above, or
`/enter` (the pre-launch gate).

**`noindex`:** at least 12 pages explicitly literal-match
`robots: "noindex"` / `{ index: false }`, and a further group set
`{ index: false, follow: false/true }` — see §6 for the full list. In
practice every demo/preview/account-preview/admin/cms/export-format surface
is deindexed; every real marketing/assessment/report page is indexable.

#### Marketing / landing pages (~30)
`/`, `/about`, `/biotics`, `/digital-twin`, `/eatosystem`, `/food-systems`,
`/live` (noindex), `/method`, `/podcast` (748 lines, largest static page),
`/course`, `/roadmap`, `/waitlist`, `/weekly` (882 lines — largest page.tsx
in the repo), `/weekly-recipes`, `/today` (marketing concept page, distinct
from `/account/today`), `/you`, `/family` (marketing vertical landing,
distinct from `/account/family`), `/mind`, `/performance`, `/pregnancy`
(noindex, soft launch), `/books`, `/pricing`, `/privacy`, `/terms`,
`/share`, `/offline` (PWA fallback), `/enter` (waitlist landing shown behind
the password gate — comment says "keep these sections in sync with
app/page.tsx"), `/preview-access` (hidden founder/admin gate form, client
component), `/c/[country]` (dynamic, `generateStaticParams()` from
`LANDING_SLUGS`, `force-dynamic`), `/discover/[code]` (dynamic, referral
share page, `force-dynamic`).

**"Coming Soon" teaser pages (8, real copy, explicitly marked not-live):**
`/baby`, `/birth`, `/longevity`, `/recovery` (95–99 line "Life/Health System
· Coming Soon" teasers — structurally identical short template, 1 pattern ×
4 instances); `/app` (331 lines, contains a "The App — Coming Soon"
section), `/book`, `/book-family`, `/book-mind` (254–257 lines each, "Book
0N — Coming Soon"). `/glucose` and `/stability` contain the text "coming
soon" only as status labels on individual sub-vertical cards within
otherwise fully live pages — not stubs themselves.

#### Assessment system (~17 pages)
`/assessment` (foundation chooser), `/assessment/you`, `/assessment/family`
+ two SEO-variant duplicate URLs pointing at the *same* `FamilyAssessmentClient`
(`/assessment-family`, `/family-assessment`), `/assessment-mind`,
`/performance-assessment`, `/pregnancy/assessment` (noindex),
`/glucose/assessment` (noindex), `/stability/assessment` — all vertical
add-ons wrapped in `<FoundationGuard addon="...">`. Plus
`/assessment/add/[addon]` (dynamic, validated via `isAssessedKey`, noindex),
`/assessment/demo`, `/assessment/preview`, `/assessment/results` (13 lines),
`/assessment/deep` (140 lines, real Stripe-session-gated post-purchase
flow), `/assessment/report` (96 lines, real Stripe-session-gated report
render).

#### Mental-health-adjacent verticals — 1 pattern × 4 instances
`/adhd`, `/anxiety`, `/depression`, `/bipolar` — each **exactly 42 lines**,
identical composition: `Hero → Body → Science → Pathway → FoodSupport →
Foods → Cta → Disclaimer`, each from `components/<vertical>/*`. All export
full SEO metadata. Live, content-complete.

#### Gut / Glucose / Stability verticals
`/gut-brain` (5-line pure `redirect("/mind")`, retired URL), `/glucose` (576
lines), `/glucose/glp1` (361 lines), `/glucose/glp1/check` (38 lines),
`/stability` (580 lines — advertises "4 Systems," 3 of 4 [`Diversity™`,
`Recovery™`, `Longevity™`] marked `status: "Coming soon", live: false` in a
data array even though the page itself is complete), `/stability/assessment`,
`/stability/insights` (tier-gated), `/stability/report` (tier-gated),
`/stability/results` (22 lines, noindex), `/stability/tracker` (27 lines,
noindex).

#### Plate / food-system pages
`/food-system-bowl`, `/energy-plate`, `/living-plate`, `/build-plate` — 1
pattern × 4 instances, each a 19-line page rendering
`<PlatePage plate={PLATES[n]}>`. `/food-system-loop` (14 lines, noindex —
explicit "keep it out of the index for now" comment). `/myplate` (22 lines).
`/plate-builder` (16 lines). `/create-my-plate` (8-line redirect to
`/myplate` — comment: "had no inbound links anywhere in the app").
`/demo/create-my-plate` (121 lines, reuses the retired route's
`PlateCreatorClient`, noindex). `/food` (433 lines, directory index),
`/food/[slug]` (dynamic, `generateStaticParams`), `/food/for/[goal]`
(dynamic, `notFound()` guard), `/recipe/[slug]` (dynamic, Supabase-backed).

#### Account / dashboard area
Real, auth-gated pages (all follow `getUser()` → tier check →
`redirect(...)` → render `*Client` with server-fetched data — **not**
stubs despite each containing a `redirect(`):
`/account` (322 lines, largest account page — parallel Supabase queries
across assessments/analyses/weekly reports/monthly plan/Stripe billing
date/streak/paid reports, builds the Digital Twin), `/account/today`
(noindex), `/account/this-week` (noindex), `/account/twin` (noindex),
`/account/story` (tier-gated, not free/grow), `/account/settings`,
`/account/signin`, `/account/consult` (tier-gated `ai_consultation`),
`/account/consult/deep-dive` (client component, condition-selection UI —
IBS/SIBO/low-energy/poor-sleep/bloating/skin/mental-clarity/weight/IBD),
`/account/family`, `/account/glp1` (tier-gated), `/account/goals`
(tier-gated), `/account/intelligence` (tier-gated member/restore/transform),
`/account/meal-plan` (tier-gated), `/account/monthly-review` (tier-gated),
`/account/doctor-report` (tier-gated), `/account/report/[id]` (dynamic,
`notFound()` guard, noindex), `/account/report/demo` (noindex).

Public/mock-data "demo of the account" pages (no auth): `/account-you` (204
lines, hardcoded `MOCK_PLAN_CONTENT`, noindex — see §5 for orphan status),
`/account-you-live` (226 lines, "Account Dev Sandbox" per its own metadata,
noindex), `/account-you/[tier]` (7-line redirect to `/account-you`, legacy
tier URLs retired), `/demo/account` (8-line redirect to
`/demo/account/member`), `/demo/account/[tier]` (271 lines, real mock-data
dashboard, redirects any non-"member" tier param, noindex),
`/demo/account/consult` (72 lines, reuses real `ConsultClient` with sample
data, noindex), `/demo/account/twin` (49 lines, reuses real `TwinDashboard`,
noindex).

#### Admin (3 pages, all `ADMIN_COOKIE`-gated, all noindex)
`/admin` (dashboard + Supabase stats), `/admin/waitlist` (country
ranking/bucketed counts), `/admin/recipe-studio` (`RecipeStudioClient`).

#### CMS (8 pages + 1 layout, all admin-gated, all noindex)
`app/cms/layout.tsx` — second, defence-in-depth cookie auth gate wrapping
every child, shared `title: "Content Studio — EatoBiotics"`.
`app/cms/page.tsx` (dashboard; explicit comment that a "scheduling phase"
for publishing hasn't landed — Phase 1 only). `app/cms/create/page.tsx`
(22-line type picker, supports pre-fill via searchParams for a "create
extract from this chapter" flow). `app/cms/books/page.tsx` (list),
`app/cms/books/[id]/page.tsx` (detail + `BookChaptersPanel`).
`app/cms/library/page.tsx` (filterable content library),
`app/cms/library/[id]/page.tsx` (MDX editor, server-compiled preview +
version list + word count/reading time). `app/cms/media/page.tsx` (media
library), `app/cms/media/[id]/page.tsx` (asset detail, 5-min signed-URL
preview). None export their own `metadata` (inherited from the layout).

#### Book / chapters — the single largest repeating pattern (100 pages)
**25 `book-chapter-N` directories** (N=1–25), each with 4 structurally
identical pages:
```
app/book-chapter-N/page.tsx           4 lines  — generateChapterMetadata(N) + createChapterPage(N) factory
app/book-chapter-N/print/page.tsx    36 lines  — reads content/book/chapter-N.mdx, renders via PrintTemplate
app/book-chapter-N/reedsy/page.tsx   36 lines  — same MDX, renders via ReedsyTemplate
app/book-chapter-N/substack/page.tsx 36 lines  — same MDX, renders via SubstackTemplate
```
Each format sub-page sets `robots: { index: false }` (export-format
variants deliberately deindexed) and calls `notFound()` if the chapter or
its MDX file is missing. Verified identical shape across chapter 1 and
spot-checked others. Related: `/book`, `/book-family`, `/book-mind`
("Coming Soon," §1), `/books` (series index, live), `/book/print` (not
individually inspected), `/trilogy` (5-line redirect to `/books`).

#### Demo pages
`/demo` (212-line hub), `/demo/analyse` (reuses real `AnalyseClient`,
noindex), `/demo/assessment` (`DemoAssessmentClient`, noindex),
`/demo/create-my-plate`, `/demo/account*` (above). `/analyse` (138 lines,
real tier-aware meal-analysis page via `AnalyseGate`). `/analyse-demo` (101
lines, `GuestScanFlow`, noindex). `/analyse/result/[hash]` (dynamic,
`force-dynamic`, Supabase-backed shareable result, has its own
`opengraph-image.tsx`). `/report-you`, `/report-mind`, `/report-family`
(276 lines each — 1 pattern × 3 instances, `DemoReport` fed a large
hardcoded per-vertical data object; fully-written sample content, all
noindex). `/report` (413 lines, general report landing, distinct from the
three samples).

#### Misc / utility
`/login` (19 lines), `/auth/callback` (client component, 91 lines, handles
3 Supabase auth-return shapes: implicit hash tokens, PKCE `?code=`, email
OTP `?token_hash`), `/start`, `/start-family`, `/start-mind` (33–38 lines,
short funnel-entry pages), `/unsubscribe` (29 lines), `/eatobiotic` (31
lines, tier-aware voice flag, auth optional).

**Pure redirect/retired stubs (6, no real content):** `/gut-brain` (→
`/mind`), `/trilogy` (→ `/books`), `/create-my-plate` (→ `/myplate`),
`/reports` (→ `/pricing`, comment: "standalone €20/40/50 tiers were
retired"), `/demo/account` (→ `/demo/account/member`), `/account-you/[tier]`
(→ `/account-you`).

### 1.2 Root special files (`app/*.tsx`, `app/*.ts`)
`layout.tsx` (root layout — fonts, Nav, Footer, JsonLd/organization schema,
PWA register/install-prompt, i18n `LocaleProvider`, cookie consent, sonner
Toaster, PostHog provider+pageview, Statsig provider, Vercel Analytics),
`not-found.tsx` (client component, custom 404 using `foods` data),
`global-error.tsx` (client component, root error boundary reporting to
PostHog, ships its own `<html>/<body>`), `opengraph-image.tsx` (edge OG
image generator, 1200×630), `robots.ts`, `sitemap.ts` (builds from curated
static paths + `chapters` + `foods` + `FOOD_GOAL_SLUGS` + live
Supabase-queried published `plate_recipes`, hourly revalidate).

### 1.3 API routes (`app/api/**/route.ts`) — 92 total

Grouped by function (method + table/service detail in §3):

- **Auth** — `auth/callback`, `auth/send-magic-link` (bypasses shared
  helpers, instantiates `Resend`/`@supabase/supabase-js` directly),
  `auth/setup-profile`.
- **Checkout/Stripe/subscriptions** — `checkout`, `verify-payment`,
  `promo/generate`, `submit-lead`, `stripe/cancel-subscription`,
  `stripe/create-portal-session`, `stripe/create-subscription-checkout`,
  `stripe/webhook` (only fully-public POST in this group; Stripe-signature
  verified instead of user/cron auth; contains an explicit `TODO` about
  mapping `profile.id` to a Supabase user id for Statsig).
- **Assessments** — `assessment/journey`, `assessment/email-report`,
  `stability` + `stability/reminder`, `submit-deep-assessment`,
  `generate-deep-questions`, `save-deep-progress` (deliberately
  **unauthenticated** — relies on an unguessable Stripe session id + IP rate
  limit), `send-results-email`, `email-sample-report`, `guest-scan`.
- **Account data** — `account/delete`, `account/export`, `account/pdf-url`,
  `account/settings`, `profile/goals`, `household/members`, `journal`,
  `twin-state`, `plate/sync`, `glp1/log`, `glp1/profile`,
  `analyses/daily-count`, `analyses/log`, `analyses/patterns`.
- **AI features** — `consult`, `demo/consult` (hardcoded mock user "Sarah
  M."), `eatobiotic` (one of the few AI routes reachable anonymously),
  `eatobiotic/voice-token` (ElevenLabs), `analyse`, `analyse/stream` (SSE +
  extended thinking), `analyse-meal`, `analyse-plate` (public,
  unauthenticated), `menu-scan`, `create-plate` (imports **both** the shared
  `lib/anthropic` client and a second raw `@anthropic-ai/sdk` instance — see
  §5), `meal-plan/generate`, `monthly-plan/generate`,
  `monthly-review/generate` (hybrid auth: accepts `Bearer CRON_SECRET` via
  its **own inline check**, not the shared `verifyCronRequest` helper),
  `weekly-report/generate`, `report-chat`, `food-intelligence` (SSE,
  15k-token thinking budget), `gut-health-story` (SSE, 8k-token thinking),
  `food-system-story/update`, `doctor-report/generate`, `generate-report`
  (public, no DB write), `plate-builder` (+ `plate-builder/daily`, the only
  route calling **OpenAI** rather than Claude — dual admin-cookie-or-cron
  gated, uploads generated images to Supabase Storage, has 3 cascading
  insert-retry fallbacks to tolerate schema drift in `plate_recipes`).
- **Cron jobs** (all fail-closed via `lib/cron-auth.ts`'s
  `verifyCronRequest`, 503 without `CRON_SECRET`, except
  `monthly-review/generate` which inlines its own equivalent) —
  `weekly-checkin`, `weekly-nudge`, `email/trial-winback`,
  `email/week-inside`, `email/assessment-followup`, `email/nurture`,
  `email/paid-onboarding`, `email/sequence`, `glp1/reminder`,
  `stability/reminder`, `plate-builder/daily`, `plate-builder` (dual).
- **Admin** — `admin/login`, `admin/logout` (cookie-based, `ADMIN_PASSWORD`
  env, fail-closed). `plate-builder` also accepts the admin cookie as an
  alternate credential.
- **CMS** — all 13 routes under `cms/**` uniformly gated by
  `requireCmsAdmin` (`lib/cms/auth`): `cms/books`, `cms/books/[id]`,
  `cms/books/[id]/chapters`, `cms/books/[id]/chapters/reorder`,
  `cms/chapters/[id]`, `cms/content`, `cms/content/[id]`,
  `cms/content/[id]/media`, `cms/content/[id]/versions`, `cms/import/chapters`
  (SHA-256-diffed bulk import), `cms/media`, `cms/media/[id]`,
  `cms/media/upload-url` (two-step signed direct-to-storage upload flow).
- **Waitlist/referral** — `waitlist`, `waitlist/status` (mints Stripe
  founding-member coupons on referral threshold), `waitlist/count`,
  `waitlist/leaderboard`. All public, all IP rate-limited.
- **Email** — `email-sample-report`, `send-results-email`,
  `assessment/email-report`, `social/submit` ("email is the queue" — no DB
  write, just an internal notification email to `OWNER_EMAIL`),
  `unsubscribe` (public one-click RFC 8058, reachable even behind the
  site-wide password gate via an explicit `proxy.ts` carve-out), plus the
  cron-only `email/*` sequence routes above.
- **OG-image generation** — **not** under `app/api/`; these are Next.js
  file-convention `opengraph-image.tsx` files colocated with pages:
  `app/opengraph-image.tsx`, `app/food/[slug]/opengraph-image.tsx`,
  `app/analyse/result/[hash]/opengraph-image.tsx`,
  `app/discover/[code]/opengraph-image.tsx`, `app/waitlist/opengraph-image.tsx`,
  `app/roadmap/opengraph-image.tsx`, `app/today/opengraph-image.tsx`,
  `app/course/opengraph-image.tsx`.
- **Misc/utility** — `health` (deliberately doesn't disclose which secrets
  are configured — anti-enumeration design), `enter` (site-wide dev/staging
  password gate — **not** related to the waitlist despite the name),
  `contribute` (**stub** — its own comment says "Log for now"; only
  `console.log`s the payload, no persistence), `report-pdf` (renders a
  client-supplied `DemoReportData` to PDF, no persistence), `community-stats`
  (public homepage social proof, 1h revalidate), `twin-state`.

Flagged oddities (full detail in the sub-agent transcript, summarized): 3
routes (`analyse-meal`, `weekly-report/generate`, `consult`) contain inline
SQL "add this column" comments rather than tracked migrations, suggesting
some schema changes were applied ad hoc via the Supabase SQL editor outside
`supabase/migrations.sql`.

---

## 2. Component Inventory

333 files across 47 top-level `components/` entries (13 loose files + 34
subdirectories). **`components/ui/` does not exist** (see §0/§7).

### Genuinely shared (imported from multiple unrelated feature areas)
| Component | Importers | Notes |
|---|---|---|
| `scroll-reveal.tsx` | 147 | Generic scroll-triggered animation wrapper, used nearly everywhere |
| `gradient-text.tsx` | 23 | Used across home + verticals + marketing |
| `assessment/score-ring.tsx` | 17 | True cross-vertical primitive despite living under `assessment/` — used by mind/family/stability/pregnancy/glucose/performance assessments, digital-twin, account/twin, home, waitlist |
| `hero-video.tsx` | 5 | `/enter`, `/digital-twin`, twin-stage, twin-hero, home/hero |
| `i18n/*` | 7 | account/family, 5 waitlist files, root layout |
| `json-ld.tsx` | 3 | root layout, `/book`, chapter-page-factory |
| `share-bar.tsx` | 2 | `/food/[slug]`, `/today` |
| `analytics/track-conversion.tsx` | 2 | |

**Global-but-single-mount** (imported once, from `app/layout.tsx`, but live
on every page transitively): `footer.tsx`, `nav.tsx`, `cookie-consent.tsx`,
`pwa-install-prompt.tsx`, `pwa-register.tsx`.

**True one-offs**: `reading-progress.tsx` (`/biotics` only),
`eatosystem/county-tags.tsx` (`/eatosystem` only),
`podcast/audio-waveform.tsx` (`/podcast` only), `twin-motion/*`
(`/digital-twin` only), `agent-loop/*` (3 importers, one feature),
`digital-twin/*` (7 importers, scoped to `/digital-twin` + `account/twin`),
the per-vertical `Framework`/`ScoreShowcase`/`Hero` trio (each exactly 1
importer — see below), `report/*` (`demo-report.tsx`/`report-pdf.tsx`
shared by `/report-family`, `/report-mind`, `/report-you`,
`app/api/report-pdf`), `plates/plate-page.tsx` (shared by 4 named plate
routes — the one case where a "duplicated" pattern is actually a single
reused component templated by prop, not copy-pasted).

### Duplicated parallel structures across verticals

**(a) Mental-health condition pages** — `adhd/`, `anxiety/`, `depression/`,
`bipolar/` each contain the **exact same 8 file names**
(`<vertical>-hero/body/science/pathway/food-support/foods/cta/disclaimer.tsx`).
4 verticals × 8 files = 32 files, one template.

**(b) Marketing funnel pages** — `start/`, `start-family/`, `start-mind/`
each contain the **exact same 10 file names**
(hero/problem/pressure/solution/how/trust/value/final/score-mock/sticky-cta).
3 funnels × 10 files = 30 files, one template.

**(c) Assessment intro/client/results triples** — `mind-assessment/`,
`family-assessment/`, and the base `assessment/` each have a
client/intro/results shell (3 files), but `assessment/` additionally carries
27 more files (score-card, score-ring, pillar-radar, report-*, payment-cta,
addon-gate, etc.) that `mind-assessment/`/`family-assessment/` reuse rather
than duplicate — so only the outer shell is triplicated, not the deeper
scoring/report machinery. `pregnancy/` and `stability/` implement the same
conceptual shell but use PascalCase filenames (inconsistent with the
kebab-case convention used everywhere else).

**(d) Framework/ScoreShowcase/Hero trio per vertical** — `mind/`
(MindFramework/MindScoreShowcase/MindHero), `family/`
(FamilyFramework/FamilyScoreShowcase/family-hero), `you/`
(YouFramework/YouScoreShowcase/you-hero), `eatobetics/`
(EbFramework/EbScoreShowcase + `home/hero`), `stability/`
(StabilityFramework/StabilityScoreShowcase/StabilityHero). 5 verticals, same
trio, inconsistent PascalCase-vs-kebab-case naming.

**(e) Book publishing formats** — `book/chapter/` (13 files, richest —
callout/food-card/key-takeaways/pull-quote/stat/template/image-placeholder
+ nav/factory/cheat-sheet), `book/reedsy/` (9 files) and `book/substack/`
(10 files) are near 1:1 duplicates of the same 9-file set for two export
targets (substack adds one extra `copy-button.tsx`), `book/print/` (4
files, its own template naming).

### `home/` components — mostly unused outside the homepage
Of 18 files in `components/home/`, only 9 are actually mounted by
`app/page.tsx` (`hero`, `powers-everything`, `the-framework`,
`how-it-works`, `digital-twin-section`, `score-preview`, `ecosystem`,
`membership-teaser`, `closing-cta`). The other 9 —
`app-showcase.tsx`, `book-showcase.tsx`, `eatosystem-teaser.tsx`,
`founder-teaser.tsx`, `go-deeper.tsx`, `latest-from-substack.tsx`,
`manifesto.tsx`, `newsletter-cta.tsx`, `podcast-teaser.tsx`,
`try-a-meal-teaser.tsx`, `what-were-building.tsx` — have **zero import
sites** anywhere in the repo (verified via grep for both the file path and
component name). `eatosystem-teaser.tsx` is referenced only in a *code
comment* inside `components/hero-video.tsx` ("Same pattern as
components/home/eatosystem-teaser"), not an import. The pages that might be
expected to use these (`/about`, `/eatosystem`, `/book`, `/podcast`) each
have their own bespoke, independently-written content instead. See §5.

### shadcn/ui
`components.json` configures a shadcn/ui scaffold (`style: "new-york"`,
alias `ui → @/components/ui`), but `components/ui/` does not exist in the
repo. No `@radix-ui/*` import, no `class-variance-authority` import
anywhere in `app/`, `components/`, or `lib/` — see §7.

### Orphaned components (confirmed, not just low-usage)
- `components/theme-provider.tsx` — zero references anywhere else in the
  repo, not wired into `app/layout.tsx`.
- `components/substack-card.tsx` — zero references.
- `components/gut-brain/gut-brain-hero.tsx` and
  `components/gut-brain/mind-hero.tsx` — zero import references; the only
  route that could plausibly use them, `/gut-brain`, is a pure
  `redirect("/mind")` stub that imports only `next/navigation`. The entire
  `components/gut-brain/` directory (2 files) is dead code.

No files use `-old`/`-v2`/`-backup`/`-deprecated` naming conventions.

---

## 3. Data Flow

### 3.1 Supabase client entry points
| File | Client | Key | Usage |
|---|---|---|---|
| `lib/supabase.ts` (`getSupabase()`) | `createClient` | `SUPABASE_SERVICE_ROLE_KEY` | **109 files** — the dominant client, bypasses RLS, returns `null` if env vars missing (every caller must null-check) |
| `lib/supabase-server.ts` (`getSupabaseServer()`/`getUser()`) | `createServerClient` (SSR) | anon key + cookies | Direct use in 3 files; `getUser()` (built on it) used in ~40 API routes purely for identity |
| `lib/supabase-browser.ts` (`getSupabaseBrowser()`) | `createBrowserClient` | anon key | 10 client-component files |

**Dominant pattern**: a server component calls `getUser()` (SSR client) only
to establish identity, then calls `getSupabase()` (service-role, no RLS) for
the actual reads, manually scoping every query with `.eq("user_id", ...)`
or `ownerOrFilter()` (from `lib/supabase-filters.ts`, which also exports
`pgQuote()` to prevent PostgREST filter-string injection). **RLS is not the
primary access-control mechanism in server-side code** — application-level
filtering with the service-role key is, for everything except Realtime
subscriptions (which do go through the anon/browser client and are the one
place code comments explicitly invoke RLS as the enforcement layer — see
`components/account/twin/use-twin-realtime.ts`).

No sampled client component (`dashboard-client.tsx`, `live-dashboard.tsx`,
`settings-client.tsx`, `use-twin-realtime.ts`, `account-nav-item.tsx`,
`journal-tracker.tsx`, `cms/media/media-client.tsx`,
`statsig-provider.tsx`) performs a direct `.from(<table>).select(...)` read.
Browser-client usage is limited to `auth.*` (sign-out, get user, state
change), Storage uploads, and Realtime channel subscriptions. All
client-rendered table data flows through server components (initial load)
or `fetch()` calls to internal API routes (subsequent updates).

### 3.2 Tables referenced in code (`.from(...)`)
34 distinct table names found via grep across `app/`, `lib/`, `components/`.
All 17 tables named in `CLAUDE.md` are confirmed present in code. The
following are used in code but **not listed in `CLAUDE.md`'s schema
section** (all exist in `supabase/migrations.sql`):
`cms_content`, `cms_chapters`, `cms_media`, `cms_books`,
`cms_content_media`, `cms_content_versions`, `cms_chapter_mirror`,
`cms_audit_log` (the 8-table CMS subsystem), plus `plate_recipes`,
`monthly_gut_plans`, `meal_scans`, `twin_state`, `monthly_reviews`,
`food_intelligence_reports`, `email_optouts`, `meal_plans`.

Highest-traffic tables by call-site count: `leads` (68), `profiles` (61),
`analyses` (44), `cms_content` (23), `weekly_checkins` (17),
`deep_assessments` (15), `stability_assessments` (12), `cms_chapters` (13),
`consultations` (11). `.from("cms-media")` in
`app/cms/media/media-client.tsx` is a **Storage bucket** call, not a table.

### 3.3 Server-side vs client-side fetching
**Server-side** (server component reads DB directly via `getSupabase()`,
props passed to a client presentational component): all of
`app/account/**/page.tsx`, `app/analyse/page.tsx`, `app/admin/**/page.tsx`,
`app/cms/**/page.tsx`, `app/discover/[code]/page.tsx`,
`app/recipe/[slug]/page.tsx`, `app/c/[country]/page.tsx`, `app/sitemap.ts`.

**Client-side**: no client component queries Postgres directly; all persist
through `fetch()` to `app/api/**/route.ts` (which use the service-role
client server-side), except auth (`getSupabaseBrowser().auth.*`), Storage
uploads (`cms/media/media-client.tsx`), and one Realtime subscription
(`use-twin-realtime.ts`, filtered `user_id=eq.<id>` on the `analyses`
table).

### 3.4 localStorage-first / offline-first patterns
| File | Behavior |
|---|---|
| `lib/stability/storage.ts` | Confirmed offline-first: localStorage keys `eb_stability_assessment_v1`/`eb_stability_logs_v1` are the synchronous source of truth. An `authed` module flag (set after a 200 from `GET /api/stability`) gates a fire-and-forget `POST /api/stability` background sync. `hydrateFromServer()` merges server data by `updatedAt` (last-write-wins) on mount. Logged-out users never trigger authenticated writes. |
| `lib/local-storage.ts` | localStorage-only, **no server sync**: `PlateState`, `PlantTrackerState` (auto-resets weekly), `JournalEntry[]` (365-cap, distinct from the DB-backed `journal_entries` table used by `/api/journal`), `SavedMealAnalysis[]` (20-cap). |
| `lib/assessment-storage.ts` | localStorage-only, **no server sync**: assessment wizard state, privacy opt-in flag, lead capture (name/email/ageBracket). |
| `lib/waitlist-referral.ts` | Not a storage module — stateless scoring functions only (`waitlistPosition()`). |
| `lib/paid-report-session.ts` | Not a storage module — base64 JSON encode/decode for Stripe `metadata.result_summary` (with `client_reference_id` as a legacy fallback), no localStorage/DB access. |

Only the Stability module implements the localStorage-first-with-sync
pattern `CLAUDE.md` describes; the plate/journal/assessment-wizard storage
modules are localStorage-only with no server counterpart at all (except
journal, which has a *separate* DB-backed path via the API route that the
localStorage cache doesn't talk to).

### 3.5 RLS-relevant patterns observed (code only, DB policies not inspected)
~110 call sites manually scope service-role queries with
`.eq("user_id"/"owner_id", ...)`. CMS/admin routes rely on route-level
admin-auth checks (`lib/admin-auth.ts`, `lib/admin-auth-edge.ts`), not
row-level filters. Cron/webhook routes (`glp1/reminder`, `weekly-nudge`,
`stability/reminder`, `email/*`, `stripe/webhook`) iterate across all rows
with no `getUser()` call, gated instead by `lib/cron-auth.ts` or Stripe
signature verification. `account/delete` and `account/export` (GDPR-style)
touch 7 tables each, scoped by user id, mediated entirely through the
service-role client rather than cascading RLS deletes.

---

## 4. Homepage (`/`) and `/newhome` — section-by-section

**`/newhome` does not exist** — confirmed absent from the filesystem, `git
log --all`, and `git branch -a`. No further mapping possible for it.

### `app/page.tsx` (the actual homepage)
71 lines. Server component. Wrapped in `requirePreviewAccess()` — if the
site-wide dev/staging password gate is enabled (`isPasswordGateEnabled()`)
and the request lacks a valid `DEV_COOKIE` token, it redirects to
`/enter?from=%2F` before rendering anything.

Full `metadata` export: title "EatoBiotics — The Food System Inside You",
description, OpenGraph (title/description/url), Twitter card
(`summary_large_image`), and an explicit `keywords` array (gut health,
microbiome, prebiotic/probiotic/postbiotic, food system, gut health score,
weekly gut report, AI meal analysis, digestive health, gut bacteria,
biotics).

Section order, each imported from `components/home/*` and separated by a
local `SoftDivider()` helper (a hairline gradient divider defined inline in
`page.tsx`, not its own component file):

1. **`<Hero />`** (`components/home/hero.tsx`, wrapped in `<Suspense
   fallback={null}>`)
2. `SoftDivider`
3. **`<PowersEverything />`** (`components/home/powers-everything.tsx`)
4. **`<HowItWorks />`** (`components/home/how-it-works.tsx`)
5. **`<DigitalTwinSection />`** (`components/home/digital-twin-section.tsx`)
6. **`<TheFramework />`** (`components/home/the-framework.tsx`)
7. **`<ScorePreview />`** (`components/home/score-preview.tsx`)
8. `SoftDivider`
9. **`<Ecosystem />`** (`components/home/ecosystem.tsx`)
10. `SoftDivider`
11. **`<MembershipTeaser />`** (`components/home/membership-teaser.tsx`)
12. **`<ClosingCta />`** (`components/home/closing-cta.tsx`)

Note the import statements for `PowersEverything`, `TheFramework`,
`HowItWorks`, `DigitalTwinSection`, `ScorePreview`, `Ecosystem`,
`MembershipTeaser`, `ClosingCta` are placed *after* the `metadata` export
(line 29 onward) rather than grouped at the top of the file with `Hero` and
the dev-gate imports — a file-organization quirk, not a functional issue.

Of the 18 files in `components/home/`, the 9 **not** referenced above
(`app-showcase`, `book-showcase`, `eatosystem-teaser`, `founder-teaser`,
`go-deeper`, `latest-from-substack`, `manifesto`, `newsletter-cta`,
`podcast-teaser`, `try-a-meal-teaser`, `what-were-building`) are unused
anywhere in the app (see §2, §5).

The global chrome around the homepage (and every other page) is set in
`app/layout.tsx`: local `DM Sans` + `Lora` fonts, root `metadata`
(`metadataBase: https://eatobiotics.com`, title template `%s | EatoBiotics`,
icons, manifest, `appleWebApp`), `viewport` (`themeColor: #56C135`), and a
fixed component order: `PHProvider` → `StatsigClientProvider` → `body` →
`PostHogPageview` (in `Suspense`) → `JsonLd`
(`generateOrganizationSchema()`) → `Nav` → `LocaleProvider` → `main` →
`Footer` → `Analytics` (Vercel) → `Toaster` (sonner) → `PwaRegister` →
`PwaInstallPrompt` → `CookieConsent`.

---

## 5. Dead Code, Unused Components, Orphaned Files

### High confidence — no importers found anywhere in the repo
- `lib/admin-auth-edge.ts` (`adminCookieTokenEdge`, `verifyAdminCookieEdge`)
  — referenced only from its own test (`tests/unit/cms-auth.test.ts`, via a
  dynamic `await import(...)`). No `app/`, `components/`, or middleware file
  imports it. There is no `middleware.ts` at the repo root — routing/edge
  concerns live in `proxy.ts` instead (see §6), and `proxy.ts` does **not**
  import this file (it imports `verifyAdminCookieEdge` from
  `lib/admin-auth-edge` — correction: `proxy.ts` line 4 *does* import
  `verifyAdminCookieEdge` from this file for the `/cms` default-deny check,
  so this file is **not** orphaned; the sub-agent's grep missed the
  `proxy.ts` import path. Retracting this item — see note below.)
- `components/theme-provider.tsx` — zero references anywhere else in the
  repo; not wired into `app/layout.tsx` or any page.
- `components/substack-card.tsx` — zero references anywhere else.
- `components/gut-brain/gut-brain-hero.tsx` and
  `components/gut-brain/mind-hero.tsx` — zero import references. The only
  route that could use them, `/gut-brain/page.tsx`, is a pure
  `redirect("/mind")` importing only `next/navigation`. All other
  repo-wide matches for the string "gut-brain" are copy text or `/gut-brain`
  route links, not imports of these component files. **The entire
  `components/gut-brain/` directory (2 files) is dead code.**
- 9 of 18 `components/home/*.tsx` files (see §2/§4 for the list) — zero
  import sites; the pages that could plausibly use them each have
  independent bespoke content instead.

> **Correction note**: the initial sub-agent pass flagged
> `lib/admin-auth-edge.ts` as orphaned based on a grep that didn't
> canonicalize the import path; a direct check of `proxy.ts` shows
> `import { verifyAdminCookieEdge } from "@/lib/admin-auth-edge"` guarding
> `/cms` and `/api/cms` at the edge. **This file is in active use, not
> dead code.**

### Root-level loose assets (not orphaned code, but not served/referenced by the app)
- 16 PNGs at repo root (`ChatGPT Image Mar 6, 2026...png`, `EatoBiotic
  Hero.png`, 3× `EatoBiotics - The Food System Inside Your {You,Family,Mind}
  - Book Cover.png`, 5× `EatoBiotics App Concept - Overview[.v2-v5].png`,
  `EatoBiotics Family.png`, `Inside Your Mind.png`, `The Food System
  Bowl.png`, `The Immunity, Mood and Energy Plate.png`, `The Living
  Plate.png`, `The Rebuild Plate.png`) — zero references in `app/`,
  `components/`, `lib/`, or `public/`. Similar-sounding *text strings* do
  appear in code as plate/page copy (e.g. "The Food System Bowl" as a
  recipe name), but none of it points at these specific files. The app's
  real served images live under `public/images/...` and
  `public/plate-builder/`, a separate tree.
- `Book - You/` directory (a chapter-1 PDF + PNGs) — no references
  anywhere; the live book-chapter images are served from
  `public/images/book/ch1..ch25` instead.
- `eatobiotics-design-system/` — a standalone design-reference package
  (own README, `SKILL.md`, HTML style guide) with zero references from
  `app/`, `components/`, or `lib/`.
- `Food Images/` (38 files) — **partially used**: exactly 2 files
  (`Food 8.0.png`, `Food 9.0.png`) are read off disk at runtime by
  `app/api/plate-builder/route.ts` as AI style-reference images, and the
  directory is explicitly carved back into the serverless function bundle
  via `next.config.mjs`'s `outputFileTracingIncludes` (after being globally
  excluded via `outputFileTracingExcludes` to keep other functions lean).
  The other 36 files in the directory appear unused.

### Confirmed NOT dead (deliberate design, despite looking suspicious)
- Comments mentioning "legacy" (~35 occurrences) are all live
  backward-compatibility shims for old data shapes (`lib/membership.ts`
  legacy tier names, `lib/assessment-scoring.ts` legacy score normalizer,
  legacy localStorage/sub-score keys, legacy Stripe `client_reference_id`
  fallback) — not dead code.
- `app/account-you/[tier]/page.tsx` and `app/demo/account/page.tsx` are
  intentional redirect stubs for retired tier-specific URLs, working as
  designed.
- A comment in `components/systems/system-foundation.tsx` references an old
  `system-landing.tsx` that no longer exists anywhere — confirms the file
  was fully removed; only the comment trail remains (harmless).
- No `.bak`, `_old`, `-v2`, `TODO: remove`, `FIXME`, or `DEAD CODE` markers
  found anywhere in the repo.

### Duplicate/near-duplicate page clusters (evaluated, mostly genuine verticals)
- **`account-you` vs `account-you-live` vs `you`**: not duplicates.
  `/you` is the public marketing landing page. `/account-you` is an older
  mock/demo dashboard (static `DashboardClient`, no internal links pointing
  to it anywhere except `robots.ts`). `/account-you-live` is a newer
  live-data-shaped demo (`LiveDashboard` + `buildAccountTwin`) that **is**
  linked from `app/account/report/[id]/report-client.tsx`'s demo mode.
  Moderate confidence `/account-you` is a superseded demo kept alive only
  as a directly-linkable URL.
- **`report` vs `report-you`/`report-family`/`report-mind`**: one general
  marketing hub + three noindex per-vertical sample reports sharing the
  same `DemoReport` component — genuinely different roles.
- **`start` vs `start-family` vs `start-mind`**: three distinct funnels
  with fully separate (structurally parallel) component sets — not drafts
  of one another.
- **`assessment` vs `assessment-mind` vs `assessment-family`**: `assessment`
  is the foundation chooser; the other two are real vertical-specific flows
  — not duplicates.
- **`assessment/family` vs `assessment-family` vs `family-assessment`**:
  genuinely three separate URLs rendering the *same*
  `FamilyAssessmentClient` component with different metadata/copy — this
  one **is** apparent SEO-surface duplication (3 URLs, 1 underlying flow),
  distinct from the other clusters above which are legitimately different
  features.

### Tests
55 files under `tests/unit/*.test.ts` (Vitest). Every test file's import
targets were checked and all currently exist — no test orphaned by deleted
source. `tests/unit/cms-auth.test.ts` is the direct-import test coverage
for `lib/admin-auth-edge.ts` (which is also used in production, see
correction above).

---

## 6. SEO / Meta Setup

### Global
- `app/layout.tsx` root `metadata`: `metadataBase`, title template `%s |
  EatoBiotics`, default description, icons (`favicon.webp`,
  `apple-icon.png`), OpenGraph (`siteName`, `type: website`, `locale:
  en_IE`), Twitter (`summary_large_image`, `@eatobiotics`), `manifest.json`,
  `appleWebApp`. `viewport`: `themeColor #56C135`.
- `app/robots.ts`: allows `/` by default; disallows `/api/`, `/account`,
  `/account-you`, `/account-you-live`, `/admin`, `/auth/`, `/enter`,
  `/preview-access`, `/demo`, `/analyse-demo`, `/login`. Points to
  `/sitemap.xml`.
- `app/sitemap.ts`: revalidates hourly; combines a curated `STATIC_PATHS`
  list (26 marketing/product routes with hand-set priority/changeFrequency)
  with programmatic entries for every `foods` slug, every `FOOD_GOAL_SLUGS`
  goal page, every **published** book chapter (`chapters.filter(c =>
  c.status === "published")`), and every published `plate_recipes` row
  (queried live from Supabase, wrapped in try/catch so a DB outage degrades
  to a still-valid sitemap rather than failing the build).
- `app/opengraph-image.tsx`: edge-runtime dynamic OG image (1200×630) at the
  root; several individual pages layer their own colocated
  `opengraph-image.tsx` on top (see §1.3).
- `components/json-ld.tsx` + `lib/structured-data.ts`: organization schema
  on every page (root layout), plus book schema + breadcrumb schema on
  `/book`, and chapter-level schema via `chapter-page-factory.tsx`.

### `noindex` — pages that explicitly set `robots: { index: false, ... }` or `"noindex"`
`/live`, `/account/report/[id]`, `/account/report/demo`,
`/account/this-week`, `/account/twin`, `/demo/account/[tier]`,
`/demo/account/consult`, `/demo/account/twin`, `/demo/analyse`,
`/demo/assessment`, `/demo` (root), `/account-you-live`, `/account-you`,
`/admin`, `/admin/waitlist`, `/admin/recipe-studio`, every `app/cms/*` page
(via the shared layout), `/pregnancy/assessment`, `/glucose/assessment`,
`/stability/results`, `/stability/tracker`, `/food-system-loop`,
`/assessment/add/[addon]`, `/report-you`, `/report-mind`, `/report-family`,
`/account/today`, `/analyse-demo`, all 100 book-chapter `/print`,
`/reedsy`, `/substack` sub-pages (export-format variants deliberately
deindexed while the canonical `book-chapter-N` page is indexed).

### Pages with no `metadata` export at all (18)
Mostly pure redirect stubs (`/reports`, `/trilogy`, `/gut-brain`,
`/create-my-plate`, `/demo/account`, `/account-you/[tier]`), CMS pages that
inherit the layout's metadata, the 3 top-level client-component pages
(`auth/callback`, `preview-access`, `account/consult/deep-dive`), and
`/enter` (the pre-launch gate page).

---

## 7. Dependencies

### package.json — confirmed present but **zero import sites** in `app/`, `components/`, or `lib/`
- All ~20 `@radix-ui/react-*` packages (accordion, alert-dialog,
  aspect-ratio, avatar, checkbox, collapsible, context-menu, dialog,
  dropdown-menu, hover-card, label, menubar, navigation-menu, popover,
  progress, radio-group, scroll-area, select, separator, slider, switch,
  tabs, toast, toggle, toggle-group, tooltip)
- `class-variance-authority`, `cmdk`, `vaul`, `input-otp`,
  `react-day-picker`, `react-resizable-panels`, `recharts`, `date-fns`
- `@statsig/js-client` (note: `@statsig/react-bindings` and `statsig-node`
  **are** used — only the plain `js-client` package is unreferenced)
- `@vercel/analytics` shows 0 hits under a plain grep for the package
  specifier but **is** actually used — `app/layout.tsx` imports
  `Analytics` from `@vercel/analytics/next` (a subpath import the naive
  grep missed). Not dead.
- `@sentry/nextjs` shows 0 hits under `app/`/`components/`/`lib/` by
  design — it's wired up in `next.config.mjs`, `instrumentation.ts`,
  `instrumentation-client.ts`, `sentry.server.config.ts`,
  `sentry.edge.config.ts` instead (root-level config files, outside the
  scanned dirs). Not dead.

This strongly indicates the project was scaffolded with the standard
Next.js/shadcn starter template (which bundles all of the above), and while
`components.json` still declares the shadcn config, no actual `components/ui`
primitives were ever generated (or they were deleted) — leaving their
supporting npm dependencies in `package.json` unused by the app code that
was actually built.

### Confirmed in active use
`@11labs/react` (1 file), `@react-pdf/renderer` (4 files, PDF report
generation), `@remotion/player` + `remotion` (1 file each — the in-app
video player component, separate from the standalone `remotion/`
sub-project), `embla-carousel-react` + `embla-carousel-autoplay` (1 file,
`components/app/iphone-carousel.tsx`), `next-themes` (1 file), `sonner` (1
file, the layout's Toaster), `@statsig/react-bindings` (3 files),
`statsig-node` (1 file), `posthog-js` (18 files) — the actively-used
dependency surface is much smaller than the full `dependencies` list.

### Not independently verified as outdated
No `npm outdated`/registry check was run (no network audit performed as
part of this read-only inventory); versions in `package.json` were only
cross-referenced against what's imported, not against latest-available
releases. `next@16.0.10`, `react@19.2.0`, `react-dom@19.2.0`,
`typescript@^5` are current-generation majors as declared.

### Standalone sub-project
`remotion/` has its own `package.json` (`@remotion/cli`,
`@remotion/tailwind-v4`, `remotion`, `tailwindcss@4.0.0`, its own
`react`/`react-dom` pins at `19.2.3` vs the root's `19.2.0`) — it is not a
workspace of the root `package.json` (no `workspaces` field present) and is
built/run independently for generating video assets consumed as static
files.

---

## 8. Other structural notes

- **`proxy.ts`** (root) is the actual edge middleware-equivalent (Next.js
  16 renamed convention) — no `middleware.ts` file exists. It, in order:
  (1) default-denies `/cms` and `/api/cms` at the edge unless
  `verifyAdminCookieEdge` passes (404, not redirect, so the routes "don't
  exist" without admin auth); (2) rewrites bare country slugs (`/ie`,
  `/uk`, …) to `/c/<slug>`; (3) enforces the site-wide `DEV_PASSWORD` gate
  with an explicit allowlist of routes reachable while it's on
  (`/enter`, `/waitlist`, `/preview-access`, `/privacy`, `/terms`,
  `/unsubscribe`, `/discover/*`, `/c/*`, `/api/enter`, `/api/waitlist`,
  `/auth/callback`, `/api/auth/*`); (4) establishes the Supabase SSR
  session and redirects unauthenticated users away from protected
  `/account/*` routes (with `/account/signin`, `/account-you`,
  `/account-you-live` explicitly public); (5) seeds a best-effort
  `eb_country`/locale cookie pair from the Vercel geo header.
- **Cron schedule** (`vercel.json`, 7 jobs): `weekly-checkin` (Mon 08:00
  UTC), `email/week-inside` (Mon 09:00), `glp1/reminder` (daily 18:00),
  `stability/reminder` (daily 09:00), `email/sequence` (daily 09:00),
  `email/trial-winback` (daily 10:00), `email/paid-onboarding` (daily
  11:00). All fail-closed (503) without `CRON_SECRET` per `GO-LIVE.md`.
- **`supabase/migrations.sql`** contains 41 migrations; migration 41
  (`cms_chapter_mirror` + `cms_import_batch`, an MDX↔CMS mirror/rollback
  system) is explicitly commented "PROPOSED — DO NOT APPLY until the
  25-chapter import is explicitly approved" — i.e. present in the
  migrations file but **not yet a live schema change**.
- Pre-existing root docs that overlap with/pre-date this inventory:
  `GO-LIVE.md` (go-live checklist, migrations 17–36, env vars, cron table,
  smoke test), `LAUNCH_CHECKLIST.md` (shorter MVP flow checklist, still
  references the now-superseded literal fallback password `"Monkstown"`),
  `OPERATIONAL_AUDIT.md` (a full incident writeup of the password-gate bug
  that was blocking the entire assessment→payment→report→magic-link→account
  flow, with root cause and fixes), `MONITORING.md`, `TESTING.md`,
  `AGENT_LOOP_ARCHITECTURE.md`, and `docs/` (masterplan/constitution docs,
  CMS chapter-import spec, food-system-experience design docs).
