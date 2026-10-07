/**
 * How GET /api/mobile/v1/progress answers "what happened this week?"
 *
 * Counts only — meals logged and days with a check-in. This module does not
 * take per-Biotic scores, does not rank days or meals, does not emit
 * momentum / delta / "meal of the week", and does not call focus-today.
 */
import type { MobileProgressResponse } from "@eatobiotics/contracts"

export type WeekSummary = MobileProgressResponse["summary"]

export const WEEK_ABSENCE = "Nothing logged this week yet."

export type WeekCopyInput = {
  mealCount: number
  checkInDays: number
}

function mealsPhrase(n: number): string {
  return n === 1 ? "1 meal" : `${n} meals`
}

function checkInsPhrase(n: number): string {
  return n === 1 ? "1 check-in" : `${n} check-ins`
}

export function composeWeekSummary(input: WeekCopyInput): WeekSummary {
  if (input.mealCount === 0 && input.checkInDays === 0) {
    return { kind: "absence", copy: WEEK_ABSENCE }
  }
  if (input.mealCount > 0 && input.checkInDays > 0) {
    return {
      kind: "logged",
      copy: `${mealsPhrase(input.mealCount)} and ${checkInsPhrase(input.checkInDays)} this week.`,
    }
  }
  if (input.mealCount > 0) {
    return { kind: "logged", copy: `${mealsPhrase(input.mealCount)} this week.` }
  }
  return { kind: "logged", copy: `${checkInsPhrase(input.checkInDays)} this week.` }
}
