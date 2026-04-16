import { ScrollReveal } from "@/components/scroll-reveal"
import Link from "next/link"

export function AdhdBody() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-4">
            The Bigger Picture
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance mb-8">
            Understanding ADHD Through the Body
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            ADHD is a neurodevelopmental condition with roots in genetics and brain wiring. It is
            not caused by diet, and it cannot be resolved by diet alone. Anyone experiencing ADHD
            deserves professional assessment and support — and, where appropriate, evidence-based
            treatment that may include medication, therapy, and behavioural strategies.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            What emerging research is beginning to suggest is that the gut-brain axis may be one
            contributing factor in the ADHD landscape. Gut microbial diversity has been linked to
            dopamine precursor availability, inflammatory signalling, and aspects of cognitive
            function connected to focus and executive control. Omega-3 fatty acids — produced by
            the bacteria fed through specific foods — have shown promise in supporting neuronal
            membrane health in several studies.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            EatoBiotics frames this through the food system lens: building a more diverse,
            omega-3-rich, and consistent eating pattern is one foundational thing that may support
            cognitive health over time. This sits alongside professional care — not as a
            replacement for it.
          </p>
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
