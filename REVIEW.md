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

### Review rounds and merge

Codex reviewed the branch twice before merge.

- **Round one** raised two findings: a deterministic health claim on `/food`
  ("directly repair the gut lining and reduce inflammation"), and the twin
  figure's default `alt` still reading "Your Food System Digital Twin" —
  meaning the rename had been true for sighted users only, since the three
  public `/digital-twin` call sites all omit `alt`. Both fixed in `5988f92`.
- **Verifying those fixes** surfaced a third problem the original pass missed:
  three taglines still asserting a food *is* a postbiotic (`lib/foods.ts:577`,
  `:628`, `plate-creator-client.tsx:348`). Fixed in `d48defc`.
- **Round two** found a fourth: `dashboard-client-data.ts:143` told members
  "Sourdough or aged cheese add more postbiotic compounds" — naming the two
  foods this very branch reclassified as *probiotic*. Fixed in `ec25b5c`.

**Lesson worth keeping.** The sweep after `d48defc` used a noun-phrase pattern
(`is a postbiotic`, `postbiotic-rich`), which cannot match a verb phrase like
"add more postbiotic compounds" — which is exactly how the round-two line
survived it. Any future correctness sweep over this vocabulary needs both
shapes. The re-run used `add|provide|contain|deliver|give|boost|supply|…` near
"postbiotic" and came back clean for app surfaces.

Merged as `86db4c5` (merge commit, per repo convention — the last 30 commits on
`main` are all `Merge pull request …`, none squashed).

### Accepted decisions

Confirmed by the founder on 2026-07-29/30. These replace the corresponding
entries that were previously open questions.

1. **Third-pillar verb → `Regenerate`.** `Regenerate` is the word for public
   brand and action copy; explanatory science copy reads "your system produces
   microbial metabolites and postbiotic outputs" rather than adopting `Produce`
   as the label. **Persisted keys do not move** — `aliasKey: "heal"`,
   `PillarAliasKey`, the `?heal=` OG contract and the `sub_scores` JSON all stay
   exactly as they are. The rule already documented in `lib/pillars.ts`
   ("Rename `aliasLabel`, never this") governs the unification.
2. **Condition pages stay indexed**, pending legal/science review. No code
   change. The asymmetry with `/pregnancy`'s noindex is now recorded as
   deliberate policy rather than inherited by accident.
3. **`/pregnancy` stays "Coming Soon" with the CTA in place.** Noindexed,
   homepage card reads "Coming soon", and the assessment remains usable by
   direct URL. This is the state already shipped — no follow-up work.
4. **Homepage direction: deferred.** Codex has since reported on merge order
   (Phase 0 before #176, which is what happened), so the blocker on this
   decision is cleared and it can be taken whenever the founder is ready.
   #177 / #178 / #125 remain non-blocking preview routes.

### Open questions for a human

1. **`lib/foods.ts` internal inconsistency**, noticed but out of scope: Mixed
   Berries is classified `postbiotic` while Blueberries is `prebiotic`.
2. **`SystemStatus` declares `"planned"`** with zero usages, and `pregnancy` is
   the only `scaffold` system that still carries an `assessmentRoute`.

### Deferred to the evidence-language pass (Workstream E)

Found during the Phase 0 sweeps, deliberately not changed — these are
evidence/legal judgements rather than factual corrections, and the founder
scoped them out of the correctness gate:

1. **`lib/foods.ts:630`** — green tea metabolites described as having
   "anti-inflammatory, **anti-cancer**, and neuroprotective effects". The
   strongest claim remaining in the food catalogue.
2. **`content/book/chapter-11.mdx:377`** — "Fermented foods contain postbiotic
   compounds even before you eat them." Defensible (fermentation does produce
   metabolites in the jar) but close to the line the rest of the product holds.
3. **Medical-metaphor taglines** — "Cooling transforms starch into gut medicine"
   (`lib/foods.ts:551`), "The oldest medicine in your kitchen" (`:51`). Judged
   brand voice rather than health claims. Historical prose such as "eaten for
   centuries as a digestive medicine" describes history and is fine as-is.
