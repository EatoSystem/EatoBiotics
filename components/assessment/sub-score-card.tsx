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
    <div
      className="relative rounded-2xl border bg-background p-5 overflow-hidden"
      style={{ borderColor: `color-mix(in srgb, ${insight.color} 25%, transparent)` }}
    >
      {/* Colored top accent strip */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
        style={{ background: insight.gradient }}
      />

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: insight.gradient }}
          >
            <Icon size={18} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground">{insight.label}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold" style={{ color: insight.color }}>
            {insight.score}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>

      {/* Animated bar */}
      <div className="h-3 overflow-hidden rounded-full bg-border/40">
        <div
          className="h-full rounded-full"
          style={{
            width: visible ? `${insight.score}%` : "0%",
            background: insight.gradient,
            transition: `width 800ms ease-out ${index * 80}ms`,
          }}
        />
      </div>

      {/* Score label below bar */}
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground/50">
        <span>0</span>
        <span>100</span>
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
