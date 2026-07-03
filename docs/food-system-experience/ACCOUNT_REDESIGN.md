# Account Redesign — "My Food System Today"

The account Overview stops being a stack of sections and becomes **one living canvas**: the
member's body first, then the day's story told in chapters on a single continuous surface.
It must answer, top to bottom, without reading a report:

> How is my Food System today? · What changed? · What did it learn? · What should I do next?
> How am I improving?

Everything below evolves existing components (`components/account/twin/*`,
`components/account/live-dashboard.tsx`) — presentation only, no data-model changes.

---

## Section hierarchy (Overview tab)

```
┌────────────────────────────────────────────────────────────────────┐
│  TODAY STRIP  Good afternoon, Jason · Your Food System is learning │  TodayStrip (evolved)
│               and getting stronger · last updated 2h ago           │
├────────────────────────────────────────────────────────────────────┤
│  ████████████████  THE STAGE (dark, cinematic)  ██████████████████ │  TwinStage
│  ┌───────────────┐                    ┌──────────────────────────┐ │
│  │  the living   │                    │ score (count-up) + delta │ │
│  │  body, aura,  │   ← default →      │ verdict · sparkline      │ │
│  │  hotspots,    │                    │ mood · evolution rings   │ │
│  │  evolution    │                    │ [Log a meal]             │ │
│  └───────────────┘                    └──────────────────────────┘ │
│                                                                    │
│  ── on meal logged, the SAME stage becomes the reveal ──           │  reveal mode (new)
│  ┌───────────────┐                    ┌──────────────────────────┐ │
│  │ pathway nodes │  lights in sync →  │ MEAL RECEIVED            │ │
│  │ light on the  │                    │ meal name · score count  │ │
│  │ figure, aura  │                    │ impact rows (staggered)  │ │
│  │ re-tints,     │                    │ kcal · protein · fibre   │ │
│  │ particles in  │                    │ insight · what happens   │ │
│  └───────────────┘                    │ next · Log another/Done  │ │
│                                       └──────────────────────────┘ │
├────────────────────────────────────────────────────────────────────┤
│  gradient bridge (dark → cream, ~64px)                             │  new
├─ cream canvas from here down ──────────────────────────────────────┤
│  TODAY ────────────────────────────────────────────────            │  GroupLabel v2
│  ┌──────────────────────────────┐  ┌─────────────────────┐         │
│  │ DailyRitual (wide)           │  │ TwinNextAction      │         │  2-col grid
│  │ streak · today's meals · log │  │ one action + why    │         │
│  └──────────────────────────────┘  └─────────────────────┘         │
│                                                                    │
│  THIS WEEK ────────────────────────────────────────────            │
│  What changed + what your Food System learned                      │  TwinLearnedToday
│  (top entry promoted to "Insight of the day" highlight card)       │  (restyled)
│                                                                    │
│  LEARN & ASK ──────────────────────────────────────────            │
│  ┌──────────────────────────────┐  ┌─────────────────────┐         │
│  │ InsideYouTeaser (the film)   │  │ AskTwin             │         │  2-col grid
│  └──────────────────────────────┘  └─────────────────────┘         │
│                                                                    │
│  YOUR MEALS ───────────────────────────────────────────            │
│  logger card (white card language) + meals grid                    │  restyled
└────────────────────────────────────────────────────────────────────┘
```

Mobile: identical order, single column.

## The rules of the canvas

1. **The body is the first screen.** Nothing scrolls above the stage except the one-line
   greeting/status strip.
2. **One score.** The hero score (count-up + delta + verdict) is the only bare number on the
   page. Every other figure arrives inside a sentence ("Fibre diversity grew — 9 plants this
   week") or on demand (hotspot hover, meal card expand).
3. **One surface.** Dark stage → gradient bridge → warm cream wash
   (`#FDFBF7 → #F4F8EC`). Cards float on the wash; no flat-white void between sections.
4. **Chapters, not pages.** GroupLabel v2 — slightly larger serif title + hairline — with one
   consistent vertical rhythm (`pt-12`), so groups read as chapters of one document.
5. **Composed, not stacked.** Desktop groups are 2-column compositions (wide + side), which
   kills the "equal-width stripes" pattern that made the page feel like fragments. Section
   components gain a `bare` prop so the grid owns layout.
6. **No seams.** The hardcoded "Your last meal was logged yesterday" line goes; the loud
   green-gradient logger card becomes the standard white card; consistent `max-w-5xl` gutters.

## Interactions & learning moments

- **The Meal Reveal** (the flagship interaction — full spec in `YOUR_FOOD_SYSTEM.md` §Reveal):
  logging a meal plays out ON the stage, teaching which pathways the meal fed.
- **Hotspots**: touch a constellation point → plain-words tooltip of that system's state.
- **Next Best Action**: one card, one action, one "why this matters" — complete/skip with a
  gentle acknowledgement, never a guilt state.
- **Insight of the day**: the strongest feed entry, promoted with a soft glow — the one thing
  to remember today.
- **Milestones**: unseen milestones fire the stage burst + a celebration card (existing
  `lib/account/milestones.ts` behaviour, unchanged).

## Component map

| Section | Component | Change |
|---|---|---|
| Greeting/status | `today-strip.tsx` | already exists; keep |
| Stage | `twin-stage.tsx` | + `reveal` mode, `id="fs-stage"` |
| Reveal | `meal-reveal.tsx` | **new** — `MealRevealPanel` + `MealPathwayOverlay` |
| Quick log | `quick-log.tsx` | + `onReveal` handoff, `nutrition` on result |
| Bridge + canvas | `live-dashboard.tsx` / `twin-dashboard.tsx` | new wrappers |
| Today grid | `daily-ritual.tsx`, `twin-sections.tsx` | + `bare` prop |
| Learned feed | `twin-sections.tsx` | insight-of-the-day treatment |
| Learn & ask grid | `inside-you.tsx`, `ask-twin.tsx` | + `bare` prop |
| Logger card | `live-dashboard.tsx` | white-card restyle, copy fix |

## Follow-ups proposed (not in this build)

- **Route split**: `/account/today` · `/account/this-week` · `/account/twin` as the mockups'
  Today / This Week / My Food System trio — the Overview canvas is designed so its chapters can
  later become those routes without redesign.
- Weekly review as its own cinematic page ("Your Food System This Week") built from the
  existing `week-story` data.
