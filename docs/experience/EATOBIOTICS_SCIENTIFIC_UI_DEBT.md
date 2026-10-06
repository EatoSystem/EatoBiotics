# EatoBiotics — Scientific & Product UI Debt Register

**Experience 0.** Findings are **recorded, not repaired**. Nothing here is fixed
during the audit; each entry is an explicit input to the redesign phase.

Finding ids are stable so screenshots, inventories and the Keep/Evolve/Merge/
Move/Retire map can cite them.

---

## The standard these findings were held to

> **Source inspection can establish possibility. Rendered evidence establishes
> reachability.**

Adopted as a permanent audit standard after it prevented this register from
recording a defect that cannot occur. Every `P0` below was **verified by
render**. The one finding that source-reading suggested but rendering
disproved is filed as `DEBT-CODE-01`, not as a customer-facing problem.

---

## Severity

| | |
|---|---|
| **P0** | product contradiction — the UI represents something that should not exist |
| **P1** | major experience issue — substantially harms comprehension, trust or completion |
| **P2** | significant visual/interaction issue |
| **P3** | refinement, worth doing after architecture is correct |
| **DEBT-CODE** | code or legacy debt with no current customer-facing effect |

---

## `P0-TRUST-01` · Fabricated member data presented as the member's own

> **CLOSED at 0R-4.** All four live manifestations removed; proved by render,
> per manifestation. One unreachable reference survives as `DEBT-CODE-01`.
>
> **THE AUDIT CAUGHT ONE OF FOUR.** The entry below describes the Overview
> tab's "Today's Meals". Tracing `MOCK_MEALS` to every consumer in 0R-4 found
> three more live sites, on two tabs, reaching a different population — not "a
> member with no meal today" but **a member with no analyses at all**.
>
> | site | what rendered | population |
> |---|---|---|
> | `:1653` Today's Meals | a fabricated meal — name, time, type, Biotics score — above *"No meals logged today"* | any returning member before their first meal today |
> | `:1699` "Today's average" | **71**, from `MOCK_MEALS`, behind a gate written `(todayMeals.length > 0 \|\| true)` — **a tautology**, so it always rendered | same |
> | `:1931` My Meals history | a fabricated **seven-day history** with invented insights, per-Biotic numbers and nutrition figures, incl. *"The kimchi lifts your probiotic score significantly"* and *"would push your diversity score from 55 to ~72"* | **any member with zero analyses** |
> | `:1936` / `:1938` | *"7 meals logged this week · Average score: 73"* | same |
>
> Site-level evidence is preserved above so provenance is not lost: the audit
> found the first by render; the other three were found by tracing the constant.
>
> **Remediation.** Real data only, on every site. Zero meals render as zero
> meals; missing history renders as missing history; counts and averages derive
> from `recentAnalyses` and nothing else. **No sample data, no more-realistic
> fixture and no inferred history replaced any of it.** The `|| true` gate was
> deleted rather than honoured, because the block it guarded has nothing to show
> without real meals.

**Surface** `/account` (`V1_CORE`, served) · **Component**
`components/account/live-dashboard.tsx:1653` · **Generation** 1 (legacy
dashboard) · **Verified** by render, 2026-10-03

### What exists

```tsx
{(todayMeals.length > 0 ? todayMeals : MOCK_MEALS[0].meals).map((meal, i) => {
  const isMock = todayMeals.length === 0
```

`todayMeals` is `recentAnalyses.filter((a) => a.created_at.startsWith(todayStr))`
(`:864`), where `todayStr` is the current date. The enclosing block requires
`recentAnalyses.length > 0` (`:1332`).

So a member who **has** analyses but **none dated today** falls to
`MOCK_MEALS[0].meals`. Rendered output, captured from the fixture:

> **Today's Meals**
> *Mackerel, kimchi & asparagus · 19:25 · Dinner · **71***
> **No meals logged today**

### Why it is a problem

This is not sample data labelled as sample data. It is **synthetic content
inside the member's personal product context** — a meal name, a time, a meal
type and a Biotics score — under a possessive heading, directly above a sentence
stating that nothing was logged. **The screen contradicts itself.**

And it is not an edge case. It is **every returning member before their first
meal of the day**, which is the most common way a daily product is opened.

### Which principle it conflicts with

The permanent product rule's first clause — *measure the food system we can
observe*. A fabricated meal was not observed. `isMock` at `:1654` shows the code
knows it is inventing, and shows it anyway.

### Classification

| | |
|---|---|
| Kind | product architecture + trust, not visual |
| Disposition | **RETIRE** the fallback. A member with no meals today has no meals today; the honest render is the empty state alone |
| Redesign input | the empty state must be designed, not substituted |

---

## `P0-SCIENCE-01` · Personal Biotic scoring, in language and in UI

**Surface** `/account` · **Components** `live-dashboard.tsx:1182`/`:1186`
(first-use copy) and `:97-99` (`MealCard` bars) · **Generation** 1 ·
**Verified** by render, 2026-10-03

### What exists

The first-use block, gated on `recentAnalyses.length === 0`, renders:

> *"**Your Biotics score** is built one meal at a time. Log your first meal and
> we'll give you an instant breakdown of its **Prebiotic, Probiotic, and
> Postbiotic value**."*

And `MealCard` delivers exactly that promise:

```tsx
<ScoreBar label="Prebiotic"  score={meal.biotics.prebiotic} />
<ScoreBar label="Probiotic"  score={meal.biotics.probiotic} />
<ScoreBar label="Postbiotic" score={meal.biotics.postbiotic} />
```

The promise and the delivery are internally consistent. Both sit against the
stated rules.

### Which principles it conflicts with

**The locked architecture.** *The Three Biotics explain the science. The domains
describe what EatoBiotics can actually observe.* And: **none of the Three
Biotics receives a personal numerical score.**

**CLAUDE.md's vocabulary rule.** *One meal gets a **Meal Biotics Score**, never
the person's Biotics Score™.* The copy says "**your** Biotics score … built one
meal at a time", which merges the two the rule separates.

**Gate 5's standing exclusion.** *Meal-level per-Biotic bars, still off every
surface.* They are not off this surface.

### Classification

| | |
|---|---|
| Kind | product/science contradiction — **not** an open aesthetic question |
| Disposition | **RETIRE / REMEDIATE.** The bars are not to be redesigned or beautified |
| Redesign input | first-use copy needs a reviewed replacement that promises only what the product may deliver |

### One honest note on scope

Whether a **meal's** prebiotic sub-score is a *personal* Biotic state is a
genuine question — a property of the meal, or a measurement of the person
wearing a meal's label. The audit records the evidence and the conflicting
rules. **It does not rule**, because a claims decision belongs to the founder.
The founder has classified this as a product/science contradiction, and that
classification is what this entry carries.

---

## `P0-SCIENCE-02` · **Your Biotics Profile** — three personal per-Biotic scores, as rings, numbers and band words

**Surface** `/account` (`V1_CORE`, served) · **Component**
`components/account/live-dashboard.tsx:1715-1740` · **Generation** 1 ·
**Verified** by render, 2026-10-03

### What exists

Under the heading **"Your Biotics Profile"**, three cards, each a ring with a
number and a word beneath it:

| | rendered | band word |
|---|---|---|
| Prebiotic | **71** | `On track` |
| Probiotic | **23** | `Needs work` |
| Postbiotic | **48** | `Building` |

followed by *"Week 16 of 30 · Building your food system"*.

```tsx
{ label: "Prebiotic", score: displayBiotics.prebiotic,
  delta: displayBiotics.prebiotic >= 60 ? "On track"
       : displayBiotics.prebiotic >= 30 ? "Building" : "Needs work", … }
```

### Why it is a problem

The permanent product rule's third clause names this construction exactly:

> No surface may state, imply or render a member's own Prebiotic, Probiotic or
> Postbiotic state — **not as a number, not as a bar, not as a band word, not as
> a superlative, not as a possessive**, and not as a mechanism.

This is all five at once: a number, a ring, a band word, a possessive heading,
and a per-Biotic ranking. Gate 5's standing exclusion — *meal-level per-Biotic
bars, still off every surface* — is the narrower case; this is the person's own
profile, not one meal's.

### SETTLED: the construct is wrong always, not only when fabricated

The `member-with-biotics` fixture state passes **genuine** per-Biotic values
(58 / 44 / 63) instead of letting `:817` fall back. Rendered at 390:

> **YOUR BIOTICS PROFILE**
> Prebiotic **58** · *Building* — Probiotic **44** · *Building* — Postbiotic **63** · *Strong*
> *Week 18 of 30 · Building your food system*

**Identical construct.** Same rings, same numbers, same band words, same
possessive heading. Real data makes the claim more convincing, not less
prohibited.

So `P0-SCIENCE-02` is **independent of `P0-TRUST-02`** and needs its own
remediation: removing the fabricated fallback would leave this defect
untouched, and fixing the data source is not a fix.

### Classification

| | |
|---|---|
| Kind | product/science contradiction |
| Disposition | **RETIRE.** Not to be redesigned, rebanded or recoloured |
| Reachability | **always**, whenever the overview renders — fabricated or genuine |
| Redesign input | whatever replaces it must describe the observed food system, not the biology |

---

## `P0-TRUST-02` · Fabricated member-attributed content presented as the member's own

> **CLOSED at 0R-4**, across all three sites. Proved by render.
>
> **THE ID WAS USED FOR TWO DIFFERENT FINDINGS.** `EXPERIENCE_0R_REMEDIATION_SPEC.md`
> defined `P0-TRUST-02` as *"Fabricated quotation attributed to the member's own
> report"*; this register defined it as the per-Biotic hardcoded fallback. Both
> were real. Canonicalised at 0R-4 as **one** trust finding — *fabricated
> member-attributed report or profile content presented as though it belongs to
> the member* — with **three sites**, rather than renumbering a finding
> mid-programme:
>
> | site | what rendered | reachability |
> |---|---|---|
> | **1** · `:817` | `propBiotics ?? { prebiotic: 71, probiotic: 23, postbiotic: 48 }` — invented numbers as the member's own profile, with band words | **live**, and reachable in production: `app/account/page.tsx` filters out null per-Biotic columns for `bioticsProfile` while `recentAnalyses` does not |
> | **2** · `:1885` | under **"From your latest report"**, *"…shift your overall Biotics number by **8–12 points within three weeks**"* — a quantified predicted outcome attributed to a report that does not exist | **live** for any member with no weekly report |
> | **3** · the Consultations tab | **three fabricated weekly consultations** — invented dates, "Week 8 of 30", average scores, deltas, meal counts, a score-progression strip, a fabricated report **count**, quotations attributed to the member (*"Your prebiotic score held steady…"*), and `pillars` rendered as **per-Biotic `ScoreBar`s** | **live** for any member with zero reports. **In no register entry** — found by tracing every mock constant to every consumer |
>
> **Remediation.** Site 1: the fallback removed with the construct it fed. Site
> 2: the attributed frame renders **only** when a real `pullQuote` exists. Site
> 3: `MOCK_CONSULTATIONS` **deleted entirely** — it had zero readers once the
> fabricated count and card list were removed — with a truthful empty state for
> zero reports. No demo, sample or placeholder report content replaced any of it.

### The original entry, preserved as site 1's evidence

**Surface** `/account` · **Component** `live-dashboard.tsx:817` ·
**Verified** by render, 2026-10-03

### What exists

```tsx
const displayBiotics = propBiotics ?? { prebiotic: 71, probiotic: 23, postbiotic: 48 }
```

`71 / 23 / 48` are **invented constants**. The fixture passes no `biotics` prop,
and those are the three numbers that rendered.

### Why it is reachable in production, not just in the fixture

`app/account/page.tsx:95-111` returns `undefined` for `bioticsProfile` when the
member's last five analyses have **null** per-Biotic columns:

```ts
const rows = (data ?? []).filter(
  (a) => a.prebiotic_score != null && a.probiotic_score != null && a.postbiotic_score != null
)
if (rows.length === 0) return undefined
```

`recentAnalyses` (`:113-125`) applies **no such filter**. So a member who has
logged meals in the last seven days, but whose per-Biotic sub-scores are null,
satisfies the `recentAnalyses.length > 0` gate at `:1332` **and** gets
`displayBiotics` from the fallback.

That member is shown `71 / 23 / 48` — with band words, and with the prose below
naming their "lowest pillar" from those invented numbers — as **their own
profile**.

And the null case is not hypothetical. `supabase/migrations.sql:170-172` adds
the three columns to an **existing** table:

```sql
ADD COLUMN IF NOT EXISTS prebiotic_score  integer,
ADD COLUMN IF NOT EXISTS probiotic_score  integer,
ADD COLUMN IF NOT EXISTS postbiotic_score integer,
```

Nullable, no default, no backfill. **Every analysis row written before that
migration carries NULL in all three** — so any member whose five most recent
analyses predate it falls straight to the fabricated numbers.

This is the same class as `P0-TRUST-01` and strictly worse: `P0-TRUST-01`
fabricates a meal, this fabricates a measurement of the person.

### Classification

| | |
|---|---|
| Kind | product architecture + trust, and scientific |
| Disposition | **RETIRE** with `P0-SCIENCE-02`; the fallback has no honest replacement |

