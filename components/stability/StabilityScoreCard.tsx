import type { StabilityScore } from "@/lib/stability/types"
import { bandMeta } from "@/lib/stability/scoring"

const CATS: { key: keyof StabilityScore["categoryScores"]; label: string; max: number; color: string }[] = [
  { key: "stoolStability", label: "Stool stability", max: 25, color: "var(--icon-green)" },
  { key: "urgencyControl", label: "Urgency & control", max: 25, color: "var(--icon-teal)" },
  { key: "foodSystem", label: "Food system", max: 20, color: "var(--icon-lime)" },
  { key: "lifestyle", label: "Lifestyle", max: 20, color: "var(--icon-yellow)" },
  { key: "consistency", label: "Consistency", max: 10, color: "var(--icon-orange)" },
]

/** Score gauge + band + per-category breakdown. Pure presentational. */
export function StabilityScoreCard({ score }: { score: StabilityScore }) {
  const meta = bandMeta(score.band)
  const r = 60
  const circ = 2 * Math.PI * r
  const pct = score.totalScore / 100

  return (
    <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-white shadow-[0_18px_60px_-24px_rgba(26,46,18,0.25)]">
      <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-orange), var(--icon-yellow), var(--icon-lime), var(--icon-green))" }} />
      <div className="grid gap-6 p-7 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8 sm:p-9">
        {/* Gauge */}
        <div className="mx-auto">
          <div className="relative h-[152px] w-[152px]">
            <svg width="152" height="152" viewBox="0 0 152 152" className="-rotate-90">
              <circle cx="76" cy="76" r={r} fill="none" stroke="var(--border)" strokeWidth="12" />
              <circle cx="76" cy="76" r={r} fill="none" stroke={meta.color} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${pct * circ} ${circ}`} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-5xl font-bold" style={{ color: "var(--foreground)" }}>{score.totalScore}</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/ 100</span>
            </div>
          </div>
        </div>

        {/* Band + categories */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>EatoBiotics Stability Score</p>
          <h3 className="mt-1 font-serif text-2xl font-bold" style={{ color: meta.color }}>{score.band}</h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{meta.blurb}</p>

          <div className="mt-5 space-y-2.5">
            {CATS.map((c) => {
              const v = score.categoryScores[c.key]
              return (
                <div key={c.key}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span style={{ color: "var(--foreground)" }}>{c.label}</span>
                    <span className="font-semibold tabular-nums" style={{ color: c.color }}>{v}/{c.max}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(v / c.max) * 100}%`, background: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
