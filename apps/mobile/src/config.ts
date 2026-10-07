import { MOBILE_BEARER_ROUTES, MOBILE_TODAY_PATH } from "@eatobiotics/contracts"

/**
 * Public origin and public Supabase anon credentials only.
 * EXPO_PUBLIC_* is printed on a billboard.
 * No service-role key, no Stripe secret, no Anthropic key, no CRON_SECRET.
 */
export const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? "https://eatobiotics.com"

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? ""
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ""

/** Routes the companion may call. Writes stay granular on twin-state / analyse-meal. */
export const BEARER_ROUTES = MOBILE_BEARER_ROUTES

export const TODAY_PATH = MOBILE_TODAY_PATH
