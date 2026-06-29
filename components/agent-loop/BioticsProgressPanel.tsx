/**
 * BioticsProgressPanel — the three-biotics profile as bars, with strongest /
 * weakest called out. Reads a `BioticsScore` from the loop baseline.
 */

import { BIOTIC_LABELS, type BioticKey, type BioticsScore } from "@/lib/agent-loop"

const BAR_GRADIENT: Record<BioticKey, string> = {
  prebiotics: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))",
  probiotics: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))",
  postbiotics: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))",
}

const ORDER: BioticKey[] = ["prebiotics", "probiotics", "postbiotics"]

export function BioticsProgressPanel({
  biotics,
  className = "",
}: {
  biotics: BioticsScore
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground">Your three biotics</h3>
      <div className="mt-4 space-y-4">
        {ORDER.map((key) => {
          const b = biotics[key]
          const isStrong = biotics.strongest === key
          const isWeak = biotics.weakest === key
          return (
            <div key={key}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-foreground">
                  {BIOTIC_LABELS[key]}
                  {isStrong && (
                    <span className="ml-2 text-xs font-semibold" style={{ color: "var(--icon-green)" }}>
                      strongest
                    </span>
                  )}
                  {isWeak && !isStrong && (
                    <span className="ml-2 text-xs font-semibold" style={{ color: "var(--icon-orange)" }}>
                      most room to grow
                    </span>
                  )}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {b.score} · {b.label}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--muted, #F3F3F3)" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, b.score))}%`, background: BAR_GRADIENT[key] }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
