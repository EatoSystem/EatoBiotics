# My Food System — Generation 4 under the same hostile scrutiny

**Experience 0, step 4.** Generation 1 (`/account`) was examined and found to
carry five P0s. This applies the identical standard to Generation 4, because
the question is not whether it is nicer:

> Does My Food System remain calm, truthful and coherent when subjected to
> exactly the scrutiny that broke Account?

**Newer is not evidence.** Nothing below credits this surface for being more
recent, and the comparison in §7 is written so that it could have concluded no.

**Verified by render.** 78 captures, `/preview/food-system-v1`, the real flow
against real storage — not a fixture. Manifest rows in
`docs/experience/audit/manifest.json`.

---

## 1 · Corpus completeness

| | |
|---|---|
| rows | **78**, matching the declared matrix exactly |
| system variants × seven areas × three widths | 3 × 7 × 3 = 63 |
| route states × three widths | 5 × 3 = 15 |
| committed citations | 8 |
| archive-only | 70 |
| **console errors across the entire corpus** | **0** |
| clock | `2026-10-03T09:00:00.000Z`, via `setFixedTime` |

`tests/unit/audit-manifest.test.ts` holds *expected = actual = hashed*, and
bridges the seven captured area names to the product's own `SECTION_ORDER`, so
an area added or renamed fails a test rather than leaving a silent gap.

**Evidence kind differs from Account, in Generation 4's favour.** Account is a
fixture page rendering one component from props. This is the real route driven
through the real flow — assessment, establishment, reassessment, version
tampering. There is no fixture that could disagree with the product.

### Two corpus defects found and fixed during capture

1. **No state showed differentiated domains.** `completeAssessment` answers every
   question identically, so all five domains read `67` and reassessment produced
   an implausible `67 → 100`. A `varied` state was added; the five domains now
   read 44 / 83 / 22 / 67 / 42. Without it the audit could not have tested
   whether the focus follows the data — which turned out to be the single most
   important question.
2. **The dates were real.** "Review again in 30 days" and "Baseline established
   October 3, 2026" come from a live clock, so the corpus would have rendered
   differently every day. Fixed with `clock.setFixedTime` — **not** `install`,
   because this is a real interactive flow and faking timers would stall it.

---

## 2 · P0 / P1 findings

**No P0.** No finding at this surface rises to a product contradiction.

### `P1-FSS-01` · `My Plan` is the density outlier, and it breaks the family

**Area** My Plan · **Measured, 1280, established**

| | cards | buttons | headings | page height |
|---|---|---|---|---|
| Today | 8 | 8 | 1 | 1,011px |
| Biotics | 8 | 7 | 2 | 900px |
| Progress | 12 | 7 | 1 | 973px |
| **My Plan** | **28** | **19** | **8** | **3,366px** |

Seven of the buttons on every area are the nav pills, so My Plan carries **12
interactive controls** against Today's one. It is 3.3× the height of its
siblings and the only area where the eye has no single landing point.

Not a contradiction and not a claims problem — an **IA** problem: the plan is
presented as a full inventory rather than as the thing you do next. Today
already answers "what now", so My Plan's job is the week, and it is currently
shaped like a backlog.

**Disposition — EVOLVE.** Keep the content; give it the hierarchy the other six
have.

### `P1-FSS-02` · The seven-pill nav does not scale and has no current state at 390

The nav is seven equal pills. At 390 they wrap to three rows, consuming the
first screen before any content. There is no grouping, no overflow behaviour and
no indication of where the member is beyond a fill colour.

**Disposition — EVOLVE** alongside any future eighth area.

---

## 3 · Scientific and claims findings

**This surface passes every test that Account failed.** Checked by render across
all seven areas and all three system variants:

| test | result |
|---|---|
| personal numerical Three-Biotic state | **none** anywhere |
| per-Biotic rings, bars or band words | **none** |
| biology inferred from answers | **none** |
| causal language | **none** |
| health or disease inference | **none** |
| What You Notice presented as scored | **no** — quoted, with an explicit "not scored" line |
| Food Context scored | **no** — explicit "never scored and never counted against you" |
| candidate methodology presented as approved | **no** — a status line on every area |

### The finding that matters most: the focus is DERIVED, and says what it is not

With the varied answer sheet — Diversity 44, Plants & Fibre 83, **Fermented
Foods 22**, Food Quality 67, Meal Rhythm 42 — Today renders:

> **YOUR FOCUS** — *Fermented Foods: make it regular rather than large*
> **TODAY** — *A spoonful, beside something you are already eating*
> *Of the five, this is where your answers described the least — which usually
> makes it the most direct place to start rather than the most important one.*

