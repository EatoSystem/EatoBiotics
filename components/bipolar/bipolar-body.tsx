import { ScrollReveal } from "@/components/scroll-reveal"
import Link from "next/link"

export function BipolarBody() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-4">
            The Bigger Picture
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance mb-8">
            Understanding Bipolar Through the Body
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Bipolar disorder is a complex condition shaped by genetics, brain chemistry, environment,
            sleep, stress, and many other factors. It is not caused by diet — and it cannot be
            resolved by diet. Anyone living with bipolar disorder needs professional care and, in
            most cases, evidence-based treatment alongside lifestyle support.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            What emerging science is beginning to show, however, is that the gut-brain axis — the
            bidirectional communication system between the digestive system and the brain — may be
            one factor among many that influences mood regulation, inflammation, and daily rhythm.
            The gut microbiome produces neurotransmitter precursors, modulates immune activity, and
            interacts with the body&apos;s internal clock in ways that are still being understood.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            EatoBiotics frames this through the lens of &ldquo;the food system inside you&rdquo; —
            the idea that building a diverse, nourished, and consistent gut ecosystem is one
            foundational thing you can do to support your body&apos;s overall resilience. This page
            is about that one piece. It sits alongside professional care, not instead of it.
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
