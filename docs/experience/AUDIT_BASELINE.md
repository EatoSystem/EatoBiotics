# Experience 0 — Audit Baseline and Observation Log

**Branch** `claude/eatobiotics-experience-audit`, created from the frozen Gate
6.1 head **`71aa9fd`**.

This file is the audit's evidence log: what was measured, when, and on what
head. It is not a findings document — findings live in
`EATOBIOTICS_EXPERIENCE_AUDIT_v1.md`. It exists so every number quoted in the
audit can be traced to a command and a commit.

---

## 1 · Regression baseline, recorded BEFORE any audit tooling existed

Taken at `71aa9fd` on Node 24.21.0, so that any later failure is attributable
to audit tooling rather than inherited.

| Gate | Result |
|---|---|
| `tsc --noEmit` | clean (exit 0) |
| `eslint` | **0 errors**, 97 warnings (pre-existing) |
| unit suite | **224 files, 6362 passed, 2 skipped** |
| a11y suite | 21 tests in `tests/a11y/smoke.spec.ts` |
| Playwright e2e | 181 passed (recorded at the Gate 6.1 close on this head) |

---

## 2 · The four UI generations, measured

The brief anticipated three. The evidence says four, and the fourth is the
largest by component count.

| | Generation | Measured evidence |
|---|---|---|
| 1 | Legacy dashboard / report | `components/account/live-dashboard.tsx` — **2,609 lines in one component**. `dashboard-client.tsx` — 3,415 (the demo mock). `dashboard-parts.tsx` — 262. Five tabs: `overview \| meals \| reports \| consultations \| account` |
| 2 | Transitional assessment | `components/assessment/` — **29 files**. The four named in the brief total 1,055 lines |
| 3 | Digital twin / "living body" | **23 components** in `components/account/twin/`. `components/twin-motion/` — 3 files. `remotion` + `@remotion/player` dependencies. A public `/digital-twin` route, **POST_V1-refused**. Two of its own design documents |
| 4 | My Food System | `components/fss/` — **13 files, 2,256 lines total**. `system/today.tsx` — **164 lines** |

**The generational gap, in one comparison:** a 2,609-line single component
beside a 164-line Today surface.

`/account` has **16 subroutes**; most of them belong to generation 3, which is
why the "Account is infrastructure, My Food System is the product" question
cannot be answered without auditing it.

---

## 3 · Design-system drift, measured

| | Count |
|---|---|
| CSS custom properties in `app/globals.css` (733 lines) | **66** |
| Gradient definitions in `app/globals.css` | **13** |
| Hardcoded hex values in `components/**/*.tsx` | **616** |
| Inline `style={{` usages in `components/**/*.tsx` | **2,472** |

A 66-token system coexisting with 616 ad-hoc hex values and 2,472 inline styles
is the token audit's central fact. The tokens are not absent; they are not
winning.

---

## 4 · Route reachability, and one drift finding

`docs/v1-step3-inventory.md` is the **canonical** route inventory, generated
from `lib/v1-surface.ts` with `tests/unit/v1-surface.test.ts` preventing
classifier drift. This audit extends it with *state* and *audit-reachability*,
which it does not own. It does not restate classification.

**Finding — the canonical inventory is stale by one route, and it is the one
that matters most to this audit.**

| | |
|---|---|
| Page routes on disk | **239** |
| The inventory's prose | "**237** page routes" |
| `FIXTURE_SELF_GATED` per the inventory | **1** |
| `FIXTURE_SELF_GATED` in fact | **2** |

The absent route is **`/preview/food-system-v1`** — the FSS-v1 candidate
preview, which the brief identifies as the strongest candidate for the future
design language. The canonical inventory does not know it exists.

(The 99 apparent omissions are the inventory's own abbreviation
`/book-chapter-1..25` expanding on disk, not drift. `/api/*` entries in the
inventory are API routes, not pages.)

This is the same defect class `CLAUDE.md` warns about in its own Database
Tables section — *"this line previously asserted a fixed number, and by the
time anyone read it the number was wrong"*. A count typed into a document
describes the day it was typed.

---

## 5 · Audit reachability per surface

Two modes, because the surfaces differ in whether a customer can reach them at
all. No refusal is removed and no screenshot is manufactured.

| Surface | Mode | Why |
|---|---|---|
| `/assessment`, `/assessment/you`, `/assessment/results` | **visual** | `V1_CORE`, served |
| `/preview/food-system-v1` (My Food System) | **visual** | `FIXTURE_SELF_GATED`; its predicate permits local/test |
| `/account` | **visual, via fixture** | `V1_CORE` but auth-gated; the demo route renders a different component (see §6) |
| `/report`, `/report-you`, `/report-mind`, `/report-family` | **source only** | all `POST_V1_ROUTES` — the launch surface refuses them |
| `/reports` | **source only** | `LEGACY_REDIRECT_ROUTES` → `/pricing` |
| `/digital-twin` | **source only** | `POST_V1_ROUTES` |

