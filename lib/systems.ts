/**
 * lib/systems.ts — the EatoBiotics Systems catalog (customer-facing source of truth).
 *
 * One Food System, supported through three families of systems:
 *   - Foundation (You, Family) — create the Food System baseline every other system builds on.
 *   - Health (Stability, Glucose, Mind, Performance, Recovery, Longevity) — strengthen a
 *     specific area.
 *   - Life (Pregnancy, Birth, Baby) — support major life transitions, food-first and
 *     non-medical.
 *
 * Architecture rule (already enforced in the assessment journey + agent-loop engine):
 * every non-foundation system inherits from a You or Family foundation — none run standalone.
 *
 * This catalog is the presentation/grouping source of truth (homepage Systems section, account
 * "Explore Your Food System", landing scaffolds). It does not replace the behavioural
 * assessment/journey/checkout logic in `lib/assessment/*`; `assessmentRoute` mirrors those
 * routes for the systems that have a real assessment, guarded by `tests/unit/systems.test.ts`.
 */

import {
  User, Users, Compass, Activity, Brain, Dumbbell,
  HeartPulse, Sparkles, Flower2, Sun, Baby,
  type LucideIcon,
} from "lucide-react"

export type SystemFamily = "foundation" | "health" | "life"

export type FoundationSystemKey = "you" | "family"
export type HealthSystemKey =
  | "stability" | "glucose" | "mind" | "performance" | "recovery" | "longevity"
export type LifeSystemKey = "pregnancy" | "birth" | "baby"
/** Reserved for later — not surfaced in the product yet. */
export type FutureLifeSystemKey = "child" | "teen" | "adult" | "healthy-ageing"

export type SystemKey = FoundationSystemKey | HealthSystemKey | LifeSystemKey

export type SystemStatus = "live" | "planned" | "scaffold"
export type SafetyLevel = "standard" | "sensitive"

export interface SystemDef {
  key: SystemKey
  family: SystemFamily
  /** Short label, e.g. "Stability". */
  label: string
  /** Full product name, e.g. "The Stability Food System". */
  productName: string
  /** One-line positioning. */
  tagline: string
  /** What it focuses on. */
  focus: string
  /** A sentence of description for cards. */
  description: string
  /** Landing page route. */
  href: string
  /** Assessment route — only for systems with a real assessment (live). */
  assessmentRoute?: string
  status: SystemStatus
  /** Every non-foundation system inherits from a foundation. */
  requiresFoundation: boolean
  allowedFoundations: FoundationSystemKey[]
  /** Where a Life system may later bridge (PregMonth / DevelopMonth). */
  futureBridge?: "PregMonth" | "DevelopMonth"
  safetyLevel: SafetyLevel
  icon: LucideIcon
  accent: string
  gradient: string
  image?: string
}

const BOTH: FoundationSystemKey[] = ["you", "family"]

