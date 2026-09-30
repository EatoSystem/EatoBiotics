# EatoBiotics
## Food System Score™ — Canonical Product Architecture
### Revised Proposal — No Implementation

**Nothing was changed.** No score, question, label, contract, guard, schema,
report or page was touched. This document is the deliverable.

---

## 0. Founder Correction — Adopted, And Why It Is Right

**Binding constraint on everything below:** the Three Biotics are not replaced.
Prebiotics · Probiotics · Postbiotics remain the scientific foundation of
EatoBiotics. Additional dimensions **extend and clarify** that framework rather
than superseding it. The work is editing, re-bucketing and selective extension
— not a rebuild.

**The previous draft of this document overcorrected, and the correction is
sound.** It went from a real defect — *"Postbiotics — 64" claims something six
self-reported questions cannot measure* — to a disproportionate remedy: five
flat peer domains with the biotics demoted to an education layer. That solves
the science problem by discarding the brand architecture. It was the wrong
trade and it is withdrawn.

**The distinction that dissolves most of the objection:**

> Prebiotics can *organise* what we measure about plant diversity and fibre
> without the number claiming to measure prebiotics. Postbiotics can remain
> foundational science **without a personal postbiotic score existing at all.**

A biotic can be a **grouping with meaning** rather than a bar with a number.
That is a presentation decision, and it is free — the contract objects to
*claims*, not to headings.

**The three layers, adopted as the product's spine:**

| Layer | What it is | Carries a number? |
|---|---|---|
| **Science** | Prebiotics · Probiotics · Postbiotics | No — they group and teach |
| **Understanding** | Your Food System Score™ + its dimensions | **Yes** |
| **Action** | Feed · Seed · Rejuvenate | No |

Everything below is revised to this structure.

---

## 1. Executive Summary

The destination is accepted: **Your Food System Score™** as the canonical
personal metric, **My Food System Score™** in the account, the **Three
Biotics** as the scientific foundation it is built on, and
**Feed · Seed · Rejuvenate** as the action framework. The task is to make the
name true by evolving what exists.

**It can be made true, largely without new science.** The assessment already
measures five things that are legitimately scoreable food-system dimensions.
They currently sit inside three biotic labels, one of which — `Postbiotics` —
names something the science contract explicitly forbids inferring from
self-report. **The fix is to nest precise dimensions under the biotics, and to
stop attaching a personal number to Postbiotics.** Nothing needs to be thrown
away to achieve that.

**Five findings that shape the design.**

1. **Postbiotics keeps its place and loses its number.** `POSTBIOTICS_
   INFERENCE_BOUNDARY` prohibits "personal Postbiotics state", "low
   Postbiotics" and "Postbiotics production", and prohibits the relationships
   *quantify, indicate, reflect, correspond-to, result-from, be-produced-by*.
   A bar reading `Postbiotics — 64` is a personal postbiotic state as a number.
   **Live today.** Removing the number removes the exposure; removing the
   biotic was never necessary.
2. **Symptoms should leave the score** and become **What You Notice** (§14).
   They are outcomes, not food-system inputs, and they carry the highest
   diagnostic-reading risk in the instrument.
3. **The 20-point floor has to go.** The scale is presented as 0–100 while
   nothing under 20 is reachable, which overstates the bottom of every score
   ever issued.
4. **The contract needs an ADDITION, not a weakening** —
   **science-contract-v1.1, additive** (§23). `cannotProduceValidatedSystemModel`
   is not an obstacle to a Food System Score; it is an obstacle to one that
   *claims a system model*. If review concludes the rule must be relaxed to
   permit the name, that is the signal the name is wrong, not the rule.
5. **The name you proposed for the pre-launch flow is also banned.**
   `retired-vocabulary.test.ts:171` refuses `/\bfood system snapshot\b/i`,
   `/\byour snapshot\b/`, `/\bthe snapshot\b/`, retired in the same event as
   "Food System Score" (§27).

**And one new problem the corrected architecture creates, which must be solved
deliberately rather than discovered later** — see §7.1: if Prebiotics holds two
scored dimensions, Probiotics one and Postbiotics none, a customer reading
"Three Biotics" with one of them carrying no number will read it as *missing*
or *zero*. That is a design problem with a good answer, not a reason to go back.

