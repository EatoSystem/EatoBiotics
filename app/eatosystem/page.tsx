import type { Metadata } from "next"
import Image from "next/image"
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

const iconColors = [
  "var(--icon-lime)",
  "var(--icon-green)",
  "var(--icon-teal)",
  "var(--icon-yellow)",
  "var(--icon-orange)",
]

const pillars = [
  {
    icon: MapPin,
    title: "Local First",
    color: "var(--icon-lime)",
    description:
      "Each county builds its own food network — local growers, producers, and markets connected through a shared platform.",
  },
  {
    icon: Users,
    title: "Community Driven",
    color: "var(--icon-teal)",
    description:
      "Food hubs, community gardens, and local cooperatives form the backbone of the EatoSystem at the county level.",
  },
  {
    icon: Leaf,
    title: "Biotic Awareness",
    color: "var(--icon-orange)",
    description:
      "Every food in the system is tagged with its prebiotic, probiotic, or postbiotic value — making better choices easier.",
  },
]

export default function EatosystemPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="pointer-events-none absolute inset-0 icon-glow" />
        <div className="relative mx-auto max-w-[680px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-6 h-16 w-16 md:h-20 md:w-20"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              The Bigger Picture
            </p>
            <h1 className="mt-4 font-serif text-5xl text-foreground sm:text-6xl md:text-7xl text-balance">
              The <GradientText>EatoSystem</GradientText>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              From the food system inside you to the food system around you.
              The EatoSystem is a county-by-county model for building local food resilience
              across all 32 counties of Ireland.
            </p>
            <div className="mx-auto mt-8 flex items-center justify-center gap-2">
              <span className="biotic-pill bg-icon-lime" />
              <span className="biotic-pill bg-icon-green" />
              <span className="biotic-pill bg-icon-teal" />
              <span className="biotic-pill bg-icon-yellow" />
              <span className="biotic-pill bg-icon-orange" />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-secondary px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              How It Works
            </p>
            <h2 className="mt-4 text-center font-serif text-4xl text-foreground sm:text-5xl">
              The County Model
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-12">
            {pillars.map((pillar, index) => (
              <ScrollReveal key={pillar.title} delay={index * 150}>
                <div
                  className="flex flex-col items-start rounded-2xl border-t-4 bg-card p-8"
                  style={{ borderTopColor: pillar.color }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: pillar.color }}
                  >
                    <pillar.icon size={24} className="text-background" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                  <div
                    className="mt-6 h-1.5 w-12 rounded-full"
                    style={{ backgroundColor: pillar.color }}
                  />
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
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              All 32 Counties
            </p>
            <h2 className="mt-4 font-serif text-4xl text-foreground sm:text-5xl">
              One Island, One System
            </h2>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Each county represents a local food hub — connected, independent, and built
              around the foods that grow best in each region.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-12 flex flex-wrap gap-3">
              {counties.map((county, i) => (
                <span
                  key={county}
                  className="cursor-default rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground transition-all hover:text-background hover:border-transparent"
                  style={{
                    ["--hover-bg" as string]: iconColors[i % iconColors.length],
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLSpanElement).style.backgroundColor = iconColors[i % iconColors.length]
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLSpanElement).style.backgroundColor = ""
                  }}
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
                className="inline-flex items-center gap-2 text-base font-medium text-icon-green transition-colors hover:text-icon-orange"
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
