import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ShareBar } from "@/components/share-bar"
import { getFoodBySlug, foods, bioticLabels } from "@/lib/foods"
import { ArrowUpRight, ChevronLeft, ChevronRight, Utensils } from "lucide-react"

export async function generateStaticParams() {
  return foods.map((food) => ({ slug: food.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const food = getFoodBySlug(slug)
  if (!food) return { title: "Food Not Found" }
  return {
    title: `${food.name} — Food Profile`,
    description: `${food.tagline} ${food.description.slice(0, 150)}...`,
    openGraph: {
      title: `${food.name} — EatoBiotics Food Profile`,
      description: food.tagline,
    },
  }
}

export default async function FoodPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const food = getFoodBySlug(slug)
  if (!food) notFound()

  const currentIndex = foods.findIndex((f) => f.slug === slug)
  const prevFood = currentIndex > 0 ? foods[currentIndex - 1] : null
  const nextFood = currentIndex < foods.length - 1 ? foods[currentIndex + 1] : null
  const relatedFoods = foods.filter((f) => f.slug !== slug && f.biotic === food.biotic).slice(0, 3)

  // Build a name → slug lookup for pairing deep links
  const nameToSlug = Object.fromEntries(foods.map((f) => [f.name.toLowerCase(), f.slug]))

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{ background: food.gradient }}
        />

        <div className="relative mx-auto max-w-[680px]">
          <ScrollReveal>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/food" className="hover:text-foreground transition-colors">
                Food Library
              </Link>
              <ChevronRight size={14} />
              <span className="text-foreground">{food.name}</span>
            </div>

            {/* Emoji */}
            <div className="mt-8 text-8xl md:text-9xl">{food.emoji}</div>

            {/* Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white"
                style={{ background: food.gradient }}
              >
                {bioticLabels[food.biotic]}
              </span>
              <span className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                {food.category}
              </span>
              {food.county && (
                <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  🇮🇪 {food.county}
                </span>
              )}
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

      {/* Content */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[680px]">

          <ScrollReveal>
            <p className="text-base leading-relaxed text-foreground md:text-lg">
              {food.description}
            </p>
          </ScrollReveal>

          {/* Add to My Plate CTA */}
          <ScrollReveal delay={50}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/myplate?add=${food.slug}`}
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-md shadow-icon-green/20 transition-all hover:opacity-90"
              >
                <Utensils size={15} />
                Add to My Plate
              </Link>
              <span className="text-xs text-muted-foreground">
                Adds {food.name} to today&apos;s gut score
              </span>
            </div>
          </ScrollReveal>

          {/* Benefits */}
          <ScrollReveal delay={100}>
            <div className="mt-12">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Why it matters
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {food.benefits.map((benefit) => (
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
            <div
              className="mt-12 rounded-2xl border-l-4 bg-secondary/40 p-6 md:p-8"
              style={{ borderColor: food.accentColor }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: food.accentColor }}
              >
                How to eat it
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
                {food.pairsWith.map((pair) => {
                  const pairedSlug = nameToSlug[pair.toLowerCase()]
                  return pairedSlug ? (
                    <Link
                      key={pair}
                      href={`/food/${pairedSlug}`}
                      className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-icon-green hover:bg-icon-green/5 hover:text-icon-green"
                    >
                      {pair}
                    </Link>
                  ) : (
                    <span
                      key={pair}
                      className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground/70"
                    >
                      {pair}
                    </span>
                  )
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Share */}
          <ScrollReveal delay={280}>
            <ShareBar
              url={`https://eatobiotics.com/food/${food.slug}`}
              title={food.name}
              text={food.tagline}
              ogImagePath={`/food/${food.slug}/opengraph-image`}
            />
          </ScrollReveal>

          {/* Prev / Next navigation */}
          <ScrollReveal delay={300}>
            <div className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-8">
              {prevFood ? (
                <Link
                  href={`/food/${prevFood.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronLeft size={16} />
                  <span>{prevFood.emoji} {prevFood.name}</span>
                </Link>
              ) : <div />}
              {nextFood ? (
                <Link
                  href={`/food/${nextFood.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>{nextFood.emoji} {nextFood.name}</span>
                  <ChevronRight size={16} />
                </Link>
              ) : <div />}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related foods */}
      {relatedFoods.length > 0 && (
        <>
          <div className="section-divider" />
          <section className="px-6 py-16 md:py-24">
            <div className="mx-auto max-w-[1200px]">
              <ScrollReveal>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  More {bioticLabels[food.biotic]} Foods
                </p>
                <h2 className="mt-2 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                  <GradientText>Similar foods</GradientText> to explore
                </h2>
              </ScrollReveal>
              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {relatedFoods.map((f, index) => (
                  <ScrollReveal key={f.slug} delay={index * 80}>
                    <Link href={`/food/${f.slug}`} className="group block">
                      <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5 transition-all hover:shadow-lg">
                        <div
                          className="absolute top-0 left-0 right-0 h-1"
                          style={{ background: f.gradient }}
                        />
                        <span className="text-4xl">{f.emoji}</span>
                        <p
                          className="mt-3 text-xs font-bold uppercase tracking-widest"
                          style={{ color: f.accentColor }}
                        >
                          {bioticLabels[f.biotic]}
                        </p>
                        <h3 className="mt-1 font-serif text-lg font-semibold text-foreground">
                          {f.name}
                        </h3>
                        <p className="mt-2 text-xs italic text-muted-foreground">{f.tagline}</p>
                      </div>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
              <ScrollReveal delay={300}>
                <div className="mt-8">
                  <Link
                    href="/food"
                    className="inline-flex items-center gap-2 text-sm font-medium text-icon-green transition-colors hover:text-icon-orange"
                  >
                    View all foods in the library
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </>
      )}

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={64}
              height={64}
              className="mx-auto mb-6 h-12 w-12"
            />
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Build the food system <GradientText>inside you.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              One food at a time. Subscribe to the EatoBiotics Substack for weekly
              food profiles, science-backed insights, and practical plate-building guidance.
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
                href="/biotics"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Learn the framework
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
