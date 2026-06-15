import { ScrollReveal } from "@/components/scroll-reveal"
import { familyScore } from "@/lib/family"

const R = 112
const CIRC = 2 * Math.PI * R

/* Illustrative household: each member's gut health score; the gauge shows the
   rounded average (computed via lib/family.ts — the real scoring logic). */
const MEMBERS = [
  { label: "You", relationship: "Self", score: 78, color: "var(--icon-green)", gradient: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" },
  { label: "Partner", relationship: "Partner", score: 72, color: "var(--icon-teal)", gradient: "linear-gradient(90deg, var(--icon-green), var(--icon-teal))" },
  { label: "Maya", relationship: "Teen", score: 64, color: "var(--icon-yellow)", gradient: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" },
  { label: "Sam", relationship: "Child", score: 81, color: "var(--icon-orange)", gradient: "linear-gradient(90deg, var(--icon-teal), var(--icon-yellow))" },
]

const SAMPLE = familyScore(MEMBERS.map((m) => m.score))

/* Premium Family Score showcase: a large circular gauge of the household
   average plus each member's score. Mirrors EbScoreShowcase, themed green/teal. */
export function FamilyScoreShowcase() {
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
              <linearGradient id="family-score-gauge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--icon-lime)" />
                <stop offset="55%" stopColor="var(--icon-green)" />
                <stop offset="100%" stopColor="var(--icon-teal)" />
              </linearGradient>
            </defs>
            <circle cx="140" cy="140" r={R} fill="none" stroke="#eef2ec" strokeWidth="18" />
            <circle
              cx="140" cy="140" r={R} fill="none" stroke="url(#family-score-gauge)" strokeWidth="18" strokeLinecap="round"
              strokeDasharray={`${CIRC * ((SAMPLE.average ?? 0) / 100)} ${CIRC}`} transform="rotate(-90 140 140)"
            />
            <text x="140" y="132" textAnchor="middle" className="font-serif" style={{ fontSize: 56, fontWeight: 800, fill: "var(--foreground)" }}>{SAMPLE.average}</text>
            <text x="140" y="166" textAnchor="middle" style={{ fontSize: 14, fill: "var(--muted-foreground)" }}>/ 100</text>
          </svg>
          <span
            className="mx-auto mt-4 block w-fit rounded-full px-4 py-1.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          >
            Family Score · {SAMPLE.contributors} members
          </span>
        </div>
      </ScrollReveal>

      {/* Per-member breakdown */}
      <div className="space-y-3">
        {MEMBERS.map((m, i) => (
          <ScrollReveal key={m.label} delay={i * 70}>
            <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2.5 font-serif text-base font-semibold text-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                  {m.label}
                  <span className="text-sm font-normal text-muted-foreground">· {m.relationship}</span>
                </span>
                <span className="font-serif text-sm font-bold" style={{ color: m.color }}>{m.score}</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#eef2ec]">
                <div className="h-full rounded-full" style={{ width: `${m.score}%`, background: m.gradient }} />
              </div>
            </div>
          </ScrollReveal>
        ))}
        <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
          Each member&apos;s score rolls up into your Family Food System Score — so you can see where the
          whole household is thriving, and where to focus next.
        </p>
      </div>
    </div>
  )
}
