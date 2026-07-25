import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Calendar } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { FoodImage } from "@/components/food/food-image"
import { FoodCard, type FoodCardData } from "@/components/food/food-card"
import { FoodIndex } from "@/components/food/food-index"
import { BioticQuiz } from "@/components/food/biotic-quiz"
import { FoodMyths } from "@/components/food/food-myths"
import { BIOTIC_META, BIOTIC_ORDER } from "@/lib/biotic-meta"
import { getFoodPairings } from "@/lib/food-education"
import { GOALS, FOOD_GOAL_SLUGS } from "@/lib/food-goals"
import {
  foods,
  getTodaysFood,
  getBrainHealthFoods,
  type Food,
} from "@/lib/foods"

export const metadata: Metadata = {
  title: "Food Library",
  description:
    "The EatoBiotics food library — every food profiled for its microbiome impact. Prebiotics, probiotics, postbiotic and protein foods with science-backed explanations and practical eating advice.",
  openGraph: {
    title: "Food Library — EatoBiotics",
    description: "Every food profiled for its microbiome impact.",
  },
}

/**
 * Slim a Food down to what the cards and index actually render.
 *
 * `lib/foods.ts` is ~98KB of source; `FoodIndex` is a client component, so shipping
 * whole Food objects would send every description, science note and benefit list to
 * the browser. This keeps the client payload to roughly a fifth.
 */
function toCardData(food: Food): FoodCardData {
  return {
    slug: food.slug,
    name: food.name,
    emoji: food.emoji,
    category: food.category,
    biotic: food.biotic,
    tagline: food.tagline,
    county: food.county,
  }
}

