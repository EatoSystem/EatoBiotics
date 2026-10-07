import { MOBILE_BEARER_ROUTES, MOBILE_TODAY_PATH } from "@eatobiotics/contracts"

/**
 * Public origin only. EXPO_PUBLIC_* is printed on a billboard.
 * No service-role key, no Stripe secret, no Anthropic key, no CRON_SECRET.
 */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

/** Routes the companion may call. Writes stay granular on these two. */
export const BEARER_ROUTES = MOBILE_BEARER_ROUTES

/** Documented for P1. Do not fetch this path from P0. */
export const FUTURE_TODAY_PATH = MOBILE_TODAY_PATH
