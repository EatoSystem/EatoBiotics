# EatoBiotics
## Food System Score™ v1.0 — Design Specification
### FINAL for scientific review. Design only — nothing has been implemented.

**Repository state:** unchanged. Working tree clean at `594e540`.

---

## 0. Decisions Register — Locked

These are settled by founder decision and are not reopened below.

| # | Decision |
|---|---|
| 1 | The Three Biotics are **permanently retained** as the scientific foundation of EatoBiotics |
| 2 | **No Biotic receives a personal numerical score.** The Five Domains are the scored layer |
| 3 | **Fermented Foods**, not Living Foods |
| 4 | **What You Notice** and **Your Food Context** are explicitly unscored; they may affect interpretation and Your Plan, never Score arithmetic |
| 5 | **Strict ISAPP definitions** for all three Biotics. The contract is **not** widened to fit colloquial usage |
| 6 | All Probiotics copy reviewed so fermented food is never equated with probiotic food or live microorganisms |
| 7 | **Your / My Food System Score™** is the fixed destination. The methodology must earn the name before it ships |
| 8 | The temporary 60-second experience **does not** produce a Food System Score™ |
| 9 | The blanket ban on "Food System Score" is replaced by a **lifecycle-aware vocabulary policy** (§11) |
| 10 | **Score Methodology Versioning** is a first-class requirement |
| 11 | **The general design rule** (§0.1) — measure what is observable; teach the science accurately; never let the educational concept pretend to be the measured variable |
| 12 | The five scored domains are **FSS-v1 Candidate Domains — frozen for review, NOT yet scientifically approved** |
| 13 | Phase 1 rewords implied scientific classifications toward observable food behaviours. It does **not** redesign the assessment or the scoring arithmetic |

---

## 0.1 The General Design Rule

**This is the rule the whole architecture reduces to, and it should be quoted
in the contract:**

> **Measure what the assessment can observe.
> Teach the biology accurately.
> Never make the educational concept pretend to be the measured variable.**

Applied to each Biotic:

| | We measure | We teach |
|---|---|---|
| **Prebiotics** | fibre-rich plant food intake | what a prebiotic actually is |
| **Probiotics** | fermented-food intake | what qualifies as a probiotic |
| **Postbiotics** | *nothing personal* | the concept, accurately |

The rule also protects against an overcorrection worth naming: **Fibre ≠
Prebiotic must not make Prebiotics disappear from the product.** The food
behaviour stays measured under Plants & Fibre; the science stays taught under
Prebiotics. Both survive, each doing its own job.

---

## 0.2 Candidate Domain Status

> ### FSS-v1 Candidate Domains — Frozen for Review, Not Yet Scientifically Approved
>
> **Diversity · Plants & Fibre · Fermented Foods · Food Quality · Meal Rhythm**

Frozen means no further architectural iteration. It does **not** mean
validated. This label exists so that a product-architecture decision is never
mistaken for scientific approval — including by us, later, when the origin of
the list has faded.

---

## 1. The Architecture

```
FOUNDATION       The Three Biotics
                 Prebiotics · Probiotics · Postbiotics
                 Equal status. No personal number on any of them.

MEASUREMENT      Your Food System Score™
                   Diversity · Plants & Fibre · Fermented Foods
                   Food Quality · Meal Rhythm

OBSERVATION      What You Notice          unscored
CONTEXT          Your Food Context        unscored
ACTION           Feed. Seed. Rejuvenate.
PERSONALISATION  Your Plan
LOOP             Assess → Understand → Act → Reassess → Learn → Improve
```

**The Five Domains do not replace the Three Biotics — they solve a different
problem.** The Biotics establish the scientific foundation and intellectual
identity. The Domains are what a questionnaire can credibly quantify.
Feed · Seed · Rejuvenate converts learning into action. Three layers, three
jobs, no overlap.

---

## 2. The Science Layer — Strict Definitions (Decision 5)

**Adopted as normative.** Paraphrased faithfully below; **exact wording and
citations to be verified against source during review** before they enter the
contract.

