# REVIEW.md — audit log

`CLAUDE.md` refers to this file five times as the place audits and their
follow-ups live. It did not exist — not in the working tree and not anywhere in
git history. This file starts it. Entries are newest first.

---

## 2026-07-29 — Phase 0 correctness pass (branch `claude/eatobiotics-review-fpqu6q`)

Triggered by an external review of the whole product. Its findings were checked
against the codebase before anything was changed; the corrections to that review
are recorded below, because two of its stated blockers were not real.

### Scope taken

Correctness, accuracy and honesty only. No homepage restructure, because four
PRs were already competing for that surface (#176 rebrand, #177 `/newhome`,
#178 `/newdemo`, #125 concept). PR #176 owns the Feed / Seed / Regenerate
rename and correctly keeps `heal` as the persisted key; this branch stays out
of its way and fixes what it explicitly left out of scope.

### What changed

1. **Postbiotic language.** Postbiotics are outputs of bacterial fermentation,
   not ingredients. `/biotics` and chapter 3 of the book said so; roughly 35
   other surfaces contradicted them, including the public chat agent, which
   told visitors that olive oil, dark chocolate and berries *are* postbiotics.
   All prose corrected. `lib/biotics-prompt.ts` added as the single source for
   the three-biotics text the AI routes paste into prompts — it had been
   hand-written in eight blocks across seven routes, twice in one file, which
   is how it drifted. Data keys (`BioticType`, `postbiotic_score`,
   `postbiotics`/`heal` sub-scores) untouched.

   Three cross-file classification disagreements resolved with `lib/foods.ts`
   as the classifier of record: sourdough and aged cheese are probiotic, olive
   oil is prebiotic. Meals with aged cheese now score through the probiotic
   bucket rather than the postbiotic one.

2. **The score share card, broken three ways.** The share link pointed at
   `/score`, a route that has never existed and has no rewrite, so every score
   anyone shared led to a 404. The card image was requested with one set of
   parameter names and read with another, so every card rendered 0 / 0 / 0.
   And underneath both, the route returned 500 because Satori requires an
   explicit `display` on any div with more than one child — so the image had
   never rendered at all. All three fixed; the route now accepts either
   parameter spelling so cards already shared keep working.

3. **Honest labels.** `/pregnancy` announced "Life System · Live" while
   `lib/systems.ts` had it as `scaffold`, the page was noindexed, and the
   homepage card said "Coming soon". Eyebrows are now derived from the
   catalog via `systemEyebrow()` across all six system pages that hardcoded
   them. Digital Twin removed from customer copy (see below). One €49 product
   had three names across one funnel — "Gut Report" on the homepage, "Personal
   Report" at the CTA, "Food System Report" on the Stripe line item —
   standardised on **Food System Report**.

4. **Accessibility.** Reduced motion honoured by the hero video, which now also
   has a play/pause control; ScrollReveal no longer ships invisible markup, so
   a blocked bundle degrades to unanimated rather than blank across 136 files;
   a skip link added, with `<main id="main">` to target.

5. **Node pinned** via `.nvmrc` and `engines`, matching CI's Node 20.

### Corrections to the external review

- **"Repo says Feed/Seed/Heal, should say Regenerate"** — incomplete. The split
  is three-way, not two: `Produce` is also in use for the third pillar
  (`lib/biotics.ts`, `/biotics`, `/family`, `YouFramework`, i18n), and `Add`
  for the second. "Regenerate" appeared nowhere in the repo. See Open questions.
- **"Pregnancy is a scaffold presented as live"** — the label was wrong, but the
  assessment is fully built and works end to end. A labelling bug, not a
  missing feature. Fixed the label; left the status alone.
- **"Condition pages need noindex/evidence review"** — `/anxiety`, `/adhd`,
  `/depression` and `/bipolar` are indexed *and* sitemapped consistently, and
  each carries a disclaimer component. Not a code defect. Left as-is by
  decision; see Open questions.
- **"No a11y test setup"** — false. Playwright, `@axe-core/playwright` and a
  20-page smoke suite already run in CI. The real gap is that only `critical`
  fails while `serious` is report-only — and neither defect fixed above is
  detectable by axe at all.
- **"Validation/build baseline unavailable"** — that was the reviewer's local
  npm failure. CI runs `npm ci` on Node 20 then lint, vitest, `tsc --noEmit`,
  two guard scripts, `next build` and the axe suite. Only genuine gap was the
  missing Node pin, now added.

### Verified

`tsc --noEmit` clean, 537 unit tests pass, `next build` succeeds, axe suite
20/20. The score card was rendered locally and inspected (200, 1200×630 PNG,
real numbers, identical output from both parameter spellings). The
accessibility behaviours were checked in Chromium against a production build:
reduced motion leaves the video paused and offers Play, which works; default
motion plays and offers Pause; JavaScript disabled still renders page content;
the skip link is the first tab stop.

No database changes. Nothing here touches Supabase.

### Open questions for a human

1. **Third-pillar verb.** After #176 lands, the third pillar reads `Regenerate`
   (homepage, pricing, emails), `Heal` (`lib/pillars.ts`, CMS taxonomy) and
   `Produce` (`lib/biotics.ts`, `/biotics`, `/family`, i18n); the second reads
   `Seed` vs `Add`. Worth knowing before choosing: **`Produce` is the
   scientifically accurate verb** — the system produces postbiotics — while
   `Regenerate` is the brand ask. Unifying is a small copy change once the word
   is chosen, and is deliberately not done here.
2. **Condition pages and Article V.14.** The constitution keeps sensitive
   surfaces out of search until clinical/legal review, which is why
   `/pregnancy` is noindexed. `/anxiety`, `/adhd`, `/depression` and `/bipolar`
   are indexed and sitemapped. They carry disclaimers, and the decision was to
   leave them indexed — but the asymmetry with pregnancy is deliberate policy
   now, and should be confirmed with legal rather than inherited by accident.
3. **`/pregnancy` CTA.** The eyebrow now reads "Coming Soon" while the page
   still offers "Start Pregnancy Assessment". That is arguably correct — not
   publicly promoted, but usable by anyone given the URL — but it is a choice
   worth making explicitly.
4. **`lib/foods.ts` internal inconsistency**, noticed but out of scope: Mixed
   Berries is classified `postbiotic` while Blueberries is `prebiotic`.
5. **`SystemStatus` declares `"planned"`** with zero usages, and `pregnancy` is
   the only `scaffold` system that still carries an `assessmentRoute`.
