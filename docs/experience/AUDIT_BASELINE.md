# Experience 0 — Audit Baseline and Observation Log

**Branch** `claude/eatobiotics-experience-audit`, created from the frozen Gate
6.1 head **`71aa9fd`**. This is the authorised chain and it does not move.

> **Tooling metadata, 2026-10-04.** A session harness from step 6 onward
> generates its own per-session branch name — `claude/eatobiotics-review-fpqu6q`
> in that session — and names it as the designated branch. The audit stays on
> `claude/eatobiotics-experience-audit`, where the chain is established and
> reviewed across `496fa76 · 12b0ed8 · 81bf323 · 38ab8af · cd4722c`. Changing
> branches because a harness produced a different name would weaken provenance,
> not improve it. Recorded here as session metadata, not as a repository
> decision; if an actual repository guard ever prevents the push, that is a new
> fact and gets its own entry.

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

---

## 9 · The Experience roadmap, re-sequenced at the Experience 0 freeze

Promised at step 3 and recorded here for the first time. **Re-derived from the
audit, not preserved because it was written first.** The synthesis is
[`EATOBIOTICS_EXPERIENCE_AUDIT_v1.md`](./EATOBIOTICS_EXPERIENCE_AUDIT_v1.md).

```
0  Observe        ── frozen
0R Restore product integrity        ← mandatory, before any redesign
1  Establish the instrument
2  My Food System becomes the product
3  The Report
4  Account separation and legacy migration
5  Cross-product visual system
```

### What changed from the pre-audit ordering, and why

| | was | is | why |
|---|---|---|---|
| 1 | Assessment | **Establish the instrument** | the handoff is an instrument change before it is an interface change; redesigning Assessment screens first would decorate a gap |
| 2 | Report | **My Food System becomes the product** | the Report cannot be defined until the persistent product owns what belongs to it, or it duplicates the seven areas |
| 3 | My Food System | **The Report** | and it is blocked on three professional reviews, not on engineering |

---

### 0R · Restore product integrity

| | |
|---|---|
| Purpose | repair every P0 and the three P1s; close the guard gaps by construction |
| Surfaces | `/account`, `/assessment/results`, `/assessment/report`, the Twin layer, the claims corpora |
| Depends on | nothing. **It is the dependency** |
| Must already be reviewed | nothing — 0R removes claims rather than adding them. The one exception is `P0-SCIENCE-08`'s food copy, which goes to review and may be deferred without blocking the gate |
| Visual work permitted | **none**, beyond what removing a prohibited element requires |
| Stop condition | the seven close criteria in `EXPERIENCE_0R_REMEDIATION_SPEC.md` §6 |

### 1 · Establish the instrument

| | |
|---|---|
| Purpose | let the free assessment collect what a Food System is made of — What You Notice and Food Context — and establish a system rather than terminate in a page |
| Surfaces | `/assessment`, `/assessment/you`, the reveal, establishment |
| Depends on | 0R complete |
| Must already be reviewed | **the new question set.** Any scored question moves `questionSetVersion` and refuses every existing comparison; unscored observation and context items do not. That distinction decides whether pre-review testers can become the canonical first cohort |
| Visual work permitted | the reveal only — score, one line, one action |
| Stop condition | a person completes the free assessment and lands on `today` with a system that validates |

### 2 · My Food System becomes the product

| | |
|---|---|
| Purpose | execute the master disposition map — the capabilities that move from Generations 1, 2 and 3 arrive in the seven areas |
| Surfaces | the seven areas; the Twin layer retires as those capabilities land |
| Depends on | Experience 1 — several moves need established systems to be meaningful |
| Must already be reviewed | FSS-v1 scientific sign-off, for the preview fence to come down. Until then this ships behind the candidate gate |
| Visual work permitted | **yes, within `DESIGN_CONSTITUTION.md`.** This is where Generation 1's visual ambition meets Generation 4's truthfulness |
| Stop condition | every KEEP/MOVE/MERGE row has landed, every RETIRE row is gone, and `/account` holds infrastructure only |

### 3 · The Report

