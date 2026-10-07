# EatoBiotics — project brief for Cursor

**Read this before touching anything.** It is the shortest path to being useful
here and the shortest path to avoiding the one class of mistake that would cost
the most to undo.

Companion documents:

| | |
|---|---|
| [`01_REVIEW_AND_WORKFLOWS.md`](./01_REVIEW_AND_WORKFLOWS.md) | what to review, what not to touch, and nine repeatable workflows |
| [`02_MOBILE_APP_BRIEF.md`](./02_MOBILE_APP_BRIEF.md) | the iOS/Android daily companion |

Measured at commit `e060bf9` on branch `claude/eatobiotics-experience-audit`,
2026-10-07. Numbers in this document come from commands listed in §9; if you
doubt one, re-run it rather than trusting the text.

---

## 1 · What EatoBiotics sells

**Three things. Anything else in the repository that names a price or a plan is
describing history, not an offer.**

| Step | Product | Price | Produces |
|---|---|---|---|
| 1 | **Food System Assessment** | Free | **Biotics Score™** |
| 2 | **Personal Food System Consultation** | €49 one-time | **Personal Food System Report** + 30 days of access |
| 3 | **EatoBiotics Member** | €24.99 / month | ongoing membership |

Prices live with their product and are never re-literalled:
`REPORT_PRICE_EUR` in `lib/report/offer.ts`, `MEMBER_PRICE_EUR` in
`lib/membership-tiers.ts`. Product names live in `lib/product-vocabulary.ts`
(pure, client-safe, zero imports).

**Grow · Restore · Transform are legacy entitlements, not offers.** Existing
subscribers keep full access and `profiles.membership_tier` still accepts them,
but no surface may present them as something to buy.
`tests/unit/retired-vocabulary.test.ts` and
`tests/unit/agent-vocabulary.test.ts` enforce both halves.

### Vocabulary that must not drift

- The free product is the **Food System Assessment** — not "Snapshot", not
  "Food System Score". The Assessment is the product; the **Biotics Score™** is
  what it produces.
- **Prebiotics · Probiotics · Postbiotics** is how a score is *understood*.
  **Feed · Seed · Rejuvenate** is how a person *acts*. They are paired
  adjacently by design but never equated in a sentence.
- `"heal"` is a stored key, never customer-facing. Capital-R **"Regenerate" is
  retired**; lowercase "regenerate" remains correct for a real biological or
  ecological process and for a UI verb meaning "run it again".
- One meal gets a **Meal Biotics Score**, never the person's Biotics Score™.

---

## 2 · The permanent product rule

> **Measure the food system we can observe. Teach the biology accurately. Never
> present the biology as personally measured when it isn't.**

Three clauses. The third is the one that breaks.

**Measure what we observe.** The instrument asks about food: plant variety and
fibre, fermented foods, eating rhythm, processing, meal timing. Those are what a
score may describe, and they are also what a person can change.

**Teach the biology accurately.** Prebiotics · Probiotics · Postbiotics stay
prominent everywhere — `/biotics`, the framework cards, the Three Biotics panel.
A correction is never a deletion: educational Biotics content is preserved and
improved, never demoted for being unscored.

**Never present the biology as personally measured.** No surface may state,
imply or render a member's own Prebiotic, Probiotic or Postbiotic state — not as
a number, not as a bar, not as a band word, not as a superlative, not as a
possessive, and not as a mechanism ("this fed your Prebiotics"). A questionnaire
and a meal photo reach none of the three.

### Why this is a rule and not a preference

It has been broken repeatedly, in every form, and each time the fix was scoped
to the form rather than the rule:

| | |
|---|---|
| Tranche 1 | per-Biotic numbers in the pre-launch reveal |
| Tranche 2A | the same on `/assessment/results`, the share card, the generated OG image |
| Tranche 2C | the same in `sequence-email.ts`, months after every page had lost it |
| Gate 3.6 | **fifteen** sites across the agent loop and `/account`, including a member's three Biotic scores drawn onto a public share PNG |
| 0R-5 | seven live `ScoreBar` triples, a Biotic-derived aura colour, an anatomical claim from a checkbox |
| 0R-6R | **eleven** sites on the paid path, including a weakest-first bar chart in the downloadable PDF |

If you find yourself about to add a personal per-Biotic value anywhere, you have
found this rule, not an oversight.

