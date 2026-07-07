import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { FoundationSystemCard, HealthSystemCard, LifeSystemCard } from "@/components/food-systems/system-cards"
import { foundationSystems, healthSystems, lifeSystems, FAMILY_META, type SystemDef } from "@/lib/systems"

/**
 * Section 10 of the flagship recipe — "Part of EatoBiotics" sibling grid.
 * Reuses the same card components as /food-systems (FoundationSystemCard /
 * HealthSystemCard / LifeSystemCard) so the card rhythm is identical, not
 * just similar, to the rest of the platform.
 */
export function SystemEcosystemGrid({ system }: { system: SystemDef }) {
  const family = system.family
  const siblings = (family === "health" ? healthSystems() : family === "life" ? lifeSystems() : foundationSystems())
    .filter((s) => s.key !== system.key)
  const CardComponent = family === "health" ? HealthSystemCard : family === "life" ? LifeSystemCard : FoundationSystemCard
  const meta = FAMILY_META[family]

  return (
    <section className="bg-secondary/40 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Ecosystem</p>
          <h2 className="mt-4 text-pretty font-serif text-4xl font-semibold text-foreground sm:text-5xl md:text-6xl">
            Part of
            <br />
            <span className="brand-gradient-text">EatoBiotics.</span>
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
            {system.label} is part of the {meta.label} family inside EatoBiotics — the food system inside you.{" "}
            {meta.blurb}
          </p>
        </ScrollReveal>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {siblings.map((s, index) => (
            <ScrollReveal key={s.key} delay={index * 80}>
              <CardComponent system={s} />
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/food-systems"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-icon-green underline underline-offset-4 transition-colors hover:text-icon-teal"
            >
              Explore all Food Systems <ArrowUpRight size={15} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