| Biotic | Definition (ISAPP consensus) |
|---|---|
| **Prebiotics** | A substrate that is selectively utilised by host microorganisms, conferring a health benefit. *(ISAPP 2017)* |
| **Probiotics** | Live microorganisms that, when administered in adequate amounts, confer a health benefit on the host. *(FAO/WHO 2001; ISAPP 2014)* |
| **Postbiotics** | A preparation of inanimate microorganisms and/or their components that confers a health benefit on the host. *(ISAPP 2021)* |

**"What microorganisms leave behind" is rejected as a definition of
Postbiotics.** Under the strict definition, microbial metabolites produced
*in situ* are not automatically postbiotics — the term denotes a *preparation*
with a *demonstrated* benefit. The phrase may only appear as explanation of an
**adjacent concept**, clearly separated from the definition, never as the
definition itself.

### 2.1 What the strict definitions cost — enumerated now, not discovered later

Decision 5 is right, and it binds more widely than the fermented-food copy.
Each of the following is a consequence, not an objection:

**a) Fermented food ≠ probiotic.** Most fermented foods contain undefined,
uncharacterised microbial communities without a demonstrated health benefit at
a defined dose. They therefore do not meet the probiotic definition. This is
Decision 6, and §12 shows it is already shipping.

**b) Fibre ≠ prebiotic.** Most dietary fibre is not a prebiotic: the definition
requires *selective utilisation* plus a *conferred benefit*, which is
substrate-specific and not a property of fibre in general. Consequences:

- The domain name **Plants & Fibre is correct** and should not drift toward
  "Prebiotics" — its current name is already the safe one.
- **q6** asks about "prebiotic-rich foods — oats, garlic, onion, leeks,
  bananas, or asparagus". Under the strict definition this is a *commonly
  described as* claim, not an established one for each food. **Recommend
  rewording q6's stem** to describe the foods without asserting the
  classification (e.g. "foods often associated with feeding gut bacteria").
  Flagged for review; it is the only existing item where strict definitions
  touch the wording.

**c) EatoBiotics still teaches metabolites and fermentation — under their own
names.** Short-chain fatty acids, fermentation products and microbiome activity
are legitimate, interesting and teachable. They are simply **not labelled
Postbiotics** unless they meet the definition. This separation makes the
education better, not thinner.

**d) The Postbiotics pillar becomes the clearest of the three.** It teaches a
precisely defined concept and makes no personal claim. A foundation that says
"here is what this means, and here is what we do not claim to measure in you"
is more credible than one carrying a number it cannot justify.

### 2.2 Customer-facing framing

> **Prebiotics** — what feeds your microbes.
> **Probiotics** — live microorganisms with a demonstrated benefit.
> **Postbiotics** — preparations of inanimate microorganisms, or their
> components, with a demonstrated benefit.
>
> EatoBiotics teaches the science of all three. The assessment measures **food
> patterns** — not your personal prebiotic, probiotic or postbiotic state.

---

## 3. Definitions — The Score

**Food System Score™**

> A structured summary of the food patterns you report: how varied and how
> processed your food is, how often fermented foods appear, and the rhythm you
> eat to.

**Must not be presented as, or implied to be:** a diagnosis · disease risk · a
prediction · a measure of the microbiome, its composition, activity or
metabolites · a biomarker · a clinical, metabolic or immune state · a validated
computational model of a person · a measure of health, fitness or biological
age · a judgement of the person or their circumstances · comparable across
methodology versions without an explicit rule (§9).

---

## 4. The Five Scored Domains

### D1 · Diversity
Range and rotation of plant foods over a typical week.
**Items** q1, q2, q3 — unchanged.
**Explanatory link** A food pattern associated with the prebiotic concept.
**Does not claim** Microbial diversity, richness, or microbiome composition.

