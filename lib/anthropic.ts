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

/* ── Model selection ─────────────────────────────────────────────────────
   Single source of truth for the Claude model used across all API routes.
   Override per-environment with the CLAUDE_MODEL env var without touching
   code. Centralising this means a model upgrade is a one-line change rather
   than a 20-file find-and-replace.
──────────────────────────────────────────────────────────────────────── */

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514"

export default anthropic
