import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "You eat omega-3-rich and fibre-rich foods",
    body: "Oily fish, seeds, plant diversity, and fermented foods provide the building blocks for neuronal membrane health and a diverse gut ecosystem.",
    color: "var(--icon-lime)",
  },
  {
    number: "02",
    title: "Gut bacteria produce key compounds",
    body: "A diverse microbiome ferments fibre into short-chain fatty acids, regulates dopamine precursor availability, and supports anti-inflammatory signalling.",
    color: "var(--icon-green)",
  },
  {
    number: "03",
    title: "Signals reach the brain",
    body: "Omega-3s integrate into neuronal membranes, SCFAs reduce neuroinflammation, and gut signals travel via the vagus nerve to brain regions governing attention.",
    color: "var(--icon-teal)",
  },
  {
    number: "04",
    title: "Focus and regulation respond",
    body: "A better-nourished gut and brain environment may support more available dopamine signalling, reduced neuroinflammation, and improved executive function over time.",
    color: "var(--icon-yellow)",
  },
]

export function AdhdPathway() {
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
              Food does not directly treat ADHD — but here is how it interacts with the
              biological systems connected to focus, attention, and cognitive function.
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
