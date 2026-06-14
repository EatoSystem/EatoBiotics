import { ScrollReveal } from "@/components/scroll-reveal"
import { STABILITY_BANDS } from "@/lib/stability/scoring"

const SAMPLE_SCORE = 72
const SAMPLE_BAND = "Improving Stability"
const R = 112
const CIRC = 2 * Math.PI * R

/* Premium Stability Score™ showcase: a large circular gauge plus the four
   STABILITY_BANDS rendered as progression bands (driven entirely by the
   shared scoring constant — no hard-coded band drift). */
export function StabilityScoreShowcase() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      {/* Large circular gauge */}
      <ScrollReveal className="flex justify-center">
        <div className="relative">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 blur-3xl"
            style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(45,170,110,0.18), transparent 72%)" }}
          />
          <svg width="280" height="280" viewBox="0 0 280 280">
            <defs>
              <linearGradient id="score-ring-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--icon-lime)" />
                <stop offset="50%" stopColor="var(--icon-teal)" />
                <stop offset="100%" stopColor="var(--icon-yellow)" />
              </linearGradient>
            </defs>
            <circle cx="140" cy="140" r={R} fill="none" stroke="#eef2ec" strokeWidth="18" />
            <circle
              cx="140" cy="140" r={R} fill="none" stroke="url(#score-ring-gauge)" strokeWidth="18" strokeLinecap="round"
              strokeDasharray={`${CIRC * (SAMPLE_SCORE / 100)} ${CIRC}`} transform="rotate(-90 140 140)"
            />
            <text x="140" y="132" textAnchor="middle" className="font-serif" style={{ fontSize: 56, fontWeight: 800, fill: "var(--foreground)" }}>{SAMPLE_SCORE}</text>
            <text x="140" y="166" textAnchor="middle" style={{ fontSize: 14, fill: "var(--muted-foreground)" }}>/ 100</text>
          </svg>
          <span
            className="mx-auto mt-4 block w-fit rounded-full px-4 py-1.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          >
            {SAMPLE_BAND}
          </span>
        </div>
      </ScrollReveal>

      {/* Band progression */}
      <div className="space-y-3">
        {STABILITY_BANDS.map((b, i) => {
          const max = (STABILITY_BANDS[i + 1]?.min ?? 101) - 1
          return (
            <ScrollReveal key={b.band} delay={i * 70}>
              <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2.5 font-serif text-base font-semibold text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} />
                    {b.band}
                  </span>
                  <span className="font-serif text-sm font-bold" style={{ color: b.color }}>{b.min}–{max}</span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#eef2ec]">
                  <div className="h-full rounded-full" style={{ width: `${max}%`, background: b.color }} />
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{b.blurb}</p>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </div>
  )
}
