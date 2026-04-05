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
    description:
      "The fibers and compounds in everyday foods that feed your family's gut bacteria. Think oats, bananas, garlic, and beans — foods kids already know and adults can build every meal around.",
  },
  {
    number: "02",
    title: "Probiotics",
    subtitle: "Add",
    color: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    description:
      "Living microorganisms found in fermented foods like yogurt, kefir, and cheese. Easy to add to family meals — and one of the most powerful ways to diversify gut bacteria at any age.",
  },
  {
    number: "03",
    title: "Postbiotics",
    subtitle: "Produce",
    color: "var(--icon-orange)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    description:
      "The compounds your family's gut bacteria produce — the thing that drives better energy, immunity, mood, and sleep. Feed the system right, and the system produces the results.",
  },
]

export function FamilyBiotics() {
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
                The same three biotics.
                <br />
                <span className="brand-gradient-text">For every age.</span>
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
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-8 transition-all hover:shadow-lg">
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
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
