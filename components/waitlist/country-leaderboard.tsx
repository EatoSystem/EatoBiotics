"use client"

/**
 * Country leaderboard — the "launch-by-demand" viral mechanic. Shows the top
 * countries by waitlist signups and (when a share code is provided) the
 * caller's country + rank, with the message that EatoBiotics opens first where
 * demand is highest. Self-fetching from /api/waitlist/leaderboard.
 */

import { useEffect, useRef, useState } from "react"
import posthog from "posthog-js"
import { Globe } from "lucide-react"
import { useTranslations } from "@/components/i18n/locale-provider"
import { interpolate } from "@/lib/i18n/config"

interface Entry { name: string; count: number; flag: string; rank: number }
interface Board { total: number; entries: number; top: Entry[]; you: { name: string; rank: number; count: number } | null }

export function CountryLeaderboard({ shareCode }: { shareCode?: string }) {
  const t = useTranslations().waitlist.leaderboard
  const [board, setBoard] = useState<Board | null>(null)
  const viewFired = useRef(false)

  useEffect(() => {
    let alive = true
    const qs = shareCode ? `?code=${encodeURIComponent(shareCode)}` : ""
    fetch(`/api/waitlist/leaderboard${qs}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive || !d?.ok) return
        setBoard(d as Board)
        if (!viewFired.current) {
          viewFired.current = true
          try { posthog.capture("waitlist_leaderboard_viewed", { your_rank: d.you?.rank }) } catch { /* analytics optional */ }
        }
      })
      .catch(() => {})
    return () => { alive = false }
  }, [shareCode])

  if (!board || board.top.length === 0) return null

  const max = board.top[0]?.count || 1

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_2px_12px_rgba(26,46,18,0.05)]">
      <div className="h-1.5 w-full brand-gradient" />
      <div className="p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--icon-green)]">
          <Globe size={14} /> {t.eyebrow}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.blurb}
        </p>

        {board.you && (
          <p className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold text-foreground" style={{ background: "color-mix(in srgb, var(--icon-green) 8%, transparent)" }}>
            {interpolate(t.you, { name: board.you.name, rank: board.you.rank })}
          </p>
        )}

        <div className="mt-4 space-y-2">
          {board.top.map((e) => {
            const mine = board.you?.name === e.name
            return (
              <div key={e.name} className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">{e.rank}</span>
                <span className="text-base leading-none">{e.flag}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${mine ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>{e.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{e.count.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full brand-gradient" style={{ width: `${Math.max(4, Math.round((e.count / max) * 100))}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
