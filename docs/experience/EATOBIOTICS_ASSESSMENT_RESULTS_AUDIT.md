# Assessment + Results — Generation 2, and where the journey terminates

**Experience 0, step 5.** Account (Gen 1) carries five P0s. My Food System
(Gen 4) carries none and earned the product-architecture north star. Assessment
sits between them, which is why it answers the question Experience 0 exists for:

> **Does the journey terminate in a report, or does it establish My Food System?**

**The answer is unambiguous, and it is structural rather than aesthetic: the
journey terminates in a report, and it could not establish a Food System even if
it wanted to.**

---

## 1 · Corpus completeness

| | |
|---|---|
| rows | **24** — 8 journey stages × 3 widths, matching the declared matrix |
| committed citations | 7 · archive-only 17 |
| clock | `2026-10-03T09:00:00.000Z` via `setFixedTime` |
| evidence kind | **real live UI**, real flow, real `localStorage` |

### Two scenarios were not captured, and that is the finding

The brief asked for a **What You Notice** variation and an **opposing Food
Context** pair. **Neither exists on this surface.** `lib/assessment-data.ts` is
**16 scored questions** and nothing else; the observation and context models live
in the paid deep assessment and in FSS-v1.

Manufacturing those states would have been inventing evidence. Their absence is
load-bearing — see §8.

### The capture could not be allowed to write

Completing the assessment POSTs `/api/submit-lead`, which **upserts `leads`** and
can insert `referrals`, and `/api/send-results-email`, which sends real mail.
This container carries no Supabase or Resend credentials, so those are inert
here — but "safe where I ran it" is the reasoning `NOTE-FIXTURE-01` records as
insufficient. Writes are **aborted at the browser** so the harness cannot write
anywhere it runs. Aborting rather than stubbing a 200 is deliberate: how the UI
behaves when the call fails is itself part of what is being audited.

---

## 2 · P0 / P1 / P2 findings

### `P0-TRUST-04` · "Appears strongest" over copy calling that Biotic the thinner part

`food-system-pattern.tsx:89` renders `{strongest.strength ?? strongest.opportunity}`.
`strongest` is just the last element of a weakest-first array — **not necessarily
a Biotic that has any strength copy**. So the card headed *Appears strongest*
prints that Biotic's *opportunity* text:

> **APPEARS STRONGEST** · **Postbiotics** · *"…rhythm and colourful,
> polyphenol-rich foods are **the thinner part here**."*

The component's own docblock records this exact contradiction being found and
fixed for the equal-scores case, and **guards the mirror case for the sibling
card**, calling it *"the same class of contradiction"*. The exploring card got a
guard; the strongest card got a `??`. Full entry in the debt register.

### `P1-FUNNEL-01` · Every add-on CTA on Results is a 404

Results closes with "Explore another focus" — Stability, Glucose, Mind,
Performance. All four are `POST_V1_ROUTES`; **all four return 404**, verified by
live HTTP. They are the only in-content next steps besides the €49 consultation.

Not caught because `v1-launch-surface.spec.ts`'s link crawler covers
`/assessment` — which is the **foundation chooser** — and never visits
`/assessment/you` or the Results page. **The same shape as `P0-GUARD-01`:** the
guard exists, works, and points elsewhere.

### `P1-ASSESS-01` · The result is 6,313px tall

At 1280, Results is **6,313px** — 2.8× the Account overview (2,223px) and 6.2×
My Food System Today (1,011px). It is the longest customer surface in the
product by a wide margin, and it arrives at the moment of least context, for a
person who has just answered 16 questions.

### `P2-ASSESS-01` · Three gates before question one

`/assessment` → choose You or Family → a marketing page → **a required lead form**
(name, email, age bracket, explicit health-data consent) → question 1.

The email wall is before any value is delivered. Recorded as an experience
finding, not a claims one — it is a commercial decision, and the consent
checkbox and the **working age gate** (`Under 16` is correctly refused) are both
to the product's credit.

### `P2-ASSESS-02` · A sign-in error renders inside the result

Results displays *"We couldn't send your sign-in link"* as a block in the page
flow. Honest, but it places an infrastructure failure in the middle of the
product's most important moment.

---

## 3 · Claims and science findings

