import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { MapPin, Users, Leaf, ArrowUpRight } from "lucide-react"
import { CountyTags } from "@/components/eatosystem/county-tags"

export const metadata: Metadata = {
  title: "EatoSystem",
  description:
    "From individual health to community food systems -- the County Model for building local food resilience.",
}

const pillars = [
  {
    icon: MapPin,
    title: "Local First",
    color: "var(--icon-lime)",
    gradientTo: "var(--icon-green)",
    description:
      "Each county builds its own food network -- local growers, producers, and markets connected through a shared platform.",
  },
  {
    icon: Users,
    title: "Community Driven",
    color: "var(--icon-teal)",
    gradientTo: "var(--icon-green)",
    description:
      "Food hubs, community gardens, and local cooperatives form the backbone of the EatoSystem at the county level.",
  },
  {
    icon: Leaf,
    title: "Biotic Awareness",
    color: "var(--icon-orange)",
    gradientTo: "var(--icon-yellow)",
    description:
      "Every food in the system is tagged with its prebiotic, probiotic, or postbiotic value -- making better choices easier.",
  },
]

export default function EatosystemPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[680px] text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt=""
              width={80}
              height={80}
              className="mx-auto mb-6 h-16 w-16 md:h-20 md:w-20"
            />
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Bigger Picture
            </p>
            <h1 className="mt-4 font-serif text-5xl font-semibold text-foreground sm:text-6xl md:text-7xl text-balance">
              The <GradientText>EatoSystem</GradientText>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              From the food system inside you to the food system around you.
              The EatoSystem is a county-by-county model for building local food resilience
              across all 32 counties of Ireland.
            </p>
            <div className="mx-auto mt-8 h-1 w-48 rounded-full brand-gradient" />
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Pillars */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-icon-teal">
              How It Works
            </p>
            <h2 className="mt-4 text-center font-serif text-4xl font-semibold text-foreground sm:text-5xl">
              The County Model
            </h2>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-3 md:gap-10">
            {pillars.map((pillar, index) => (
              <ScrollReveal key={pillar.title} delay={index * 150}>
                <div className="relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                  {/* Top gradient bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${pillar.color}, ${pillar.gradientTo})` }}
                  />
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: pillar.color }}
                  >
                    <pillar.icon size={24} className="text-white" />
                  </div>
                  <h3 className="mt-6 font-serif text-lg font-semibold text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                  <div
                    className="mt-6 h-2 w-16 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${pillar.color}, ${pillar.gradientTo})` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* 32 Counties */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              All 32 Counties
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
              One Island, One System
            </h2>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Each county represents a local food hub -- connected, independent, and built
              around the foods that grow best in each region.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="mt-12">
              <CountyTags />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="mt-16">
              <a
                href="https://www.eatosystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30"
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
