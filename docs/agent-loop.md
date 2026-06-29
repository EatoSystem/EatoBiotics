# EatoBiotics Agent Loop

A reusable, **product-first** architecture that turns EatoBiotics from a one-time
assessment into a continuously improving Food System:

> Assess → Understand → Observe → Analyse → Recommend → Improve → Learn → Repeat

The loop **is** the product intelligence. An AI model (Claude, OpenAI, …) is an
*interchangeable execution engine* plugged in behind one interface. The whole
system works deterministically today — no LLM, no network, no DB migration.

## First principle
EatoBiotics is not an AI chatbot; it is *The Food System Inside You*. So the
architecture is **AI-ready, not AI-dependent**. Everything below runs on
deterministic logic; AI is opt-in and isolated to a single seam.

## Folder map
```
lib/agent-loop/
  types.ts        pure domain models (no React/DB/AI imports)
  stages.ts       8-stage state machine: order, transitions, UI meta
  systems.ts      foundations + 8 specialised systems (4 live, 4 planned)
  biotics.ts      SubScores -> BioticsScore (strongest/weakest), food hints
  baseline.ts     completed You/Family foundation -> FoodSystemBaseline
  safety.ts       non-diagnostic language guard + disclaimers
  engine.ts       pure, immutable loop passes; controls; progress; memory
  storage.ts      localStorage-first persistence + server-sync seam (stub)
  providers/
    provider.ts        LoopIntelligenceProvider interface (the AI seam)
    deterministic.ts   default rule-based provider (used now)
    README.md          how to add Claude/OpenAI
  index.ts        public surface (import from here)

components/agent-loop/   reusable UI (timeline, stage, biotics, next action,
                         memory, the composite FoodSystemLoopCard, a result-page
                         drop-in panel, and the useFoodSystemLoop hook)
components/home/food-system-loop-section.tsx   homepage "The Food System Loop"
app/food-system-loop/    public interactive demo (deterministic, no auth)
```

## Reuse, don't duplicate
The loop is an **orchestration layer** over what already exists. It never
recomputes scores:
- `lib/assessment/registry.ts` — completion + normalised summaries (source of truth).
- `lib/scoring.ts` — biotics breakdown + score bands.
- `lib/assessment-scoring.ts` — three-biotics sub-scores.
- `components/assessment/foundation-guard.tsx` — UI-level inheritance enforcement.

## Domain model (the important relationships)
- **FoodSystemBaseline** — derived from a completed You/Family foundation; the
  permanent parent of every interaction. Contains the `FoodSystemScore` and the
  three-biotics `BioticsScore`.
- **AddOnSystem** — foundations + specialised systems. Every specialised system
  has `requiresFoundation: true`. Four are `live` (Stability, Glucose, Mind,
  Performance — backed by real assessments); four are `planned` (Recovery,
  Longevity, Sleep, Heart — metadata only, never fake-scored).
- **AgentLoopSession** — `{ baseline, system, currentStage, turns[], memory,
  controls }`. Controls carry Agent-SDK-style `maxTurns` / `allowedObservations`.
- **AgentLoopTurn** — one pass with `observation`, `analysis`, `recommendation`,
  `result`, and `usage` (mirrors the Agent SDK; deterministic runs record
  `engine: "deterministic"`, zero cost).
- **AgentLoopObservation** — extensible union (`meal_*`, `digestion`, `energy`,
  `sleep`, `symptom`, `assessment_update`, …). New data sources = new union members.
- **AgentLoopRecommendation** — exactly **one** food-first action, with a `why`
  and a non-diagnostic disclaimer.
- **FoodSystemMemory** / **LoopProgress** — the Learn + Improve layers (completed
  vs ignored actions, momentum, score delta) — fully deterministic.

## How the engine works
`createAgentLoopSession(baseline, system, controls)` validates inheritance + that
the system is live, then starts at **observe** (a baseline implies Assess +
Understand are done). `runLoop(session, observation, provider?)` is a pure,
immutable pass: Observe → **provider.analyse** → **provider.recommend** → Improve
(`calculateLoopProgress`) → Learn (memory) → back to Observe. It returns a *new*
session plus an `AgentLoopResult`. `recordOutcome` feeds the Learn layer, which
the deterministic provider already reads (e.g. softening an ignored action).

## How AI plugs in
The engine depends only on `LoopIntelligenceProvider`:
```ts
interface LoopIntelligenceProvider {
  readonly id: string
  analyse(observation, ctx): AgentLoopAnalysis | Promise<…>
  recommend(analysis, ctx): AgentLoopRecommendation | Promise<…>
}
```
Default: `DeterministicProvider`. To use Claude, implement the same two methods
with `@anthropic-ai/sdk` + `lib/ai-guard.ts` (cost cap), run output through
`isNonDiagnostic()` / `withDisclaimer()`, and pass it to `runLoop`. Nothing else
changes. Same path for OpenAI / Vercel AI Gateway. See `lib/agent-loop/providers/README.md`.

## Why it's maintainable
- One source of truth (scores/baseline come from existing modules).
- Inheritance enforced in types **and** UI.
- Pure domain + engine → fast deterministic tests (`tests/unit/agent-loop.test.ts`).
- AI churn isolated to `providers/`.
- Additive + reversible — no changes to payments, auth, or the assessment flow.

## Future integrations (seams, all deferred)
- **Supabase** — `storage.syncToServer()` is a no-op stub; add an
  `agent_loop_sessions` table + RLS and upsert for signed-in users (mirror
  `lib/stability/storage.ts`).
- **AI providers** — `providers/` (above).
- **Meal-image analysis** — a new `ObservationKind` feeding `analyse()`.
- **Stripe entitlements** — gate `runAddOnLoop` per tier via `lib/membership.ts`.
- **Email / push / voice** — trigger off `AgentLoopResult` + `LoopProgress`.

## Current status
Deterministic engine, full domain model, UI components, homepage section, and a
public demo at `/food-system-loop`. The result-page drop-in
(`<FoodSystemNextStepPanel/>`) is delivered but **not** yet mounted on the live
paid result page — that's a one-line follow-up.
