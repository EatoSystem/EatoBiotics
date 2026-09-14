---
name: concept-page
description: Governs isolated, preview-only concept routes (design/positioning experiments like /newhome). Enforces route + component isolation, noindex/nofollow, sitemap exclusion, zero production exposure, design-system composition, honest availability labels via claims-lint, verification via verify-eatobiotics, and the merge rule — preview-only by default, no merge until explicit visual approval.
---

# concept-page

## 1. Name

`concept-page`

## 2. Purpose

Let EatoBiotics explore new pages ambitiously — homepage concepts, landing experiments,
positioning tests — without any risk to production: no discoverability, no shared-code
changes, no dishonest labelling, and a clean promote-or-delete path.

**Merge rule:** *Preview-only by default. Do not merge until explicit visual approval.*

## 3. When to invoke

- Building a new page concept for visual/positioning/conversion review (e.g. a homepage
  concept, a Family landing concept, a retest-experience concept).
- Revising an existing concept route (a v2/v3 pass on the same branch/PR).

## 4. When not to invoke

- Changes to production pages (that is normal work verified via `verify-eatobiotics`, or
  `trust-fix` if it is a defect).
- Changes to shared components, layouts, navigation, or design tokens — out of scope for
  concepts entirely.
- Backend, API, or data work of any kind.

## 5. Pre-flight

1. **Overlap check:** inspect open PRs. Do not start if any open PR touches the homepage,
   layouts, navigation, footer, global styles, design tokens, or would likely conflict
   with the concept route. Narrow API/backend PRs do not block. Document the assessment.
2. **Baseline verification** green on unchanged `main` (via `verify-eatobiotics`
   pre-flight). If `main` is red, stop and report.
3. Fresh branch from latest verified `main` (or continue the concept's existing branch for
   iteration passes).
4. Identify the canonical destination for any conversion CTA from repository evidence
   (what the production homepage's primary CTA uses — currently `/assessment`); never
   invent a new route.

## 6. Workflow

1. **Isolation:** one temporary route (`app/<concept>/page.tsx`) + one component folder
   (`components/<concept>/`). Everything temporary lives in those two places so deletion
   is two folders. No temporary components scattered elsewhere.
2. **Discovery protection:** `robots: { index: false, follow: false }` via the Metadata
   API; confirm the route is absent from `app/sitemap.ts` (a curated list — absence is
   exclusion, verify by grep); no nav, footer, or internal production links; no canonical;
   no redirects.
3. **Compose from the production design system.** Reuse production components import-only
   (`ScrollReveal`, `HeroVideo`, `ScoreRing`, existing assets). No new colours, fonts,
   shadows, border radii, or gradient definitions. If a genuinely new presentation
   primitive is unavoidable (e.g. one scoped animation keyframe), it must be scoped inside
   the concept folder, respect `prefers-reduced-motion`, and be **declared explicitly in
   the PR body as an exception**.
4. **Honest labelling:** every capability shown carries the correct availability label;
   illustrative data is labelled as illustrative in text (not colour alone). **Invoke
   `claims-lint`** on the page copy and act on its verdict.
5. **Verification + visual QA:** **invoke `verify-eatobiotics`** — full bar, route present
   in build output, three-width visual QA with reviewed screenshots.
6. **Diff discipline:** `git diff main` must touch only the two concept folders. Any other
   file in the diff is a defect — remove it or stop and explain (see §9).
7. **PR:** open (or update) the PR with the §10 body, including the Vercel preview URL
   once the bot posts it. The PR stays open for visual review.

## 7. Scope rules

- **Production pages unchanged** — `/`, shared header/footer, `lib/nav.ts`,
  `app/globals.css`, `app/sitemap.ts`, `app/robots.ts`: zero modifications.
- Existing production components may be **imported and reused without modification**.
  If a shared component *appears* to need modification, stop and explain before doing
  anything (§9).
- Concept names that are provisional (e.g. a working feature name) live in a single
  constant with a comment, so renaming is one edit.
- Allowed skill relationships: this skill **invokes `claims-lint`** (copy honesty) and
  **`verify-eatobiotics`** (verification + QA). It owns only concept governance itself.

## 8. Review requirements

Before the PR is handed over: robots meta verified in rendered HTML; sitemap exclusion
verified by inspection; diff-scope verified (two folders only); claims-lint verdict Pass
or Pass-with-edits-applied; verify-eatobiotics bar met; production `/` spot-checked as
unchanged in the same QA run.

## 9. Stop conditions

- A shared component or layout would need modification to realise the concept → stop,
  explain why, and wait for direction.
- An open PR overlaps the homepage/layout/nav/footer/global styles → do not start.
- The concept requires presenting a future capability as live to "work" → it doesn't
  work; relabel or redesign the section.
- Asked to merge without explicit visual approval → decline per the merge rule.

## 10. Output format

PR body must include: purpose; positioning represented; exact files (all new/isolated);
section order; production components reused; new temporary components + which design
primitives they compose from (declared exceptions listed); header/footer decision;
CTA destinations + canonical-route evidence; availability classifications used;
noindex/nofollow confirmation; sitemap-exclusion confirmation; accessibility notes;
desktop/tablet/mobile QA results; verification results; explicit confirmation `/` and
production backend are untouched; **preview URL**; and the **promotion or deletion plan**
(promote approved sections into production via a separate PR, or delete the two concept
folders in one step).

Final report: PR number + link, branch, preview URL, and the same essentials — ending
with the concept's review status. The PR remains open, unmerged, pending explicit visual
approval.

## 11. Common failure modes

- **Demo-mode flags** baked into components instead of prop-driven data — components
  should render what they're given; sandbox/demo pages supply example data via props
  (the `/account-you-live` pattern).
- **Discoverability leaks:** adding the route to the sitemap "for later", linking it from
  a footer, or forgetting the robots metadata.
- **Unlabelled illustrative data** — an example score or fake insight without "not your
  data" labelling reads as a lie once real users see it.
- **Invented design primitives:** the first `/newhome` pass used a dark gradient from the
  account dashboard instead of the homepage's actual dark-panel gradient and read as a
  different site — audit the target design system, don't improvise.
- **Dishonest imagery pairing:** overlaying labels on photos that don't depict what the
  label claims (ingredient flat-lays labelled as "thali"/"mezze" were removed from the
  `/newhome` mosaic for exactly this).
- **Quiet production edits** sneaking into the diff (a shared-component "quick tweak").

## 12. Repository-specific examples

- `/newhome` (PR #125) is the reference implementation across three passes: v1 content
  and guardrails (noindex, sitemap-excluded-by-construction, isolated
  `components/newhome/`), v2 rebuilt on the audited production design system after v1
  read as a different site, v3 imagery pass using only verified existing assets — with
  the one scoped marquee keyframe declared as an explicit exception, reduced-motion safe.
- Canonical CTA evidence: `/assessment` proven as the production hero CTA
  (`components/home/hero.tsx`) and used by all homepage CTA components — the method for
  choosing any concept's conversion target.
- The dev sandbox `/account-you-live` feeding `LiveDashboard` via props is the
  no-demo-flags pattern §11 refers to.
- Promotion/deletion path as practised: delete = remove `app/newhome/` +
  `components/newhome/`; promote = graduate sections into `/` in a separate PR.
