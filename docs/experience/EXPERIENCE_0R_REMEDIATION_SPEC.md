# Experience 0R — Product Integrity Remediation

**Specified during Experience 0. Executed in its own gate. Mandatory before any
visual redesign.**

Sixteen P0s and three P1s, each carrying eight fields: finding id · **current
reachability** · affected route or component · the exact prohibited or false
behaviour · the governing canonical rule · proposed remediation behaviour · **the
guard or test that should initially turn red** · close criterion.

Evidence lives in [`EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`](./EATOBIOTICS_SCIENTIFIC_UI_DEBT.md)
and the five per-surface audits. This document is the execution register and does
not restate it.

---

## 0 · How 0R runs

**Guards first, deliberately red.** `P0-GUARD-01` and `P0-GUARD-02` lead the
sequence. Widen the corpora, let the suite go red, and **let the red list define
the UI work.** The initially-failing tests are the evidence of the debt, not an
obstacle to it.

**Reachability sets order, not severity.** Live customer-reachable findings are
repaired before latent ones. A latent finding is not downgraded; it is scheduled
second.

**One standing rule.** When a sabotage case slips, strengthen the **test**, never
the case.

### The two guard requirements, kept apart

| | requirement |
|---|---|
| **Coverage** | every customer-facing claims surface is inside the corpus |
| **Form** | a claim encoded as colour, motion, anatomy, position or scale is caught at all |

Closing coverage does not close form. `P0-SCIENCE-04` has no string for any
corpus to scan, so a wider corpus of text rules would pass it. **Both are
required and they are different pieces of work.**

---

## 1 · TRUST INTEGRITY

### `P0-TRUST-01` · Fabricated member data

| | |
|---|---|
| Reachability | **LIVE** — every returning member before their first meal of the day |
| Where | `components/account/live-dashboard.tsx:1653`, also `:1640-42` |
| Behaviour | `MOCK_MEALS[0].meals` renders under **"Today's Meals"**, directly above "No meals logged today" — a named meal, a time, a type, a score, presented as the member's own |
| Rule | Truthfulness. Fabricated content inside a personal product context |
| Remediation | **RETIRE the fallback.** An empty day renders the empty state and nothing else |
| Guard turns red | a render assertion that no `MOCK_MEALS` value reaches the member tree in any state; `audit-capture.spec.ts`'s existing `P0-TRUST-01` reproduction **inverts** — it currently asserts the defect is present |
| Close | zero mock values in any `/account` render path, and the inverted test green |

### `P0-TRUST-02` · Fabricated quotation attributed to the member's own report

| | |
|---|---|
| Reachability | **LIVE** — fallback only; a real weekly report displaces it |
| Where | `live-dashboard.tsx:1843` |
| Behaviour | Under **"FROM YOUR LATEST REPORT"**, a hardcoded sentence promising *"8–12 points within three weeks"* |
| Rule | Truthfulness; no guaranteed outcome; no quantified prediction |
| Remediation | **RETIRE.** With no report there is no quotation — render the absence |
| Guard turns red | the claims corpus widened to `ACCOUNT_SURFACES` (`P0-GUARD-01`) catches the predicted-outcome language |
| Close | the attributed frame renders only when a real `pullQuote` exists |

### `P0-TRUST-03` · Fabricated personal conclusion — dual classification

| | |
|---|---|
| Reachability | **LIVE** — always, unaffected by data |
| Where | `live-dashboard.tsx:1757`, block opened at `:1742` |
| Behaviour | *"Your probiotic score is your lowest pillar"* with `displayBiotics` referenced **zero times** in the block. It is **false** whenever the member's lowest value is not Probiotic |
| Rule | Truthfulness **and** no personal Biotic state. Both |
| Remediation | **RETIRE.** Not satisfied by removing the numbers elsewhere — a product that stopped showing scores but kept this sentence would still be telling members something false |
| Guard turns red | `ACCOUNT_SURFACES` in the corpus; plus a behavioural test that calls the block's data path with a non-Probiotic minimum and asserts the sentence is absent |
| Close | **its own remediation proof**, independent of `P0-SCIENCE-02` |

### `P0-TRUST-04` · "Appears strongest" over copy calling that Biotic the thinner part