---

## 3 · Stack and scale

| Layer | Technology |
|---|---|
| Framework | **Next.js 16.2.10** (App Router only — no `pages/`) |
| Runtime | **Node 24.x** (pinned in `package.json` `engines`) |
| UI | React 19.2 · TypeScript strict · Tailwind CSS v4 + CSS custom properties |
| Database + auth | Supabase (PostgreSQL + Supabase Auth) |
| Payments | Stripe v20 — one-time (€49) and subscription (€24.99/mo) |
| AI | Anthropic Claude (`@anthropic-ai/sdk`); OpenAI **only** for the plate-builder's recipes/images |
| Email | Resend |
| Validation | zod 3.25 |
| Analytics | Statsig (server + client) · PostHog · Sentry |
| Motion | Framer-style CSS + Remotion / `@remotion/player` |

**Scale, measured:**

| | |
|---|---|
| Pages (`app/**/page.tsx`) | 240 |
| API routes (`app/api/**/route.ts(x)`) | 106 |
| Components | 358 |
| `lib` modules | 315 |
| Unit test files | 232 (6,648 tests passing, 2 skipped) |
| Playwright specs | 12 (266 tests) |
| Lines across `app` + `components` + `lib` | ~176,850 |
| Dependencies | 33 runtime, 18 dev |

### Four coexisting UI generations

The brief anticipated three; the audit measured four, and the fourth is the
newest and smallest.

| | Generation | Evidence |
|---|---|---|
| 1 | Legacy dashboard / report | `components/account/live-dashboard.tsx` — **2,751 lines in one component** (2,609 when Experience 0 measured it; see below) |
| 2 | Transitional assessment | `components/assessment/` — 29 files |
| 3 | Digital Twin / "living body" | 23 components in `components/account/twin/` + `components/twin-motion/` |
| 4 | My Food System | `components/fss/` — 13 files, 2,256 lines; `components/fss/system/today.tsx` is 164 lines |

**The generational gap in one comparison:** a 2,751-line single component beside
a 164-line Today surface. `/account` has 16 subroutes, most of them generation 3.

> **A note on that number, because it is instructive.**
> `AUDIT_BASELINE.md` §2 records 2,609 lines, measured at the Experience 0
> freeze. It is **2,751 today** — the component identified as the project's
> largest structural problem grew by 142 lines while being documented as the
> largest structural problem. The baseline figure is not wrong; it is a dated
> measurement, which is how this project treats every number.
>
> The practical lesson for you: **re-run the command rather than quoting the
> document.** `wc -l` is cheap. §9 lists the commands behind every figure here.

### Design-system drift, measured

| | Count |
|---|---|
| CSS custom properties in `app/globals.css` (733 lines) | **66** |
| Gradient definitions | 13 |
| Hardcoded hex values in `components/**/*.tsx` | **616** |
| Inline `style={{` usages in `components/**/*.tsx` | **2,472** |

A 66-token system coexisting with 616 ad-hoc hex values and 2,472 inline styles
is the central fact of the token question. **The tokens are not absent; they are
not winning.** Diagnosing that — insufficient, inconsistently applied, or simply
bypassed — is Experience 5 work, and it is a genuinely open question.

---

## 4 · The two dashboards that get confused

This trips up every new reader, including automated ones. Get it right before
reasoning about "what a signed-in member sees".

| file | tabs | used by | real? |
|---|---|---|---|
| `components/account/live-dashboard.tsx` | **5** — `overview \| meals \| reports \| consultations \| account` | `app/account/page.tsx` | **YES — the production dashboard** |
| `components/account/dashboard-client.tsx` | **10** — Today, Overview, Reports, Membership, My Plate, My Meals, Refer, EatoBiotic, Intelligence, Story | `app/account-you/page.tsx`, `app/demo/account/[tier]/page.tsx` | **NO — demo / mock data only** |

The real dashboard reaches the daily-habit surfaces through `ExperienceNav`
links to separate routes: `/account/today`, `/account/this-week`,
`/account/twin`.

---

## 5 · Where things live

Authoritative detail is in [`CLAUDE.md`](../../CLAUDE.md) §"Key File Locations".
The entries that matter most for review:

