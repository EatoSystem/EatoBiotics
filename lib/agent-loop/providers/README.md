# Agent Loop — intelligence providers

The loop engine depends only on the `LoopIntelligenceProvider` interface
(`provider.ts`). AI is an **interchangeable execution engine**, not a dependency.
The default is `DeterministicProvider` (rule-based, no network) — the whole
product works with zero AI.

## The contract

```ts
interface LoopIntelligenceProvider {
  readonly id: string // recorded in LoopUsage.engine
  analyse(observation, ctx): AgentLoopAnalysis | Promise<AgentLoopAnalysis>
  recommend(analysis, ctx): AgentLoopRecommendation | Promise<AgentLoopRecommendation>
}
```

`ctx` carries the `system`, the `FoodSystemBaseline`, the turn `history`, and
`FoodSystemMemory`. Both methods may be sync or async — the engine awaits either.

## Adding a Claude provider (sketch)

```ts
// providers/claude.ts
import Anthropic from "@anthropic-ai/sdk"
import { guardAiUsage } from "@/lib/ai-guard"
import type { LoopIntelligenceProvider, ProviderContext } from "./provider"

export class ClaudeProvider implements LoopIntelligenceProvider {
  readonly id = "claude"
  async analyse(observation, ctx: ProviderContext) {
    await guardAiUsage(userId, "agent_loop")          // reuse the cost cap
    // call Claude with a non-diagnostic system prompt built from ctx.baseline,
    // parse to AgentLoopAnalysis, then run isNonDiagnostic() as a guardrail
  }
  async recommend(analysis, ctx) { /* one food-first action; withDisclaimer() */ }
}
```

Swap it in where the loop is run:

```ts
const provider = useAi ? new ClaudeProvider() : deterministicProvider
await runLoop(session, observation, provider)
```

Nothing in `engine.ts`, the domain models, or the UI changes. The same path
applies to OpenAI or the Vercel AI Gateway. Meal-image analysis is just a new
`ObservationKind` feeding the same `analyse()`.

## Guardrails always apply

Whatever the provider, recommendations must stay food-first and non-diagnostic.
Run provider output through `isNonDiagnostic()` / `withDisclaimer()` from
`../safety.ts` before returning it.