### D2 · Plants & Fibre
How often fibre-rich whole plant foods appear.
**Items** q4, q6 — q6 stem reworded per §2.1(b).
**Explanatory link** A food pattern associated with the prebiotic concept.
**Must not claim** That fibre *is* prebiotic, or a prebiotic intake quantity.

### D3 · Fermented Foods
How regularly and how variously fermented foods appear.
**Items** q7, q8, q9 — unchanged.
**Explanatory link** A food pattern associated with the probiotic concept —
**never an equivalence**.
**Must not claim** Live microorganism content, colony counts, colonisation,
probiotic status, or probiotic effect.

### D4 · Food Quality
Balance between whole/minimally processed and ultra-processed foods.
**Items** q5 + **fq2, fq3** (§5.2).
**Explanatory link** None to a single Biotic.
**Does not claim** Nutritional adequacy, calories or macronutrients.

### D5 · Meal Rhythm
Regularity, timing and structure of eating across a typical week.
**Items** q10, q11, q12 + optional **mr4**.
**Explanatory link** None to a single Biotic. **Must never be linked to
Postbiotics** — that is the prohibited `result-from` / `correspond-to`
inference.
**Does not claim** Circadian, metabolic or digestive-function effects.

---

## 5. Items

### 5.1 Existing — every one keeps its options and 0–3 values

| Item | Today | v1.0 |
|---|---|---|
| q1, q2, q3 | Prebiotics | **D1 Diversity** |
| q4, q6 | Prebiotics | **D2 Plants & Fibre** *(q6 stem reworded)* |
| q5 | Prebiotics | **D4 Food Quality** |
| q7, q8, q9 | Probiotics | **D3 Fermented Foods** |
| q10, q11, q12 | Postbiotics | **D5 Meal Rhythm** |
| q13, q14, q15 | Postbiotics | **What You Notice — unscored** |

A re-bucketing, not a rewrite. Only q6's stem changes, and only because strict
definitions require it.

### 5.2 New items — drafts for review

Same four-option, 0–3 format and voice.

**fq2 · Food Quality** — *"In a typical week, how much of what you eat is
prepared from whole ingredients rather than ready-made?"*
0 Mostly ready-made · 1 A mix, leaning ready-made · 2 A mix, leaning
home-prepared · 3 Almost entirely from whole ingredients

**fq3 · Food Quality** — *"How often do sweetened drinks, confectionery or
packaged snacks feature in your day?"*
0 Several times a day · 1 Most days · 2 A few times a week · 3 Rarely

**mr4 · Meal Rhythm (optional)** — *"How often does a typical main meal include
vegetables, a protein source and a whole-food carbohydrate together?"*
0 Rarely · 1 Sometimes · 2 Most meals · 3 Nearly always

**Your Food Context — unscored (fc1–fc4):** time and energy to prepare food on
a weekday · affordability of the food you would like to eat · ease of getting
fresh food where you live · cooking facilities and confidence.
**Review these specifically for tone** — they ask about circumstances, not
choices, and must not imply fault.

**L1 ≈ 20 items**, 3–4 minutes. Do not exceed ~20 without evidence.

---

## 6. Unscored Layers (Decision 4)

**Normative, and belongs in the contract rather than a design note:**

> **What You Notice does not contribute to Your Food System Score™.**
> **Your Food Context does not contribute to Your Food System Score™.**

They contribute to interpretation → personalisation → recommendations → Plan.

**What You Notice** (q13–q15) — outcomes, not inputs. Scoring them means two
people with identical habits score differently because one feels worse, making
the number uninterpretable and reading as a health verdict.

**Your Food Context** (fc1–fc4) — largely not chosen. *Nobody should receive a
lower Food System Score because healthy food is expensive where they live* —
while EatoBiotics should absolutely know it when building an achievable plan.
This is the rule most likely to come under later pressure ("we have the data"),
which is precisely why it is contractual.

---

## 7. Scoring Methodology — `fss-v1.0`

```
itemValue(i)    ∈ {0,1,2,3}                                  unchanged
domainScore(d)  = round( mean(itemValues(d)) / 3 × 100 )     // 0..100
FoodSystemScore = round( Σ w[d] × domainScore(d) )           // Σ w[d] = 1
```

