import { ScrollReveal } from "@/components/scroll-reveal"
import { Zap, Leaf, Activity, Flame } from "lucide-react"

const SCIENCE_CARDS = [
  {
    icon: Zap,
    title: "Dopamine Pathways",
    body: "Dopamine — central to focus, motivation, and reward — is influenced by the gut microbiome through its role in producing dopamine precursors and regulating the availability of tryptophan, tyrosine, and other building blocks.",
    color: "var(--icon-yellow)",
  },
  {
    icon: Leaf,
    title: "Omega-3 & Brain Function",
    body: "EPA and DHA omega-3 fatty acids are critical structural components of neuronal membranes. Several studies suggest omega-3 supplementation may support attention and reduce hyperactivity, particularly in those with lower baseline intake.",
    color: "var(--icon-teal)",
  },
  {
    icon: Activity,
    title: "Gut Diversity & Cognition",
    body: "Lower gut microbial diversity has been observed in children and adults with ADHD in some studies. Diverse gut ecosystems are associated with more varied short-chain fatty acid production, which may influence brain development and cognitive flexibility.",
    color: "var(--icon-green)",
  },
  {
    icon: Flame,
    title: "Inflammation & Attention",
    body: "Neuroinflammation — driven in part by gut permeability and low microbial diversity — may impair executive function, working memory, and attention regulation. Anti-inflammatory dietary patterns are associated with better cognitive outcomes.",
    color: "var(--icon-orange)",
  },
]

export function AdhdScience() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              The Science
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How the gut may influence focus and attention
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              Four areas where the gut-brain connection intersects with what research knows about
              ADHD, cognitive function, and attention.
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
