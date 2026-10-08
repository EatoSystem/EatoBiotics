# FSS-v1 — Evidence Matrix

**Status: CANDIDATE. No row below has been signed off by a named reviewer.**

> ### FSS-v1 Candidate Domains — Frozen for Scientific Review, Not Yet Scientifically Approved

This document exists to make the *strength of the claim* visible next to the
claim, so that nobody — including us, later — reads a shipped implementation as
a validated one.

## How to read the columns

- **What we observe** — what the items literally ask a person to report.
- **What that supports** — the strongest claim the observation carries on its own.
- **What it does NOT support** — the claim that would be reached for next, and
  must not be.
- **Evidence class** — of the *proposed use*, never of the topic:
  - **A** — directly observed and self-evident (the person told us)
  - **B** — associative literature exists for the behaviour, in populations
  - **C** — plausible mechanism, insufficient direct evidence
  - **D** — not reachable by self-report at all

---

| Domain | What we observe | What that supports | What it does NOT support | Class | Reviewer |
|---|---|---|---|---|---|
| **Diversity** | reported count and rotation of plant foods | that a person reports a wide or narrow plant range | that their gut microbiome is diverse, rich, or contains any named taxon | **B** | ☐ |
| **Plants & Fibre** | reported intake of fibre-rich wholefoods | that a person reports more or less fibre-rich plant food | **that the fibre they eat is a prebiotic** — a prebiotic is a selectively utilised substrate with a demonstrated benefit | **B** | ☐ |
| **Fermented Foods** | reported frequency, variety and intent | that a person reports fermented foods often or rarely | **that those foods are probiotics**, that they contain live microorganisms, or that anything colonises | **B** | ☐ |
| **Food Quality** | reported share processed / home-prepared | that a person reports more or less ultra-processed food | any health, weight or disease-risk outcome | **B** | ☐ |
| **Meal Rhythm** | reported timing, regularity, structure | that a person reports a steady or irregular rhythm | **that rhythm produces, corresponds to or results in postbiotics** | **C** | ☐ |
| **What You Notice** | reported post-meal feeling, discomfort, energy | **that the person reported it. Nothing further** | any digestive, metabolic, immune or inflammatory state; any diagnosis | **A** | ☐ |
| **Your Food Context** | reported time, budget, access, facilities | that these shape what a realistic plan looks like | anything that belongs in a score | **A** | ☐ |
| **Postbiotics** | *nothing* | *nothing personal* | any personal postbiotic state, production, level or recovery | **D** | n/a |

---

## The three non-equivalences, stated as the science

The product adopted the strict ISAPP consensus definitions. Three
non-equivalences follow, and they are the reason most of Phase 1 existed:

| | Definition | Therefore |
|---|---|---|
| **Prebiotic** | a substrate selectively utilised by host microorganisms conferring a health benefit | **fibre ≠ prebiotic.** Most dietary fibre has not been shown to be selectively utilised with a demonstrated benefit |
| **Probiotic** | live microorganisms which, administered in adequate amounts, confer a health benefit | **fermented food ≠ probiotic.** Most fermented foods are not characterised strains at demonstrated doses, and many are heated or pasteurised before they are eaten |
| **Postbiotic** | a preparation of inanimate microorganisms and/or their components conferring a health benefit | **a microbial metabolite ≠ a postbiotic**, and **no food is a postbiotic** |

**What this costs, enumerated rather than discovered later:** the product can no
longer say a fermented food "delivers live cultures", that fibre "is a
prebiotic", or that any food "is a postbiotic". It can say what a food *is*,
what fermentation *does*, what a label *tells you*, and what the person
*reported*. That is a narrower vocabulary and a more durable one.

## Class D is the honest one

Postbiotics is the only row we can be completely confident about, precisely
because it claims nothing. It is the part of the model to be most confident in,
because it stops pretending to measure and starts explaining.

---

## Pending for the reviewer — one wording question raised by Experience 0

Found by rendering the My Food System Biotics area (step 4 of the Experience 0
audit). **Not ruled on internally, and not rewritten.**

`lib/pillars.ts` → `PILLARS.postbiotics.whatItDoes`, rendered on the Biotics
area via `BioticsProgressPanel`:

> *"The beneficial compounds your gut bacteria produce when they ferment
> prebiotic fibre — **they calm inflammation and strengthen the gut lining**."*

### What is NOT in question

It is **impersonal education**, not a personal claim. No member's postbiotic
state is asserted, no number is shown, and the surrounding panel states
explicitly that there is no personal score for any of the three. The Class D
row above is unaffected.

### The question for the reviewer, as the founder framed it

**Not** merely whether supporting literature exists. The sharper question:

> **Is the wording too outcome-like or causal even as general education?**

*"Calm inflammation"* and *"strengthen the gut lining"* are outcome verbs. A
statement can be impersonal, literature-backed and still read to a customer as a
promise about what will happen to them — which is a wording decision, not an
evidence lookup.

Disposition options the reviewer may choose between: **approved as stated** ·
**approved with amended wording** (mechanism without outcome verbs) ·
**rejected** · **insufficient evidence, withdraw the claim**.

Recorded here so it is ratified deliberately rather than inherited by silence.
