/**
 * Contract for GET /api/mobile/v1/today.
 *
 * Implemented in `app/api/mobile/v1/today`. Parsed on both sides. The app
 * renders a result it did not compute. Five routes assembled client-side
 * is how a selector hides.
 *
 * Explicitly absent from this payload:
 *   - personal per-Biotic numbers, bars, bands, colour-states, body-states
 *   - a ranked pathway / "focus today" verdict (focus-today is fail-closed)
 *   - Stripe objects, entitlement decisions, AI orchestration
 */
import { z } from "zod"
import { ritualDaySchema } from "./twin-state"

/** Resolved tier string. The app does not interpret Stripe state. */
export const resolvedTierSchema = z.enum([
  "free",
  "trial",
  "member",
  "grow",
  "restore",
  "transform",
])

export const streakSchema = z.object({
  current: z.number().int().min(0),
  longest: z.number().int().min(0),
  loggedToday: z.boolean(),
  daysSinceLast: z.number().int().min(0).nullable(),
})

/**
 * How the app answers "what should I focus on today?" without a selector.
 *
 * reviewed-material  — non-ranked, already-reviewed copy
 * general-next-step  — a general action, not a personalised priority
 * absence            — truthful "we don't have a personalised focus yet"
 */
export const nextStepSchema = z.object({
  kind: z.enum(["reviewed-material", "general-next-step", "absence"]),
  copy: z.string(),
})

export const recentActivityEntrySchema = z.object({
  kind: z.enum(["meal", "ritual"]),
  at: z.string(),
  summary: z.string(),
  /** Meal Biotics Score for a meal row. Never a person-level Biotic. */
  mealBioticsScore: z.number().int().min(0).max(100).optional(),
})

export const mobileTodayResponseSchema = z.object({
  /** Person-level Biotics Score™ from the Assessment, or null if none. */
  bioticsScore: z.number().int().min(0).max(100).nullable(),
  streak: streakSchema,
  ritualToday: ritualDaySchema.nullable(),
  recentActivity: z.array(recentActivityEntrySchema),
  nextStep: nextStepSchema,
  entitlementTier: resolvedTierSchema,
})

export type MobileTodayResponse = z.infer<typeof mobileTodayResponseSchema>

/** Path the P1 route will occupy. Do not call it from P0. */
export const MOBILE_TODAY_PATH = "/api/mobile/v1/today" as const
