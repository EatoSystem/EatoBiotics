import { ScrollReveal } from "@/components/scroll-reveal"

const STATS = [
  {
    value: "90–95%",
    label: "of serotonin made in the gut",
    description:
      "Serotonin — the neurotransmitter most associated with mood, sleep, and wellbeing — is produced almost entirely by enterochromaffin cells in your gut wall, not your brain.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    value: "500M+",
    label: "neurons in the enteric nervous system",
    description:
      "Your gut has its own nervous system — the enteric nervous system — containing more neurons than your spinal cord. It communicates bidirectionally with your brain via the vagus nerve.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    value: "SCFAs",
    label: "reduce neuroinflammation",
    description:
      "When gut bacteria ferment dietary fibre, they produce short-chain fatty acids like butyrate. These molecules cross the blood-brain barrier and directly reduce neuroinflammation — a key driver of depression and cognitive decline.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
]

const MECHANISM_STEPS = [
  {
    number: "01",
    title: "You eat plants and fermented foods",
    body: "Dietary fibre, polyphenols, and live cultures reach your gut microbiome.",
    color: "var(--icon-lime)",
  },
  {
    number: "02",
    title: "Gut bacteria ferment the fibre",
    body: "Specific microbial populations convert fibre into short-chain fatty acids, and trigger serotonin production in enterochromaffin cells.",
    color: "var(--icon-green)",
  },
  {
    number: "03",
    title: "The vagus nerve carries signals upward",
    body: "80% of vagus nerve signals travel from gut to brain — not the other way around. Your gut is the reporter. Your brain is the receiver.",
    color: "var(--icon-teal)",
  },
  {
    number: "04",
    title: "Your brain responds",
    body: "Mood stabilises, focus sharpens, sleep deepens, and anxiety reduces — as a direct downstream effect of what happened in your gut.",
    color: "var(--icon-yellow)",
  },
]

export function GutBrainScience() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal mb-3">
              The Science
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How your gut shapes your mind
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base text-muted-foreground leading-relaxed">
              The gut-brain axis is not a metaphor. It is a physical, bidirectional communication
              system — and what you eat is the primary input that controls it.
            </p>
          </div>
        </ScrollReveal>

        {/* 3 stat cards */}
        <div className="grid gap-5 sm:grid-cols-3 mb-16">
          {STATS.map((stat, i) => (
            <ScrollReveal key={stat.value} delay={i * 80}>
              <div
                className="relative overflow-hidden rounded-3xl border border-border bg-background p-6"
                style={{
                  borderTop: `3px solid ${stat.color}`,
                }}
              >
                <p
                  className="font-serif text-4xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{stat.label}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Mechanism flow */}
        <ScrollReveal>
          <div className="rounded-3xl border border-border bg-secondary/30 p-8 md:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
              How it works — the pathway
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {MECHANISM_STEPS.map((step, i) => (
                <div key={step.number} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: step.color }}
                    >
                      {step.number}
                    </p>
                    {i < MECHANISM_STEPS.length - 1 && (
                      <div
                        className="hidden lg:block flex-1 h-px"
                        style={{
                          background: `linear-gradient(90deg, ${step.color}, transparent)`,
                        }}
                      />
                    )}
                  </div>
                  <h3 className="font-serif text-base font-semibold text-foreground leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
