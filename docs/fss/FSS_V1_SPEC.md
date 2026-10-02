# FSS-v1 — Candidate Methodology Specification

**Status: CANDIDATE. Specification only. Nothing here is implemented, and
implementing it would not validate it.**

> ### FSS-v1 Candidate Domains — Frozen for Scientific Review, Not Yet Scientifically Approved

Derived from `FSS_V1_DESIGN_SPEC.md`, which carries the reasoning and the
locked decisions register. This document is the normative form: what a
reviewer must sign off, domain by domain.

---

## 1. The score

```
itemValue(i)    ∈ {0,1,2,3}                                  unchanged
domainScore(d)  = round( mean(itemValues(d)) / 3 × 100 )     // 0..100
FoodSystemScore = round( Σ w[d] × domainScore(d) )           // Σ w[d] = 1
```

**The Biotics appear nowhere in this function.** They are not weighting
buckets. That separation is what the whole architecture buys.

**No floor.** Today's `Math.max(n, 20)` is removed. The scale is presented as
0–100, so 0 must be reachable; people are protected by band copy and tone, not
by inflating the number.

**Weights — declared, not emergent.**

```
FSS_WEIGHTS_V1 = { diversity: .20, plantsAndFibre: .20, fermentedFoods: .20,
                   foodQuality: .20, mealRhythm: .20 }
```

Equal for v1.0, as an exported constant with a stated rationale: **no evidence
base ranks these five against each other**, and equal weighting makes no claim
that would have to be defended. Evidence-based weighting is a v2.0 question
requiring a named source per weight.

This replaces two defects. Today's 40/20/40 tracks **question count**, not
evidential importance — an artefact, not a finding. And if an overall score
averaged five domains while two of them sat under Prebiotics, Prebiotics would
silently carry 40% again in new clothes.

**Missing data.** A domain with <60% of its items answered returns
`insufficient`, never 0 — a skipped question is not a bad habit. **If any
scored domain is `insufficient`, the Score is withheld** and the domains are
shown alone with what is missing named. `completeness` is always displayed.
**No confidence interval**: it would imply sampling properties this instrument
does not have.

---

## 2. The five domains

Each carries the fourteen fields a reviewer needs. `sign-off` is the field that
matters: none of them has one yet.

### D1 · Diversity

| | |
|---|---|
| **Conceptual definition** | The range and rotation of distinct plant foods eaten across a week |
| **Observable construct** | Self-reported count and variety of plant foods, and whether variety is deliberate |
| **Included items** | q1, q2, q3 |
| **Excluded items** | q4, q6 (amount and named foods, not range) — they belong to D2 |
| **Range** | 0–100 |
| **Missing data** | <60% answered → `insufficient` |
| **Completeness rule** | 2 of 3 items |
| **Weight** | 0.20 |
| **Weight rationale** | Equal by policy; no evidence base ranks the five |
| **Interpretation** | "Your answers described how wide a range of plants reaches you in a week" |
| **Allowed language** | range, variety, rotation, reported |
| **Prohibited inference** | microbiome diversity, microbial richness, any named taxon |
| **Actionability** | High — the most directly changeable of the five |
| **Evidence basis** | Plant-count and dietary-diversity literature. **Requires reviewer sign-off.** |
| **Sign-off** | ☐ none |

### D2 · Plants & Fibre

| | |
|---|---|
| **Conceptual definition** | The quantity of fibre-rich whole plant foods, as distinct from their range |
| **Observable construct** | Self-reported intake of fibre-rich wholefoods and named substrate-rich foods |
| **Included items** | q4, q6 |
| **Excluded items** | q5 (processing — moved to D4, see §3) |
| **Range** | 0–100 |
| **Missing data** | <60% answered → `insufficient` |
| **Completeness rule** | 1 of 2 items |
| **Weight** | 0.20 |
| **Weight rationale** | Equal by policy |
| **Interpretation** | "Your answers described how much fibre-rich plant food reaches you" |
| **Allowed language** | fibre, wholefoods, plant foods, substrate |
| **Prohibited inference** | **that fibre is a prebiotic.** A prebiotic is a selectively utilised substrate with a demonstrated benefit; most fibre has not been shown to be one |
| **Actionability** | High |
| **Evidence basis** | Fibre-intake literature. **Requires reviewer sign-off**, and q6's wording is inside the methodology freeze |
| **Sign-off** | ☐ none |

### D3 · Fermented Foods

| | |
|---|---|
| **Conceptual definition** | How regularly, how variously and how deliberately fermented foods appear |
| **Observable construct** | Self-reported frequency, variety and intentionality of fermented-food intake |
| **Included items** | q7, q8, q9 |
| **Excluded items** | — |
| **Range** | 0–100 |
| **Missing data** | <60% answered → `insufficient` |
| **Completeness rule** | 2 of 3 items |
| **Weight** | 0.20 |
| **Weight rationale** | Equal by policy. **Not** 1/3 of Probiotics-as-a-bucket — see §3 on why this is one domain and not two |
| **Interpretation** | "Your answers described how often foods transformed by fermentation appear in your week" |
| **Allowed language** | fermented, fermentation, transformed by fermentation |
| **Prohibited inference** | **that a fermented food is a probiotic**, that it contains live microorganisms, that anything colonises or reseeds anything |
| **Actionability** | Highest of the five — a small daily serving moves it |
| **Evidence basis** | Fermented-food intake and microbial-diversity literature. **Requires reviewer sign-off.** |
| **Sign-off** | ☐ none |

