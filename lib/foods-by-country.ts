/* ── Cultural food layer ──────────────────────────────────────────────────
 * Region-appropriate food examples keyed by the 8 FoodProfiles in lib/market.ts.
 * Used to localise the quiz (fermented examples), the mini report, and the
 * country landing pages so the "food system inside you" feels native. Authored
 * per profile (8 sets), not per country.
 */
import type { FoodProfile } from "./market"

export interface FoodSet {
  /** Fermented / live-culture examples (the probiotics engine). */
  fermented: string
  /** Fibre / prebiotic plant examples (the prebiotics engine). */
  prebiotic: string
  /** A signature, recognisable local fermented food (for headlines/social copy). */
  signature: string
}

export const FOOD_PROFILES: Record<FoodProfile, FoodSet> = {
  western_eu:     { fermented: "yoghurt, kefir, sauerkraut, sourdough", prebiotic: "oats, onions, leeks, apples, lentils", signature: "sauerkraut" },
  nordic:         { fermented: "skyr, viili, kefir, pickled vegetables", prebiotic: "rye, oats, barley, berries", signature: "skyr" },
  east_asian:     { fermented: "kimchi, miso, natto, tempeh", prebiotic: "burdock, seaweed, garlic, soybeans", signature: "kimchi" },
  south_asian:    { fermented: "dahi (yoghurt), idli & dosa batter, lassi, achar pickles", prebiotic: "lentils, chickpeas, onions, garlic, banana", signature: "dahi" },
  latin:          { fermented: "yoghurt, kefir, curtido, fermented salsas", prebiotic: "black beans, plantain, maize, cassava", signature: "curtido" },
  mena:           { fermented: "labneh, yoghurt, torshi pickles, kishk", prebiotic: "chickpeas, lentils, garlic, onions, dates", signature: "labneh" },
  anz:            { fermented: "yoghurt, kefir, sauerkraut, kombucha", prebiotic: "oats, kūmara (sweet potato), onions, apples", signature: "kombucha" },
  north_america:  { fermented: "yoghurt, kefir, sauerkraut, kombucha, pickles", prebiotic: "oats, beans, onions, apples", signature: "kombucha" },
}

export function foodSet(profile: FoodProfile): FoodSet {
  return FOOD_PROFILES[profile] ?? FOOD_PROFILES.western_eu
}