export const SYSTEMS: Record<SystemKey, SystemDef> = {
  /* ── Foundation ── */
  you: {
    key: "you", family: "foundation", label: "You", productName: "Your Food System",
    tagline: "The Food System Inside You.", focus: "Your personal Food System baseline.",
    description: "Your personal Food System foundation — score, report, and improvement priorities.",
    href: "/you", assessmentRoute: "/assessment/you", status: "live",
    requiresFoundation: false, allowedFoundations: [], safetyLevel: "standard",
    icon: User, accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    image: "/images/hero-gut.png",
  },
  family: {
    key: "family", family: "foundation", label: "Family", productName: "The Family Food System",
    tagline: "The Food System Inside Your Family.", focus: "Your household Food System baseline.",
    description: "Your household Food System foundation — routines, habits, and shared priorities.",
    href: "/family", assessmentRoute: "/assessment/family", status: "live",
    requiresFoundation: false, allowedFoundations: [], safetyLevel: "standard",
    icon: Users, accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    image: "/images/family-hero.png",
  },

  /* ── Health ── */
  stability: {
    key: "stability", family: "health", label: "Stability", productName: "The Stability Food System",
    tagline: "Digestive comfort and rhythm, supported by food.",
    focus: "Digestive comfort, consistency, bloating, urgency, rhythm.",
    description: "Deeper support for digestive calm, consistency, and confidence.",
    href: "/stability", assessmentRoute: "/stability/assessment", status: "live",
    requiresFoundation: true, allowedFoundations: BOTH, safetyLevel: "standard",
    icon: Compass, accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    image: "/images/stability-hero.png",
  },
  glucose: {
    key: "glucose", family: "health", label: "Glucose", productName: "The Glucose Food System",
    tagline: "Steadier energy and fewer cravings, through food.",
    focus: "Energy, cravings, meal timing, carbohydrate quality, steadier food patterns.",
    description: "Deeper support for steadier energy, cravings, and glucose rhythm.",
    href: "/glucose", assessmentRoute: "/glucose/assessment", status: "live",
    requiresFoundation: true, allowedFoundations: BOTH, safetyLevel: "standard",
    icon: Activity, accent: "var(--icon-orange)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    image: "/images/eatobetics-hero.webp",
  },
  mind: {
    key: "mind", family: "health", label: "Mind", productName: "The Mind Food System",
    tagline: "Mood and focus, through the gut-brain connection.",
    focus: "Mood, focus, gut-brain support, food rhythm.",
    description: "Deeper support for food, gut, mood, focus, and mental clarity.",
    href: "/mind", assessmentRoute: "/assessment-mind", status: "live",
    requiresFoundation: true, allowedFoundations: BOTH, safetyLevel: "standard",
    icon: Brain, accent: "var(--icon-teal)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    image: "/images/mind-hero.png",
  },
  performance: {
    key: "performance", family: "health", label: "Performance", productName: "The Performance Food System",
    tagline: "Fuel and recovery for training, food-first.",
    focus: "Fuel, recovery, protein quality, training support.",
    description: "Deeper support for energy, recovery, movement, and output.",
    href: "/performance", assessmentRoute: "/performance-assessment", status: "live",
    requiresFoundation: true, allowedFoundations: BOTH, safetyLevel: "standard",
    icon: Dumbbell, accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    image: "/images/eatosports-hero.webp",
  },
  recovery: {
    key: "recovery", family: "health", label: "Recovery", productName: "The Recovery Food System",
    tagline: "Replenishment and resilience after exertion.",
    focus: "Resilience, replenishment, post-exertion meals, repair and rhythm.",
    description: "Support for repair, replenishment, and rhythm after exertion.",
    href: "/recovery", status: "scaffold",
    requiresFoundation: true, allowedFoundations: BOTH, safetyLevel: "standard",
    icon: HeartPulse, accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
  longevity: {
    key: "longevity", family: "health", label: "Longevity", productName: "The Longevity Food System",
    tagline: "Long-term diversity and anti-inflammatory patterns.",
    focus: "Long-term food diversity, anti-inflammatory patterns, ageing well.",
    description: "Support for long-term diversity and food patterns associated with ageing well.",
    href: "/longevity", status: "scaffold",
    requiresFoundation: true, allowedFoundations: BOTH, safetyLevel: "standard",
    icon: Sparkles, accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-lime))",
  },

  /* ── Life (education-only, sensitive) ── */
  pregnancy: {
    key: "pregnancy", family: "life", label: "Pregnancy", productName: "The Pregnancy Food System",
    tagline: "Food-first education and gentle guidance through pregnancy.",
    focus: "General wellbeing food patterns, education, and questions for your professional.",
    description: "Support your Food System through pregnancy with food-first education, gentle guidance and next steps for general wellbeing.",
    href: "/pregnancy", status: "scaffold",
    requiresFoundation: true, allowedFoundations: BOTH, futureBridge: "PregMonth", safetyLevel: "sensitive",
    icon: Flower2, accent: "var(--icon-lime)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  birth: {
    key: "birth", family: "life", label: "Birth", productName: "The Birth Food System",
    tagline: "Nourishment, hydration and rhythm around birth and recovery.",
    focus: "Recovery, transition, hydration, nourishment, bowel comfort, energy and rhythm.",
    description: "Support recovery and transition with nourishment, hydration, rhythm and food-system guidance.",
    href: "/birth", status: "scaffold",
    requiresFoundation: true, allowedFoundations: BOTH, futureBridge: "PregMonth", safetyLevel: "sensitive",
    icon: Sun, accent: "var(--icon-yellow)", gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  baby: {
    key: "baby", family: "life", label: "Baby", productName: "The Baby Food System",
    tagline: "Gentle food-system education for parents and families.",
    focus: "The first years of life — food-system education for parents and families.",
    description: "Support your baby's early food journey with gentle education for parents and families.",
    href: "/baby", status: "scaffold",
    requiresFoundation: true, allowedFoundations: BOTH, futureBridge: "DevelopMonth", safetyLevel: "sensitive",
    icon: Baby, accent: "var(--icon-green)", gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-teal))",
  },
}

/** Display order within each family. */
export const FOUNDATION_KEYS: FoundationSystemKey[] = ["you", "family"]
export const HEALTH_KEYS: HealthSystemKey[] = ["stability", "glucose", "mind", "performance", "recovery", "longevity"]
export const LIFE_KEYS: LifeSystemKey[] = ["pregnancy", "birth", "baby"]
export const SYSTEM_KEYS: SystemKey[] = [...FOUNDATION_KEYS, ...HEALTH_KEYS, ...LIFE_KEYS]

export function getSystem(key: SystemKey): SystemDef {
  return SYSTEMS[key]
}
export function systemsByFamily(family: SystemFamily): SystemDef[] {
  return SYSTEM_KEYS.map((k) => SYSTEMS[k]).filter((s) => s.family === family)
}
export const foundationSystems = (): SystemDef[] => systemsByFamily("foundation")
export const healthSystems = (): SystemDef[] => systemsByFamily("health")
export const lifeSystems = (): SystemDef[] => systemsByFamily("life")
export const liveSystems = (): SystemDef[] => SYSTEM_KEYS.map((k) => SYSTEMS[k]).filter((s) => s.status === "live")

export const FAMILY_META: Record<SystemFamily, { label: string; blurb: string }> = {
  foundation: { label: "Foundation Systems", blurb: "Create your Food System baseline. Everything else builds on it." },
  health: { label: "Health Systems", blurb: "Strengthen a specific area of your Food System." },
  life: { label: "Life Systems", blurb: "Food-first support through major life transitions." },
}
