"use client"

/**
 * lib/pregnancy/storage.ts — client-side persistence for the Pregnancy
 * assessment. localStorage-only (no auth/DB), mirroring the other food-first
 * assessments (Stability/Glucose/Performance) — the registry reads this key.
 */

import type { PregnancyAssessment } from "./types"

const K_ASSESSMENT = "eb_pregnancy_assessment_v1"

export function savePregnancyAssessment(a: PregnancyAssessment) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(K_ASSESSMENT, JSON.stringify(a))
  } catch {
    /* quota / private mode — ignore */
  }
}

export function loadPregnancyAssessment(): PregnancyAssessment | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(K_ASSESSMENT)
    return raw ? (JSON.parse(raw) as PregnancyAssessment) : null
  } catch {
    return null
  }
}
