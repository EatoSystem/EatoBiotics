import { ScrollReveal } from "@/components/scroll-reveal"
import Link from "next/link"

export function AnxietyBody() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-4">
            The Bigger Picture
          </p>
          <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance mb-8">
            Understanding Anxiety Through the Body
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            Anxiety is a complex, multi-layered experience that can arise from genetics, life
            experience, trauma, brain chemistry, environment, and many other factors working
            together. It is not caused by diet, and it cannot be resolved by diet alone. Anyone
            experiencing persistent anxiety deserves professional support and, where appropriate,
            evidence-based care.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={140}>
          <p className="text-base leading-relaxed text-muted-foreground mb-5">
            What emerging science suggests is that the gut is deeply involved in the stress
            response. The hypothalamic-pituitary-adrenal (HPA) axis — the body&apos;s central
            stress-management system — is bidirectionally connected to the gut microbiome. Gut
            bacteria also produce GABA, the primary calming neurotransmitter, and communicate
            directly with the brain via the vagus nerve. The health of the gut may influence
            how calmly or reactively the body responds to perceived threats.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="text-base leading-relaxed text-muted-foreground mb-8">
            EatoBiotics frames this through the food system lens: a more diverse, well-nourished
            gut ecosystem is one foundational thing that may support the body&apos;s baseline
            resilience. This sits alongside professional care — not as a replacement for it.
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
