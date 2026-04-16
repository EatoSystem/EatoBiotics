import { ScrollReveal } from "@/components/scroll-reveal"
import { Flame, Zap, Moon, Leaf } from "lucide-react"

const SCIENCE_CARDS = [
  {
    icon: Flame,
    title: "Inflammation",
    body: "Lower microbial diversity has been associated with higher systemic inflammation, which may affect mood regulation and overall system resilience. Emerging research suggests gut-driven inflammation as one factor worth exploring in mood conditions.",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
  },
  {
    icon: Zap,
    title: "Neurotransmitter Activity",
    body: "Gut microbes help shape pathways involved in serotonin, dopamine, and GABA production — neurotransmitters connected to mood, motivation, and brain function. The gut produces around 90–95% of the body's serotonin.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    icon: Moon,
    title: "Circadian Rhythm",
    body: "The gut microbiome interacts with the body's internal clock. Disruptions to this rhythm — through irregular eating, poor sleep, or low microbial diversity — may affect daily energy patterns, sleep quality, and mood stability.",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-yellow))",
  },
  {
    icon: Leaf,
    title: "Microbial Diversity",
    body: "A more diverse gut ecosystem is generally associated with a more stable and adaptable internal environment. Diversity is built through consistent plant variety, fermented foods, and fibre-rich eating over time.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
]

export function BipolarScience() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              The Science
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How the gut may influence mood stability
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              These are four areas where the gut-brain connection is being actively studied in
              relation to mood conditions. The research is emerging — and promising.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SCIENCE_CARDS.map((card, i) => {
            const Icon = card.icon
            return (
              <ScrollReveal key={card.title} delay={i * 80}>
                <div
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-6"
                  style={{ borderTop: `3px solid ${card.color}` }}
                >
                  <div
                    className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ background: `color-mix(in srgb, ${card.color} 15%, transparent)` }}
                  >
                    <Icon size={18} style={{ color: card.color }} />
                  </div>
                  <h3
                    className="font-serif text-lg font-semibold text-foreground mb-2"
                    style={{ color: card.color }}
                  >
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                    {card.body}
                  </p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
