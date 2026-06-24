"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

interface RecentJoin {
  name: string
  country: string | null
}

/**
 * Subtle, dismissible "just joined" card pinned bottom-left of the waitlist page.
 * Rotates through the latest signups (first name + country, no PII) every ~6s as
 * tasteful social proof. Self-contained (does NOT use the global sonner Toaster),
 * respects prefers-reduced-motion, and renders nothing when there's no data.
 */
export function LiveSignups() {
  const [recent, setRecent] = useState<RecentJoin[]>([])
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const reduceMotion = useRef(false)

  // Load recent joins once.
  useEffect(() => {
    if (typeof window !== "undefined") {
      reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    }
    let active = true
    fetch("/api/waitlist/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.ok && Array.isArray(data.recent)) setRecent(data.recent)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  // Rotate through entries: show ~5s, hide ~1s, advance.
  useEffect(() => {
    if (dismissed || recent.length === 0) return
    setVisible(true)
    if (reduceMotion.current) return // show the first one, don't auto-cycle

    const hide = setTimeout(() => setVisible(false), 5000)
    const next = setTimeout(() => {
      setIndex((i) => (i + 1) % recent.length)
    }, 6000)
    return () => {
      clearTimeout(hide)
      clearTimeout(next)
    }
  }, [index, recent, dismissed])

  if (dismissed || recent.length === 0) return null

  const join = recent[index]
  const where = join.country ? ` in ${join.country}` : ""

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-4 left-4 z-40 max-w-[260px] transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        <span className="text-lg" aria-hidden>🌱</span>
        <p className="text-xs leading-snug text-muted-foreground">
          <strong className="font-semibold text-foreground">{join.name}</strong>
          {where} just joined the waitlist
        </p>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="ml-1 shrink-0 text-muted-foreground/60 transition-colors hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
