import { ScrollReveal } from "@/components/scroll-reveal"

const biotics = [
  {
    number: "01",
    title: "Prebiotics",
    subtitle: "Feed",
    color: "var(--icon-lime)",
    gradientFrom: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    description:
      "The fibers and compounds in everyday foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus -- the fuel your microbiome runs on.",
  },
  {
    number: "02",
    title: "Probiotics",
    subtitle: "Add",
    color: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    description:
      "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir. They replenish and diversify the bacterial community in your gut.",
  },
  {
    number: "03",
    title: "Postbiotics",
    subtitle: "Produce",
    color: "var(--icon-orange)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    description:
      "The beneficial byproducts your gut bacteria create -- short-chain fatty acids, vitamins, and neurotransmitters. The actual output that makes you feel better every day.",
  },
]

export function TheThreeBiotics() {
  return (
    <section className="px-6 py-32 md:py-40">
      {/* Top gradient divider */}
      <div className="section-divider mb-32 md:mb-40" />

      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
            The Framework
          </p>
          <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-pretty">
            Three types of biotics.
            <br />
            <span className="brand-gradient-text">One food system.</span>
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
          {biotics.map((biotic, index) => (
            <ScrollReveal key={biotic.number} delay={index * 150}>
              <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                {/* Top gradient bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ background: `linear-gradient(90deg, ${biotic.gradientFrom}, ${biotic.gradientTo})` }}
                />
                <span
                  className="font-serif text-6xl font-semibold md:text-7xl"
                  style={{ color: biotic.color }}
                >
                  {biotic.number}
                </span>
                <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">
                  {biotic.title}
                </h3>
                <p
                  className="mt-1 text-sm font-semibold uppercase tracking-wider"
                  style={{ color: biotic.color }}
                >
                  {biotic.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {biotic.description}
                </p>
                {/* Bottom decorative gradient pill */}
                <div
                  className="mt-6 h-2 w-20 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${biotic.gradientFrom}, ${biotic.gradientTo})` }}
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