| concern | file |
|---|---|
| **Route / surface inventory** | **`lib/v1-surface.ts` — the code is canonical** |
| Auth (SSR / browser / service-role) | `lib/supabase-server.ts` · `lib/supabase-browser.ts` · `lib/supabase.ts` |
| Entitlement | `lib/membership.ts` (`getUserMembershipTier`, `canAccess`, `FEATURES`, `TIER_META`) |
| Stripe | `lib/stripe-server.ts` (singleton — import it, never inline) · `app/api/stripe/webhook/route.ts` |
| Nav + footer | `lib/nav.ts` — edit the config, not the components |
| Product names | `lib/product-vocabulary.ts` |
| Prices | `lib/report/offer.ts` · `lib/membership-tiers.ts` |
| AI cost guard | `lib/ai-guard.ts` (`guardAiUsage`, `AI_LIMITS`) |
| Cron auth | `lib/cron-auth.ts` (fail-closed: no `CRON_SECRET` → 503) |
| Site password gate | `lib/dev-password-gate.ts` + `proxy.ts` |
| The Report family | `lib/report/**` · `lib/pdf/**` · `components/report/**` |
| The agent loop | `lib/agent-loop/**` + [`AGENT_LOOP_ARCHITECTURE.md`](../../AGENT_LOOP_ARCHITECTURE.md) |
| FSS-v1 instrument | `lib/fss/**` + `docs/fss/` |

### Route tiers

`lib/v1-surface.ts` classifies every route. The tiers are load-bearing — a
"broken link" may be a correctly refused destination:

`V1_CORE_ROUTES` · `V1_SUPPORTING_ROUTES` · `V1_ESSENTIAL_ROUTES` ·
`PUBLIC_CONTENT_ROUTES` · `LEGACY_REDIRECT_ROUTES` ·
`FIXTURE_SELF_GATED_ROUTES` · `POST_V1_ROUTES`

`POST_V1_ROUTES` **404 on purpose.** Do not "fix" them by building the feature.
(There *is* a real finding about them — see `P1-FUNNEL-01/02` in §7 — but the
fix is to stop advertising them, not to ship them.)

---

## 6 · Programme state — where the project actually is

EatoBiotics is mid-way through a sequenced integrity programme. The order is
deliberate and documented; it is not a backlog to be re-prioritised.

```
Gates 1–6.1      ── done: the instrument, the action model, the claims boundary
Experience 0     ── done, frozen: observe and audit, no repairs
Experience 0R    ── IN PROGRESS: restore product integrity  ← we are here
  0R-1 … 0R-6R      done (six tranches)
  0R-7              P0-TRUST-04 + D1's six-step Assessment sequence
  0R-8              P1-FUNNEL-01/02 + crawler coverage
  0R-9              DEBT-CODE-01
Experience 1     ── Establish the instrument
Experience 2     ── My Food System becomes the product
Experience 3     ── The Report
Experience 4     ── Account separation and legacy migration
Experience 5     ── Cross-product visual system
```

> **No redesign gate begins before 0R closes.** That is the entire reason 0R
> was inserted into the roadmap. Visual work during 0R is permitted only to the
> extent that removing a prohibited element requires it.

### What 0R has closed, and what that means for you

0R exists because the product was making claims it could not support. Six
tranches have removed them:

| tranche | what it closed |
|---|---|
| 0R-1 / 0R-2 | the enforcement boundary: the claims guards did not scan the largest customer surface, and no report file was in any corpus |
| 0R-3 | `P0-TRUST-05` — a product-authored premise auto-sent to Claude as the member's own question |
| 0R-4 | fabricated member data and a fabricated personal conclusion on live `/account` |
| 0R-5 | personal per-Biotic scoring in language, bars, colour and anatomy |
| 0R-6 / 0R-6R | the **paid path**: eleven sites of personal per-Biotic state, and the ranking selector that chose Report content |

**The practical consequence for a reviewer:** a great deal of code that looks
like a missing feature is a deliberate absence. `heroTaglineFor` returning
`null`, a Report with no per-pathway breakdown, a Today surface with no
personalised priority verdict — these are repairs, not gaps. Each carries a long
explanatory comment saying so. **Read the comment before changing the code.**

### The three remaining 0R tranches

