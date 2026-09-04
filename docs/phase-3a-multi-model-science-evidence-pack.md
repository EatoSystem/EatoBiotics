# EatoBiotics Phase 3A — Multi-Model Science & Evidence Pack
## Personal Food System Consultation

# FOR INDEPENDENT MULTI-MODEL SCIENCE & EVIDENCE REVIEW
# NOT SCIENTIFICALLY VALIDATED
# NOT CLINICALLY VALIDATED
# NOT EXPERT APPROVED
# NOT APPROVED FOR CUSTOMER ACTIVATION

---

## Provenance

| Field | Value |
|---|---|
| Repository | `EatoSystem/EatoBiotics` |
| Main SHA | `097cc6df961929742098e869066460fd49e08bef` |
| Phase 3A approved head | `60b5b8d97dbf14205b90853f2339eb4f0534dc15` |
| Main CI | `#539` — completed / success |
| Consultation bank version | `v1` (`CONSULTATION_BANK_VERSION`, derived from source) |
| Pack created | 2026-09-04 |
| Phase 3B | **NOT STARTED** |
| Deterministic bank | **merged and dormant** — no route, page, component or script imports `lib/consultation/` |

Every quoted question, option, answer field, Report target and applicability rule in this pack was extracted programmatically from the merged tree at the SHA above. The Phase 3A PR description is **not** a source; where it differs from the merged tree, the merged tree is authoritative.

---

## How this pack will be used

This is **one canonical document**, supplied identically to three independent reviewers:

- **Reviewer A** — Claude
- **Reviewer B** — OpenAI
- **Reviewer C** — a third independent frontier model, acting adversarially

The reviewers are blinded to each other. Their conclusions are then adjudicated separately, where **evidence outranks model agreement** and there is no majority vote. Only adjudicated changes are later implemented.

### What "independent" means here

**"Independent" means each AI review is performed separately and blinded to the other reviewers' conclusions.** It does not mean the models constitute independent clinical studies, independent experimental evidence, professional medical validation, or scientific validation. Three blinded AI reviews are a way of reducing single-reviewer error and anchoring — they are not a substitute for evidence, and agreement between them establishes nothing that the underlying evidence does not.

This pack **does not perform the review**. It contains no scientific conclusion, no anticipated rating, no prior model's verdict, and no steer toward any particular outcome. A reviewer must be able to conclude KEEP, REWRITE, CONTEXT ONLY, REMOVE or ESCALATE for any question without contradicting anything stated here.

---

## Product Context

**EatoBiotics — The Food System Inside You.**

The paid product under review is the **Personal Food System Consultation**. It is intended to be guided, digital, educational, personalised and non-diagnostic. Its output is the **Personal Food System Report**.

The product's scientific vocabulary and its action vocabulary are deliberately separate:

> **Prebiotics · Probiotics · Postbiotics to understand.**
> **Feed · Seed · Regenerate to act.**

A free **Food System Assessment** (15 questions, `lib/assessment-data.ts`) precedes the paid Consultation and produces a Biotics Score™. The seven questions under review are part of a deterministic paid-Consultation question bank that is **merged but not active**: the live paid Consultation today still uses a runtime-AI-generated question path, which is out of scope for this review.

---

# ASKING A QUESTION, INTERPRETING THE ANSWER, AND RECOMMENDING AN ACTION ARE THREE DIFFERENT SCIENTIFIC GATES.

A question may be entirely acceptable to collect as self-report while a biological interpretation of the answer is unsupported, and while a downstream action based on it is unjustified. These are not the same judgement and must not be collapsed into one.

Every reviewer must judge each question separately at all three gates:

### Gate A — Question
Is the question itself reasonable to ask?

### Gate B — Interpretation
What can the answer scientifically mean?

### Gate C — Action
What downstream practical use, if any, is justified?

**This separation is mandatory.** A question can pass Gate A and fail Gate B. A question can pass Gates A and B and still fail Gate C.

---

## What EatoBiotics Does NOT Directly Measure

EatoBiotics does **not** directly measure:

- microbiome composition
- microbial diversity
- microbiota function
- microbial metabolites
- postbiotic preparations
- postbiotic compounds
- microbial products
- postbiotic production
- glucose physiology
- insulin sensitivity
- inflammatory status
- immune status
- disease state
- clinical adequacy

Self-reported digestive comfort, fullness, bloating, energy, perceived food responses, meal rhythm, stress and sleep context, recovery, and day-to-day patterns are:

# SELF-REPORTED PATTERNS / CONTEXT

They are **not** biomarkers, **not** diagnoses, **not** microbiome measurements, **not** glucose measurements, **not** Postbiotics measurements, and **not** proof of a biological mechanism.

---

## Evidence Hierarchy

Reviewers should prioritise, approximately in this order:

1. authoritative consensus statements / professional guidance
2. systematic reviews
3. meta-analyses
4. high-quality human randomised / intervention evidence
5. prospective human observational evidence
6. other relevant peer-reviewed human evidence

Mechanistic, animal and in-vitro research may provide context but should **not by itself** justify a customer-facing biological inference.

Reviewers should not rely primarily on wellness sites, commercial supplement companies, commercial microbiome testing companies, SEO health content, product marketing, or unsourced expert commentary.

## Source Disclosure Standard

For every substantive scientific conclusion, a reviewer must provide: source title · source type · year · population / context · DOI, PubMed ID or official source identifier where available · what the source supports · **what it does NOT establish**.