---

## `P0-SCIENCE-03` · Personal per-Biotic prose: lowest pillar, strength, and a causal mechanism

**Surface** `/account` · **Component** `live-dashboard.tsx:1757`, `:1843`,
`:1896` · **Verified** by render, 2026-10-03

### What exists

**`:1757`**, "Your Focus Today", comment `{/* Your Focus Today — lowest pillar driven */}`:

> *"**Your probiotic score is your lowest pillar.** One serving of kimchi, kefir,
> yoghurt, or kombucha today would make a measurable difference."*

**`:1896`**, "This month's focus":

> *"**Your Prebiotics have been strong but your Probiotics are pulling down your
> Biotics Score™.** One fermented food daily for 30 days changes this."*

**`:1843`**, the default pull-quote rendered when no weekly report exists:

> *"Your probiotic score is your biggest lever right now. One daily fermented
> food would **shift your overall Biotics number by 8–12 points within three
> weeks**."*

### Why each is a problem

| line | what it asserts | principle it conflicts with |
|---|---|---|
| `:1757` | a personal Probiotic value, ranked lowest of three | personal Biotic state; superlative |
| `:1896` | personal Prebiotic *and* Probiotic states, **plus a mechanism** — one causing the other to fall | personal Biotic state; *"not as a mechanism"*; no causal attribution |
| `:1843` | a **quantified predicted outcome** with a magnitude and a deadline | no guaranteed outcome; no biological inference from behaviour |

`:1843` is the most exposed of the three: it is presented as a quotation **from
the member's own report**, so a fabricated prediction is attributed to
EatoBiotics' own analysis of them.

### SETTLED: the three sites have three different reachabilities

The `weekly-report-present` fixture supplies a genuine report with a
deliberately non-predictive quote. Rendered, it shows:

> **FROM YOUR WEEK 14 REPORT**
> *"You logged nine meals this week, three more than the week before."*

So they separate cleanly, and they do **not** share a fix:

| site | reachability | what it is |
|---|---|---|
| `:1843` pull-quote | **fallback only** — a real report displaces it | fabricated content **attributed to the member's own report**. A trust defect: the frame is honest, the substitute is not |
| `:1896` this month's focus | **always** — unaffected by the report | hardcoded personal per-Biotic states, a **mechanism** ("pulling down"), and a 30-day outcome promise |
| `:1757` your focus today | **always** | **extracted to `P0-TRUST-03`** — not merely unpermitted but false |

### `:1757` has been EXTRACTED — see `P0-TRUST-03`

It was recorded here and does not belong here. The other two sites make claims
the product has not earned the right to make; `:1757` makes a claim that **can
be false about the actual member**, which is a different category and needs its
own remediation proof.

Cross-referenced rather than duplicated, so neither entry can be closed by
fixing the other.

### Classification

| | |
|---|---|
| Kind | product/science contradiction + outcome claim + **a false personal statement** |
| Disposition | **RETIRE / REMEDIATE**, as two separate repairs; `:1757` is `P0-TRUST-03` and is proved closed on its own |

---

## `P0-TRUST-03` · Fabricated personal conclusion — **dual classification: P0-TRUST / P0-SCIENCE**

**Surface** `/account` (`V1_CORE`, served) · **Component**
`components/account/live-dashboard.tsx:1757`, block opened at `:1742` ·
**Generation** 1 · **Verified** by render and by source, 2026-10-03

### What exists

```tsx
{/* Your Focus Today — lowest pillar driven */}
…
  Your probiotic score is your lowest pillar. One serving of kimchi, kefir,
  yoghurt, or kombucha today would make a measurable difference.
```

The comment asserts a derivation. There is none: **`displayBiotics` is
referenced zero times anywhere in that block**, and the sentence is a literal
naming Probiotic unconditionally.

### Why it is dual-classified, and why that is not pedantry

| | |
|---|---|
| **as P0-SCIENCE** | it asserts a personal per-Biotic state and ranks it lowest of three — the construct the permanent product rule forbids outright |
| **as P0-TRUST** | it is **untrue** for any member whose lowest value is not Probiotic. Not unsupported. Wrong |

Every other entry in this register describes the product saying something it has
not earned the right to say. This one describes the product telling a member
something **false about their own data**, under a heading that says it was
derived from it.

### How it escaped notice

It rendered true in both captured fixtures by coincidence — Probiotic is lowest
in the hardcoded fallback `71/23/48` **and** in the genuine `58/44/63`. A
fixture whose lowest value were Prebiotic would have exposed it immediately.
That is a lesson about fixture design, not about this sentence: **a state chosen
to look ordinary can hide a defect by agreeing with it.**

### Classification

| | |
|---|---|
| Kind | product trust **and** scientific claim |
| Reachability | **always** — the block renders whenever the overview does |
| Disposition | **RETIRE** the sentence |
| Remediation proof | **its own.** Removing per-Biotic scoring does NOT satisfy it: a product that stopped showing the numbers and kept this sentence would still be telling members something false |

> Do not merge this into `P0-SCIENCE-02`. The two are satisfied by different
> repairs and must be proved closed separately.

---

## `P0-GUARD-01` · The claims guard does not scan the largest customer surface

**Not a UI defect — the reason the three above could ship green.**
**Verified** by source, and corroborated by every finding above rendering.

### What exists

`tests/unit/biotic-claims.test.ts:47` imports exactly two lists:

```ts
import { MARKETING_SURFACES, AI_PROMPT_SURFACES } from "./customer-surfaces"
```

`GUARDED_SURFACES` (`:313`) is composed of six lists, and
**`ACCOUNT_SURFACES` is not one of them** — the list in
`tests/unit/customer-surfaces.ts:96` whose **first entry** is
`"components/account/live-dashboard.tsx"`. It is imported by
`commercial-model.test.ts`, never by the personal-Biotic guard.

So `PERSONAL_BIOTIC_STATE` — nine rules written precisely to catch *"Your
probiotic score"*, *"strongest Prebiotic"*, *"your Probiotics"* — **has never
been run over the real `/account` dashboard**. The rules work; nothing points
them at the file.

Rule 4, `\b(?:[Yy]our|[Mm]y)\s+${BIOTICS_ANY}\b`, matches `:1757` and `:1896`
as written. It simply never sees them.

### The second, narrower gap

`BIOTICS` is `(?:Prebiotics|Probiotics|Postbiotics)` — **capitalised and plural
only**. So rule 1, *"a personal score attributed to a Biotic"*
(`Your ${BIOTICS} score`), would not match `:1757`'s lowercase singular
*"Your probiotic score"* even if the file were in the corpus. Only the
`BIOTICS_ANY` rules would fire.

### Why this matters beyond these findings

Gate 3.6's own docblock (`biotic-claims.test.ts:259`) cites the fact that
*"`customer-surfaces.ts` lists `live-dashboard.tsx`"* as context for a gap it
was closing elsewhere. The list does name the file. The guard that needed it
does not import the list. **A corpus that names a surface proves nothing unless
the rule consumes that corpus** — a third variant of the failure that file has
already recorded twice.

### Classification

| | |
|---|---|
| Kind | guard/corpus defect — the enforcement gap behind `P0-SCIENCE-01/02/03` |
| Disposition | **REPAIR FIRST**, before any UI work |

> **Deliberately not repaired during Experience 0.** Adding `ACCOUNT_SURFACES`
> to `GUARDED_SURFACES` turns the suite red immediately, because the violations
> it would catch are real and live. Going red is the correct outcome and the
> proof the gap was load-bearing — but the fix belongs with the remediation that
> removes the claims, not with an audit whose whole constraint is that it
> changes no product UI. Widening the corpus and then editing `/account` to make
> it green would be the redesign this gate is forbidden to do.

---

## `P0-TRUST-04` · "Appears strongest" over copy calling that Biotic the thinner part

**Surface** `/assessment/you` → Results (`V1_CORE`, the free product) ·
**Component** `components/assessment/result/food-system-pattern.tsx:89` ·
**Generation** 2 · **Verified** by render and by source, 2026-10-04

### What exists

```tsx
<p ...>Appears strongest</p>
<p ...>{strongest.label}</p>
<p ...>{strongest.strength ?? strongest.opportunity}</p>
```

Rendered, with a varied answer sheet:

> **APPEARS STRONGEST**
> **Postbiotics**
> *"Your answers suggest rhythm and colourful, polyphenol-rich foods are **the
> thinner part here**."*

### Why the `??` is the defect

`insights` arrives sorted weakest-first, so `strongest` is simply the last
element — **not necessarily a Biotic with any strength copy**. `getInsights()`
sets `strength` only above its own threshold, independently per pillar. So the
highest of three low scores has `strength === undefined`, and the fallback
prints its *opportunity* text under a heading calling it strongest.

### The component already knows this is a defect — in the other branch

Its own docblock records the equal-scores version being found and fixed:

> *"visual validation of an all-zero sheet showed a card headed 'Appears
> strongest' whose own text called that Biotic the thinner part"*

and guards the mirror case for the sibling card, naming it explicitly:

> `showExploring = !sameOne && !!focus.opportunity` — *"otherwise it would show
> strength copy under a heading calling it something to explore, **the same
> class of contradiction** the equal-scores case above was fixed for."*

**The exploring card got a guard. The strongest card got a `??`.** One
suppresses the contradiction; the other produces it.

### Classification

| | |
|---|---|
| Kind | product contradiction — the screen contradicts itself |
| Reachability | **any result where the highest Biotic is still below its strength threshold** — i.e. commonly, for lower scorers |
| Disposition | **REMEDIATE** — mirror the existing guard: render the card only when `strongest.strength` exists |
| Enforced by | `tests/e2e/audit-capture-assessment.spec.ts` → `P0-TRUST-04`, written to FAIL when repaired |

> Classified P0 on the `P0-TRUST-01` precedent — "the screen contradicts
> itself". It fabricates no data, so a P1 classification is defensible; the
> founder's call.

---

## `P1-FUNNEL-01` · Every add-on CTA on the free Results page is a 404

**Surface** `/assessment/you` → Results (`V1_CORE`) · **Verified** by live HTTP,
2026-10-04

### What exists

Results closes with **"Explore another focus"** offering four links. All four
are `POST_V1_ROUTES` and all four return **404**:

| link | status |
|---|---|
| `/assessment/add/stability` | **404** |
| `/assessment/add/glucose` | **404** |
| `/assessment/add/mind` | **404** |
| `/assessment/add/performance` | **404** |

These are the **only** in-content next steps Results offers besides the €49
consultation. A person finishing the free assessment is given four onward paths
and every one is a dead end.

### Why it was not caught

`tests/e2e/v1-launch-surface.spec.ts:181` has a working crawler — *"every
in-site link on X resolves"* — over:

```
["/", "/assessment", "/pricing", "/about", "/help", "/food", "/book", "/adhd", "/enter"]
```

`/assessment` is the **foundation chooser**. Neither `/assessment/you` nor
`/assessment/results` is in the list, so the crawler has never visited the page
that carries the dead links.

**The same shape as `P0-GUARD-01`**: the guard exists, works, and is pointed
somewhere else.

### Classification

| | |
|---|---|
| Kind | commercial funnel + navigation |
| Disposition | **REMEDIATE** — either serve the add-on routes or remove the CTAs; and add the Results route to `CRAWLED` |

---

## `P2-FSS-ARCH-01` · Generation-crossing Biotics dependency

**Surface** My Food System → Biotics · **Components**
`components/fss/system/biotics.tsx` (Gen 4) → `components/agent-loop/BioticsProgressPanel.tsx`
(Gen 1) · **Verified** by source closure, 2026-10-04

### What exists

Generation 4's Biotics area renders a **Generation 1 component**. That is the
only cross-generation dependency in `components/fss/`.

### Why it is recorded even though it currently passes cleanly

The step-4 audit concluded that because `BioticsSection` takes no props,
personalisation was *structurally unavailable*. **That overstated the
evidence.** Taking no props closes one ingress; a child can still read context,
hooks, a store, `localStorage`/`sessionStorage`, URL state, module globals or a
network endpoint. "No props" describes the **call site**, not the subtree.

Measured over the transitive import closure:

| | |
|---|---|
| closure | `BioticsProgressPanel` → `lib/pillars` → **nothing** |
| ingresses checked | 11 (context, state, effects, storage, IndexedDB, cookies, routing, network, globals, Supabase, providers) |
| breaches found | **0** |
| panel props | exactly one, `className` |
| guard proved non-vacuous against | `dashboard-parts.tsx` (state, effect), `lib/assessment/sync.ts` (storage, network) |

### The risk this records is forward-looking

Not today's render, which is clean. The risk is that **Generation 4 inherits a
Generation 1 capability accidentally, through reuse**, the next time somebody
makes the panel "a bit more useful". The dependency is the thing that makes that
possible, and it is invisible from inside `components/fss/`.

### Classification

| | |
|---|---|
| Kind | architectural debt — no current customer-facing effect |
| Disposition | **RECORD and PROVE**, do not refactor during Experience 0 |
| Enforced by | `tests/unit/biotics-panel-ingress.test.ts` |

