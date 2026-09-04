# EatoBiotics Phase 3A Science Contract v1.0
## Multi-Model Science & Evidence Adjudication

# FROZEN ADJUDICATED SCIENCE CONTRACT
# NOT CLINICAL VALIDATION
# NOT PROFESSIONAL MEDICAL APPROVAL
# NOT PRODUCT ACTIVATION

---

## What this document is

This contract is the adjudicated output of:

- one canonical frozen evidence pack;
- blinded **Reviewer A — Claude**;
- blinded **Reviewer B — OpenAI**;
- blinded **Reviewer C — adversarial frontier model**;
- ChatGPT evidence adjudication.

The process is a **MULTI-MODEL SCIENCE & EVIDENCE REVIEW**.

It is **not** clinical validation, **not** scientific validation in the experimental sense, **not**
professional medical sign-off, and **not** regulatory approval.

**Evidence outranks model agreement.** Three blinded reviews reduce single-reviewer error and
anchoring; convergence between them establishes nothing the underlying evidence does not. Where
this contract records a status, it records the adjudicated reading of the evidence — not a tally.

This document freezes decisions. It changes no code. The deterministic Consultation bank remains
dormant, and the live paid Consultation is untouched.

---

## Provenance

Two commits matter here, and they describe **different provenance layers**. They are not in
conflict.

### Question-bank source SHA

`097cc6df961929742098e869066460fd49e08bef`

The seven Phase 3A Consultation questions — their wording, options, semantic answer fields, Report
targets and applicability rules — were extracted from this merged Phase 3A source tree. This is the
tree the reviewers were shown.

### Frozen evidence-pack merge SHA

`1fd3f7ca99733e16dac698ea081b65786cb4a314`

The later `main` commit containing the frozen Phase 3A-S1 canonical evidence pack
(`docs/phase-3a-multi-model-science-evidence-pack.md`) that was supplied identically to all three
reviewers.

The historical S1 evidence pack is **not** rewritten to change its provenance table. It is a
historical artifact and its provenance is correct as recorded.

---

## Reviewer process

| Stage | What happened |
|---|---|
| S1 | One canonical evidence pack, frozen. No bibliography, no anticipated ratings, no prior verdicts. |
| S2A | Reviewer A (Claude) reviewed independently, blinded. |
| S2B | Reviewer B (OpenAI) reviewed independently, blinded. |
| S2C | Reviewer C (adversarial frontier model) reviewed independently, blinded. |
| S3 | ChatGPT adjudicated the three reviews against the evidence. **This document.** |
| S4 | Implementation of only the adjudicated changes. **Not started.** |

Reviewer conclusions are recorded at matrix level only. Full reviewer reports are not reproduced
here, and nothing in this document should be read as a verbatim reviewer artifact. The
**authoritative artifact for implementation is this adjudicated contract**, not a majority tally.

---

## Status vocabulary

| Status | Meaning |
|---|---|
| `SUPPORTED` | The proposed use is adequately supported for its stated scope. |
| `CONTEXT_ONLY` | Reasonable to collect as self-reported context. No biological or causal inference. |
| `PROHIBITED` | The proposed interpretation or use is not adequately supported. |
| `SPECIALIST_REVIEW` | Material uncertainty requiring targeted human professional review. |

The terms *clinically validated*, *scientifically validated*, *medical approval* and *expert
approved* are **not** used for the multi-model outcome, and must not be applied to it later.

---

## Final question matrix

| Question | Evidence Status | Collection Decision |
|---|---|---|
| `core_signals_post_meal_pattern_v1` | CONTEXT_ONLY | KEEP |
| `core_signals_energy_shape_v1` | CONTEXT_ONLY | KEEP |
| `core_signals_context_v1` | CONTEXT_ONLY | KEEP |
| `core_signals_settled_days_v1` | CONTEXT_ONLY | KEEP |
| `core_rhythm_antibiotics_v1` | **PROHIBITED** | **REMOVE** |
| `core_environment_constraints_v1` | SUPPORTED | KEEP |
| `core_environment_food_avoidances_v1` | SUPPORTED with specialist safety gate | KEEP |

**One clarification that must not be lost.** Q2 has a narrow operational use with reasonable
support: its answer may determine **when** an otherwise appropriate low-risk action is placed. That
is a scheduling decision, not an interpretive one. **It does not raise the scientific interpretation
of the answer above `CONTEXT_ONLY`.**

