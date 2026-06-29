/**
 * FoodSystemMemoryPanel — the Learn + Improve layer: momentum, loops completed,
 * and what the user has acted on. Surfaces movement, not perfection.
 */

import type { FoodSystemDigitalTwin, Momentum } from "@/lib/agent-loop"

const MOMENTUM_META: Record<Momentum, { label: string; color: string }> = {
  starting: { label: "Just starting", color: "var(--icon-lime)" },
  steady: { label: "Steady", color: "var(--icon-teal)" },
  improving: { label: "Improving", color: "var(--icon-green)" },
  stalled: { label: "Needs a nudge", color: "var(--icon-orange)" },
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
      <div className="text-xl font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export function FoodSystemMemoryPanel({
  twin,
  className = "",
}: {
  twin: FoodSystemDigitalTwin
  className?: string
}) {
  const progress = twin.progress
  const m = MOMENTUM_META[progress.momentum]
  const recent = [...twin.memory.outcomes].reverse().slice(0, 3)
  const delta = progress.scoreDelta
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Your loop memory</h3>
        <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: m.color }}>
          {m.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat value={String(progress.loopsCompleted)} label="loops" />
        <Stat value={String(progress.completedActions)} label="actions done" />
        <Stat
          value={`${delta > 0 ? "+" : ""}${delta}`}
          label="score change"
        />
      </div>

      {recent.length > 0 && (
        <ul className="mt-4 space-y-2">
          {recent.map((o, i) => (
            <li key={`${o.recommendationId}-${i}`} className="flex items-start gap-2 text-sm">
              <span
                aria-hidden
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: o.status === "completed" ? "var(--icon-green)" : "var(--icon-orange)" }}
              />
              <span className="text-muted-foreground">
                <span className="text-foreground">{o.status === "completed" ? "Done" : "Skipped"}:</span> {o.action}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
