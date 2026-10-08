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

---

## 11 · Experience 0R tranche 1 (0R-1 + 0R-2) — the gate

Recorded here for the same reason §10 is: this document's job is what was
measured, when, and on what head.

| | |
|---|---|
| branch | `claude/eatobiotics-experience-audit` |
| tranche commit | **`3e437a1`** — one commit above the frozen `35a68e3` |
| verification commit | **`59cc4ef`** — the s7b 1012 anchor repoint, in its own commit |
| production files modified | **zero** |

### The ledger

| | |
|---|---|
| `tsc --noEmit` | clean |
| `eslint` | **0 errors**, 97 pre-existing warnings |
| unit suite | **228 files · 6532 passed · 2 skipped** (at `35a68e3`: 227 · 6414 · 2) |
| three guard scripts | pass |
| `next build` | succeeds |
| Playwright | **255 / 255** |
| sabotage — **thirteen suites at full count** | base 26/26 · `v1` 10/10 · `s3` 12/12 · `s4` 8/8 · `s5` 10/10 · `s6` 14/14 · `s7` 30/30 · `s7b` **171/171** · `g4` 44/44 · `g5` 65/65 · `g6` 18/18 · `g61` 22/22 · **`run_0r` 17/17 (new)** |
| sabotage — `s3a` | **2/35 caught, 33 broken** — every one `FILE MISSING`, targeting files on unmerged PR #274. The same count and the same reason as at the Gate 6.0 close and the Experience 0 close |
| harness | finished · mutations restored · **final tree clean** |

> **Not described as "all green".** Thirteen suites are at full count; the
> fourteenth has a named, unchanged exception.

### Two things the gate found, recorded rather than smoothed over

**A Playwright flake, named as a flake only after it was retested.** The first
full run returned **254 passed, 1 failed** —
`audit-capture.spec.ts:255 representative @ 390`. Re-run in isolation it passed
**29/29**, and the final full run passed **255/255**. It is recorded as a flake
because it was measured twice, not because one green run was convenient.

**`s7b` went 171 → 168 → 170 → 171, and the dip was real.** Cases **1007** and
**1011** genuinely slipped against 0R-2's own work: `KNOWN_UNCORRECTED` was
keyed on filename, so three files ledgered for a personal-Biotic claim acquired
an allowance across all three rule families. Repaired by making the ledger
`(file, rule)`. Cases **1090** and **1012** are a different thing and are not
counted as the same: both are anchors the ledger conversion relocated, repointed
with the reason recorded inline, following the Gate 4 precedent.

Full account in
[`EXPERIENCE_0R_REMEDIATION_SPEC.md` §7](./EXPERIENCE_0R_REMEDIATION_SPEC.md).

### The audit corpus is NOT re-committed

Running Playwright regenerates part of the capture corpus — **19 images in one
run, 22 in another**, plus `manifest.json` and `SCREENSHOT_INDEX.md`. That is
the `NOTE-CAPTURE-01` residual measured at step 4 (13 of 105 images, a 34×34
region, 0.038% of bytes, the 390 tab strip's resting scroll position, **no
difference in visual content**) — and the fact that the count varies between
runs is itself consistent with it.

`docs/experience/audit/` was restored to its `35a68e3` state before each commit.
Committing regenerated image blobs into a tranche that changed **no rendered
surface** would add churn that evidences nothing, and would break the
self-consistency of the committed citations against their manifest hashes.

---

## 12 · Experience 0R-3 (`P0-TRUST-05`) — the gate

| | |
|---|---|
| branch | `claude/eatobiotics-experience-audit` |
| commit | **`f22d1f3`** |
| production files changed | **4** — the first 0R tranche to change product behaviour |

### The ledger

| | |
|---|---|
| `tsc --noEmit` | clean |
| `eslint` | **0 errors**, 97 pre-existing warnings |
| unit suite | **229 files · 6554 passed · 2 skipped** (0R tranche 1: 228 · 6532 · 2) |
| three guard scripts | pass |
| `next build` | succeeds |
| Playwright | **257 / 257** — two more than tranche 1's 255, both new `P0-TRUST-05` assertions |
| sabotage | **`run_0r` 24/24** (1467–1473 new, 7/7) · base 26/26 · `s7b` 171/171 · `g5` 65/65 · `g6` 18/18 · `g61` 22/22 |
| harness | finished · mutations restored · **final tree clean** |

