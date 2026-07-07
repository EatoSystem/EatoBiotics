import { Sparkles, TrendingUp, Flower2, Trees, type LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/**
 * TimelineSection — "How your Food System evolves."
 * The ImpactJourney spine pattern (gradient spine + eb-spine-flow travelling
 * light) with four life-arc stops: Today → Improve → Life stages → Healthy
 * ageing. Server component, CSS-only motion.
 */

type Stop = {
  label: string
  title: string
  body: string
  icon: LucideIcon
  color: string
}

const STOPS: Stop[] = [
  {
    label: "Today",
    title: "Understand your baseline",
    body: "Your You or Family foundation creates your Food System Score — the living starting point everything else builds on.",
    icon: Sparkles,
    color: "var(--icon-green)",
  },
  {
    label: "Improve",
    title: "Strengthen what matters",
    body: "Layer on Health systems — Stability, Glucose, Mind, Performance — to strengthen the specific areas your foundation revealed.",
    icon: TrendingUp,
    color: "var(--icon-teal)",
  },
  {
    label: "Life stages",
    title: "Support the big transitions",
    body: "Life systems carry your Food System through pregnancy, birth, and the first years — food-first, gentle, and human.",
    icon: Flower2,
    color: "var(--icon-yellow)",
  },
  {
    label: "Healthy ageing",
    title: "Grow with it for life",
    body: "The same Food System, decades on — diversity, rhythm, and patterns associated with ageing well.",
    icon: Trees,
    color: "var(--icon-orange)",
  },
]

function Orb({ stop }: { stop: Stop }) {
  const Icon = stop.icon
  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <span
        aria-hidden
        className="eb-pulse-soft absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, color-mix(in srgb, ${stop.color} 30%, transparent), transparent 70%)` }}
      />
      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 bg-card shadow-lg"
        style={{ borderColor: stop.color }}
      >
        <Icon size={20} style={{ color: stop.color }} />
      </span>
    </div>
  )
}

function StopCard({ stop, align }: { stop: Stop; align: "left" | "right" }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 shadow-sm ${align === "right" ? "md:text-right" : ""}`}>
      <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: stop.color }}>{stop.label}</p>
      <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">{stop.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{stop.body}</p>
    </div>
  )
}

export function TimelineSection() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-icon-green">The long arc</p>
            <h2 className="mt-3 font-serif text-3xl font-semibold leading-tight text-foreground sm:text-4xl md:text-5xl text-balance">
              How your Food System <span className="brand-gradient-text">evolves.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              A Food System isn&apos;t a moment — it&apos;s a companion. It changes with every meal,
              every habit, and every stage of life.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className="relative mx-auto mt-14 max-w-3xl">
            {/* glowing gradient spine */}
            <div
              aria-hidden
              className="absolute bottom-0 top-0 w-[3px] -translate-x-1/2 rounded-full left-[31px] md:left-1/2"
              style={{
                background: "linear-gradient(180deg,#A8E063,#4CB648,#2DAA6E,#F5C518,#F5A623)",
                boxShadow: "0 0 22px rgba(245,197,24,0.35)",
              }}
            />
            {/* travelling light overlay on the spine */}
            <div
              aria-hidden
              className="eb-spine-flow absolute bottom-0 top-0 w-[3px] -translate-x-1/2 rounded-full left-[31px] md:left-1/2"
              style={{
                background: "repeating-linear-gradient(180deg, rgba(255,255,255,0) 0 12px, rgba(255,255,255,0.85) 12px 20px, rgba(255,255,255,0) 20px 60px)",
                backgroundSize: "100% 240px",
              }}
            />

            <div className="flex flex-col gap-8 md:gap-12">
              {STOPS.map((stop, i) => {
                const right = i % 2 === 1
                return (
                  <div key={stop.label} className="relative grid grid-cols-[64px_1fr] items-center gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                    <div className="hidden md:block">{right ? null : <StopCard stop={stop} align="right" />}</div>
                    <div className="flex items-center justify-center">
                      <Orb stop={stop} />
                    </div>
                    <div className="hidden md:block">{right ? <StopCard stop={stop} align="left" /> : null}</div>
                    <div className="md:hidden">
                      <StopCard stop={stop} align="left" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
