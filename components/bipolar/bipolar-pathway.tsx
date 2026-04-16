import { ScrollReveal } from "@/components/scroll-reveal"

const STEPS = [
  {
    number: "01",
    title: "You eat fibre-rich and fermented foods",
    body: "Whole plant foods and fermented foods help nourish and diversify the microbiome, providing the raw material for gut-brain signalling.",
    color: "var(--icon-lime)",
  },
  {
    number: "02",
    title: "Gut bacteria process nutrients",
    body: "Microbes break down fibres and fermented compounds, producing short-chain fatty acids, neurotransmitter precursors, and other signalling molecules.",
    color: "var(--icon-green)",
  },
  {
    number: "03",
    title: "Signals move through the gut-brain axis",
    body: "Those compounds travel via the vagus nerve, bloodstream, and immune pathways — interacting with hormonal, immune, and nervous-system processes.",
    color: "var(--icon-teal)",
  },
  {
    number: "04",
    title: "Your brain and body respond",
    body: "Mood, clarity, energy, and rhythm can all be influenced by what is happening in the gut. A more stable gut environment may support a more stable internal state.",
    color: "var(--icon-yellow)",
  },
]

export function BipolarPathway() {
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
              Food does not directly treat mood conditions — but here is how it
              interacts with the systems that may influence stability.
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
                <div className="flex items-center gap-3 mb-4">
                  <p
                    className="font-serif text-3xl font-bold leading-none"
                    style={{ color: step.color, opacity: 0.25 }}
                  >
                    {step.number}
                  </p>
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground leading-snug mb-2">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                  {step.body}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
