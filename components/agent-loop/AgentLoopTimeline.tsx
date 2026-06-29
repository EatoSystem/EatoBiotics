/**
 * AgentLoopTimeline — the eight loop stages, current one highlighted.
 * Presentational. Brand palette only (green/lime/teal/yellow/orange).
 */

import { STAGE_ORDER, STAGE_META, stageIndex, type AgentLoopStage } from "@/lib/agent-loop"

const ACTIVE_GRADIENT =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal))"

export function AgentLoopTimeline({
  currentStage,
  className = "",
}: {
  currentStage: AgentLoopStage
  className?: string
}) {
  const current = stageIndex(currentStage)
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {STAGE_ORDER.map((stage, i) => {
        const isCurrent = stage === currentStage
        const isDone = i < current
        return (
          <div key={stage} className="flex items-center gap-2">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              style={
                isCurrent
                  ? { background: ACTIVE_GRADIENT, color: "#fff" }
                  : isDone
                    ? { backgroundColor: "color-mix(in srgb, var(--icon-green) 14%, #fff)", color: "var(--icon-green)" }
                    : { backgroundColor: "var(--muted, #F3F3F3)", color: "var(--muted-foreground)" }
              }
            >
              {STAGE_META[stage].label}
            </span>
            {i < STAGE_ORDER.length - 1 && (
              <span aria-hidden className="h-px w-3 bg-border sm:w-5" />
            )}
          </div>
        )
      })}
    </div>
  )
}