Suites outside the blast radius (`v1`, `s3`, `s4`, `s5`, `s6`, `s7`, `g4`) were
at full count on `3e437a1`/`59cc4ef` one tranche earlier and are unaffected by a
change confined to two chat clients, one Twin component and the test corpus.
`s3a`'s 33 PR #274 `FILE MISSING` anchors remain the standing exception.

### Why the audit corpus was NOT re-committed, measured rather than assumed

Re-running the capture harness after the repair produces two **different** kinds
of change, and only one of them is the familiar residual:

| | |
|---|---|
| `account-twin-present-overview-390.png` | **10359 → 10268 px tall** — 91px shorter, exactly the retired chip's row. A **material content change caused by the repair** |
| `account-representative-overview-390.png` | **0.042% of bytes** on an untouched state — the `NOTE-CAPTURE-01` residual, measured at 0.038% at step 4 |

**The frozen corpus is the BEFORE evidence**, and `P0-TRUST-05` cites it.
Overwriting those images would leave the register pointing at screenshots of a
repaired product — the defect would be undocumented at the exact moment it was
fixed. So `docs/experience/audit/` stays at its Experience 0 state, and the
after state is proved behaviourally by the permanent assertion in
`audit-capture.spec.ts`, which re-proves itself on every run instead of being a
byte somebody has to trust.

### Three defects in the new guard, found by the guard

| | |
|---|---|
| the draft rule refused `report-client.tsx` | its sender takes **no argument** and reads the draft from closure — a *stronger* form of the same property |
| the param rule cried wolf | `q` *"flows into map"*, because `STARTER_QUESTIONS.map((q) => …)` names its callback `q`. A name collision, not a flow |
| the effect rule was too narrow | mount-only would have permitted `useEffect(() => sendMessage(input), [input])`, which passes the draft rule and fires on every keystroke. Widened to **every** effect; **sabotage 1471 is that shape** |

### The ordering, stated rather than glossed

The commit was made on a verified-clean tree; Playwright and the sabotage suites
then ran **after** it, on the same tree, and the capture residual was restored
before the documentation follow-up. `f22d1f3` is a tested state; it is not a
state whose test preceded it.

---

## 13 · Experience 0R-4 (`P0-TRUST-01/02/03`) — the gate

### Three heads, and the split is deliberate

| head | what it is |
|---|---|
| **`43a2b6d`** | the product / remediation state, and **the head the full gate below ran on** |
| `f350c52` | documentation only — the Experience Constitution principle, staged by explicit path while the harness was mutating unrelated files |
| *this commit* | documentation only — this ledger and the `REVIEW.md` engineering rule |

**The product gate is not re-run for a documentation ledger.** It names
`43a2b6d` as the tested remediation state, which is what makes that sound.

### The ledger

New sabotage cases are kept on their own line and **not** folded into the suite
result.

| | |
|---|---|
| `tsc --noEmit` | clean |
| `npx eslint .` | **0 errors**, **96 warnings** |
| unit suite | **230 files · 6577 passed · 2 skipped** (0R-3: 229 · 6554 · 2) |
| three guard scripts | pass |
| `next build` | succeeds |
| Playwright, full suite | **260 / 260** — three more than 0R-3's 257, the three new `P0-TRUST` rendered proofs |
| **new** cases `1474–1481` | **8 / 8 caught** |
| `run_0r`, whole suite | **32 / 32** |
| base · `v1` · `s3` · `s4` · `s5` · `s6` · `s7` | 26/26 · 10/10 · 12/12 · 8/8 · 10/10 · 14/14 · 30/30 |
| `s7b` · `g4` · `g5` · `g6` · `g61` | 171/171 · 44/44 · 65/65 · 18/18 · 22/22 |
| **`s3a`** | **2 / 35 caught, 33 broken** |
| harness | finished · every mutation restored · **final tree clean** |

**`s3a` returned the standing exception unchanged.** The 33 broken cases are
`336–358`, `360`, `362–370` — the same count and the same ids carried since the
Gate 6.0 close, every one a `FILE MISSING` anchor against unmerged PR #274.
**Not an 0R-4 regression.**

> **Thirteen suites at full count, one documented exception.** Not described as
> "all green", because that would be false.

### The eslint reconciliation — a measurement I misreported