---

## Q1 — `core_signals_post_meal_pattern_v1`

**Evidence status:** `CONTEXT_ONLY` · **Collection:** KEEP

### Maximum allowed interpretation

> "The customer reports that this is the thing they tend to notice after eating."

### Allowed uses

- descriptive recap;
- choosing the topic of educational content;
- low-risk self-observation;
- transparently reflecting what the customer reported.

### Prohibited

Causal inference · diagnosis · glucose inference · metabolic inference · insulin inference ·
intolerance inference · allergy inference · microbiome inference · microbial-function inference ·
microbial-metabolite inference · Postbiotics inference · treatment selection · symptom-specific
therapeutic food prescription.

### Report-target adjudication

**`bodySignalMap` is NOT approved as a target for this question in its existing scientific
meaning.** The name asserts that a reported sensation has been located in a body system, which the
product cannot establish.

Future Report work may replace it with a transparently descriptive construct — "Reported Patterns"
is an example, not a specification. **S3 does not design Phase 4A.**

`systemSnapshot` may only summarise **customer-reported information**. It must never mean *what is
happening biologically inside you*.

---

## Q2 — `core_signals_energy_shape_v1`

**Evidence status:** `CONTEXT_ONLY` · **Collection:** KEEP

### Maximum allowed interpretation

> "The customer reports this pattern in their energy across a typical day."

### Narrow allowed operational use

Use the reported timing to place an **independently appropriate, low-risk** action at a time
relevant to the customer.

Example: reported afternoon dip → place an otherwise appropriate reminder or action around that
part of the day.

This is allowed **because no biological inference is required**. The action must already be
appropriate on its own terms; the answer decides only *when*, never *whether* or *why*.

### Prohibited

Glucose dysregulation · insulin resistance · metabolic dysfunction · endocrine dysfunction ·
circadian diagnosis · sleep diagnosis · nutrient deficiency · microbiome dysfunction · Postbiotics
state · **choosing a food or intervention because of an inferred physiological cause**.

### Report targets

- **`bodySignalMap` is NOT approved for Q2.**
- `priorityLever` may mean **PRACTICAL TIMING / FIT**. It may **not** mean **CAUSAL PHYSIOLOGICAL
  LEVER**.
- `thirtyDayLoop` may use this answer **for timing only**.

---

## Q3 — `core_signals_context_v1`

**Evidence status:** `CONTEXT_ONLY` · **Collection:** KEEP

### Maximum allowed interpretation

> "The customer reports that this context is often also present on the days they notice the
> reported pattern."

This is **customer-reported recalled co-occurrence**.

It is **not** an observed statistical association, **not** a demonstrated trigger, **not** a
mechanism, and **not** causation.

### Frozen future internal intent

The question's internal `intent` must be rewritten in S4 to mean, in substance:

> "A customer-reported context that may be a practical place to start because it fits their day,
> without implying that the context caused the reported signal or that changing it will improve the
> signal."

### Report targets

`priorityLever` may be used for **FIT / RELEVANCE**, never for **EFFICACY / CAUSAL TARGETING**.

**`bodySignalMap` is NOT approved for Q3.**

### Data-contract rule — bundled values remain bundled

Several Q3 option values are OR-bundles. **No downstream system may pretend the customer selected
one component of a bundled value.**

- `stress-sleep` must never later become "sleep" or "stress" individually.
- `rushed` must preserve its exact combined source meaning where it represents rushed **or**
  skipped.
- `large-late` must preserve its exact combined meaning.

Splitting a bundle invents a disclosure the customer never made. This rule is a data contract, not
a presentation preference.

---

## Q4 — `core_signals_settled_days_v1`

**Evidence status:** `CONTEXT_ONLY` · **Collection:** KEEP

### Maximum allowed interpretation

> "The customer reports that this tends to be different on days they experience as more settled."

### Allowed

- maintaining an already workable routine;
- prospective self-observation;
- low-risk behavioural experimentation;
- practical routine support.

### Prohibited

Claiming the routine **caused** the difference · claiming the routine **treats** the signal ·
microbiome explanation · glucose explanation · inflammatory explanation · Postbiotics explanation ·
guaranteed recurrence.

### Frozen wording change

Remove **"yet"** from the label *"I can't tell a difference yet"*, so the option does not
presuppose that a difference exists and will be found.

