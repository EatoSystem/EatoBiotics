import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { getFoodBySlug, bioticLabels } from "@/lib/foods"
import type { ConditionDef } from "@/lib/conditions"

export function ConditionFoods({ condition }: { condition: ConditionDef }) {
  const foods = condition.foods.spotlights
    .map(({ slug, benefit }) => {
      const food = getFoodBySlug(slug)
      return food ? { ...food, benefit } : null
    })
    .filter(Boolean) as (NonNullable<ReturnType<typeof getFoodBySlug>> & { benefit: string })[]

  return (
    <section className="px-6 py-16 md:py-24 bg-secondary/20">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              Food Spotlight
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              {condition.foods.heading}
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground leading-relaxed">
              {condition.foods.intro}
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {foods.map((food, index) => (
            <ScrollReveal key={food.slug} delay={index * 60}>
              <Link href={`/food/${food.slug}`} className="group block h-full">
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: food.gradient }} />
                  <span className="text-5xl">{food.emoji}</span>
                  <div className="mt-4 flex-1">
                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: food.accentColor }}>
                      {food.category}
                    </p>
                    <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">{food.name}</h3>
                    <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">{food.benefit}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-white"
                      style={{ background: food.gradient }}
                    >
                      {bioticLabels[food.biotic]}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: food.accentColor }}
                    >
                      Read profile <ArrowUpRight size={11} />
                    </span>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-8 text-center">
            <Link
              href="/food"
              className="inline-flex items-center gap-2 rounded-full border-2 border-icon-teal px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-teal hover:text-white"
            >
              {condition.foods.libraryCtaLabel}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
