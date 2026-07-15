/**
 * EatoBiotics — "The science is global. The food is local."
 *
 * Bridges the visitor's country (the server-set `eb_country` cookie from
 * proxy.ts) to the cultural food layer in lib/foods-by-country.ts, so
 * recommendation copy speaks in the foods people actually eat — dahi and
 * lassi, not just yoghurt and kefir. Falls back to the western_eu set, which
 * matches the previous hardcoded copy, so unknown/absent countries see
 * exactly what they saw before.
 */

import { resolveMarket } from "./market"
import { foodSet, type FoodSet } from "./foods-by-country"

/** Country code (ISO-3166 alpha-2) → the market's cultural food examples. */
export function localFoods(country?: string | null): FoodSet {
  return foodSet(resolveMarket(country).foodProfile)
}

/** Read the eb_country cookie in the browser (null on server / when absent). */
export function browserCountry(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/(?:^|;\s*)eb_country=([A-Za-z]{2})(?:;|$)/)
  return match ? match[1].toUpperCase() : null
}

/**
 * The first two fermented examples as prose ("dahi (yoghurt) or idli & dosa
 * batter") — for sentences that previously said "yoghurt, kefir, or miso".
 */
export function fermentedPair(set: FoodSet): string {
  const parts = set.fermented.split(",").map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return "yoghurt or kefir"
  if (parts.length === 1) return parts[0]
  return `${parts[0]} or ${parts[1]}`
}

/** The first three prebiotic examples as prose ("oats, onions, and leeks"). */
export function prebioticTrio(set: FoodSet): string {
  const parts = set.prebiotic.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)
  if (parts.length === 0) return "oats, garlic, and lentils"
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
}
