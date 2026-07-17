import { ScrollReveal } from "@/components/scroll-reveal"
import Link from "next/link"
import type { ConditionDef } from "@/lib/conditions"

export function ConditionBody({ condition }: { condition: ConditionDef }) {
  const [p1, p2, p3] = condition.body.paragraphs
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-4">
            The Bigger Picture
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance mb-8">
            {condition.body.heading}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">{p1}</p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">{p2}</p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">{p3}</p>
        </ScrollReveal>

        <ScrollReveal delay={240}>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/gut-brain"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              The gut-brain connection →
            </Link>
            <Link
              href="/biotics"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              How the 3 biotics work →
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
