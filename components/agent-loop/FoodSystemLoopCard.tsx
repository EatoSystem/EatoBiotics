/**
 * FoodSystemLoopCard — the headline loop surface: Food System Score, current
 * loop stage, the three-biotics profile, and the one next best action. Composes
 * the smaller panels so it can drop onto the result page or the demo showcase.
 */

"use client"

import {
  STAGE_META,
  type AgentLoopRecommendation,
  type AgentLoopStage,
  type BioticsScore,
  type FoodSystemScore,
  type LoopProgress,
} from "@/lib/agent-loop"
import { AgentLoopTimeline } from "./AgentLoopTimeline"
import { BioticsProgressPanel } from "./BioticsProgressPanel"
import { NextBestActionCard } from "./NextBestActionCard"

export function FoodSystemLoopCard({
  score,
  stage,
  biotics,
  recommendation,
  progress,
  systemLabel = "Food System",
  onComplete,
  onSkip,
  className = "",
}: {
  score: FoodSystemScore
  stage: AgentLoopStage
  biotics: BioticsScore
  recommendation: AgentLoopRecommendation
  progress?: LoopProgress
  systemLabel?: string
  onComplete?: (id: string) => void
  onSkip?: (id: string) => void
  className?: string
}) {
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-border bg-card ${className}`}
      aria-label={`${systemLabel} loop`}
    >
      <div aria-hidden className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {systemLabel} Score
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold tabular-nums" style={{ color: score.band.color }}>
                {score.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground">/ 100 · {score.label}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current stage</p>
            <p className="text-lg font-semibold text-foreground">{STAGE_META[stage].label}</p>
          </div>
        </div>

        <div className="mt-5">
          <AgentLoopTimeline currentStage={stage} />
          <p className="mt-2 text-sm text-muted-foreground">{STAGE_META[stage].meaning}</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <BioticsProgressPanel biotics={biotics} />
          <NextBestActionCard
            recommendation={recommendation}
            onComplete={onComplete}
            onSkip={onSkip}
          />
        </div>

        {progress && (
          <p className="mt-4 text-xs text-muted-foreground">
            {progress.loopsCompleted} loop{progress.loopsCompleted === 1 ? "" : "s"} so far ·
            momentum: {progress.momentum}
            {progress.scoreDelta !== 0 && ` · ${progress.scoreDelta > 0 ? "+" : ""}${progress.scoreDelta} since baseline`}
          </p>
        )}
      </div>
    </section>
  )
}
