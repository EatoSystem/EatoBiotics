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

### `P0-TRUST-02` · Fabricated member-attributed content presented as the member's own

> **CANONICALISED at 0R-4, and this heading changed.** This document defined
> `P0-TRUST-02` as the fabricated quotation; the register defined it as the
> per-Biotic hardcoded fallback. **One id, two findings.** Both were real. It is
> now **one** finding with **three sites** — the per-Biotic profile fallback,
> the attributed pull-quote, and the Consultations tab's fabricated reports — so
> that the controlling specification has one definition only. No second trust id
> was created merely because the number was used twice. Site-level evidence is
> preserved in the register.
>
> The entry below is **site 2**.

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
6. the full gate is green, including all **fourteen** sabotage suites —
   `run_0r` was added by tranche 1 — with `run_s3a`'s 33 documented PR #274
   anchors the only exception;
7. new sabotage cases exist for each repaired class, and **a slipped case
   strengthens the test, never the case.**

**Only then does visual redesign begin.**

---

## 7 · DELIVERY RECORD — tranche 1 (0R-1 + 0R-2)

Appended as the stages complete. Tranche 1 repaired **no product surface**: it
closed the enforcement boundary and recorded what that exposed. Stated plainly
because an enforcement-only tranche is the easiest kind of work to overstate.

### 0R-1 · the corpora joined the scan

| | |
|---|---|
| newly guarded files | **33** — `ACCOUNT_SURFACES` (18) + `ASSESSMENT_SURFACES` (15) + the new `REPORT_SURFACES` (9), deduplicated against the six corpora already in `GUARDED_SURFACES` |
| `REPORT_SURFACES` | **new** — `P0-GUARD-02` was the absence of any report corpus at all |
| the red state, measured | **19 (file, rule) findings across 3 rule families** |

**The red state was measured three times before it was claimed, and the first
two measurements were wrong.**

1. A `re.search` simulation reported **10** hits. `re.search` returns the first
   match per rule; `finditer` returned **16**.
2. Two of those were docblock comments, and `renderedSource()` already strips
   comments — so under the test's own semantics it was **7**.
3. All three numbers measured `PERSONAL_BIOTIC_STATE` **only**.
   `GUARDED_SURFACES` feeds **three** rule families, and the real figure
   converged at **19** once `FERMENTED_LIVE_CLAIMS` and
   `FIBRE_PREBIOTIC_CLAIMS` were included.

The third correction is the substantive one, and it produced
**`P0-SCIENCE-09`** — nine category-equivalence claims on Account and Report
that the Experience 0 audit never catalogued, because the audit swept for
personal Biotic *state* and these are claims about food *categories*.

### The red list is an artefact, not a red suite

The specification says to let the suite go red and let the red list define the
work. A **committed** red suite would leave CI red across every 0R commit and
make a new regression indistinguishable from known debt, so the red list is held
as `EXPOSED_AT_0R1` — a shrinking inventory with four assertions:

| | |
|---|---|
| every entry still describes a real claim | a repaired row **fails**, forcing its own deletion, so the list cannot outlive its debt |
| no guarded surface outside the inventory carries a claim | a *new* claim fails immediately — the protection the widening is for |
| the inventory may only shrink | `length <= ENTRIES_AT_0R1_OPEN` |
| the cap carries no headroom | `ENTRIES_AT_0R1_OPEN === length` — see below |

**Close criterion for 0R: `EXPOSED_AT_0R1` is empty and the constant is
deleted.**

### 0R-2 · the D7 mechanism was one line, and the line was missing

D7 asked for a canonical coverage mechanism. Building a new instrument would
have been wrong: the derived reachability ledger in `biotic-claims.test.ts`
**already is** that mechanism — it takes the import closure of the non-refused
page routes, subtracts what is guarded, and asserts the remainder equals
`KNOWN_UNCORRECTED`.

Its gap was not the derivation. It was the rule set it ran:

