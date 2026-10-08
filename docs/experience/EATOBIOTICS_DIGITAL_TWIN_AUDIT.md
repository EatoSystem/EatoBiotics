# The Digital Twin / Living Body — Generation 3, and it is not dormant

**Experience 0, step 6.** The baseline recorded Generation 3 as a source-only
surface: *"`/account/today`, `/account/this-week`, `/account/twin`,
`/digital-twin` are all `POST_V1_ROUTES` — refused."* That is true of the
routes. It is false of the layer.

> **The Twin is the first screen of the real member dashboard.** Fifteen of its
> components render inside `/account`, and the gate that shows them is satisfied
> by having completed the free assessment.

This step rendered it for the first time, and three of the four most serious
findings in Experience 0 so far are in it.

---

## 0 · Two corrections to my own step-6 planning, first

Both were in the approved plan and both were wrong. They are corrected here
rather than quietly restated.

### The live/refused split was 9 / 14. It is 15 / 8.

The plan's figures came from reading `live-dashboard.tsx`'s direct imports. The
**transitive** closure from `live-dashboard.tsx` is:

| | |
|---|---|
| reachable from the live dashboard | **15 components + 1 hook** — `twin-stage` · `today-strip` · `twin-sections` · `quick-log` · `inside-you` · `inside-you-journey` · `daily-ritual` · `ask-twin` · `meet-checklist` · `meet-body-hero` · **`meal-reveal`** · **`meal-impact`** · **`meal-reaction`** · **`week-story`** · **`share-twin`** · `use-count-up` |
| not reachable from it | **8 components + 1 hook** — `forecast` · `journey` · `menu-scan` · `twin-dashboard` · `twin-hero` · `twin-lenses` · `this-week-client` · `demo-hero` · `use-twin-realtime` |

The six in bold were classified refused-only in the plan and are not. That
matters most for **`meal-reveal.tsx`**, which carries the meal→anatomy mapping
the plan singled out `forecast.tsx` for.

**Reachable is not rendered**, and the audit keeps the distinction: `meal-reveal`,
`meal-reaction`, `meal-impact`, `week-story` and `share-twin` are behind
interactions (logging a meal, opening the story, pressing share) that this
capture did not trigger, because triggering them would write. For those five,
**source establishes possibility; this step does not establish reachability.**

### `components/twin-motion/` is not on the live path

`inside-you.tsx`'s docblock says it *"lazy-loads the interactive Remotion
player"*. It does not: it renders `InsideYouJourney`, which is CSS/SVG, and
whose own docblock calls itself *"the interactive replacement for the old
auto-playing Remotion film"*. The docblock is stale.

`components/twin-motion/*` has exactly one importer in the whole repository —
`app/digital-twin/page.tsx`, which is `POST_V1`-refused (**404**, verified).
`remotion` and `@remotion/player` remain in `package.json` and ship nothing to a
member.

---

## 1 · Corpus and evidence mode

| | |
|---|---|
| new state | **`twin-present`** — the fixture's deterministic Twin, `email: null`, frozen clock, no production auth, no Supabase |
| rows | 15 (5 tabs × 3 widths), 2 committed citations |
| mode | **fixture-rendered real component** for the live layer; **source-only** for the refused eight |
| refusals removed | **none.** `/account/twin`, `/account/today`, `/account/this-week`, `/digital-twin` verified **404** and left refused |

### The write proof, because reading the guard was not enough

Source says the twin-state PUT is gated on `propEmail` alone. `NOTE-FIXTURE-01`
has been wrong about this effect twice, so it was proved by render:

```
✓ twin-present issues no write, measured with a twin on screen
```

No non-GET request to any `/api/` path, no `/api/twin-state` at all, and the
total footprint still exactly `GET /api/assessment/journey` — the declared set,
unchanged by rendering a Twin. **Rendering exposed no new write, read or network
side effect**, which is what the brief asked to be confirmed before continuing.

---

## 2 · What the render actually shows

A 1280-wide Overview with a Twin is **5,743px** against `representative`'s
**2,694px** — the Twin more than doubles the page. At 390 it is **10,359px**,
making it the tallest customer surface in the product, ahead of Results (6,313px).

Reading down the stage:

- a glowing **anatomical human figure** — two torsos with a visible digestive
  tract — inside a luminous orb, surrounded by drifting microbe-like particles;
- four labelled nodes anchored to body regions: **MIND · DEFENCE · DIGESTION ·
  ENERGY**, with connector lines to the figure;