> **Correction, 2026-10-04 (step 6) — the original text above stands, and it is
> incomplete.** `/digital-twin`, `/account/twin`, `/account/today` and
> `/account/this-week` are all refused (**404**, re-verified), so "generation 3
> is source-only" is true *of the routes*. It is false *of the layer*: fifteen
> twin components render inside `/account`, gated at
> `live-dashboard.tsx:1094` on `twin && twinVisual`, which
> `app/account/page.tsx:278` satisfies for any member who has completed the
> free assessment or logged one meal.
>
> So the account corpus captured for this baseline — every state with
> `twin: null` — records the dashboard **without** the layer most members see
> first. Recorded as `P0-ARCH-01`. The original wording is left standing rather
> than edited, per this document's own rule about dated corrections.

Screenshots for source-only surfaces are recorded as
**UNAVAILABLE — route intentionally refuses**, with the classification cited.

---

## 6 · Why `/account` needs a fixture, and why one is feasible

`app/demo/account/page.tsx` renders `components/account/dashboard-client.tsx`
— the **10-tab mock**. `CLAUDE.md` states it is *"demo/mock-data only … never
used by the real `/account` route. Do not confuse the two when reasoning about
what a signed-in member actually sees."* Auditing it would audit the wrong
component.

**The real component can be rendered from fixture props with no modification**,
which was verified rather than assumed:

- `LiveDashboard(props: LiveDashboardProps = {})` — **every prop is optional
  with a default**;
- every `fetch` in the file is **user-action triggered** (settings save,
  account export, pdf-url, cancel-subscription, delete, analyse-meal), not
  render-time.

So a deterministic render performs **no Supabase read, no Supabase write, no
Stripe call and no network request at all**, and needs no cosmetic change to
`LiveDashboard`.

> ### CORRECTION — 2026-10-03, after the fixture rendered
>
> **The last sentence above is wrong in two places, and the text is left
> standing so the correction is legible rather than silent.**
>
> 1. *"every `fetch` in the file is user-action triggered"* — `:860` calls
>    `pushTwinState` from a **mount effect**, which PUTs to `/api/twin-state`.
>    The fixture disarms it with `email: null` + `twin: null`; the component
>    does have the effect.
> 2. *"no network request at all"* — **false.** Every capture recorded one
>    console error: a 401 from `GET /api/assessment/journey`, issued by
>    `AssessmentJourneyCard` (`components/account/dashboard-parts.tsx:33`) from
>    a mount effect that reads no prop and therefore cannot be disarmed.
>
> What is true: the fixture **writes nothing and reads no customer data**. The
> accurate statement, the two mount effects, and the rendered pin that now holds
> the footprint are in `EATOBIOTICS_SCIENTIFIC_UI_DEBT.md` → `NOTE-FIXTURE-01`.
>
> Recorded here as the audit's own worked example of its standard: *source
> inspection can establish possibility; rendered evidence establishes
> reachability.*

---

## 7 · Documentation status, pending classification

The existing corpus is audited rather than assumed canonical, because parts of
it describe generation 3 while the locked architecture is the seven areas.

| Document | Lines | Provisional status |
|---|---|---|
| `docs/masterplan/DESIGN_CONSTITUTION.md` | 84 | appears **canonical** — typography, colour, illustration, space, dark/light, interaction, storytelling |
| `docs/fss/FSS_V1_DESIGN_SPEC.md` | 537 | **canonical** for FSS-v1, incl. the §11 surface/vocabulary matrix |
| `docs/food-system-experience/YOUR_FOOD_SYSTEM.md` | 107 | **likely superseded** — "the living home", "the living body", a public `/digital-twin` page |
| `docs/food-system-experience/ACCOUNT_REDESIGN.md` | 113 | **likely partially superseded** — the Overview tab of the dashboard now questioned as the product home |
| `docs/food-system-experience/MOTION_SYSTEM.md` | 92 | **to classify** — references `components/twin-motion/`, which exists |
| `docs/food-system-experience/PRODUCT_EXPERIENCE.md` | 105 | **to classify** — the emotional journey; may be generation-independent |
| `docs/food-system-experience/DESIGN_REVIEW.md` | 128 | **to classify** — a review of four concept mockups |

Final classification and the topic → canonical → evidence → superseded map go
in `DOCUMENTATION_MAP.md` at close.

---

## 8 · Commands behind every number above

```
git rev-parse HEAD                      # 71aa9fd83c6484d3d3f009e1da0c1f3f6ccf1d09
find app -name page.tsx | wc -l         # 239
wc -l components/account/live-dashboard.tsx      # 2609
wc -l components/fss/system/today.tsx            # 164
ls components/account/twin | wc -l               # 23
grep -c -- "^\s*--" app/globals.css              # 66
grep -rno "#[0-9a-fA-F]\{6\}" components/ --include=*.tsx | wc -l   # 616
grep -rc "style={{" components/ --include=*.tsx | awk -F: '{s+=$2} END {print s}'  # 2472
```
