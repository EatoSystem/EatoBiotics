# Reports — two documents, and only one of them can prove what it says

**Experience 0, step 7.** The question is what a Report should be now that My
Food System is the persistent operating product. The evidence answers it more
directly than expected, because **EatoBiotics already contains two Reports that
take opposite positions**, and one of them is the thing it sells.

> **The legacy Report is useful and cannot prove what it says.**
> **The canonical Report can prove everything it says and is not yet useful.**
>
> The gap between them is a content pack, not an architecture.

---

## 0 · The premise this step had to correct first

The brief described the report family as intentionally refused, source-mode
only. That is true of four routes and **false of the two that matter most**.
Read from `lib/v1-surface.ts`, verified by request:

| tier | route | status |
|---|---|---|
| **`V1_CORE_ROUTES:94`** | **`/assessment/report`** — the €49 Personal Food System Report | **live, sold, not refused** |
| **`FIXTURE_SELF_GATED_ROUTES:264`** | **`/demo/food-system-report`** — the canonical deterministic Report | **renders in preview** |
| `POST_V1_ROUTES` | `/report`, `/report-you`, `/report-mind`, `/report-family`, `/account/report/demo`, `/account/doctor-report`, `/stability/report` | **404**, all seven re-verified |
| `LEGACY_REDIRECT_ROUTES:223` | `/reports` | **308 → `/pricing`**, verified |

The classifier states it in its own comment: *"`/account/report/[id]` is the
weekly check-in report … **NOT** the €49 Personal Food System Report — that is
`/assessment/report`, which stays. No money path is refused here."*

**No refusal was removed and no screenshot was manufactured for a refused
route.**

---

## 1 · Corpus, and the one thing the capture does NOT establish

| | |
|---|---|
| rows | **12** — 3 answer sheets × 3 widths (paid) + 3 widths (canonical) |
| committed citations | 5 · archive-only 7 |
| clock | `2026-10-03T09:00:00.000Z` |
| writes | **none reached a server** — aborted at the browser, canonical preview proved write-free by render |

### The correction that matters most in this step

I expected the harness flag to render the document a paying customer receives.
**It does not**, and `app/assessment/report/page.tsx:128` says so in its own
words:

> `FullReportClient` *"renders tier-shaped content with none of their answers in
> it; showing it would look like fulfilment while **quietly substituting someone
> else's report for theirs**."*

A settled Stripe session returns **`PaidReportClient`** with a `DeepReport` read
from Supabase. This audit cannot read that and will not fabricate one.

So the evidence splits three ways, and the audit keeps them apart:

| | what it is | mode |
|---|---|---|
| `FullReportClient` | the **dev-flow** Report — reachable only through `isUnverifiedPaidFlowAllowed` and through `/assessment/demo` (POST_V1, refused). **Not production-reachable.** | **rendered** |
| `PaidReportClient` + `buildFoodSystemReport` | the **production paid** document | **source** — pinned, not rendered |
| `CanonicalReportDocument` | the Phase 4B-S2 candidate | **rendered** |

### The flag is proved to change reachability, not content

A capture reached through a flag is only evidence if the flag cannot have
altered what the document claims. `audit-capture-reports.spec.ts` asserts it
structurally: neither report client nor any of the five generators
(`assessment-report`, `fallback-paid-report`, `build-food-system-report`,
`subscores`, `framing`) may read the flag at all, and the page consults it
exactly once, to choose a branch.

---

## 2 · P0 / P1 / P2 findings

Each states plainly whether it is **currently reachable** or **unreachable
legacy/dev source** — the distinction this step was told to hold, and the one
this programme has twice got wrong by assuming.

### `P0-SCIENCE-06` · The production paid Report ranks the member's Biotic pathways — **REACHABLE**

Four hops, all in production code, ending at a route a paying customer opens:

```
build-food-system-report.ts:457-469   composes `dominantPattern`
  → systemSnapshot.dominantPattern    (:513)
  → food-system-section.tsx:398       renders it
  → PaidReportClient                  renders FoodSystemSection
  → /assessment/report                V1_CORE, settled Stripe session
```

The two sentences it composes:

> *"Your answers describe an uneven system — **Prebiotics is well supported while
> Probiotics is thinner**."*

> *"Your answers suggest **Prebiotics is your strongest pathway**, and that
> **Probiotics is where your answers point to the clearest first step**."*