**No floor.** `Math.max(n, 20)` is removed; 0 must be reachable because the
scale is presented as 0–100. People are protected by band copy and tone, not by
inflating the number.

**The Biotics appear nowhere in this function.** They are not weighting
buckets. This is what the separation buys.

**Weights — declared, not emergent:**

```
FSS_WEIGHTS_V1 = { diversity: .20, plantsAndFibre: .20,
                   fermentedFoods: .20, foodQuality: .20, mealRhythm: .20 }
```

Equal for v1.0, as an exported constant with a stated rationale: no evidence
base ranks these five against each other, and equal weighting makes no claim
that would have to be defended. Evidence-based weighting is a v2.0 question
requiring a named source per weight.

**Missing data.** A domain with <60% of items answered returns `insufficient`,
never 0. **If any scored domain is `insufficient`, the Score is withheld** and
domains are shown alone with what is missing named. `completeness` always
displayed. **No confidence interval** — it would imply sampling properties this
instrument does not have.

**Bands.** Two pre-existing problems to fix: labels are quality judgements
("Fair", "Getting Started"), and **four competing `getScoreBand`
implementations exist** (`lib/scoring.ts:12`, `dashboard-client-data.ts:257`,
`analyse/result-builder.tsx:96`, `share-client.tsx:88`). Consolidate to one;
proposed neutral labels for review: 0–19 *Early days* · 20–39 *Building* ·
40–59 *Developing* · 60–79 *Strong* · 80–100 *Thriving*.

---

## 8. Presentation Contract (normative)

**Must:** show the Three Biotics with equal visual status and no number · show
the five domains as the only scored dimensions · show the Score with its method
version and completeness · express domain↔Biotic relationships as explanatory
text only.

**Must not:** attach a number to any Biotic, anywhere, including share cards,
PDFs and email · label a domain with a Biotic name, or a Biotic with a domain
number · attach a number to Feed, Seed or Rejuvenate · render a Score when any
scored domain is `insufficient` · derive anything in the Score from What You
Notice or Your Food Context · equate fermented food with probiotics, or fibre
with prebiotics.

---

## 9. Provenance and Versioning (Decision 10)

```ts
interface ScoreProvenance {
  methodVersion: string          // "fss-v1.0"
  questionSetVersion: string
  domainSetVersion: string
  calculationVersion: string
  interpretationVersion: string
}
```

Every stored score carries it. Today's model is stamped `fss-v0` — not wrong,
just earlier.

**Comparability rule.** Directly comparable only when `methodVersion` matches.
Across versions, show both, labelled, and state that the method changed — never
a trend line through a discontinuity. A `COMPARABLE_METHODS` allowlist may
permit pairs where a change was provably non-substantive (an
`interpretationVersion`-only bump).

---

## 10. Science Contract — `science-contract-v1.1`, additive

Nothing is weakened. `AGGREGATION_EVIDENCE_RULE`,
`REPORT_COMPOSITION_BOUNDARY` and `POSTBIOTICS_INFERENCE_BOUNDARY` are
unchanged — and Decision 5 means `POSTBIOTICS_INFERENCE_BOUNDARY`'s strict
definition is now the product's definition too, closing the gap rather than
widening the rule.