### Verified clean by render

| test | result |
|---|---|
| per-Biotic **numbers** on Results | **none** — `ThreeBioticsResult`'s removal holds |
| "your Prebiotics/Probiotics/Postbiotics score" possessive | **none** |
| score honesty | *"Calculated from your answers… It is not a lab test and not a ranking against other people"* |
| profile honesty | *"This is the pattern your answers currently suggest — not a diagnosis, and not fixed"* |
| medical framing | *"Educational and non-diagnostic; not a medical test or diagnosis"* on the intro |

`ThreeBioticsResult` was remediated in an earlier tranche. **That was verified by
render, not trusted from its docblock** — this is the claim class that has
regressed four times, and a comment describing a past fix is not evidence of a
present state. It holds.

### The unresolved tension, stated rather than ruled on

Results renders a **personal per-Biotic comparative ranking**: *Appears
strongest: Postbiotics* / *Most worth exploring: Probiotics*, plus *"Your answers
read through three pathways. Together they make up your Biotics Score™."*

Two reviewed positions in this repository are in **direct conflict**:

| | |
|---|---|
| `assessment-result-narrative.test.ts:287` | **requires** "Appears strongest" and "Most worth exploring" |
| `PERSONAL_BIOTIC_STATE` | **forbids** *"a comparative verdict placed before a Biotic"* and *"a Biotic given a comparative or directional verdict"* |

They do not currently collide **only because `biotic-claims.test.ts` imports
`MARKETING_SURFACES` and `AI_PROMPT_SURFACES` and not `ASSESSMENT_SURFACES`** —
the same corpus gap as `P0-GUARD-01`.

**This audit does not rule.** It records that widening the guard corpus during
Experience 0R will make these two tests contradict each other, and that **someone
must decide which position stands**. That decision is a claims decision.

### Also recorded for the reviewer

*"Postbiotics — how your Food System appears to respond, from the patterns you
report"* is an inference about the person's postbiotic state from questionnaire
answers. `POSTBIOTICS_INFERENCE_BOUNDARY` prohibits a personal Postbiotics state
by name. Flagged, not ruled on, for the same review that holds the
`calm inflammation` wording.

---

## 4 · Responsive and accessibility

- The question component uses **native radio/checkbox inputs**, visually hidden,
  with the card as `<label>`, inside a `<fieldset>` with an `sr-only` `<legend>`.
  That is genuinely good semantics — arrow-key navigation, checked state and
  group relationship come from the browser rather than from a hand-rolled
  `role="radiogroup"`, and the component says so.
- `biotics-score-reveal.tsx:79` carries `<p class="sr-only">Your Biotics Score is
  51 out of 100.</p>` — the number is available to a screen reader even though
  the visual is a ring.
- One question per screen at all three widths; no horizontal overflow.
- Results is a single column at 1280 — the same width under-use recorded as
  `P2-FSS-02` on My Food System.
- Console: `401 GET /api/assessment/journey` on this surface too — the same
  unconditional mount-time hydrate recorded in `NOTE-FIXTURE-01`, here on a
  **live customer page**.

---

## 5 · Results block inventory, in render order

| # | block | what it does |
|---|---|---|
| 1 | `BioticsScoreReveal` | ring + `51/100` + "not a lab test" |
| 2 | `FoodSystemProfile` | profile type + narrative + "not a diagnosis" |
| 3 | `ThreeBioticsResult` | three Biotic cards, prose only, no numbers |
| 4 | `FoodSystemPattern` | **the strongest/exploring ranking — `P0-TRUST-04`** |
| 5 | `OneFreeAction` | one concrete action |
| 6 | `ShareScoreCard` | share image with score + three Biotics |
| 7 | `ScoreCard` | a second score rendering |
| 8 | `ContributeOptIn` | research contribution consent |
| 9 | `PersonalReportCta` | **€49 consultation — terms, consents, full commerce block** |
| 10 | "A few more ideas" | two further actions + foods |
| 11 | `SaveResultsCard` | **renders the sign-in failure — `P2-ASSESS-02`** |
| 12 | "Explore another focus" | **four 404s — `P1-FUNNEL-01`** |
| 13 | Retake | restart |

**Thirteen blocks. Three of them render the score.**

---

