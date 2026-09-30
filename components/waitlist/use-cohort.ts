"use client"

import { useEffect, useState } from "react"
import { openCohort, type CohortState } from "@/lib/waitlist/early-access"

/**
 * Which cohort is open, counted — never guessed.
 *
 * The hero, the reveal's claim CTA and the 100 Systems section all need the
 * same number and none of them owns it, so the fetch lives here. It is the
 * endpoint the social-proof line already calls; nothing new is counted.
 *
 * Returns `null` until the count arrives and forever if it never does. Every
 * caller must render nothing about places in that case rather than falling
 * back to a plausible-looking number — a figure the product has not counted is
 * the one thing a campaign like this cannot come back from.
 */
export function useCohort(): CohortState | null {
  const [total, setTotal] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.ok && typeof data.total === "number") setTotal(data.total)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return openCohort(total)
}
