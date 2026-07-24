/**
 * The one place a meal is scored. Builds the Claude message (text and/or
 * image), calls the model deterministically (temperature 0 — same meal, same
 * score), parses the JSON, and detects the honest-refusal escape hatch. Pure
 * and route-agnostic: /api/analyse-meal (and future adapters) call this instead
 * of each re-implementing the prompt + parse.
 */

import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic"
import { ANALYSIS_SYSTEM } from "./prompt"
import type { AnalysisOutcome, AnalysisResult } from "./types"

export interface AnalysisInput {
  description?: string
  /** base64 data URL: "data:image/jpeg;base64,..." */
  image?: string
  mealTypeHint?: string
}

export async function runAnalysis(input: AnalysisInput): Promise<AnalysisOutcome> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const msgContent: any[] = []

  if (input.image) {
    const match = input.image.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
      msgContent.push({ type: "image", source: { type: "base64", media_type: match[1], data: match[2] } })
    }
  }

  msgContent.push({
    type: "text",
    text: input.description
      ? `Analyse this meal: ${input.description}. Meal type hint: ${input.mealTypeHint ?? "unknown"}.`
      : `Analyse the meal shown in this photo. Meal type hint: ${input.mealTypeHint ?? "unknown"}.`,
  })

  try {
    const response = await anthropic.messages.create({
      model:      CLAUDE_MODEL,
      // Room for the foods[] evidence list on top of scores + insight + tags.
      max_tokens: 1000,
      // Deterministic sampling: this is a rubric-scoring task — the same meal
      // must score the same on every run (analysis credibility; issue #157).
      temperature: 0,
      system:     [{ type: "text", text: ANALYSIS_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages:   [{ role: "user", content: msgContent }],
    })
    const text = response.content[0]?.type === "text" ? response.content[0].text : ""
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No JSON found in Claude response")
    const parsed = JSON.parse(jsonMatch[0])
    // Graceful ambiguity (issue #157): an unreadable input gets an honest
    // refusal, not fabricated scores.
    if (typeof parsed.error === "string") {
      return { status: "unreadable", message: parsed.error }
    }
    return { status: "ok", result: parsed as AnalysisResult }
  } catch (err) {
    console.error("[analysis] Claude error:", err)
    return { status: "error" }
  }
}