## 6 · Results — Keep / Evolve / Merge / Move / Retire

| # | block | disposition | destination |
|---|---|---|---|
| 1 | Score reveal | **KEEP** immediately | the reveal is the moment |
| 2 | Profile | **EVOLVE** | keep one line; the narrative belongs in Score |
| 3 | Three Biotics | **MOVE** | → **Biotics**. It is education, and Gen 4 already hosts it better |
| 4 | Pattern ranking | **RETIRE or REMEDIATE** | blocked on the claims decision in §3 |
| 5 | One action | **KEEP** immediately | this is the handoff |
| 6 | Share | **MOVE** | → a later moment; sharing before understanding is premature |
| 7 | Second score card | **MERGE** into 1 | three renderings of one number |
| 8 | Contribute opt-in | **MOVE** | → Account |
| 9 | €49 consultation | **MOVE** | → a considered offer surface, not the reveal |
| 10 | More ideas | **MOVE** | → **My Plan** |
| 11 | Save results | **EVOLVE** | not an error block in the reveal |
| 12 | Explore another focus | **RETIRE** until the routes exist |
| 13 | Retake | **MOVE** | → **Today**, as Gen 4 already does |

**Immediately after assessment: the score, one line of meaning, one action.**
Everything else has a home in the seven persistent areas or in a considered
Report.

---

## 7 · The current journey

```
/assessment              choose You or Family
        ↓
/assessment/you          marketing page
        ↓                REQUIRED: name · email · age · health consent
        ↓
16 questions             one per screen, explicit Continue, resume via localStorage
        ↓
Results                  6,313px · 13 blocks · 3 score renderings
        ↓
   ├── €49 consultation
   ├── 4 add-on links  →  404 · 404 · 404 · 404
   └── Retake
```

**There is no exit into a persistent product.** Nothing on Results leads to
`/account`, to a Food System, or to anything a person returns to. The journey
ends where it started: a page.

---

## 8 · The future journey, and the obstacle nobody can design around

```
assessment → concise reveal → establish My Food System → Today
```

The evidence supports this shape. §6 shows that only three of thirteen blocks
need to be in the reveal, and every other block already has a natural home among
the seven areas. §7 shows the current journey has no exit at all.

**But this is not a presentation change.** A Food System is composed from scored
answers **plus What You Notice plus Food Context** — and the free assessment
collects **none of the last two**. Gen 4's plan is constraint-filtered by
`ReportedContext.limiting`; without context there is nothing to filter against,
and the product would be inventing a plan rather than deriving one — the precise
failure Gen 1 was found committing.

> **The handoff is an instrument change before it is an interface change.**
> Either the free assessment gains the observation and context models, or what it
> establishes is a score and not a Food System.

That is the single most consequential finding of this step, and it belongs in the
Experience 1 scope rather than in a redesign brief.

---

## 9 · Generation 2 ↔ Generation 4

**The assessment already speaks Generation 4's language. Results falls back
toward Generation 1.**

| | Assessment (questions) | Results | Gen 4 |
|---|---|---|---|
| one idea per screen | **yes** | no — 13 blocks | yes |
| score renderings | — | **3** | 1 |
| page height @1280 | ~1,100px | **6,313px** | 1,011px |
| claims posture | careful | careful, with one contradiction | careful |
| refuses when it cannot say | n/a | **no** | **yes** |
| leads somewhere persistent | → Results | **nowhere** | → Today |

The question flow is calm, semantically correct, one-thing-at-a-time, and honest
about what it is. It would not look out of place inside Generation 4.

Results is the opposite: an accumulation surface that tries to reveal, explain,
teach, rank, share, sell, collect consent, recover from an error and cross-sell,
in one scroll. It is **Generation 1's instinct — show everything we know —
applied to Generation 2's data.**

> The bridge the programme is looking for has already begun. It begins in the
> questions and stops at the result.

---

## 10 · What this step did not do

No production UI repaired · no claims guard widened · the strongest/exploring
conflict **recorded, not resolved** · no Postbiotics wording approved or
rewritten · no journey change implemented · no paid deep assessment or Report
captured — those belong with the Reports step · no write reached any database or
inbox.

> Source inspection establishes possibility. Rendered evidence establishes
> reachability.