**GO** on the corrected architecture. **GO** on Phase 1 now, independently.
**NO-GO** on any customer-visible "Food System Score™" until Phases 0–5 are
done: the name ships last.

---

## 2. What Changed From The Previous Brief

| Previous assumption | Now |
|---|---|
| The 60-second flow was the free product | It is a **pre-launch acquisition mechanism only**, and must not constrain the canonical model |
| Question was "should we rename?" | Question is **"what must be true for the name to be honest?"** |
| Biotics were the score bars | Biotics become the **science layer**; domains become the score bars; actions stay the actions |
| Retired-vocabulary test read as authority | Read as **history to learn from**, not a veto — but its *reason* is preserved and designed around |

The previous review's central objection stands and is now answered rather than
overruled: the old failure was *"take existing internal input dimensions and
call them the Food System Score."* This design does the opposite — it defines
the promise, derives the domains, and only then permits the name.

---

## 3. Product Architecture — Four Levels

| Level | Name | Length | Produces | Status |
|---|---|---|---|---|
| **L0** | Pre-launch check (§27) | 5 q, ~60s | A **direction**, not a score | Exists (`lib/quick-assessment.ts`) |
| **L1** | **Food System Assessment** | ~20 q, 3–4 min | **Your Food System Score™** | 15 q exist; needs ~5 (§9) |
| **L2** | Personal Food System Consultation | Deep, paid | The Report + Plan | Exists — 4 sections: symptoms, history, lifestyle, goals |
| **L3** | Modules | Varies | Domain depth | Exists — `lib/assessment/registry.ts`: stability, glucose, mind, performance, pregnancy |

**L3 already exists and is better architecture than it is currently credited
for.** The registry has foundations / health / life kinds, and `performance`
already carries its own four native pillars (Energy, Build, Recovery,
Protection). The Food System Score should be **L1 only** — modules deepen
understanding, they must not silently move the headline number, or no two
people's scores mean the same thing.

---

## 4. Definition — "The Food System Inside You"

**Brand concept, not a measurement claim.** Proposed working definition:

> *The Food System Inside You* is EatoBiotics' way of describing the
> relationship between what you eat, how you eat, and the living system that
> depends on it.

That is a lens, and lenses are allowed to be evocative. The measurement claim
is a separate sentence and must never inherit the lens's scope (§15).

---

## 5. Definition — Food System Score™

> **Your Food System Score™ is a structured summary of the food patterns you
> report: what reaches your plate, how varied and how processed it is, how
> often living foods appear, and the rhythm you eat to.**

Drafting notes: it says *report* (self-report is explicit), it enumerates the
domains (scope is legible), and it contains no organ, no biology and no
outcome. It survives `REPORT_COMPOSITION_BOUNDARY.prohibitedFramings` because
it never says "your system is".

**In-product one-liner:** *"Where your food system is today, from what you told
us."*

---

## 6. What Food System Score™ Must NOT Mean

Proposed as a contract-grade list (§23), mirroring `POSTBIOTICS_INFERENCE_BOUNDARY`:

- not a diagnosis, disease risk, or prediction
- not a measure of the microbiome, its composition, activity or metabolites
- not a biomarker, clinical state or metabolic state
- not a validated computational model of a person
- not a measure of health, fitness or biological age
- not a judgement of the person, their income or their circumstances
- not comparable across methodology versions without an explicit rule (§22)

---

## 7. The Architecture — Dimensions Nested Under The Biotics

**The Three Biotics are the foundation and stay visible. The dimensions are the
precise, scoreable things sitting under and beside them.**

```
THE THREE BIOTICS — the foundation
  Prebiotics    → Diversity            scored
                → Plants & Fibre       scored
  Probiotics    → Living Foods         scored
  Postbiotics   → the science of what your food system gives back
                                       TAUGHT, NOT SCORED

WIDER FOOD SYSTEM
                → Food Quality         scored
                → Meal Rhythm          scored

WHAT YOU NOTICE  digestion · energy · how you feel after eating
                                       reported, never scored

YOUR CONTEXT     access · time · home · work · cooking environment
                                       shapes the PLAN, never the score
```

**Five scored dimensions.** Three live under the biotics, two extend beyond
them. That is the smallest set that is both credible and already substantially
measured.

