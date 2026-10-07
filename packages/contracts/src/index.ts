export {
  ritualDaySchema,
  twinStatePutSchema,
  type TwinStatePut,
  type RitualDayContract,
} from "./twin-state"

export {
  analyseMealRequestSchema,
  analyseMealNutritionSchema,
  analyseMealFoodSchema,
  analyseMealResponseSchema,
  type AnalyseMealRequest,
  type AnalyseMealResponse,
} from "./analyse-meal"

export {
  resolvedTierSchema,
  streakSchema,
  nextStepSchema,
  recentActivityEntrySchema,
  mobileTodayResponseSchema,
  MOBILE_TODAY_PATH,
  type MobileTodayResponse,
} from "./mobile-today"

export { AUTH_HEADER, type BearerSession } from "./auth"

/** Routes the native client may call in v1. Everything else stays on the web. */
export const MOBILE_BEARER_ROUTES = {
  twinState: "/api/twin-state",
  analyseMeal: "/api/analyse-meal",
} as const