**This pack deliberately contains no bibliography.** Each reviewer performs their own literature search. Handing three reviewers the same pre-selected source set would produce three correlated reviews and defeat the purpose of running them independently.

---

## Evidence / Use Rating Scale

### A — Strong support
Proposed use supported by consistent high-quality human evidence and/or authoritative consensus.

### B — Reasonable support
Useful evidence exists but material uncertainty or limitations remain.

### C — Context only
Reasonable to ask or collect as self-reported context, but biological or causal inference should NOT be made.

### D — Unsupported
The proposed interpretation/use is not adequately supported.

### E — Remove / specialist escalation
Material scientific or safety uncertainty means the question/use should be removed, redesigned or escalated.

> **The rating applies to THE PROPOSED USE OF THE ANSWER**, not merely to whether the topic exists in the scientific literature. A well-studied topic can still carry a D or E rating if the product's proposed use of the answer outruns the evidence.

---

# COMMON REVIEW QUESTIONS

For each Consultation question:

1. Is this a scientifically reasonable self-report question for an educational, non-diagnostic food-system Consultation?

2. Is the customer-facing wording neutral and proportionate, or could it imply diagnosis, biological measurement, pathology or causation?

3. Are the answer options scientifically and conceptually appropriate, without false precision or misleading categories?

4. What is the narrowest scientifically defensible meaning of the answer?

5. What conclusions must EatoBiotics explicitly NOT draw from the answer?

6. Is the stated downstream Report use scientifically defensible?

7. Which Report uses are:
   - appropriate,
   - context-only,
   - unsupported,
   - unsafe?

8. Can the answer reasonably affect:
   - practical meal timing,
   - food-environment recommendations,
   - household strategy,
   - food suggestions,
   - 30-day behavioural actions,
   - educational explanation?

   Review each applicable category separately.

9. Does the current wording or intended use imply a causal relationship where only association, co-occurrence or self-report is known?

10. Does the question collect more sensitive health information than is necessary for its intended product use?

11. Should this question:
    - remain as written,
    - remain with wording changes,
    - have narrower interpretation,
    - become optional,
    - be redesigned,
    - be removed,
    - be escalated for specialist review?

12. What primary or authoritative evidence supports your recommendation?

13. What important evidence contradicts, limits or complicates that recommendation?

14. How confident are you in your conclusion:
    - High
    - Moderate
    - Low

15. Assign one overall evidence/use rating:
    - A Strong support
    - B Reasonable support
    - C Context only
    - D Unsupported
    - E Remove / specialist escalation

16. State one sentence defining the maximum claim EatoBiotics should be allowed to make from this answer.

17. State one sentence defining the strongest claim EatoBiotics must be prohibited from making from this answer.

18. What evidence would change your conclusion?

# END COMMON REVIEW QUESTIONS

---

# Product Rationale Is Not Evidence

The following fields describe the EatoBiotics product team's **current rationale or intended use**:

- `intent`
- `whyNeeded`
- `deeperBecause`
- Report targets
- Current product rationale
- PROPOSED INTERPRETATION BOUNDARY
- PROPOSED PROHIBITED INFERENCES

They are included because a reviewer cannot assess what the product intends to do with an answer
without being told what that is.

**They are not scientific evidence.** Reviewers must independently test them against evidence, and
may accept them, narrow them, reject them, or recommend removing the question or the Report use
entirely.

No internal rationale carries additional evidentiary weight merely because it appears in the source
contract, is written confidently, or is enforced by a repository test. A `whyNeeded` string is an
argument the product makes to itself; the review exists precisely to check whether that argument
survives contact with evidence.

---

# The Seven Questions Under Review

Exactly seven questions in the merged bank carry `scienceReview: "required"`. **Zero** carry `scienceReview: "reviewed"` — nothing in this bank has been reviewed by a qualified human, and a repository test fails if anything is ever marked reviewed without that having happened.

---

## Question 1 — Post-Meal Pattern

### Question ID
`core_signals_post_meal_pattern_v1`

### Section
`signals` — **Your Signals**

> Section purpose shown to the customer: *What you notice day to day. There is no wrong answer, and nothing here is a medical judgement.*

### Foundation(s)
`you`  — **this foundation only**

### Required / optional
**Required**

### Sensitivity
`medium`

### Adaptive rule
**Baseline** — always asked of the foundations listed above.

### EXACT CUSTOMER WORDING

**You:**

> When you notice something after eating, what do you tend to notice first?

_No Family wording — this question is not asked of the Family foundation._

### EXACT SUPPORT TEXT

**You:**

> This is about what you notice, not about anything being wrong.


### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| Fullness or heaviness that lasts a while | `fullness` | — |
| Bloating or wind | `bloating` | — |
| Sleepiness or a dip in energy | `dip` | — |
| A lift, then a dip | `lift-then-dip` | — |
| Nothing in particular | `nothing` | — |
| Prefer not to say | `prefer-not-to-say` | — |

### EXACT SEMANTIC ANSWER FIELD
`signals.postMealPattern`

### Intent (exact source)
> Names the one post-meal signal the Report should build its body-signal section around.

### Why needed (exact source)
> Heaviness, bloating and an energy dip each point at a different practical change; without knowing which one leads, the Report can only describe all three and commit to none.

### EXACT REPORT TARGETS
`bodySignalMap` · `systemSnapshot`

