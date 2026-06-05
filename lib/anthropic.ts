import Anthropic from "@anthropic-ai/sdk"

/* ── Shared Anthropic client (lazily constructed) ────────────────────────
   Built on first use, NOT at import time, so `next build` and unrelated
   routes don't fail when ANTHROPIC_API_KEY is absent. `getAnthropic()` throws
   if the key is missing; the `anthropic` export is a back-compat proxy so
   existing `anthropic.messages.create(...)` call sites work unchanged while
   construction defers to first property access (request time).

   The prompt-caching-2024-07-31 beta header activates cache_control blocks
   on system prompts and user messages — cuts input token costs by ~90% on
   repeat calls where the large static portions hit the cache.
──────────────────────────────────────────────────────────────────────── */

let _client: Anthropic | null = null

export function getAnthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set")
    _client = new Anthropic({
      apiKey,
      defaultHeaders: { "anthropic-beta": "prompt-caching-2024-07-31" },
    })
  }
  return _client
}

export const anthropic: Anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    const client = getAnthropic() as unknown as Record<string | symbol, unknown>
    const value = client[prop]
    return typeof value === "function" ? value.bind(client) : value
  },
})

/* ── Model selection ─────────────────────────────────────────────────────
   Single source of truth for the Claude model used across all API routes.
   Override per-environment with the CLAUDE_MODEL env var. (Plain env string —
   safe to read at module load.)
──────────────────────────────────────────────────────────────────────── */

export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-20250514"

export default anthropic
