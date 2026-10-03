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
| `:1757` your focus today | **always** | see below — worse than unpermitted |

### `:1757` IS NOT DERIVED, AND THE COMMENT SAYS IT IS

The block is introduced by `{/* Your Focus Today — lowest pillar driven */}`
(`:1742`). It is not. **`displayBiotics` is referenced zero times anywhere in
that block**, and the sentence is a literal:

> *"Your probiotic score is your lowest pillar."*

Probiotic is named unconditionally. For any member whose lowest value is
Prebiotic or Postbiotic, the product states something **factually false about
them** — not merely a claim it is not permitted to make.

It rendered true in both fixtures only by coincidence: the hardcoded fallback
is 71/23/48 and the genuine state is 58/44/63, and Probiotic happens to be
lowest in both. A state where it is not would expose the sentence as wrong.

### Classification

| | |
|---|---|
| Kind | product/science contradiction + outcome claim + **a false personal statement** |
| Disposition | **RETIRE / REMEDIATE**, as three separate repairs, not one |

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

---

## Register status

| id | severity | surface | verified | disposition |
|---|---|---|---|---|
| `P0-TRUST-01` | P0 | `/account` | render | RETIRE the fallback |
| `P0-TRUST-02` | P0 | `/account` | render | RETIRE with `P0-SCIENCE-02` |
| `P0-SCIENCE-01` | P0 | `/account` | render | RETIRE / REMEDIATE |
| `P0-SCIENCE-02` | P0 | `/account` | render | RETIRE |
| `P0-SCIENCE-03` | P0 | `/account` | render | RETIRE / REMEDIATE — **three separate repairs** |
| `P0-GUARD-01` | P0 | test corpus | source | REPAIR FIRST, in remediation |
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
