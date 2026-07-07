/**
 * EatoBiotics Agent Loop — system registry.
 *
 * Foundations (You / Family) and the specialised systems that layer on top.
 * Four specialised systems are live today (they have real assessments in
 * `lib/assessment/registry.ts`); the other four are roadmap definitions
 * (`status: "planned"`) — metadata + loop config only, never scored with
 * fabricated data.
 *
 * The cardinal rule lives here and is enforced by the engine: **no specialised
 * system runs without a You/Family baseline.**
 */

import type { AddOnSystem, LoopSystemKey, SpecialisedKey } from "./types"
import { HEALTH_SYSTEM_KEYS } from "@/lib/assessment/registry"

export const FOUNDATION_SYSTEM: AddOnSystem = {
  key: "foundation",
  label: "Food System",
  kind: "foundation",
  status: "live",
  requiresFoundation: false,
  loop: {
    focusBiotic: "prebiotics",
    observes: ["meals", "diversity", "how you feel day to day"],
  },
  blurb: "Your You or Family baseline — the parent of every other loop.",
}

export const SPECIALISED_SYSTEMS: Record<SpecialisedKey, AddOnSystem> = {
  stability: {
    key: "stability",
    label: "Stability",
    kind: "specialised",
    status: "live",
    requiresFoundation: true,
    loop: { focusBiotic: "postbiotics", observes: ["digestive comfort", "consistency", "bloating", "urgency", "rhythm"] },
    blurb: "Digestive comfort and rhythm, supported by food patterns.",
  },
  glucose: {
    key: "glucose",
    label: "Glucose",
    kind: "specialised",
    status: "live",
    requiresFoundation: true,
    loop: { focusBiotic: "prebiotics", observes: ["energy", "cravings", "meal timing", "carbohydrate quality"] },
    blurb: "Steadier energy and fewer cravings through food choices.",
  },
  mind: {
    key: "mind",
    label: "Mind",
    kind: "specialised",
    status: "live",
    requiresFoundation: true,
    loop: { focusBiotic: "probiotics", observes: ["mood", "focus", "gut-brain support", "food rhythm"] },
    blurb: "Mood and focus, supported through the gut-brain connection.",
  },
  performance: {
    key: "performance",
    label: "Performance",
    kind: "specialised",
    status: "live",
    requiresFoundation: true,
    loop: { focusBiotic: "postbiotics", observes: ["fuel", "recovery", "protein quality", "training support"] },
    blurb: "Fuel and recovery for training, food-first.",
  },
  recovery: {
    key: "recovery",
    label: "Recovery",
    kind: "specialised",
    status: "planned",
    requiresFoundation: true,
    loop: { focusBiotic: "postbiotics", observes: ["resilience", "replenishment", "post-exertion meals"] },
    blurb: "Replenishment and resilience after exertion. (Coming soon.)",
  },
  longevity: {
    key: "longevity",
    label: "Longevity",
    kind: "specialised",
    status: "planned",
    requiresFoundation: true,
    loop: { focusBiotic: "prebiotics", observes: ["long-term food diversity", "anti-inflammatory patterns"] },
    blurb: "Long-term diversity and anti-inflammatory food patterns. (Coming soon.)",
  },
  sleep: {
    key: "sleep",
    label: "Sleep",
    kind: "specialised",
    status: "planned",
    requiresFoundation: true,
    loop: { focusBiotic: "probiotics", observes: ["evening meals", "rhythm", "overnight recovery"] },
    blurb: "Evening rhythm and overnight recovery, supported by food. (Coming soon.)",
  },
  heart: {
    key: "heart",
    label: "Heart",
    kind: "specialised",
    status: "planned",
    requiresFoundation: true,
    loop: { focusBiotic: "prebiotics", observes: ["fibre", "fats", "sodium awareness", "cardiovascular food patterns"] },
    blurb: "Cardiovascular-supportive food patterns: fibre, fats, sodium awareness. (Coming soon.)",
  },
}

export const SPECIALISED_KEYS: SpecialisedKey[] = [
  "stability",
  "glucose",
  "mind",
  "performance",
  "recovery",
  "longevity",
  "sleep",
  "heart",
]

export function getSystem(key: LoopSystemKey): AddOnSystem {
  if (key === "foundation") return FOUNDATION_SYSTEM
  return SPECIALISED_SYSTEMS[key]
}

export function isLiveSystem(key: LoopSystemKey): boolean {
  return getSystem(key).status === "live"
}

/** Live specialised systems — the ones with a real assessment behind them. */
export function liveSpecialisedSystems(): AddOnSystem[] {
  return SPECIALISED_KEYS.filter((k) => SPECIALISED_SYSTEMS[k].status === "live").map(
    (k) => SPECIALISED_SYSTEMS[k],
  )
}

export function plannedSpecialisedSystems(): AddOnSystem[] {
  return SPECIALISED_KEYS.filter((k) => SPECIALISED_SYSTEMS[k].status === "planned").map(
    (k) => SPECIALISED_SYSTEMS[k],
  )
}

/** Sanity bridge: every live specialised system must have a registry add-on. */
export function liveSystemsMatchRegistry(): boolean {
  const live = new Set(liveSpecialisedSystems().map((s) => s.key))
  return HEALTH_SYSTEM_KEYS.every((k) => live.has(k)) && live.size === HEALTH_SYSTEM_KEYS.length
}
