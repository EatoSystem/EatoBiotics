# V1 step 3 — the launch-surface inventory

Generated from `lib/v1-surface.ts` against every `app/**/page.tsx` in the
repository. The classifier is the source of truth; this file is a reading of
it, and `tests/unit/v1-surface.test.ts` fails if any route on disk is
unclassified, so the two cannot drift.

**237 page routes**, in nine classes.

| Class | Action | Runtime | Count |
|---|---|---|---|
| `V1_CORE` | KEEP PRODUCT | Serve | 9 |
| `V1_SUPPORTING` | KEEP PRODUCT | Serve | 7 |
| `V1_ESSENTIAL` | KEEP PRODUCT | Serve | 8 |
| `PUBLIC_CONTENT` | KEEP PUBLIC CONTENT | Serve, stay indexed | 41 |
| `PUBLISHING_EXPORT` | INTERNAL AUTHORING SURFACE | Admin cookie required (Step 4) | 76 |
| `INTERNAL` | INTERNAL ONLY | Pass through to its own auth | 12 |
| `LEGACY_REDIRECT` | REDIRECT | Serve the redirect | 2 |
| `FIXTURE_SELF_GATED` | RUNTIME REFUSE (by the page) | Pass through; the page refuses | 1 |
| `POST_V1` | RUNTIME REFUSE | 404 | 81 |

The V1 launch product is sixteen pages. The public website is 237 routes.
Those are different statements and this file keeps them apart.

---

## V1_CORE — KEEP PRODUCT

The nine core launch pages.

*Runtime:* Serve. *Consequence:* None — this is the product.

`/`, `/account`, `/assessment`, `/assessment/deep`, `/assessment/report`, `/assessment/results`, `/assessment/you`, `/login`, `/pricing`

## V1_SUPPORTING — KEEP PRODUCT

The seven supporting pages: trust, legal, help, account mechanics.

*Runtime:* Serve. *Consequence:* None.

`/about`, `/account/settings`, `/account/signin`, `/help`, `/method`, `/privacy`, `/terms`

## V1_ESSENTIAL — KEEP PRODUCT

Not product pages, but the product breaks without them. The last four are already allowlisted through the private-beta gate in proxy.ts.

*Runtime:* Serve. *Consequence:* Refusing any of these would break sign-in, the email opt-out or the private beta.

`/auth/callback`, `/c/[country]`, `/discover/[code]`, `/enter`, `/offline`, `/preview-access`, `/unsubscribe`, `/waitlist`

## PUBLIC_CONTENT — KEEP PUBLIC CONTENT

Intentional educational and SEO content. Not product, not in the funnel, not de-indexed.

*Runtime:* Serve, stay indexed. *Consequence:* None. The condition pages had their CTAs repointed away from the Mind assessment.

The 25 canonical book chapters (`/book-chapter-1` … `/book-chapter-25`), plus:

`/adhd`, `/anxiety`, `/biotics`, `/bipolar`, `/book`, `/book-family`, `/book-mind`, `/books`, `/depression`, `/eatosystem`, `/food`, `/food/[slug]`, `/food/for/[goal]`, `/podcast`, `/recipe/[slug]`, `/roadmap`

## PUBLISHING_EXPORT — INTERNAL AUTHORING SURFACE

75 chapter variants (`/book-chapter-1..25` × `print`/`reedsy`/`substack`) plus
`/book/print`.

*Runtime:* served only with a valid `admin_auth` cookie, enforced once in
`proxy.ts` via `requiresAdminSurface`. Anonymous requests get the ordinary 404.
*Consequence:* the author's publishing workflow is preserved in production and
is reached from `/admin/book-exports`; no reader can enter it.

### ⚠ Correction — Step 4 disproved this section's original premise

This section first read *"Already noindexed and unlinked."* **The second half
was wrong**, and the claim was inherited from the launch audit rather than
checked. `components/book/chapter/chapter-nav.tsx` rendered **Copy for
Substack · Copy for Reedsy · Print / PDF** inside `ChapterNav`, which
`chapter-page-factory.tsx` renders on **all 25 public chapter pages**. An
internal authoring tool was advertised to every reader of the book. `noindex`
was doing no access-control work, and never could.

The corrected evidence, gathered in Step 4:

| Question | Answer |
|---|---|
| Does a script or CI job fetch them? | No — nothing in `scripts/` or `.github/`. |
| Does an external system pull them? | No. `components/book/substack/copy-button.tsx` is a clipboard button; the workflow is a human copying and pasting. |
| Is the output canonical anywhere? | No. `docs/cms-chapter-import-spec.md` §1.1 names these as public routes the CMS import never changes; `content/book/chapter-N.mdx` is the source of truth. |
| Were they linked? | The 75 chapter variants: from all 25 public chapter pages. `/book/print`: **from nowhere at all.** |
| Last substantive change | `37b4e7a` (2026-08-05), an incidental sitewide copy pass. |

So the dependency is real and human, and **nothing was deleted**. What ended
was the public exposure.

### Recorded findings, deliberately not acted on in Step 4

