"use client"

import { useEffect, useState } from "react"

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

/** Minimum signups before we show a number (so it never reads "3 joined"). */
const MIN_TOTAL = 25

interface CountResponse {
  total: number
  today: number
}

/**
 * Compact live social-proof line for the waitlist hero ("2,341 already joined ·
 * 38 today"). Renders nothing until the count clears MIN_TOTAL so an empty/early
 * waitlist never looks bare. Data from GET /api/waitlist/count.
 */
export function WaitlistSocialProof() {
  const [count, setCount] = useState<CountResponse | null>(null)

  useEffect(() => {
    let active = true
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.ok) setCount({ total: data.total, today: data.today })
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  if (!count || count.total < MIN_TOTAL) return null

  const nf = new Intl.NumberFormat("en")

  return (
    <div className="mt-5 flex items-center gap-2.5 text-sm text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: GRADIENT_BAR }} />
      <span>
        <strong className="font-semibold text-foreground">{nf.format(count.total)}</strong> already joined
        {count.today > 0 && (
          <>
            {" · "}
            <strong className="font-semibold text-foreground">{nf.format(count.today)}</strong> today
          </>
        )}
      </span>
    </div>
  )
}