### Lighter-meals safety guard

Where the selected value represents **lighter / simpler meals**, it must **never** be
operationalised as:

eat less · smaller portions · fewer meals · reduced calories · restriction · meal skipping ·
progressive restriction across the 30-day programme.

The answer may only be reflected **at the level the customer actually selected**, and only as a
low-risk routine or context observation. This guard exists because an innocuous self-report is one
short step from a restriction instruction, and that step must not be available.

---

## Q5 — `core_rhythm_antibiotics_v1` — REMOVAL

**Evidence status:** `PROHIBITED` · **Collection decision:** **REMOVE**

**This is a final adjudicated decision.**

### Reason

No sufficiently useful EatoBiotics-specific downstream action survives the evidence review. The
question collects high-sensitivity medication and health-history data while the product cannot
infer the customer's present microbiome state, recovery status, microbial function, Postbiotics
state, dietary need or treatment need.

Collecting sensitive data that cannot change what the customer receives is not a neutral act.

### Frozen consequences

- **No six-month threshold is approved.**
- **No two-year threshold is approved.**
- **No replacement antibiotic-history question is required.**
- No antibiotic-specific personalised **Feed**, **Seed**, **Regenerate**, probiotic,
  fermented-food, fibre, restoration, repair, rebuilding, reseeding or microbial-recovery
  recommendation is permitted.

Generic, non-personalised education may exist separately if scientifically appropriate. It does not
require collecting antibiotic history from anyone.

---

## Q6 — `core_environment_constraints_v1`

**Evidence status:** `SUPPORTED`

**Scope of support:** OPERATIONAL FILTERING / PRACTICAL FEASIBILITY / SAFETY — **not clinical
interpretation.**

### Maximum allowed interpretation

> "The customer says these are constraints the Report needs to work around."

### Allowed

Practical filtering · budget adaptation · time adaptation · cultural and religious adaptation ·
vegetarian/vegan adaptation · declared-avoidance filtering · household practicality.

### Prohibited

Diagnosing allergy · verifying medical necessity · allergy-severity inference · medical diagnosis ·
declaring dietary adequacy · assuming unselected constraints do not exist · **treating
`prefer-not-to-say` as `none`**.

### Frozen: `prefer-not-to-say` semantics

`prefer-not-to-say` means **UNRESOLVED / UNDISCLOSED**. It does **not** mean **NO CONSTRAINT**.

Collapsing the two would convert a declined disclosure into an affirmative safety claim, which is
the single most consequential misreading available in this question.

### Frozen: two constraint classes

Downstream semantics must distinguish:

**Safety-related constraints** — `allergy`, `medical-avoid`.

**Practical / preference constraints** — vegetarian/vegan, culture/religion, budget, time,
dislikes.

They may still be **presented together to the customer** if product design prefers. Their
**downstream semantics must not be identical**.

---

## Q7 — `core_environment_food_avoidances_v1`

**Evidence status:** `SUPPORTED`, with **SPECIALIST SAFETY GATE BEFORE CUSTOMER ACTIVATION**

### Maximum allowed interpretation

> "The customer asked the Report not to suggest these declared broad food categories."

This question is a **PRODUCT OUTPUT FILTER**. It is **not clinical allergy management**.

### Frozen: `unresolvedSpecificAvoidance`

`unresolvedSpecificAvoidance = true` means:

> **EatoBiotics does not have enough specific information.**

It does **not** mean high clinical risk, high allergy severity, likelihood of anaphylaxis, a
diagnostic uncertainty score, or a medical risk level.

When unresolved:

1. **suppress** specific food recommendations that could conflict with an unknown restriction;
2. use **generic** food and routine guidance;
3. **never infer a safe substitute**;
4. **never coerce disclosure**;
5. **never call an unselected food "safe"**.

This is one of the strongest safety decisions to come out of Phase 3A and must be preserved intact.

### Taxonomy — NOT finalised in S3

The three-review process identified that the current broad taxonomy is **not sufficient to act as a
definitive Irish/EU allergen ontology**. Distinctions requiring specialist correctness review
include: fish · crustaceans · molluscs · peanuts · tree nuts · cereals containing gluten ·
milk/dairy terminology · other declarable allergens.

**The final revised taxonomy is not invented or implemented in S3.**