| | |
|---|---|
| Reachability | **LIVE** — `/assessment/results` |
| Where | `components/assessment/result/food-system-pattern.tsx:89` |
| Behaviour | `{strongest.strength ?? strongest.opportunity}` prints the *opportunity* text under a heading reading **APPEARS STRONGEST** |
| Rule | Truthfulness, **and** `PERSONAL_BIOTIC_STATE` |
| Remediation | **Two layers, and both are required.** (1) the conditional can contradict its own heading; (2) **the personalised strongest/exploring construct itself conflicts with the locked architecture.** Repairing the conditional and keeping the construct does not close this |
| Guard turns red | widening to `ASSESSMENT_SURFACES` makes `PERSONAL_BIOTIC_STATE` and `assessment-result-narrative.test.ts:287` contradict each other — **that collision is the intended outcome**, per D1 |
| Close | the construct is gone, `assessment-result-narrative.test.ts` is revised (**not** the permanent rule), and both suites are green |

### `P0-TRUST-05` · A product-authored premise auto-sent to the AI as the member's own question

| | |
|---|---|
| Reachability | **LIVE** — any member with a Twin |
| Where | `components/account/twin/ask-twin.tsx:20` → `app/account/consult/consult-client.tsx:219-225` |
| Behaviour | *"Why is my probiotic level my weakest…"* is product-authored, deep-links to `/account/consult?q=`, and the consult client **auto-sends it on mount**. The member never sees it in an input box |
| Rule | Voice and authorship; `PERSONAL_BIOTIC_STATE`; the Gate 6 Intelligence boundary |
| Remediation | **Four parts, both sides of the boundary:** (1) remove the prohibited premise — the other two chips are clean and stay; (2) a query parameter or suggested prompt must not silently become an authenticated user assertion; (3) AI context must distinguish **user-authored** from **product-suggested** text where that distinction matters; (4) guard and sabotage the path |
| Guard turns red | a new case asserting no product-authored suggestion carries a personal Biotic premise, **and** a case asserting `?q=` cannot auto-send unreviewed text |
| Close | **not merely the sentence removed.** The path must be unable to carry a claim no deterministic component made |

> **The most serious finding in Experience 0.** It converts a prohibited claim
> into model input, and the model's answer into new customer-facing prose
> attributed to the person's own question.

### `P1-FUNNEL-01` · Every add-on CTA on Results is a 404

| | |
|---|---|
| Reachability | **LIVE** |
| Where | `/assessment/results`, "Explore another focus" — Stability · Glucose · Mind · Performance |
| Behaviour | all four `POST_V1`, all four **404**, verified by live HTTP. The only in-content next steps besides the €49 offer |
| Rule | **A correctly refused destination must not be presented as an available action** |
| Remediation | **Product fix** — do not offer unavailable add-ons as actionable. **Guard fix** — the link crawler must cover the Results surface, not merely `/assessment` |
| Guard turns red | adding Results to `v1-launch-surface.spec.ts`'s `CRAWLED` list |
| Close | no refused destination is presented as available on any crawled surface |

### `P1-FUNNEL-02` · Five dead destinations inside the Twin gate

| | |
|---|---|
| Reachability | **LIVE** — any member with a Twin |
| Where | `/account`: `InsideYouTeaser` → `/account/twin`; `SystemsExplorer` → `/stability`, `/glucose`, `/mind`, `/performance`. Plus `live-dashboard.tsx:1899` `href="#"` |
| Behaviour | all five **404**, verified by live HTTP. The same grid already renders *"Coming soon"* with no link for five others — the behaviour the first five should have |
| Rule | as `P1-FUNNEL-01` |
| Remediation | match the "Coming soon" treatment; remove the `href="#"` |
| Guard turns red | the crawler must cover `/account` **in a Twin-present state** — covering the route alone still misses all five |
| Close | as `P1-FUNNEL-01`, with `/account` in the crawl |

---

## 2 · SCIENTIFIC INTEGRITY

### `P0-SCIENCE-01` · Personal Biotic scoring, in language and in UI

| | |
|---|---|
| Reachability | **LIVE** — first-use members |
| Where | `live-dashboard.tsx:1182/1186`; `MealCard:97-99` |
| Behaviour | *"Your Biotics score … an instant breakdown of its Prebiotic, Probiotic, and Postbiotic value"*, and three `ScoreBar`s per meal |
| Rule | The permanent product rule; Gate 5's standing exclusion of meal-level per-Biotic bars |
| Remediation | **RETIRE the bars; reframe the copy** to describe what the analysis actually observes |
| Guard turns red | `ACCOUNT_SURFACES` in the corpus |
| Close | no per-Biotic bar on any customer surface; the first-use copy promises only what is delivered |