- four coloured ring markers placed **on** the body;
- pills: **LIVE & LEARNING**, *STILL LEARNING*, **7 meals to Attuned**;
- a speech bubble in the Twin's own voice: *"I learned from your first meal"*;
- **YOUR FOOD SYSTEM TODAY · IMPROVING**, `67/100`, `▲ +6 since baseline`;
- *"The Food System Inside You — watch it learn, see it improve."*;
- **PREBIOTICS 58 · PROBIOTICS 44 · POSTBIOTICS 63**, as labelled bars;
- a 14-day **MEAL SIGNALS** sparkline, and the next best action.

Then, below the stage and still inside the Twin gate: the daily ritual, the
learning feed, the Inside You teaser, Ask your Food System, and the systems
grid.

---

## 3 · The seven questions, answered from evidence

### 1 · What problem was it trying to solve?

A real one, and the documents are honest about it: *"Both must feel like
entering a place, not reading a page"* (`YOUR_FOOD_SYSTEM.md`). The Twin exists
to turn an account you read into a thing you return to. The daily ritual, the
streak, the evolution ladder and the learning feed are all answers to *why would
anyone come back tomorrow* — which is the question Generation 1 never answered
and Generation 4 answers with `Today`.

### 2 · Genuine user value, or visual metaphor?

Both, and they are separable.

| genuinely derived | |
|---|---|
| **Evolution ladder** (`lib/account/evolution.ts`) | Meeting → Learning → Attuned → Expert, keyed off meal count with thresholds 0/3/10/25. *"7 meals to Attuned"* is `10 − 3`. **Derived, not invented.** |
| **Streak and the 7-day rhythm bar** | real `localStorage` ritual days and real meal observations |
| **14-day sparkline** | real meal scores, filtered to the window, sorted |
| **Confidence** | `observations / 12`, driving brightness — a data-density measure, honestly named |
| **Milestones** (`lib/account/milestones.ts`) | fire off real observation counts |
| **The four hotspots** | **carry no personal state at all.** Gate 3.6 removed `score`, `level` and `bioticLabel` from `SystemHotspotState` *structurally*; `systemMapState(_twin)` ignores its argument. The copy is hedged education (*"associated with"*, *"typically"*) |
| **`AFTER_MEAL_STEPS`** | careful, hedged, genuinely good education on digestion timing |

The ritual sits on both sides of that line, which is why its disposition is
REMEDIATE rather than RETIRE: the taps, the streak and the 7-day bar are real
self-report; the body figure, the anatomical ping and *"A fermented food lights
up your probiotic network"* are not.

| metaphor presented as state | |
|---|---|
| **The aura colour** | `auraGradientForBiotic(twin.biotics.weakest, …)` — a personal Biotic verdict rendered as colour. **`P0-SCIENCE-04`** |
| **The ritual nodes** | a checkbox lights a named anatomical coordinate on a body figure, under *"Your body just felt that"*. **`P0-SCIENCE-05`** — proved in the tapped state, with no write |
| **The three biotic bars** | `twin.biotics.*.score` with labels and numbers, `twin-stage.tsx:527-529` — the same construct as `P0-SCIENCE-02`, in a second component |
| **First-person interiority** | *"I can feel the energy flowing faster"*, *"my reads are getting sharp"*, *"your Food System felt all of it"* — the Twin claims to perceive the member's body |

### 3 · Does it introduce claims EatoBiotics cannot support?

**Yes — three live ones, each a different class, none previously in the
register.** `P0-SCIENCE-04` (Biotic verdict as colour), `P0-TRUST-05` (a
prohibited premise auto-sent to the AI consultant), `P0-SCIENCE-05` (a bodily
reaction asserted from a checkbox, localised on an anatomical figure). Full
entries in `EATOBIOTICS_SCIENTIFIC_UI_DEBT.md`.

`P0-TRUST-05` is the most serious thing Experience 0 has found. It is not a
sentence on a page; it is a path by which a prohibited claim becomes **model
input** and the model's answer becomes new customer-facing prose — the exact
laundering the Gate 6 Intelligence boundary was built to prevent, happening
outside it, through a `?q=` parameter and an auto-send on mount.

### 4 · Does it duplicate My Food System?

**Substantially, and in the direction that matters.**

| | Twin on `/account` | Gen 4 `/preview/food-system-v1` |
|---|---|---|
| a daily "what matters today" | `TodayStrip` + `DailyRitual` + Your Next Best Action | `today` |
| the score and its movement | stage cockpit, `67 /100`, `▲ +6 since baseline` | `score` |
| the three Biotics | **three personal bars** | `biotics` — education, no personalisation |
| what to do | Your Next Best Action, *"I did this" / "Not this time"* | `my-plan` |
| change over time | sparkline, evolution ladder, learning feed | `progress` |
| education | Inside You, hotspots, after-meal steps | `learn` |

