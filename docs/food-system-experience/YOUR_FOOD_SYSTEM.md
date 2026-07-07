# Your Food System — the living home

Two surfaces carry the name:

- **In-app**: the stage on the account (and `/account/twin`) — the member's *own* living system.
- **Public**: `/digital-twin` — where a visitor *meets* the idea and watches it respond.

Both must feel like entering a place, not reading a page. Google-Earth-for-yourself: arrive at
the whole body, zoom into systems, discover rather than read.

---

## 1 · The living body

The figure (existing `TwinStage`) is the product. Its states, all driven by real data:

| Signal | Visual | Source |
|---|---|---|
| Breathing | slow aura scale/opacity loop | always on (`ebOrbBloom`) |
| Mood | aura colour temperature + copy | `lib/account/stage-mood.ts` |
| Score | count-up cockpit + sparkline | twin read-model |
| Evolution | rings + badge around the figure | `lib/account/evolution.ts` |
| Systems | constellation hotspots, plain-words state on touch | `lib/account/system-map.ts` |
| Learning | shimmer + "learning…" state while analysing | QuickLog phase |
| Reacting | **the Meal Reveal** (below) | `mealImpact()` |

## 2 · The Meal Reveal (every action affects the body)

The flagship moment. A member logs a meal (text or photo); the analysing state plays in the
QuickLog sheet; on success the sheet closes, the page glides to the stage, and the stage
performs the meal:

**Left — the body responds.** The constellation hides. One by one, pathway nodes light on the
figure — each mapped to what the meal delivered:

| Impact | Node region | Visual |
|---|---|---|
| Fermented / probiotic | gut centre | bright green ping + halo |
| Fibre / prebiotic | lower gut | lime ping, feeding trail |
| Plant diversity | upper body ambience | soft multi-point shimmer |
| Healthy fats | chest | teal-free warm glow (brand green-gold) |
| Protein | core | steady amber-gold pulse |
| Strain (ultra-processed, heavy) | gut, amber | slow amber pulse — *handled*, not punished |

Particles drift inward (the meal being received); the aura re-tints toward the strongest
impact's colour.

**Right — the story writes itself.** In sync with each node, a row appears:
eyebrow **MEAL RECEIVED** → meal name (serif) → score counting up → impact rows ("Fermented
foods — probiotic pathways brighten · *why*") → a quiet nutrition strip (kcal · protein ·
fibre) → the insight sentence → *what happens next* (the after-meal journey: microbes feed →
compounds made → body benefits, next 4–24h) → **Log another** / **Done**.

Education is the choreography itself: left lights *where*, right says *why*, same colour,
same moment. A member who watches three reveals knows what fermented food does without ever
opening an article.

**Strain handling:** a poor meal never plays as failure. Amber, slower rhythm, copy like
"your system is buffering this — fibre at your next meal helps". Hope, not guilt.

## 3 · Exploring the system

- **Hotspots → lenses.** Touch a system point for its plain-words state; open a lens
  (`twin-lenses.tsx`) to re-tint the whole figure through that system (digestion, energy,
  mind…).
- **Inside You** — the cinematic Remotion chapter film (existing) remains the deep-dive:
  the gut world, microbes, compounds.
- **Ask** — `AskTwin` seeds questions from the member's own data ("Why was my energy low
  yesterday?") and hands off to the Transform consult.

## 4 · Weekly review — "Your Food System This Week"

Rename from "The Week Inside" everywhere user-facing. It is the week's chapter: momentum,
patterns (`lib/account/patterns.ts`), consistency, one focus for next week — written as
narrative (`lib/account/week-story.ts`), delivered in-app (`week-story.tsx`) and by email
(`lib/email/week-inside-email.ts`). Numbers appear only inside sentences.

## 5 · Long-term progress

- **Journey rail** (`journey.tsx`, `lib/account/milestones.ts`): named beats — Baseline →
  First meal → Fibre habit → Score improving — with the member's current day marked.
- **Evolution**: the figure earns rings and a stage name as the system matures; visible on
  every visit, celebrated once per milestone.
- **Forecast** (`forecast.tsx`): the system anticipates ("a fermented breakfast would steady
  this afternoon") — the 6-month feeling that it *knows* you.

## 6 · The public page (`/digital-twin`)

Teaches the same language before signup:

1. Cinematic hero — the body alive, score cockpit (existing `HeroStage`).
2. What is your Food System / how it works — the daily cycle (existing `FlowDiagram`,
   `ImpactJourney`).
3. **See it in action** (new) — six contrast cards: *Kefir, Beans, Berries, Poor sleep,
   Ultra-processed meal, Consistent meals*. Each card is a mini body silhouette whose relevant
   pathway glows or dims, one-line lesson beneath ("Probiotic network lights up" / "Energy
   pathway dims"). Same colours the member later sees on their own reveal — the tutorial for
   the product's core loop.
4. From the inside out — You → Family → Community → County → Country → The Food System
   (existing `InsideOutEmbed`) as the closing vision.

## 7 · Boundaries

Educational, food-first, non-medical: "possible contributor", "may support", never diagnosis;
red-flag symptoms always point to a GP; the "not medical advice" line stays on every account
surface. The engine keeps its internal name — **Food System Digital Twin** — and stays in the
engine room; members only ever meet **Your Food System**.
