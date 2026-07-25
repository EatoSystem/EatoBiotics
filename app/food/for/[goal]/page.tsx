import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight, ArrowLeft } from "lucide-react"
import { FoodCard } from "@/components/food/food-card"
import { BIOTIC_META } from "@/lib/biotic-meta"
import { foods, type BioticType } from "@/lib/foods"
import { GOALS } from "@/lib/food-goals"

const ALL_GOALS = Object.keys(GOALS)

/* ── Static params ─────────────────────────────────────────────────────── */

export function generateStaticParams() {
  return ALL_GOALS.map((goal) => ({ goal }))
}

/* ── Metadata ──────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ goal: string }>
}): Promise<Metadata> {
  const { goal } = await params
  const config = GOALS[goal]
  if (!config) return {}
  return {
    title: `Best Foods for ${config.label} | EatoBiotics`,
    description: config.metaDesc,
    openGraph: {
      title: `Best Foods for ${config.label} — EatoBiotics`,
      description: config.metaDesc,
    },
  }
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default async function FoodForGoalPage({
  params,
}: {
  params: Promise<{ goal: string }>
}) {
  const { goal } = await params
  const config = GOALS[goal]
  if (!config) notFound()

  const goalFoods = config.brainHealthOnly
    ? foods.filter((f) => f.brainHealth)
    : foods.filter((f) => config.types.includes(f.biotic))

  const relatedGoals = ALL_GOALS.filter((g) => g !== goal).slice(0, 3)

  // The biotic stages this goal draws on — explains *why* these foods.
  const stages = (
    config.brainHealthOnly
      ? (["prebiotic", "probiotic", "postbiotic"] as const)
      : config.types.filter((t): t is Exclude<BioticType, "all"> => t !== "all")
  ).filter((t) => t in BIOTIC_META)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="px-6 pt-28 pb-14 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <Link
              href="/food"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={13} />
              Food Library
            </Link>

            <p className="mt-8 text-[11px] font-semibold uppercase tracking-[0.14em] text-icon-green">
              Best foods for
            </p>
            <h1 className="mt-4 max-w-[18ch] font-serif text-5xl font-semibold text-balance text-foreground sm:text-6xl">
              {config.label}
            </h1>
            <p className="mt-5 max-w-[52ch] text-lg leading-relaxed text-muted-foreground">
              {config.description}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Why these foods ──────────────────────────────────────── */}
      {stages.length > 0 && (
        <section className="px-6 pb-16 md:pb-20">
          <div className="mx-auto max-w-[1180px]">
            <ScrollReveal>
              <div className="border-t border-border pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Why these foods
                </p>
                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {stages.map((stage) => {
                    const meta = BIOTIC_META[stage]
                    return (
                      <div key={stage}>
                        <div
                          className="h-0.5 w-8 rounded-full"
                          style={{ backgroundColor: meta.color }}
                        />
                        <h2 className="mt-3 font-serif text-lg font-semibold text-foreground">
                          {meta.label}
                        </h2>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {meta.body}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      <div className="section-divider" />

      {/* ── The foods ────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground tabular-nums">
            {goalFoods.length} foods
          </p>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {goalFoods.map((food, index) => (
              <ScrollReveal key={food.slug} delay={Math.min(index, 8) * 50}>
                <FoodCard food={food} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Also explore ─────────────────────────────────────────── */}
      <section className="px-6 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1180px]">
          <ScrollReveal>
            <div className="border-t border-border pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Also explore
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                {relatedGoals.map((slug) => (
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
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-balance text-foreground sm:text-4xl">
              Not sure where you stand?
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] leading-relaxed text-muted-foreground">
              Take the free assessment and find out which biotic your plate is missing.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Take the assessment
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/food"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Back to the library
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