| | |
|---|---|
| Purpose | the canonical Report becomes the €49 product; the legacy chain retires |
| Surfaces | `/assessment/report`, the canonical renderer, the PDF |
| Depends on | Experience 2 — the Report reflects a product that must already own its own material |
| Must already be reviewed | **the blocking dependency.** `specificFoods` (dietitian + EU allergen taxonomy), `bioticsLanguage` (Irish/EU health-claims law), `safetyNetting` (GP/dietetic sign-off), and the `constraints-known` acknowledgement. Content ships as reviewed capabilities, one gate at a time |
| Visual work permitted | refinement only — the renderer already looks like a publication |
| Stop condition | a paying customer receives a Report bound to an explicit system, assessment and content-pack version, with every sentence traceable |

### 4 · Account separation and legacy migration

| | |
|---|---|
| Purpose | `live-dashboard.tsx` retires; Account becomes infrastructure |
| Surfaces | `/account` and its subroutes |
| Depends on | Experience 2 and 3 — Account cannot shed a capability before its destination exists |
| Must already be reviewed | nothing new |
| Visual work permitted | yes — infrastructure deserves to be pleasant, and claims nothing |
| Stop condition | nothing on `/account` makes a claim about the person |

### 5 · Cross-product visual system

| | |
|---|---|
| Purpose | one visual system across the assembled product |
| Surfaces | all |
| Depends on | everything above |
| Must already be reviewed | nothing new |
| Visual work permitted | **this gate is the visual work** |
| Carries | the **66 / 616 / 2,472** open question, and its four-way diagnosis — insufficient, inconsistently applied, or simply bypassed |
| Stop condition | a new surface is indistinguishable in quality from the best existing one, and the token system is diagnosed rather than measured |

> **No redesign gate begins before 0R closes.** That is the whole reason 0R was
> inserted.

---

## 10 · Experience 0 close record

The complete gate for the synthesis arrived **after** the commit it describes.
Recorded here so the repository tells the same truth as the final report.

```
Executable/audit head tested: 5274e03
Full gate completed after commit with tree restored clean.
Twelve sabotage suites full-green; s3a 2/35 with the same 33 documented
PR #274 FILE MISSING exceptions.
```

### The ledger

| | |
|---|---|
| `tsc --noEmit` | clean |
| `eslint` | **0 errors**, 97 pre-existing warnings |
| unit suite | **227 files · 6414 passed · 2 skipped** |
| `check-ai-guard` · `check-schema-drift` · `check-supabase-scoping` | all pass |
| `next build` | succeeds |
| Playwright | **255 / 255** |
| harness | finished · mutations restored · **final tree clean** |

### Sabotage, stated as twelve-plus-one rather than as "all green"

| suite | | suite | |
|---|---|---|---|
| base | 26/26 | `s7` | 30/30 |
| `v1` | 10/10 | `s7b` | 171/171 |
| `s3` | 12/12 | `g4` | 44/44 |
| `s4` | 8/8 | `g5` | 65/65 |
| `s5` | 10/10 | `g6` | 18/18 |
| `s6` | 14/14 | `g61` | 22/22 |

**`s3a`: 2/35 caught, 33 broken.** Every one of the 33 reports `FILE MISSING`,
targeting files that live on unmerged PR #274 — the documented exception, at the
same count and for the same reason as at the Gate 6.0 close. Verified by
re-running the suite rather than assumed from the prior record.

> **The sabotage gate is not "all green", and is not described that way.**
> Twelve suites are at full count; the thirteenth has a named, unchanged
> exception. A suite that cannot run its cases reports nothing, and nothing reads
> as nothing wrong — which is the failure mode the harness exists to detect.

### The ordering, stated rather than glossed

The gate ran **after** `5274e03` was committed, on the same tree, and the tree
was verified clean once the mutation harness restored its edits. `5274e03` is a
tested state; it is not a state whose test preceded it.

The freeze commit was made by explicit path (`git add docs/`) while the harness
held a mutation on `components/report/canonical/canonical-report.tsx` — a file
that step **never** touched. Staging by path is why no mutation entered the
commit; `git add -A` would have captured one.

### What is frozen

| | |
|---|---|
| audit chain | `496fa76 · 12b0ed8 · 81bf323 · 38ab8af · cd4722c · c995bca · ce828ca · e7f9600 · 5274e03` |
| register | **24 entries**, plus `RESP-ACCOUNT-01` named and not entered |
| evidence | 234 manifest rows · 101 committed citations |
| next | **Experience 0R — specified, not begun** |
