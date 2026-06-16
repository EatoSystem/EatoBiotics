import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

const biotics = [
  {
    number: "01",
    title: "Prebiotics",
    subtitle: "Feed",
    color: "var(--icon-lime)",
    gradientFrom: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    image: "/prebiotics-1.png",
    description:
      "The fibers and compounds in everyday foods that nourish your beneficial gut bacteria. Think garlic, onions, oats, bananas, and asparagus -- the fuel your microbiome runs on.",
    stat: "30+ plant foods/week",
  },
  {
    number: "02",
    title: "Probiotics",
    subtitle: "Add",
    color: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    image: "/probiotics-1.png",
    description:
      "Living microorganisms found in fermented foods like yogurt, kimchi, sauerkraut, and kefir. They replenish and diversify the bacterial community in your gut.",
    stat: "2–3 servings/week",
  },
  {
    number: "03",
    title: "Postbiotics",
    subtitle: "Produce",
    color: "var(--icon-orange)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    image: "/postbiotics-1.png",
    description:
      "The beneficial byproducts your gut bacteria create -- short-chain fatty acids, vitamins, and neurotransmitters. The actual output that makes you feel better every day.",
    stat: "Better gut resilience",
  },
]

const quadrants = [
  {
    label: "Fiber Foundation",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    examples: ["Leafy greens", "Legumes", "Root vegetables", "Whole grains"],
    biotic: "PREBIOTIC",
  },
  {
    label: "Fermented Foods",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    examples: ["Yogurt", "Kimchi", "Sauerkraut", "Kefir"],
    biotic: "PROBIOTIC",
  },
  {
    label: "Quality Protein",
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    examples: ["Eggs", "Salmon", "Beans", "Tempeh"],
    biotic: "PROTEIN",
  },
  {
    label: "Healthy Fats",
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    examples: ["Olive oil", "Avocado", "Nuts", "Seeds"],
    biotic: "POSTBIOTIC",
  },
]

export function TheFramework() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <ScrollReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                The Framework
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-pretty">
                Three biotics.
                <br />
                <span className="brand-gradient-text">One plate.</span>
              </h2>
            </div>
            <Link
              href="/biotics"
              className="flex items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange"
            >
              Learn the framework
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

        {/* ── The three biotics ───────────────────────────────────────────── */}
        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
          {biotics.map((biotic, index) => (
            <ScrollReveal key={biotic.number} delay={index * 150}>
              <Link href="/biotics" className="group block h-full">
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
                  {/* Top gradient bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${biotic.gradientFrom}, ${biotic.gradientTo})` }}
                  />
                  {/* Biotics image */}
                  <div className="w-full overflow-hidden">
                    <Image
                      src={biotic.image}
                      alt={biotic.title}
                      width={600}
                      height={360}
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex flex-col flex-1 p-8">
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
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {biotic.description}
                    </p>
                    <span
                      className="mt-5 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${biotic.color} 15%, transparent)`,
                        color: `color-mix(in srgb, ${biotic.color} 78%, var(--foreground))`,
                      }}
                    >
                      {biotic.stat}
                    </span>
                    <div className="mt-6 flex items-center justify-between">
                      <div
                        className="h-2 w-20 rounded-full"
                        style={{ background: `linear-gradient(90deg, ${biotic.gradientFrom}, ${biotic.gradientTo})` }}
                      />
                      <span
                        className="flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: biotic.color }}
                      >
                        Learn more <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        {/* ── The plate: how the three biotics land on your plate ─────────── */}
        <div className="mt-20 border-t border-border/60" />

        <div className="mt-16 flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* Left: text */}
          <div className="lg:w-[420px] lg:shrink-0">
            <ScrollReveal>
              <h3 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
                One plate.{" "}
                <span className="brand-gradient-text">Built once a week.</span>
              </h3>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                The EatoBiotics Plate turns the three biotics into one practical habit. Four
                quadrants — built once on Monday, eaten every day until Friday. One decision. Five
                days of consistency.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Each quadrant feeds a different part of your microbiome, giving it everything it
                needs to produce the compounds that make you feel better every day.
              </p>
            </ScrollReveal>
          </div>

          {/* Right: plate image + quadrant cards */}
          <div className="flex-1">
            <ScrollReveal delay={100}>
              <div className="flex justify-center">
                <Image
                  src="/eatobiotics-plate.png"
                  alt="The EatoBiotics Plate — divided into four sections: Prebiotic Base with leafy greens and vegetables, Probiotic Side with fermented foods, Postbiotic Builders with berries and dark chocolate, and Protein Balance with salmon, eggs and beans."
                  width={500}
                  height={500}
                  className="w-full max-w-[420px] drop-shadow-md"
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                A circular system where each biotic type supports the next.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {quadrants.map((q, index) => (
                  <ScrollReveal key={q.label} delay={index * 80}>
                    <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-shadow hover:shadow-lg">
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ background: q.gradient }}
                      />
                      <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: q.color }}
                      >
                        {q.biotic}
                      </p>
                      <h4 className="mt-1.5 font-serif text-base font-semibold text-foreground">
                        {q.label}
                      </h4>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {q.examples.map((ex) => (
                          <span
                            key={ex}
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ background: q.gradient }}
                          >
                            {ex}
                          </span>
                        ))}
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Build this plate once. Eat it five days. Change it next week.
              </p>
            </ScrollReveal>
          </div>
        </div>

      </div>
    </section>
  )
}