| | work | notes |
|---|---|---|
| **0R-7** | `P0-TRUST-04` + D1's six-step Assessment sequence | `components/assessment/result/food-system-pattern.tsx:89` prints the *opportunity* text under a heading reading **APPEARS STRONGEST**. Both layers must go: the contradictory conditional **and** the personalised strongest/exploring construct. Widening the guard creates a deliberate collision with `assessment-result-narrative.test.ts` — **that collision is the intended outcome** |
| **0R-8** | `P1-FUNNEL-01` + `P1-FUNNEL-02` + crawler coverage | nine live 404s presented as available actions: four add-on CTAs on `/assessment/results`, five destinations inside the Twin gate, plus an `href="#"`. The guard fix is that the link crawler must cover Results and `/account` **in a Twin-present state** |
| **0R-9** | `DEBT-CODE-01` | the dead `strongest` aura half was already removed at 0R-5 |

### Blocked on human review, not on engineering

Do not attempt to unblock these in code:

- **FSS-v1 scientific sign-off** — five candidate domains have no named
  reviewer; the weights are a `DEV_ONLY` fixture; seven questions are drafts.
- **`specificFoods`** — dietitian review + EU allergen taxonomy.
- **`bioticsLanguage`** — Irish/EU health-claims law.
- **`safetyNetting`** — GP / dietetic sign-off.
- **The `constraints-known` acknowledgement** — a recorded pre-activation
  blocker for the deterministic paid Report (Phase 4A-S2R1).
- **Migrations 48 and 49** — drafted, **not applied**, with an ordered
  activation prerequisite list in `CLAUDE.md`.

---

## 7 · Hard constraints

These are not style preferences. Breaking one is the expensive kind of mistake.

### Production database

> **Agent sessions are READ-ONLY against production Supabase.**

Any schema or data change — including "safe" ADD-only idempotent migrations —
must be **drafted, not applied**: commit the SQL to `supabase/migrations.sql`,
write the exact apply steps and pre-checks into the PR description, and a human
applies and verifies it.

A past instruction to apply one migration is **not** standing authorisation for
the next. This rule exists because it has failed twice (see `REVIEW.md`).

Read-only verification (`list_tables`, `SELECT`) is fine and encouraged. Target
**only** project ref `ephmojiwlcebenholhpc` (EatoBiotics). The two EatoSystem
projects — `hwuzbxsaxsifpdzqhqaq`, `ohwzmulsvbfgaxgziqeo` — belong to a
different product and must **never** be read, written, or named in an
environment variable by EatoBiotics code, tests or tooling. **There is no
EatoBiotics staging project.**

### Do not modify

From `CLAUDE.md`'s own list:

- `app/api/checkout/route.ts`, `app/api/verify-payment/route.ts` — one-time
  report payments
- `app/api/generate-deep-questions/route.ts`,
  `app/api/submit-deep-assessment/route.ts`
- `app/assessment/` and `app/demo/assessment/` pages
- `app/api/auth/` routes
- any existing Supabase column — **only ADD, never modify or drop**
- the referral system (`profiles.membership` and its upgrade logic)
- `app/api/cms/import/chapters/route.ts` and the `cms_import_chapters`
  Postgres function — hand-documented invariants about `ON DELETE SET NULL` vs
  `CASCADE` and batch-id reuse

### Three deliberate duplications — do not DRY them

1. **The preview predicate exists three times**
   (`lib/fss/preview/preview-policy.ts`,
   `lib/report/presentation/preview-policy.ts`,
   `app/api/fss/focus-today/route.ts`). Both files say why in as many words:
   *these are independent gates on independent unfinished features, and a shared
   helper is a shared switch.* One edit to make one preview reachable would
   silently make the others reachable too. A test pins all three against each
   other across every environment.
2. **`lib/report/subscores.ts` keeps `normalizeToBiotics` but `orderedByNeed` is
   deleted**, not left uncalled. An exported sort over three per-Biotic scores,
   sitting in the module every report surface imports, is one line from being
   called again.
3. **Two behaviour vocabularies** in `lib/agent-loop/behaviour.ts` — a meal's
   third bucket is polyphenol-rich and resistant-starch foods; the assessment's
   third dimension is eating rhythm. **They are not interchangeable**, and a
   keyed lookup between them is a known bug class.

### Frozen audit evidence

`docs/experience/audit/screenshots/`, `manifest.json` and
`SCREENSHOT_INDEX.md` are Experience 0's **before-evidence**, frozen at
`5274e03`. Their `findings` column still names defects since repaired — that is
the point: it is what the audit cites.