| Dimension | Under | What it means | Measured today | New q |
|---|---|---|---|---|
| **Diversity** | Prebiotics | Range and rotation of plants | Yes — q1–q3 | 0 |
| **Plants & Fibre** | Prebiotics | Fibre, wholefoods, prebiotic-rich foods | Yes — q4, q6 | 0–1 |
| **Living Foods** | Probiotics | Fermented and live-culture foods | Yes — q7–q9 | 0 |
| **Food Quality** | Wider | Processing exposure, whole vs ultra-processed | Partly — q5 | **+2** |
| **Meal Rhythm** | Wider | Timing, regularity, structure | Yes — q10–q12 | 0–1 |

**One deviation from your sketch, and the reason.** You suggested Probiotics
might carry two dimensions — *Fermented Foods* and *Variety / Frequency*.
Splitting q7–q9 two ways leaves a one-question dimension, which is the same
fragility that makes Food Quality need two more items. **Recommend Probiotics
carries one dimension, "Living Foods", built from all three questions** — with
variety and frequency reported inside it rather than as a separate bar.

### 7.1 The asymmetry problem — and how to solve it honestly

Prebiotics holds two scored dimensions, Probiotics one, Postbiotics none. Shown
as three equal foundation blocks where one has no number, **a customer will read
Postbiotics as missing, broken, or zero.** This is the one genuinely new problem
the corrected architecture introduces, and it must be designed, not discovered.

**Rejected:** moving Meal Rhythm under Postbiotics to balance the columns. That
is precisely the prohibited inference — it asserts rhythm *results in* or
*corresponds to* postbiotic production, which `POSTBIOTICS_INFERENCE_BOUNDARY`
lists by name (`result-from`, `correspond-to`). Balance is not worth a claim.

**Recommended:** render Postbiotics in a **deliberately different visual form**
— not an empty bar, but the closing statement of the foundation:

> **Postbiotics** — what your food system gives back.
> This is why the other two matter. We teach it; we don't score it, because
> nothing you can tell us in an assessment measures it.

That turns the absence into the most credible thing on the page. A product that
says "we don't measure this and here's why" earns the reader's trust in every
number it *does* show.

### 7.2 Weighting must be declared, not emergent

**The trap this architecture sets:** if the overall score averages five
dimensions, Prebiotics silently carries **40%** (two of five) while Probiotics
carries 20% — reproducing exactly the 40/20/40-by-question-count defect that
this review criticised, in new clothes.

**Rule: weights are an explicit, versioned constant**, chosen and justified —
never a side effect of how many dimensions happen to nest under a biotic. Two
defensible starting positions, for science review to choose between:

- **Equal per dimension** (20% × 5) — simple, no evidence claim; Prebiotics
  ends up weighted heaviest, which is at least arguable on the literature.
- **Equal per group** (Prebiotics 33% split across its two, Probiotics 33%,
  Wider 33%) — preserves the foundation's symmetry in the arithmetic.

Either is fine. **Silence is not.**

### 7.3 What You Notice, and Your Context — definitively unscored

Your note said these "improve interpretation and personalisation without
necessarily changing the score." **Recommend removing "necessarily".** Make it
absolute, and put it in the contract (§23):

- **What You Notice** (q13–q15) — outcomes, not inputs. Scoring them means two
  people with identical habits get different scores because one feels worse,
  which makes the number uninterpretable and reads as a health verdict.
- **Your Context** — access, time, home, work, cooking environment. **Factors a
  person cannot readily change must never depress the Score.** A dimension that
  lowers someone's number because they live in a food desert or work nights is
  scoring their circumstances. These make the **Plan** far more relevant — same
  priority dimension, different plan for no-time versus no-budget — which is
  where their value actually is.

An ambiguous "not necessarily" is how a factor migrates into the score later
under pressure to "use the data".

---

## 8. Existing Questions → Proposed Domains

| Question | Asks | Today | Proposed | Under |
|---|---|---|---|---|
| q1–q3 | plants/week, categories per meal, deliberate variety | Prebiotics | **Diversity** | Prebiotics |
| q4, q6 | fibre-rich wholefoods; named prebiotic foods | Prebiotics | **Plants & Fibre** | Prebiotics |
| q5 | share of diet processed / ultra-processed | Prebiotics | **Food Quality** | Wider |
| q7–q9 | fermented frequency, variety, intentionality | Probiotics | **Living Foods** | Probiotics |
| q10–q12 | approach, weekly consistency, skipping/late/rushed | **Postbiotics** ✗ | **Meal Rhythm** | Wider |
| q13–q15 | post-meal feeling, discomfort, energy stability | **Postbiotics** ✗ | **What You Notice** | unscored |