### D4 · Food Quality

| | |
|---|---|
| **Conceptual definition** | Processing exposure — what displaces whole foods |
| **Observable construct** | Self-reported share of diet that is processed or ultra-processed, plus preparation mode and discretionary intake |
| **Included items** | q5, **plus two new items** (fq2 home-prepared vs ready-made; fq3 sweetened drinks / confectionery / packaged snacks) |
| **Excluded items** | — |
| **Range** | 0–100 |
| **Missing data** | <60% answered → `insufficient` |
| **Completeness rule** | 2 of 3 items |
| **Weight** | 0.20 |
| **Weight rationale** | Equal by policy |
| **Interpretation** | "Your answers described how much of what you eat is prepared from whole ingredients" |
| **Allowed language** | processed, ultra-processed, ready-made, whole ingredients |
| **Prohibited inference** | any health, weight or disease-risk claim |
| **Actionability** | Moderate — strongly constrained by Your Food Context |
| **Evidence basis** | UPF literature. **Requires reviewer sign-off, AND the two new items are drafts requiring approval before use.** A domain resting on one item is fragile, which is why q5 alone is not enough |
| **Sign-off** | ☐ none |

### D5 · Meal Rhythm

| | |
|---|---|
| **Conceptual definition** | Timing, regularity and structure of eating |
| **Observable construct** | Self-reported approach to eating, weekly consistency, and skipping/late/rushed meals |
| **Included items** | q10, q11, q12, **plus one optional new item** (mr4, meal composition) |
| **Excluded items** | **q13, q14, q15 — symptoms. They leave the score entirely; see §3** |
| **Range** | 0–100 |
| **Missing data** | <60% answered → `insufficient` |
| **Completeness rule** | 2 of 3 items |
| **Weight** | 0.20 |
| **Weight rationale** | Equal by policy |
| **Interpretation** | "Your answers described the rhythm you eat to" |
| **Allowed language** | rhythm, regularity, timing, structure |
| **Prohibited inference** | **that rhythm results in, corresponds to or produces postbiotics.** `POSTBIOTICS_INFERENCE_BOUNDARY` lists `result-from` and `correspond-to` by name. This domain is NOT Postbiotics renamed, and must never be moved under it to balance a layout |
| **Actionability** | Moderate — strongly constrained by Your Food Context |
| **Evidence basis** | Chrononutrition and meal-regularity literature. **Requires reviewer sign-off.** |
| **Sign-off** | ☐ none |

---

## 3. Four decisions a reviewer should see stated

**q5 leaves Prebiotics.** It measures what *displaces* whole foods, not what
feeds microbes. It was the least defensible member of that bucket.

**q13–q15 leave the score entirely.** They are outcomes, not food-system
inputs. A score mixing behaviour and outcome cannot be interpreted — two people
with identical habits would score differently because one feels worse — and
they carry the highest diagnostic-reading risk in the instrument. They become
**What You Notice**: prominent, reported back, tracked, *not in the number*.

**Probiotics carries one domain, not two.** Splitting q7–q9 into "fermented
foods" and "variety/frequency" leaves a one-item dimension, which is the same
fragility that makes Food Quality need two more items.

**Postbiotics carries none, and that is the most credible thing on the page.**
Rendered as a statement rather than an empty bar: *what your food system gives
back — we teach it, we don't score it, because nothing you can tell us in an
assessment measures it.* A product that says what it cannot measure earns trust
in the numbers it does show. **Do not reattach a number to balance a layout.**

---

## 4. Bands

Two pre-existing defects, both specified for repair here and neither executed
as part of a claims tranche:

**There are nine band ladders in the repository, and only one has a test.**
`lib/scoring.ts:12` publishes 80/60/40/20 and `/method` presents it as *the*
method, while `dashboard-client-data.ts:257`, `analyse/result-builder.tsx:96`,
`share-client.tsx:88` and `lib/email/meal-analysis-email.ts:14` all use
80/65/50/35, and `build-food-system-report.ts:110`, `agent-loop/biotics.ts:21`
and `lib/identity-labels.ts:16` use three further shapes. The same number is
described differently depending on which surface a person is looking at.

**Consolidate to one ladder.** Proposed neutral labels, for review — today's
are quality judgements ("Fair", "Getting Started"):

| 0–19 | 20–39 | 40–59 | 60–79 | 80–100 |
|---|---|---|---|---|
| Early days | Building | Developing | Strong | Thriving |

---

## 5. Acceptance criteria

- The Three Biotics appear with equal visual status and **no personal number
  anywhere**, including share cards, PDFs and email.
- Every scored dimension names what its items actually ask.
- Weights are an explicit versioned constant, never emergent from how many
  domains nest under a Biotic.
- Neither What You Notice nor Your Food Context affects the Score.
- Every stored score carries provenance.
- One band implementation; neutral labels.
- Historical outputs unrewritten.

## 6. Open items for scientific review

1. Who signs off the domain set? This document cannot supply a reviewer.
2. Equal weighting, or something else — with a named source per weight?
3. Does the unscored-Postbiotics treatment work on real people?
4. Withhold the Score below a completeness threshold, or always show with a caveat?
5. What is the minimum meaningful change, before any reassessment messaging ships?
6. Is removing the 20-point floor acceptable, knowing early users will see lower numbers?
7. The three new items (fq2, fq3, mr4) and the four context items (fc1–fc4) are drafts.
8. q6's rewording — blocked by the methodology freeze.
