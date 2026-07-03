/**
 * EatoBiotics — Twin evolution stages (pure, deterministic).
 *
 * The Twin visibly matures as real data accumulates: Meeting → Learning →
 * Attuned → Expert, keyed off how many meals it has learned from. The stage
 * drives the cockpit badge, the number of orbit rings around the stage orb,
 * and a "N meals until …" growth ladder. Also home to the generic, educational
 * after-meal journey steps shown after each QuickLog.
 */

import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"

export type EvolutionStageKey = "meeting" | "learning" | "attuned" | "expert"

export interface TwinEvolution {
  stage: EvolutionStageKey
  label: string
  /** 1–4 — drives orbit-ring count and particle richness. */
  index: number
  /** First-person one-liner for the badge tooltip / cockpit. */
  blurb: string
  /** The next stage and how many more meals it takes, null at Expert. */
  next: { label: string; remaining: number } | null
  /** Meals learned so far (the input signal, for display). */
  meals: number
}

const STAGES: { key: EvolutionStageKey; label: string; min: number; blurb: string }[] = [
  { key: "meeting", label: "Meeting", min: 0, blurb: "We've just met — show me meals and I'll start seeing you." },
  { key: "learning", label: "Learning", min: 3, blurb: "I'm learning your patterns meal by meal." },
  { key: "attuned", label: "Attuned", min: 10, blurb: "I know your rhythms now — my reads are getting sharp." },
  { key: "expert", label: "Expert", min: 25, blurb: "I know your Food System deeply. Let's keep building it." },
]

export function mealCount(twin: FoodSystemDigitalTwin): number {
  return twin.observations.filter((o) => o.kind === "meal_description" || o.kind === "meal_photo").length
}

export function twinEvolution(twin: FoodSystemDigitalTwin): TwinEvolution {
  const meals = mealCount(twin)
  let idx = 0
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (meals >= STAGES[i].min) {
      idx = i
      break
    }
  }
  const stage = STAGES[idx]
  const nextStage = STAGES[idx + 1] ?? null
  return {
    stage: stage.key,
    label: stage.label,
    index: idx + 1,
    blurb: stage.blurb,
    next: nextStage ? { label: nextStage.label, remaining: nextStage.min - meals } : null,
    meals,
  }
}

/* ── After-meal journey (generic, educational, non-medical) ──────────────── */

export interface AfterMealStep {
  at: string
  title: string
  detail: string
  color: string
}

export const AFTER_MEAL_STEPS: AfterMealStep[] = [
  {
    at: "Now",
    title: "First contact",
    detail: "Chewing and stomach acids begin breaking the meal down — digestion is already underway.",
    color: "#F5C518",
  },
  {
    at: "~4h",
    title: "Nutrients absorbed",
    detail: "In the small intestine, most nutrients are typically absorbed — the fibre travels on.",
    color: "#A8E063",
  },
  {
    at: "~12h",
    title: "Your microbes feast",
    detail: "In the colon, trillions of microbes ferment the fibre — this is where prebiotics do their work.",
    color: "#4CB648",
  },
  {
    at: "~24h",
    title: "The give-back",
    detail: "Well-fed microbes typically produce postbiotic compounds associated with comfort and steady energy.",
    color: "#2DAA6E",
  },
]