**Every existing question keeps its wording, its options and its 0–3 values.**
This is a re-bucketing, not a rewrite — which is what makes Phase 1 low-risk,
keeps §26 honest, and is exactly the "edit and re-bucket, don't rebuild"
instruction applied literally.

**Note what leaves Prebiotics.** q5 (processing) moves out to Food Quality. It
was never a prebiotic question — it measures what *displaces* whole foods, not
what feeds microbes — and it was the least defensible member of that bucket.

---

## 9. Gaps

| Gap | Why it matters | Cost |
|---|---|---|
| **Food Quality rests on one question** | A scored domain resting on a single item is fragile and noisy | **+2 questions** — e.g. home-prepared vs ready-made share; drinks/sugar exposure |
| **Rhythm has no portion/structure item** | q10–q12 cover timing but not meal composition | **+1 optional** |
| **No conditions layer at all** | The Plan cannot currently adapt to cooking ability, time or budget | **+3–5**, unscored |
| **No confidence/completeness signal** | A part-finished assessment scores like a finished one | Derived, no new questions |

**~20 questions for L1** (15 existing + 2 Quality + 1 Rhythm + 2 conditions).
That is 3–4 minutes — longer than today's stated "about 5 minutes" is honest
about, and still short. **Do not exceed ~20 without evidence**: completion rate
is itself a product risk, and an abandoned assessment scores nothing.

---

## 10. Proposed Canonical Assessment Architecture

Single-stage, ~20 questions, grouped by domain with the domain named on screen
(so the person learns the model as they answer). **Not adaptive for v1** —
adaptive branching means two people's scores come from different instruments,
which breaks comparability before it starts, and would need its own validation.
Adaptive belongs in L2, where it already exists (`generate-deep-questions`).

---

## 11–13. Score Methodology, Scale, Weighting

**Recommended: `FoodSystemScoreMethod v1`.**

| Decision | Recommendation | Reason |
|---|---|---|
| Range | **0–100, and 0 genuinely reachable** | The current 20-floor makes a 0–100 dial dishonest at the bottom |
| Floor | **Removed** | Protect people with band copy and tone, not by inflating the number |
| Weighting | **Equal across the five domains**, as an explicit exported constant | There is no evidence base that ranks them; today's 40/20/40 is an artefact of question counts, which is not a reason |
| Domain scoring | Mean of its items, scaled 0–100 | Unchanged in spirit from today |
| Missing answers | Domain returns **`insufficient`**, not 0 | A skipped question is not a bad habit |
| Overall with an insufficient domain | Score withheld, or shown with completeness stated | Never silently average over a hole |
| Confidence | **Completeness %**, not a statistical CI | A CI would imply sampling properties this instrument does not have |
| One number or none? | **One number** — it is the product | But it must always carry its method version (§22) |

**Band consistency is currently broken and should be fixed here.**
`SCORE_BANDS` (`lib/scoring.ts:12`) is one ladder, but there are **three other
local `getScoreBand` implementations** — `dashboard-client-data.ts:257`,
`analyse/result-builder.tsx:96`, `share-client.tsx:88`. Four ladders means the
same score can be described differently in four places. Also worth confirming
with whoever owns `/method`: with the 20-floor in place, the **"Getting
Started" (0–19) band is unreachable** by the Assessment.

---

## 14. Symptoms — q13–q15

**Recommendation: remove from the score; keep in the product as "What You
Notice".**

- They are **outcomes**, not food-system inputs. A score mixing behaviour and
  outcome cannot be interpreted: two people with an identical score may have
  opposite habits.
- They carry the highest diagnostic-reading risk in the instrument.
- They are among the most *useful* things the person tells us — for the Plan,
  for the Consultation, and as the thing that changes first when habits change.

So: prominent, reported back, tracked over time, **not in the number**.

*(Considered and rejected: keeping them as a scored sixth domain — it preserves
today's arithmetic but keeps the diagnostic exposure; and a separate "Response
Score" — two numbers is the Option C comprehension cost from the previous
review.)*

---

## 15. The Biotics Science Layer — Kept, Promoted, Unscored

**The Three Biotics remain the foundation and remain visually prominent.** What
changes is that they *organise and teach* rather than *carry personal numbers*.