Recorded: **SPECIALIST GATE REQUIRED BEFORE ACTIVATION** for allergy/dietetic correctness, Irish/EU
food-safety taxonomy, and recommendation-suppression failure modes.

The current bank remains dormant.

---

# Aggregation Does Not Upgrade Evidence

**Combining multiple self-reported answers does not increase their evidentiary status.**

The Personal Food System Report **may**:

- organise what a customer reports;
- summarise what a customer reports;
- personalise practical presentation around what a customer reports;
- place low-risk actions according to practical context;
- respect declared constraints.

It **may not** infer, imply or present an underlying biological, metabolic, glucose, insulin,
inflammatory, immune, microbiome, microbial-function, microbial-metabolite, Postbiotics or clinical
state **merely because several self-reported patterns occur together**.

Multiple self-reports remain multiple self-reports. No composition of Q1 + Q2 + Q3 + Q4 upgrades
them into a biomarker, a mechanism, a diagnosis, or a validated system model.

This is where a well-behaved questionnaire most easily acquires a claim none of its questions
earned: each answer is handled correctly, and the synthesis quietly asserts what no input
supported.

This rule must eventually govern the Report generator as a whole. **S3 records the rule. S3 does
not modify the live Report generator.**

---

## Report composition boundary

The Report **may** say, in substance:

> "You told us…" · "You reported…" · "You notice…" · "You said this tends to happen…" · "Based on
> the routines and constraints you described…"

It **must not** convert those into:

> "We found…" · "This shows…" · "This indicates your biology…" · "This reveals…" · "Your system
> is…" · "Your microbiome is…" · "Your metabolism is…"

— unless a future, separately validated measurement genuinely establishes such a claim.

**No future AI-generation prompt may use synthesis itself as evidence.**

---

## Postbiotics science contract

Under accepted scientific terminology, a **postbiotic** refers to an appropriate preparation of
inanimate microorganisms and/or their components that confers a health benefit on the host.

EatoBiotics must therefore **not** infer or describe, from Consultation self-report:

"your Postbiotics status" · "Postbiotics inadequacy" · "your Postbiotics production" · "low
Postbiotics" · "high Postbiotics" · "Postbiotics recovery" · "your body needs more Postbiotics".

Self-reported fullness, bloating, energy, meal timing, stress, sleep and food-response patterns
must **not** be described as indicating, reflecting, corresponding to, resulting from, or being
produced by: postbiotic preparations · microbial metabolites · microbial activity · microbial
production · microbiome composition.

### Frozen general boundary

> "EatoBiotics may use self-reported patterns as educational context, but those patterns do not
> quantify, indicate, reflect, correspond to, result from or reveal postbiotic preparations,
> microbial products, microbial metabolites, microbial activity, microbial production, microbiome
> composition or clinical adequacy."

Note this is **stronger than the S1 proposed boundary**, which spoke only of *quantifying*. The
adjudicated version closes indicating, reflecting, corresponding to, resulting from and revealing —
the softer verbs through which the same claim returns.

---

## Feed · Seed · Regenerate boundary

The action language is **preserved** as product/action vocabulary. It is **not** removed or renamed
in S3.

**`Regenerate` must not scientifically mean:** increase Postbiotics · produce Postbiotics · restore
Postbiotics · increase butyrate · increase acetate · increase propionate · restore microbial
metabolites · rebuild the microbiome · repair the microbiome — unless future evidence and an
appropriate measurement justify such a claim.

A dedicated future science/brand-language pass may define `Regenerate` positively. **That redesign
is not attempted in S3.**

---

## Food-safety copy

### Universal copy

> "EatoBiotics does not verify ingredients or determine whether a food is safe for you. Check
> ingredients and labels against your own allergies, intolerances and medical food restrictions
> before trying a specific food suggestion."

**Status: APPROVED SCIENCE-CONTRACT COPY — NOT YET IMPLEMENTED.**

### Unresolved declared medical/allergy constraint

> "If you're unsure what you need to avoid, use the general guidance only and check with an
> appropriate healthcare professional or registered dietitian before acting on specific food
> suggestions."

**Status: APPROVED SCIENCE-CONTRACT COPY — NOT YET IMPLEMENTED.**

Neither sentence is inserted into the live Report or UI during S3.

---

## Safety-netting

The Signals section should ultimately carry **one proportionate, non-alarming safety-netting
statement** for patterns that are new, persistent, worsening or worrying.