### Free Assessment relationship
**Builds deeper on free question(s): q13.**

> Recorded rationale (`deeperBecause`, exact source): q13 rates how someone feels after eating on a four-point scale from sluggish to energised. It cannot say WHICH signal they notice, so the report has a rating with no subject. This asks for the subject.

### Current product rationale
This question asks **what the customer notices after eating**. It does not ask what
they have, and it collects no diagnosis, no measurement and no clinical history.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

A descriptive, self-reported post-meal pattern. The narrowest intended reading is:
*this customer reports that the thing they most often notice after eating is X.*

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- a diagnosis of any kind
- a cause of the reported sensation
- microbiome composition
- microbial diversity
- glucose dysregulation
- insulin resistance
- inflammation
- food intolerance
- food allergy
- any statement about Postbiotics state

### Specific matters for reviewer scrutiny

**Reviewers are specifically asked to scrutinise the Report target `bodySignalMap`.**
The name pairs a body concept with a mapping concept, which could be read as a claim that a
reported sensation has been located in a biological system. Is that target concept safe if the
content remains purely descriptive rather than diagnostic, and if not, what would make it safe?

### Data-minimisation considerations

One question, six options, one of which is an explicit decline. No free text. No
follow-up asking what the sensation "means". The question is required, so a customer must select
something — but "Nothing in particular" and "Prefer not to say" are both available, so answering
costs a tap rather than a disclosure.

### Safety considerations

Sensitivity is classified `medium`. The wording deliberately contains no clinical
vocabulary at all — the repository's language-safety test bans *diagnosis*, *treatment*,
*measure*, *microbiome*, *symptom* and related terms from every customer-facing string in this
bank, including support text.

### Claim → Data → Report trace

```
QUESTION        core_signals_post_meal_pattern_v1
       ↓
RAW SELF-REPORT single — exact options listed above
       ↓
ANSWER FIELD    signals.postMealPattern
       ↓
REPORT TARGETS  bodySignalMap, systemSnapshot
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `bodySignalMap` · `systemSnapshot`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 1

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

## Question 2 — Energy Shape

### Question ID
`core_signals_energy_shape_v1`

### Section
`signals` — **Your Signals**

> Section purpose shown to the customer: *What you notice day to day. There is no wrong answer, and nothing here is a medical judgement.*

### Foundation(s)
`you`  — **this foundation only**

### Required / optional
**Required**

### Sensitivity
`low`

### Adaptive rule
**Baseline** — always asked of the foundations listed above.

### EXACT CUSTOMER WORDING

**You:**

> Which of these best describes the shape of your energy on a typical day?

_No Family wording — this question is not asked of the Family foundation._

### EXACT SUPPORT TEXT

_None. This question carries no support text._

### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| Steady from morning to evening | `steady` | — |
| Slow to start, then steady | `slow-start` | — |
| Fine until an afternoon dip | `afternoon-dip` | — |
| Up and down through the day | `variable` | — |
| Hard to predict | `unpredictable` | — |

### EXACT SEMANTIC ANSWER FIELD
`signals.energyShape`

### Intent (exact source)
> Places the Report's first action at a time of day the reader will actually be there for.

### Why needed (exact source)
> An action with no hour attached is not something anyone can do. Knowing the shape of the day is what turns a suggestion into a specific one.

### EXACT REPORT TARGETS
`priorityLever` · `thirtyDayLoop` · `bodySignalMap`

### Free Assessment relationship
**Builds deeper on free question(s): q15.**

> Recorded rationale (`deeperBecause`, exact source): q15 scores how STABLE energy is. This asks WHEN it changes. A person scoring low on q15 because of a 3pm dip and a person scoring low because mornings are hard need actions at opposite ends of the day, and q15 cannot tell them apart.

### Current product rationale
The **free** Food System Assessment already captures energy *stability* at q15 (a
four-point scale from "Very unstable" to "Consistently steady"). This paid question adds **WHEN**
energy changes during the day, not how stable it is.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

A self-reported description of the shape of a typical day, used to place low-risk
practical suggestions at a part of the day the customer says is relevant to them.

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- glucose dysregulation
- insulin resistance
- metabolic dysfunction
- microbiome dysfunction
- an endocrine disorder
- a sleep disorder
- Postbiotics inadequacy
- any inference that the reported pattern has an identified biological cause

### Specific matters for reviewer scrutiny

Reviewers should consider whether "the shape of your energy" is itself a construct that
invites biological reading, and whether placing an action at a reported time of day is a
scientifically neutral act or an implicit causal claim.

### Data-minimisation considerations

Five options, no free text, no follow-up. Sensitivity `low` — the question asks
about ordinary daily experience rather than health status.

### Safety considerations

No clinical vocabulary. The answer is not combined with any measurement, because the
product takes none.

### Claim → Data → Report trace

```
QUESTION        core_signals_energy_shape_v1
       ↓
RAW SELF-REPORT single — exact options listed above
       ↓
ANSWER FIELD    signals.energyShape
       ↓
REPORT TARGETS  priorityLever, thirtyDayLoop, bodySignalMap
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `priorityLever` · `thirtyDayLoop` · `bodySignalMap`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 2

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

## Question 3 — Signal Context

### Question ID
`core_signals_context_v1`

### Section
`signals` — **Your Signals**

