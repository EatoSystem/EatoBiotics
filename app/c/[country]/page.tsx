import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ScrollReveal } from "@/components/scroll-reveal"
import { DiscoverFlow } from "@/components/waitlist/discover-flow"
import { PowersEverything } from "@/components/home/powers-everything"
import { HowItWorks } from "@/components/home/how-it-works"
import { TheFramework } from "@/components/home/the-framework"
import { ScorePreview } from "@/components/home/score-preview"
import { Ecosystem } from "@/components/home/ecosystem"
import { getSupabase } from "@/lib/supabase"
import { marketBySlug, LANDING_SLUGS } from "@/lib/market"

export const dynamic = "force-dynamic"

const GRADIENT_BAR =
  "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))"

export function generateStaticParams() {
  return LANDING_SLUGS.map((country) => ({ country }))
}

export async function generateMetadata({ params }: { params: Promise<{ country: string }> }): Promise<Metadata> {
  const { country } = await params
  const market = marketBySlug(country)
  if (!market) return {}
  const title = `The Food System Inside ${market.name} ${market.flag}`
  return {
    title,
    description: `Discover your Food System Type and join the EatoBiotics waitlist in ${market.name}. A 60-second discovery of the living food system inside you.`,
    openGraph: { title, description: `Discover your Food System Type — ${market.name}.` },
  }
}

async function countInCountry(name: string): Promise<number> {
  const supabase = getSupabase()
  if (!supabase) return 0
  const { count } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("assessment_type", "waitlist")
    .eq("country", name)
  return count ?? 0
}

export default async function CountryLandingPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params
  const market = marketBySlug(country)
  if (!market) notFound()

  const count = await countInCountry(market.name)

  return (
    <div className="relative overflow-hidden bg-background">
      {/* Localised hero + quiz */}
      <section className="relative px-6 pt-24 pb-16 md:pb-20">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <span className="text-base leading-none">{market.flag}</span>
              EatoBiotics · {market.name}
            </span>
          </ScrollReveal>
          <ScrollReveal delay={80}>
            <h1 className="mt-5 font-serif text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl text-balance">
              <span style={{ color: "var(--icon-green)" }}>The Food System</span>{" "}
              <span style={{ background: GRADIENT_BAR, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                Inside {market.name}
              </span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={140}>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Take the 60-second discovery to meet the living food system inside you — then join the
              waitlist for early access when EatoBiotics launches.
            </p>
          </ScrollReveal>
          {count >= 25 && (
            <ScrollReveal delay={180}>
              <p className="mt-4 text-sm font-semibold text-foreground">
                Join {count.toLocaleString()}+ people in {market.name} {market.flag}
              </p>
            </ScrollReveal>
          )}
          <ScrollReveal delay={220}>
            <div className="mt-8">
              <DiscoverFlow defaultCountry={market.name} />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Showcase (mirrors /enter) */}
      <div style={{ height: "2px", background: GRADIENT_BAR }} />
      <PowersEverything />
      <HowItWorks />
      <TheFramework />
      <ScorePreview />
      <Ecosystem />
    </div>
  )
}