```ts
const ALL_RULES = [...FERMENTED_LIVE_CLAIMS, ...FIBRE_PREBIOTIC_CLAIMS]
```

`PERSONAL_BIOTIC_STATE` — the nine rules carrying the permanent product rule —
was never in it. So the derivation built to catch a forgotten surface was
running two thirds of the rules, and a personal Biotic claim on an unguarded
reachable file was invisible to the one instrument built to find exactly that.

**That is the same failure Experience 0 recorded three times** — Account outside
the scan, Assessment outside the scan, Report outside the scan — occurring in
the safety net itself. Adding the line exposed three more unguarded reachable
files (`lib/account/meal-impact.ts`, `lib/account/ritual.ts`,
`lib/assessment-scoring.ts`), and the third is **`P0-SCIENCE-10`**: a personal
per-Biotic sentence inside the **free assessment's scoring engine**, reachable
from `/assessment/results`, which is `V1_CORE`. The audit read the result
*components* and never the module that computes what they render.

### The form track — `tests/unit/biotic-visual-encoding.test.ts`

Coverage and form are separate problems, and `P0-SCIENCE-04` proves it: a
prohibited verdict encoded as a **colour**, with no prohibited string anywhere.

The new guard asserts over **data flow**, not language — a Biotic-derived value
(`biotics.weakest`, `biotics.strongest`, a `BioticKey` parameter) reaching a
visual sink (colour, gradient, tint, aura), and an anatomical coordinate
(`node: { x: … }`) reaching self-reported behaviour. Four inventoried encodings,
same shrink-only contract, and non-vacuity proved against a known-dirty module
(`twin-visual.ts`) and a known-clean one (`lib/pillars.ts`).

**The guard rejected its author's own inventory entry, correctly.** `ritual.ts`
was listed under "a Biotic chooses a colour"; its `RITUAL_CHECKS` keys are
`fermented · plants · moved · slept · feeling` — self-reported behaviour, not
Biotics. So `P0-SCIENCE-05` is a **different form** from `P0-SCIENCE-04`:

| | |
|---|---|
| `P0-SCIENCE-04` | a Biotic verdict → a colour |
| `P0-SCIENCE-05` | a self-reported tap → a point on the body |

Collapsing them into one rule would have hidden the second. Split into two, the
guard then found a **fourth** site its author had missed —
`twin-stage.tsx:243`'s `signals?: Array<{ key; node: { x; y }; color }>`, the
prop contract that carries a body coordinate between producer and renderer.

### Two weak tests the sabotage harness found before it ran

Recorded because a guard author finding their own guard decorative is the only
evidence the harness is doing more than restating what was already known.

1. **Both inventories were ratchets with a loose pawl.** `length <= CAP` means
   that once a repair takes the list below the cap, the gap is room for one new
   claim and every assertion still passes. Cases **1456** and **1462** raise the
   constant and slipped against that form. Both constants must now **equal**
   their list, so buying room is a visible diff that fails.
2. **`it.each(VISUAL_MODULES)` only looks at what the list names.** Dropping
   `twin-stage.tsx` from `VISUAL_MODULES` while leaving it inventoried removed
   the product's worst visual encoding from the instrument and broke nothing —
   case **1461**. Membership is now asserted both ways round: every inventoried
   file must still be a module under test.

### The regression this tranche caused, and how it was found

**The most important thing 0R-2 produced is a defect it introduced itself.**

Running `run_s7b` after the tranche returned **168/171**, against **171/171** at
the Experience 0 close. Three cases:

| case | verdict | cause |
|---|---|---|
| **1007** | **SLIPPED** | a colonisation claim re-added to `lib/account/meal-impact.ts` stopped being caught |
| **1011** | **SLIPPED** | "live foods" as a category re-added to `lib/assessment-scoring.ts` stopped being caught |
| 1090 | ANCHOR MISSING | 0R-1's dedup block moved the line the case anchors on |

