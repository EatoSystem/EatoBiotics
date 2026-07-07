import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

/** Section 3 of the flagship recipe — the N-pillar "Framework" grid (Stability's
 * 4 Systems, Mind's 5 Pillars, Glucose's 3 Systems), generalised for any system. */

const PALETTE = ["var(--icon-lime)", "var(--icon-green)", "var(--icon-teal)", "var(--icon-yellow)", "var(--icon-orange)"]

export interface SystemPillar {
  icon: LucideIcon
  title: string
  label: string
  description: string
}

export function SystemPillarsGrid({
  eyebrow = "The Framework",
  heading,
  blurb,
  pillars,
}: {
  eyebrow?: string
  heading: ReactNode
  blurb: string
  pillars: SystemPillar[]
}) {
  const cols = pillars.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-icon-teal">{eyebrow}</p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">{heading}</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{blurb}</p>
        </ScrollReveal>

        <div className={`mt-16 grid gap-6 sm:grid-cols-2 ${cols}`}>
          {pillars.map((p, index) => {
            const accent = PALETTE[index % PALETTE.length]
            const Icon = p.icon
            const bgGradient = `linear-gradient(160deg, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%)`
            return (
              <ScrollReveal key={p.title} delay={index * 80}>
                <div
                  className="relative flex h-full flex-col rounded-3xl p-6 transition-shadow hover:shadow-lg"
                  style={{ background: bgGradient, border: `1.5px solid color-mix(in srgb, ${accent} 30%, transparent)`, borderLeft: `4px solid ${accent}` }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${accent} 15%, transparent)` }}>
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">{p.title}</h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>{p.label}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
