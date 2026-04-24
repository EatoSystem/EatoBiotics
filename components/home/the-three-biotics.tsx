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
  },
]

export function TheThreeBiotics() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="section-divider mb-24 md:mb-32" />

      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                The Biotics
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-pretty">
                Three types of biotics.
                <br />
                <span className="brand-gradient-text">One food system.</span>
              </h2>
            </div>
            <Link
              href="/biotics"
              className="flex items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange"
            >
              Explore the framework
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

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
      </div>
    </section>
  )
}