| Biotic | Role in the score | Role in the product |
|---|---|---|
| **Prebiotics** | Groups Diversity + Plants & Fibre | Why plant range and fibre matter |
| **Probiotics** | Groups Living Foods | Why fermented and live foods matter |
| **Postbiotics** | **None — no personal number** | What the system gives back, and why the other two matter |

**This is the whole fix, and it is narrower than the previous draft made it.**
The contract objects to *inferring a personal postbiotic state*. It does not
object to the word, the concept, the education, or the heading. Remove the
number and the exposure is gone — the foundation is untouched.

**What is gained, not just avoided:** Postbiotics becomes the part of the model
the product can be most confident about, because it stops pretending to measure
and starts explaining. It is also the natural bridge to **Rejuvenate** — the
action — without the two being equated, which `score-hierarchy.test.ts` and
CLAUDE.md both already refuse.

---

## 16. Feed · Seed · Rejuvenate — The Action Framework

Your framing is stronger than the current architecture and should be adopted:

```
SCORE      →  Where am I?          (Food System Score™ + five domains)
DOMAINS    →  What is shaping it?  (Diversity, Plants & Fibre, Living Foods,
                                    Food Quality, Meal Rhythm)
ACTIONS    →  What do I do next?   (Feed · Seed · Rejuvenate)
```

Feed/Seed/Rejuvenate remain **verbs attached to recommendations**, never
numbers. This is already enforced (`score-hierarchy.test.ts` refuses an action
as a score-bar label) and that guard becomes *more* correct under this model,
not less.

---

## 17–18. Result Experience and "Your" / "My"

```
YOUR FOOD SYSTEM SCORE™            74
                                   [band] · [completeness] · Method v1

BUILT ON THE THREE BIOTICS

  PREBIOTICS                       Diversity        78
                                   Plants & Fibre   71
  PROBIOTICS                       Living Foods     52
  POSTBIOTICS                      What your food system gives back.
                                   Taught, not scored — nothing you can
                                   tell us in an assessment measures it.

WIDER FOOD SYSTEM                  Food Quality     69
                                   Meal Rhythm      80

WHAT YOU NOTICE                    (in words, unscored)
YOUR CONTEXT                       (shapes the Plan, unscored)

YOUR PRIORITY                      Living Foods

ACT THROUGH                        Feed.  Seed.  Rejuvenate.
```

The biotics stay as prominent headings; the numbers sit beneath them where they
are earned. **Postbiotics is a statement, not an empty bar** (§7.1). The page
reads as one system: science on top, understanding in the middle, action at the
bottom.

Language ladder: **Discover Your Food System Score™** (acquisition) →
**Your Food System Score™** (result) → **My Food System Score™** (account and
sharing) → **Our Family Food System** (family) → **The Food System Inside
Google** (enterprise). Agreed: group products do **not** inherit the individual
methodology (§29).

---

## 19–21. Report, Plan, Longitudinal

**Report** (L2) gains a natural spine: Score → Domains → What You Notice →
Priority → Plan. The existing deep sections (symptoms, history, lifestyle,
goals) map onto it without restructuring.

**Plan** is where **Your Context** finally pays off: same priority dimension,
different plan for someone with no time versus no budget versus no confidence
cooking.

**Longitudinal.** Today it is not safe, for reasons independent of naming:
`leads.sub_scores` holds two different shapes (3-biotic and legacy 5-pillar),
and the floor compresses early change. Requirements for honesty:

- comparison **only within one method version** (§22);
- a stated **minimum meaningful change** below which the product says "about
  the same" rather than drawing a line;
- domain-level change shown alongside the overall, since an unchanged total can
  hide two domains moving in opposite directions;
- language: **"Your reported food patterns changed"** — never *"your biology
  improved"*, *"your microbiome improved"*, *"your gut health improved"*.
  `REPORT_COMPOSITION_BOUNDARY` already prohibits the second class.

**Live issue:** `components/account/retest-card.tsx:91` already ships
*"My Food System Score went from X to Y"* — a change claim, under a banned
name, on a model that cannot yet support it. Phase 1 should address it.

---

## 22. Score Methodology Versioning — NEW

**This may be the most durable thing in this document.** Every score should be
stored with its provenance:

