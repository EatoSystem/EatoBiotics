/**
 * lib/assessment/journey.ts — the foundation→system journey state machine.
 *
 * localStorage-first (anonymous, no auth). It records the user's *intent*
 * (which foundation they're on, which Health system is selected/pending); actual
 * completion is always derived from the registry (single source of truth), so
 * status never drifts from the real assessment records.
 *
 * The persisted `eb_assessment_journey_v1` field names (`pendingAddon`,
 * `selectedAddon`) are kept unchanged so in-flight journeys survive the rename.
 */

import {
  isComplete,
  FOUNDATIONS,
  ASSESSED_SYSTEMS,
  type FoundationKey,
  type AnyAssessedKey,
} from "./registry"

const JOURNEY_KEY = "eb_assessment_journey_v1"

export interface Journey {
  /** The foundation the current journey is built on. */
  foundationType: FoundationKey | null
  /** A system chosen before a foundation existed — resumed after foundation completes. */
  pendingAddon: AnyAssessedKey | null
  /** The system being layered onto the foundation (once a foundation exists). */
  selectedAddon: AnyAssessedKey | null
}

function empty(): Journey {
  return { foundationType: null, pendingAddon: null, selectedAddon: null }
}

export function getJourney(): Journey {
  if (typeof window === "undefined") return empty()
  try {
    const raw = window.localStorage.getItem(JOURNEY_KEY)
    if (!raw) return empty()
    return { ...empty(), ...(JSON.parse(raw) as Partial<Journey>) }
  } catch {
    return empty()
  }
}

export function patchJourney(patch: Partial<Journey>): Journey {
  const next = { ...getJourney(), ...patch }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(JOURNEY_KEY, JSON.stringify(next))
    } catch {
      /* quota / private mode — ignore */
    }
  }
  return next
}

export function clearJourney(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(JOURNEY_KEY)
  } catch {
    /* ignore */
  }
}

/* ── Derived state (completion always comes from the registry) ─────────────── */

export function completedFoundations(): FoundationKey[] {
  return (Object.keys(FOUNDATIONS) as FoundationKey[]).filter((k) => isComplete(k))
}

export function hasAnyFoundation(): boolean {
  return completedFoundations().length > 0
}

/**
 * The foundation this journey resolves to: the explicitly chosen one if it's
 * complete, otherwise the single completed foundation (if exactly one exists).
 */
export function resolvedFoundation(): FoundationKey | null {
  const done = completedFoundations()
  const chosen = getJourney().foundationType
  if (chosen && done.includes(chosen)) return chosen
  if (done.length === 1) return done[0]
  return null
}

export function journeyType(): string | null {
  const f = resolvedFoundation()
  if (!f) return null
  const addon = getJourney().selectedAddon
  return addon && isComplete(addon) ? `${f}_${addon}` : `${f}_only`
}

export function reportType(): string | null {
  const t = journeyType()
  return t ? `${t}_report` : null
}

/* ── Post-foundation resume ────────────────────────────────────────────────
   When a foundation is complete and the user had pre-selected an add-on
   (pendingAddon), this is the route that resumes their journey: the add-on gate,
   which forwards into the add-on assessment. Pure (takes the journey + completion
   flag) so it's unit-testable; returns null when there's nothing to resume. */
export function resumeAddonRoute(journey: Journey, foundationComplete: boolean): string | null {
  if (!foundationComplete || !journey.pendingAddon) return null
  return `/assessment/add/${journey.pendingAddon}`
}

/* ── Labels (for UI copy) ──────────────────────────────────────────────────── */

export function foundationLabel(k: FoundationKey): string {
  return FOUNDATIONS[k].label
}
export function addonLabel(k: AnyAssessedKey): string {
  return ASSESSED_SYSTEMS[k].label
}