1007 and 1011 are a **real coverage loss, caused by 0R-2.**
`KNOWN_UNCORRECTED` was a list of **files**. 0R-2 added three files to it
because `PERSONAL_BIOTIC_STATE` had just started running against the ledger —
and a file-level allowance granted each of them an allowance for **all three
rule families at once.** Both files were ledgered for a personal-Biotic claim;
neither had ever been allowed a fermented-category one. Two cases that had been
caught for their whole life went quiet, and nothing else in the suite noticed,
because the allowance was keyed on the filename.

**It is the same lesson `EXPOSED_AT_0R1` already encodes one screen above it** —
inventory per (file, **rule**), never per file — and the ledger did not have it.
Writing one mechanism with the lesson and one without, in the same file, in the
same tranche.

| | |
|---|---|
| repair | `KNOWN_UNCORRECTED` is now `readonly [file, rule][]` — **5 files became 9 findings** |
| the comparison | `unguardedClaimFindings()` emits one row per (file × rule it trips), compared by exact equality |
| the staleness test | a pair whose rule no longer matches **fails**; a pair naming a rule that does not exist fails louder, because it constrains nothing while reading as covered |
| 1007 · 1011 · 1090 | **all three caught** after the repair |
| new cases | **1465** a ledger entry names a rule its file does not trip · **1466** a ledger entry names a rule that does not exist |

1090 is a different thing and is not dressed up as the same: the case is aimed
correctly and its **anchor** no longer exists, so the anchor was repointed to
the dedup block with the reason recorded inline. That is the Gate 4 precedent
(two repointed anchors), not a weakened case.

> **A slipped case strengthens the test, never the case** — and here the test
> that needed strengthening was one this tranche had just written.

### `tools/sabotage/cases_0r.py` + `run_0r.py` — the fourteenth suite

**17 cases, 1450–1466.** Fourteen mutate test source, because tranche 1's
deliverable *is* the instrument; the precedent is case 1310, which mutates
`agent-loop-claims.test.ts` for the same reason. Three mutate production files,
because "the widening sees a **new** claim" can only be proved by introducing
one.

| | |
|---|---|
| 1450–1451 | a corpus leaves `GUARDED_SURFACES` — `P0-GUARD-01` / `-02` reopen |
| 1452 | one **file** quietly leaves the Report corpus, and the D7 ledger catches it — 0R-2 protecting 0R-1 |
| 1453–1455 | a rule family leaves the inventory's rule set, and the D7 gap itself restored |
| 1456–1457 | the inventory grows, or an entry outlives its debt |
| 1458 | a personal Biotic claim introduced on a newly guarded Report module |
| 1459–1462 | the form instrument narrowed, or a module dropped from it |
| 1463–1464 | a new encoding appears — one per form |
| 1465–1466 | the ledger's (file, rule) granularity, added after 1007/1011 slipped |

### What tranche 1 did not do

**No production file was modified.** No FSS methodology, candidate domain,
weight, band decision, comparison rule, My Food System composition authority,
Gate 6 context ceiling or Gate 6.1 model authority was touched. No refusal was
removed, no route reclassified, no copy rewritten, and no finding repaired.

The debt is now **visible and un-growable**. Repair begins at 0R-3.

---

## 8 · DELIVERY RECORD — 0R-3 (`P0-TRUST-05`)

The first tranche that changed **product behaviour** rather than enforcement.

| | |
|---|---|
| production files changed | **4** — `ask-twin.tsx` · `consult-client.tsx` · `text-chat.tsx` · (`customer-surfaces.ts` is test corpus) |
| the invariant established | **authorship is created by the member's explicit submit action, not inherited from the source of the text in the input box** |

### The trace came first, and it overturned the register

Nine layers, read rather than assumed. **Two** change authorship —
`consult-client.tsx:218-225` (the mount auto-send) and `:263` (the
`{ role: "user" }` construction) — and **seven** cannot tell, because one
undifferentiated `Message[]` reaches the schema, the model, the summary call and
the persisted row.

