/**
 * FoodSystemNextStepPanel — the result-page drop-in. Reads the user's real
 * foundation baseline (localStorage-first, via the registry), runs a
 * deterministic loop, and renders "Your Next Food System Step". Renders nothing
 * if no foundation is complete, so it's safe to mount anywhere on the result page.
 *
 * Drop-in usage (not wired into the live result page in this change):
 *   <FoodSystemNextStepPanel />
 */

"use client"

import { useEffect, useState } from "react"
import { resolvedFoundation } from "@/lib/assessment/journey"
import { readFoundationBaseline, type FoodSystemBaseline } from "@/lib/agent-loop"
import { useFoodSystemLoop } from "./use-food-system-loop"
import { FoodSystemLoopCard } from "./FoodSystemLoopCard"
import { FoodSystemMemoryPanel } from "./FoodSystemMemoryPanel"

export function FoodSystemNextStepPanel({ className = "" }: { className?: string }) {
  const [baseline, setBaseline] = useState<FoodSystemBaseline | null>(null)

  useEffect(() => {
    const foundation = resolvedFoundation()
    if (foundation) setBaseline(readFoundationBaseline(foundation))
  }, [])

  const { twin, recordAndRefresh } = useFoodSystemLoop(baseline)

  if (!baseline || !twin) return null

  return (
    <div className={className}>
      <div className="mb-4">
        <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
          Your Next Food System Step
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your report is a starting point — this is how your Food System keeps improving.
        </p>
      </div>
      <FoodSystemLoopCard
        twin={twin}
        onComplete={(id) => recordAndRefresh(id, "completed")}
        onSkip={(id) => recordAndRefresh(id, "ignored")}
      />
      {twin.progress.loopsCompleted > 0 && (
        <FoodSystemMemoryPanel className="mt-4" twin={twin} />
      )}
    </div>
  )
}
