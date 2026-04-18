"use client"

import { useState, useEffect } from "react"
import { Users } from "lucide-react"

interface CommunityStats {
  mealsThisWeek: number
  activeStreakers: number
  totalAssessments: number
}

export function CommunityPulseCard() {
  const [stats, setStats] = useState<CommunityStats | null>(null)

  useEffect(() => {
    fetch("/api/community-stats")
      .then(r => r.json())
      .then((d: CommunityStats) => setStats(d))
      .catch(() => {})
  }, [])

  if (!stats) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/30 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-4 w-4 rounded bg-border animate-pulse" />
          <div className="h-3 w-36 rounded bg-border animate-pulse" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-12 flex-1 rounded-xl bg-border animate-pulse" />)}
        </div>
      </div>
    )
  }

  const statItems = [
    { value: stats.mealsThisWeek.toLocaleString(), label: "meals this week" },
    { value: stats.activeStreakers.toLocaleString(), label: "active streaks" },
    { value: stats.totalAssessments.toLocaleString(), label: "total assessments" },
  ]

  return (
    <div className="rounded-2xl border border-border bg-secondary/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users size={13} className="text-muted-foreground" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">This week in EatoBiotics</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {statItems.map(({ value, label }) => (
          <div key={label} className="rounded-xl bg-background p-3 text-center border border-border">
            <p className="text-base font-bold tabular-nums" style={{ color: "var(--icon-green)" }}>{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground/50 text-center italic">You&apos;re part of something growing.</p>
    </div>
  )
}