`PATHWAY_LABEL` (`lib/report/subscores.ts:52`) maps the keys straight to
"Prebiotics" / "Probiotics" / "Postbiotics", and `paid-report-client.tsx:681`
passes `PATHWAY_LABEL[priorityPathway]` into the membership CTA as well.

**This is the identical construct canonical decision D1 has just ruled must be
retired from `/assessment/results`** — *"a personalised comparative Biotic
verdict is a personal Biotic state whether or not a number is shown."* On the
money path.

*Source-mode, deliberately: rendering it needs a `DeepReport` from Supabase.
Pinned at source by `audit-capture-reports.spec.ts` so the claim cannot rot.*

### `P0-SCIENCE-07` · The dev-flow Report renders three per-Biotic scores out of 100
#### **P0 — latent production hazard · NOT currently customer-reachable**

> **CORRECTED AT 0R-6R.** The heading is accurate about *this renderer* and wrong
> about *the construct*: the identical construct was live on the €49
> `/assessment/report` in `food-system-section.tsx` (three forms), in
> `food-system-pdf.tsx`'s body figure, and in `report-pdf.tsx`'s "Your 3 Biotics"
> bars — eleven sites in all, folded into this same finding by ruling and closed
> at the canonical Report type. See the 0R-6R close record in
> [`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md).
> This section is left as measured; the correction is the record.

Rendered, at 1280, under **"PILLAR BREAKDOWN · Your Pillar Deep-Dives"**:

> **Probiotics 33/100** · **Prebiotics 50/100** · **Postbiotics 61/100**
> *"**Your probiotics score** has clear room to grow — the food recommendations
> below are your most direct lever."* (and the same for the other two)

A personal per-Biotic **number**, a **denominator**, and a **possessive** — three
of the forms the permanent product rule names explicitly, in one block, three
times over. Plus *"Starting with your areas of greatest opportunity"* (ranking)
and *"Simple substitutions targeted at **your weakest pillar**"*.

**Reachability, stated precisely.** `FullReportClient` is rendered only by
`app/assessment/report/page.tsx:45` under the dev-only unverified flow, and by
`/assessment/demo`, which is POST_V1 and 404s. **No customer can reach it
today.**

It is recorded as P0 anyway, for one reason: it sits on the €49 route, one
environment variable from being served. That is the `menu-scan` / `forecast`
reactivation-hazard class — on the money path, which is where it matters most.

### `P0-SCIENCE-08` · Mechanistic microbiological claims in customer-facing food copy — **dev-flow rendered, production shared**

Rendered in the food list and swaps:

> *"Top fibre and resistant starch source — **maximises short-chain fatty acid
> production**."* · *"Hundreds of millions of **live bacteria per gram; direct
> seeding of the microbiome**."* · *"Inulin-rich prebiotic that **selectively
> feeds the most beneficial gut bacteria**."* · *"**Flavanols feed Lactobacillus
> and Bifidobacterium**."* · *"glutamate **supports gut barrier directly**."* ·
> *"Within 30 minutes is close enough to **stabilise your gut rhythm**."*

Named genera, quantified microbial loads, asserted metabolite production and a
bodily outcome. These are **general food claims rather than personal state**, so
they are a different class from `P0-SCIENCE-06/07` — but they are considerably
stronger than the hedged *"associated with" / "typically"* register the Twin's
education uses and than `/biotics` was corrected to in Gate 3.7.

The food tool data is shared with the production report path, so this is **not**
confined to the dev flow. **Flagged for scientific review, not ruled on here.**

### `P1-VOCAB-01` · "Heal" is rendered as a customer-facing pathway tag — **dev-flow rendered, production shared**

Every food in the list carries two of **Feed · Seed · Heal**. CLAUDE.md is
explicit: *"'Heal' is a stored key, never a customer-facing pathway name."* The
customer-facing third action is **Rejuvenate**.

`lib/report/addon-lens.ts:12` confirms the keys travel through the production
lens chapter too (*"Feed/Seed/Heal scores and the priority-pathway ranking"*).
A rendering defect rather than a claims one, and a cheap fix.

### `P0-GUARD-02` · No report file is in the Biotic claims corpus — **the third instance**

`GUARDED_SURFACES` (`tests/unit/biotic-claims.test.ts:313`) is
`LIVE + REACHABLE + PROMPT + EMAIL + CANDIDATE + AGENT_LOOP`. **There is no
report corpus**, and no report component or generator appears in any of the six.

The same shape as `P0-GUARD-01` (Account) and the Assessment gap found in step 5:
the guard exists, works, and points elsewhere. This is its third surface, and the
first one that is sold.

**Not widened here.** D1's step 1 widens the corpus; this entry says the
widening must include the report family, or the ruling will land on two of the
three surfaces that carry the construct.

### `P2-REPORT-01` · The canonical Report currently says one sentence six times — **preview only**

Rendered at 1280, the whole document is **2,465px and 18 distinct content
lines**, of which this one appears **six times**:

> *"You told us energy is what you most want to work on."*

Once under "What you told us", once under "WHERE TO START", and once in **each of
the four weeks** of "Your next 30 days" — WEEK 1 Try, WEEK 2 Notice, WEEK 3
Adjust, WEEK 4 Repeat.

**This is structural, not a thin fixture.** `compose.ts:362-392` builds all four
loop steps from the *same* `choice.questionId` and `choice.value`, varying only
the beat, and resolves the reviewed sentence from the pack each time. With
`bioticsLanguage` and `specificFoods` both withheld, that sentence is nearly all
the content there is.

**It is not a defect of the architecture — it is the architecture working.**
Every sentence is reviewed, bound and provable, and the pack has one sentence per
answer. The consequence is that the candidate Report is honest and not yet worth
€49.

Nothing is wired to it, so this is a **readiness** finding, not a live one. It
belongs beside the `constraints-known` pre-activation blocker already in
CLAUDE.md, which this audit neither discharges nor weakens.

---

## 3 · The source inventory — two families, kept apart

**13,246 lines under `lib/report/**` alone**, plus the components.

### Legacy

| module | lines | role |
|---|---|---|
| `components/report/demo-report.tsx` | **2,357** | imported by all four refused `/report*` pages |
| `components/report/food-system-section.tsx` | 869 | renders `dominantPattern` — `P0-SCIENCE-06` |
| `lib/report/addon-lens.ts` | 858 | the purchased add-on chapter |
| `lib/report/build-food-system-report.ts` | 765 | **the pathway ranking lives here** |
| `components/assessment/paid-report-client.tsx` | 715 | **the production paid document** |
| `lib/assessment-report.ts` | 651 | `generateFullReport` — the dev-flow generator |
| `components/assessment/full-report-client.tsx` | 632 | **`P0-SCIENCE-07`** |
| `lib/fallback-paid-report.ts` | 527 | *"what a paying customer actually receives"* when generation fails |
| `components/report/lens-section.tsx` · `food-tool.tsx` · `report-section.tsx` | 398 | the chapter furniture |
| `components/assessment/combined-report.tsx` | 259 | |
| `lib/claude-report.ts` · `subscores.ts` · `framing.ts` · `generate-report-prompt.ts` | 550 | types, ranking, framing, the AI prompt |

### Canonical — 4,678 lines

`lib/report/deterministic/*` (composer, content pack, capabilities, safety,
serialise, report-bank, permissions, priority, proposition, canonical-order) ·
`narrative/*` (authoring contract, lexicons, validate, rewriter, packs) ·
`persisted/*` (write-once Report, wire formats, digests) · `presentation/*`
(model, keys, frozen-copy, preview-policy) · `components/report/canonical/*`.

### PDF — inventory and claims only, per scope

`lib/pdf/report-pdf.tsx` (1,103) · `lib/report/pdf-access.ts` ·
`components/report/canonical/print-markers.ts`. It carries
`PATHWAY_PDF_COLOR` — a Biotic→swatch map including a fourth `synbiotic` key —
so **the PDF inherits whatever Biotic content the web Report carries, and
colour-codes by pathway**. No divergence in claims was found between the two
delivery formats. **Print typography and layout were not audited**, and this
step must not be read as having covered them.

### Account-side derivatives

`report-bridge-card.tsx` · `practitioner-report-card.tsx` · the weekly-report
block already recorded as `P0-TRUST-02`.

---

## 4 · The design inventory — **source-derived, not rendered**, except where stated

| | legacy (rendered, dev-flow) | canonical (rendered) |
|---|---|---|
| height @1280 | **5,215px** | **2,465px** |
| distinct content lines | many | **18** |
| major blocks | pillar breakdown · 12 foods · 5 swaps · retest date · 30-day plan · premium add-ons · CTAs | what you told us · where to start · 30 days · closing quotation |
| rings / bars / scores | three per-Biotic scores + ring | **none** |
| chart furniture | badges, pathway tags, numbered lists | typographic only |

From source: the legacy family uses the same inline-style and hardcoded-hex
idiom measured across the repository (66 tokens / 616 hex / 2,472 inline
styles); the canonical renderer is built on structural keys and a frozen copy
registry, with print markers rather than ad-hoc page breaks.

### The canonical Report's *design* is not the problem — observed, not inferred

Rendered at 1280, it is a dark serif cover band, a green-rule section heading, a
lifted "WHERE TO START" card, and four week cards each carrying a beat chip
(Try · Notice · Adjust · Repeat). Generous whitespace, one idea per block, no
charts, no rings, no score. **It already looks like a publication rather than a
dashboard** — which is precisely the editorial register §8's hypothesis asks for.

That matters for the disposition. `P2-REPORT-01` is a finding about what the
document *says*, not how it looks, and the correct response is to commission
reviewed content — **not** to redesign a renderer that is doing its job.

**Mobile assumptions** are discernible only for the two rendered surfaces, and
both behave at 390.

---

## 5 · Keep · Evolve · Merge · Move · Retire

Destinations are named. Nothing is kept because it was expensive to build.

| concept | where it lives | disposition | destination |
|---|---|---|---|
| Repeated overall score | both clients | **MERGE** — one rendering | → Score |
| Per-Biotic scores / bars | `full-report-client` **— and, found at 0R-6R, `food-system-section`, `food-system-pdf` and `report-pdf`** | **RETIRED at 0R-6R** — `P0-SCIENCE-07`, closed at the canonical type | — |
| Strongest / weakest pathway ranking | `build-food-system-report` | **RETIRED at 0R-6R** — `P0-SCIENCE-06`; `orderedByNeed` deleted, six consumers de-ranked, nothing replaced it | — |
| Score projections | legacy prose | **RETIRE** | — |
| Mechanistic food claims | food tool data | **EVOLVE** — rewrite to the hedged register, pending review | → Learn / Report |
| 12 foods, ranked | `build-food-system-report` | **EVOLVE** — keep the list, drop "ranked for your profile" | → optional Report |
| 5 swaps | `full-report-client` | **MOVE** | → My Plan |
| 30-day plan | both | **MOVE** | → My Plan (acting is persistent, not editorial) |
| Retest date | legacy | **MOVE** | → Progress |
| "What you told us" | canonical | **KEEP** — the single most honest block in either document | → optional Report |
| The person's own words, quoted | canonical | **KEEP** | → optional Report |
| Symptom maps · body/organ interpretation | not present in either | — | — |
| Deep insights · prescriptions · causal explanation | legacy prose | **RETIRE** | — |
| Family aggregation | `/report-family` (refused) | **RETIRE** | — |
| Mind-specific claims | `/report-mind` (refused) | **RETIRE** | — |
| Add-on lens chapters | `addon-lens.ts` | **HOLD** — tied to products not currently sold | — |
| Premium add-on CTAs | `report-premium-addons` | **RETIRE** — they sell retired tiers | — |
| Membership CTA | `report-membership-cta` | **KEEP** | → optional Report close |
| PDF delivery | `report-pdf.tsx` | **KEEP** — a document people keep should be keepable | → optional Report |
| The four refused `/report*` pages + `demo-report.tsx` (2,357 lines) | | **RETIRE** — superseded product doors, none reachable | — |

---

## 6 · Report ↔ Assessment Results lineage

Step 5 found Results to be *"Generation 1's instinct — show everything we know —
applied to Generation 2's data."* The stronger claim holds: **Results is a Report
compressed onto a free page.**

| # | Results block | Report antecedent | future home |
|---|---|---|---|
| 1 | Score reveal | report hero + ring | **immediate reveal** |
| 2 | Profile | `systemSnapshot.oneLine` | **Score** (one line) |
| 3 | Three Biotics | pillar breakdown | **Biotics** (education) |
| 4 | **Pattern ranking** | **`dominantPattern`** — `P0-TRUST-04` ≡ `P0-SCIENCE-06` | **Retire**, under D1 |
| 5 | One action | `mainLever` | **immediate reveal** |
| 6 | Share card | — (Results-native) | later moment |
| 7 | Second score card | duplicate hero | **merge into 1** |
| 8 | Contribute opt-in | — | **Account** |
| 9 | €49 CTA | the offer itself | considered offer surface |
| 10 | "A few more ideas" | 12 foods / 5 swaps | **My Plan** |
| 11 | Save results | delivery | **Account** |
| 12 | Explore another focus | add-on lens chapters | **Retire** until routes exist |
| 13 | Retake | retest date | **Today / Progress** |

**Nine of thirteen have a Report antecedent.** Blocks 4 and 10 are the same
generators. That is why Results is 6,313px: it is a report architecture on a page
that was supposed to be a reveal.

---

## 7 · Report ↔ My Food System overlap

| | legacy Report | Gen 4 area |
|---|---|---|
| overall score + band | yes | `score` |
| per-domain / per-pathway standing | yes, **ranked** | `score` — unranked, candidate-labelled |
| what to do now | 30-day plan, 5 swaps | `my-plan` |
| food guidance | 12 ranked foods | `my-food` |
| Biotics explanation | pillar breakdown | `biotics` — education only |
| change over time | retest date | `progress` |
| education | mechanistic food notes | `learn` — hedged |

**Six of seven areas are duplicated by the legacy Report**, and on every one of
them Gen 4 takes the more careful position. The canonical Report duplicates
almost nothing — which is the clearest signal in this audit that it was designed
*after* the seven areas existed.

---

## 8 · The future job of the Report

> **What becomes more useful as a deliberate, readable document than as
> persistent UI?**

Three things, on the evidence, and only three:

1. **Reflection the person recognises as their own.** The canonical Report's
   "What you told us" and its closing quotation of the person's own words are the
   only blocks in either document that no persistent surface does better. A
   dashboard shows state; a document can say *this is what you told us, and here
   is what we did with it.*
2. **A periodic account of change** that is deliberately *not* always-on, so it
   can take a position a live surface should not take between updates.
3. **Something keepable** — a PDF a person can file, print or show someone.

Everything else the legacy Report does, the seven areas do, more honestly.

**The hypothesis survives, narrowed:**

> A premium personal editorial publication that periodically explains the state
> of the person's observable food system, what changed, what matters and what to
> consider next — grounded entirely in deterministic product truth.

With one test attached, because §2's `P2-REPORT-01` shows how easily it fails:
**anything a person needs *between* Reports belongs in the seven areas, not in
the document.** A Report that answers "what should I do today" has become a
second My Food System.

And one condition the evidence makes unavoidable:

> **The architecture to publish an honest Report exists. The reviewed content to
> fill one does not.** The canonical Report is not blocked on design,
> persistence, provenance or safety — all four are built. It is blocked on a
> content pack, and on the capability gates that currently withhold almost
> everything it could say.

**And the gates are not internal preferences.** `lib/report/deterministic/capabilities.ts`
reads them from `SPECIALIST_GATES` in the frozen Science Contract, and names what
each is waiting on: `specificFoods` on *"a dietitian and an EU allergen
taxonomy"*, **`bioticsLanguage` on *"Irish/EU health-claims law"***, `safetyNetting`
on *"GP/dietetic sign-off"*. All three are OPEN, and the module is explicit that
*"a rollout switch and a specialist's approval are different kinds of thing"* —
`reportCapabilityEnabled` takes no parameters *"by construction"*, so there is no
injection point.

That reframes the whole comparison. The legacy Report names the Biotics freely;
the canonical Report cannot, because the review that would permit it has not
happened. **The two documents are not two design opinions — one of them is
waiting on a lawyer and a dietitian, and the other is not waiting on anyone.**

So this is a commissioning problem, not an engineering one, and naming it as an
engineering one would be the same mistake step 5 named for the assessment
handoff.

---

## 9 · Documentation classification

| document | lines | classification |
|---|---|---|
| `docs/assessment-report-improvement-brief-for-claude.md` | 1,038 | **historical, self-labelled** — it carries its own editor's note recording three findings that did not hold. Keep as a record; do not build from it |
| `docs/claude-code-assessment-report-upgrade-prompt.md` | 369 | **superseded** — an upgrade prompt for the legacy generator chain this audit recommends retiring |
| `docs/fss/FSS_V1_CLAIMS_BOUNDARY.md` | 284 | **canonical** — §6 and §8 govern both Reports |
| `docs/phase-3a-*` (3 files) | — | **canonical for the canonical Report** — the science contract, evidence pack and question-bank review the deterministic composer implements |

---

## 10 · What this step did not do

No production UI repaired · no route classification changed · no refusal removed
· no claims guard widened · the canonical Report **not** activated · Migrations
48 and 49 neither drafted, applied nor declared ready · the `constraints-known`
blocker untouched · no PDF print-design audit · no Twin capability moved into
Generation 4 · no Supabase read or write · no write reached any server.

> Source inspection establishes possibility. Rendered evidence establishes
> reachability.