```ts
interface ScoreProvenance {
  methodVersion: string        // "fss-method-v1"  — the whole bundle
  questionSetVersion: string   // which items were asked
  domainSetVersion: string     // which domains existed
  calculationVersion: string   // weights, scaling, floor policy
  interpretationVersion: string// bands and copy
}
```

**Comparability rule:** two scores are directly comparable **only** when
`methodVersion` matches. Across versions the product shows both, labelled, and
says the method changed — it does not draw a trend line through a
discontinuity. A `COMPARABLE_METHODS` allowlist can permit specific pairs where
a change was provably non-substantive (a copy-only `interpretationVersion`
bump, for instance).

This directly generalises the precedent already in the codebase:
`CONTENT_PACK_VERSION` travels in Report provenance for exactly this reason.

---

## 23. Science Contract — Current Rule → What Would Change

**Recommendation: `science-contract-v1.1`, ADDITIVE.** Not v2.0.

| Current rule | Why it exists | What must change | What would justify it |
|---|---|---|---|
| `AGGREGATION_EVIDENCE_RULE.cannotProduceValidatedSystemModel: true` | Composition cannot manufacture evidence | **Nothing.** The Score is defined (§5) as a summary of self-report, not a system model | No evidence needed — the rule is not violated by a correctly-scoped claim |
| `REPORT_COMPOSITION_BOUNDARY.prohibitedFramings` incl. "Your system is" | Stops biological assertion | **Nothing** — and it should govern Score copy explicitly | — |
| `POSTBIOTICS_INFERENCE_BOUNDARY` | Self-report cannot reach postbiotics | **Nothing** — §15 *removes* the violating surface | — |
| *(absent)* — no definition of what a personal score may claim | The gap that let "Postbiotics — 64" ship | **ADD `FOOD_SYSTEM_SCORE_BOUNDARY`** — §5 definition + §6 must-not list + the rule that unchangeable conditions never depress the score | Internal methodology documentation; specialist review of the domain set |

**Why v1.1 and not v2.0:** nothing is being weakened. A version that *added* a
constraint is a minor bump by the codebase's own precedent (the Rejuvenate
rename held v1.0 because `mustNotMean` was untouched). **If review concludes
the aggregation rule must be relaxed to permit the name, that is the signal the
name is wrong — not the rule.**

---

## 24. Claims and Regulatory Boundaries

Flag for scientific/legal review: the ™ on a score derived from self-report ·
any longitudinal "improved" language · "personalised" where output is rule-based
· band labels as quality judgements ("Fair") · the score's relationship to the
Consultation's health-adjacent content · **and, immediately, the live
`Postbiotics — NN` bar**, which is the one current defect rather than a future
risk.

---

## 25–26. Data and Historical Compatibility

**No migration required for any of this, and that is a design constraint worth
holding.** `leads.overall_score` and `leads.sub_scores` are name-agnostic;
`sub_scores` is jsonb and already carries two shapes. New domain keys are
additive. The only branded column, `analyses.biotics_score`, holds the **meal**
score and is out of scope.

Policy, per your §20 and already the codebase's stance: **historical finalised
outputs are never rewritten.** A report that said "Biotics Score™" keeps saying
it. Provenance (§22) is what makes that safe — an old score is not wrong, it is
*v0*.

---

## 27. Holding Page — And A Name Problem

**"Food System Snapshot" is banned too.** `retired-vocabulary.test.ts:171`
refuses `/\bfood system snapshot\b/i`, `/\byour snapshot\b/`, `/\bthe
snapshot\b/` — retired in the same event as "Food System Score". Adopting it
would re-open a second closed decision.

**Recommended: "Food System Check"** — result: *"Your first look at the food
system inside you."* It is plainly directional, contains no score noun, is not
retired, and cannot be mistaken for the canonical Assessment.

The L0 experience keeps its five questions, its sixty seconds and its reveal,
but: it yields a **direction and a priority**, not a number-with-a-™; it says
plainly that the full Assessment comes at launch; and at launch it either
retires or becomes a lightweight acquisition entry on marketing pages.

**Note on what exists today:** the current reveal already says *"your **first**
Biotics Score™"* with the word "first" load-bearing and guarded. That instinct
was right and carries straight into this design.

---

## 28–29. Family and Enterprise Futures

