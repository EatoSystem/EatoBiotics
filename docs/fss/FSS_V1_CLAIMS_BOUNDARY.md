# FSS-v1 — Claims Boundary

**Status: CANDIDATE specification. This document does not authorise the name.**

## 1. The definition the name has to earn

> **Your Food System Score™ is a structured summary of the food patterns you
> reported: what reaches your plate, how varied and how processed it is, how
> often fermented foods appear, and the rhythm you eat to.**

Three drafting decisions, each load-bearing: it says **reported**, so
self-report is explicit; it **enumerates the domains**, so scope is legible;
and it contains **no organ, no biology and no outcome**.

In-product one-liner: *"Where your food system is today, from what you told us."*

## 2. What it must never mean

- not a diagnosis, disease risk, or prediction
- not a measure of the microbiome — composition, activity or metabolites
- not a biomarker, clinical state or metabolic state
- not a validated computational model of a person
- not a measure of health, fitness or biological age
- not a judgement of the person, their income or their circumstances
- not comparable across methodology versions without an explicit rule

## 3. The clause this has to answer, and the answer

`AGGREGATION_EVIDENCE_RULE` in `lib/consultation/science-contract.ts:476` sets
**`cannotProduceValidatedSystemModel: true`** — *"A validated system model is
likewise not reachable by composition."* That is the single clause most
directly in tension with a branded composite score, and it is the reason this
document exists.

**The answer is scope, not exemption.** The rule forecloses a *validated system
model*. The definition in §1 claims a **structured summary of self-report** and
says so in its first six words. A correctly-scoped claim does not violate the
rule, and the rule needs no change to permit it.

**What this explicitly refuses:** weakening, narrowing or version-bumping
`AGGREGATION_EVIDENCE_RULE` so that a broader claim fits.

> **If review concludes the rule must be relaxed to permit the name, that is
> the signal the name is wrong — not the rule.**

## 4. The proposed contract addition — specified, not implemented

`science-contract-v1.1`, **additive**. A new `FOOD_SYSTEM_SCORE_BOUNDARY`
carrying §1's definition, §2's must-not list, and the rule that factors a
person cannot readily change never depress the Score.

Additive because nothing is weakened: the codebase's own precedent is the
Rejuvenate rename, which held v1.0 because `mustNotMean` was untouched.

**Four things that make this more than a file edit**, all verified:

1. `docs/phase-3a-science-contract-v1.md` is **authoritative and byte-pinned**.
   A boundary with no counterpart there is the module reinterpreting the
   contract, which its own header forbids.
2. `SCIENCE_CONTRACT_VERSION` is pinned in three test files and compared
   against a known-versions list used by the persisted wire.
3. The **importer allow-list is exactly five files**. A sixth importer fails CI.
4. The narrative layer may import **only** `REPORT_COMPOSITION_BOUNDARY`.

None of that is a reason not to do it. All of it is a reason it is a deliberate
phase with a contract-owner gate, not a side effect of building a score.

## 5. Sentence-level rules

Every customer-facing sentence must make exactly one of these moves, and never
blur two:

| Move | Form | Example |
|---|---|---|
| measured food behaviour | "Your answers described…" | "Your answers described a narrow plant range." |
| self-reported observation | "You reported…" | "You reported afternoon energy dips." |
| contextual information | "You told us…" | "You told us weekday lunches are rushed." |
| scientific education | impersonal present | "Postbiotics are what your bacteria make from fibre." |
| biological inference | **not available** | — |

Prohibited framings, from `REPORT_COMPOSITION_BOUNDARY`: *"We found"*, *"This
shows"*, *"This indicates your biology"*, *"This reveals"*, *"Your microbiome
is"*, *"Your metabolism is"*, *"Your system is"*.

## 6. Longitudinal language

**"Your reported plant diversity increased."** Never *"your microbiome
improved"*, *"your gut health improved"*, or *"your biology improved"*. A
changed answer is a changed answer.

## 7. The transitional vocabulary policy

"Food System Score" is **transitional**, not retired — forbidden on some
surfaces, permitted on others, required on canonical surfaces only after the
contract phase. The full matrix is `FSS_V1_DESIGN_SPEC.md` §11. The guard must
become lifecycle-aware — a policy lookup of (term, surface class, phase)
replacing a blanket regex.