> A dependency that cannot currently reach the person, and now cannot quietly
> learn how.

---

## `DEBT-CODE-01` · Unreachable mock fallback

**Component** `live-dashboard.tsx:1642` · **Not customer-facing**

### What exists

```tsx
{latestAnalysis
  ? <MealCard meal={realToMealEntry(latestAnalysis)} />
  : <MealCard meal={MOCK_MEALS[0].meals[0]} />}
```

under the heading **"Your Last Analysis"**.

### Why it is NOT a P0

The enclosing block (`:1332`) is gated on `recentAnalyses.length > 0`, and
`latestAnalysis = recentAnalyses[0] ?? null` (`:870`). So whenever the block
renders at all, `latestAnalysis` is non-null and the real branch is taken. **The
else-branch cannot currently execute.**

This register originally carried it as a P0 on the strength of source reading.
Rendering the sparse and meals-tab states disproved it. Recorded here as the
worked example of the standard at the top of this file.

### Classification

| | |
|---|---|
| Kind | dead / legacy code |
| Disposition | **RETIRE** with the surrounding generation; no customer impact to schedule around |

---

## `NOTE-FIXTURE-01` · What the audit fixture does and does not prove

Not a defect in the product. Recorded because it would otherwise be mis-cited
later — and because the audit's own tooling made the mistake first.

The Experience Audit Fixture sets `email: null` and `twin: null` in every state.
That is a **fixture safety constraint**, because `live-dashboard.tsx:860` calls
`pushTwinState` from a **mount effect** and `lib/account/twin-state-sync.ts:67`
does `fetch("/api/twin-state", { method: "PUT" })` — so a fixture carrying a
plausible email beside a twin would write to a real API from a page whose
purpose is to touch nothing.

**It is not evidence that the real dashboard has no mount side effects.** It
does have them, and there are **two**, not one.

### The second one, found by render after being asserted away

The fixture was documented — by me, in `tests/unit/experience-audit-fixture.test.ts`
— as making *"no network request at all"*. The capture harness disproved it on
its first run: **every one of the 75 captures recorded exactly one console
error, a 401 from `GET /api/assessment/journey`.**

`AssessmentJourneyCard` (`components/account/dashboard-parts.tsx:33`) calls
`ensureHydrated()` from a mount effect, which GETs that route via
`lib/assessment/sync.ts:65`. **It reads no prop**, so unlike the twin-state PUT
no fixture data can disarm it.

| | mount effect | fixture's control over it |
|---|---|---|
| write | `PUT /api/twin-state` | **prevented** by `email: null` + `twin: null` |
| read | `GET /api/assessment/journey` | **none** — unconditional; refused `401` |

### What is therefore true, stated precisely

The fixture **writes nothing and reads no customer data**: the one request it
makes is unauthenticated, so the route refuses it and returns nothing. That is a
weaker claim than the one originally made, and it is the accurate one.

The exact footprint is now **pinned by render** in
`tests/e2e/audit-capture.spec.ts` (`EXPECTED_API_CALLS`), so a third mount-time
request appearing later fails a test instead of being noticed by someone reading
a console. A unit test could not have caught this and did not.

> Source inspection can establish possibility. Rendered evidence establishes
> reachability — including the reachability of a side effect the author had
> asserted away.

---

## `NOTE-CAPTURE-01` · The corpus is archived, not regenerated — measured, not assumed

Not a product defect. Recorded because the artifact protocol rests on it and a
later reader would otherwise assume the wrong guarantee.

### What was measured

The full corpus is gitignored and archived, which is only safe if it can either
be **restored** or **rebuilt**. So the harness was run twice, unchanged, and the
two manifests compared by SHA-256:

| capture conditions | identical | differing |
|---|---|---|
| as first written | 23 / 105 | **82** |
| `animations: "disabled"` | 84 / 105 | 21 |
| …plus scroll-reveal settling | 85 / 105 | 20 |
| …plus waiting for image decode | **92 / 105** | 13 |

Each fix came from evidence, not guesswork. The first: no `overview` capture was
ever stable and every stable one was a view with no content to animate, which
pointed at CSS transitions on the score and Biotics rings — and
`page.clock.install` does not stop those, because a transition runs on the
compositor while the clock fakes timers and rAF. The last: decoding two captures
of one view to raw pixels put the difference in a **34×34 box at (34, 2011)** —
the meal thumbnail — at 0.038% of bytes, with identical image dimensions.

### What remains, and why it is not chased further

Thirteen of 105 still differ, each a comparably tiny region in an image or
animated element. **Byte-identical re-capture is not achievable here, and it is
not what the manifest promises.**

The SHA-256 verifies **the archived artifact** — "is this image the one the audit
recorded?" — which is exactly what a reader needs and is unaffected. What
byte-determinism would have additionally bought is the ability to *rebuild* an
archive that was lost.

### The consequence, stated plainly

- the archive is the **artifact of record**; the manifest hashes describe it;
- a regenerated corpus is **equivalent, not identical**: same states, same
  dimensions, same content, with sub-0.05% pixel variation confined to images
  and animated elements;
- so if the capture environment is lost before Experience 0 close, the corpus is
  **re-captured and re-hashed**, and roughly one image in eight will carry a new
  hash. That is a recorded fact about the evidence, not a failure of it.

The three settling measures stay regardless: they removed 69 of the 82 unstable
images and cost nothing, and `animations: "disabled"` also holds rings at their
end state, which is the state a reader is meant to see.

**No component was modified to achieve any of this.**

### CLOSED — every residual difference measured, and none is material

A bounded check over the whole corpus, re-captured and compared pixel by pixel:

| | |
|---|---|
| unstable images | **14 of 105**, every one at **390** |
| largest difference | **0.2196%** of bytes |
| typical difference | under 0.01% |
| identical image dimensions | **all 14** |

Cropping the largest located it: the **horizontally-scrolling tab strip**
(`Overview · My Meals · My Reports · …`), whose scroll offset settles a few
pixels differently between runs. The one apparently large bounding box
(94×1779) is **sparse, not contiguous** — two small regions far apart, which is
what a bounding box cannot express on its own.

So no capture differs in **visual content**; they differ in the resting scroll
position of one nav element. **The subject is closed** and no further audit time
is spent on it.

### And the diagnosis produced a finding of its own

The tab strip **overflows horizontally at 390** and has to be scrolled to reach
the later tabs. That is why only mobile captures were affected. Recorded as a
responsive observation for `/account` (`RESP-ACCOUNT-01`), to be dispositioned
with the rest of the responsive findings rather than here.

> **`RESP-ACCOUNT-01` has no entry of its own and no status row, deliberately.**
> It is a responsive observation, not a claims or trust finding, and Experience 0
> produced no responsive-findings section for it to live in. It is named here so
> that a reader counting the register is not left wondering where it went: the
> register holds **24 entries**, and this id is the one named id outside them.
> Experience 5 is where it is dispositioned.

## `P0-SCIENCE-04` · The Twin encodes a personal Biotic verdict as a colour

**Surface** `/account` (Overview, whenever a Twin exists) · **Component**
`components/account/twin/twin-stage.tsx:284` reading
`lib/account/twin-visual.ts` · **Verified** by render, 2026-10-04

```ts
// twin-stage.tsx:280-284
const aura = reveal ? revealAura(reveal)
  : active ? auraGradientForBiotic(active.biotic, visual.confidence)
           : auraGradientForBiotic(twin.biotics.weakest, visual.confidence)
```

`twin.biotics.weakest` is `argmax`/`argmin` over the member's three per-Biotic
scores (`lib/agent-loop/biotics.ts:44-55`). The returned gradient is applied at
`:330-331` as the breathing aura **over the member's body figure**, and its
opacity carries `visual.confidence`.

So the colour of the glow around a picture of the member's body **is** a
personal per-Biotic comparative verdict. `PERSONAL_BIOTIC_STATE` forbids *"a
Biotic given a comparative or directional verdict"*, and the permanent product
rule forbids any surface that may *"state, imply or **render**"* a member's own
Biotic state.

### Why every existing guard missed it

There is **no string**. `${BIOTIC_LABELS[k]}` at least puts a word in a file;
this puts a hex triple in a CSS gradient. A source scan, a corpus list and the
behavioural generator guard are all text instruments, and this claim has no
text. It survived Gate 3.6 — which removed the chip, the bar and the band word
from the hotspots **in this same component** — because the repair was scoped to
the forms it found.

> This is the form the boundary returns in. Recorded in the Experience
> Constitution as a principle, not only here as a finding.

### A second, unconsumed mapping in the same module

`twinVisualState()` computes `auraGradient: auraGradientForBiotic(twin.biotics.strongest, …)`.
**Nothing reads `.auraGradient`** (verified: zero consumers outside
`twin-visual.ts`). So the module ships two Biotic→colour mappings, one live on
`weakest` and one dead on `strongest`. The dead one is `DEBT-CODE`; it is
recorded here because removing the live one must not leave the dead one as a
ready-made replacement.

### Classification

| | |
|---|---|
| Kind | **scientific debt** — personal Biotic state, rendered |
| Reachability | **live** on `/account` for any member with a Twin (see `P0-ARCH-01`) |
| Disposition | **RETIRE the mapping.** The aura may carry time-of-day mood or data density; it may not carry which Biotic is weakest |
| Remediation proof | the guard that catches it cannot be a string guard — it must assert that no Biotic key reaches a visual-parameter function |

---

## `P0-TRUST-05` · A product-authored Biotic premise, offered as the member's own question

> **REMEDIATED at 0R-3.** Live half repaired and proved by render; latent half
> repaired and proved at source. See *0R-3 outcome* at the end of this entry.

**Surface** `/account` (Overview) · **Component**
`components/account/twin/ask-twin.tsx:20` → `app/account/consult/consult-client.tsx:219-225`
· **Verified** by render, 2026-10-04

> **REACHABILITY CORRECTED at 0R-3, and it changes what this entry claims.**
>
> The text below says the auto-send is live. **It was never customer-reachable.**
> `/account/consult` and `/account/consult/deep-dive` are both in
> `POST_V1_ROUTES` (`lib/v1-surface.ts:350-351`) and return **404 in every
> environment** — re-verified by live HTTP at 0R-3.
>
> | | |
> |---|---|
> | **LIVE / customer-reachable** | the prohibited premise **rendered** on `/account`, in the member's voice |
> | **LATENT / POST_V1 refused** | the `?q=` handling · the mount-time auto-send · the product-suggested vs user-authored provenance · the model request built from that text · the persisted row |
>
> Recorded rather than quietly fixed, because the audit's own principle governs
> here: **reachability changes severity; it does not erase a latent
> architectural hazard.** Same distinction already drawn between
> `P0-SCIENCE-06` (live/paid) and `P0-SCIENCE-07` (latent).

Rendered on the live dashboard, under the heading *"It knows your Food System.
Ask it anything."*:

> **"Why is my probiotic level my weakest, and what foods would help this
> week?"**

It is **not** the member's question. It is product-authored copy built from
`twin.biotics.weakest`, and it asserts, in the member's voice, that they have a
probiotic *level* and that it is their weakest.

### The part that makes it a trust defect rather than a copy defect

The chip is a link to `/account/consult?q=<the sentence>`, and the consult client
does this on mount:

```ts
// consult-client.tsx:219-225 — comment verbatim
// Auto-send ?q= pre-filled question on mount
const q = searchParams.get("q")
if (q && !autoSentRef.current) { autoSentRef.current = true; void sendMessage(decodeURIComponent(q)) }
```

**Auto-send.** The member never sees the sentence in an input box and never gets
to edit it. One tap sends the prohibited premise to Claude as their own first
message, and the model answers *on that premise* — generating further
customer-facing prose grounded in a claim the product is not entitled to make.

This is claim-laundering through a query parameter: a prohibited assertion
becomes AI input, and the AI's output becomes new product language. It is
precisely the failure mode the Gate 6 Intelligence boundary exists to prevent,
occurring **outside** that boundary, on a live surface, via `/api/consult`
rather than `/api/fss/focus-today`.

### Classification

| | |
|---|---|
| Kind | **trust + scientific debt**, and an **AI-governance** defect |
| Reachability | **live** on `/account` for any member with a Twin |
| Disposition | **RETIRE the prompt.** The two other chips (the next action, the last meal) are clean and may stay |
| Close criterion | not merely the sentence removed — the `?q=` auto-send path must not be able to carry a claim no deterministic component made |

### 0R-3 outcome

**The chain, traced layer by layer before any code moved.** Nine layers carried
one undifferentiated `Message[]`; **two** changed authorship and **seven** could
not tell.

| | layer | authorship |
|---|---|---|
| 1-2 | `ask-twin.tsx:20,47` — the premise, then the URL | creates it |
| **3** | `consult-client.tsx:218-225` — `searchParams.get("q")` → `sendMessage(…)` on mount | **the silent transformation** |
| **4** | `consult-client.tsx:263` — `{ role: "user", content }` | **stamps it as member speech** |
| 5-7 | POST → zod schema → `anthropic.messages.stream` | no field to tell |
| 8 | the summary call over `...body.messages` | summarised as the member's |
| 9 | `consultations.messages` | **stored as the member's words** |