The focus **follows the data** (Fermented Foods genuinely is lowest), the action
changes with it, and the caveat **explicitly refuses the superlative reading**.

Set that beside `P0-TRUST-03` on Account, which states *"Your probiotic score is
your lowest pillar"* as a hardcoded literal in a block that reads no data at
all. Same product concept, opposite engineering:

| | Generation 1 | Generation 4 |
|---|---|---|
| what is named | Probiotic, always | the genuinely lowest domain |
| derived from data | **no** — zero references | yes |
| can be false | **yes** | no |
| describes | the person's biology | the person's **answers** |
| superlative | asserted ("lowest pillar") | **declined** ("not the most important one") |

### Biotics: the opposite test, also passed

`BioticsSection` takes **no props** and `BIOTICS.select` returns `null`. The

> **CORRECTION — this sentence originally read "so personalisation is
> structurally unavailable rather than merely avoided". That overstated the
> evidence and the original wording is left above so the correction is legible.**
>
> Taking no props closes **one** ingress. A child can still reach personal state
> through context, hooks, a store, browser storage, URL state, module globals or
> a network call — so "no props" is a fact about the **call site**, not a
> property of the subtree.
>
> The property the audit needs is now **proved** rather than asserted, over the
> panel's transitive import closure, by `tests/unit/biotics-panel-ingress.test.ts`
> (`P2-FSS-ARCH-01`). The closure is `BioticsProgressPanel` → `lib/pillars` →
> nothing, and **no module in it opens any of the eleven checked ingresses**. The
> guard was confirmed non-vacuous by firing on `dashboard-parts.tsx` (state,
> effect) and `lib/assessment/sync.ts` (storage, network).
>
> So the conclusion survives — but it is now evidence rather than inference.

The
rendered panel uses **dots, not bars** — a bar's length is a quantity — carries
no numbers, and closes with:

> *"There is no personal score for any of the three. Nothing you can tell us in
> an assessment, or show us in a meal, measures them directly."*

Possessives present are *"your gut"* and *"your food"*, neither of which is a
Biotic state. **No accidental personalisation found.**

**One item for the scientific reviewer, not a finding.** The Postbiotics
education says they *"calm inflammation and strengthen the gut lining"* — an
impersonal mechanism claim. Correct in form (education, not personal), but its
evidential basis belongs in `FSS_V1_EVIDENCE_MATRIX.md` rather than being
settled by an audit.

### Progress: Gate 5 respected, including at block level

The five classes render in the locked order with the score **last**, each with
its own boundary sentence, and the score block carries:

> *"Both numbers come from the same version of the assessment, so the change
> describes a change in the answers you gave about how you eat. It is not a
> measurement of your gut, and it does not say what caused the difference."*

and the page closes:

> *"Marking an action records what you did. It does not change your score, and
> we cannot tell from it what happened inside you."*

**On the H1 juxtaposition concern, the honest answer is "substantially mitigated,
not eliminated."** Five directional sentences still sit immediately above a
moved score, and placement plus caveat is a strong mitigation rather than a
structural impossibility. Recorded as `P3-FSS-01` — worth revisiting when the
comparative copy is ratified, not worth redesigning now.

### Score: the typography says more than the status does

No band word, provenance on screen as five version fields, *"Based on 100% of
the assessment"*, and a candidate-status line. All correct.

But **the number is the largest element on the page by a wide margin**, in
display type. Type scale is a claim: it says *settled measurement*, while the
footnote says *candidate content, frozen for scientific review and not yet
approved*. The copy is honest and the typography is more confident than the copy.

Recorded as `P2-FSS-01`. **Not redesigned here** — and the fix is a weighting
decision, not a correction, because the number does deserve prominence.

---

## 4 · Responsive and accessibility findings

- **390** — all seven areas reflow to a single column with no horizontal
  overflow. The nav consumes the first screen (`P1-FSS-02`).
- **834** — the content column does not widen; the layout is effectively the
  390 layout centred.
- **1280** — content stays in a left-aligned column roughly half the viewport.
  Biotics in particular renders one card above a large void before the footer.
  **`P2-FSS-02`: the surface does not use the widths it is given.** Restraint is
  the right instinct; an unused half-screen is a different thing.
- Nav is a real `<nav aria-label="My Food System">` with text labels, so it is
  reachable and announceable. No icon-only controls anywhere.
- **Zero console errors across 78 captures**, against Account's one per capture.

---

## 5 · Design-system drift

Measured at 1280, inline `style` attributes on visible elements:

| surface | inline-styled elements |
|---|---|
| Account overview | **198** |
| Account meals | **240** |
| MFS Today | **10** |
| MFS Biotics | **11** |
| MFS Progress | **13** |
| MFS My Plan | **35** |

**A 10–20× difference.** And SVG count: Account overview 29 (rings, charts,
icons) against **0 on every My Food System area** — no icons, no rings, no
charts anywhere in Generation 4.

That cuts both ways and the audit records both: it is why the surface is calm,
and it is why it can read as austere. The repository-wide 616 hardcoded hex
values and 2,472 inline styles are overwhelmingly **not** in `components/fss/`.

---

## 6 · Keep / Evolve / Merge / Move / Retire

| area | disposition | why |
|---|---|---|
| **Today** | **KEEP** | Delivers its specification exactly: one focus, one action, one score, one date, one sentence. 1 standalone metric against Account overview's 19 |
| **Score** | **KEEP**, with `P2-FSS-01` | Honest about provenance and band absence; only the type scale overstates |
| **My Food** | **KEEP** | 19 cards but 9 headings — structured content, not density |
| **Biotics** | **KEEP** | The reference implementation of the permanent product rule. Education rich, personalisation structurally impossible |
| **My Plan** | **EVOLVE** (`P1-FSS-01`) | The one area out of family: 28 cards, 12 controls, 3.3× the height |
| **Progress** | **KEEP**, with `P3-FSS-01` | Gate 5 rendered faithfully, score last, caveats present |
| **Learn** | **KEEP** | Smallest footprint, does one job |

**Nothing retired. Nothing moved. One area evolved.**

---

## 7 · Generation 1 Account vs Generation 4 My Food System

### The measured contrast

| | Account overview | MFS Today |
|---|---|---|
| cards | 25 | 8 |
| standalone metrics | 19 | **1** |
| SVG (rings/charts/icons) | 29 | **0** |
| inline-styled elements | 198 | **10** |
| page height | 2,223px | 1,011px |
| console errors per capture | 1 | **0** |
| P0 findings | **5** | **0** |

### The behavioural contrast, which matters more than the counts

**When data is missing, the two generations do opposite things.**

Account fabricates: a meal under "Today's Meals" that was never eaten; per-Biotic
values `71 / 23 / 48` when `bioticsProfile` is undefined; a prediction of
"8–12 points within three weeks" attributed to a report that does not exist.

My Food System refuses, by name, and says so:

> **We are not going to guess**
> *Your Food System is here, and we are not showing it, because part of what it
> is made of did not load. Showing you some of it would mean filling the gaps
> in, and the gaps are the part that has to be right.*
> `policy-version-unresolvable · system_7d81a938…`
> *Nothing has been deleted or changed.*

That is the whole difference in one screen. One generation treats absent data as
a presentation problem; the other treats it as a truth problem.

### Does Generation 4 deserve to become the north star?

**Yes — on the evidence, with two qualifications and one caution.**

**The evidence for.** It survived the exact scrutiny that produced five P0s on
Account and produced none. Every scientific boundary holds under render, not
merely in source. Its headline personalisation is genuinely derived, declines
the superlative Account asserts falsely, and describes *answers* rather than
*biology*. Its refusal state is the strongest single artefact in this audit.
Its design-system discipline is an order of magnitude better.

**Qualification 1 — it has not carried real load.** Every capture is a preview
route behind a fail-closed gate, with fixture weights and draft questions. It
has never served a paying member, held a purchased report, or rendered a Stripe
state. Account is worse partly because it has had to do more. Some of
Generation 4's calm is the calm of a surface with fewer obligations, and the
honest test comes when it inherits them.

**Qualification 2 — My Plan already shows the failure mode.** The one area with
the most real content is the one that drifted out of family. That is Account's
disease in miniature, in the newer codebase, and it is evidence that restraint
is a practice rather than a property of the architecture.

**The caution — do not read austerity as finished design.** Zero icons, zero
charts and an unused half-screen at 1280 are not virtues in themselves. The
north star is the *discipline*, not the current visual density. The redesign
should bring Account's visual ambition to Generation 4's truthfulness, not
flatten everything to the current Learn page.

> **Generation 4 earns the north star for its product model and its claims
> engineering. It has not yet earned it for its visual system, because its
> visual system has not yet been asked a hard question.**

---

## 8 · What this step did not do

No production UI repaired in either generation · no claims guard widened · no
refusal removed · no `/assessment` capture — the live Assessment product waits
until this comparison is accepted · no methodology, copy or schema change.

> Source inspection establishes possibility. Rendered evidence establishes
> reachability.
