import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, ChevronLeft, ChevronRight, Utensils } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ShareBar } from "@/components/share-bar"
import { FoodImage } from "@/components/food/food-image"
import { FoodCard } from "@/components/food/food-card"
import { bioticMeta } from "@/lib/biotic-meta"
import { getFoodBySlug, foods } from "@/lib/foods"

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

  const meta = bioticMeta(food.biotic)
  const currentIndex = foods.findIndex((f) => f.slug === slug)
  const prevFood = currentIndex > 0 ? foods[currentIndex - 1] : null
  const nextFood = currentIndex < foods.length - 1 ? foods[currentIndex + 1] : null
  const relatedFoods = foods
    .filter((f) => f.slug !== slug && f.biotic === food.biotic)
    .slice(0, 3)

  // Name → slug lookup so pairings can deep-link where the partner exists.
  const nameToSlug = Object.fromEntries(foods.map((f) => [f.name.toLowerCase(), f.slug]))
  const pairings = food.pairsWith.map((name) => ({
    name,
    slug: nameToSlug[name.toLowerCase()] as string | undefined,
  }))

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="px-6 pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-[1180px]">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/food" className="transition-colors hover:text-foreground">
              Food Library
            </Link>
            <ChevronRight size={14} />
            <span className="text-foreground">{food.name}</span>
          </nav>

          <div className="mt-8 grid items-center gap-10 md:grid-cols-2 md:gap-14">
            <FoodImage
              food={food}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              emojiClassName="text-[8rem]"
              className="aspect-square rounded-3xl"
            />

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {meta.label}
                </p>
              </div>

              <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-balance text-foreground sm:text-6xl">
                {food.name}
              </h1>
              <p className="mt-4 font-serif text-xl italic text-muted-foreground sm:text-2xl">
                {food.tagline}
              </p>

              {/* At a glance */}
              <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-border pt-6">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Category
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">{food.category}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Benefits
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                    {food.benefits.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Pairs with
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground tabular-nums">
                    {food.pairsWith.length}
                  </dd>
                </div>
                {food.county && (
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Grown in
                    </dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">
                      Co. {food.county}
                    </dd>
                  </div>
                )}
              </dl>

              <Link
                href={`/myplate?add=${food.slug}`}
                className="brand-gradient mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <Utensils size={15} />
                Add to My Plate
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Body ─────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-lg leading-relaxed text-foreground">{food.description}</p>
          </ScrollReveal>

          {/* Why it matters */}
          <ScrollReveal delay={80}>
            <div className="mt-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Why it matters
              </p>
              <dl className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
                {food.benefits.map((benefit) => (
                  <div key={benefit.title}>
                    <div
                      className="h-0.5 w-8 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <dt className="mt-3 font-serif text-base font-semibold text-foreground">
                      {benefit.title}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {benefit.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </ScrollReveal>

          {/* How to eat it */}
          <ScrollReveal delay={120}>
            <div className="mt-14">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                How to eat it
              </p>
              <p className="mt-4 text-lg leading-relaxed text-foreground">{food.howToEat}</p>
            </div>
          </ScrollReveal>

          {/* The science — as a pull quote */}
          <ScrollReveal delay={160}>
            <figure className="mt-14 border-l-2 pl-6" style={{ borderColor: meta.color }}>
              <blockquote className="font-serif text-xl leading-relaxed text-foreground italic">
                {food.science}
              </blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground not-italic">
                {food.scienceSource}
              </figcaption>
            </figure>
          </ScrollReveal>

          {/* Better together */}
          {pairings.length > 0 && (
            <ScrollReveal delay={200}>
              <div className="mt-14">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Better together
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {pairings.map(({ name, slug: pairedSlug }) =>
                    pairedSlug ? (
                      <Link
                        key={name}
                        href={`/food/${pairedSlug}`}
                        className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span
                        key={name}
                        className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground"
                      >
                        {name}
                      </span>
                    )
                  )}
                </div>
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal delay={240}>
            <ShareBar
              url={`https://eatobiotics.com/food/${food.slug}`}
              title={food.name}
              text={food.tagline}
              ogImagePath={`/food/${food.slug}/opengraph-image`}
            />
          </ScrollReveal>

          {/* Prev / next */}
          <ScrollReveal delay={280}>
            <div className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-8">
              {prevFood ? (
                <Link
                  href={`/food/${prevFood.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ChevronLeft size={16} />
                  <span>{prevFood.name}</span>
                </Link>
              ) : (
                <div />
              )}
              {nextFood ? (
                <Link
                  href={`/food/${nextFood.slug}`}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>{nextFood.name}</span>
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Related ──────────────────────────────────────────────── */}
      {relatedFoods.length > 0 && (
        <section className="px-6 pb-20 md:pb-28">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-green">
                    More {meta.label.toLowerCase()} foods
                  </p>
                  <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
                    <GradientText>Similar foods</GradientText> to explore
                  </h2>
                </div>
                <Link
                  href="/food"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-icon-green"
                >
                  View all foods
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3">
              {relatedFoods.map((related, index) => (
                <ScrollReveal key={related.slug} delay={index * 60}>
                  <FoodCard
                    food={related}
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={64}
              height={64}
              className="mx-auto mb-6 h-12 w-12"
            />
            <h2 className="font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
              Build the food system <GradientText>inside you.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed text-muted-foreground">
              One food at a time. Subscribe for weekly food profiles and practical
              plate-building guidance.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="https://eatobiotics.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Subscribe on Substack
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/biotics"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
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
