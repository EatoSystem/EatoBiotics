# The EatoBiotics Product Constitution — v1

**Architecture.** What the product is, what each layer may claim, and which
words mean which thing.

> **Companion document.** `docs/masterplan/PRODUCT_CONSTITUTION.md` is the
> *values* constitution — Articles I–VI, what the product is for and how it
> should behave toward people. This is the *architecture* constitution. Where
> they touch, values govern intent and this governs structure and claims.
> Neither supersedes the other, and neither is edited to accommodate the other
> without saying so.

---

## 0. The general design rule

Everything below reduces to three sentences, and they are the test to apply
when a new surface is written:

> **Measure what the assessment can observe.
> Teach the biology accurately.
> Never make the educational concept pretend to be the measured variable.**

Applied to each Biotic:

| | We measure | We teach |
|---|---|---|
| **Prebiotics** | fibre-rich plant food intake | what a prebiotic actually is |
| **Probiotics** | fermented-food intake | what qualifies as a probiotic |
| **Postbiotics** | *nothing personal* | the concept, accurately |

The rule also protects against the overcorrection: **fibre ≠ prebiotic must not
make Prebiotics disappear from the product.** The behaviour stays measured; the
science stays taught. Both survive, each doing its own job.

---

## 1. The architecture

```
VISION           Build the food system inside you —
                 and help build the food system around you.

BRAND            EatoBiotics — The Food System Inside You

SCIENCE          Prebiotics · Probiotics · Postbiotics
                 the foundation. Equal status. NO personal number, ever.

MEASUREMENT      Your Food System Score™
                 FSS-v1 candidate domains:
                   Diversity · Plants & Fibre · Fermented Foods
                   Food Quality · Meal Rhythm

UNSCORED         What You Notice      observations, reported back, never scored
                 Your Food Context    circumstances, shape the Plan, never the Score

ACTION           Feed. Seed. Rejuvenate.
                 verbs attached to recommendations. Never score names.

PERSONALISATION  Your Plan

LONGITUDINAL     My Food System

LOOP             Understand → Score → Explain → Prioritise →
                 Feed · Seed · Rejuvenate → Act → Reassess → Learn → Evolve

SCALE            100 → 1,000 → 10,000 → 100,000 →
                 1M → 10M → 100M Systems
```

### The two halves of the vision

**Inside you** is everything above the Scale line: the science, the
measurement, the actions, My Food System. It is what one person's food system
is and how it changes.

**Around you** is the Scale line. A hundred people with their own food systems
is not a hundred customers — it is the first version of a food system larger
than any of them, which is what EatoBiotics is ultimately for.

### Scale is above the measurement, and touches none of it

The ladder is a **growth and learning** structure. It is the order in which
EatoBiotics meets people and learns from them.

**It is referenced by no scoring document, and must not become one.** A cohort
is not a covariate. Nothing about which rung a person joined at may reach the
Food System Score, its domains, its weights, its bands or its interpretation —
the Score describes the food patterns somebody reported, and when they arrived
is not one of them.

Each rung is a real, counted population, never an aspiration. The campaign rule
holds at every scale: **counted, or absent.** A rung nobody has counted is an
invented number, and the product does not print those.

---

## 2. The five domains, and the label that travels with them

> ### FSS-v1 Candidate Domains — Frozen for Scientific Review, Not Yet Scientifically Approved
>
> **Diversity · Plants & Fibre · Fermented Foods · Food Quality · Meal Rhythm**

*Frozen* means no further architectural iteration. It does **not** mean
validated. This label exists so a product-architecture decision is never
mistaken for scientific approval — including by us, later, when the origin of
the list has faded.

**Implementing a candidate model does not validate it.** No surface, document,
commit message or prompt may describe these domains as validated, evidence-based
or clinically supported on the strength of the code existing.

---

## 3. What each layer may and may not claim

| Layer | May say | May never say |
|---|---|---|
| **Science** | what a prebiotic, probiotic or postbiotic is | that a person has a Prebiotics/Probiotics/Postbiotics *score*, level, state, or that theirs is high or low |
| **Measurement** | "your reported food patterns", a 0–100 Score with its method version and completeness | that the Score is a diagnosis, a biomarker, a microbiome measurement, a clinical or metabolic state, or a validated model of a person |
| **What You Notice** | "You reported…", "You told us…" | "Your body is…", "This shows…", "We found…" |
| **Your Food Context** | that it shapes the Plan | anything that lowers the Score |
| **Action** | what to do, and why it was chosen | any number attached to Feed, Seed or Rejuvenate |

Three equivalences are prohibited everywhere, permanently:

- a fermented food **is not** automatically a probiotic
- dietary fibre **is not** automatically a prebiotic
- a microbial metabolite **is not** a postbiotic

And one inference: **behaviour reported by a person is not biology observed
about them.** A changed answer is a changed answer.

---

## 4. Vocabulary

| Concept | The word | Not |
|---|---|---|
| The free product | **Food System Assessment** | Snapshot · Gut Score · Food System Score |
| What it produces | **Biotics Score™** | — |
| One meal | **Meal Biotics Score** | the person's Biotics Score |
| The third action | **Rejuvenate** | Regenerate (retired) · Heal (stored key only) |
| The programme | **100 Systems → 1,000 Systems → 10,000 Systems → …** (the Scale layer, §1) | First Course · First 100 · founder · founding · founding member · pioneer |

**Stored keys never move.** `heal`, `adding`, `feed`, `seed` and the cohort
`id` values are written into rows and analytics. Labels change; values written
into rows do not. Renaming a key silently zeroes history.

**"Your Food System Score™" is transitional, not retired.** It is forbidden on
pre-launch, canonical, family and account surfaces *today* because the
methodology is not approved; permitted on internal and historical surfaces; and
becomes required on canonical surfaces only after the contract phase. The
lifecycle policy is in `docs/fss/FSS_V1_DESIGN_SPEC.md` §11.

---

## 5. What this constitution does not authorise

Being written down here does not activate anything. Specifically, none of the
following is permitted on the strength of this document:

- activating candidate FSS arithmetic for any customer
- changing q6 or any question inside the methodology freeze
- changing the arithmetic behind any score a customer already has
- shipping "Your Food System Score™" on a canonical surface
- weakening the science contract so that a name or a piece of copy fits
- applying any migration, or writing to production Supabase
- describing a candidate domain as validated

Each of those has its own gate, and the gates are named in
`docs/fss/FSS_V1_DESIGN_SPEC.md` §14.

---

## 6. Provenance

Every score the product issues must carry which method produced it:
`fssMethodVersion`, `assessmentVersion`, `questionSetVersion`,
`calculationVersion`, `interpretationVersion`. Two scores are directly
comparable only when the method version matches.

This is not theoretical housekeeping. Today the 5-question waitlist flow and
the 15-question Assessment write the **same** `leads.overall_score` and
`leads.sub_scores` columns using **different formulas**, with nothing recording
which produced a given row — see `docs/fss/FSS_V1_VERSIONING.md`.

---

## 7. Historical outputs are never rewritten

A report that said "Biotics Score™" keeps saying it. An email that was
delivered is final. Provenance is what makes that safe: an old score is not
wrong, it is a previous version.
