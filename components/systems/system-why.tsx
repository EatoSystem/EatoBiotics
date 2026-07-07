import { ArrowRight } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { SystemDef } from "@/lib/systems"

/** Section 5 of the flagship recipe — "Why [System]" contrast cards. */

export interface ContrastPoint {
  icon: LucideIcon
  from: string
  to: string
}

export function SystemWhyCards({
  system,
  eyebrow,
  heading,
  bodyParagraphs,
  quote,
  points,
}: {
  system: SystemDef
  eyebrow: string
  heading: string
  bodyParagraphs: string[]
  quote?: string
  points: ContrastPoint[]
}) {
  return (
    <section className="bg-secondary/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-start lg:gap-24">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: system.accent }}>{eyebrow}</p>
            <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">{heading}</h2>
            {bodyParagraphs.map((p, i) => (
              <p key={i} className={`text-base leading-relaxed text-muted-foreground ${i === 0 ? "mt-6" : "mt-4"}`}>{p}</p>
            ))}
            {quote && (
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: system.accent }}>
                &ldquo;{quote}&rdquo;
              </blockquote>
            )}
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="space-y-5">
              {points.map((item, i) => (
                <div key={i} className="flex gap-5 rounded-2xl border border-border bg-background p-6">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${system.accent} 15%, transparent)` }}>
                    <item.icon size={20} style={{ color: system.accent }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/40">{item.from}</p>
                    <p className="mt-1 flex items-center gap-2 font-semibold text-foreground">
                      <ArrowRight size={15} style={{ color: system.accent }} /> {item.to}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