Recorded here because this document's job is *what was measured, when, and on
what head*, and a number I got wrong belongs in it.

| | |
|---|---|
| **97 → 1** | **a reporting error.** Same command (`npx eslint .`), same scope. The tail of the output was quoted instead of the summary: *"0 errors and 1 warning potentially fixable with the `--fix` option"* counts **auto-fixable** warnings, never the total |
| **97 → 96** | **a real one-warning reduction, attributed** by building a worktree at the tranche-1 head `3e437a1`, running the canonical command there, and diffing by file and rule |

```
DISAPPEARED since 3e437a1:
  -1  components/account/live-dashboard.tsx  [no-constant-binary-expression]
APPEARED:  (none)
```

At `3e437a1`, line 1694: *"Unexpected constant truthiness on the left-hand side
of a `&&` expression"*. Line 1694 was
`{(todayMeals.length > 0 || true) && (` — **the tautological gate behind a live
`P0-TRUST-01` manifestation**, the one the Experience 0 audit missed.

**eslint had been naming the defect through every gate of this programme**,
inside a count reported as inert. The engineering rule that follows from it is
in `REVIEW.md`, not here and not in the Experience Constitution: it is a review
discipline, not a design principle.

> **No unrelated warnings were cleaned up during this close.** The 96 remain the
> reported baseline.

### The capture corpus is restored, not committed

Playwright regenerates part of `docs/experience/audit/` — the measured
`NOTE-CAPTURE-01` residual, and after 0R-4 also genuine content change on the
account states whose fabrications were removed. It is restored to its
Experience 0 state before every commit, for the reason §12 records: the frozen
corpus is the **before** evidence that the register cites, and the **after**
state is proved behaviourally by assertions that re-prove themselves on every
run.

### Three defects 0R-4 found in its own instruments

| | |
|---|---|
| the `ScoreBar` rule | demanded removal of **three** per-Biotic triples that render **real** meal data and belong to 0R-5. The **rule** was narrowed to the fused construct, not the scope widened |
| a `\s*` lookahead | backtracked to zero width, so `?? null` read as a content fallback. **Latent in a second rule** that passed only because its pattern was absent |
| sabotage **1477** | declared a mock constant without consuming it and slipped **correctly** — the rule is about consumption. Fixing it exposed the rule's real boundary: it keys on the `MOCK_`/`DEMO_` naming convention, not inline literals. Recorded in the guard rather than implied |

### Site-level close

