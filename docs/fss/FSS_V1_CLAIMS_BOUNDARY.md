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

### 6.1 The fifteen comparative sentences — a named review dependency

Gate 5 produced `DOMAIN_CHANGE_COPY` (`lib/fss/presentation/changed.ts`): five
domains × `{ higher, lower, similar }`, each written out in full. They are the
only place in the product that asserts a **direction** about a person's
reported behaviour.

The arithmetic behind a direction is sound — two numbers from one instrument,
with `canCompare` and `canCompareDomains` both permitting the pair. What has
**not** been established is whether each sentence's wording stays inside that
and goes no further.

**They are CANDIDATE content and are fenced to the gated preview.** They do not
appear on any customer surface, and `tests/unit/my-food-system.test.ts` asserts
that nothing outside `lib/fss`, `components/fss` and
`app/preview/food-system-v1` imports them.

Graduation is blocked by `COMPARATIVE_COPY_REVIEW`, whose `state` is pinned
`"pending"`. A named human must answer all six of these first, and
`reviewedBy` must record who:

1. whether they merely describe answers;
2. whether they imply direction;
3. whether direction is justified;
4. whether they imply health improvement;
5. whether they imply causality;
6. whether they accidentally turn relative ranking into absolute health status.

This is a **finite review exercise, not an architectural redesign.** In
particular it must not be settled by a downstream need: a later gate wanting
explanatory language for an AI surface is not a reason to approve copy, and the
fence exists because that is how unreviewed wording has graduated before.

#### Review pass of 2026-10-02 — 6 approved, 9 revised, 0 rejected

Run against the six criteria, each sentence read against its own domain's
reviewed `whatItMeans` and band wording rather than against an assumption.
**The review itself remains PENDING**: this pass fixed nine sentences and is
not a sign-off, because the thing being certified is a human judgement.

| Domain | Verdict | Why |
|---|---|---|
| `diversity` | **approved** | "range" is the domain's own word, and it says "the range rather than the amount" |
| `plantsAndFibre` | **revised** | restored the dropped "**whole**" — the domain says "fibre-rich whole plant food" |
| `fermentedFoods` | **revised** | "arriving" → "**appearing**", the domain's own verb |
| `foodQuality` | **revised** | see below — the substantive finding |
| `mealRhythm` | **approved** | "steadier" is the domain's own word; limitation recorded below |

**`foodQuality` carried two defects at once.** It read *"less heavily
processed food"*, which is (a) grammatically ambiguous — "less
[heavily-processed food]" is a quantity, "[less heavily] processed food" is a
degree, and the sentence chose neither — and (b) written in vocabulary the
domain does not use. The approved wording is *"how much of what you eat is
prepared from whole ingredients rather than arriving ready-made"*; "heavily
processed" was introduced by the comparative copy and is more loaded than the
word a reviewer signed off. Now: *"more / less / about as much of your food
starting from whole ingredients"*.

**`mealRhythm`'s recorded limitation.** The domain's `whatItMeans` is "when you
eat, how regularly, **and what a typical main meal is made of**". "Eating
rhythm" covers only the timing half, so the sentence **under**-describes what
the domain scores. Under-describing is the safe direction, so it is approved
with this noted rather than patched with wording nobody has reviewed.

#### An open presentation question, recorded rather than decided

The fifteen render in a block headed "Your food patterns" **directly above a
score that moved**. Five directional statements stacked above `67 → 72` read as
corroboration — work that no individual sentence does. Every sentence passes
the health-improvement criterion alone; **the block may not.**

This is a layout question, not a wording one, so it was deliberately not
touched during a copy review. It needs its own decision before these sentences
reach any customer surface.

#### Excluded from AI context

The two demo-only predicted-outcome taglines in
`components/account/dashboard-client-data.ts` — *"targeted effort will
accelerate it"* and *"Consistency is your next big unlock"* — remain on the
claims ledger. They **must not reach Gate 6 context or any generated AI
language**: a predicted outcome entering an explanation layer is how an
explanation becomes a promise.

### 6.2 What may be said about a changed self-report

An observation comparison carries **no direction and no number** — only the two
option labels, quoted. "You reported afternoon energy dips less often" embeds an
interpretation of the option ordering, and EatoBiotics has no reviewed ordinal
model for any What You Notice question. What it knows is that the person
selected one option before and another now, so that is what it shows:

> **Previously** Mostly stable · **Now** Consistently steady

The three classes are `changed-selection`, `same-selection` and
`not-comparable` (one side has no selection). A directional sentence here needs
both a reviewed ordinal model for the question **and** approved comparative
copy — two dependencies, neither met.

## 7. The transitional vocabulary policy

"Food System Score" is **transitional**, not retired — forbidden on some
surfaces, permitted on others, required on canonical surfaces only after the
contract phase. The full matrix is `FSS_V1_DESIGN_SPEC.md` §11. The guard must
become lifecycle-aware — a policy lookup of (term, surface class, phase)
replacing a blanket regex.

## 8. The Intelligence boundary

