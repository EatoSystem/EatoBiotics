/**
 * Meal capture queue. A plate can be described or photographed while
 * offline; the POST runs when the device can reach /api/analyse-meal.
 * Queued / sent / failed are visible on the meal screen.
 */
import {
  MOBILE_BEARER_ROUTES,
  createMealScanController as create,
  type KvStore,
  type FetchFn,
  type LogError,
} from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

export {
  presentMealScanResult,
  memoryKv,
  MEAL_SCAN_PERSIST_KEY,
  type MealScanStatus,
  type MealScanSnapshot,
  type KvStore,
} from "@eatobiotics/contracts"

export function createMealScanController(deps: {
  accessToken: string
  kv: KvStore
  fetchImpl?: FetchFn
  logError?: LogError
}) {
  return create({
    ...deps,
    analyseMealUrl: `${SITE_URL}${MOBILE_BEARER_ROUTES.analyseMeal}`,
  })
}