### `P0-SCIENCE-02` · "Your Biotics Profile" — three scores as rings, numbers and band words

| | |
|---|---|
| Reachability | **LIVE** — with genuine data as well as fallback, proved by the `member-with-biotics` state |
| Where | `live-dashboard.tsx`, the Biotics profile block |
| Behaviour | `58 · 44 · 63` as rings, with band words **Building / Building / Strong**, plus *"Week 18 of 30"* |
| Rule | The permanent product rule — not as a number, not as a bar, not as a band word |
| Remediation | **RETIRE.** The construct is the defect, not the data source |
| Guard turns red | `ACCOUNT_SURFACES` |
| Close | no personal per-Biotic value renders anywhere |

### `P0-SCIENCE-03` · Personal per-Biotic prose: lowest pillar, strength, mechanism

| | |
|---|---|
| Reachability | **LIVE** — `:1896` always; `:1843` fallback only; `:1757` extracted to `P0-TRUST-03` |
| Where | `live-dashboard.tsx:1896` and `:1843` |
| Behaviour | *"Your Prebiotics have been strong but your Probiotics are pulling down your Biotics Score™. One fermented food daily for 30 days changes this."* — two personal states, a **mechanism**, and a 30-day outcome promise |
| Rule | The permanent product rule; no causal attribution; no guaranteed outcome |
| Remediation | **RETIRE** the per-Biotic framing and the outcome promise. A monthly focus can survive if it describes the food pattern rather than the biology |
| Guard turns red | `ACCOUNT_SURFACES`; the causal rule already exists |
| Close | no mechanism and no outcome promise on `/account` |

### `P0-SCIENCE-04` · A Biotic verdict encoded as a colour

| | |
|---|---|
| Reachability | **LIVE** — any member with a Twin |
| Where | `components/account/twin/twin-stage.tsx:284`, applied at `:330-331`; `lib/account/twin-visual.ts` |
| Behaviour | `auraGradientForBiotic(twin.biotics.weakest, …)` — the glow around the member's body figure **is** a personal comparative Biotic verdict. A second, unconsumed mapping on `strongest` exists in the same module |
| Rule | **A claim is still a claim when it is encoded through colour, motion, anatomy, position, scale or another visual state rather than words** |
| Remediation | **RETIRE the mapping.** The aura may carry time-of-day mood or data density; it may not carry which Biotic is weakest. Remove the dead `strongest` mapping in the same change, so it cannot become a ready-made replacement |
| Guard turns red | **this one cannot be a string guard.** A new assertion that no `BioticKey` reaches any visual-parameter function — the `resolveAtoms` move: make the mistake *unavailable*, not merely refused |
| Close | no Biotic key is an input to a colour, position, size, opacity or duration |

> Gate 3.6 removed the chip, the bar and the band word from the hotspots **in
> this same component** and left the orb tinted. Each repair closed the form it
> found. This one must close the mechanism.

### `P0-SCIENCE-05` · A bodily reaction asserted from a checkbox, localised on anatomy

| | |
|---|---|
| Reachability | **LIVE** — any member with a Twin; the tapped state proved by render |
| Where | `components/account/twin/daily-ritual.tsx:111` and `:49-53`; `lib/account/ritual.ts:36-49` |
| Behaviour | Heading *"Tap what's true today. **Your body reacts to each one.**"* Each check carries an `effect` (*"A fermented food lights up your probiotic network"*) and a `node: {x, y}` lit on a body figure under the overline **"YOUR BODY JUST FELT THAT"** |
| Rule | The permanent product rule; no causal attribution; no biological inference from behaviour |
| Remediation | **REMEDIATE, do not retire.** The taps, the streak and the 7-day bar are real self-report and move to `today`. What goes is the asserted effect, the body-position mapping and the first-person interiority |
| Guard turns red | the behavioural guard extended over `RITUAL_CHECKS`; plus the `P0-SCIENCE-04` visual-parameter assertion, which also covers `node` |
| Close | no self-reported tap produces an anatomical rendering or a statement about the body |

### `P0-SCIENCE-06` · The production paid Report ranks the member's Biotic pathways

