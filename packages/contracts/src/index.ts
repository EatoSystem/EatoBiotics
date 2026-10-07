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

export {
  AUTH_HEADER,
  MOBILE_AUTH_SCHEME,
  MOBILE_AUTH_CALLBACK_PATH,
  MOBILE_MAGIC_LINK_CLIENT,
  type BearerSession,
} from "./auth"

/**
 * Routes the native client may call in v1. Everything else stays on the web.
 * Writes stay granular (twin-state, analyse-meal). Today is the composed read.
 * `/api/feedback` is gate-allowlisted separately; it is auth-optional.
 */
export const MOBILE_BEARER_ROUTES = {
  twinState: "/api/twin-state",
  analyseMeal: "/api/analyse-meal",
  today: "/api/mobile/v1/today",
} as const

/** Password-gate paths a native client needs. Do not grow this toward ~101 routes. */
export const MOBILE_GATE_ALLOWLIST = [
  "/api/twin-state",
  "/api/analyse-meal",
  "/api/mobile/v1/today",
  "/api/feedback",
] as const
