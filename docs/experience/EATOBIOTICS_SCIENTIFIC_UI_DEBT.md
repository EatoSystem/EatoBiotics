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

## `P0-TRUST-02` · The per-Biotic numbers are a hardcoded fallback, and it is reachable

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

## `P0-TRUST-05` · The product auto-sends a prohibited Biotic claim to the AI consultant

**Surface** `/account` (Overview) · **Component**
`components/account/twin/ask-twin.tsx:20` → `app/account/consult/consult-client.tsx:219-225`
· **Verified** by render, 2026-10-04

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

---

## Register status

| id | severity | surface | verified | disposition |
|---|---|---|---|---|
| `P0-TRUST-01` | P0 | `/account` | render | RETIRE the fallback |
| `P0-TRUST-02` | P0 | `/account` | render | RETIRE with `P0-SCIENCE-02` |
| `P0-SCIENCE-01` | P0 | `/account` | render | RETIRE / REMEDIATE |
| `P0-SCIENCE-02` | P0 | `/account` | render | RETIRE |
| `P0-SCIENCE-03` | P0 | `/account` | render | RETIRE / REMEDIATE — **two repairs**; `:1757` extracted |
| `P0-TRUST-03` | **P0-TRUST / P0-SCIENCE** | `/account` | render + source | RETIRE — **its own remediation proof** |
| `P0-TRUST-04` | P0 | `/assessment/you` → Results | render + source | REMEDIATE — mirror the existing guard |
| `P1-FUNNEL-01` | P1 | `/assessment/you` → Results | live HTTP | REMEDIATE — four dead CTAs |
| `P0-SCIENCE-04` | P0 | `/account` Twin | render | RETIRE — **a Biotic verdict rendered as colour**; no string guard can see it |
| `P0-TRUST-05` | **P0-TRUST / AI-governance** | `/account` Twin → `/api/consult` | render + source | RETIRE — auto-sent prohibited premise |
| `P0-SCIENCE-05` | P0 | `/account` Twin | render | REMEDIATE — keep the ritual, drop the asserted biology |
| `P0-ARCH-01` | P0 (coverage) | `/account` | source + render | RECORD — the audited state was the minority state |
| `P1-FUNNEL-02` | P1 | `/account` Twin | live HTTP | REMEDIATE with `P1-FUNNEL-01` |
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

Principles accepted as durable are carried into
[`EXPERIENCE_CONSTITUTION.md`](./EXPERIENCE_CONSTITUTION.md); the evidence stays
here.

