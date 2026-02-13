import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { MapPin, Users, Leaf, ArrowUpRight, Brain, Globe, Database, Cpu, MessageSquare, BarChart3 } from "lucide-react"
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
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20">
        <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoSystem icon"
              width={200}
              height={200}
              priority
              className="h-40 w-40 sm:h-48 sm:w-48 md:h-56 md:w-56"
            />
          </ScrollReveal>

          <ScrollReveal delay={100} className="w-full text-center">
            <h1 className="mt-8 font-serif text-5xl font-semibold tracking-tight sm:text-7xl md:text-8xl lg:text-9xl">
              <span className="brand-gradient-text">EatoSystem</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200} className="w-full text-center">
            <p className="mt-4 font-serif text-xl font-medium text-foreground sm:text-2xl md:text-3xl">
              The Food System
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300} className="w-full text-center">
            <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              From the food system inside you to the food system around you.
              A county-by-county model for building local food resilience
              across all 32 counties of Ireland.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://www.eatosystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Explore EatoSystem.com
              </a>
              <a
                href="https://eatosystem.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Read on Substack
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-14 h-1 w-64 rounded-full brand-gradient" />
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

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* AI Agent Network */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="mx-auto max-w-[680px] text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                Intelligence Layer
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                32 County <GradientText>AI Agents</GradientText>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                Each county has its own dedicated AI agent -- collecting local food intelligence,
                guiding communities through regenerative food practices, and feeding data into
                a national learning system that gets smarter with every interaction.
              </p>
            </div>
          </ScrollReveal>

          {/* Network visualisation video */}
          <ScrollReveal delay={100}>
            <div className="mx-auto mt-12 max-w-[900px] overflow-hidden rounded-2xl border border-border">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-auto w-full"
              >
                <source src="/videos/ireland-network.mp4" type="video/mp4" />
              </video>
            </div>
          </ScrollReveal>

          {/* Agent capabilities */}
          <div className="mt-20 grid gap-8 md:grid-cols-3 md:gap-10">
            {[
              {
                icon: Database,
                title: "Collect Intelligence",
                color: "var(--icon-lime)",
                gradientTo: "var(--icon-green)",
                description:
                  "Each agent gathers hyper-local data -- seasonal availability, soil conditions, producer output, community demand, participation levels, and local investment -- building a living map of the county's food landscape.",
              },
              {
                icon: MessageSquare,
                title: "Guide Communities",
                color: "var(--icon-teal)",
                gradientTo: "var(--icon-green)",
                description:
                  "Agents serve as always-on advisors for local food hubs, growers, and families -- answering questions, suggesting seasonal recipes, and connecting people to nearby producers.",
              },
              {
                icon: Brain,
                title: "Train the Network",
                color: "var(--icon-orange)",
                gradientTo: "var(--icon-yellow)",
                description:
                  "Every county agent feeds insights into a shared national learning system. Local knowledge compounds into collective intelligence -- patterns that no single county could see alone.",
              },
            ].map((capability, index) => (
              <ScrollReveal key={capability.title} delay={index * 150}>
                <div className="relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${capability.color}, ${capability.gradientTo})` }}
                  />
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: capability.color }}
                  >
                    <capability.icon size={24} className="text-white" />
                  </div>
                  <h3 className="mt-6 font-serif text-lg font-semibold text-foreground">
                    {capability.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {capability.description}
                  </p>
                  <div
                    className="mt-6 h-2 w-16 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${capability.color}, ${capability.gradientTo})` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* How it works flow */}
          <ScrollReveal delay={200}>
            <div className="mt-20 mx-auto max-w-[800px]">
              <h3 className="text-center font-serif text-2xl font-semibold text-foreground sm:text-3xl">
                How the Agent Network Works
              </h3>
              <div className="mt-12 flex flex-col gap-0">
                {[
                  {
                    step: "01",
                    label: "Local Input",
                    color: "#A8E063",
                    detail: "Growers, markets, and community members interact with their county agent -- reporting harvests, logging participation, tracking local investment, and sharing availability.",
                  },
                  {
                    step: "02",
                    label: "County Processing",
                    color: "#2DAA6E",
                    detail: "Each agent processes local data, identifies patterns, and generates tailored guidance for its county's unique food ecosystem.",
                  },
                  {
                    step: "03",
                    label: "National Learning",
                    color: "#F5C518",
                    detail: "Insights from all 32 agents flow into a shared intelligence layer -- cross-referencing seasonal trends, supply gaps, and best practices across Ireland.",
                  },
                  {
                    step: "04",
                    label: "Feedback Loop",
                    color: "#F5A623",
                    detail: "National-level patterns feed back into each county agent, making local recommendations sharper and more informed with every cycle.",
                  },
                ].map((item, index) => (
                  <div key={item.step} className="flex gap-6">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        {item.step}
                      </div>
                      {index < 3 && (
                        <div className="w-0.5 flex-1 bg-border" />
                      )}
                    </div>
                    <div className={index < 3 ? "pb-10" : ""}>
                      <p className="font-serif text-lg font-semibold text-foreground">
                        {item.label}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Global Licensing */}
      <section className="px-6 py-32 md:py-40">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal>
            <div className="mx-auto max-w-[680px] text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
                Beyond Ireland
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                Designed for <GradientText>Global Licensing</GradientText>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground md:text-lg">
                Each Irish county licenses its AI agent model to regions worldwide --
                creating collaborative partnerships that generate revenue flowing directly
                back into local food system development. The same architecture that maps
                Ireland's 32 counties adapts to any region, language, or food culture.
              </p>
            </div>
          </ScrollReveal>

          <div className="mt-20 grid gap-8 sm:grid-cols-2 md:gap-10">
            {[
              {
                icon: Globe,
                title: "County-Led Licensing",
                color: "var(--icon-lime)",
                gradientTo: "var(--icon-teal)",
                description:
                  "Each Irish county licenses its proven agent model to equivalent regions globally -- a Kerry agent partners with a Tuscany province, a Galway agent with a Basque comarca. Peer-to-peer, county-to-county.",
              },
              {
                icon: BarChart3,
                title: "Revenue Back to Local",
                color: "var(--icon-teal)",
                gradientTo: "var(--icon-green)",
                description:
                  "Licensing revenue flows directly back to the originating county and is reinvested into local food system development -- funding growers, infrastructure, community programmes, and agent improvements.",
              },
              {
                icon: Cpu,
                title: "Collaborative Partnerships",
                color: "var(--icon-yellow)",
                gradientTo: "var(--icon-orange)",
                description:
                  "Licensing isn't one-way. Partner regions share their own local intelligence back, creating a two-way exchange that strengthens both food systems and builds a global regenerative knowledge network.",
              },
              {
                icon: Leaf,
                title: "Scalable by Design",
                color: "var(--icon-orange)",
                gradientTo: "var(--icon-yellow)",
                description:
                  "Swap 32 Irish counties for 50 US states, 16 German Bundesl\u00E4nder, or 47 Japanese prefectures. Every licensed instance inherits biotic-aware food categorisation, community empowerment, and measurable outcomes.",
              },
            ].map((item, index) => (
              <ScrollReveal key={item.title} delay={index * 150}>
                <div className="relative flex flex-col items-start overflow-hidden rounded-2xl border border-border bg-background p-8 transition-shadow hover:shadow-lg">
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.gradientTo})` }}
                  />
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: item.color }}
                  >
                    <item.icon size={24} className="text-white" />
                  </div>
                  <h3 className="mt-6 font-serif text-lg font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                  <div
                    className="mt-6 h-2 w-16 rounded-full"
                    style={{ background: `linear-gradient(90deg, ${item.color}, ${item.gradientTo})` }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Closing statement */}
          <ScrollReveal delay={200}>
            <div className="mt-20 mx-auto max-w-[600px] text-center">
              <p className="font-serif text-xl font-medium leading-relaxed text-foreground sm:text-2xl text-pretty">
                Ireland builds the proof. Each county owns its model. The world becomes the partner.
              </p>
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <span className="biotic-pill bg-icon-lime" />
                <span className="biotic-pill bg-icon-green" />
                <span className="biotic-pill bg-icon-teal" />
                <span className="biotic-pill bg-icon-yellow" />
                <span className="biotic-pill bg-icon-orange" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