> Section purpose shown to the customer: *What you notice day to day. There is no wrong answer, and nothing here is a medical judgement.*

### Foundation(s)
`you`  — **this foundation only**

### Required / optional
**Required** (when applicable)

### Sensitivity
`medium`

### Adaptive rule
**Adaptive.** Asked only when `core_signals_post_meal_pattern_v1` **notEquals** `nothing` / `prefer-not-to-say`.

Applicability uses the same full answer-validation contract as the trusted-answer projection: a missing trigger hides this question, an **invalid** trigger hides it, a valid matching trigger shows it, and a valid non-matching trigger hides it. An invalid parent answer can never reveal this question.

### EXACT CUSTOMER WORDING

**You:**

> On the days you notice it most, which of these are usually also true?

_No Family wording — this question is not asked of the Family foundation._

### EXACT SUPPORT TEXT

_None. This question carries no support text._

### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| Meals were rushed or skipped | `rushed` | — |
| Meals were unusually large or late | `large-late` | — |
| Stress was high or sleep was short | `stress-sleep` | — |
| I was eating out, travelling or away from home | `away-from-home` | — |
| No clear connection | `no-connection` | **exclusive** |
| Prefer not to say | `prefer-not-to-say` | **exclusive** |

### EXACT SEMANTIC ANSWER FIELD
`signals.context`

### Intent (exact source)
> Identifies what co-occurs with the signal, which is where a first change is most likely to land.

### Why needed (exact source)
> This is the single most useful thing the free Assessment never asks. Something that shows up on rushed days and something that shows up when away from home lead to completely different first steps. Asked only of someone who reported noticing something: 'on the days you notice it most' is an incoherent question for a person who has just said there is nothing to notice, or who declined to say — the same exclusion boundary as the settled-days question.

### EXACT REPORT TARGETS
`priorityLever` · `bodySignalMap` · `thirtyDayLoop`

### Free Assessment relationship
**No overlap.** The free Food System Assessment (q1–q15) does not cover this construct.

### Current product rationale
Asked **only after** a substantive post-meal signal has been reported. It asks what
else the customer notices was true on the days they notice that signal most.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

**Customer-reported co-occurrence.** The narrowest reading is: *this customer reports
that, on the days they notice their signal most, these other things were also often true.*

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- that the co-occurring factor caused the signal
- that a mechanism has been identified
- that an association has been demonstrated in this individual
- that the absence of a reported connection means no connection exists
- any diagnosis

### Specific matters for reviewer scrutiny

**Reviewers must explicitly distinguish four things and say which this question can
support:** customer-reported co-occurrence · population-level association · biological mechanism ·
causation. The product intends only the first. Reviewers should say whether the wording, the
options, or the intended Report use risks sliding from the first to the fourth.

### Data-minimisation considerations

