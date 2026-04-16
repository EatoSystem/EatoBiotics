import { ScrollReveal } from "@/components/scroll-reveal"
import { Zap, Leaf, Activity, Flame } from "lucide-react"

const SCIENCE_CARDS = [
  {
    icon: Flame,
    title: "The HPA Axis",
    body: "The hypothalamic-pituitary-adrenal axis governs the body's stress response. Gut microbiome health may influence how sensitively this system reacts — with lower diversity linked to heightened cortisol reactivity in several studies.",
    color: "var(--icon-orange)",
  },
  {
    icon: Leaf,
    title: "GABA & the Gut",
    body: "GABA is the brain's primary calming neurotransmitter. Certain gut bacteria — particularly Lactobacillus and Bifidobacterium species — produce GABA precursors and may influence the availability of this calming signal.",
    color: "var(--icon-lime)",
  },
  {
    icon: Activity,
    title: "The Vagus Nerve",
    body: "Around 80% of vagus nerve signals travel from the gut to the brain. This pathway carries information about the gut's state — diversity, inflammation, and tone — directly to the brain's anxiety and threat-response centres.",
    color: "var(--icon-teal)",
  },
  {
    icon: Zap,
    title: "Microbial Diversity & Resilience",
    body: "A more diverse gut microbiome is generally associated with a more flexible and resilient stress response. Higher diversity may support more balanced cortisol and inflammatory signalling under pressure.",
    color: "var(--icon-green)",
  },
]

export function AnxietyScience() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              The Science
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How the gut may influence the stress response
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              Four areas where the gut-brain connection intersects with what research knows about
              anxiety and the body&apos;s stress system.
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
                  <h3 className="font-serif text-lg font-semibold mb-2" style={{ color: card.color }}>
                    {card.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground flex-1">{card.body}</p>
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