**One thing the architecture already had right, and 0R-3 did not disturb it.**
`buildMemberProfile` (`app/api/consult/route.ts:124-174`) passes deterministic
product fact as **separate system context**, and that route's prompt already
forbids the model from quoting an internal dimension name back to a member. The
third channel existed and was correct; only channels 1 and 2 were conflated.

**Six producer sites in five files — `?q=` was not the only one.**

| producer | reachability | disposition |
|---|---|---|
| `ask-twin.tsx:20` the Biotic premise | **LIVE** | **RETIRED** — prompt, `BIOTIC_NAME` and the `twin.biotics.weakest` read all deleted; the two clean chips kept; no replacement copy |
| `consult-client.tsx:218-225` the auto-send | LATENT | `?q=` now **prefills the draft only** |
| `consult-client.tsx:472` a starter chip calling `sendMessage` | LATENT | **drafts** and focuses the input |
| `consult-client.tsx:457-458` *"Your {weakestPillarLabel} score is your biggest opportunity right now"* | LATENT | **DELETED** — a personal weakest-score verdict in the **consultant's** voice, before the model had spoken, labelling `adding` as **"Live Foods"** (vocabulary retired in Tranche 2B), and contradicting this route's own system prompt. **A fourth inversion this entry never named.** |
| `consult-client.tsx:44-48` three of four `STARTER_QUESTIONS` asserting a personal premise | LATENT | **DELETED** — see below |
| `components/eatobiotic/text-chat.tsx:157` `onClick={() => send(chip)}` | LATENT (`/eatobiotic` is POST_V1) | **drafts** — *a fifth file, found by tracing the class rather than the instance* |

`app/account/consult/deep-dive/page.tsx:41` is a sixth `?q=` producer and is now
harmless by construction, since `?q=` can only draft. Its `&deepdive=<id>`
parameter is **written and read nowhere** — a dead parameter, recorded not
removed.

**Why three starter questions were deleted rather than reworded.** Prefill-only
semantics materially reduce the defect — the member reads and edits a draft
instead of silently sending it — but they do **not** cure a suggestion that
asserts something. *"I have IBS"*, *"Why is my Adding score so low"* and *"My
energy is low in the afternoons"* each had the product authoring an assertion it
was proposing the member make. The permanent rule has no prefill exemption. One
non-asserting question survives; **one chip is a thin set, and that is recorded
as an editorial gap for the Experience work rather than closed here with new
copy.**

**The repair is structural, not a field.** A suggestion can reach only
`setInput`; a sender can be called only with the member's draft. So
"product-authored text becomes a user message" is not a mistake a validator has
to catch — there is no path by which it can arrive. **No authorship field was
added** to the message type, the schema, the API or the stored rows.

> **Historical provenance cannot be recovered, and was not invented.** Rows
> already in `consultations.messages` are structurally ambiguous, because the
> old schema never preserved which messages the member authored. 0R-3 does
> **not** backfill a provenance field onto them. If a future consultation
> redesign needs explicit provenance in storage, that is a separate capability
> and schema decision.

### Why nothing caught this — two documented guard gaps, co-occurring

The one live sentence sat in the intersection of both failure modes this
programme has recorded.

1. **Corpus gap.** `components/account/twin/ask-twin.tsx` was in **no corpus at
   all** — not `ACCOUNT_SURFACES`, not any tranche, not `EXPOSED_AT_0R1`, not
   `KNOWN_UNCORRECTED`. 0R-1 widened coverage by 33 files and this was not one
   of them. *Closed: the file is now in `ACCOUNT_SURFACES`.*
2. **Interpolation gap.** Even inside the corpus a scan would have missed it:
   `` `my ${BIOTIC_NAME[twin.biotics.weakest]} level my weakest` `` puts **no
   Biotic word in the file**. Exactly what CLAUDE.md records — *"a source scan
   of the whole corpus catches 1 of 9 interpolated claims"*. *Closed by the
   behavioural guard: `tests/unit/agent-loop-claims.test.ts` now CALLS
   `buildPrompts` over all three `weakest` values and reads what comes back.*

**The red state, measured by calling the generator** — three failures, one per
Biotic, each quoting the real sentence a member was offered. Stronger evidence
than a screenshot, which shows one variant.

### Guards and proof

| | |
|---|---|
| behavioural | `agent-loop-claims.test.ts` — `buildPrompts` over all three `weakest` values, `assertClean`, non-vacuity both ways |
| authorship | `tests/unit/ai-authorship.test.ts` — a sender may be called only with the draft (or no argument); **no effect** may send; a search param may reach only `setInput`; product context never folded into authored text |
| coverage | `ask-twin.tsx` added to `ACCOUNT_SURFACES` — neutral, as expected |
| sabotage | `cases_0r.py` **1467-1473**, 7/7 caught |
| rendered | `audit-capture.spec.ts` — `twin-present` carries no personal-Biotic suggestion and no chip URL carries a Biotic word |
| latent, labelled | both consult routes re-verified **404**; **no reachability was manufactured to exercise the refused architecture** |

### The audit corpus is deliberately NOT updated to the repaired state

A judgement call, recorded because it looks like an omission and is not.

