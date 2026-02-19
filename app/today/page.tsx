import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { getTodaysFood, bioticLabels, foods } from "@/lib/foods"
import { ArrowUpRight, ChevronRight } from "lucide-react"

export const revalidate = 3600 // Revalidate every hour

export async function generateMetadata(): Promise<Metadata> {
  const food = getTodaysFood()
  return {
    title: `Today's Food — ${food.name}`,
    description: `Today's EatoBiotics food: ${food.name}. ${food.tagline} ${food.description.slice(0, 120)}...`,
    openGraph: {
      title: `Today's Food: ${food.name} — EatoBiotics`,
      description: food.tagline,
    },
  }
}

export default function TodayPage() {
  const food = getTodaysFood()
  const otherFoods = foods.filter((f) => f.slug !== food.slug).slice(0, 4)

  const now = new Date()
  const dateString = now.toLocaleDateString("en-IE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        {/* Background gradient wash */}
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{ background: food.gradient }}
        />

        <div className="relative mx-auto max-w-[680px]">
          <ScrollReveal>
            <div className="flex items-center gap-3">
              <Image
                src="/eatobiotics-icon.webp"
                alt="EatoBiotics"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                Today&apos;s Food — {dateString}
              </p>
            </div>

            {/* Emoji */}
            <div className="mt-8 text-8xl md:text-9xl">{food.emoji}</div>

            {/* Biotic badge */}
            <div className="mt-6 inline-flex items-center gap-2">
              <span
                className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
                style={{ background: food.gradient }}
              >
                {bioticLabels[food.biotic]}
              </span>
              <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {food.category}
              </span>
            </div>

            <h1 className="mt-4 font-serif text-6xl font-semibold tracking-tight text-foreground sm:text-7xl md:text-8xl">
              {food.name}
            </h1>

            <p
              className="mt-4 font-serif text-xl font-medium italic sm:text-2xl"
              style={{ color: food.accentColor }}
            >
              {food.tagline}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Main content */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[680px]">

          {/* Description */}
          <ScrollReveal>
            <p className="text-base leading-relaxed text-foreground md:text-lg">
              {food.description}
            </p>
          </ScrollReveal>

          {/* Benefits */}
          <ScrollReveal delay={100}>
            <div className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Why it matters
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {food.benefits.map((benefit, index) => (
                  <div
                    key={benefit.title}
                    className="relative overflow-hidden rounded-xl border border-border bg-background p-5"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-0.5"
                      style={{ background: food.gradient }}
                    />
                    <p className="font-serif text-sm font-semibold text-foreground">
                      {benefit.title}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {benefit.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* How to eat */}
          <ScrollReveal delay={150}>
            <div className="mt-12 rounded-2xl border-l-4 bg-secondary/40 p-6 md:p-8" style={{ borderColor: food.accentColor }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: food.accentColor }}>
                How to eat it today
              </p>
              <p className="mt-3 text-base leading-relaxed text-foreground md:text-lg">
                {food.howToEat}
              </p>
            </div>
          </ScrollReveal>

          {/* Science */}
          <ScrollReveal delay={200}>
            <div className="mt-8 rounded-2xl border border-border bg-background p-6 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                The Science
              </p>
              <p className="mt-3 text-base leading-relaxed text-foreground">
                {food.science}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Source: {food.scienceSource}
              </p>
            </div>
          </ScrollReveal>

          {/* Pairs with */}
          <ScrollReveal delay={250}>
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Pairs well with
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {food.pairsWith.map((pair) => (
                  <span
                    key={pair}
                    className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* County */}
          {food.county && (
            <ScrollReveal delay={300}>
              <div className="mt-8 flex items-center gap-3 rounded-xl border border-border bg-background px-5 py-4">
                <span className="text-2xl">🇮🇪</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                    Irish Provenance
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Grown and produced in <span className="font-semibold text-foreground">{food.county}</span>
                  </p>
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* Full food page link */}
          <ScrollReveal delay={300}>
            <div className="mt-10">
              <Link
                href={`/food/${food.slug}`}
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-icon-green transition-colors hover:bg-icon-green hover:text-white"
              >
                Full {food.name} profile
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* More foods */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                  The Food Library
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                  More foods to <GradientText>explore.</GradientText>
                </h2>
              </div>
              <Link
                href="/food"
                className="flex items-center gap-1 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange"
              >
                View all foods
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherFoods.map((f, index) => (
              <ScrollReveal key={f.slug} delay={index * 80}>
                <Link href={`/food/${f.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-lg">
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: f.gradient }}
                    />
                    <span className="text-4xl">{f.emoji}</span>
                    <div className="mt-3 flex items-start justify-between">
                      <div>
                        <p
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: f.accentColor }}
                        >
                          {bioticLabels[f.biotic]}
                        </p>
                        <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                          {f.name}
                        </h3>
                      </div>
                      <ChevronRight
                        size={16}
                        className="mt-1 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </div>
                    <p className="mt-2 text-xs italic text-muted-foreground">{f.tagline}</p>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              A new food, <GradientText>every day.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Every day a different food. Every food a step toward a stronger microbiome.
              Subscribe to the Substack to get the weekly deep dive delivered to your inbox.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/food"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Browse all foods
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="mt-10 flex items-center justify-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