Six of Gen 4's seven areas have a Twin counterpart. They are **not** two views
of one model: Gen 4 refuses where the Twin asserts, and on the one area they
share by name — Biotics — they take opposite positions in the same product.

### 5 · Does any capability deserve to survive inside My Food System?

**Yes, four**, and they are the parts Gen 4 is currently weakest at.

1. **The daily ritual** — one-tap self-report with a visible 7-day rhythm. It is
   the only mechanism in the product that gives someone a reason to open it on a
   day they did not eat anything notable. → **`today`**, with `P0-SCIENCE-05`'s
   asserted effects and body coordinates removed.
2. **The evolution ladder** — *"7 meals to Attuned"*. Honest, derived, and it
   tells a person what their next contribution buys. → **`progress`**.
3. **The learning feed** — what changed since last time, as short derived
   cards. → **`progress`**, subject to Gate 5's comparability authority, which
   the Twin's feed currently does not consult.
4. **The after-meal journey** — hedged, accurate, genuinely educational. →
   **`learn`**.

### 6 · Does motion clarify state, or manufacture measured biology?

**It manufactures it, and the motion system says so in writing.**
`MOTION_SYSTEM.md` rule 2: *"Every animation encodes a fact: **a ping = a
pathway fed**; a dim = strain; a ring = growth."* A ping encoding "a pathway
fed" is a mechanism claim expressed as motion, adopted as a design rule.

Rules 1, 3, 4, 5 and 6 are good motion engineering — breath-like easing,
one-timeline choreography, reduced-motion respect, clean transform exits. The
defect is specific to rule 2, and it is a **claims** defect wearing motion
clothing.

The Remotion question resolves itself: it is not on the live path at all, so a
video dependency implies nothing about the shipped product's restraint. It is
two unused packages behind a refused route.

### 7 · Product, visualisation, education, or legacy experimentation?

**A visualisation layer with a real habit product trapped inside it, built on a
biological model the instrument cannot populate.**

It is not legacy experimentation — it is live, coherent, and carefully built.
It is not a product in its own right — every job it does, Gen 4 also does,
except the daily ritual. And it is not education, because education does not
need the member's weakest Biotic to choose a colour.

---

## 4 · The comparison that decides it

> **If My Food System is the persistent product, what unique job remains for the
> Digital Twin?**

**One: the daily habit loop.** Everything else is either duplicated by Gen 4 or
is a claim Gen 4 deliberately declines to make.

And that job does not need a Digital Twin. It needs a check-in, a streak and a
reason to return — which is roughly 190 lines of `daily-ritual.tsx` plus the
evolution ladder, both of which are honest, derived, and portable into `today`
and `progress` today.

> **Nothing is preserved because substantial engineering effort already
> exists.** ~4,300 lines is the reason this is hard to retire, not a reason to
> keep it.

### Keep · Evolve · Merge · Move · Retire

| capability | component | disposition | destination |
|---|---|---|---|
| Daily ritual + rhythm bar | `daily-ritual` | **MOVE** (minus the asserted effects and node coordinates) | → `today` |
| Greeting · streak · add-meal | `today-strip` | **MERGE** | → `today` |
| Evolution ladder | `evolution.ts` | **MOVE** | → `progress` |
| Learning feed | `twin-sections` | **EVOLVE** then MOVE — must route through `canCompare` | → `progress` |
| After-meal journey | `evolution.ts` | **MOVE** | → `learn` |
| Hotspot education | `system-map.ts` | **MOVE** — already clean, already non-diagnostic | → `learn` |
| Sparkline | `twin-stage` | **MERGE** into the score's existing trend | → `score` |
| Next Best Action + I did this | `twin-sections` | **MERGE** — Gen 4 has this with provenance | → `my-plan` |
| First-meal checklist | `meet-checklist` | **EVOLVE** — good onboarding, wrong voice | → `today` first-run |
| **The body figure, orb, aura and hotspot markers** | `twin-stage`, `meet-body-hero` | **RETIRE as a state display.** It may survive as **illustration** in `learn`, carrying no member data | — |
| **Three personal biotic bars** | `twin-stage:527` | **RETIRE** | — |
| **Aura tinted by weakest Biotic** | `twin-visual.ts` | **RETIRE** — `P0-SCIENCE-04` | — |
| **Ask-your-Food-System biotic prompt** | `ask-twin:20` | **RETIRE** — `P0-TRUST-05` | — |
| Ask-your-Food-System action/meal prompts | `ask-twin` | **KEEP** — both are clean | → `my-plan` |
| Inside You teaser → `/account/twin` | `inside-you` | **RETIRE the link** until the route exists — `P1-FUNNEL-02` | — |
| Systems grid | `systems-explorer` | **EVOLVE** — "Coming soon" for the five 404s, as the other five already do | — |
| Meal Reveal / impact / reaction / week story / share | 5 components | **HOLD** — reachable but unrendered here; audit before any Gen 4 port | — |
| The refused eight | `forecast`, `journey`, `menu-scan`, `twin-dashboard`, `twin-hero`, `twin-lenses`, `this-week-client`, `demo-hero` | **RETIRE** — each carries at least one prohibited construct and none is reachable | — |

