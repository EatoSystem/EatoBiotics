import type { Metadata } from "next"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { MapPin, Users, Leaf, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "EatoSystem",
  description:
    "From individual health to community food systems — the County Model for building local food resilience.",
}

const counties = [
  "Carlow", "Cavan", "Clare", "Cork", "Donegal", "Dublin", "Galway", "Kerry",
  "Kildare", "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth",
  "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo", "Tipperary",
  "Waterford", "Westmeath", "Wexford", "Wicklow", "Antrim", "Armagh", "Derry",
  "Down", "Fermanagh", "Tyrone",
]

const pillars = [
  {
    icon: MapPin,
    title: "Local First",
    description:
      "Each county builds its own food network — local growers, producers, and markets connected through a shared platform.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Food hubs, community gardens, and local cooperatives form the backbone of the EatoSystem at the county level.",
  },
  {
    icon: Leaf,
    title: "Biotic Awareness",
    description:
      "Every food in the system is tagged with its prebiotic, probiotic, or postbiotic value — making better choices easier.",
  },
]

export default function EatosystemPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[680px] text-center">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              The Bigger Picture
            </p>
            <h1 className="mt-4 font-serif text-5xl text-[var(--foreground)] sm:text-6xl md:text-7xl text-balance">
              The <GradientText>EatoSystem</GradientText>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[var(--muted-foreground)]">
              From the food system inside you to the food system around you.
              The EatoSystem is a county-by-county model for building local food resilience
              across all 32 counties of Ireland.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-[var(--secondary)] px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              How It Works
            </p>
            <h2 className="mt-4 text-center font-serif text-4xl text-[var(--foreground)] sm:text-5xl">
              The County Model
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-12">
            {pillars.map((pillar, index) => (
              <ScrollReveal key={pillar.title} delay={index * 150}>
                <div className="flex flex-col items-start rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg brand-gradient">
                    <pillar.icon size={24} className="text-[var(--background)]" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[var(--foreground)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">
                    {pillar.description}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* 32 Counties */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
              All 32 Counties
            </p>
            <h2 className="mt-4 font-serif text-4xl text-[var(--foreground)] sm:text-5xl">
              One Island, One System
            </h2>
            <p className="mt-4 max-w-lg text-base text-[var(--muted-foreground)]">
              Each county represents a local food hub — connected, independent, and built
              around the foods that grow best in each region.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-12 flex flex-wrap gap-3">
              {counties.map((county) => (
                <span
                  key={county}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)] hover:border-transparent cursor-default"
                >
                  {county}
                </span>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-16">
              <a
                href="https://www.eatosystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-base font-medium text-[var(--primary)] hover:text-[var(--accent)] transition-colors"
              >
                Learn more at EatoSystem.com
                <ArrowUpRight size={16} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
