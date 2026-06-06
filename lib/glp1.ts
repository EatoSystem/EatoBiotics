/**
 * lib/glp1.ts — EatoBetics GLP-1 Companion: the science in one place.
 *
 * ⚕️  CLINICAL TUNING POINT
 * Every protein/muscle assumption used by the GLP-1 Companion (the public
 * calculator AND the in-app tracker) lives here so a clinician or dietitian
 * can review and adjust the numbers in a single file. Nothing downstream
 * hard-codes a factor — they all import from here.
 *
 * Rationale: during the caloric deficit a GLP-1 creates, a higher protein
 * intake (combined with resistance training) helps preserve lean muscle.
 * Commonly cited ranges for muscle preservation in a deficit fall around
 * 1.4–2.2 g protein per kg body weight; we use a conservative, activity-based
 * subset below. These are educational estimates, not medical advice.
 */

export type Activity = "light" | "moderate" | "strength"

/** Grams of protein per kg of body weight, by activity level. Tune here. */
export const PROTEIN_FACTORS: Record<Activity, number> = {
  light: 1.4,
  moderate: 1.6,
  strength: 1.9,
}

export const ACTIVITY_LABELS: Record<Activity, { label: string; sub: string }> = {
  light: { label: "Lighter", sub: "Mostly day-to-day movement" },
  moderate: { label: "Active", sub: "Regular walking or cardio" },
  strength: { label: "Strength training", sub: "Resistance work 2+ times a week" },
}

/** Tier required to access the in-app GLP-1 Companion tracker + plan. */
export const GLP1_PLAN_TIER = "restore" as const

/* ── Onboarding: medications ────────────────────────────────────────────── */

export type Glp1Medication = "ozempic" | "wegovy" | "mounjaro" | "other" | "not_started"

export const MEDICATIONS: { value: Glp1Medication; label: string }[] = [
  { value: "ozempic", label: "Ozempic" },
  { value: "wegovy", label: "Wegovy" },
  { value: "mounjaro", label: "Mounjaro" },
  { value: "other", label: "Other GLP-1" },
  { value: "not_started", label: "Not started yet" },
]

/** Human label for a stored medication value, or null if unknown/unset. */
export function medicationLabel(value: string | null | undefined): string | null {
  return MEDICATIONS.find((m) => m.value === value)?.label ?? null
}

/** Convert pounds to kilograms. */
export function lbToKg(lb: number): number {
  return lb / 2.20462
}

/** Daily protein target (g), rounded, from body weight (kg) + activity. */
export function proteinTarget(weightKg: number, activity: Activity): number {
  if (!isFinite(weightKg) || weightKg <= 0) return 0
  return Math.round(weightKg * PROTEIN_FACTORS[activity])
}

/** Per-meal protein target (g), rounded, given a daily target and meal count. */
export function perMealTarget(dailyTarget: number, meals: number): number {
  if (meals <= 0) return 0
  return Math.round(dailyTarget / meals)
}