**The register said the auto-send was live. It never was.** `/account/consult`
and `/account/consult/deep-dive` are both POST_V1-refused and 404 in every
environment, re-verified by live HTTP. So:

| | |
|---|---|
| **LIVE** | the prohibited premise rendered on `/account`, in the member's voice |
| **LATENT** | everything downstream of the link |

Recorded, not quietly corrected: **reachability changes severity; it does not
erase a latent architectural hazard.**

**`?q=` was not the only producer.** Six sites in five files, including two the
register never named: `consult-client.tsx:457-458`, which asserted a personal
weakest score in the **consultant's** voice before the model had spoken, and
`components/eatobiotic/text-chat.tsx:157`, the same authorship defect in a fifth
file — found by tracing the class rather than the instance.

### Why neither 0R-1 nor 0R-2 could have caught the live sentence

Both documented failure modes, on one line.

1. **Corpus gap** — `ask-twin.tsx` was in no corpus at all. 0R-1 widened by 33
   files and missed it.
2. **Interpolation gap** — `` `my ${BIOTIC_NAME[twin.biotics.weakest]} level` ``
   puts no Biotic word in the file, so a scan would miss it even inside the
   corpus.

**No new mechanism was invented, and 0R-1/0R-2 were not broadened.** CLAUDE.md
already designates the answer: a generator of customer-facing prose belongs in
`agent-loop-claims.test.ts`, which CALLS generators and reads what they return.
`buildPrompts` is now called there over all three `weakest` values. The red state
was **3 failures quoting the real sentence per Biotic** — stronger than a
screenshot, which shows one variant.

### The repair is structural

A suggestion can reach only `setInput`; a sender can be called only with the
member's draft, or with nothing. Product fact stays on its existing separate
`buildMemberProfile` channel. So the three categories are distinct **by
construction** — Gate 6.1's rule: remove the prohibited job rather than permit
it and validate a label afterwards.

**No authorship field** was added to the message type, the zod schema, the API
or the stored rows, and **no provenance was backfilled** onto historical
`consultations.messages` — those rows are structurally ambiguous and that is
recorded honestly rather than invented.

### Three defects in the new guard, found by the guard

| | |
|---|---|
| the draft rule refused `report-client.tsx` | its sender takes **no argument** and reads the draft from closure — a *stronger* form of the same property |
| the param rule cried wolf | `q` *"flows into map"*, because `STARTER_QUESTIONS.map((q) => …)` names its callback `q`. A name collision, not a flow. Scoped to the effect |
| the effect rule was too narrow | mount-only would have permitted `useEffect(() => sendMessage(input), [input])` — the argument IS the draft. Widened to **every** effect; **sabotage 1471 is that shape** |

`report-client.tsx` had always called `setInput` from a suggestion. It stays in
the guard's corpus as a surface that must remain correct, and doubles as the
known-clean control proving the rules are satisfiable.

### Evidence

`run_0r` **1467-1473, 7/7 caught** · rendered proof on the `twin-present`
fixture · both consult routes re-verified **404** and labelled
`LATENT / POST_V1 REFUSED`, with **no reachability manufactured** to exercise
the refused architecture.

### Left for 0R-8, deliberately

**Two** affordances on live `/account` point at a refused route — both of them
`AskTwin` chips, in one component, behind the `twin && twinVisual` gate, on a
surface the nine-route link crawler does not cover. Derived at the 0R-3 close:
an earlier draft said *three*, which was the pre-repair count including the
retired Biotic premise. `buildPrompts` now returns **1 or 2**, never 3.

Added to this stage's scope by the same reconciliation:
`lib/email/paid-onboarding-email.ts:96` links *"Start a consultation →"* to the
refused route from a **live lifecycle email** — outside `/account` and outside
any crawler.

> 0R-3 asks *"if this capability exists, is authorship and premise handling
> safe?"* · 0R-8 asks *"should this destination be presented as available at
> all?"*
