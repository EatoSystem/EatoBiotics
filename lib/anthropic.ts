import Anthropic from "@anthropic-ai/sdk"

/* ── Shared Anthropic client ─────────────────────────────────────────────
   Import this instead of creating per-route instances.

   The prompt-caching-2024-07-31 beta header activates cache_control blocks
   on system prompts and user messages — cuts input token costs by ~90% on
   repeat calls where the large static portions hit the cache.

   Cache TTL: 5 minutes (ephemeral). The consult system prompt (~3,000 tokens)
   and the analyse BASE_PROMPT (~750 tokens) are both good cache candidates.
──────────────────────────────────────────────────────────────────────── */

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    "anthropic-beta": "prompt-caching-2024-07-31",
  },
})

export default anthropic
