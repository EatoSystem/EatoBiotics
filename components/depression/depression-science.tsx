import { ScrollReveal } from "@/components/scroll-reveal"
import { Zap, Flame, Leaf, Moon } from "lucide-react"

const SCIENCE_CARDS = [
  {
    icon: Zap,
    title: "Serotonin Production",
    body: "Around 90–95% of the body's serotonin is produced in the gut, not the brain. The gut microbiome directly shapes the enterochromaffin cells responsible for this production — making gut health central to serotonin availability.",
    color: "var(--icon-teal)",
  },
  {
    icon: Flame,
    title: "Inflammation",
    body: "Chronic low-grade inflammation — often driven by poor gut diversity and diet — has been consistently associated with depression in research. Short-chain fatty acids produced by gut bacteria may help modulate this inflammatory activity.",
    color: "var(--icon-orange)",
  },
  {
    icon: Leaf,
    title: "Short-Chain Fatty Acids",
    body: "When gut bacteria ferment dietary fibre, they produce butyrate and other SCFAs that can cross the blood-brain barrier. These molecules may reduce neuroinflammation and support the brain environment associated with mood regulation.",
    color: "var(--icon-lime)",
  },
  {
    icon: Moon,
    title: "Microbial Diversity",
    body: "Studies consistently find lower gut microbial diversity in people experiencing depression compared to those who are not. Higher diversity is associated with more resilient serotonin signalling and inflammatory balance.",
    color: "var(--icon-green)",
  },
]

export function DepressionScience() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              The Science
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How the gut may influence mood
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              Four areas where the gut-brain connection intersects with what research knows about
              depression and low mood.
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
