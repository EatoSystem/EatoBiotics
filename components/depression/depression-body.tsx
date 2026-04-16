import { ScrollReveal } from "@/components/scroll-reveal"
import Link from "next/link"

export function DepressionBody() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-4">
            The Bigger Picture
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance mb-8">
            Understanding Depression Through the Body
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Depression is a complex condition shaped by genetics, brain chemistry, life experience,
            stress, sleep, and many other factors working together. It is not caused by diet, and
            it cannot be resolved by diet alone. Anyone experiencing depression deserves professional
            support and, where appropriate, evidence-based treatment.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            What emerging research is beginning to show is that approximately 90–95% of the body&apos;s
            serotonin — the neurotransmitter most closely associated with mood and wellbeing — is
            produced in the gut, not the brain. The gut microbiome influences this production, along
            with inflammatory signalling, the stress response system, and the body&apos;s internal clock.
            All of these are areas where food choices can play a supporting role.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            EatoBiotics does not frame food as a cure for depression. What it does offer is a
            framework for building a healthier gut ecosystem — one that may, over time, support the
            biological systems that feed into mood, resilience, and overall mental wellbeing.
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