Re-running the capture harness after the repair changes
`account-twin-present-overview-390.png` **from 10359 to 10268 pixels tall** —
91px shorter, which is exactly the retired chip's row. That is a material
content change, unlike the `NOTE-CAPTURE-01` residual measured alongside it on
an untouched state (`account-representative-overview-390.png`, **0.042% of
bytes**, the 390 tab strip's resting scroll position).

**The frozen corpus is the BEFORE evidence, and this entry cites it.**
Overwriting those images would destroy the only pictures that show the defect,
leaving a register that points at screenshots of a repaired product. So
`docs/experience/audit/` stays at its Experience 0 state, and the **after**
state is proved behaviourally instead — by the permanent assertion in
`audit-capture.spec.ts`, which travels with the suite and re-proves itself on
every run rather than being a byte somebody has to trust.

**Two defects in the new guard, found by the guard failing and recorded rather
than smoothed over.** `report-client.tsx`'s sender takes **no argument** and
reads the draft from closure — a stronger form of the same property, which the
first rule wrongly refused. And the param rule, written over the whole file,
reported that `q` *"flows into map"* because `STARTER_QUESTIONS.map((q) => …)`
names its callback `q` too — a name collision, not a flow. Both fixed before the
suite ran. A third hole the author could see was closed the same way: the
effect rule was widened from mount-only to **every** effect, because
`useEffect(() => sendMessage(input), [input])` passes the draft rule and would
fire a request on every keystroke. **Sabotage 1471 is that exact shape.**

> **`app/account/report/[id]/report-client.tsx` already did it right** — a
> suggestion there has always called `setInput`. It is kept in the guard's
> corpus as a surface that must stay correct, and doubles as the known-clean
> control that proves the rules are not unsatisfiable.

### Out of 0R-3's scope, recorded

**The live `/account` suggestion chips link to a refused route.** That is a
`P1-FUNNEL-01`-class defect — a correctly refused destination presented as an
available action — on a surface the link crawler does not cover (`CRAWLED` in
`tests/e2e/v1-launch-surface.spec.ts:181` is nine routes and `/account` is not
among them). **Left to 0R-8**, which owns the crawler and the destination
question, deliberately:

> 0R-3 asks *"if this capability exists, is authorship and premise handling
> safe?"* · 0R-8 asks *"should this destination be presented as available at
> all?"* These are not the same question and are not conflated.

**Derived at close, because the first draft of this line was wrong.** It said
*"the three chips"*, which was the **pre-repair** count — the Biotic premise plus
the two clean chips — carried into a post-repair sentence. There is no third
chip. The real numbers, read from source and confirmed by render:

| | |
|---|---|
| `buildPrompts` after 0R-3 | **1 or 2** suggestions, never 3. The next-action chip is conditional on `twin.nextBestAction`; the last-meal chip always fires, via its `else` fallback. `slice(0, 3)` is now a no-op |
| rendered on the `twin-present` fixture | **2** chips — *"What's the easiest way to fit this in: …"* and *"How could I make … even better for my Food System?"* |
| rendered on **every other** fixture state (`representative` · `sparse` · `first-use-member` · `returning-no-meals-today` · `dense`) | **0** — `AskTwin` sits behind `live-dashboard.tsx:1095`'s `twin && twinVisual` gate, so the section exists only for a member who has a Twin |
| other `/account/consult` affordances on live `/account` | **0** — measured as zero bare `href="/account/consult"` links in every state |

So the complete live inventory is **two affordances, both of them `AskTwin`
chips, in one component** — `components/account/twin/ask-twin.tsx`, mounted once
at `components/account/live-dashboard.tsx:1154`. Every other
`/account/consult` reference in the repository is either a default parameter or
sits on a POST_V1-refused surface (`/account-you`, `/demo/account/[tier]`,
`/demo/account/consult`, `/account/consult/deep-dive` itself).

**One live dead destination that is NOT an `/account` affordance, found during
this reconciliation.** `lib/email/paid-onboarding-email.ts:96` renders
*"Start a consultation →"* linking to `${SITE_URL}/account/consult` in a **live
lifecycle email**. It is outside the `/account` surface and outside any link
crawler, so nothing would ever have caught it. Recorded here and **added to
0R-8's scope**, which owns dead destinations.

---

## `P0-SCIENCE-05` · The daily ritual asserts a bodily reaction to a checkbox

**Surface** `/account` (Overview) · **Component**
`components/account/twin/daily-ritual.tsx:111` + `lib/account/ritual.ts:36-49`
· **Verified** by render, 2026-10-04

The section heading, rendered:

> **"Tap what's true today. Your body reacts to each one."**

and on completion, *"A full day — your Food System felt all of it."*

Behind it, each of the five checks carries an asserted mechanism **and a pair of
anatomical coordinates**:

```ts
{ key: "fermented", effect: "A fermented food lights up your probiotic network", node: { x: 54, y: 56 } }
{ key: "plants",    effect: "Plant variety expands your fibre pathways",         node: { x: 47, y: 62 } }
{ key: "moved",     effect: "Movement helps energy flow and recovery brighten",  node: { x: 48, y: 46 } }
{ key: "slept",     effect: "Deep rest is when your system recovers and rebuilds", node: { x: 48, y: 30 } }
{ key: "feeling",   effect: "How you feel is your system talking back to you",   node: { x: 50, y: 20 } }
```

`ritualSignals()` feeds those nodes to `TwinStage` as `signals`, which lights
them on the figure.

### The tapped state, proved by render

The five checks render unexpanded on page load, so the first capture showed only
the buttons. Tapping one is a pure `localStorage` toggle, so it was rendered —
with the write-watcher attached, which recorded **no write of any kind**. What
appears is the complete chain, not half of it:

> *[a miniature body figure, with a dot pinging at `x:54 y:56` — the gut]*
> **YOUR BODY JUST FELT THAT**
> **"A fermented food lights up your probiotic network"**
> *"Lovely — something fermented on its way to me."*

One tap on a checkbox produces: an anatomical light, an overline asserting the
member's body *felt* it, a sentence asserting a personal probiotic network was
activated, and the Twin claiming to have received the food.

**The complete chain is: a self-report checkbox → a light at a named position on
a picture of the member's body → a sentence asserting what that did to their
biology.** Nothing in the chain is measured. "Lights up your probiotic network"
is a personal probiotic state *and* a mechanism; "your body reacts to each one"
is a causal claim about a tap.

This is structurally identical to `forecast.tsx`'s `FORECAST_NODE` — which
CLAUDE.md already records as a reactivation hazard — except that `forecast.tsx`
is behind a refused route and **this is live**.

### Classification

| | |
|---|---|
| Kind | **scientific debt** — personal Biotic state, mechanism, causal attribution, anatomical localisation |
| Reachability | **live** on `/account` for any member with a Twin |
| Disposition | **REMEDIATE.** The ritual itself is good product — one-tap self-report with a visible streak. What goes is the asserted effect and the body-position mapping, not the checks |
| Note | **I first recorded that the `effect` strings were not rendered. That was wrong, and the render disproved it.** `daily-ritual.tsx:49-53` renders them |

---

## `P0-ARCH-01` · The audited `/account` is the minority `/account`

**Surface** `/account` · **Evidence** `app/account/page.tsx:278` · **Verified**
by source + render, 2026-10-04

```ts
if (twinScore != null || recentAnalyses.length > 0) { accountTwin = await buildAccountTwin({…}) }
```

`twinScore` is the member's free-assessment score. So **the Twin is built for any
member who has completed the assessment or logged one meal** — and the free
assessment is the only door into the product.

`live-dashboard.tsx:1094` gates the whole Twin experience on `twin && twinVisual`,
and inside that gate sit `TodayStrip`, `TwinStage`, `DailyRitual`, the learning
feed, `InsideYouTeaser`, `AskTwin`, `RetestCard` and `SystemsExplorer`.

**Every fixture state before `twin-present` passed `twin: null`.** The 75-image
account corpus committed at `496fa76` therefore records the dashboard as seen by
a member who has *never assessed and never logged* — a state almost no real
member occupies — and the five P0s found there sit **below** a Twin layer the
audit had not rendered.

### What this does and does not change

It does **not** withdraw any earlier finding: `P0-TRUST-01`, `P0-TRUST-02`,
`P0-SCIENCE-01/02/03` and `P0-TRUST-03` all reproduce in `twin-present` too —
they are below the Twin on the same page, and the `twin-present` capture shows
them there.

It changes the **weighting**: the Twin is the first screen of the real member
dashboard, so its three P0s above are not peripheral to the Account findings,
they are in front of them.

### Classification

| | |
|---|---|
| Kind | **product architecture / audit coverage** |
| Disposition | **RECORD.** No repair — the gate is correct behaviour. What was wrong was the audit's model of the default state |
| Consequence | `twin-present` is the representative member state for `/account`, and the remediation spec must sequence the Twin P0s with the Account P0s, not after them |

---

## `P1-FUNNEL-02` · The Twin-gated dashboard offers five dead destinations

**Surface** `/account` (Overview, Twin present) · **Verified** by live HTTP,
2026-10-04

Inside the `twin && twinVisual` block:

| rendered as | destination | status |
|---|---|---|
| *"Watch how the Food System inside you works"* · **Play →** (`InsideYouTeaser`) | `/account/twin` | **404** |
| *"Open Stability ↗"* (`SystemsExplorer`) | `/stability` | **404** |
| *"Open Glucose ↗"* | `/glucose` | **404** |
| *"Open Mind ↗"* | `/mind` | **404** |
| *"Open Performance ↗"* | `/performance` | **404** |

All five verified by request against the preview server, not read from
`POST_V1_ROUTES`. The same grid correctly renders *"Coming soon"* — with no link
— for Recovery, Longevity, Pregnancy, Birth and Baby, which is the behaviour the
other five should have.

Separately, `live-dashboard.tsx:1899` renders **"Read your full plan →"** with
`href="#"`.

**The same shape as `P1-FUNNEL-01`, on a different surface, and the reason is
the one CLAUDE.md already records:** `v1-launch-surface.spec.ts`'s crawler does
not cover `/account`. It is also why this was invisible until now — the crawler
could not have reached the Twin block anyway, because no fixture supplied a Twin.

### Classification

| | |
|---|---|
| Kind | **experience / navigation promise** |
| Disposition | **REMEDIATE**, with `P1-FUNNEL-01`, under the same principle: *a correctly refused destination must not be presented as an available action* |
| Guard | the crawler must cover `/account` **in a Twin-present state** — covering the route alone would still miss all five |

## `P0-SCIENCE-06` · The production paid Report ranks the member's Biotic pathways

**Surface** `/assessment/report` (`V1_CORE` — the €49 product) · **Verified** by
source chain, 2026-10-04 · **Reachability: LIVE, for any paying customer**

```
lib/report/build-food-system-report.ts:457-469   composes `dominantPattern`
  → systemSnapshot.dominantPattern               (:513)
  → components/report/food-system-section.tsx:398  renders it
  → PaidReportClient                             renders FoodSystemSection
  → /assessment/report                           settled Stripe session
```

> *"Your answers describe an uneven system — **Prebiotics is well supported while
> Probiotics is thinner**."*

> *"Your answers suggest **Prebiotics is your strongest pathway**, and that
> **Probiotics is where your answers point to the clearest first step**."*

`PATHWAY_LABEL` (`lib/report/subscores.ts:52`) maps the keys directly to the
customer-facing words, and `paid-report-client.tsx:681` passes
`PATHWAY_LABEL[priorityPathway]` into the membership CTA as well.
`lib/fallback-paid-report.ts` reads the same ranking and is, in its own words,
*"what a paying customer actually receives"* when generation fails.

### Why this is D1's third surface

The construct is **identical** to the one D1 ruled must be retired from
`/assessment/results` — a personalised comparative Biotic verdict, with no number
shown. D1's step 1 widens the claims corpus to `ASSESSMENT_SURFACES`; **that
alone will not reach this file.** See `P0-GUARD-02`.

### Classification

| | |
|---|---|
| Kind | **scientific debt** — personal Biotic state, comparative verdict |
| Reachability | **live on the money path** |
| Evidence | **source**, pinned by `tests/e2e/audit-capture-reports.spec.ts`. Rendering it needs a `DeepReport` from Supabase, which this audit will not read or fabricate |
| Disposition | **RETIRE the ranking**, with D1, in the same repair |

---

## `P0-SCIENCE-07` · The dev-flow Report renders three per-Biotic scores out of 100
### **P0 — LATENT PRODUCTION HAZARD · NOT currently customer-reachable**

**Surface** `/assessment/report` under the unverified dev flow ·
**Component** `components/assessment/full-report-client.tsx` · **Verified** by
render, 2026-10-04 · **Reachability: NOT production-reachable**

Rendered, under **"PILLAR BREAKDOWN · Your Pillar Deep-Dives"**:

> **Probiotics 33/100** · **Prebiotics 50/100** · **Postbiotics 61/100**
>
> *"**Your probiotics score** has clear room to grow — the food recommendations
> below are your most direct lever."* — and the same sentence for the other two.

Plus *"Starting with your areas of greatest opportunity"* and *"Simple
substitutions targeted at **your weakest pillar**"*.

A personal per-Biotic **number**, a **denominator**, and a **possessive**, three
times. Three of the forms the permanent product rule names, in one block.

### Reachability, stated precisely

`FullReportClient` is rendered by `app/assessment/report/page.tsx:45` **only**
when `isUnverifiedPaidFlowAllowed()`, and by `/assessment/demo`, which is
`POST_V1` and 404s. **No customer can reach it today**, and the page's own
comment at `:128` refuses to fall back to it for a buyer whose Supabase read
fails.

### Why it is still P0

It sits on the €49 route, one environment variable from being served — the
`menu-scan` / `forecast` reactivation-hazard class, on the money path. It was
rendered rather than read because this is the component the audit's harness can
actually reach, and because the register has twice been wrong about a claim it
only read.

### Held distinct from `P0-SCIENCE-06`, deliberately

| | finding | evidence status |
|---|---|---|
| | **`P0-SCIENCE-06`** | **live · paid · customer-reachable** — demonstrably being sold |
| | **`P0-SCIENCE-07`** | **latent · dev fallback · near-production hazard** — no customer can reach it today |

Both require 0R treatment. Collapsing them into one severity would be easier to
write and would destroy the distinction the whole audit has been built on:

> **Reachability changes what we can claim about current customer harm.**

The severity stays P0 because the hazard is real and adjacent to money. The
*claim about customers* stays accurate because the reachability is stated.

| | |
|---|---|
| Disposition | **RETIRE the pillar breakdown.** The deep-dive guidance can survive without a score, as `BioticsProgressPanel` already does |

---

## `P0-SCIENCE-08` · Mechanistic microbiological claims in customer-facing food copy

**Surface** the food list and swaps · **Verified** by render (dev flow), 2026-10-04
· **Reachability: the food-tool data is shared with the production path**

> *"Top fibre and resistant starch source — **maximises short-chain fatty acid
> production**."* · *"**Hundreds of millions of live bacteria per gram; direct
> seeding of the microbiome**."* · *"Inulin-rich prebiotic that **selectively
> feeds the most beneficial gut bacteria**."* · *"**Flavanols feed Lactobacillus
> and Bifidobacterium**."* · *"glutamate **supports gut barrier directly**."* ·
> *"Within 30 minutes is close enough to **stabilise your gut rhythm**."*

Named genera, quantified microbial loads, asserted metabolite production, and a
bodily outcome from meal timing.

**A different class from `P0-SCIENCE-06/07`:** these are general food claims, not
claims about this person's state. But they are markedly stronger than the
*"associated with" / "typically"* register the Twin's education uses and than
`/biotics` was corrected to in Gate 3.7 — and the permanent product rule's second
clause is *teach the biology accurately*, not *teach it confidently*.

| | |
|---|---|
| Disposition | **EVOLVE, pending scientific review.** Not rewritten here — the audit does not approve wording |

---

## `P1-VOCAB-01` · "Heal" renders as a customer-facing pathway tag

**Surface** the food list · **Verified** by render, 2026-10-04

Every food carries two of **Feed · Seed · Heal**. CLAUDE.md: *"'Heal' is a stored
key, never a customer-facing pathway name."* The customer-facing third action is
**Rejuvenate**. `lib/report/addon-lens.ts:12` confirms the keys travel through
the production lens chapter too.

A rendering defect rather than a claims one, and the cheapest fix in this step.

---

## `P0-GUARD-02` · No report file is in the Biotic claims corpus

**Surface** the test corpus · **Verified** by source, 2026-10-04

`GUARDED_SURFACES` (`tests/unit/biotic-claims.test.ts:313`) is
`LIVE + REACHABLE + PROMPT + EMAIL + CANDIDATE + AGENT_LOOP`. **No report
component or generator appears in any of the six.**

The same shape as `P0-GUARD-01` (Account) and the Assessment gap found in step 5
— the guard exists, works, and points elsewhere. **Third instance, and the first
on a product that is sold.**

> D1's step 1 widens the corpus to `ASSESSMENT_SURFACES`. On its own that lands
> the ruling on two of the three surfaces carrying the construct. **The widening
> must include the report family**, or `P0-SCIENCE-06` survives the repair that
> was meant to end it.

---

## `P2-REPORT-01` · The canonical Report currently says one sentence six times

**Surface** `/demo/food-system-report` · **Verified** by render, 2026-10-04 ·
**Reachability: preview only — nothing is wired to it**

The whole document at 1280 is **2,465px and 18 distinct content lines**, of which
one appears **six times**:

> *"You told us energy is what you most want to work on."*

Once under "What you told us", once under "WHERE TO START", and once in each of
the four weeks of "Your next 30 days" — Try, Notice, Adjust, Repeat.

**Structural, not a thin fixture.** `lib/report/deterministic/compose.ts:362-392`
builds all four loop steps from the same `choice.questionId` and `choice.value`,
varying only the beat, and resolves the reviewed sentence from the pack each
time. With `bioticsLanguage` and `specificFoods` withheld, that sentence is
nearly all the content available.

### This is the architecture working, not failing

Every sentence is reviewed, bound and provable. The pack holds one sentence per
answer. The honest conclusion is that the candidate Report **can prove everything
it says and is not yet worth €49** — and that the gap is a content pack, not an
architecture.

**The gates withholding the rest are professional reviews, not switches.**
`lib/report/deterministic/capabilities.ts` reads them from `SPECIALIST_GATES` in
the frozen Science Contract and names what each waits on — `specificFoods` a
dietitian and an EU allergen taxonomy, **`bioticsLanguage` Irish/EU health-claims
law**, `safetyNetting` GP/dietetic sign-off. All three are OPEN, and
`reportCapabilityEnabled` takes no parameters *"by construction"*, so nothing in
the codebase can open one.

Set beside `P0-SCIENCE-06`: the legacy Report names the Biotics freely on the
money path, while the canonical Report withholds the same vocabulary pending a
health-claims review. **Those two facts are hard to hold at once**, and the
register records them together rather than in separate entries.

| | |
|---|---|
| Kind | **readiness**, not claims and not live |
| Disposition | **RECORD.** It belongs beside the `constraints-known` pre-activation blocker in CLAUDE.md, which this audit neither discharges nor weakens |

## `P0-SCIENCE-09` · Category-equivalence claims on Account and Report

**Surfaces** `/account`, `/account-you`, the Report family · **Verified** by the
widened claims corpus, 2026-10-05 · **Reachability: LIVE**

**Found by Experience 0R-1, not by Experience 0.** The audit swept for personal
Biotic *state* and found sixteen P0s. It did not sweep Account and Report for
**category equivalence** — the class Tranche 2B repaired on the marketing pages
and never reached these surfaces, because these surfaces were not in the corpus.

Nine findings across eight files:

| file | claim |
|---|---|
| `components/account/day8-challenge-card.tsx` | *"Live Foods"* as a product category |
| `components/account/goal-progress-card.tsx` | *"Live Foods"*, and *"live cultures"* asserted of food |
| `components/account/welcome-screen.tsx` | *"live foods"*, and *"prebiotic-rich"* as a food classification |
| `components/account/seven-day-guide.tsx` | *"colonise"* — colonisation claimed |
| `components/account/dashboard-client-data.ts` | *"live cultures"* asserted of food |
| `components/report/demo-report.tsx` | *"Live Cultures"* |
| `lib/fallback-paid-report.ts` | *"live food"*, and *"live or fermented food"* as a category |
| `lib/report/addon-lens.ts` | *"Live foods"*, and *"Live-culture"* |

Against *do not treat fermented foods as automatically probiotic* and *do not
treat all fibre as prebiotic* — two of the standing prohibitions, on live
surfaces, for the whole of Experience 0 without anyone seeing them.

### Why this is the strongest evidence for D7

The claims existed. The rules existed. The rules had been written specifically
for this class and proven against it on other pages. **Only the corpus
membership was missing**, and nothing in the repository could say so.

| | |
|---|---|
| Disposition | **REMEDIATE** with the surfaces they sit on — 0R-5 for Account, 0R-6 for Report |
| Held as | `EXPOSED_AT_0R1` in `tests/unit/biotic-claims.test.ts`, shrink-only |

---

## `P0-SCIENCE-10` · A personal Biotic claim inside the scoring engine

**Surface** `lib/assessment-scoring.ts:152`, reachable from
`/assessment/results` (`V1_CORE`) · **Verified** by the derived ledger, 2026-10-05
· **Reachability: LIVE**

**Found by Experience 0R-2**, when the derived reachability ledger began running
`PERSONAL_BIOTIC_STATE` as well as the two category rule sets.

> *"Your answers suggest care around food, **reflected in your Prebiotics and
> Probiotics scores**, with rhythm and recovery thinner…"*

A personal per-Biotic claim in the module that **computes the free assessment's
score** — not in a component, in the engine.

### The mistake it exposes, which has a name in this repository

The audit read the result **components** and never the module that computes what
they render. That is verbatim the failure Gate 3.6 recorded as *"the guard read
the importer and not the imported module"*, and the reason `AGENT_LOOP_SURFACES`
exists at all.

It is also why D7 asked for **derivation** rather than another list: no amount of
care in writing `ASSESSMENT_SURFACES` would have included a scoring module,
because nobody thinks of a scoring module as a copy surface. **It is one.**

| | |
|---|---|
| Disposition | **REMEDIATE** at 0R-7, with the Assessment ruling |
| Held as | `KNOWN_UNCORRECTED` in the derived ledger, shrink-only |

---

## Register status

**26 entries — 18 P0 · 3 P1 · 2 P2 · 3 notes.** Two P0s were added by Experience 0R-1 and 0R-2 — `P0-SCIENCE-09` and `P0-SCIENCE-10`, both found by the widened and derived guards rather than by the audit, which is what those stages exist to do. Plus `RESP-ACCOUNT-01`, named
inside `NOTE-CAPTURE-01` and deliberately not entered separately.

| id | severity | surface | verified | disposition |
|---|---|---|---|---|
| `P0-TRUST-01` | P0 | `/account` Overview + Meals | render ×4 | **CLOSED at 0R-4** — all four live MOCK_MEALS sites |
| `P0-TRUST-02` | P0 | `/account` Overview + Consultations | render ×3 | **CLOSED at 0R-4** — one finding, three sites; absorbed `P0-SCIENCE-02` |
| `P0-SCIENCE-01` | P0 | `/account` | render | RETIRE / REMEDIATE |
| `P0-SCIENCE-02` | P0 | `/account` | render | RETIRE |
| `P0-SCIENCE-03` | P0 | `/account` | render | RETIRE / REMEDIATE — **two repairs**; `:1757` extracted |
| `P0-TRUST-03` | **P0-TRUST / P0-SCIENCE** | `/account` | render + source | **CLOSED at 0R-4** — block retired; absorbed `P0-SCIENCE-03` at `:1757` only |
| `P0-TRUST-04` | P0 | `/assessment/you` → Results | render + source | REMEDIATE — mirror the existing guard |
| `P1-FUNNEL-01` | P1 | `/assessment/you` → Results | live HTTP | REMEDIATE — four dead CTAs |
| `P0-SCIENCE-04` | P0 | `/account` Twin | render | RETIRE — **a Biotic verdict rendered as colour**; no string guard can see it |
| `P0-TRUST-05` | **P0-TRUST / AI-governance** | **live premise** on `/account` Twin · **latent** architecture behind POST_V1-refused `/account/consult` | render (live) + source (latent) | **CLOSED at 0R-3** — premise retired, authorship made structural |
| `P0-SCIENCE-05` | P0 | `/account` Twin | render | REMEDIATE — keep the ritual, drop the asserted biology |
| `P0-ARCH-01` | P0 (coverage) | `/account` | source + render | RECORD — the audited state was the minority state |
| `P1-FUNNEL-02` | P1 | `/account` Twin | live HTTP | REMEDIATE with `P1-FUNNEL-01` |
| `P0-SCIENCE-06` | **P0 live** | `/assessment/report` **€49** | source chain | RETIRE — **live · paid · customer-reachable**, with D1 |
| `P0-SCIENCE-07` | **P0 latent** | `/assessment/report` dev flow | render | RETIRE — **latent production hazard, NOT customer-reachable** |
| `P0-SCIENCE-08` | P0 | report food copy | render | EVOLVE — pending scientific review |
| `P1-VOCAB-01` | P1 | report food tags | render | REMEDIATE — "Heal" is not customer-facing |
| `P0-GUARD-02` | P0 | test corpus | source | **WIDEN WITH D1** — or `P0-SCIENCE-06` survives the repair |
| `P2-REPORT-01` | P2 | `/demo/food-system-report` | render | RECORD — readiness, preview only |
| `P0-SCIENCE-09` | **P0 live** | `/account` · Report | widened corpus | REMEDIATE — **found by 0R-1**, nine category-equivalence claims |
| `P0-SCIENCE-10` | **P0 live** | `lib/assessment-scoring.ts` | derived ledger | REMEDIATE — **found by 0R-2**, a claim inside the scoring engine |
| `P0-GUARD-01` | P0 | test corpus | source | REPAIR FIRST, in remediation |
| `P2-FSS-ARCH-01` | P2 | My Food System → Biotics | source closure | RECORD + PROVE, no refactor |
| `DEBT-CODE-01` | DEBT-CODE | `/account` | render (disproved as P0) | RETIRE with generation |
| `NOTE-FIXTURE-01` | — | audit tooling | render (disproved my own claim) | documentation only |
| `NOTE-CAPTURE-01` | — | audit tooling | measured over two runs | documentation only |

Open as Experience 0 continues. Entries are added as surfaces are captured;
**nothing here is repaired during the audit.**

### What the five `/account` P0s have in common

They are not five faults. They are **one architecture**: the Overview tab
presents the member's Three Biotics as a measured personal profile — ringed,
numbered, banded, ranked, explained causally, and projected forward — and falls
back to invented constants when the data to support it is absent.

`P0-GUARD-01` is why none of it was caught: the guard written to forbid exactly
this was never pointed at the file. That ordering matters for the remediation
sequence — **repair the corpus first**, let it go red, and let the red list
define the UI work rather than the other way round.

### What the two added fixture states settled

Both were added because every earlier state passed no `biotics` and no
`weeklyReport`, so two findings had only ever been seen in their fallback form.

1. **The Biotics Profile is wrong with real data too.** Genuine values render
   the identical construct, so `P0-SCIENCE-02` does not go away when
   `P0-TRUST-02` is fixed.
2. **The prediction is fallback-only, but the other two claims are not.** A real
   report displaces `:1843`; `:1896` and `:1757` render regardless.
3. **`:1757` can be false, not just unpermitted.** It names Probiotic
   unconditionally while its own comment claims it is "lowest pillar driven",
   and the block never reads `displayBiotics`.

Point 3 is the one that changes a severity rather than a detail: a product
telling a member something untrue about themselves is a different category from
a product telling them something it has not earned the right to say.

---

## Canonical programme decisions

Rulings taken by the founder during Experience 0. **Recorded here, implemented
in Experience 0R — not in the audit.**

### D1 · The Biotics claims conflict — the permanent rule wins

`Appears strongest` / `Most worth exploring` on `/assessment/results` are **not**
an exception to `PERSONAL_BIOTIC_STATE`. A personalised comparative Biotic
verdict is a personal Biotic state whether or not a number is shown.

The 0R sequence, in order:

1. widen the Biotic claims corpus to include `ASSESSMENT_SURFACES`;
2. **deliberately observe the resulting red tests**;
3. remove or remediate the conflicting personal Biotic ranking;
4. revise `assessment-result-narrative.test.ts:287` — **not** the permanent rule;
5. return both claims and narrative suites to green;
6. add sabotage proving Assessment cannot silently fall out of the corpus again.

> **Do not weaken `PERSONAL_BIOTIC_STATE` to make the two tests coexist.**

`P0-SCIENCE-04` extends the same ruling to a non-textual rendering: widening the
corpus will not catch a gradient, so step 1 does not discharge it.

**Step 7 found the ruling's third surface, and it is the one that is sold.**
`P0-SCIENCE-06` puts the identical construct on `/assessment/report`, the €49
product. So step 1 reads:

> widen the Biotic claims corpus to include `ASSESSMENT_SURFACES`
> **and the report family** (`P0-GUARD-02`).

Widening to Assessment alone would land the ruling on two of the three surfaces
carrying the construct and leave it intact on the paid one — the repair would
look complete and would not be.

### D2 · `P0-TRUST-04` keeps both layers

| | |
|---|---|
| implementation defect | `strongest.strength ?? strongest.opportunity` can contradict its own heading |
| **product defect** | the personalised strongest/exploring construct itself conflicts with the locked architecture |

0R must not repair the conditional and preserve the prohibited construct.

### D3 · `P1-FUNNEL-01` gains two requirements and a permanent principle

**Product fix** — unavailable `POST_V1` add-ons must not be offered as
actionable next steps. **Guard fix** — the link crawler must cover the
**Results** surface, not merely the assessment entry route; `P1-FUNNEL-02` adds
`/account` in a Twin-present state.

> **A correctly refused destination must not be presented by the product as an
> available action.** The classifier protects the destination; something must
> protect the promise.

### D4 · The handoff is an instrument change before it is an interface change

Future journey, recorded **as hypothesis**:

```
Assessment → concise reveal → collect/complete establishment inputs
           → establish My Food System → Today
```

**Do not manufacture What You Notice or Food Context, and do not infer them from
scored answers.**

> **Do not make the interface promise a personal conclusion that the instrument
> did not collect enough information to derive.**

### D5 · Generation 3 does not justify a parallel product architecture

Accepted on the step-6 evidence:

> **Generation 3 contains useful interaction ideas, but it does not justify a
> parallel persistent product architecture beside My Food System.** Its most
> valuable surviving job is the daily habit loop, and even that does not require
> a Digital Twin.

The dispositions are agreed as recorded in
[`EATOBIOTICS_DIGITAL_TWIN_AUDIT.md`](./EATOBIOTICS_DIGITAL_TWIN_AUDIT.md) §4 —
daily ritual → Today · evolution and history → Progress · learning feed →
Progress / Learn · after-meal education → Learn · the body figure as **claimed
personal state** → Retire · the body figure as **non-personal illustration** →
potentially Evolve.

> That is what Keep / Move / Retire is for: preserve the value without
> preserving the architecture that happened to contain it.

**The moves are not implemented during Experience 0.**

### D6 · Two further principles accepted as permanent

Both recorded in the Experience Constitution, §2 and §3; the evidence stays in
`P0-SCIENCE-04`, `P0-SCIENCE-05` and `P0-TRUST-05` above.

> A claim is still a claim when it is encoded through colour, motion, anatomy,
> position, scale or another visual state rather than words.

> The product must never place a product-authored personal conclusion into the
> user's mouth.

The second carries a four-part 0R remediation, both sides of the boundary:

1. remove prohibited product-authored premises;
2. prevent query parameters and suggested prompts from silently becoming
   authenticated user assertions;
3. ensure consultation / AI context can distinguish **user-authored** text from
   **product-suggested** text where that distinction matters;
4. add a guard and a sabotage case around this exact path.

The first carries a consequence for how claims audits are built: a string
scanner can never catch every product claim while the interface communicates
status visually.

### D7 · 0R must seek canonical guard coverage, not another array

The same enforcement failure has now appeared **three times**:

| | surface | found in |
|---|---|---|
| 1 | **Account** existed outside the scan | `P0-GUARD-01`, step 2 |
| 2 | **Assessment** existed outside the scan | step 5 |
| 3 | **Report** existed outside the scan | `P0-GUARD-02`, step 7 |

Each was repaired by adding a surface to a list. **0R must not continue patching
them one at a time**, because the next surface will be found the same way.

The question 0R is required to ask:

> **What is the canonical set of all customer-facing surfaces capable of making
> Biotics claims?**

and derive guard coverage from that authority wherever possible. The eventual
invariant:

> **A customer-facing claims surface exists → it is inside the claims corpus by
> construction** — not because somebody remembered to add its path to one of six
> manually maintained arrays that can drift apart.

Two constraints on that work, from evidence already in this register:

- **`CANDIDATE_SURFACES` already does this**, via `candidateTree()` — a derived
  corpus rather than a typed list. It is the existing proof that the shape is
  achievable, and the place to start.
- **Derivation alone is insufficient.** `P0-SCIENCE-04` is a Biotic verdict
  encoded as a **colour**, with no string for any corpus to scan. A canonical
  surface set closes the *coverage* gap; it does not close the *form* gap, and
  0R must treat them as two requirements.

**Recorded as an architectural requirement. The implementation is not designed
here.**

---

Principles accepted as durable are carried into
[`EXPERIENCE_CONSTITUTION.md`](./EXPERIENCE_CONSTITUTION.md); the evidence stays
here.

---

## 0R-4 · SITE-LEVEL CLOSE RECORD

Reported at site level rather than finding-id level, so that no manifestation of
a multi-site finding is falsely marked closed.

### Entire findings closed

| | |
|---|---|
| `P0-TRUST-01` | all **four** live `MOCK_MEALS` manifestations |
| `P0-TRUST-02` | all **three** sites, canonicalised as one finding |
| `P0-TRUST-03` | the block retired whole |

### Individual manifestations of multi-site findings closed

| finding | manifestation | why it closed here |
|---|---|---|
| `P0-SCIENCE-02` | the three `displayBiotics` cards — numbers, rings, band words | its **only** consumers were the fabricated numbers; removing the source alone would have left them rendering real per-Biotic values |
| `P0-SCIENCE-03` | **`:1757` only** — the "lowest pillar" sentence | literally the same rendered sentence as `P0-TRUST-03` |
| `P0-SCIENCE-03` | **`:1885`** — the pull-quote | literally the same rendered sentence as `P0-TRUST-02` site 2 |
| *(the fused report-card construct)* | "Biotics this week" per-Biotic `ScoreBar`s | embedded in the fabricated cards; leaving them would make the card structurally capable of rendering a real personal per-Biotic state |

### Manifestations that remain for 0R-5 — explicitly NOT closed

| finding | what remains |
|---|---|
| `P0-SCIENCE-03` | **`:1896`** — *"Your Prebiotics have been strong but your Probiotics are pulling down your Biotics Score™"*, including its causal mechanism. Not shared with a trust finding |
| `P0-SCIENCE-01` | the first-use per-Biotic copy, and `MealCard`'s per-Biotic `ScoreBar`s |
| `P0-SCIENCE-02` | nothing — fully closed above |
| `P0-SCIENCE-04` · `-05` | the Twin's colour verdict and anatomical claims |

**Three per-Biotic `ScoreBar` triples survive in `live-dashboard.tsx`** — at
`MealCard`, the analysis result and the recent-analyses list. All three render
**real** meal data, none renders fabrication now that `MOCK_MEALS` reaches no
live path, and none is fused to a trust finding. They are `P0-SCIENCE-01`'s
class and remain 0R-5's. A guard written here that demanded them would have been
0R-4 quietly annexing 0R-5.

### The close condition, satisfied

0R-4 claims *"no fabricated member data remains on live `/account`"* only
because every materially distinct live tab was checked, with the tab set read
from source rather than assumed:

| tab | mock constants consumed |
|---|---|
| `overview` | none — `MOCK_MEALS` reaches only the unreachable `DEBT-CODE-01` branch |
| `meals` | none |
| `reports` | none |
| `consultations` | none — `MOCK_CONSULTATIONS` deleted |
| `account` | none |

A **new** tab fails `tests/unit/live-dashboard-fabrication.test.ts` until
somebody audits it, because the tab set is pinned: the close claim does not
silently extend to a surface nobody checked.

---

## 0R-5 · SITE-LEVEL CLOSE RECORD

> **Real data does not legitimise an invalid construct.** A personal Biotic
> score, ranking, biological-state visual, anatomical response or causal
> statement remains prohibited even when every underlying number is genuine.
>
> **Truthful inputs can still produce an untruthful product claim.**

Nothing 0R-5 removed was fabricated. That is what separates it from 0R-4, and it
is also why 0R-4 could not close any of it: a guard that refuses *invented*
member data passes every construct below.

### The trace found SEVEN live sites of `P0-SCIENCE-01`'s class. The register named three.

| # | site | in the Experience 0 register? | what rendered |
|---|---|---|---|
| 1 | `live-dashboard.tsx` · `MealCard` | **yes** (`P0-SCIENCE-01`) | three per-Biotic `ScoreBar`s from `meal.biotics` |
| 2 | `live-dashboard.tsx` · `FirstMealCelebration` | no | the same triple from `result.*_score`, on the activation moment |
| 3 | `live-dashboard.tsx` · logger result | no | the same triple from `r.*_score` |
| 4 | `components/account/daily-loop-card.tsx` | **no** | *"Today's focus · Probiotics (23/100)"* + a Biotic-coloured dot |
| 5 | `components/account/twin/twin-stage.tsx` · `BioticBar` | **no** | the Biotic **named**, the score as a **number**, a per-Biotic **colour**, and a **bar whose width is the score** — ungated, for every member with a Twin |
| 6 | `components/account/twin/quick-log.tsx` · `BIOTIC_META` | **no** | the same four forms on every QuickLog result |
| 7 | `lib/account/meal-impact.ts` | ledger only | a Biotic-named **row**, a score-derived **band word**, a possessive **mechanism** |

Plus one **latent**: `app/account/report/[id]/report-client.tsx:342-344`.
`lib/v1-surface.ts:360` classifies `/account/report/[id]` as `POST_V1`, so
`isServableInV1` is false and `proxy.ts:152` refuses it in every environment.
Recorded with its reachability and **not repaired** — the `P0-SCIENCE-07`
precedent.

**The 0R-4 close record above says "three per-Biotic `ScoreBar` triples survive".
That count was wrong: there were four, and the fourth is the latent one.** The
statement is corrected here rather than edited there, because the 0R-4 record is
what was measured at the time.

#### Why sites 4, 5 and 6 escaped two audits

| | |
|---|---|
| **site 4** | `PillarKey` is `"prebiotics" \| "probiotics" \| "postbiotics"`, so `t.pillars[focus.key]` printed a **Biotic**, not an observable domain — and the words were in an i18n dictionary, not in the component |
| **site 5** | `twin-stage.tsx` was **source-only** audited in Experience 0, because `/account/twin` is `POST_V1`. The component is mounted on live `/account` by `live-dashboard.tsx:1113`, so the audit read the right file in the wrong context. And `BIOTIC_NAME[biotic]` is a lookup table: a corpus scan sees `${BIOTIC_NAME[biotic]}` and no Biotic at all |
| **site 6** | `BIOTIC_META`'s labels are data, and its values arrive through `pick: (r) => r.probiotic_score` |

Sites 5 and 6 are the **ninth and tenth** instances of the interpolation
blindness this programme has now hit repeatedly, and the reason
`tests/unit/agent-loop-claims.test.ts` exists. Site 5 was found by widening
`biotic-visual-encoding.test.ts`'s sinks from colour to **extent** — which is
the promise that file's own header made in 0R-2 and did not implement.

#### How site 4 was reachable, and why that is familiar

`DailyLoopCard` renders under `!twin && dailyLoop`, and its focus needed
`bioticsProfile`. Those look mutually exclusive and are not:

| query | scope |
|---|---|
| `bioticsProfile` | the last **five** analyses, **no date window** |
| `recentAnalyses` | the last **seven days** |

A member whose most recent meal is eight days old and who never completed the
assessment has `twinScore == null` and `recentAnalyses.length === 0` — so no
Twin — and a non-null `bioticsProfile`. **Two queries over one table with
different filters, one of them feeding a render gate**: the identical asymmetry
that made `P0-TRUST-02` reachable in production, with a date window in place of
a null check.

### Entire findings closed

| finding | sites closed | evidence |
|---|---|---|
| `P0-SCIENCE-01` | **7 live** (the register's 3 + 4 it never named) | source pins + rendered proof per manifestation |
| `P0-SCIENCE-03` | the last site, `:1896` → `:1935-1958` | retired whole; see below |
| `P0-SCIENCE-04` | **2** — `twin-stage.tsx:284` (live) and `TwinVisualState.auraGradient` (computed, zero consumers) | rendered aura colour + a varied-Biotics unit proof |
| `P0-SCIENCE-05` | **4** — `ritual.ts` coordinates, the `twin-stage.tsx` `signals` prop contract, `daily-ritual.tsx`'s asserted response, and `meal-impact.ts`'s whole per-Biotic pipeline | rendered tick + behavioural assertions |

**`P0-SCIENCE-05` was broader than the sentence the register named**, and this is
recorded deliberately. The register named `ritual.ts`'s coordinates;
`biotic-claims.test.ts`'s derived ledger found the `effect` string beside them
and a second producer, `meal-impact.ts`, carrying the identical sentence.
Tracing those two ledger entries is what exposed `meal-impact.ts`'s band word,
its Biotic-named row, and its fermented-food-implies-probiotic inference — none
of which any register entry contained.

### `P0-SCIENCE-03:1896` — retired, not reworded

The "Monthly Focus" card, at `:1935-1958` after the 0R-4 repairs:

> *"Your Prebiotics have been strong but your Probiotics are pulling down your
> Biotics Score™. One fermented food daily for 30 days changes this."*

Four prohibited constructs in two sentences: two personal per-Biotic states, a
**causal mechanism** between them, and a 30-day outcome promise.

**Derivation: none.** `twin`, `displayBiotics` and every per-Biotic field appear
**zero times** in the block — the eyebrow, the heading, both sentences and the
link were all literals. Identical in shape to `P0-TRUST-03`, and retired for the
identical reason: there was no computation to correct and no member-specific
content to preserve. The member's genuine next action is derived by
`TwinNextAction` and is unaffected.

*Consequence, recorded rather than claimed as a repair:* the block's
`<Link href="#">` was one of the dead destinations inventoried for 0R-8 and goes
with the card.

### `lib/habit.ts` is deleted

Its entire exported surface was `focusPillar` — *"the weakest pillar, the one
with the most room to improve"* — and `dailyNudge`, which returned that pillar
with the member's score for it. `PillarKey` is a Biotic, so the module's only
job was a comparative personal Biotic verdict, and its only two callers rendered
it on `DailyLoopCard`. Removed rather than left unwired, on the
`MOCK_CONSULTATIONS` precedent: a dead construct is a re-wiring hazard, not
harmless. Asserted absent by a file-existence check, because a source pin cannot
read a file that should not be there.

### What a member can still see

The removal half of the close criterion is above; this is the other half, and it
is the part a repair can get wrong by over-reaching.

| kept | where |
|---|---|
| the meal's own Meal Biotics Score, as a ring and a number | `MealCard`, `FirstMealCelebration`, the logger result, `QuickLog` |
| Meal Quality — Diversity, Anti-inflammatory | the same cards, through the same shared `ScoreBar` |
| Nutrition Context, insight, tags | unchanged |
| the Food System Score, the delta since baseline, the 14-day meal-signal sparkline, the next best action | the Twin stage cockpit |
| the five ritual taps, the streak, the 7-day rhythm bar | `DailyRitual` — all genuine self-report |
| the observable meal-impact rows: fibre, plants, fats, protein, processing | `MealImpactChips` |
| general Three-Biotics education | `/biotics`, the framework cards, hotspot `what` copy — untouched |

The hotspot tint a member sees on **tapping** a hotspot is unchanged: the
colours are byte-identical, keyed now on a static `AuraTone` declared beside the
hotspot rather than on a `BioticKey`.

### Instrument defects 0R-5 found in its own guards

Recorded rather than smoothed over, as every tranche in this programme has done.

| # | defect | how it was found |
|---|---|---|
| 1 | `BIOTICS_ANY` matched the capitalised **plural** and lowercase either way, but **not the capitalised singular** — so *"Prebiotic fibre flows down to feed your microbes"*, the exact sentence shipped on live `/account`, walked through the behavioural guard. **Gate 3.7's case 1097 recorded this hole on the lowercase side and it stayed open on the other side for two more gates.** Now a character class, so there is no fourth variant to forget | sabotage 1504 |
| 2 | the widened per-Biotic-score rule missed the **plural property path** `twin.biotics.prebiotics.score` — the trailing `s` defeats the word boundary, and that is the exact path the worst live site used | its own non-vacuity case |
| 3 | the first `live-dashboard.tsx` pin flagged `MealEntry`, which is `MOCK_MEALS`' own type and 0R-9's. **The `BioticsProgressPanel` lesson from case 1080 repeated**: pin the signature, not the word. The rule was narrowed rather than the scope widened | first run of the pin |
| 4 | the non-vacuity case for the bar was a **single `style` line**, which carries no Biotic read at all — the signature and the call site were the other two thirds of the flow. Malformed case, corrected rather than the rule weakened | first run |
| 5 | **no non-vacuity subject isolated the extent sink.** Every subject also carried a colour word, so nulling the new sink broke nothing | sabotage 1506 |
| 6 | `quick-log.tsx` was repaired as site 6 and was **in no instrument at all**, so the case restoring its contract had nothing to fail against | writing sabotage 1493 |
| 7 | `MODULES_AT_0R5_CLOSE`, which replaced the deleted inventory, inherited the inventory's old weakness in a new shape: the test iterates the pin, so **emptying the pin makes it pass over zero entries** | sabotage 1462, repointed |

### A limitation of `EXPOSED_AT_0R1`, reported rather than worked around

`isExposedAt0R1(file, rule)` suspends a rule for a whole **file**, and
`live-dashboard.tsx` carried **two distinct defects under one rule**
(*"a Biotic claimed as a person's own"*): `MOCK_MEALS`' fabricated insight —
*"the kimchi lifts your probiotic score significantly"*, which is 0R-9's — and
the Monthly Focus sentence, which was 0R-5's. **Repairing one cannot be proved
through that ledger, because the other keeps the rule matching.**

The inventory already carries an `example` per entry and does not consult it.
Scoping the suspension to the matched text — over `matchAll`, not the first hit
— is the strengthening this wants. It is deliberately **not** done in 0R-5: it
changes the ledger's semantics for all nineteen entries. The one sentence 0R-5
owns is pinned in `NO_PERSONAL_BIOTIC_NUMBER` instead, where the proof is
unambiguous, and the strengthening is recorded here as the fix.

### A limitation of the sabotage harness, also reported

The assertion that `lib/habit.ts` does not exist **cannot be sabotaged**.
`tools/sabotage/run.py` mutates a find/replace inside an existing file; it
cannot create one, and `collectable()` refuses targets outside `tests/**`. A
case that pretended to restore the module would be testing the harness's own
plumbing. Recorded in `cases_0r.py` instead of engineered around.

### New debt recorded, not repaired

`components/account/live-dashboard.tsx` carries a **second** fabricated member
meal, as an **inline literal**:

```tsx
const r = liveResult ?? {
  meal_name: "Mackerel, kimchi & asparagus", biotics_score: 71,
  prebiotic_score: 72, probiotic_score: 18, postbiotic_score: 41,
  insight: "Your mackerel is delivering omega-3s…", …
}
```

0R-4's fabrication guard keys on the `MOCK_`/`DEMO_` **naming convention**, so
not one assertion in it could see this shape — which is how a complete
fabricated meal survived a tranche whose whole subject was fabricated meals.

**It appears structurally unreachable.** `loggerState` becomes `"result"` only at
`handleAnalyse`'s `setLiveResult(data); setLoggerState("result")`, and
`/api/analyse-meal:124` is the single 200 response, returning a non-null object
— so `liveResult` is never falsy while that branch renders.

It is still debt: an unreachable fabricated literal is one API change from being
a reachable one. Inventoried beside `DEBT-CODE-01`, shrink-only, cap equal to
list, reaching **zero at 0R-9**. The guard gap is closed now — the rule reads the
literal's **values**, so a zero-filled default (`?? { calories: 0, … }`) is
absence and a non-zero figure or non-empty string is content.

---

---

## 0R-6 · SITE-LEVEL CLOSE RECORD

> **An unsupported inference does not become acceptable because its output is
> hidden.** Internal state may organise the product; it may not secretly make a
> personal conclusion the product is forbidden to present.
>
> **One unsupported personal inference may have textual, behavioural and visual
> outputs; those outputs remain manifestations of the same construct.**

0R-6 owns the paid path. Two of its four findings are closed, one is traced and
queued for review, and one is **held with its guards red**, because repairing it
requires a selection source nothing in this repository is authorised to use.

### Status of the four findings

| finding | status | evidence |
|---|---|---|
| `P0-SCIENCE-07` the dev-flow Report's three per-Biotic scores out of 100 | **CLOSED — construct and selection both gone** | rendered: `tests/e2e/audit-capture-reports.spec.ts` walks a real assessment to the Report and asserts no `<Biotic> NN/100` and no possessive, with the Report's own sections asserted present so the absence is not blankness |
| `P1-VOCAB-01` "Heal" renders as a customer-facing pathway tag | **CLOSED** | the same rendered walk reads **Feed · Seed · Rejuvenate** on the food cards and no `Heal` anywhere in the page text |
| `P0-SCIENCE-08` mechanistic microbiological claims in food copy | **TRACED · QUEUED FOR REVIEW** | the spec's premise is corrected below; no wording changed, per the spec's own condition that a named reviewer dispositions each claim |
| `P0-SCIENCE-06` the paid Report ranks the member's Biotic pathways | **HELD · GUARDS RED AND INVENTORIED** | three `it.fails("BLOCKED · …")` assertions that call `buildFoodSystemReport()`, plus one entry in `BLOCKED_AT_0R6` |

### `P0-SCIENCE-07` — what was removed, and why removal closed the selection too

`PillarDeepDive.score` is gone from the contract in `lib/assessment-report.ts`.
That removed three things in one edit:

1. the rendered **number and denominator** (`{dive.score}/100`, in that Biotic's
   colour) and the possessive summary branch *"Your probiotics score has clear
   room to grow"*;
2. the **sort** — `deepDives.sort((a, b) => a.score - b.score)`, "weakest first",
   which made the first card the member's asserted weakest Biotic;
3. the **downstream selection** — `full-report-client.tsx` read `deepDives[0].pillar`
   as the weakest pathway and fed it to the food swaps.

So `-07` needed no authorised replacement selection source, unlike `-06`: with
no score on the contract the ranking cannot exist, the order is the static
`PILLAR_ORDER`, and `deepDives[0]` is a constant rather than a verdict.

One line had to move with the sort. The section subtitle read *"Starting with
your areas of greatest opportunity"* — a description of the ORDER. Leaving it
would have been the worse of the two outcomes: a ranking claim with nothing
behind it at all.

### `P1-VOCAB-01` — a retired name that exists in no source string

The spec asked for `retired-vocabulary.test.ts` to be "extended over the report
corpus". Measured, **the corpus already covered the file and the rule already
existed, and the suite was correctly green**:

```tsx
{food.pillars.map((p) => <span className="… capitalize">{p}</span>)}
```

The source holds only the lowercase stored key `"heal"`, which the
case-sensitive `RETIRED` rule deliberately permits — lowercase "heal" is an
ordinary English verb in legitimate educational prose. **The capital-H "Heal" a
customer reads is manufactured by `text-transform: capitalize` at render
time.**

This is a new form, and it is the presentation-layer analogue of the
interpolation blindness this programme has now recorded eleven times: there the
word lived in a lookup table, here it is produced by a stylesheet. The existing
instrument cannot express it, which is reported rather than worked around; what
IS expressible, and is the real invariant, is **structural** — a stored key must
not be rendered directly. The tag now maps through `ACTIONS` in
`lib/product-vocabulary.ts`, and `capitalize` is gone with the need for it.

### `P0-SCIENCE-08` — the spec's reachability premise is not borne out

The spec records the food-tool data as **"shared with the production path"**.
Traced, it is not: the live Report carries its own `TOOLS` in
`lib/report/build-food-system-report.ts`, already written in the hedged
register, and the five quoted strings — *"maximises short-chain fatty acid
production"*, *"Hundreds of millions of live bacteria per gram; direct seeding
of the microbiome"*, *"selectively feeds the most beneficial gut bacteria"*,
*"Flavanols feed Lactobacillus and Bifidobacterium"*, *"stabilise your gut
rhythm"* — live in `ALL_FOODS` in `lib/assessment-report.ts`, which reaches only
`FullReportClient`.

**`-08` is therefore LATENT, not live.** The correction is recorded here rather
than edited into the finding, because the finding is what was measured at the
time. The strings are unchanged and the dispositioning sheet is prepared;
`-08` closes no further than "traced and queued" until a reviewer is named.

### `P0-SCIENCE-06` — held, and why

Retiring the ranking means the paid Report must select its content from
something else, and nothing in the repository is authorised to do so:

| candidate | why it cannot key a live paid Report |
|---|---|
| `lib/fss/action/priority.ts` — domain-keyed, the right shape | its scores come from `lib/fss/engine/weights.ts`, which refuses to score outside an explicit `DEV_ONLY` fixture context: *"there is no scientific reviewer and no weight has a rationale. That is the blocker, not this function."* Consumed only inside `lib/fss/*` |
| `lib/report/deterministic/priority.ts` | pre-activation: Migrations 48 and 49 drafted-and-not-applied, an ordered prerequisite list, and the `constraints-known` acknowledgement blocker outstanding (Phase 4A-S2R1) |

It cannot ship as hide-only either, because that is exactly what the ruling
above forbids. So the guards are held red and inventoried, and the product
decision is reported rather than taken.

**A newly-found site, folded in:** `toolOrder = [priorityPathway,
strongestPathway, …]` at `build-food-system-report.ts` — the argmin over three
unmeasured Biotic scores **selects the five foods a paying customer sees**. The
visual manifestation `primaryAccent: bioticAccent(priorityPathway)` is the same
construct in colour, and is the single entry in `BLOCKED_AT_0R6`.

### `P0-SCIENCE-07-LIVE` · NEW · the same construct, on the PAID path

**This is the most serious thing 0R-6 found, it is outside the tranche's four
findings, and it is NOT repaired.**

The register classifies `-07` as "LATENT PRODUCTION HAZARD · NOT currently
customer-reachable". That is true of `full-report-client.tsx`. It is **not true
of the construct**: the identical construct is live on `/assessment/report`,
which is `V1_CORE_ROUTES:94` — the settled €49 product.

Found by measuring why sabotage 1521 slipped. Neutralising the Biotic ranking
left the Report still varying across permutations of the same three scores,
because the report object carries, **per Biotic**, a `score` and a `state`:

| site | what a paying customer sees |
|---|---|
| `components/report/food-system-section.tsx:392` → `PathwayScores` | all three per-Biotic scores as large numerals — **"71/100"** — each in `bioticAccent(key)`'s colour with `PATHWAY_LABEL[key]` beneath |
| `components/report/food-system-section.tsx:488, :505` → `NodeCard` | a per-Biotic **band word** (`StateBadge`), `{node.score}/100`, and a possessive `explanation` |
| `lib/pdf/food-system-pdf.tsx:454`, `:494` → `BodyFigure` | the same three scores and band words, drawn **on a figure of the member's body inside three rings**, in the PDF the customer downloads |

The chain is `PaidReportClient:627` → `FoodSystemSection` → `/assessment/report`.
The third row is the anatomy construct `P0-SCIENCE-05` removed from the Twin at
0R-5, reconstructed in the PDF.

**Unlike `-06`, this needs no authorised replacement selection source** — it is
a removal of the kind 0R-5 performed five times (`MealCard`'s triple,
`BioticBar`, `BIOTIC_META`, `BioticsProgressPanel`'s prop, `ScoreRing`'s
`percentile`). It is left for an explicit ruling on which tranche owns it,
rather than expanded into silently, because rewriting the main section of the
paid Report is plainly beyond the four findings 0R-6 was authorised to close.

### Instrument defects 0R-6 found in its own guards

| # | defect | how it was found |
|---|---|---|
| 1 | the reachability non-vacuity rule read a **comment**, not code: `lib/paid-flow-policy.ts`'s doc comment records the old `!process.env.STRIPE_SECRET_KEY` shape, so the rule matched the HISTORY and reported a regression that was not there. Comments are stripped now. *A comment recording a defect is not the defect* — written down **three** times in this tranche alone | first run of the pin |
| 2 | the `P1-VOCAB-01` structural rule required `>{p}<` **adjacency** the five-line JSX does not have, and passed against the live defect | first run |
| 3 | the same rule matched only the bare identifier, so `{p.toLowerCase()}` — still the stored key, printed lowercase with `capitalize` gone — walked through | sabotage 1516 |
| 4 | `PATHWAY_TAG_SURFACES` had **no membership pin**, so `it.each` over the emptied list deleted the instrument and broke nothing. **Sabotage 1461's lesson, repeated one tranche after it was written down** | writing sabotage 1517 |
| 5 | the selection half of `-07` was held **only by the TypeScript type**, and the sabotage driver runs vitest, not `tsc`. Restoring `score: number` broke no assertion. *Type-level absence is not enforcement when the enforcing tool is outside the loop* | sabotage 1512 |
| 6 | my own rendered non-vacuity assertion read `"Pillar Breakdown"` case-sensitively, but the label renders through `uppercase`. **The same CSS-transform blindness `P1-VOCAB-01` is about, in my own assertion about it** | the Playwright run |
| 7 | I deleted one stale `EXPOSED_AT_0R1` entry and kept the other, with a comment asserting the file still carried the claim. It did not, and the staleness rule refused the surviving row immediately | first run |

### A corpus entry protected by the presence of a defect

Sabotage 1452 — *one file quietly leaves the Report corpus* — **slipped**, and
the reason is the finding.

It was never caught by a membership assertion: the existing test removes the
file from both sides of its own comparison. What caught it was the D7 derived
ledger, which saw that `lib/assessment-report.ts` was reachable, carried a
claim, and now had no guard. **0R-6 repaired the claims out of that file, D7 went
correctly silent, and the entry became droppable with nothing failing.**

> A corpus entry was protected by the presence of a DEFECT in the file it names.
> So every file this programme successfully cleans becomes a file that can
> silently leave the scan — and the cleanest files are exactly the ones whose
> guard entry looks most droppable. A corpus must be pinned for what it IS, not
> for what is currently wrong inside it.

`biotic-claims.test.ts` now pins `ACCOUNT_SURFACES`, `ASSESSMENT_SURFACES` and
`REPORT_SURFACES` as exact sets, as the five older tranches have been since
Gate 3.7.

### The frozen audit corpus is overwritten in place by the full Playwright run

Measured, not assumed: `docs/experience/audit/screenshots/` was last written at
`5274e03` (Experience 0 step 8), and **every `playwright test` run since has
regenerated it** — so 0R-1 through 0R-5 each left those files dirty and restored
them. The images are Experience 0's frozen before-evidence and the index's
`findings` column still names defects that are now repaired, so regenerating
them over the frozen record would destroy the evidence the audit cites.

Restored rather than committed at this close, consistent with every previous
tranche. Recorded because nothing in the harness prevents it, and the next
person to run the suite and `git add -A` would silently replace the audit's
evidence base. This belongs with `NOTE-CAPTURE-01`.
