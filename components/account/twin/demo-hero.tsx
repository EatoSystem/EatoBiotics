"use client"

/**
 * DemoTwinHero — client wrapper for the demo account's TodayStrip + TwinStage,
 * wiring the mock QuickLog (no API) so the full log→learn loop is publicly
 * previewable: Add meal → analyse → the Meal Reveal plays out on the stage.
 */

import { useCallback, useEffect, useState } from "react"
import { TodayStrip } from "./today-strip"
import { TwinStage } from "./twin-stage"
import { QuickLog, MOCK_QUICK_LOG_RESULT, type QuickLogResult } from "./quick-log"
import { browserStore, dayKey, loadRitual, ritualCount } from "@/lib/account/ritual"
import type { FoodSystemDigitalTwin } from "@/lib/agent-loop/twin/twin-types"
import type { TwinVisualState } from "@/lib/account/twin-visual"
import type { TwinVideo } from "@/lib/account/twin-figure"

export function DemoTwinHero({
  twin,
  visual,
  figureSrc,
  video,
  streak,
  firstName,
  detailHref,
}: {
  twin: FoodSystemDigitalTwin
  visual: TwinVisualState
  figureSrc: string
  video: TwinVideo | null
  streak: number
  firstName: string
  detailHref: string
}) {
  const [quickLogOpen, setQuickLogOpen] = useState(false)
  const [reveal, setReveal] = useState<QuickLogResult | null>(null)
  const onReveal = useCallback((r: QuickLogResult) => {
    setReveal(r)
    document.getElementById("fs-stage")?.scrollIntoView({ behavior: "smooth" })
  }, [])
  /* Brighten the demo stage with how much of today's ritual is logged
     (re-reads when the tab regains focus, e.g. after ticking one further down
     the page). 0R-5 replaced the per-check body coordinates with this count. */
  const [ritualDone, setRitualDone] = useState(() => ritualCount(loadRitual(null, dayKey())))
  useEffect(() => {
    const read = () => setRitualDone(ritualCount(loadRitual(browserStore(), dayKey())))
    read()
    window.addEventListener("focus", read)
    return () => window.removeEventListener("focus", read)
  }, [])

  return (
    <>
      <TodayStrip twin={twin} firstName={firstName} streak={streak} showStory onAddMeal={() => setQuickLogOpen(true)} />
      <TwinStage
        twin={twin}
        visual={visual}
        figureSrc={figureSrc}
        video={video}
        detailHref={detailHref}
        demo
        onSimulateMeal={() => onReveal(MOCK_QUICK_LOG_RESULT)}
        onAddMeal={() => setQuickLogOpen(true)}
        reveal={reveal}
        onRevealDone={() => setReveal(null)}
        onLogAnother={() => {
          setReveal(null)
          setQuickLogOpen(true)
        }}
        ritualCount={ritualDone}
      />
      <QuickLog open={quickLogOpen} onClose={() => setQuickLogOpen(false)} onReveal={onReveal} mock />
    </>
  )
}