```ts
export const BIOTIC_DEFINITIONS = {
  prebiotics:  "A substrate selectively utilised by host microorganisms, conferring a health benefit.",
  probiotics:  "Live microorganisms that, in adequate amounts, confer a health benefit on the host.",
  postbiotics: "A preparation of inanimate microorganisms and/or their components that confers a health benefit on the host.",
  source: "ISAPP consensus definitions — verbatim wording and citations to be confirmed in review",
  nonEquivalences: [
    "fermented-food is not probiotic",
    "dietary-fibre is not prebiotic",
    "microbial-metabolite is not postbiotic",
  ],
  noBioticCarriesAPersonalScore: true,
} as const

export const FOOD_SYSTEM_SCORE_BOUNDARY = {
  definition:
    "A structured summary of the food patterns a person reports: how varied " +
    "and how processed their food is, how often fermented foods appear, and " +
    "the rhythm they eat to.",
  mustNotMean: [
    "diagnosis", "disease-risk", "prediction",
    "microbiome-composition", "microbial-activity", "microbial-metabolite",
    "biomarker", "clinical-state", "metabolic-state",
    "validated-system-model", "health", "fitness", "biological-age",
    "judgement-of-the-person",
  ],
  unscoredLayers: ["what-you-notice", "food-context"],
  unscoredLayersRule:
    "Neither observation nor context may contribute to the Score. They inform " +
    "interpretation, personalisation and the Plan only.",
} as const
```

**v1.1, not v2.0:** a version that *adds* constraints is a minor bump by this
codebase's own precedent. **If review ever concludes the aggregation rule must
be relaxed to permit the name, that is the signal the name is wrong.**

---

## 11. Transitional Vocabulary Policy (Decision 9)

Replaces the blanket ban. **"Food System Score" is not retired — it is
`transitional`**: forbidden on some surfaces, permitted on others, and
permitted on canonical surfaces only after Phase 5.

```ts
type TermStatus  = "retired" | "transitional" | "canonical" | "historical-only"
type SurfaceClass = "pre-launch" | "canonical" | "family" | "account"
                  | "historical" | "internal"
```

**Policy matrix for "Food System Score" / "Your Food System Score™":**

| Surface class | Now | After Phase 5 | After Phase 9 |
|---|---|---|---|
| **pre-launch** (`/enter`, L0) | **Forbidden** — must not claim the canonical score (Decision 8) | Forbidden | Retires with the page |
| **canonical** (L1 results, Report, PDF, email) | **Forbidden** — methodology not yet approved | **Required** | Required |
| **family** | **Forbidden** — no Family method exists | Forbidden | Permitted once a Family method ships |
| **account / longitudinal** | **Forbidden** | Permitted from Phase 7 | Permitted |
| **historical** (issued reports, sent email) | **Permitted, never rewritten** | Permitted | Permitted |
| **internal** (docs, tests, comments) | Permitted | Permitted | Permitted |

**The ~30 live occurrences classified.** They do not all get the same
treatment, which is the whole point of the policy:

| Occurrence | Class | Action now |
|---|---|---|
| `components/home/how-it-works.tsx:17` — *"See your Food System Score instantly"* — renders on **`/enter`** and `/` | pre-launch | **Change now.** It promises the canonical score from a page that cannot deliver it |
| `components/start-family/*` (11 files) — *"Family Food System Score"* | family | **Change now.** Claims a Family score that does not exist under this architecture |
| `components/account/retest-card.tsx:91` — share string | account | **Change now**, return at Phase 7 |
| `components/account/twin/*`, `food-systems/timeline`, `eatosystem/national-pulse` | account / marketing | Review individually against the matrix |
| Any issued report or sent email | historical | **Leave. Never rewrite** |

**The guard must become lifecycle-aware**: `retired-vocabulary.test.ts`'s
blanket regex is replaced by a policy lookup of (term, surface class, phase).
And the corpus must become comprehensive — **every one of these escaped because
the files are not in `tests/unit/customer-surfaces.ts`**. Proposal: derive the
corpus from what routes actually render, with an explicit justified exclusion
list. A hand-kept file list is itself the failure mode.

---

## 12. Live Defects — Fixable Now, Independent Of Everything Above

| # | Defect | Where | Fix |
|---|---|---|---|
| **1** | Pre-launch and Family surfaces claim a Food System Score that does not exist yet | §11 table | Apply the transitional policy |
| **2** | `Postbiotics — NN` is a personal postbiotic state as a number, which the strict definition and `POSTBIOTICS_INFERENCE_BOUNDARY` both forbid | results, reveal, report | Re-bucket per §5.1. Presentation-only; arithmetic untouched |
| **3** | Fermented foods equated with live microorganisms — *"Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir"* | `components/home/the-framework.tsx:43` — **live on the holding page and `/c/[country]`** — plus ~11 further "live cultures" claims | Reword to fermentation, not guaranteed live content (Decision 6) |

