import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight, ArrowLeft } from "lucide-react"
import { foods, type BioticType } from "@/lib/foods"

/* ── Goal config ───────────────────────────────────────────────────────── */

interface GoalConfig {
  label: string
  emoji: string
  headline: string
  description: string
  types: BioticType[]
  brainHealthOnly?: boolean
  color: string
  gradient: string
  metaDesc: string
}

const GOALS: Record<string, GoalConfig> = {
  digestion: {
    label: "Digestion",
    emoji: "🌿",
    headline: "Best foods for digestion",
    description:
      "Gut health starts with what you feed it. Prebiotic and probiotic foods work together to restore microbial diversity, reduce bloating, and improve the entire digestive process — from motility to nutrient absorption.",
    types: ["prebiotic", "probiotic"],
    color: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    metaDesc:
      "The best prebiotic and probiotic foods for better digestion and gut health — profiled for their microbiome impact.",
  },
  energy: {
    label: "Energy",
    emoji: "⚡",
    headline: "Best foods for energy",
    description:
      "Sustainable energy doesn't come from caffeine — it comes from a well-functioning metabolism and a microbiome that extracts maximum nutrition from every meal. Protein and postbiotic foods are the foundation.",
    types: ["protein", "postbiotic"],
    color: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    metaDesc:
      "The best protein and postbiotic foods for sustained energy and metabolic health.",
  },
  immunity: {
    label: "Immunity",
    emoji: "🛡️",
    headline: "Best foods for immunity",
    description:
      "70% of your immune system lives in your gut. Prebiotic and postbiotic foods directly feed the bacterial colonies that regulate your immune response — reducing inflammation and increasing your resilience.",
    types: ["prebiotic", "postbiotic"],
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    metaDesc:
      "The best prebiotic and postbiotic foods to strengthen your immune system through the gut microbiome.",
  },
  mood: {
    label: "Mood",
    emoji: "🧠",
    headline: "Best foods for mood",
    description:
      "Your gut produces 90% of your serotonin. Foods that nourish the gut-brain axis — particularly those linked to Lactobacillus and Bifidobacterium populations — have a direct and measurable impact on mood, focus, and mental clarity.",
    types: ["prebiotic", "probiotic", "postbiotic", "protein"],
    brainHealthOnly: true,
    color: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    metaDesc:
      "The best gut-brain foods for mood, focus, and mental clarity — all with a proven microbiome connection.",
  },
  recovery: {
    label: "Recovery",
    emoji: "💪",
    headline: "Best foods for recovery",
    description:
      "Recovery is inflammation management. Postbiotic compounds — particularly butyrate and short-chain fatty acids — reduce systemic inflammation at the cellular level. Combined with complete proteins that rebuild tissue, these foods accelerate every aspect of physical recovery.",
    types: ["protein", "postbiotic"],
    color: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    metaDesc:
      "The best protein and postbiotic foods for faster recovery and reduced inflammation.",
  },
  sleep: {
    label: "Sleep",
    emoji: "🌙",
    headline: "Best foods for sleep",
    description:
      "The gut-sleep axis is one of the most underappreciated relationships in health. Prebiotic fibres feed bacteria that produce GABA and serotonin precursors — the compounds your brain converts into melatonin. Consistent prebiotic intake is one of the most evidence-backed dietary strategies for sleep quality.",
    types: ["prebiotic"],
    color: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))",
    metaDesc:
      "The best prebiotic foods for better sleep — supporting the gut-sleep axis through microbiome nutrition.",
  },
}

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

  // Filter foods for this goal
  const goalFoods = config.brainHealthOnly
    ? foods.filter((f) => f.brainHealth)
    : foods.filter((f) => config.types.includes(f.biotic))

  // Related goals (all except current)
  const relatedGoals = ALL_GOALS.filter((g) => g !== goal).slice(0, 3)

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative px-6 pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            {/* Breadcrumb */}
            <Link
              href="/food"
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft size={12} />
              Food Library
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-5xl">{config.emoji}</span>
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: config.color }}
                >
                  Best For
                </p>
                <h1 className="font-serif text-4xl font-bold text-foreground sm:text-5xl md:text-6xl">
                  {config.label}
                </h1>
              </div>
            </div>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
              {config.description}
            </p>

            {/* Biotic type pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {config.types.map((t) => (
                <span
                  key={t}
                  className="rounded-full px-3 py-1 text-xs font-semibold capitalize text-white"
                  style={{ background: config.gradient }}
                >
                  {t}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Rainbow divider */}
      <div
        className="h-0.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
        }}
      />

      {/* ── Food Grid ─────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-sm text-muted-foreground mb-8">
              <span className="font-semibold text-foreground">{goalFoods.length} foods</span>{" "}
              matched for {config.label.toLowerCase()}
            </p>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {goalFoods.map((food, index) => (
              <ScrollReveal key={food.slug} delay={index * 60}>
                <Link href={`/food/${food.slug}`} className="group block h-full">
                  <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-all hover:shadow-lg">
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: food.gradient }}
                    />
                    <span className="text-5xl">{food.emoji}</span>
                    <div className="mt-4 flex-1">
                      <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: food.accentColor }}
                      >
                        {food.category}
                      </p>
                      <h3 className="mt-1 font-serif text-xl font-semibold text-foreground">
                        {food.name}
                      </h3>
                      <p className="mt-2 text-xs italic leading-relaxed text-muted-foreground">
                        {food.tagline}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div
                        className="h-0.5 w-8 rounded-full"
                        style={{ backgroundColor: food.accentColor }}
                      />
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
        </div>
      </section>

      {/* ── Related Goals ─────────────────────────────────────────── */}
      <section className="bg-secondary/40 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
              Also explore
            </p>
            <div className="flex flex-wrap gap-3">
              {relatedGoals.map((g) => {
                const c = GOALS[g]
                return (
                  <Link
                    key={g}
                    href={`/food/for/${g}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:shadow-md"
                  >
                    <span>{c.emoji}</span>
                    Best for {c.label}
                    <ArrowUpRight size={13} className="text-muted-foreground" />
                  </Link>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              Know what your meals score.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Take the free assessment and find out where you stand across all 5 microbiome
              pillars — in under 3 minutes.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/assessment"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                Get My Free Biotics Score
                <ArrowUpRight size={16} />
              </Link>
              <Link
                href="/food"
                className="inline-flex items-center gap-2 rounded-full border border-border px-8 py-4 text-base font-semibold text-foreground transition-all hover:bg-muted"
              >
                Back to Food Library
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
