/* ── Assessment localStorage helpers ───────────────────────────────── */

import type { AssessmentResult } from "./assessment-scoring"

export type AssessmentView = "intro" | "questions" | "privacy" | "results"

export interface AssessmentState {
  view: AssessmentView
  currentIndex: number
  answers: Record<string, number | string[]>
  result: AssessmentResult | null
  startedAt: number | null
}

const ASSESSMENT_KEY = "eatobiotics-assessment"

export function emptyAssessmentState(): AssessmentState {
  return {
    view: "intro",
    currentIndex: 0,
    answers: {},
    result: null,
    startedAt: null,
  }
}

export function loadAssessment(): AssessmentState {
  if (typeof window === "undefined") return emptyAssessmentState()
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY)
    if (!raw) return emptyAssessmentState()
    const parsed = JSON.parse(raw) as AssessmentState
    // Shape validation
    if (
      typeof parsed.view === "string" &&
      typeof parsed.currentIndex === "number" &&
      typeof parsed.answers === "object" &&
      parsed.answers !== null
    ) {
      return parsed
    }
    return emptyAssessmentState()
  } catch {
    return emptyAssessmentState()
  }
}

export function saveAssessment(state: AssessmentState): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ASSESSMENT_KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearAssessment(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ASSESSMENT_KEY)
}

/* ── Privacy Opt-In ────────────────────────────────────────────────── */

export type PrivacyChoice = "opted-in" | "opted-out"

const PRIVACY_KEY = "eatobiotics-privacy"

export function loadPrivacyChoice(): PrivacyChoice | null {
  if (typeof window === "undefined") return null
  try {
    return (localStorage.getItem(PRIVACY_KEY) as PrivacyChoice) ?? null
  } catch {
    return null
  }
}

export function savePrivacyChoice(choice: PrivacyChoice): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(PRIVACY_KEY, choice)
  } catch {
    /* ignore */
  }
}
