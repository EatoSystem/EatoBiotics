import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "You eat calming, fibre-rich foods",
    body: "Fermented foods, plant diversity, and magnesium-rich foods nourish the bacteria that produce GABA precursors and modulate the stress response.",
    color: "var(--icon-lime)",
  },
  {
    number: "02",
    title: "Gut bacteria produce calming compounds",
    body: "Specific microbial species process nutrients into GABA precursors, short-chain fatty acids, and anti-inflammatory signals that move through the gut lining.",
    color: "var(--icon-green)",
  },
  {
    number: "03",
    title: "The vagus nerve carries signals upward",
    body: "These gut signals travel via the vagus nerve to the brain's stress centres, potentially influencing how sensitively the HPA axis responds to perceived threats.",
    color: "var(--icon-teal)",
  },
  {
    number: "04",
    title: "The stress response becomes more balanced",
    body: "A well-nourished gut may support a more calibrated stress response — less reactive, more adaptive, and better able to return to baseline after a challenge.",
    color: "var(--icon-yellow)",
  },
]

export function AnxietyPathway() {
  return (
    <section className="px-6 py-16 md:py-24 bg-secondary/30">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              The Pathway
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How food becomes system support
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              Food does not directly treat anxiety — but here is how it interacts with the
              biological systems connected to stress and resilience.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.number} delay={i * 80}>
              <div
                className="relative flex h-full flex-col rounded-3xl p-6 transition-shadow hover:shadow-lg"
                style={{
                  background: `color-mix(in srgb, ${step.color} 6%, white)`,
                  border: `1.5px solid color-mix(in srgb, ${step.color} 25%, transparent)`,
                  borderLeft: `4px solid ${step.color}`,
                }}
              >
                <p
                  className="font-serif text-3xl font-bold leading-none mb-4"
                  style={{ color: step.color, opacity: 0.25 }}
                >
                  {step.number}
                </p>
                <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">{step.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
