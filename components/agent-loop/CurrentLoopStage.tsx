/**
 * CurrentLoopStage — compact badge naming the active stage + its one-line meaning.
 */

import { STAGE_META, type AgentLoopStage } from "@/lib/agent-loop"

export function CurrentLoopStage({
  stage,
  className = "",
}: {
  stage: AgentLoopStage
  className?: string
}) {
  const meta = STAGE_META[stage]
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span
        className="mt-0.5 shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
        style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" }}
      >
        {meta.label}
      </span>
      <p className="text-sm text-muted-foreground">{meta.meaning}</p>
    </div>
  )
}