Multi-select with two exclusive escapes ("No clear connection", "Prefer not to
say"), so a customer can answer truthfully without disclosing a stress or sleep context. Asked
only of customers who already reported a signal, so nobody who reported nothing is asked about
stress or sleep at all.

### Safety considerations

Sensitivity `medium`, because the option set touches stress and sleep. Both sit inside a
single multi-select alongside meal-timing options rather than being asked as separate health
questions.

### Claim → Data → Report trace

```
QUESTION        core_signals_context_v1
       ↓
RAW SELF-REPORT multi — exact options listed above
       ↓
ANSWER FIELD    signals.context
       ↓
REPORT TARGETS  priorityLever, bodySignalMap, thirtyDayLoop
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `priorityLever` · `bodySignalMap` · `thirtyDayLoop`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 3

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

## Question 4 — Settled Days

### Question ID
`core_signals_settled_days_v1`

### Section
`signals` — **Your Signals**

> Section purpose shown to the customer: *What you notice day to day. There is no wrong answer, and nothing here is a medical judgement.*

### Foundation(s)
`you`  — **this foundation only**

### Required / optional
**Required** (when applicable)

### Sensitivity
`low`

### Adaptive rule
**Adaptive.** Asked only when `core_signals_post_meal_pattern_v1` **notEquals** `nothing` / `prefer-not-to-say`.

Applicability uses the same full answer-validation contract as the trusted-answer projection: a missing trigger hides this question, an **invalid** trigger hides it, a valid matching trigger shows it, and a valid non-matching trigger hides it. An invalid parent answer can never reveal this question.

### EXACT CUSTOMER WORDING

**You:**

> On the days things feel more settled, what is usually different?

_No Family wording — this question is not asked of the Family foundation._

### EXACT SUPPORT TEXT

_None. This question carries no support text._

### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| Meals were more regular | `regular-meals` | — |
| Meals were lighter or simpler | `lighter-meals` | — |
| Less stress, or better sleep | `stress-sleep` | — |
| More movement | `movement` | — |
| I can't tell a difference yet | `cannot-tell` | — |

### EXACT SEMANTIC ANSWER FIELD
`signals.settledDays`

### Intent (exact source)
> Lets the reader name their own lever, which the Report can then back rather than replace.

### Why needed (exact source)
> Someone who has already noticed that regular meals help does not need to be told to try regular meals — they need help protecting the thing they found. Asked only of people who reported noticing something, because it is meaningless otherwise.

### EXACT REPORT TARGETS
`priorityLever` · `thirtyDayLoop`

### Free Assessment relationship
**No overlap.** The free Food System Assessment (q1–q15) does not cover this construct.

### Current product rationale
Asked only after a substantive post-meal signal has been reported. It asks what the
customer themselves notices is different on days that feel more settled.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

Identification of a low-risk routine that **the customer themselves believes**
accompanies a more settled day, which the Report may reinforce rather than replace.

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- that the reported difference is the cause of the settled day
- that a biological mechanism links the two
- that repeating the routine will produce the same result
- any physiological explanation of the reported association

### Specific matters for reviewer scrutiny

The specific risk to assess: this question invites the customer to supply their own
correlation, and the product then intends to build on it. Reviewers should say whether
reinforcing a customer's self-identified pattern is scientifically acceptable, and what wording
would prevent "I notice X when Y" from becoming "Y causes X" in the Report.

### Data-minimisation considerations

Five options including "I can't tell a difference yet". No free text. Sensitivity
`low`.

### Safety considerations

Every option describes an ordinary behaviour (meal regularity, meal size, stress or
sleep, movement) rather than a treatment.

### Claim → Data → Report trace

```
QUESTION        core_signals_settled_days_v1
       ↓
RAW SELF-REPORT single — exact options listed above
       ↓
ANSWER FIELD    signals.settledDays
       ↓
REPORT TARGETS  priorityLever, thirtyDayLoop
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `priorityLever` · `thirtyDayLoop`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 4

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

## Question 5 — Antibiotic History

### Question ID
`core_rhythm_antibiotics_v1`

### Section
`rhythm` — **Your Rhythm**

> Section purpose shown to the customer: *How food actually fits into your day and week, including anything that has recently changed.*

### Foundation(s)
`you`  — **this foundation only**

### Required / optional
**Optional**

### Sensitivity
`high`

### Adaptive rule
**Adaptive.** Asked only when `core_rhythm_recent_change_v1` **includes** `health-event`.

Applicability uses the same full answer-validation contract as the trusted-answer projection: a missing trigger hides this question, an **invalid** trigger hides it, a valid matching trigger shows it, and a valid non-matching trigger hides it. An invalid parent answer can never reveal this question.

### EXACT CUSTOMER WORDING

**You:**

> In the last two years, have you had a course of antibiotics?

_No Family wording — this question is not asked of the Family foundation._

### EXACT SUPPORT TEXT

**You:**

> Optional. It is used only as background, and your Report draws no medical conclusion from it.


### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| Yes, in the last six months | `recent` | — |
| Yes, longer ago than that | `older` | — |
| No | `no` | — |
| Not sure | `unsure` | — |
| Prefer not to say | `prefer-not-to-say` | — |

### EXACT SEMANTIC ANSWER FIELD
`rhythm.antibiotics`

### Intent (exact source)
> Adds timing context to a health event the customer has already chosen to mention.

### Why needed (exact source)
> Kept deliberately narrow. It is OPTIONAL, high-sensitivity, and asked only of someone who already mentioned a health event — so nobody is asked about antibiotics as a matter of course, and nobody has to answer. Its wording carries no claim about what antibiotics do; that is exactly the wording that needs human science review before this bank is ever activated.

### EXACT REPORT TARGETS
`educationModules` · `systemSnapshot`

### Free Assessment relationship
**No overlap.** The free Food System Assessment (q1–q15) does not cover this construct.

### Current product rationale
**You-only. Optional. High sensitivity. Adaptive** — reachable only after the customer
has already selected "A health event, or a period of recovery" in the recent-change question.
It collects **no medication name** and **no diagnosis**; only a coarse timing band.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

**Currently proposed as context only.** The narrowest reading is: *this customer chose
to disclose that a course of antibiotics occurred within a stated time band.* Whether even this
has a defensible downstream use is one of the questions under review.

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- microbiome damage
- microbiome depletion
- a need to 'rebuild' anything
- microbial restoration
- a defined recovery period
- a need for probiotics
- a need for fermented foods
- any medical treatment recommendation
- any inference about current biological state

### Specific matters for reviewer scrutiny

**Reviewers must decide six things explicitly, and retention is not the expected
answer:**

1. Is this question worth asking at all?
2. Is a two-year lookback scientifically or product-relevant, or arbitrary?
3. Are the timing categories ("in the last six months" / "longer ago than that") defensible, or do
   they imply a meaningful boundary that evidence does not support?
4. Does the answer legitimately alter anything in the Report?
5. Should it remain context only?
6. **Should it be removed** if no evidence-supported downstream use survives review?

**Removal is an acceptable and expected possible outcome.** The pack takes no position on whether
this question should survive.

### Data-minimisation considerations

This is the most constrained question in the bank: optional, adaptive behind a
disclosure the customer already chose to make, five coarse options including "Not sure" and
"Prefer not to say", no medication name, no condition, no course detail (number, duration, type).
Detailed antibiotic course history was considered and rejected during Phase 3A.

### Safety considerations

Sensitivity `high`. Because it is optional and adaptive, a customer can complete the
entire Consultation without ever seeing it. Its support text states the answer is used only as
background and that the Report draws no medical conclusion from it — reviewers should assess
whether that assurance is itself accurate and sufficient.

### Claim → Data → Report trace

```
QUESTION        core_rhythm_antibiotics_v1
       ↓
RAW SELF-REPORT single — exact options listed above
       ↓
ANSWER FIELD    rhythm.antibiotics
       ↓
REPORT TARGETS  educationModules, systemSnapshot
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `educationModules` · `systemSnapshot`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 5

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

## Question 6 — Food Constraints

### Question ID
`core_environment_constraints_v1`

### Section
`environment` — **Your Food Environment**

> Section purpose shown to the customer: *What you buy, cook and have access to — so your Report suggests things that fit your real life.*

### Foundation(s)
`you` · `family`

### Required / optional
**Required**

### Sensitivity
`medium`

### Adaptive rule
**Baseline** — always asked of the foundations listed above.

### EXACT CUSTOMER WORDING

**You:**

> Is there anything your Report needs to work around?

**Family:**

> Is there anything your household's Report needs to work around?

### EXACT SUPPORT TEXT

**You:**

> This is so your Report doesn't suggest something that doesn't suit you.

**Family:**

> This is so your Report doesn't suggest something that doesn't suit your household.


### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| A food allergy | `allergy` | — |
| Foods avoided for medical reasons | `medical-avoid` | — |
| Vegetarian or vegan | `vegetarian-vegan` | — |
| Religious or cultural requirements | `religious-cultural` | — |
| A limited food budget | `budget` | — |
| Very little time to cook | `time` | — |
| Foods I simply don't like<br>_Family:_ Foods we simply don't like | `dislikes` | — |
| Nothing in particular | `none` | **exclusive** |
| Prefer not to say | `prefer-not-to-say` | **exclusive** |

### EXACT SEMANTIC ANSWER FIELD
`environment.constraints`

### Intent (exact source)
> The safety and usability boundary for every food the Report suggests.

### Why needed (exact source)
> This Report recommends foods, so it has to know what not to recommend. Deliberately framed as what to work AROUND rather than as a medical intake: it asks for no diagnosis, no medication and no detail about a condition — only the constraint itself.

### EXACT REPORT TARGETS
`foodTools` · `thirtyDayLoop` · `familyContext`

### Free Assessment relationship
**No overlap.** The free Food System Assessment (q1–q15) does not cover this construct.

### Current product rationale
The primary purpose of this question is **food-guidance safety and practical
usability**, not biological interpretation. It asks what the Report must work *around*; it does
not ask what the customer has.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

A declared list of things the Report must accommodate or avoid. For the allergy and
medical-avoidance values specifically, it additionally sets a **safety flag** requiring that a
specific avoidance be resolved before specific food suggestions are made.

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- any diagnosis, from any option
- that a declared medical avoidance identifies a condition
- that the absence of a declared constraint means no constraint exists
- that the product has assessed whether an avoidance is clinically necessary
- any nutritional adequacy judgement about a declared dietary pattern

### Specific matters for reviewer scrutiny

**Reviewers should determine:**

- whether the terminology used for each option is appropriate;
- whether the question is proportionate to its purpose;
- whether *required, with `none` and `prefer-not-to-say` as exclusive options* is the right
  configuration, or whether it should be optional;
- whether it provides a sensible **first** safety boundary for future food suggestions;
- whether it accidentally implies a medical competence the product does not have.

Reviewers are **not** asked to expand this into clinical intake.

### Data-minimisation considerations

Broad categories only. No condition, no diagnosis, no medication, no severity, no
detail about why a food is avoided. Two exclusive escapes.

### Safety considerations

This is the question the food-safety contract keys off. Sensitivity `medium`. The
allergy and medical-avoidance values are the sole triggers for the follow-up question, and the
sole inputs to `requiresSpecificAvoidance`.

### Claim → Data → Report trace

```
QUESTION        core_environment_constraints_v1
       ↓
RAW SELF-REPORT multi — exact options listed above
       ↓
ANSWER FIELD    environment.constraints
       ↓
REPORT TARGETS  foodTools, thirtyDayLoop, familyContext
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `foodTools` · `thirtyDayLoop` · `familyContext`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 6

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

## Question 7 — Food Avoidances

### Question ID
`core_environment_food_avoidances_v1`

### Section
`environment` — **Your Food Environment**

> Section purpose shown to the customer: *What you buy, cook and have access to — so your Report suggests things that fit your real life.*

### Foundation(s)
`you` · `family`

### Required / optional
**Optional**

### Sensitivity
`high`

### Adaptive rule
**Adaptive.** Asked only when `core_environment_constraints_v1` **includes** `allergy` / `medical-avoid`.

Applicability uses the same full answer-validation contract as the trusted-answer projection: a missing trigger hides this question, an **invalid** trigger hides it, a valid matching trigger shows it, and a valid non-matching trigger hides it. An invalid parent answer can never reveal this question.

### EXACT CUSTOMER WORDING

**You:**

> So your Report doesn't suggest something unsuitable, which of these should it avoid?

**Family:**

> So your household's Report doesn't suggest something unsuitable, which of these should it avoid?

### EXACT SUPPORT TEXT

**You:**

> Optional, and this list is not exhaustive. Whatever you choose, always check labels yourself as well.

_Family sees the same support text._

### EXACT ANSWER OPTIONS

| Label | Semantic value | Exclusive |
|---|---|---|
| Milk or dairy | `dairy` | — |
| Eggs | `eggs` | — |
| Fish or shellfish | `fish-shellfish` | — |
| Nuts or peanuts | `nuts` | — |
| Wheat or gluten | `wheat-gluten` | — |
| Soya | `soya` | — |
| Sesame | `sesame` | — |
| Something else, not listed here | `other` | — |
| Prefer not to say | `prefer-not-to-say` | **exclusive** |

### EXACT SEMANTIC ANSWER FIELD
`environment.foodAvoidances`

### Intent (exact source)
> Turns a declared avoidance into something the food section can mechanically work around.

### Why needed (exact source)
> Only asked of someone who has already said there is an allergy or a medical avoidance, and optional even then. Named for avoidance rather than allergens because a food avoided for medical reasons is frequently not an allergen. Broad categories rather than free text, because a Report generator cannot reliably parse a sentence and a mis-parsed avoidance is the worst failure this product could have — and where the categories do not cover it, the answer says so rather than pretending to.

### EXACT REPORT TARGETS
`foodTools` · `thirtyDayLoop`

### Free Assessment relationship
**No overlap.** The free Food System Assessment (q1–q15) does not cover this construct.

### Current product rationale
**High sensitivity. Optional. Adaptive** — reachable only after an allergy or a
medical food avoidance has been declared. Structured categories, not free text.

### PROPOSED INTERPRETATION BOUNDARY — NOT SCIENTIFICALLY APPROVED

A structured list of broad food categories the Report should avoid suggesting, plus an
explicit record of whether the avoidance remains **unresolved**. Named for *avoidance* rather than
*allergen* because a food avoided for medical reasons is frequently not an allergen.

### PROPOSED PROHIBITED INFERENCES — NOT SCIENTIFICALLY APPROVED

The product architecture currently intends **not** to infer any of the following from this answer. Whether this list is correct, sufficient or over-broad is itself under review:

- that the listed categories are exhaustive
- that a selected category identifies an allergy rather than an avoidance
- any severity, threshold or cross-reactivity judgement
- that the product has verified the avoidance
- that not selecting a category means that food is safe for this customer

### Specific matters for reviewer scrutiny

**The merged Phase 3A safety contract**, `deriveFoodGuidanceConstraints()`
(`lib/consultation/food-guidance.ts`), distinguishes: declared constraints · whether a specific
avoidance must be resolved · known structured avoidances · **unresolved specific avoidance**.

`unresolvedSpecificAvoidance = true` when an allergy or medical avoidance was declared **and** any
of the following holds: the optional detail question was not answered · "Something else, not
listed here" was selected · "Prefer not to say" was selected. A known category selected *alongside*
"Something else" is still unresolved.

**The customer is never forced to disclose more.**

The proposed future use is that **Phase 4A may constrain or suppress specific food recommendations
while an avoidance remains unresolved**. This is
**PROPOSED PRODUCT SAFETY BEHAVIOUR — NOT IMPLEMENTED, NOT SCIENTIFICALLY APPROVED**, and it is
explicitly *not* clinical allergy management.

**Reviewers are asked to assess that distinction**: is "hold back specific suggestions when we do
not know what to avoid" a scientifically and safety-wise reasonable product behaviour, and is it
clearly distinguishable from clinical allergy management? Reviewers are **not** asked to design
clinical allergy management.

### Data-minimisation considerations

Optional even when reachable. Eight broad categories plus an exclusive decline. No
severity, no reaction description, no diagnosis, no medication, no free text. The customer may
skip it entirely and still complete the Consultation.

### Safety considerations

Sensitivity `high`. Its support text states that the list is not exhaustive and that the
customer should check labels themselves — reviewers should assess whether that is adequate. The
deliberate design choice to use structured categories rather than free text was made because a
Report generator cannot reliably parse a sentence, and a mis-parsed avoidance is the most
consequential failure this product could have; reviewers may disagree with that trade-off.

### Claim → Data → Report trace

```
QUESTION        core_environment_food_avoidances_v1
       ↓
RAW SELF-REPORT multi — exact options listed above
       ↓
ANSWER FIELD    environment.foodAvoidances
       ↓
REPORT TARGETS  foodTools, thirtyDayLoop
       ↓
PROPOSED USE    (see PROPOSED INTERPRETATION BOUNDARY above — not approved)
```

Report targets in full: `foodTools` · `thirtyDayLoop`. Each is a real field of `FoodSystemReport` (`lib/report/food-system-report-types.ts`); a compile-time assertion in the Phase 3A tests enforces that, so no target here names a deliverable that does not exist.

### Common review questions for Question 7

Answer the **COMMON REVIEW QUESTIONS** block above, in full, for this question. The block is identical for all seven questions and for all three reviewers.

---

# COMMON CROSS-QUESTION REVIEW

1. Does the seven-question subset collectively drift toward medical intake despite individual neutral wording?

2. Is any question unnecessary for the Report?

3. Is any sensitive information being collected without sufficient downstream value?

4. Could combining energy + digestive comfort + meal timing + stress/sleep context create false biological certainty?

5. Which collected signals should remain descriptive context only?

6. Which signals can legitimately influence low-risk practical recommendations?

7. Are any Report targets too ambitious for the evidence available?

8. Is the distinction between:
   - observed pattern,
   - association,
   - mechanism,
   - diagnosis
   sufficiently clear?

9. Does the overall Consultation remain educational and non-diagnostic?

10. What is the single greatest scientific-overclaim risk in the current architecture?

11. What is the single greatest omission in the science boundary?

12. Is any question better removed than constrained?

# END COMMON CROSS-QUESTION REVIEW

---

## Postbiotics Boundary Review

# PROPOSED POSTBIOTICS BOUNDARY — NOT APPROVED

> "EatoBiotics may use self-reported patterns as educational context while making no claim that those patterns quantify postbiotic compounds, microbial products, microbial metabolites, microbial production or clinical adequacy."

This wording says **self-reported patterns** rather than *downstream patterns*. The word "downstream" would itself imply a causal chain from an unmeasured biological process to the reported experience — exactly the inference the boundary exists to prevent. Reviewers should confirm whether that choice is right, and whether any other phrase in the statement carries a similar implication.

**Every reviewer must answer:**

1. Is the proposed boundary scientifically responsible?
2. Is it too broad or too narrow?
3. Does any phrase imply mechanism?
4. What should change?
5. What inferences must remain prohibited?

---

## Universal Food-Safety Copy Review

# PROPOSED PHASE 4A COPY — NOT IMPLEMENTED

> "Always check ingredients and labels against your own known allergies, intolerances and medical food restrictions."

This sentence exists **only** in this pack. It is not in the product, not in the Report, and not in the question bank. It is proposed for a future phase and is under review here.

**Every reviewer must answer:**

- Is it scientifically and safety-wise appropriate?
- Is it sufficient?
- Is "intolerances" appropriate in this sentence?
- Should it mention professional medical or dietetic guidance?
- Would stronger wording create unnecessary clinical framing for an educational product?

---

## Common Reviewer Output Format

# COMMON REVIEW OUTPUT — REQUIRED FOR ALL REVIEWERS

Every reviewer must complete **every field** in the common output structure below. The common
headings, the seven question sections, the A–E rating, recommendations, allowed interpretation,
prohibited interpretation, Report use, wording, sensitivity, confidence, sources, cross-question
review, Postbiotics review, food-safety copy review, final matrix and activation recommendation
must **not** be removed, renamed, omitted or replaced.

That is what makes three blinded reviews comparable field for field. A reviewer who restructures
the common output has produced something that cannot be adjudicated against the other two.

# REVIEWER-SPECIFIC SUPPLEMENTAL ANALYSIS IS ALLOWED

A reviewer may **append** clearly labelled additional analysis required by its reviewer role.
Supplements are additive: they never replace, substitute for, or excuse omitting a common field.

For example:

- **Reviewer B** may add a Claim → Data → Report trace and inference-inflation analysis.
- **Reviewer C**, as the adversarial reviewer, may add: Case FOR Keeping · Case AGAINST Keeping ·
  Alternative Explanations · Non-specificity analysis · Causal-reversal analysis ·
  Recommendation-leap analysis · Antibiotics removal test · Food-safety failure test.

This preserves reviewer diversity — the adversarial reviewer's job is not the same as the
literature reviewer's — while keeping the comparison surface identical.

### The common structure

```markdown
# Independent Science Review

## Reviewer Model

## Review Date

## Evidence Search Method

## Executive Verdict

## Question 1 — Post-Meal Pattern
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Question 2 — Energy Shape
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Question 3 — Signal Context
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Question 4 — Settled Days
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Question 5 — Antibiotic History
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Question 6 — Food Constraints
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Question 7 — Food Avoidances
### Evidence Rating
### Recommendation
### Evidence Supporting
### Evidence Limiting / Contradicting
### Allowed Interpretation
### Prohibited Interpretation
### Report Use Assessment
### Wording Assessment
### Sensitivity Assessment
### Confidence
### Sources

## Cross-Question Review

## Postbiotics Boundary Review

## Universal Food-Safety Copy Review

## Highest-Risk Scientific Claim

## Questions Recommended for Removal

## Questions Recommended for Rewrite

## Questions Suitable as Context Only

## Questions With Stronger Support

## Evidence Gaps

## Specialist Escalations

## Final Matrix

| Question ID | A–E Rating | Keep / Rewrite / Remove / Escalate | Maximum Allowed Claim | Prohibited Claim | Confidence |
|---|---|---|---|---|---|

## Overall Activation Recommendation

Choose exactly one:

- READY FROM A SCIENCE/EVIDENCE PERSPECTIVE AS WRITTEN
- READY AFTER SPECIFIED WORDING/BOUNDARY CHANGES
- NOT READY — MATERIAL EVIDENCE GAPS
- SPECIALIST HUMAN REVIEW REQUIRED FOR SPECIFIED ITEMS
```

---

## Non-Anchoring Statement

This pack contains **no** prior scientific conclusion. Specifically, it does not contain any earlier architecture-review verdict, any earlier implementation defence, any prediction of how a question will be rated, and no aggregated view of what other reviewers concluded.

Architecture facts, exact source wording, and explicitly-labelled **proposed** product boundaries are included, because a reviewer cannot assess a boundary they cannot see. Every such boundary is labelled `PROPOSED … NOT SCIENTIFICALLY APPROVED`, and disagreeing with any of them is a valid review outcome.

**Removal of a question is an acceptable and expected possible outcome**, including for `core_rhythm_antibiotics_v1`, where the pack explicitly asks whether the question should exist at all.

---

## What This Pack Does Not Ask Reviewers To Do

- Design clinical allergy management.
- Expand any question into medical intake.
- Assess the live runtime-AI question path (out of scope; not part of this bank).
- Assess the legacy fallback question bank (unchanged, still live, out of scope).
- Assess the four deterministic Lens banks (unchanged, out of scope).
- Judge the product's commercial model, pricing or presentation.
