/**
 * NextBestActionCard — the single, food-first next step the loop recommends.
 * Optional callbacks let the surrounding page record the Learn-stage outcome
 * ("I did this" / "Not this time").
 */

"use client"

import { ArrowRight, Check } from "lucide-react"
import type { AgentLoopRecommendation } from "@/lib/agent-loop"

export function NextBestActionCard({
  recommendation,
  onComplete,
  onSkip,
  className = "",
}: {
  recommendation: AgentLoopRecommendation
  onComplete?: (id: string) => void
  onSkip?: (id: string) => void
  className?: string
}) {
  const interactive = Boolean(onComplete || onSkip)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-card p-5 ${className}`}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-yellow), var(--icon-orange))" }} />
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--icon-green)" }}>
        <ArrowRight className="h-3.5 w-3.5" /> Your next best action
      </div>
      <p className="mt-2 text-lg font-semibold leading-snug text-foreground">
        {recommendation.action}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Why: </span>
        {recommendation.why}
      </p>

      {interactive && (
        <div className="mt-4 flex flex-wrap gap-2">
          {onComplete && (
            <button
              type="button"
              onClick={() => onComplete(recommendation.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }}
            >
              <Check className="h-4 w-4" /> I did this
            </button>
          )}
          {onSkip && (
            <button
              type="button"
              onClick={() => onSkip(recommendation.id)}
              className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              Not this time
            </button>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{recommendation.disclaimer}</p>
    </div>
  )
}