**On defect 3:** the claim is not reliably true of its own named examples —
sauerkraut and kimchi are frequently pasteurised, and several fermented foods
are heated before eating. **Correction pattern:** describe the *food* and the
*process*, never assert live content or probiotic status. E.g. *"Foods
transformed by fermentation — yoghurt, kefir, kimchi, sauerkraut, miso."*

---

## 13. Open Items for Scientific Review

1. **Verbatim ISAPP wording and citations** for the three definitions (§2).
2. **q6 stem rewording** (§2.1b) — the one existing item strict definitions touch.
3. **Weighting** — equal (v1.0) or evidence-based (v2.0), and what would justify the latter.
4. **The four new items and the Food Context set** — wording, and Food Context tone.
5. **Band labels** and consolidating four implementations to one.
6. **The 60% sufficiency threshold**, and withhold-vs-caveat.
7. **Minimum meaningful change** — required before any reassessment messaging.
8. **L0 naming.** "Food System Snapshot" is also banned
   (`retired-vocabulary.test.ts:171`); **"Food System Check"** is the standing
   proposal. Whatever it is called, it must not imply the canonical Score
   (Decision 8).
9. **Removing the 20-floor** means some users see lower numbers than today's
   model gives. Acceptable?

*(Resolved and removed: the Postbiotics definition gap — closed by Decision 5.)*

---

## 14. Phases

| Phase | Work | Gate |
|---|---|---|
| **1** | The three live defects (§12) + transitional policy + comprehensive guard corpus | None — do regardless |
| **2** | `ScoreProvenance`; today's model stamped `fss-v0` | Versioning before the model moves |
| **3** | Domain set, new items, q6 rewording | **Scientific sign-off** |
| **4** | `fss-v1.0`: weights, floor removal, missing-data, bands | **Scientific sign-off** |
| **5** | `science-contract-v1.1` additive; vocabulary authority updated | **Contract owner sign-off** |
| **6** | Implement behind a flag; both models computable; compared offline | No customer impact |
| **7** | Results / Report / Plan adopt it — **the name ships here** | — |
| **8** | Longitudinal + comparability | — |
| **9–10** | Family method; Enterprise methodology (separate products) | — |

Contract before implementation, deliberately: building first creates pressure
to bend the contract to fit what was built.

---

## 15. Acceptance Criteria

- The Three Biotics appear with equal visual status and **no personal number
  anywhere**, including share cards, PDFs and email.
- The three definitions in the product match the strict definitions in the
  contract, word for word.
- No surface equates fermented food with probiotics, fibre with prebiotics, or
  microbial metabolites with postbiotics.
- Every scored dimension names what its items actually ask.
- Weights are an explicit versioned constant.
- Neither What You Notice nor Your Food Context affects the Score.
- Every stored score carries `ScoreProvenance`.
- One band implementation; neutral labels.
- Term usage resolves through the lifecycle policy, not a blanket ban, and the
  guard corpus covers every rendering surface.
- Historical outputs unrewritten; no migration.

---

## 16. GO / NO-GO

- **GO — Phase 1.** Three live defects plus the transitional policy. Present
  tense, independent of the naming decision.
- **GO — Phase 2.** Provenance is cheap, durable, and must precede any model
  change.
- **CONDITIONAL GO — Phases 3–6**, on named scientific sign-off of the domain
  set, the items, the methodology and the contract addition.
- **NO-GO — any customer-visible "Food System Score™" before Phase 5.**

**The question has moved from *what should we call the score* to *what does
EatoBiotics measure, and how do the Three Biotics, the Food System Score and
Feed · Seed · Rejuvenate work together*. This specification answers the second
question. The name follows from it.**