Writes to that tree are gated on the exact string
`EATOBIOTICS_AUDIT_WRITE_FROZEN=1`. Without it, a Playwright run writes a
complete corpus and index under the gitignored
`docs/experience/audit/corpus/`. **Never set that flag, and never
`git add -A` after running Playwright.**

> **Frozen before-evidence must be immutable to normal regression runs.**

### Process

- **Never push to `main`.** Work on a feature branch.
- **No pull request unless explicitly asked.**
- Do not weaken a failing guard to make a suite pass. If a guard fails, either
  the code is wrong or the guard needs a *justified, measured* recalibration
  recorded in writing.
- Do not delete long explanatory comments. Several encode why a repair has the
  shape it has, and the programme has been bitten by losing that context.

---

## 8 · The enforcement machinery, and why it matters to you

This is the part most likely to be misunderstood, and the part that makes
EatoBiotics unusual.

### The claims guards

| instrument | what it does |
|---|---|
| `tests/unit/customer-surfaces.ts` | **the corpus** — every customer-visible surface, grouped: `ASSESSMENT_SURFACES`, `MEAL_SURFACES`, `ACCOUNT_SURFACES`, `EMAIL_SURFACES`, `SAMPLE_REPORT_SURFACES`, `REPORT_SURFACES`, `MARKETING_SURFACES`, `AI_PROMPT_SURFACES` |
| `tests/unit/biotic-claims.test.ts` | nine `PERSONAL_BIOTIC_STATE` rules over that corpus, plus the false-positive cases that keep education passing |
| `tests/unit/biotic-visual-encoding.test.ts` | **the form track** — a claim encoded as colour, extent, position or anatomy, over 13 named modules |
| `tests/unit/agent-loop-claims.test.ts` | **the one that matters most** — it *calls* the generators and reads what they return |
| `tests/unit/retired-vocabulary.test.ts` | retired names, prices, stored keys rendered directly |

**The corpus is a deliberately named list, not a tree walker**, and
`customer-surfaces.ts` says why:

> Not a tree walker. An automatic scanner would sweep in Family, Mind, the book,
> historical demos and the retired report renderers, and the honest response to
> the resulting failures would be to weaken the rules until they passed — which
> is how a guard becomes decoration. Naming each file means every inclusion is a
> decision someone made and a reviewer can question.

If you ship a customer-visible surface, **add it to the right group.**
`assertManifestIsReal()` fails if a named path does not exist, so a rename
cannot quietly empty a group.

### Why `agent-loop-claims.test.ts` is special

A source scan of the whole corpus catches **1 of 9** interpolated claims,
because `${BIOTIC_LABELS[k]}` puts no Biotic word in any file. This failure mode
— *interpolation blindness* — has been recorded **eleven times**. A new
generator of customer-facing prose belongs in that behavioural file, not only
in a corpus list.

### The sabotage harness

`tools/sabotage/` holds **fourteen suites**. Each case breaks exactly one
property in the source, asserts the mutation landed by sha256, runs the named
tests, requires them to **fail**, then restores byte-identically.

> A guard that passes proves nothing on its own: it may be asserting something
> trivially true, matching its own explanatory comment, or scanning an empty
> file list.

Run one with `python3 tools/sabotage/run_0r.py` (or `run.py`, `run_v1.py`, …).

**The standing rule:** when a case slips, **strengthen the test, never the
case** — unless the case was aimed at the wrong thing or is malformed.

**`run_s3a.py` reports `2/35` by design** — 31 `FILE MISSING` + 2
`ANCHOR MISSING`, because 33 of its cases target files on unmerged PR #274.
That is a documented standing exception, not a failure.

### Three guard scripts

```bash
node scripts/check-ai-guard.mjs          # every Claude-calling route is capped
node scripts/check-schema-drift.mjs      # code tables vs applied schema
node scripts/check-supabase-scoping.mjs  # no unscoped getUser()+getSupabase()
```

---

## 9 · Running the gate

Node 24 is required. The full gate, in order:

