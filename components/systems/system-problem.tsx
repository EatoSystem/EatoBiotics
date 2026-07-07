import type { ReactNode } from "react"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { SystemDef } from "@/lib/systems"

/** Section 2 of the flagship recipe — editorial 2-col: headline+quote / grey card. */
export function SystemProblem({
  system,
  eyebrow = "The Reality",
  heading,
  quote,
  bodyParagraphs,
}: {
  system: SystemDef
  eyebrow?: string
  heading: ReactNode
  quote?: string
  bodyParagraphs: string[]
}) {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: system.accent }}>{eyebrow}</p>
            <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">{heading}</h2>
            {quote && (
              <blockquote className="mt-8 border-l-2 pl-6 font-serif text-xl font-medium italic text-foreground" style={{ borderColor: system.accent }}>
                &ldquo;{quote}&rdquo;
              </blockquote>
            )}
          </ScrollReveal>
          <ScrollReveal delay={150}>
            <div className="rounded-3xl border border-border bg-secondary/40 p-8 md:p-10">
              {bodyParagraphs.map((p, i) => (
                <p key={i} className={`text-base leading-relaxed text-muted-foreground ${i > 0 ? "mt-4" : ""}`}>{p}</p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