**Family already has a native five-pillar "Food Culture" model**
(`lib/family-assessment-scoring.ts`) — *but its overall comes from
`computeOverall(biotics)`*, the individual biotics mapping. So Family already
demonstrates both the pattern this design wants (native domains) and the bug it
must avoid (a borrowed overall). Family should get its own method version.

**Enterprise:** agreed and reinforced — **not an average of individual scores.**
If aggregating one person's self-reports cannot produce a validated model,
aggregating ten thousand cannot either; self-selection into a workplace
programme makes cohort bias severe. Separate product, separate methodology,
separate contract section, privacy-preserving domain aggregates only.

---

## 30. Tests and Guards

The guard corpus is the mechanism that failed here, so it is part of the design:

- **`customer-surfaces.ts` must become comprehensive** — the ~30 live uses of a
  banned term escaped precisely because those files were never in it. Proposal:
  derive the corpus from *what routes actually render* rather than a hand-kept
  list, with an explicit, justified exclusion list. A hand-kept list of files is
  the same failure mode that produced this.
- `retired-vocabulary.test.ts` — the two bans (Score, Snapshot) get revisited
  **once**, deliberately, at Phase 5, with the history preserved in comments.
- `score-hierarchy.test.ts` — extend: no score bar may be labelled with a
  biotic **or** an action; bars carry domain names only.
- New: a guard that every persisted score carries `ScoreProvenance`.

---

## 31. Implementation Phases

Your proposed sequence is sound with **two changes**: Phase 1 splits, and
contract work moves earlier.

