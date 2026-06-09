import Image from "next/image"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

const ASSESSMENT_HREF = "/eatobetics/assessment"

const pillars = [
  {
    number: "01",
    title: "Stability",
    subtitle: "Steady",
    color: "var(--icon-orange)",
    gradientFrom: "var(--icon-yellow)",
    gradientTo: "var(--icon-orange)",
    image: "/food-2.webp",
    description:
      "How sharply your glucose rises and falls after meals. It's shaped by fibre, protein, the order you eat in, and the quality of your carbohydrates — the levers that flatten the curve.",
  },
  {
    number: "02",
    title: "Energy",
    subtitle: "Sustain",
    color: "var(--icon-green)",
    gradientFrom: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    image: "/food-7.webp",
    description:
      "Whether your meals leave you energised or crashing. Steadier glucose means steadier focus, fewer cravings, and no afternoon slump — the daily feeling of a balanced food system.",
  },
  {
    number: "03",
    title: "Rhythm",
    subtitle: "Sustain",
    color: "var(--icon-teal)",
    gradientFrom: "var(--icon-green)",
    gradientTo: "var(--icon-teal)",
    image: "/food-12.webp",
    description:
      "The timing, spacing, and movement around your meals. When you eat — and a short walk after — shapes your whole day, and builds long-term metabolic resilience.",
  },
]

export function EbTheThree() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">The Pillars</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl text-pretty">
                Three pillars of glucose.
                <br />
                <span className="brand-gradient-text">One food system.</span>
              </h2>
            </div>
            <Link href={ASSESSMENT_HREF} className="flex items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange">
              Take the assessment
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
          {pillars.map((p, index) => (
            <ScrollReveal key={p.number} delay={index * 150}>
              <Link href={ASSESSMENT_HREF} className="group block h-full">
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background transition-all hover:shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1.5 z-10" style={{ background: `linear-gradient(90deg, ${p.gradientFrom}, ${p.gradientTo})` }} />
                  <div className="w-full overflow-hidden">
                    <Image src={p.image} alt={p.title} width={600} height={360} className="w-full h-[200px] object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 p-8">
                    <span className="font-serif text-6xl font-semibold md:text-7xl" style={{ color: p.color }}>{p.number}</span>
                    <h3 className="mt-6 font-serif text-xl font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wider" style={{ color: p.color }}>{p.subtitle}</p>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                    <div className="mt-6 flex items-center justify-between">
                      <div className="h-2 w-20 rounded-full" style={{ background: `linear-gradient(90deg, ${p.gradientFrom}, ${p.gradientTo})` }} />
                      <span className="flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100" style={{ color: p.color }}>
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
