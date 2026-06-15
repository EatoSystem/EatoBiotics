import { ScrollReveal } from "@/components/scroll-reveal"

const SAMPLE_SCORE = 71
const SAMPLE_BAND = "Excellent"
const R = 112
const CIRC = 2 * Math.PI * R

/* The three EatoBiotics Score pillars (the 3 Biotics — the canonical scoring
   model from lib/assessment-scoring.ts). */
const PILLARS = [
  { label: "Prebiotics", score: 74, color: "var(--icon-lime)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))", description: "Plant diversity & fibre" },
  { label: "Probiotics", score: 62, color: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))", description: "Fermented & live foods" },
  { label: "Postbiotics", score: 78, color: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))", description: "Consistency & rhythm" },
]

/* Premium EatoBiotics Score™ showcase: a large circular gauge plus the three
   Biotics pillars. Mirrors EbScoreShowcase / FamilyScoreShowcase. */
export function YouScoreShowcase() {
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
              <linearGradient id="you-score-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--icon-lime)" />
                <stop offset="50%" stopColor="var(--icon-teal)" />
                <stop offset="100%" stopColor="var(--icon-orange)" />
              </linearGradient>
            </defs>
            <circle cx="140" cy="140" r={R} fill="none" stroke="#eef2ec" strokeWidth="18" />
            <circle
              cx="140" cy="140" r={R} fill="none" stroke="url(#you-score-gauge)" strokeWidth="18" strokeLinecap="round"
              strokeDasharray={`${CIRC * (SAMPLE_SCORE / 100)} ${CIRC}`} transform="rotate(-90 140 140)"
            />
            <text x="140" y="132" textAnchor="middle" className="font-serif" style={{ fontSize: 56, fontWeight: 800, fill: "var(--foreground)" }}>{SAMPLE_SCORE}</text>
            <text x="140" y="166" textAnchor="middle" style={{ fontSize: 14, fill: "var(--muted-foreground)" }}>/ 100</text>
          </svg>
          <span
            className="mx-auto mt-4 block w-fit rounded-full px-4 py-1.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          >
            {SAMPLE_BAND}
          </span>
        </div>
      </ScrollReveal>

      {/* Pillar breakdown */}
      <div className="space-y-3">
        {PILLARS.map((p, i) => (
          <ScrollReveal key={p.label} delay={i * 70}>
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 font-serif text-base font-semibold text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                  {p.label}
                  <span className="text-sm font-normal text-muted-foreground">· {p.description}</span>
                </span>
                <span className="font-serif text-sm font-bold" style={{ color: p.color }}>{p.score}</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#eef2ec]">
                <div className="h-full rounded-full" style={{ width: `${p.score}%`, background: p.gradient }} />
              </div>
            </div>
          </ScrollReveal>
        ))}
        <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
          After the free assessment you&apos;ll get your own EatoBiotics Score across the three biotics —
          and exactly which foods to add first.
        </p>
      </div>
    </div>
  )
}
