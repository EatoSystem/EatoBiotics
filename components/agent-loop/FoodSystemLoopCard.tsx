/**
 * FoodSystemLoopCard — the headline loop surface: Food System Score, current
 * loop stage, the three-biotics profile, and the one next best action.
 *
 * Consumes the Food System Digital Twin directly (the primary read model) and
 * feeds the atomic presentational components from it. Composes onto the result
 * page or the demo showcase.
 */

"use client"

import { STAGE_META, getSystem, type FoodSystemDigitalTwin } from "@/lib/agent-loop"
import { AgentLoopTimeline } from "./AgentLoopTimeline"
import { BioticsProgressPanel } from "./BioticsProgressPanel"
import { NextBestActionCard } from "./NextBestActionCard"

export function FoodSystemLoopCard({
  twin,
  onComplete,
  onSkip,
  className = "",
}: {
  twin: FoodSystemDigitalTwin
  onComplete?: (id: string) => void
  onSkip?: (id: string) => void
  className?: string
}) {
  const score = twin.currentScore
  const stage = twin.currentStage
  const recommendation = twin.nextBestAction
  const progress = twin.progress
  const systemLabel = getSystem(twin.activeSystem).label

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
          <BioticsProgressPanel biotics={twin.biotics} />
          {recommendation ? (
            <NextBestActionCard
              recommendation={recommendation}
              onComplete={onComplete}
              onSkip={onSkip}
            />
          ) : (
            <div className="flex items-center rounded-2xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
              Add a meal, symptom or progress observation to begin your next Food System loop.
            </div>
          )}
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