Frozen at Gate 6.0, before any model was introduced. Gate 6.0 built the
containment vessel and made **no model call at all** — which is the only point
at which these rules could be written down honestly, because nothing yet
depended on relaxing them.

### 8.1 The five rules

> **Structured truth is authoritative.**
> **AI receives only the context required by its declared intent.**
> **Context is capability.**
> **Validate claim bindings deterministically; guard language separately.**
> **AI may explain or operationalise a decision. It may not silently make a
> new one.**

Each is paired below with the instrument that enforces it. That pairing is the
section's real content: this programme's recurring finding is not that a rule
was unwritten, it is that a written rule had no named instrument and drifted
until a sabotage case or a live read found it.

| Rule | Enforced by |
|---|---|
| Structured truth is authoritative | The no-methodology-import guard, pinned **by filename** over `lib/fss/system/ai-context.ts` and `lib/fss/system/ai-claims.ts`. The layer receives verdicts and decisions, never the functions that reach them. Pinned by filename rather than by directory glob: a glob silently covers a new file, and silently covers nothing once the directory is renamed. |
| AI receives only the context its intent requires | `INTENT_FIELDS` is one declaration read three ways — the TypeScript projection via `Pick`, the runtime object, and the test. Each intent's key set is pinned **by value**, and asserted as **equality in both directions**: a missing required field fails as surely as an undeclared extra one, because subset-only validation silently drops grounding and a model missing its grounding substitutes something. |
| Context is capability | `INTENT_DENIED` is asserted against the **built object** — `not in`, never "is undefined", since a field present and undefined has still been handed over. The ceiling is a **type with no runtime value**, so there is nothing to spread and nothing to spread-then-delete; the builder constructs positively by iterating the declared keys. `AiIntent` is closed at three, pinned by value, with no `"raw"`, no `"all"` and no `undefined`. |
| Validate bindings deterministically; guard language separately | `validateClaimBinding` reads ids and domains and has **no sentence parameter to read**. Its six refusals each name a different appeal. A source test refuses `sentence`, `prose`, `text:`, `toMatch` and `RegExp` in `ai-claims.ts`, so the withdrawn free-text design cannot return quietly. The language guards — `assertClean` / `GENERATED_CLAIM_RULES` and `PERSONAL_BIOTIC_STATE` — stay where they are, **separate from and subordinate to** the binding check. |
| Explain or operationalise, never silently decide | `ClaimBasis` has no `alternatives`, no `consideredDomains`, no `suggestedPriority` and no `confidence`, pinned by key set — an appeal is not a thing the type can hold. **Rank is part of the binding**: `StoredPriorityDecision.selected` holds up to three, so binding to the rank-2 entry while calling it "your current focus" would reorder a persisted decision with entirely correct ids. Membership is not enough. |

### 8.2 Why the binding is structural and not a language check

The first design of the claim validator read arbitrary prose and decided
whether it contradicted the persisted plan. It was withdrawn in review for two
reasons, and the second is the load-bearing one:

- it would have been a second miniature NLP engine, in a gate that exists to
  have **one** decision engine;
- and worse, it would have been a **decision engine deciding whether a claim is
  acceptable**. A regex asked *"does this prose secretly disagree with the
  plan?"* is wrong in both directions and unfixable in either.

So the direction is inverted. The explanation is **structured first**, and prose
is generated from the structure. The model is not given free rein and then
policed; it is given only the basis it is permitted to explain. That is the same
move as the context contract, one level down: **constrain the input rather than
audit the output.**

### 8.3 Two permanent guards

Both were added at Gate 6.0d because the sabotage list contained cases nothing
was aimed at. Both are permanent.

**Comparative prose is blocked at the AI-layer import boundary.** A behavioural
test already catches prose that reaches the built context object; this catches it
one step earlier, because a sentence in the module is one edit from being in the
context. The route it closes is specific and was nearly missed:
`COMPARATIVE_COPY_REVIEW.state` is `"pending"` (§6.1), and the `CANDIDATE_ROOTS`
fence permits `lib/fss` — which is where this layer lives. So pending copy could
have become newly generated customer copy through a door that fence does not
watch.

**Methodology values are blocked from the ceiling, as firmly as methodology
functions.** The import guard stops a scoring or selection function arriving.
This stops the numbers arriving without it — weights, band thresholds, a ranking
rule — which would let a model recompute a score or a band and reach a figure no
deterministic component produced. A model should not receive weights simply
because nobody imported the scoring engine.

### 8.4 What clearing this boundary does **not** approve

Gate 6.0 settles how an AI may be given material and what it may be asked to
explain. It settles nothing about whether the material is scientifically right.

Still open, and must stay visibly open:

- the five candidate domains;
- the seven draft questions, and q6's wording;
- the domain weights;
- the canonical score bands, and `interpretation-v1.0`, still unregistered on
  purpose;
- the candidate recommendation catalogue;
- the fifteen comparative sentences — `COMPARATIVE_COPY_REVIEW.state` is
  `"pending"` and `reviewedBy` is null (§6.1).

The candidate product stays inside its preview fence until FSS-v1 itself is
scientifically reviewed. **A narrower box around the model is not a warrant for
what the box contains.**
