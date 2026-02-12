import { ScrollReveal } from "@/components/scroll-reveal"

const biotics = [
  {
    number: "01",
    title: "Prebiotics",
    subtitle: "Feed",
    color: "var(--icon-lime)",
    borderColor: "var(--icon-lime)",
    description:
      "The fibers and compounds in everyday foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus — the fuel your microbiome runs on.",
  },
  {
    number: "02",
    title: "Probiotics",
    subtitle: "Add",
    color: "var(--icon-teal)",
    borderColor: "var(--icon-teal)",
    description:
      "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir. They replenish and diversify the bacterial community in your gut.",
  },
  {
    number: "03",
    title: "Postbiotics",
    subtitle: "Produce",
    color: "var(--icon-orange)",
    borderColor: "var(--icon-orange)",
    description:
      "The beneficial byproducts your gut bacteria create — short-chain fatty acids, vitamins, and neurotransmitters. The actual output that makes you feel better every day.",
  },
]

export function TheThreeBiotics() {
  return (
    <section className="px-6 py-32 md:py-40">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            The Framework
          </p>
          <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl md:text-6xl text-pretty">
            Three types of biotics.
            <br />
            <span className="text-muted-foreground">One food system.</span>
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-12">
          {biotics.map((biotic, index) => (
            <ScrollReveal key={biotic.number} delay={index * 150}>
              <div
                className="flex flex-col rounded-2xl border-t-4 bg-secondary p-8"
                style={{ borderTopColor: biotic.borderColor }}
              >
                <span
                  className="font-serif text-6xl font-normal md:text-7xl"
                  style={{ color: biotic.color }}
                >
                  {biotic.number}
                </span>
                <h3 className="mt-6 text-xl font-semibold text-foreground">
                  {biotic.title}
                </h3>
                <p
                  className="mt-1 text-sm font-medium"
                  style={{ color: biotic.color }}
                >
                  {biotic.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {biotic.description}
                </p>
                {/* Decorative pill */}
                <div
                  className="mt-6 h-1.5 w-12 rounded-full"
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