The full site-level accounting — entire findings closed, individual
manifestations of multi-site findings closed, and manifestations explicitly
remaining for 0R-5 — is in
[`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md)
under *0R-4 · Site-level close record*. In summary: `P0-TRUST-01`, `-02` and
`-03` closed entire; `P0-SCIENCE-02` closed entire as a fused unit;
`P0-SCIENCE-03` closed at `:1757` and `:1885` only, with **`:1896` remaining
0R-5's**; `P0-SCIENCE-01`, `-04`, `-05` untouched; `DEBT-CODE-01` remaining
0R-9's.

---

## 14 · Experience 0R-5 (`P0-SCIENCE-01/-03:1896/-04/-05`) — the gate

### The red state, measured before any product code changed

Guards first, and the numbers recorded so the enforcement is demonstrably
load-bearing rather than retrospectively green:

| instrument | red |
|---|---|
| `biotic-visual-encoding.test.ts` | **5 failed / 19** |
| `biotic-claims.test.ts` | **4 failed / 506** |
| `agent-loop-claims.test.ts` | **6 failed / 63** |
| `live-dashboard-fabrication.test.ts` | 28 passed — the `:1482` inline fabrication is **inventoried** debt, not a regression; the rule is proved non-vacuous against the literal that shipped |

The widened per-Biotic-score rule is what found `lib/account/meal-impact.ts`
mapping a score to a band and a chip colour — a site no inventory had named.

### The gate on the committed head

| | |
|---|---|
| `tsc --noEmit` | **clean** |
| `npx eslint .` | **0 errors**, **96 warnings** — exactly the `ef17b98` baseline, diffed by file and rule: **nothing appeared, nothing disappeared** |
| unit suite | **229 files · 6602 passed · 2 skipped** |
| `check-ai-guard` · `check-schema-drift` · `check-supabase-scoping` | **all three pass** |
| `next build` | **succeeds** |
| Playwright, full suite | **266 / 266** (6.9m) — six more than 0R-4's 260, the six new science proofs |
| **new** cases `1482–1509` (27 cases; `1505` is a documented harness limitation, not a case) | **27 / 27 caught**, on their own line and NOT folded into the suite result |
| `run_0r`, whole suite | **59 / 59** |
| base | **26 / 26** |
| `v1` · `s3` · `s4` · `s5` · `s6` · `s7` | **10/10 · 12/12 · 8/8 · 10/10 · 14/14 · 30/30** |
| `s7b` | **171 / 171** |
| `g4` · `g5` · `g6` · `g61` | **44/44 · 65/65 · 18/18 · 22/22** |
| **`s3a`** | **2 / 35 caught, 33 broken** — reported separately, never folded into "all green" |

**Thirteen suites at full count, one documented exception. No new slip survives.**

### `s3a` — the standing exception, with a correction to how it has been described

The same 33 ids as every close since Gate 6.0: `336–358`, `360`, `362–370`.
**Not an 0R-5 regression.** But the 0R-4 ledger called them "every one a
`FILE MISSING` anchor against unmerged PR #274", and measured now that is not
quite true:

| mode | count |
|---|---|
| `FILE MISSING` (unmerged PR #274) | **31** |
| `ANCHOR MISSING` in `package.json` | **2** — cases `364` (`"pdfjs-dist": "4.10.38"`) and `365` (`"node": ">=20 <21"`), both superseded by the Node 24 pin move |

The count and the ids are unchanged; only the earlier characterisation was
imprecise, and it is corrected here from evidence rather than repeated.

### Four sabotage cases repointed, and one that had to be repointed twice

Anchors that vanished **because 0R-5 repaired the defect they attacked** —
`ANCHOR MISSING`, not a slip, and handled on the Gate 4 precedent of repointing
with the reason inline rather than retiring the property:

| case | its anchor | where it points now |
|---|---|---|
| `1462` | `VISUAL_ENTRIES_AT_OPEN = 4` — the inventory cap, deleted with the inventory | `MODULES_AT_0R5_CLOSE`, its successor. **Then genuinely SLIPPED**, because emptying the new pin made the test iterate nothing; the pin now has a literal that must equal its length |
| `1463` | `biotic: BioticKey` on `SystemHotspot`, removed | puts the key **back** beside the static `tone`, so the property is unchanged |
| `1465` | the `ritual.ts` ledger entry, closed | `lib/assessment-scoring.ts`, the one 0R-2 finding still open |
| `1007` | the probiotic row's `why` in `meal-impact.ts`, deleted | **first re-aimed at the fibre row in the same file and slipped** — the rule that catches it is *"fermented food asserted to deliver or contain live organisms"* and needs the word **fermented**, which 0R-5 removed from that module with the row. Re-aimed at `lib/account/ritual.ts`, which still names a fermented food on a live surface |

`1007` is the useful one: **a lexically-keyed rule follows the word, so
repointing a case must follow the word too.** Moving the claim to a fibre row
changed the property rather than the anchor, and the miss is left recorded in
the case file.

### The lint delta, attributed rather than reported

The rule adopted at the 0R-4 close was applied. The count went **96 → 100**
mid-tranche, and the diff by file and rule named all four:

```
APPEARED:
  +1  app/account/today/page.tsx                   [no-unused-vars]  bioticsProfile
  +1  lib/account/meal-impact.ts                   [no-unused-vars]  TEAL
  +2  components/account/twin/daily-ritual.tsx     [no-unused-vars]  Image, figureSrc
```

All four were **leftovers of 0R-5's own repairs** — a query with no reader, the
colour of a deleted row, and the image of a body the component no longer draws.
Each was removed with the thing it belonged to, which is not "cleaning unrelated
warnings": it is reading what the warning said about the change in hand. The
count returned to 96 with a zero diff both ways.

### Instrument defects found, and two limitations reported

Seven defects in 0R-5's own guards, each recorded in the register's close record
with how it was found — including `BIOTICS_ANY` missing the capitalised singular
(the Gate 3.7 case-1097 hole, still open on the other side two gates later), a
per-Biotic rule that missed the plural property path the worst live site used,
and a replacement pin that passed when emptied.

Two properties an existing instrument could not express were **reported rather
than worked around**, as the brief required: `EXPOSED_AT_0R1`'s file-level
granularity, and the harness's inability to sabotage a file-absence assertion.

### The capture corpus

Playwright regenerates part of `docs/experience/audit/`. That is the measured
`NOTE-CAPTURE-01` residual: the frozen corpus is the *before* evidence, so it is
**restored, not committed**.

### The unit-suite count, reconciled at the formal close

The suite went `230 files · 6577 passed · 2 skipped` at the 0R-4 accepted head
to `229 files · 6607 passed · 2 skipped` here. The file count **fell** while the
test count **rose**, which the 0R-5 report did not explain. Derived from the two
accepted heads rather than inferred from the totals.

#### Which file disappeared

```
git ls-tree -r --name-only ef17b98 | grep -E '^tests/.*\.test\.(ts|tsx)$' | sort   → 230
git ls-tree -r --name-only 5e6bb90 | grep -E '^tests/.*\.test\.(ts|tsx)$' | sort   → 229

REMOVED : tests/unit/habit.test.ts
ADDED   : (none)
```

**One file, and nothing added. An intentional deletion**, in the same commit as
`lib/habit.ts` — not a discovery or configuration issue.

#### Why none of its tests could be kept

`lib/habit.ts`'s entire exported surface was `focusPillar` — *"the weakest
pillar, the one with the most room to improve"* — and `dailyNudge`, which
returned that pillar with the member's score for it. `PillarKey` is
`"prebiotics" | "probiotics" | "postbiotics"`, so the module computed a
comparative personal Biotic verdict, and its only two callers rendered it on
`DailyLoopCard`.

Its three tests each **required** the construct 0R-5 removed:

| test | what it demanded |
|---|---|
| *picks the lowest-scoring pillar* | a weakest-Biotic verdict, asserted three ways |
| *breaks ties in canonical order (prebiotics first)* | the same verdict, deterministically |
| *returns the weakest pillar's nudge from the Food System Core* | `nudge.pillar.key` **and** `nudge.score` — a per-Biotic score for the member |

There is no form of those assertions that survives the repair, because what they
assert *is* the prohibited construct. The property that replaced them is the
file-existence check in `tests/unit/agent-loop-claims.test.ts`
(*"lib/habit.ts does not exist"*), which is the only shape that can state it.

#### The second instance of a suite requiring a defect

`tests/unit/meal-impact.test.ts`'s first case was named *"lights the probiotic
network for fermented meals"* and demanded a Biotic-named row, a band word of
`"strong"` **because** the meal was fermented, and the sentence *"lights up your
probiotic network"*. Both suites were green for the whole programme while
holding a prohibited construct in place.

> **A test suite can require a defect**, and no guard that reads product source
> can see it, because the requirement is not on a customer surface.

That is the standing argument for `agent-loop-claims.test.ts` calling the
generators rather than scanning them.

#### Discovery was complete at both heads

The worry behind the question is a test file silently dropping out of the run.
It did not:

| head | test files in tree | files vitest collected |
|---|---|---|
| `ef17b98` | **230** | **230** |
| `5e6bb90` | **229** | **229** |

#### The arithmetic, measured per file

`vitest run --reporter=json` at both heads, diffed by file. Both totals match
their recorded ledgers exactly (`6579` = 6577 + 2 skipped; `6609` = 6607 + 2).

| file | 0R-4 → 0R-5 | Δ |
|---|---|---|
| `tests/unit/biotic-visual-encoding.test.ts` | 16 → 28 | **+12** |
| `tests/unit/agent-loop-claims.test.ts` | 57 → 64 | **+7** |
| `tests/unit/biotic-claims.test.ts` | 502 → 509 | **+7** |
| `tests/unit/live-dashboard-fabrication.test.ts` | 23 → 28 | **+5** |
| `tests/unit/account-twin.test.ts` | 8 → 10 | **+2** |
| | subtotal | **+33** |
| `tests/unit/habit.test.ts` | 3 → removed | **−3** |
| | **net** | **+30** |

A static tally of the diff could not have established this, because the largest
contributors are `it.each` tables whose length sets the count — `it.each(VISUAL_MODULES)`
runs twice over a list that went 6 → 9, `NO_PERSONAL_BIOTIC_NUMBER` gained 7
entries, and `it.each(PRE_REPAIR)` is new with 5 subjects. Hence the measurement.

**No product code changed for this reconciliation, and the gate was not re-run:
`5e6bb90` remains the tested product state.**

---

## 15 · Experience 0R-6 (the paid path) — the gate

### The red state, measured before any product code changed

| instrument | red on arrival | note |
|---|---|---|
| the existing claims corpus on `lib/report/build-food-system-report.ts` | **GREEN — and it stayed green** | the predicted result, and the point. `${PATHWAY_LABEL[strongestPathway]}` puts no Biotic word in the file, so a source scan of the whole corpus sees nothing. Anyone reading the suite would have concluded the money path was clean. **Eleventh instance of interpolation blindness** |
| a new behavioural assertion over `systemSnapshot.dominantPattern` | **RED** | it returns the ranking sentence verbatim |
| a new behavioural assertion that no Report string names a Biotic as strongest or first | **RED** | `oneLine`, `dominantPattern` and `mainLever` all do |
| a new behavioural assertion that permuting *which* Biotic is weakest cannot change the Report | **RED** | and red for more reasons than predicted — see `P0-SCIENCE-07-LIVE` |
| the form track with the live Report family added to `VISUAL_MODULES` | **RED** | `primaryAccent: bioticAccent(priorityPathway)` |
| the `P1-VOCAB-01` structural rule | **RED** | `{p}` rendered under `capitalize` |
| the `-07` breakdown rule | **RED** | `{dive.score}/100` plus the possessive branch |
| the `-07` reachability pin | **GREEN on arrival** | `isUnverifiedPaidFlowAllowed` already fails closed after S7R. Proved non-vacuous against the pre-S7R shape by sabotage 1513 and 1514 |

### The gate, in order

| step | result |
|---|---|
| `tsc --noEmit` | **clean** |
| `eslint .` | **96 warnings, 0 errors** — back to baseline. One warning appeared (`subScores` unread in `generateFullReport`, a leftover of 0R-6's own `-07` repair) and was cleaned; nothing appeared, nothing disappeared |
| `vitest run` | **229 files · 6621 passed · 2 skipped (6623)** |
| `check-ai-guard.mjs` | pass — 25 Claude-calling routes, all capped |
| `check-schema-drift.mjs` | pass — 1084 files, 41 tables |
| `check-supabase-scoping.mjs` | pass |
| `next build` | **pass** |
| Playwright | **266 passed** |
| `run_0r` | **71/71 caught** (59 inherited + 12 new, 1510–1521) |
| base · `v1` · `s3` · `s4` · `s5` · `s6` · `s7` · `s7b` · `g4` · `g5` · `g6` · `g61` | **430/430 caught** — 26 · 10 · 12 · 8 · 10 · 14 · 30 · 171 · 44 · 65 · 18 · 22 |
| `s3a` | **2/35 caught, 33 broken** — the standing exception, unchanged: **31 `FILE MISSING` + 2 `ANCHOR MISSING`** (cases 364, 365). Reported separately, as required |

### Test-count attribution, 6609 → 6623

Measured per file rather than inferred from the total, and the four deltas close
the +14 exactly. **229 test files at both heads** — nothing dropped out of the
run.

| file | 0R-5 → 0R-6 | Δ |
|---|---|---|
| `tests/unit/retired-vocabulary.test.ts` | 34 → 40 | **+6** |
| `tests/unit/biotic-visual-encoding.test.ts` | 28 → 32 | **+4** |
| `tests/unit/agent-loop-claims.test.ts` | 64 → 67 | **+3** |
| `tests/unit/biotic-claims.test.ts` | 509 → 510 | **+1** |
| | **net** | **+14** |

`retired-vocabulary`'s baseline was measured by running the `2e4da42` copy of
the file alongside the current tree, not derived by subtraction — the 0R-5
reconciliation's own lesson, which was that a static tally cannot establish this
when `it.each` table lengths set the count.

`biotic-claims` is **+1 net** from two opposite movements: the three 0R-1
tranches gained an exact-set pin (+1) while `KNOWN_UNCORRECTED`'s
`ENTRIES_AT_0R1_OPEN` went 19 → 17 with both `lib/assessment-report.ts` entries
repaired (which changes no test count, because that cap is asserted rather than
iterated).

### Three sabotage cases slipped, and each was resolved on its merits

Per the standing rule — strengthen the TEST, never the case, unless the case was
aimed at the wrong thing.

| case | verdict | action |
|---|---|---|
| **1512** restores `PillarDeepDive.score` | the **test** was weak: the field was held out only by the TypeScript type, and the driver runs vitest, not `tsc` | `retired-vocabulary.test.ts` now reads the source and refuses the field and the sort over it |
| **1452** drops one file from the Report corpus | the **test** was weak, and in an instructive way: the entry was protected by the presence of a *defect* in the file it names, and 0R-6 repaired that defect | the three 0R-1 tranches are pinned as **exact sets** |
| **1521** neutralises the ranking | the **case** was aimed at the wrong thing, twice. First it replaced only `priorityPathway`, leaving `strongestPathway` ranking; then neutralising `orderedByNeed` still left the Report varying — because it carries per-Biotic `score` and `state` fields, which is `P0-SCIENCE-07-LIVE` | re-aimed at `dominantPattern`, the one held assertion a single edit can flip |

Two cases additionally reported **ANCHOR MISSING** rather than slipping — 1456
(`ENTRIES_AT_0R1_OPEN = 19` → 17) and 1462 (the tail of
`MODULES_AT_0R5_CLOSE`). Both anchors were moved to follow their targets. **An
anchor pinned to a shrinking number has to follow the number, or the case
silently stops testing anything** — the 0R-5 lesson about lexical anchors,
restated for numeric ones.

---

## 0R-6R — the gate at the paid-path close

`175f53d` was the 0R-6 head and was accepted as an **intermediate remediation
state**. This is the gate for the work that finished it.

### The gate, in order

| step | result |
|---|---|
| `tsc --noEmit` | **clean** |
| `eslint .` | **96 problems (0 errors, 96 warnings)** — the baseline exactly, **zero delta** |
| `vitest run` | **232 files · 6648 passed · 2 skipped** |
| `scripts/check-ai-guard.mjs` | pass — 25 Claude-calling routes, all capped |
| `scripts/check-schema-drift.mjs` | pass — 1084 files, 41 referenced tables |
| `scripts/check-supabase-scoping.mjs` | pass |
| `next build` | pass |
| `playwright test` | **266 passed** |
| frozen audit evidence after that Playwright run | **0 dirty files under `docs/experience/audit/`** |

### The eslint delta, attributed

Four warnings appeared and all four were leftovers of this tranche's own repair.
Measured per file against `175f53d` in a detached worktree rather than inferred
from the total:

| file | 175f53d | first run | cause | action |
|---|---|---|---|---|
| `lib/pdf/report-pdf.tsx` | 2 | 3 | `IncomingSubScores` became unused when `ReportPDFProps.freeScores` lost `subScores` | import removed |
| `tests/unit/fallback-report-pathways.test.ts` | 0 | 3 | `band`, `normalizeToBiotics` and `PATHWAY_LABEL` were read only by the ranked assertions this suite inverted | imports removed |
| | **96** | **100 → 96** | | |

The two warnings `report-pdf.tsx` carries at both heads (`Svg`, `Rect`) are
pre-existing and were deliberately left, so the attribution stays clean.

> **Warning counts are not waivers.** Four appeared, four were mine, four are
> gone.

### The vitest delta, attributed per file

Measured by running the `175f53d` tree in a detached worktree beside the current
one, because `it.each` table lengths set the counts and a static tally cannot
establish this — the 0R-5 reconciliation's lesson.

| file | 175f53d → 0R-6R | Δ | why |
|---|---|---|---|
| `tests/unit/audit-evidence-immutability.test.ts` | 0 → 21 | **+21** | new — the frozen-write gate |
| `tests/unit/paid-pdf-biotic-claims.test.ts` | 0 → 6 | **+6** | new — the PDF proved by render |
| `tests/unit/pdf-boundary-subscores.test.ts` | 0 → 3 | **+3** | new — the `generate-pdf.ts` discard, proved at runtime |
| `tests/unit/addon-lens.test.ts` | 623 → 630 | **+7** | two ranked `it.each` describes replaced by three |
| `tests/unit/biotic-visual-encoding.test.ts` | 32 → 36 | **+4** | three modules added to two `it.each` loops (+6) and one `PRE_REPAIR` subject (+1), less the two deleted blocked-inventory tests (−2), less the branch that went with them |
| `tests/unit/retired-vocabulary.test.ts` | 40 → 43 | **+3** | the type, the builder and `orderedByNeed` assertions |
| `tests/unit/agent-loop-claims.test.ts` | 67 → 68 | **+1** | the permutation-set pin |
| `tests/unit/addon-matrix.test.ts` | 87 → 86 | **−1** | one ranked assertion inverted into an existing test |
| `tests/unit/generation-provenance.test.ts` | 157 → 156 | **−1** | the `whatYourAnswersSuggest` merge probe re-pointed |
| `tests/unit/hero-tagline-agreement.test.ts` | 21 → 15 | **−6** | rewritten around the refusal rather than the `mixed` override |
| `tests/unit/fallback-report-pathways.test.ts` | 29 → 19 | **−10** | four ranked describes replaced by permutation invariance over the whole spine |
| | **net +27** | | 229 → **232 files** |

### Sabotage — all fourteen suites

| suite | result |
|---|---|
| `0r` | **87/87** caught after re-aiming (85/87 on the first run) |
| base (`run.py`) | 26/26 |
| `v1` | 10/10 |
| `s3` | 12/12 |
| `s4` | 8/8 |
| `s5` | 10/10 |
| `s6` | 14/14 |
| `s7` | 30/30 |
| `s7b` | **171/171** after re-aiming (170/171 on the first run) |
| `g4` | 44/44 |
| `g5` | 65/65 |
| `g6` | 18/18 |
| `g61` | 22/22 |
| **`s3a`** | **2/35 — the standing exception, reported separately** |

`s3a`'s breakdown is exactly the documented one: **31 `FILE MISSING` + 2
`ANCHOR MISSING`** (cases 364 and 365), 33 unresolvable because their targets
live on unmerged PR #274. No mutation landed in any of the 33, so none of them
can report caught, and none of them proves anything either.

Twenty new cases (**1518–1537**) cover each 0R-6R repair and the frozen-evidence
gate. All twenty caught on their first run.

### Three cases were re-aimed, and all three for the same reason

Per the standing rule: when a case slips, strengthen the TEST, never the case —
**unless the case was aimed at the wrong thing.** All three were.

| case | verdict | action |
|---|---|---|
| **1463** `system-map.ts` gains a Biotic key beside its colour | the **case**. It mutated `biotic: BioticKey`, and 0R-6R retired the rule that saw that type after measuring it fires on exactly four things in the whole module list, not one a defect: two comments recording removals, and two taxonomy keys | re-aimed at the real shape — a per-Biotic **score** on a record that also carries a colour, which is `meal-impact.ts` as it shipped |
| **1494** the Twin aura takes a `BioticKey` again | the **case**, same rule. `twin-visual.ts`'s own repair note says why: *"`AuraTone` is a name for a colour and nothing else. `twin.biotics.weakest` is a verdict."* The signature was never the claim | re-aimed at the producer: a convenience wrapper that re-derives the tone from `twin.biotics.prebiotics.score`, which is how this construct returned in four separate components after each earlier removal |
| **999** the Report reintroduces live foods as a category | **ANCHOR MISSING, not a slip.** Its anchor was a `BAND_SUGGESTS` branch, deleted with `P0-SCIENCE-07`. No mutation landed, so nothing was proved — the honest outcome | re-anchored on week 1 of the thirty-day loop, a reviewed sentence every reader of the paid Report now receives. The property — fermented-implies-probiotic as a category — is untouched by the `-07` repair |

Four more cases needed their **anchors moved** rather than their aim changed
(1462, 1506, 1518, 1519, 1520, 1521), because 0R-6R changed the text they
pinned. 1462 has now followed its target three times, which is the lesson
itself: **an anchor pinned to a shrinking number has to follow the number**, or
the case silently stops testing anything.

### The two cases whose own writing found a defect

Neither found a product bug. Both found that a guard of mine was decorative:

- **1518** was going to null the per-Biotic record rule. Measuring what that rule
  matched showed it fired on three reviewed content catalogues in the builder
  alone — and that this was holding `BLOCKED_AT_0R6` green after its defect was
  repaired. The rule was narrowed, the inventory deleted.
- **1534** was going to delete `copyToCommitted`'s refusal. Nothing **called**
  that function, so the deletion broke no assertion. The suite now exercises it
  against a temporary directory, in both directions.
