import { ScrollReveal } from "@/components/scroll-reveal"
import type { ConditionDef } from "@/lib/conditions"

export function ConditionScience({ condition }: { condition: ConditionDef }) {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              The Science
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              {condition.science.heading}
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              {condition.science.intro}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {condition.science.cards.map((card, i) => {
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
