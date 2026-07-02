"use client"

/**
 * DemoTwinHero — client wrapper for the demo account's TodayStrip + TwinStage,
 * wiring the mock QuickLog (no API) so the full log→learn loop is publicly
 * previewable: Add meal → analyse → result → the stage bursts.
 */

import { useState } from "react"
import { TodayStrip } from "./today-strip"
import { TwinStage } from "./twin-stage"
import { QuickLog } from "./quick-log"
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
  const [burstKey, setBurstKey] = useState(0)

  return (
    <>
      <TodayStrip twin={twin} firstName={firstName} streak={streak} showStory onAddMeal={() => setQuickLogOpen(true)} />
      <TwinStage
        twin={twin}
        visual={visual}
        figureSrc={figureSrc}
        video={video}
        detailHref={detailHref}
        burstKey={burstKey}
        onAddMeal={() => setQuickLogOpen(true)}
      />
      <QuickLog open={quickLogOpen} onClose={() => setQuickLogOpen(false)} onLearned={() => setBurstKey((k) => k + 1)} mock />
    </>
  )
}
