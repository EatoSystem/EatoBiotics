import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { foods, bioticLabels, type BioticType } from "@/lib/foods"
import { ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Food Library",
  description:
    "The EatoBiotics food library — every food profiled for its microbiome impact. Prebiotics, probiotics, and postbiotic foods with science-backed explanations and practical eating advice.",
  openGraph: {
    title: "Food Library — EatoBiotics",
    description: "Every food profiled for its microbiome impact.",
  },
}

const categories: { biotic: BioticType; label: string; accent: string; gradient: string; description: string }[] = [
  {
    biotic: "prebiotic",
    label: "Prebiotic Foods",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description: "Foods that feed and nourish your beneficial gut bacteria.",
  },
  {
    biotic: "probiotic",
    label: "Probiotic Foods",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description: "Fermented foods that add live cultures to your microbiome.",
  },
  {
    biotic: "postbiotic",
    label: "Postbiotic Foods",
    accent: "var(--icon-orange)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description: "Foods that help your gut produce beneficial compounds.",
  },
]

export default function FoodLibraryPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={64}
              height={64}
              className="mb-6 h-14 w-14"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Food Library
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold text-foreground sm:text-6xl md:text-7xl text-balance">
              Every food.{" "}
              <GradientText>Profiled.</GradientText>
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
              The EatoBiotics food library — every food examined for its microbiome impact.
              What it does, why it matters, how to eat it, and what the science says.
              One food at a time. Growing every week.
            </p>
            <div className="mt-6 flex items-center gap-1.5">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Today's food highlight */}
      <section className="bg-secondary/40 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                  Updated Daily
                </p>
                <h2 className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  Today&apos;s featured food
                </h2>
              </div>
              <Link
                href="/today"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:opacity-90"
              >
                See today&apos;s food
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Foods by biotic type */}
      {categories.map((cat, catIndex) => {
        const categoryFoods = foods.filter((f) => f.biotic === cat.biotic)
        if (categoryFoods.length === 0) return null
        return (
          <section key={cat.biotic} className={`px-6 py-16 md:py-24 ${catIndex % 2 === 1 ? "bg-secondary/40" : ""}`}>
            <div className="mx-auto max-w-[1200px]">
              <ScrollReveal>
                <div className="flex items-center gap-4">
                  <div
                    className="h-1 w-12 rounded-full"
                    style={{ background: cat.gradient }}
                  />
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: cat.accent }}>
                    {cat.label}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{cat.description}</p>
              </ScrollReveal>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categoryFoods.map((food, index) => (
                  <ScrollReveal key={food.slug} delay={index * 80}>
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
            {catIndex < categories.length - 1 && <div className="section-divider mt-16 md:mt-24" />}
          </section>
        )
      })}

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* CTA */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[720px] text-center">
          <ScrollReveal>
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-balance">
              The library is <GradientText>growing every week.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              New food profiles are published to the Substack first — then added here.
              Subscribe to get every new food profile delivered to your inbox.
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