- **The 75 export pages are near-identical.** Each differs from the others only
  by `CHAPTER_NUMBER` and which template it imports — roughly 2,700 lines of
  duplication that one dynamic route would replace. That is a routing refactor,
  not an isolation, and it would need its own proof that all 75 URLs preserve
  their current output and the author's workflow.
- **`/book/print` has no inbound production link.** It is reachable only by URL
  and is now listed on `/admin/book-exports`. Whether to keep it is a later
  keep-or-delete decision, not Step 4's.

## INTERNAL — INTERNAL ONLY

/admin/* and /cms/*. This gate has no opinion; verifyAdminCookieEdge, the CMS layout gate and requireCmsAdmin remain authoritative.

*Runtime:* Pass through to its own auth. *Consequence:* Step 6 hardens admin auth. Nothing here weakens it.

`/admin`, `/admin/feedback`, `/admin/recipe-studio`, `/admin/waitlist`, `/cms`, `/cms/books`, `/cms/books/[id]`, `/cms/create`, `/cms/library`, `/cms/library/[id]`, `/cms/media`, `/cms/media/[id]`

## LEGACY_REDIRECT — REDIRECT

A superseded door whose destination is a real V1 page.

*Runtime:* Serve the redirect. *Consequence:* /reports → /pricing, /trilogy → /books. A test asserts no served redirect lands on a refused route.

`/reports`, `/trilogy`

## FIXTURE_SELF_GATED — RUNTIME REFUSE (by the page)

/demo/food-system-report. Its own preview policy denies production in the Node runtime, which — unlike the edge proxy — can read the environment at request time.

*Runtime:* Pass through; the page refuses. *Consequence:* A test parses the page and requires both the policy call and notFound().

`/demo/food-system-report`

## POST_V1 — RUNTIME REFUSE

Real work that is not part of the V1 promise. Nothing deleted.

*Runtime:* 404. *Consequence:* Reinstatement is a classification change plus a navigation entry.

**Food Systems not sold in V1** — 26

`/you`, `/family`, `/food-systems`, `/stability`, `/stability/assessment`, `/stability/insights`, `/stability/report`, `/stability/results`, `/stability/tracker`, `/glucose`, `/glucose/assessment`, `/glucose/glp1`, `/glucose/glp1/check`, `/mind`, `/gut-brain`, `/assessment-mind`, `/performance`, `/performance-assessment`, `/recovery`, `/longevity`, `/pregnancy`, `/pregnancy/assessment`, `/birth`, `/baby`, `/assessment/family`, `/assessment/add/[addon]`

**Living Twin and the daily ritual** — 7

`/account/today`, `/account/this-week`, `/account/twin`, `/today`, `/weekly`, `/live`, `/digital-twin`

**Account capabilities from legacy tiers** — 11

`/account/consult`, `/account/consult/deep-dive`, `/account/doctor-report`, `/account/family`, `/account/glp1`, `/account/goals`, `/account/intelligence`, `/account/meal-plan`, `/account/monthly-review`, `/account/story`, `/account/report/[id]`

**Meal analysis** — 3

`/analyse`, `/analyse/result/[hash]`, `/share`

**Plate Builder** — 9

`/myplate`, `/build-plate`, `/create-my-plate`, `/living-plate`, `/energy-plate`, `/food-system-bowl`, `/plate-builder`, `/weekly-recipes`, `/food-system-loop`

**Demo and test experiences** — 15

`/demo`, `/demo/account`, `/demo/account/[tier]`, `/demo/account/consult`, `/demo/account/twin`, `/demo/analyse`, `/demo/assessment`, `/demo/create-my-plate`, `/analyse-demo`, `/assessment/demo`, `/assessment/preview`, `/account/report/demo`, `/account-you`, `/account-you/[tier]`, `/account-you-live`

**Superseded product doors** — 10

`/report`, `/report-you`, `/report-mind`, `/report-family`, `/start`, `/start-mind`, `/start-family`, `/app`, `/course`, `/eatobiotic`

---

## Backends that keep running

Hiding a page does not stop its API or its scheduled job, and step 3 does
not touch either. Recorded here so the next phase inherits the list rather
than rediscovering it:

- **`/api/twin-state`** still serves the mobile companion app by bearer token,
  and `twin_state` is applied in production. Only the web pages closed.
- **`/api/analyse-meal`** is allowlisted through the private-beta gate for the
  same reason and is unchanged, although `/analyse` now refuses.
- **The nine cron routes** are untouched — including `feedback/retention`,
  which also sweeps `paid_report_intents`. Step 5 owns all of them.
- **Stripe, checkout, the webhook and the paid Report pipeline** are untouched.
- **`/api/cms/*` and the admin APIs** keep their own authorisation. Step 6
  owns hardening.

## The one deploy prerequisite

`next.config.mjs` keeps `/glp1 → /glucose/glp1` as a permanent redirect,
commented *"Short, ad-ready front door for the GLP-1 Companion acquisition
funnel."* `/glucose/glp1` is now `POST_V1` and answers 404.

**Before this reaches production, a human must pause the GLP-1 campaigns or
repoint their destination to an approved V1 route.** The campaigns live in ad
accounts this repository cannot see, and changing advertising systems is
outside this phase's authorisation. The code ships the refusal; this line
exists so it cannot land silently.