### The refused eight, in one line each

Source-mode only — **unavailable by render, route intentionally refused.**

| | what it would do if reactivated |
|---|---|
| `forecast` | projects per-Biotic values four weeks forward and maps them to body coordinates (`FORECAST_NODE`) — prediction + personal Biotic state + anatomy |
| `twin-hero` | renders *"Strongest · Prebiotics"* and *"Biggest opportunity · Probiotics"* as labelled chips |
| `twin-lenses` | shows *"the member's current standing on its focus biotic"* per lens |
| `menu-scan` | already recorded in CLAUDE.md — tells the model *"the member's weakest biotic is X"* |
| `twin-dashboard` | the `/account/twin` page; mounts the stage plus everything above |
| `this-week-client` | a weekly score + delta documentary |
| `journey` | the score story as an area chart with milestone dots |
| `demo-hero` | the public demo wrapper for the stage |

**Five of the eight carry a personal per-Biotic construct directly** — `forecast`,
`menu-scan`, `twin-dashboard`, `twin-hero`, `twin-lenses`. A sixth, `demo-hero`,
inherits both the aura and the three bars by mounting `TwinStage`. `journey` and
`this-week-client` carry none (counted at source: zero Biotic references beyond a
docblock word and the brand name).

That is the pattern, not a coincidence: the Twin's architecture makes the
member's three Biotics the natural thing to render, because it is the richest
per-member structure the read model holds.

---

## 5 · Document classification

| document | classification | evidence |
|---|---|---|
| `docs/food-system-experience/YOUR_FOOD_SYSTEM.md` | **partially superseded** | Accurate as an implementation record of what shipped — and it is the document that *specifies* the prohibited mappings: *"the aura re-tints toward the strongest"*, *"pathway nodes light on the figure — each mapped to what the meal delivered"*, with a six-row impact→body-region table. Superseded as product direction by the permanent product rule. Keep as history; do not build from it |
| `docs/food-system-experience/MOTION_SYSTEM.md` | **partially superseded** | Rules 1, 3–6 are canonical motion engineering. **Rule 2** (*"a ping = a pathway fed"*) is a claims defect in a motion document. The Remotion catalogue (§48+) describes components with no live importer |
| `docs/masterplan/MOTION_CONSTITUTION.md` | **overlapping** | 76 lines covering the same ground as the 92-line `MOTION_SYSTEM.md`, including Remotion. Two motion documents in two directories is a `DOCUMENTATION_MAP` problem, recorded for step 7 |

---

## 6 · Responsive and accessibility

- **390 is where the stage breaks.** The four hotspot labels (MIND / DEFENCE /
  DIGESTION / ENERGY) are clipped off entirely, so the one genuinely educational
  element of the figure is desktop-only.
- **An overlap defect at both widths.** The *"I learned from your first meal"*
  milestone bubble is positioned over the status pills and covers *STILL
  LEARNING* at 1280 and both pills at 390.
- **A 10,359px page at 390.** Eleven phone-screens of scroll before the footer.
- `prefers-reduced-motion` is respected throughout via the `eb-*` classes, and
  the hotspots are real buttons with `aria-label`s — the a11y engineering is
  good.
- Console on `twin-present`: the same single `401 GET /api/assessment/journey`
  recorded in `NOTE-FIXTURE-01`. **Zero new console errors** from the Twin.

---

## 7 · What this step did not do

No production component modified · no route refusal removed · no `/digital-twin`
reactivation · no screenshot manufactured for a refused route · no claims guard
widened · the four canonical decisions **recorded, not executed** · no Reports
work — that is step 7 · no Supabase read or write · no Twin-state PUT, proved by
render.

> Source inspection establishes possibility. Rendered evidence establishes
> reachability.
