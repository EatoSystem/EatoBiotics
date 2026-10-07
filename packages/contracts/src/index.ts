export {
  ritualDaySchema,
  twinStatePutSchema,
  twinStateGetSchema,
  RITUAL_DAY_KEYS,
  EMPTY_RITUAL,
  localDayKey,
  normaliseRitualDay,
  toggleRitualKey,
  incomingDayWins,
  pickTodayRitual,
  buildTwinStatePut,
  type TwinStatePut,
  type TwinStateGet,
  type RitualDayContract,
} from "./twin-state"

export {
  getTwinState,
  putTwinState,
  memoryKv,
  createCheckInController,
  CHECK_IN_PERSIST_KEY,
  type TwinStateResult,
  type LogError,
  type FetchFn,
  type SyncStatus,
  type CheckInSnapshot,
  type KvStore,
} from "./twin-state-client"

export {
  analyseMealRequestSchema,
  analyseMealNutritionSchema,
  analyseMealFoodSchema,
  analyseMealResponseSchema,
  type AnalyseMealRequest,
  type AnalyseMealResponse,
} from "./analyse-meal"

export {
  presentMealScanResult,
  postAnalyseMeal,
  createMealScanController,
  MEAL_SCAN_PERSIST_KEY,
  type AnalyseMealFailureReason,
  type AnalyseMealResult,
  type MealScanView,
  type MealScanStatus,
  type MealScanSnapshot,
} from "./analyse-meal-client"

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
  weekMealEntrySchema,
  weekDaySchema,
  weekSummarySchema,
  mobileProgressResponseSchema,
  MOBILE_PROGRESS_PATH,
  type MobileProgressResponse,
  type WeekDay,
  type WeekMealEntry,
} from "./mobile-progress"

export {
  AUTH_HEADER,
  MOBILE_AUTH_SCHEME,
  MOBILE_AUTH_CALLBACK_PATH,
  MOBILE_MAGIC_LINK_CLIENT,
  type BearerSession,
} from "./auth"

/**
 * Routes the native client may call in v1. Everything else stays on the web.
 * Writes stay granular (twin-state, analyse-meal). Today and progress are
 * the composed reads. `/api/feedback` is gate-allowlisted separately; it is
 * auth-optional.
 */
export const MOBILE_BEARER_ROUTES = {
  twinState: "/api/twin-state",
  analyseMeal: "/api/analyse-meal",
  today: "/api/mobile/v1/today",
  progress: "/api/mobile/v1/progress",
} as const

/** Password-gate paths a native client needs. Do not grow this toward ~101 routes. */
export const MOBILE_GATE_ALLOWLIST = [
  "/api/twin-state",
  "/api/analyse-meal",
  "/api/mobile/v1/today",
  "/api/mobile/v1/progress",
  "/api/feedback",
] as const
