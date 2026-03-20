"use client"

import { useState, useEffect } from "react"
import {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
  CheckCircle2,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { PillarInsight } from "@/lib/assessment-scoring"

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Leaf,
  Wheat,
  FlaskConical,
  Clock,
  Heart,
}

interface SubScoreCardProps {
  insight: PillarInsight
  index: number
}

export function SubScoreCard({ insight, index }: SubScoreCardProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 80)
    return () => clearTimeout(t)
  }, [index])

  const Icon = ICON_MAP[insight.icon] ?? Leaf
  const isStrength = insight.score >= 65

  return (
    <div className="rounded-2xl border border-border bg-background p-5">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{ background: insight.gradient }}
          >
            <Icon size={15} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">{insight.label}</span>
        </div>
        <span
          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
          style={{
            backgroundColor: `color-mix(in srgb, ${insight.color} 12%, transparent)`,
            color: insight.color,
          }}
        >
          {insight.score}/100
        </span>
      </div>

      {/* Animated bar */}
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full"
          style={{
            width: visible ? `${insight.score}%` : "0%",
            background: insight.gradient,
            transition: `width 700ms ease-out ${index * 80}ms`,
          }}
        />
      </div>

      {/* Insight text */}
      {(insight.strength ?? insight.opportunity) && (
        <div
          className={cn(
            "mt-3 flex items-start gap-2 rounded-xl p-3 text-xs leading-relaxed",
            isStrength
              ? "border border-[var(--icon-green)]/15 bg-[var(--icon-green)]/5 text-foreground/80"
              : "border border-border bg-secondary/40 text-muted-foreground"
          )}
        >
          {isStrength ? (
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-[var(--icon-green)]" />
          ) : (
            <TrendingUp size={13} className="mt-0.5 shrink-0 text-muted-foreground" />
          )}
          <span>{insight.strength ?? insight.opportunity}</span>
        </div>
      )}
    </div>
  )
}