| | |
|---|---|
| Reachability | **LIVE · PAID · CUSTOMER-REACHABLE** |
| Where | `lib/report/build-food-system-report.ts:457-469` → `systemSnapshot.dominantPattern` → `components/report/food-system-section.tsx:398` → `PaidReportClient` → `/assessment/report`. Also `paid-report-client.tsx:681` |
| Behaviour | *"Prebiotics is your strongest pathway, and Probiotics is where your answers point to the clearest first step"* |
| Rule | `PERSONAL_BIOTIC_STATE`; D1; **and the money path gets stricter, not looser** |
| Remediation | **RETIRE the ranking**, in the same repair as `P0-TRUST-04`. `lib/fallback-paid-report.ts` reads the same ranking and must move with it |
| Guard turns red | the corpus widened to the **report family** — see `P0-GUARD-02`. Widening to Assessment alone leaves this intact |
| Close | no personal comparative Biotic verdict in any Report path, paid or free |

### `P0-SCIENCE-07` · Three per-Biotic scores out of 100 in the dev-flow Report

| | |
|---|---|
| Reachability | **LATENT PRODUCTION HAZARD · NOT currently customer-reachable** |
| Where | `components/assessment/full-report-client.tsx`, rendered by `app/assessment/report/page.tsx:45` under the unverified dev flow, and by `/assessment/demo` (POST_V1, 404) |
| Behaviour | **Probiotics 33/100 · Prebiotics 50/100 · Postbiotics 61/100**, with *"Your probiotics score has clear room to grow"*. A number, a denominator and a possessive, three times |
| Rule | The permanent product rule, in three of the forms it names |
| Remediation | **RETIRE the pillar breakdown.** The deep-dive guidance survives without a score, as `BioticsProgressPanel` already does |
| Guard turns red | the report corpus; plus a reachability pin asserting `FullReportClient` is not reachable from any production path |
| Close | the construct is gone **and** the route cannot serve it under any environment |

> Severity is P0 because the hazard is adjacent to money. The claim about
> customers stays accurate because the reachability is stated. **Reachability
> changes what we can claim about current customer harm.**

### `P0-SCIENCE-08` · Mechanistic microbiological claims in customer-facing food copy

| | |
|---|---|
| Reachability | dev-flow **rendered**; the food-tool data is **shared with the production path** |
| Where | the 12-food list and 5 swaps |
| Behaviour | *"maximises short-chain fatty acid production"* · *"Hundreds of millions of live bacteria per gram; direct seeding of the microbiome"* · *"selectively feeds the most beneficial gut bacteria"* · *"Flavanols feed Lactobacillus and Bifidobacterium"* · *"stabilise your gut rhythm"* |
| Rule | *Teach the biology accurately* — which is not *teach it confidently* |
| Remediation | **EVOLVE to the hedged register** used by the Twin's education and `/biotics` after Gate 3.7. **Not rewritten by the audit and not approved by it** — this goes to scientific review |
| Guard turns red | the report corpus plus the existing mechanism rules, once the wording is reviewed |
| Close | a named reviewer has dispositioned each claim, and the surviving wording passes the mechanism rules |

### `P1-VOCAB-01` · "Heal" renders as a customer-facing pathway tag

| | |
|---|---|
| Reachability | dev-flow **rendered**; keys shared with the production lens chapter (`lib/report/addon-lens.ts:12`) |
| Behaviour | every food carries two of **Feed · Seed · Heal** |
| Rule | CLAUDE.md: *"'Heal' is a stored key, never a customer-facing pathway name."* The third action is **Rejuvenate** |
| Remediation | render the customer-facing name; the stored key does not move |
| Guard turns red | `retired-vocabulary.test.ts` extended over the report corpus |
| Close | no stored key is printed as a pathway name |

---

## 3 · AI BOUNDARY

`P0-TRUST-05` is listed in full under Trust integrity. Its second half is an
AI-governance requirement in its own right, and is restated here because it is
the group's whole content:

| | |
|---|---|
| The defect class | a **product-authored** personal premise enters the model **as member speech**, and returns as generated prose that reads as a response to the person |
| Why it is not a copy defect | nothing downstream can tell that the product, not the person, asserted it. The claim is laundered through the member's own voice |
| Requirement 1 | no product-authored suggestion carries a personal premise deterministic state cannot support |
| Requirement 2 | a query parameter or suggested prompt cannot silently become an authenticated user assertion |
| Requirement 3 | AI context **distinguishes user-authored from product-suggested text** where that distinction matters |
| Requirement 4 | a guard and a sabotage case over this exact path |
| Relation to Gate 6 | this is the Gate 6 Intelligence boundary's philosophy applied **outside** the new AI layer. `/api/consult` is one of the eleven legacy free-text routes and has none of 6.0's protections |

