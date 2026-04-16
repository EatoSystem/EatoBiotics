import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "You eat fibre-rich and fermented foods",
    body: "Plant diversity and fermented foods feed the gut bacteria responsible for serotonin precursor production and anti-inflammatory signalling.",
    color: "var(--icon-lime)",
  },
  {
    number: "02",
    title: "Gut bacteria produce key compounds",
    body: "Microbes ferment dietary fibre into short-chain fatty acids like butyrate, and trigger serotonin production in the gut lining.",
    color: "var(--icon-green)",
  },
  {
    number: "03",
    title: "Signals travel to the brain",
    body: "Serotonin precursors, immune signals, and SCFAs move via the vagus nerve and bloodstream, interacting with brain chemistry and inflammatory pathways.",
    color: "var(--icon-teal)",
  },
  {
    number: "04",
    title: "Mood and resilience respond",
    body: "A better-nourished gut environment may support serotonin availability, reduced neuroinflammation, and a more stable mood baseline over time.",
    color: "var(--icon-yellow)",
  },
]

export function DepressionPathway() {
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
              Food does not directly treat depression — but here is how it interacts with the
              biological systems connected to mood and wellbeing.
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
