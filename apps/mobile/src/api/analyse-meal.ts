/**
 * POST /api/analyse-meal from the companion, bound to this app's origin.
 * Cap and rate-limit wording comes from the server. Do not invent a local
 * allowance table.
 */
import {
  MOBILE_BEARER_ROUTES,
  postAnalyseMeal as postAt,
  type AnalyseMealRequest,
  type FetchFn,
  type LogError,
} from "@eatobiotics/contracts"
import { SITE_URL } from "../config"

export {
  presentMealScanResult,
  createMealScanController,
  type AnalyseMealResult,
  type MealScanView,
} from "@eatobiotics/contracts"

const ANALYSE_MEAL_URL = `${SITE_URL}${MOBILE_BEARER_ROUTES.analyseMeal}`

export function analyseMealUrl(): string {
  return ANALYSE_MEAL_URL
}

export function postAnalyseMeal(
  accessToken: string,
  body: AnalyseMealRequest,
  opts: { fetchImpl?: FetchFn; logError?: LogError } = {},
) {
  return postAt(ANALYSE_MEAL_URL, accessToken, body, opts)
}