export default function FoodLibraryPage() {
  const todaysFood = getTodaysFood()
  const dateString = new Date().toLocaleDateString("en-IE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  const ferments = foods.filter((food) => food.category === "Fermented").slice(0, 4)
  const irish = foods.filter((food) => food.county)
  const brainFoods = getBrainHealthFoods().slice(0, 6)
  const pairings = getFoodPairings(6)
  const indexData = foods.map(toCardData)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="px-6 pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-green">
              The Food Library
            </p>
            <h1 className="mt-5 max-w-[16ch] font-serif text-5xl font-semibold text-balance text-foreground sm:text-6xl md:text-7xl">
              A field guide to the food system <GradientText>inside you.</GradientText>
            </h1>
            <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
              {foods.length} foods, each examined for what it actually does to your
              microbiome — what it feeds, what it seeds, and how to eat it.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Today's food: the cover moment ───────────────────────── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <Link href="/today" className="group grid items-center gap-8 md:grid-cols-2 md:gap-14">
              <FoodImage
                food={todaysFood}
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                emojiClassName="text-8xl"
                className="aspect-[4/3] rounded-3xl transition-transform duration-500 ease-out group-hover:scale-[1.01]"
              />

              <div>
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-icon-orange" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-icon-orange">
                    Today — {dateString}
                  </p>
                </div>

                <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground md:text-5xl">
                  {todaysFood.name}
                </h2>
                <p className="mt-3 font-serif text-xl italic text-muted-foreground">
                  {todaysFood.tagline}
                </p>
                <p className="mt-5 max-w-[52ch] leading-relaxed text-muted-foreground">
                  {todaysFood.description.split(". ").slice(0, 2).join(". ")}.
                </p>

                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                  Read today&apos;s profile
                  <ArrowUpRight
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <div className="section-divider" />

      {/* ── Collection: The Ferment Shelf ────────────────────────── */}
      {ferments.length > 0 && (
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <CollectionHead
                eyebrow="Collection"
                title="The Ferment Shelf"
                body="Live cultures, arriving in the food they were made in. The fastest way to widen the range of bacteria you're eating."
              />
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {ferments.map((food, index) => (
                <ScrollReveal key={food.slug} delay={index * 60}>
                  <FoodCard food={toCardData(food)} />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── The four biotics, in sequence ────────────────────────── */}
      <section className="bg-foreground px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-lime">
              The framework
            </p>
            <h2 className="mt-4 max-w-[20ch] font-serif text-3xl font-semibold text-balance text-background sm:text-4xl">
              Four biotics, in order.
            </h2>
            <p className="mt-4 max-w-[54ch] leading-relaxed text-background/70">
              These aren&apos;t four categories sitting side by side — they&apos;re stages of
              one process. Each hands off to the next.
            </p>
          </ScrollReveal>

          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {BIOTIC_ORDER.map((biotic, index) => {
              const meta = BIOTIC_META[biotic]
              return (
                <ScrollReveal key={biotic} delay={index * 70}>
                  <div>
                    <div
                      className="h-0.5 w-10 rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                    <p
                      className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em]"
                      style={{ color: meta.color }}
                    >
                      {meta.verb}
                    </p>
                    <h3 className="mt-2 font-serif text-2xl font-semibold text-background">
                      {meta.label}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-background/70">
                      {meta.body}
                    </p>
                  </div>
                </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── The index ────────────────────────────────────────────── */}
      <section id="library" className="scroll-mt-24 px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[1180px]">
          {/* Not wrapped in ScrollReveal: it renders opacity-0 until an observer
              fires, and the index is the page's primary content. */}
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-teal">
            Browse everything
          </p>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
            The complete library.
          </h2>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
            Every food profiled so far. Search it, filter by biotic, or sort by category.
          </p>

          <div className="mt-10">
            <FoodIndex foods={indexData} />
          </div>
        </div>
      </section>

      {/* ── Quiz ─────────────────────────────────────────────────── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-orange">
              Two-minute check
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              Which biotic are you missing?
            </h2>
            <p className="mt-4 max-w-[52ch] leading-relaxed text-muted-foreground">
              Most people are strong in one stage and blind to another. Three questions finds
              the gap.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="mt-10">
              <BioticQuiz />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Collection: Grown in Ireland ─────────────────────────── */}
      {irish.length > 0 && (
        <section className="px-6 pb-20 md:pb-28">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <CollectionHead
                eyebrow="Collection"
                title={`Grown here — the Irish ${irish.length}`}
                body="Foods in the library with an Irish county behind them."
              />
            </ScrollReveal>
            <div className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
              {irish.map((food) => (
                <div key={food.slug} className="w-44 shrink-0 snap-start sm:w-52">
                  <FoodCard food={toCardData(food)} sizes="208px" />
                  <p className="mt-2 text-xs text-muted-foreground">Co. {food.county}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ── Better together ──────────────────────────────────────── */}
      {pairings.length > 0 && (
        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <CollectionHead
                eyebrow="Better together"
                title="Some foods work harder in pairs."
                body="A prebiotic arriving with the culture that ferments it does more than either does alone."
              />
            </ScrollReveal>

            <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {pairings.map(({ a, b, reason }, index) => (
                <ScrollReveal key={`${a.slug}-${b.slug}`} delay={index * 60}>
                  <div>
                    <div className="flex items-center gap-3">
                      <FoodImage
                        food={a}
                        sizes="72px"
                        emojiClassName="text-3xl"
                        className="h-[72px] w-[72px] shrink-0 rounded-2xl"
                      />
                      <span className="font-serif text-lg text-muted-foreground">+</span>
                      <FoodImage
                        food={b}
                        sizes="72px"
                        emojiClassName="text-3xl"
                        className="h-[72px] w-[72px] shrink-0 rounded-2xl"
                      />
                    </div>
                    <h3 className="mt-5 font-serif text-lg font-semibold text-foreground">
                      {a.name} + {b.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {reason}
                    </p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Gut–brain ────────────────────────────────────────────── */}
      {brainFoods.length > 0 && (
        <section className="bg-secondary/50 px-6 py-20 md:py-28">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <CollectionHead
                eyebrow="Collection"
                title="Foods for the gut–brain axis"
                body="Your gut produces most of your body's serotonin. These foods feed the microbiome-brain connection."
                href="/gut-brain"
                hrefLabel="Learn the science"
              />
            </ScrollReveal>
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-6">
              {brainFoods.map((food, index) => (
                <ScrollReveal key={food.slug} delay={index * 50}>
                  <FoodCard
                    food={toCardData(food)}
                    sizes="(max-width: 640px) 50vw, 16vw"
                  />
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Myths ────────────────────────────────────────────────── */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[760px]">
          <ScrollReveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-orange">
              Myth-busting
            </p>
            <h2 className="mt-4 font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
              Eight things you&apos;ve been told that aren&apos;t quite right.
            </h2>
          </ScrollReveal>
          <div className="mt-10">
            <FoodMyths />
          </div>
        </div>
      </section>

      {/* ── Find by goal ─────────────────────────────────────────── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <CollectionHead
              eyebrow="Best foods for…"
              title="Find foods by goal."
              body="Browse the library filtered by what you want to improve."
            />
          </ScrollReveal>
          <div className="mt-10 flex flex-wrap gap-2.5">
            {FOOD_GOAL_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/food/for/${slug}`}
                className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                {GOALS[slug].label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
              The library is <GradientText>growing every week.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed text-muted-foreground">
              New food profiles go to the Substack first, then land here.
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

function CollectionHead({
  eyebrow,
  title,
  body,
  href,
  hrefLabel,
}: {
  eyebrow: string
  title: string
  body: string
  href?: string
  hrefLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-green">
          {eyebrow}
        </p>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="mt-3 max-w-[52ch] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground transition-colors hover:text-icon-green"
        >
          {hrefLabel}
          <ArrowUpRight size={14} />
        </Link>
      )}
    </div>
  )
}
