/**
 * How GET /api/mobile/v1/today answers "what should I focus on today?"
 *
 * There is no authorised selector. This module does not take per-Biotic
 * scores, does not rank Feed / Seed / Rejuvenate, and does not call
 * focus-today. The three kinds match the contract:
 *
 *   general-next-step  — the same non-personalised daily action the web loop uses
 *   absence            — truthful: we do not have a personalised focus
 *   reviewed-material  — the unranked action framework, already in vocabulary
 */
import { ACTIONS_LINE } from "@eatobiotics/vocabulary"
import type { MobileTodayResponse } from "@eatobiotics/contracts"

export type NextStep = MobileTodayResponse["nextStep"]

export const NEXT_STEP_BEGIN = "Log a meal to begin."
export const NEXT_STEP_KEEP = "Log a meal to keep your streak alive."
export const NEXT_STEP_ABSENCE = "No personalised focus yet."
export const NEXT_STEP_REVIEWED =
  `${ACTIONS_LINE} — how a person acts, not a ranking of what to do today.`

export type NextStepInput = {
  loggedToday: boolean
  currentStreak: number
  hasBioticsScore: boolean
}

export function composeNextStep(input: NextStepInput): NextStep {
  if (!input.loggedToday) {
    return {
      kind: "general-next-step",
      copy: input.currentStreak > 0 ? NEXT_STEP_KEEP : NEXT_STEP_BEGIN,
    }
  }
  if (!input.hasBioticsScore) {
    return { kind: "absence", copy: NEXT_STEP_ABSENCE }
  }
  return { kind: "reviewed-material", copy: NEXT_STEP_REVIEWED }
}
