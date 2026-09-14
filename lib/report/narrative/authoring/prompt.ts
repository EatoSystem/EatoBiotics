import { NARRATIVE_PROMPT_VERSION } from "./contract"

/**
 * The prompt, as data — Phase 4A-S3.
 *
 * ══ NOTHING HERE IS WIRED ═══════════════════════════════════════════════════
 *
 * S3 makes no provider call. This module exports reviewed copy and reviewed
 * settings so that the wording is under version control, reviewable in a diff,
 * and pinned by `NARRATIVE_PROMPT_VERSION` before anybody is in a position to
 * send it anywhere. The later runtime boundary consumes it; this phase does
 * not.
 *
 * ══ WHY THE RULES ARE A LIST AND NOT A PARAGRAPH ════════════════════════════
 *
 * Because a paragraph can be softened one clause at a time and still read like
 * the original. As a list, each prohibition is an addressable item a test can
 * assert the presence of, and deleting one is a visible deletion rather than
 * an edit.
 *
 * ══ AND WHY THE PROMPT IS NOT A SAFETY CONTROL ══════════════════════════════
 *
 * None of this is relied upon. Every rule below is also enforced
 * deterministically in `validate.ts`, which is what actually decides whether a
 * rewrite is used. The prompt exists to make a good rewrite likely, not to make
 * a bad one impossible — a model that ignores every line here changes nothing
 * except how often the layer falls back to canonical wording.
 */

export const NARRATIVE_PROMPT_ROLE =
  "You rewrite one approved sentence for readability. You are not a health adviser, a nutritionist or an analyst, and you are not assessing anyone. You will be shown exactly one sentence. It has already been reviewed and approved; your only task is to make it read more naturally."

/** Each rule mirrors a deterministic check. Deleting one is a visible deletion. */
export const NARRATIVE_PROMPT_RULES: readonly string[] = [
  "Do not add information.",
  "Do not remove information.",
  "Do not explain, interpret, or give a reason for anything.",
  "Do not give advice or make a recommendation.",
  "Do not mention any food, nutrient, body system, measurement or health condition that is not already in the sentence.",
  "Keep every number and every reference to time exactly as written.",
  "Keep every negative exactly as written — if the sentence says something does not happen, your version must not say it does.",
  "Keep the same degree of certainty: if the sentence says something may be so, your version must not say it is.",
  "Keep who is speaking and who is being described exactly as written — a sentence reporting what the customer told us must still report what the customer told us, never what we found or concluded.",
  "Return one sentence, and only one sentence.",
]

/**
 * The safe action, stated explicitly.
 *
 * Deliberate: giving a model a permitted way to do nothing is the cheapest way
 * to reduce the pressure to embellish, and an unchanged sentence passes every
 * check by construction.
 */
export const NARRATIVE_PROMPT_SAFE_ACTION =
  "If the sentence already reads well, return it unchanged. Returning it unchanged is always an acceptable answer."

export const NARRATIVE_PROMPT_OUTPUT = "Return only the structured output."

export function narrativeSystemPrompt(): string {
  return [
    NARRATIVE_PROMPT_ROLE,
    NARRATIVE_PROMPT_RULES.join(" "),
    NARRATIVE_PROMPT_SAFE_ACTION,
    NARRATIVE_PROMPT_OUTPUT,
  ].join("\n\n")
}

/**
 * Generation settings.
 *
 * `temperature: 0` because this is a constrained transformation, not a
 * creative one. `maxTokens` caps a runaway rather than shaping the answer —
 * the length that matters is enforced by the validator, not by a token budget.
 * Structured output is mandatory so that malformed output becomes a typed
 * rejection instead of a parsing adventure.
 */
export const NARRATIVE_GENERATION_SETTINGS = {
  promptVersion: NARRATIVE_PROMPT_VERSION,
  temperature: 0,
  maxTokens: 256,
  structuredOutput: true,
  /** The only shape a response may take. Anything else is `malformed-response`. */
  responseShape: { rewritten: "string" },
} as const

/** The user turn: the sentence, and nothing else. */
export function narrativeUserPrompt(text: string): string {
  return text
}
