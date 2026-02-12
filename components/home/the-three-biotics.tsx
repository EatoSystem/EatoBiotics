import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"

const biotics = [
  {
    number: "01",
    title: "Prebiotics",
    subtitle: "Feed",
    description:
      "The fibers and compounds in everyday foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus — the fuel your microbiome runs on.",
  },
  {
    number: "02",
    title: "Probiotics",
    subtitle: "Add",
    description:
      "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir. They replenish and diversify the bacterial community in your gut.",
  },
  {
    number: "03",
    title: "Postbiotics",
    subtitle: "Produce",
    description:
      "The beneficial byproducts your gut bacteria create — short-chain fatty acids, vitamins, and neurotransmitters. The actual output that makes you feel better every day.",
  },
]

export function TheThreeBiotics() {
  return (
    <section className="px-6 py-32 md:py-40">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            The Framework
          </p>
          <h2 className="mt-4 font-serif text-4xl text-[var(--foreground)] sm:text-5xl md:text-6xl text-pretty">
            Three types of biotics.
            <br />
            <span className="text-[var(--muted-foreground)]">One food system.</span>
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-12">
          {biotics.map((biotic, index) => (
            <ScrollReveal key={biotic.number} delay={index * 150}>
              <div className="flex flex-col">
                <GradientText className="font-serif text-6xl md:text-7xl">
                  {biotic.number}
                </GradientText>
                <h3 className="mt-6 text-xl font-semibold text-[var(--foreground)]">
                  {biotic.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-[var(--accent)]">
                  {biotic.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {biotic.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