**This contract does not freeze the exact customer wording.** Exact wording requires targeted GP,
gastroenterology or dietetic review.

Do **not** create: symptom screening · a red-flag questionnaire · diagnosis · a triage engine ·
medical decision support.

It should remain **one proportionate boundary sentence**.

---

## Specialist escalations

Three targeted gates. Deliberately targeted — not blanket human validation of all seven questions.

### A. Food allergy / dietetic + Irish/EU food-safety correctness

**Required before specific food recommendations are activated.**

Scope: Q6/Q7 taxonomy · suppression logic · unresolved failure modes · safety copy · broad-category
design.

### B. Safety-netting wording

Targeted GP / gastroenterology / dietetic review.

Scope: one proportionate customer-facing sentence. **Not a clinical intake redesign.**

### C. Irish/EU legal & regulatory review

Scope: customer-facing use of **Prebiotics**, **Probiotics**, **Postbiotics**, and any relevant
health-claims implications.

This is a **legal/regulatory** question, not one the multi-model science review resolves.

---

## Human review policy

The multi-model process **does not** automatically require a qualified human to re-review every
question.

Human specialist escalation is **targeted** to: unresolved high-risk issues · professional
correctness checks · legal/regulatory interpretation · safety wording where professional judgement
adds material value.

**Three AI models do not equal professional validation**, and nothing in this contract should be
cited as though they do.

---

# Required Phase 3A-S4 Implementation Changes

**None of these are implemented in S3.** They are frozen here as the S4 scope.

1. **Remove `core_rhythm_antibiotics_v1`** from the deterministic bank.

2. **Remove `bodySignalMap`** from Report targets for `core_signals_post_meal_pattern_v1`,
   `core_signals_energy_shape_v1` and `core_signals_context_v1`.
   **Do not delete `bodySignalMap` from the global Report type/schema** merely because these
   questions stop targeting it.

3. **Rewrite Q3's internal `intent`** to reflect fit/relevance rather than causal efficacy.

4. **Preserve all OR-bundled Q3 semantic values exactly** in downstream interpretation.

5. **Remove "yet"** from Q4's `cannot-tell` customer label.

6. **Add an explicit `lighter-meals` science guard** preventing quantity/restriction
   interpretation.

7. **Change Q6 `prefer-not-to-say` handling** so it never means "no constraint".

8. **Preserve `unresolvedSpecificAvoidance`** and its conservative suppression semantics.

9. **Introduce a typed dormant science/evidence contract** representing: evidence status · allowed
   interpretation · prohibited interpretation · allowed Report use · prohibited Report use · action
   boundary · specialist gate where applicable.
   Prefer a **separate module** over overloading question-presentation metadata, so presentation
   and evidence policy stay separable concerns.

10. **Add the *Aggregation Does Not Upgrade Evidence* rule** as a machine-testable dormant
    contract.

11. **Add the Postbiotics inference boundary** as a machine-testable dormant contract.

12. **Add future food-safety copy constants/contracts** if useful — **do not activate them**.

13. **Update tests.**

14. **Update the S1 evidence-pack drift guard** so it remains a *historical snapshot* guard rather
    than falsely requiring the post-S4 bank to match the pre-adjudication seven-question source
    forever.
    **Do not edit the historical S1 evidence pack's reviewed question records** to pretend they
    describe the post-S4 bank. The pack is a record of what reviewers were shown; rewriting it
    would destroy the audit trail this whole process exists to create.

15. **Keep the deterministic bank dormant.**

16. **Do not modify:** live `/assessment/deep` · live AI generation path · autosave · save route ·
    submit route · checkout · Stripe · Supabase · migrations · live Report generator · PDF · email ·
    production config.

Phase 4A will later integrate this science contract into Report generation.

---

## Status at freeze

| Phase | Status |
|---|---|
| Phase 3A | COMPLETE |
| Phase 3A-S1 | COMPLETE |
| Phase 3A-S2A / S2B / S2C | COMPLETE |
| **Phase 3A-S3** | **THIS DOCUMENT** |
| Phase 3A-S4 | NOT STARTED |
| Phase 3B | NOT STARTED |
| Phase 3C | NOT STARTED |

The deterministic Consultation bank is **merged and dormant**. The live AI-generated paid
Consultation is unchanged. No question has been removed, reworded or re-targeted by this document —
those are S4 changes.
