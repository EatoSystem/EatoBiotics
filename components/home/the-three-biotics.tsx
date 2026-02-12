import { ScrollReveal } from "@/components/scroll-reveal"

const biotics = [
  {
    number: "01",
    title: "Prebiotics",
    subtitle: "Feed",
    color: "var(--icon-lime)",
    bg: "rgba(168,224,99,0.15)",
    borderColor: "var(--icon-lime)",
    description:
      "The fibers and compounds in everyday foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus — the fuel your microbiome runs on.",
  },
  {
    number: "02",
    title: "Probiotics",
    subtitle: "Add",
    color: "var(--icon-teal)",
    bg: "rgba(45,170,110,0.12)",
    borderColor: "var(--icon-teal)",
    description:
      "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir. They replenish and diversify the bacterial community in your gut.",
  },
  {
    number: "03",
    title: "Postbiotics",
    subtitle: "Produce",
    color: "var(--icon-orange)",
    bg: "rgba(245,166,35,0.12)",
    borderColor: "var(--icon-orange)",
    description:
      "The beneficial byproducts your gut bacteria create — short-chain fatty acids, vitamins, and neurotransmitters. The actual output that makes you feel better every day.",
  },
]

export function TheThreeBiotics() {
  return (
    <section className="bg-warm-green px-6 py-32 md:py-40">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
            The Framework
          </p>
          <h2 className="mt-4 font-serif text-4xl font-800 text-foreground sm:text-5xl md:text-6xl text-pretty">
            Three types of biotics.
            <br />
            <span className="brand-gradient-text">One food system.</span>
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
          {biotics.map((biotic, index) => (
            <ScrollReveal key={biotic.number} delay={index * 150}>
              <div
                className="flex flex-col rounded-2xl border-l-4 p-8 shadow-sm"
                style={{
                  borderLeftColor: biotic.borderColor,
                  backgroundColor: biotic.bg,
                }}
              >
                <span
                  className="font-serif text-6xl font-800 md:text-7xl"
                  style={{ color: biotic.color }}
                >
                  {biotic.number}
                </span>
                <h3 className="mt-6 font-serif text-xl font-700 text-foreground">
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
                {/* Decorative pill */}
                <div
                  className="mt-6 h-2 w-16 rounded-full"
                  style={{ backgroundColor: biotic.color }}
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