```bash
npx tsc --noEmit                    # must be clean
npx eslint .                        # 96 warnings, 0 errors — see below
npx vitest run                      # 232 files, 6648 passed, 2 skipped
node scripts/check-ai-guard.mjs
node scripts/check-schema-drift.mjs
node scripts/check-supabase-scoping.mjs
npx next build                      # MUST precede Playwright
PLAYWRIGHT_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  npx playwright test               # 266 passed
python3 tools/sabotage/run_0r.py    # 87/87 — and the other thirteen suites
```

**`eslint` reports 96 warnings and 0 errors. That is the baseline, not a
to-do list.** The rule in force:

> **Warning counts are not waivers.** Attribute every delta.

If your change takes it to 98, find both warnings and either fix them or explain
them. Do not note "only 2 new warnings" and move on. Measure per file against
the base commit rather than inferring from the total — `it.each` table lengths
and generated tests make totals misleading.

### Commands behind the numbers in this document

```bash
find app -name 'page.tsx' | wc -l                       # 240
find app/api -name 'route.ts' -o -name 'route.tsx' | wc -l   # 106
find components -name '*.tsx' | wc -l                   # 358
find lib -name '*.ts' -o -name '*.tsx' | wc -l          # 315
find tests/unit -name '*.test.ts' | wc -l               # 232
find app components lib -name '*.ts' -o -name '*.tsx' | xargs wc -l | tail -1
grep -rn "getUserFromRequest" app/api | cut -d: -f1 | sort -u   # the mobile routes
```

---

## 10 · Which documents to trust

`docs/experience/DOCUMENTATION_MAP.md` is the canonical spine:
*topic → canonical document → audit evidence → superseded, if any.* **Nothing is
deleted** — a superseded document is a record of what was believed at the time,
and the programme has twice found that record useful.

**Start here:**

| to understand | read |
|---|---|
| what the product is and what it must not say | `CLAUDE.md` · `docs/masterplan/PRODUCT_CONSTITUTION.md` |
| how the product must behave toward a person | `docs/experience/EXPERIENCE_CONSTITUTION.md` |
| the current defect register and every close record | `docs/experience/EATOBIOTICS_SCIENTIFIC_UI_DEBT.md` |
| the remediation sequence | `docs/experience/EXPERIENCE_0R_REMEDIATION_SPEC.md` |
| the roadmap and every gate's measurements | `docs/experience/AUDIT_BASELINE.md` |
| visual and motion rules | `docs/masterplan/DESIGN_CONSTITUTION.md` · `MOTION_CONSTITUTION.md` |
| the engineering-rule log | `REVIEW.md` |

**Three traps the map records explicitly:**

1. `docs/food-system-experience/MOTION_SYSTEM.md` — **partially superseded.**
   Rules 1 and 3–6 are canonical motion engineering. **Rule 2** — *"Every
   animation encodes a fact: a ping = a pathway fed"* — is a claims defect
   expressed as a motion rule, and it is the document-level origin of
   `P0-SCIENCE-04` and `P0-SCIENCE-05`.
2. `docs/food-system-experience/YOUR_FOOD_SYSTEM.md` — **partially superseded.**
   Accurate as an implementation record, and it is the document that
   *specifies* the prohibited mappings (*"the aura re-tints toward the
   strongest"*, a six-row impact→body-region table). Keep as history; do not
   build from it.
3. `docs/v1-step3-inventory.md` — **historical.** `lib/v1-surface.ts` is the
   canonical route inventory.

Two documents were named at Experience 0 kickoff and **deliberately not built**:
`EATOBIOTICS_UI_PATTERN_INVENTORY.md` and `EATOBIOTICS_VISUAL_TOKENS_AUDIT.md`.
The audit found the decisive problems to be claims and product architecture; a
pattern census would have looked thorough and changed nothing.

---

## 11 · The one-paragraph version

EatoBiotics measures a person's **food system** from a questionnaire and meal
photos, gives them a **Biotics Score™**, teaches real microbiome science, and
sells a €49 Report and a €24.99/month membership. Its hardest engineering
problem is not features — it is **not overclaiming**, because the product's
subject matter invites claims the instrument cannot support. A nine-stage
integrity programme is six-ninths done; the guards that hold it in place are
path-scoped source scanners, a behavioural suite that calls the real generators,
and fourteen differential-sabotage suites. Your most valuable contribution is
work that makes the product better **without** reintroducing a claim, and your
most expensive possible mistake is a tidy-looking change that quietly does.
