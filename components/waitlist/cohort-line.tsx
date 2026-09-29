"use client"

import { cohortLineText, type CohortState } from "@/lib/waitlist/early-access"

/**
 * The one-line status: which cohort is open and how much of it is left.
 *
 * ── It says nothing when it knows nothing ───────────────────────────────────
 *
 * `cohort` is null whenever the count could not be fetched, and this renders
 * NOTHING in that case — not "limited places", not a placeholder, not a
 * plausible number. A figure the product has not counted is the one failure a
 * campaign like this cannot come back from, so the silent branch is the
 * important one and every caller gets it for free by using this component.
 *
 * ── And it does not shout ───────────────────────────────────────────────────
 *
 * No timer, no flashing, no "3 people are viewing this". The cohort is real
 * and deliberate, so it is stated the way a fact is stated. The appeal is
 * founding participation, not pressure.
 */
export function CohortLine({
  cohort,
  className = "",
}: {
  cohort: CohortState | null
  className?: string
}) {
  // The decision lives in lib/waitlist/early-access.ts so it is reachable from
  // a unit test; this component only prints what it is told.
  const text = cohortLineText(cohort)
  if (!cohort || !text) return null

  const { name } = cohort.cohort

  return (
    <p
      className={`flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground ${className}`}
    >
      <span className="font-semibold text-foreground">{name}</span>
      <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
      <span>{text}</span>
    </p>
  )
}
