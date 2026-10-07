/**
 * Contract for GET /api/mobile/v1/progress.
 *
 * Sibling composed read to GET /api/mobile/v1/today. The Progress screen
 * renders this object; it does not average meals, rank days, or derive a
 * focus. Explicitly absent:
 *   - personal per-Biotic numbers, bars, bands, colour-states, body-states
 *   - a ranked pathway / "focus today" verdict
 *   - meal-of-the-week, momentum, score-delta, buildAccountTwin
 *   - Stripe objects
 */
import { z } from "zod"
import { resolvedTierSchema } from "./mobile-today"
import { ritualDaySchema } from "./twin-state"

export const weekMealEntrySchema = z.object({
  at: z.string(),
  summary: z.string(),
  /** Meal Biotics Score for that plate. Never a person-level Biotic. */
  mealBioticsScore: z.number().int().min(0).max(100).optional(),
})

/**
 * One UTC calendar day in the rolling week. Meals and the ritual are facts
 * the server already assembled. The app prints them; it does not count,
 * average, or pick a winner.
 */
export const weekDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  label: z.string(),
  meals: z.array(weekMealEntrySchema),
  ritual: ritualDaySchema.nullable(),
  ritualLine: z.string().nullable(),
})

/**
 * How the app answers "what happened this week?" without a selector.
 *
 * logged   — counts the server already made (meals, check-in days)
 * absence  — truthful: nothing is on the record for this week
 */
export const weekSummarySchema = z.object({
  kind: z.enum(["logged", "absence"]),
  copy: z.string(),
})

export const mobileProgressResponseSchema = z.object({
  /** Person-level Biotics Score™ from the Assessment, or null if none. */
  bioticsScore: z.number().int().min(0).max(100).nullable(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  days: z.array(weekDaySchema),
  mealCount: z.number().int().min(0),
  checkInDays: z.number().int().min(0),
  summary: weekSummarySchema,
  entitlementTier: resolvedTierSchema,
})

export type MobileProgressResponse = z.infer<typeof mobileProgressResponseSchema>
export type WeekDay = z.infer<typeof weekDaySchema>
export type WeekMealEntry = z.infer<typeof weekMealEntrySchema>

/** Path the P4 route occupies. Do not assemble this client-side from /today. */
export const MOBILE_PROGRESS_PATH = "/api/mobile/v1/progress" as const