> **A valuable extension of Gate 6's philosophy beyond the new AI layer**, and
> the reason 0R includes an AI group at all.

---

## 4 · GUARD COVERAGE

### `P0-GUARD-01` · The claims guard does not scan the largest customer surface

| | |
|---|---|
| Reachability | the gap is in the **test corpus** |
| Behaviour | `GUARDED_SURFACES` omits `/account`. The guard exists, works, and points elsewhere |
| Remediation | widen to `ACCOUNT_SURFACES` **first**, before any UI work |
| Guard turns red | by design — the red list defines the Account repairs |
| Close | `/account` is in the corpus and the suite is green on repaired code |

### `P0-GUARD-02` · No report file is in the Biotic claims corpus

| | |
|---|---|
| Reachability | **test corpus** — third instance, first on a product that is sold |
| Remediation | widen to the report family in the **same** step as `ASSESSMENT_SURFACES` |
| Guard turns red | by design; `P0-SCIENCE-06` is what it catches |
| Close | no report generator or component is outside the corpus |

### The Assessment gap

Found in step 5: `biotic-claims.test.ts` imports `MARKETING_SURFACES` and
`AI_PROMPT_SURFACES` and **not** `ASSESSMENT_SURFACES`, which is the only reason
`PERSONAL_BIOTIC_STATE` and `assessment-result-narrative.test.ts:287` do not
currently collide. D1 requires that collision to happen.

### Non-text claim forms

`P0-SCIENCE-04` and `P0-SCIENCE-05` are claims with **no string**. A corpus of
text rules cannot see them at any width. The requirement is an assertion over
**data flow**, not language: no Biotic key, and no derived ranking, reaches a
visual-parameter function or an anatomical coordinate.

### The architectural requirement — D7

> **A customer-facing claims surface exists → it is inside the claims corpus by
> construction** — not because somebody remembered to add its path to one of six
> manually maintained arrays.

Three surfaces have now been found outside the same scan. 0R must ask **what the
canonical set of customer-facing Biotics-claim surfaces is** and derive coverage
from that authority. `CANDIDATE_SURFACES` already does this via `candidateTree()`
(`tests/unit/biotic-claims.test.ts:238`), so the shape is proven and is where to
start.

**The implementation is not designed here.** Recorded as a requirement 0R must
satisfy, with the explicit note that derivation closes coverage and **not** form.

---

## 5 · Sequence

| | work | why here |
|---|---|---|
| **0R-1** | `P0-GUARD-01` + `P0-GUARD-02` + the Assessment gap | the red list defines everything after it |
| **0R-2** | the D7 canonical-coverage mechanism | so 0R-1's widening is the last manual one |
| **0R-3** | `P0-TRUST-05` | the most serious; it reaches a model |
| **0R-4** | live `/account` trust: `P0-TRUST-01`, `-02`, `-03` | fabricated content in a personal context |
| **0R-5** | live `/account` science: `P0-SCIENCE-01`, `-02`, `-03`, `-04`, `-05` | includes the non-text form work |
| **0R-6** | the paid path: `P0-SCIENCE-06`, then `-07`, `-08`, `P1-VOCAB-01` | live before latent |
| **0R-7** | `P0-TRUST-04` + D1's six-step sequence | the Assessment ruling, with its deliberate collision |
| **0R-8** | `P1-FUNNEL-01` + `P1-FUNNEL-02` + crawler coverage | the navigation promise |
| **0R-9** | `DEBT-CODE-01` and the dead `strongest` aura mapping | removed with their generations |

---

## 6 · Close criteria for the gate

0R closes when **all** hold:

1. every P0 above has its stated close criterion met;
2. the claims corpora cover Account, Assessment and Report, **derived** rather
   than listed where D7's mechanism permits;
3. a non-text claim guard exists and is proved non-vacuous;
4. the `?q=` path cannot carry an unreviewed product-authored assertion;
5. no refused destination is presented as available on any crawled surface,
   including `/account` in a Twin-present state;
6. the full gate is green, including all thirteen sabotage suites, with
   `run_s3a`'s 33 documented PR #274 anchors the only exception;
7. new sabotage cases exist for each repaired class, and **a slipped case
   strengthens the test, never the case.**

**Only then does visual redesign begin.**