| Phase | Work | Gate |
|---|---|---|
| **0** | Architecture + science agreement on §5, §6, §7 | Founder + science review |
| **1a** | **Fix the live contradictions** — the ~30 banned-term surfaces, guard corpus comprehensiveness | *Independent of everything else — do this regardless* |
| **1b** | **Take the number off Postbiotics.** q10–q12 become **Meal Rhythm**, q13–q15 become **What You Notice** (unscored), Postbiotics keeps its heading as foundation science. Presentation-only; arithmetic untouched | Removes a live claims exposure without touching the brand architecture |
| **2** | Domain set finalised; `ScoreProvenance` introduced (v0 stamped on today's model) | Versioning exists before the model moves |
| **3** | +5 questions designed and reviewed | Science review |
| **4** | `fss-method-v1` methodology: scale, weights, missing-data, bands | Science review |
| **5** | **science-contract-v1.1** — additive boundary; vocabulary authority updated | Contract owner sign-off |
| **6** | Implement the score model behind a flag, both models computable, compared offline | No customer impact |
| **7** | Results / Report / Plan surfaces adopt it; **the name ships here** | — |
| **8** | Longitudinal + comparability rules | — |
| **9–10** | Family method; Enterprise methodology | Separate products |

**Why contract before implementation:** building the model first creates
pressure to bend the contract to fit what was built. Contract first means the
model is designed to a standard rather than judged against one.

---

## 32. Exact Files Likely To Change

`lib/assessment-scoring.ts` (domains, weights, floor) · `lib/assessment-data.ts`
(+5 q, section titles) · `lib/quick-assessment.ts` (L0 framing only) ·
`lib/product-vocabulary.ts` · `lib/pillars.ts` · `lib/scoring.ts` (band
consolidation) · **new** `lib/score/method.ts` (provenance + versioning) ·
`lib/consultation/science-contract.ts` (v1.1 additive) ·
`components/assessment/result/*` · `components/waitlist/food-system-experience.tsx` ·
`components/home/{how-it-works,score-preview}.tsx` · `components/start-family/*` ·
`components/account/{twin/*,retest-card.tsx}` · `app/method/page.tsx` ·
`app/api/score-card/route.tsx` · report/PDF/email templates ·
`tests/unit/{customer-surfaces,retired-vocabulary,score-hierarchy,commercial-model}` ·
`CLAUDE.md`.

---

## 33. Open Questions

1. **Who signs off the domain set and the contract addition?** Phases 3–5 need
   a named scientific reviewer; this document cannot supply one.
2. **Which weighting?** (§7.2) — equal per dimension (Prebiotics ends up at 40%)
   or equal per group (foundation symmetry preserved in the arithmetic). Either
   is defensible; it must be chosen and written down rather than emerge.
3. **Does the Postbiotics treatment work?** (§7.1) — a foundation heading that
   deliberately carries no number, presented as a statement rather than an empty
   bar. This is the one piece of the corrected architecture that is a genuine
   design risk, and it is worth testing on real people before it ships.
4. **Should the Score be withheld entirely below a completeness threshold**, or
   always shown with a caveat?
5. **What is the minimum meaningful change?** Needed before any reassessment
   messaging ships.
6. **Does "Food System Check" work for you as the L0 name**, or should the
   Snapshot ban be revisited instead?
7. **Do Family and the health modules move to the new model together or later?**
8. **Is the 20-floor removal acceptable** knowing some early users will see
   lower numbers than the current model would have given them?

---

## 34. Risks

1. **Scope creep into a 40-question instrument.** Mitigation: the ~20 cap in §9.
2. **Two models in flight during Phases 6–7.** Mitigation: provenance first
   (Phase 2), both computable, compared offline before anything ships.
3. **The name shipping before the model** — the exact failure being corrected.
   Mitigation: the name is Phase 7, gated on Phase 5.
4. **Context creeps into the score** under pressure to "use the data".
   Mitigation: write the rule into the contract (§23), not just the docs.
5. **Guard corpus stays hand-kept** and the next competing term escapes the same
   way. Mitigation: §30's derived corpus.
6. **Postbiotics reads as missing rather than deliberate** (§7.1). Mitigation:
   render it as a statement, not an empty bar, and test the page on real people
   before it ships. This is the risk the corrected architecture introduces, and
   the one worth watching hardest.
7. **Overcorrection in the other direction** — retaining the biotics as
   headings, then quietly reattaching numbers to them because the layout looks
   unbalanced. Mitigation: the `Postbiotics` prohibition belongs in the contract
   and in `score-hierarchy.test.ts`, not in a design note.

---

## 35. Acceptance Criteria

- Every customer-visible score dimension names what its questions actually ask.
- **The Three Biotics remain visible as the foundation** — the architecture
  clarifies them, it does not replace them.
- No customer-visible number is labelled with a term the science contract
  prohibits inferring; in particular **no personal Postbiotics number exists**.
- Scored-dimension weights are an explicit versioned constant, never emergent
  from how many dimensions nest under a biotic.
- The Score's definition and its must-not list live in the contract, not only in
  copy.
- Every stored score carries `ScoreProvenance`; no cross-version comparison
  without an explicit rule.
- Neither **What You Notice** nor **Your Context** affects the Score.
- Historical outputs unrewritten; no migration.
- One name per concept across every surface, with the guard reading all of them.

---

## 36. Recommended Target Architecture

```
EatoBiotics — The Food System Inside You

  SCIENCE         Prebiotics · Probiotics · Postbiotics   the foundation
  UNDERSTANDING   YOUR FOOD SYSTEM SCORE™                 the number
                    Prebiotics  → Diversity · Plants & Fibre
                    Probiotics  → Living Foods
                    Postbiotics → taught, not scored
                    Wider       → Food Quality · Meal Rhythm
                    + What You Notice   (reported, unscored)
                    + Your Context      (shapes the Plan, unscored)
  ACTION          Feed · Seed · Rejuvenate                what to do

  L0  Pre-launch check     5 q     → a direction, not a score
  L1  Food System Assessment ~20 q → Your Food System Score™
  L2  Consultation (€49)           → Report + Plan
  L3  Modules                      → depth, never the headline number

  Provenance      fss-method-v1     stamped on every score
```

**In one breath, which is the test of whether an architecture is right:**

> EatoBiotics — The Food System Inside You.
> **Your Food System Score™**, built on **Prebiotics · Probiotics ·
> Postbiotics**, acted on through **Feed. Seed. Rejuvenate.**

---

## 37. GO / NO-GO

- **GO — Phase 1a** (live contradictions + guard corpus). Independent, and a
  present-tense defect.
- **GO — Phase 1b** (relabel the third pillar). Removes a live claims exposure,
  presentation-only, no arithmetic change.
- **GO — Phases 0, 2** (architecture agreement, provenance). Low risk, high
  durability.
- **CONDITIONAL GO — Phases 3–6.** Proceed on named scientific sign-off of the
  domain set and the contract addition.
- **NO-GO — any customer-visible "Food System Score™" before Phase 5.** The
  name is the last thing that ships, not the first.

**The assessment can earn the name. It has not yet, and the work to earn it is
mostly unfolding what is already there — five honest domains inside three
misleading labels — rather than inventing new science.**

---