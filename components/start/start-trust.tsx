import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { Leaf, BookOpen, FlaskConical } from "lucide-react"

const PRINCIPLES = [
  {
    icon: FlaskConical,
    title: "Built on gut science",
    detail: "The Food System Score is grounded in research on the gut microbiome — how diversity, consistency, and biotic foods shape your health from the inside out.",
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
  },
  {
    icon: Leaf,
    title: "Real food. No supplements.",
    detail: "No products to buy. No shakes to subscribe to. Every recommendation is built around whole, everyday foods you can find at any supermarket.",
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
  },
  {
    icon: BookOpen,
    title: "No fads. No trends.",
    detail: "Prebiotics, probiotics, and postbiotics aren't a trend — they're the three core categories of food your microbiome depends on. This is the framework, not the shortcut.",
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
  },
]

export function StartTrust() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[640px]">
        <ScrollReveal>
          <p className="mb-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Built around real food-system principles
          </p>
          <h2 className="text-center font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            No supplements. No shortcuts.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            The Food System Score is built around the gut microbiome research — not trends,
            not marketing. Everything it measures can be improved with everyday food.
          </p>
        </ScrollReveal>

        <div className="mt-10 space-y-4">
          {PRINCIPLES.map((p, i) => {
            const Icon = p.icon
            return (
              <ScrollReveal key={p.title} delay={i * 80}>
                <div className="flex gap-4 rounded-2xl border border-border bg-background p-5">
                  <div
                    className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: p.gradient }}
                  >
                    <Icon size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
                  </div>
                </div>
              </ScrollReveal>
            )
          })}
        </div>

        {/* Inline CTA */}
        <ScrollReveal delay={320}>
          <div className="mt-10 text-center">
            <Link
              href="/assessment"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green transition-colors hover:text-foreground"
            >
              Check your Food System Score
              <ArrowRight size={14} />
            </Link>
          </div>
        </ScrollReveal>

      </div>
    </section>
  )
}
