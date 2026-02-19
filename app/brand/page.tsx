import type { Metadata } from "next"
import Image from "next/image"
import { ScrollReveal } from "@/components/scroll-reveal"
import { GradientText } from "@/components/gradient-text"
import { ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "The Brand",
  description:
    "Eato & EatoBiotics — the two brand expressions of Ireland's regenerative food system. Food is not just grown. It is expressed.",
  openGraph: {
    title: "The Brand — Eato & EatoBiotics",
    description:
      "Two brand expressions carrying the EatoSystem standard forward. Eato is the national food system standard. EatoBiotics is the internal ecosystem expression.",
  },
}

const eatoProducts = [
  { name: "Carrots", county: "Kerry", color: "var(--icon-orange)" },
  { name: "Kale", county: "Cork", color: "var(--icon-green)" },
  { name: "Oats", county: "Galway", color: "var(--icon-yellow)" },
  { name: "Potatoes", county: "Donegal", color: "var(--icon-lime)" },
]

const eatobioticsProducts = [
  { name: "Pickled Beetroot", county: "Kerry", color: "var(--icon-teal)" },
  { name: "Fermented Cabbage", county: "Cork", color: "var(--icon-lime)" },
  { name: "Oat Kefir", county: "Galway", color: "var(--icon-green)" },
  { name: "Sea Vegetable Mix", county: "Clare", color: "var(--icon-teal)" },
]

const principles = [
  {
    number: "01",
    title: "Soil-First",
    accent: "var(--icon-lime)",
    gradient: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))",
    description: "Every product begins in the soil. Regenerative farming practices are the non-negotiable foundation of every Eato and EatoBiotics product.",
  },
  {
    number: "02",
    title: "County Provenance",
    accent: "var(--icon-green)",
    gradient: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))",
    description: "Every product carries its county of origin. The land that grew it is named. The community that tended it is credited. Provenance is identity.",
  },
  {
    number: "03",
    title: "Community-Owned",
    accent: "var(--icon-teal)",
    gradient: "linear-gradient(135deg, var(--icon-teal), var(--icon-yellow))",
    description: "Revenue generated through both brands flows back into farm transition, soil regeneration, and community development. Profit serves place.",
  },
  {
    number: "04",
    title: "Transparently Sourced",
    accent: "var(--icon-yellow)",
    gradient: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))",
    description: "No hidden supply chains. Every ingredient is traceable to a farm, a county, a season. Transparency is the standard, not the exception.",
  },
]

function ProductCard({ name, county, color }: { name: string; county: string; color: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-2.5 w-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="font-serif text-sm font-semibold text-foreground">{name}</span>
      </div>
      <span
        className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {county}
      </span>
    </div>
  )
}

export default function BrandPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-20">
        {/* Floating background pills */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-2 left-[5%] h-5 w-44 rotate-[-35deg] rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
          />
          <div
            className="absolute top-[8%] right-[6%] h-5 w-36 rotate-[25deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
          />
          <div
            className="absolute top-[25%] left-[10%] h-6 w-28 rotate-[55deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-teal), var(--icon-green))" }}
          />
          <div
            className="absolute bottom-[20%] left-[2%] h-5 w-32 rotate-[40deg] rounded-full opacity-15"
            style={{ background: "linear-gradient(135deg, var(--icon-yellow), var(--icon-orange))" }}
          />
          <div
            className="absolute bottom-[8%] right-[4%] h-5 w-48 rotate-[-20deg] rounded-full opacity-20"
            style={{ background: "linear-gradient(135deg, var(--icon-orange), var(--icon-yellow))" }}
          />
          <div className="absolute top-[18%] left-[16%] h-8 w-8 rounded-full bg-icon-lime opacity-15" />
          <div className="absolute top-[40%] right-[10%] h-6 w-6 rounded-full bg-icon-orange opacity-15" />
          <div className="absolute bottom-[30%] right-[20%] h-9 w-9 rounded-full bg-icon-yellow opacity-10" />
          <div className="absolute top-[65%] left-[8%] h-7 w-7 rounded-full bg-icon-green opacity-10" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-[760px] flex-col items-center text-center">
          <ScrollReveal>
            <Image
              src="/eatobiotics-icon.webp"
              alt="EatoBiotics"
              width={200}
              height={200}
              priority
              className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32"
            />
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <p className="mt-8 text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Brand
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <h1 className="mt-4 font-serif text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl text-balance">
              Eato &{" "}
              <GradientText>EatoBiotics</GradientText>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <p className="mt-6 font-serif text-xl font-medium text-foreground sm:text-2xl">
              Food is not just grown. It is expressed.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              Within EatoSystem, brand is not decoration — it is the visible layer of a
              regenerative national food system, rooted in land, community, and long-term health.
              Two expressions carry that standard forward.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <a
                href="https://www.eatosystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="brand-gradient inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white shadow-lg shadow-icon-green/20 transition-all hover:shadow-xl hover:shadow-icon-green/30 hover:opacity-90"
              >
                Explore EatoSystem
                <ArrowUpRight size={16} />
              </a>
              <a
                href="/eatosystem"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                The 32 Counties
              </a>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={600}>
            <div className="mt-10 flex items-center justify-center gap-1.5">
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

      {/* Brand Architecture */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
              Brand Architecture
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              One master brand.{" "}
              <GradientText>Two expressions.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Eato is the national food system standard. EatoBiotics is the internal ecosystem expression.
              County provenance gives each product its identity.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-8 md:grid-cols-2">

            {/* Eato card */}
            <ScrollReveal delay={100}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-8 md:p-10">
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
                      The External Ecosystem
                    </p>
                    <h2 className="mt-3 font-serif text-5xl font-bold text-foreground sm:text-6xl">
                      Eato
                    </h2>
                    <p
                      className="mt-1 text-sm font-semibold uppercase tracking-widest"
                      style={{ color: "var(--icon-lime)" }}
                    >
                      Eat Optimal
                    </p>
                  </div>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white font-serif text-2xl font-bold"
                    style={{ background: "linear-gradient(135deg, var(--icon-lime), var(--icon-green))" }}
                  >
                    E
                  </div>
                </div>

                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  Eato is the national food system standard. When you see Eato on a product,
                  you are seeing food grown within a regenerative county system — soil-first,
                  community-owned, transparently sourced.
                </p>

                <div className="my-8 h-px w-full bg-border" />

                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Example Products
                </p>
                <div className="flex flex-col gap-2">
                  {eatoProducts.map((product) => (
                    <ProductCard key={product.name} {...product} />
                  ))}
                </div>

                <div className="mt-8 rounded-xl bg-secondary/60 p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Standard: </span>
                    Regeneratively farmed, county-certified, community-owned supply chain.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* EatoBiotics card */}
            <ScrollReveal delay={200}>
              <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-background p-8 md:p-10">
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ background: "linear-gradient(90deg, var(--icon-green), var(--icon-teal), var(--icon-orange))" }}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-icon-teal">
                      The Internal Ecosystem
                    </p>
                    <h2 className="mt-3 font-serif text-4xl font-bold brand-gradient-text sm:text-5xl">
                      EatoBiotics
                    </h2>
                    <p
                      className="mt-1 text-sm font-semibold uppercase tracking-widest"
                      style={{ color: "var(--icon-teal)" }}
                    >
                      The Food System Inside You
                    </p>
                  </div>
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: "linear-gradient(135deg, var(--icon-green), var(--icon-teal))" }}
                  >
                    <Image
                      src="/eatobiotics-icon.webp"
                      alt="EatoBiotics"
                      width={32}
                      height={32}
                      className="h-8 w-8"
                    />
                  </div>
                </div>

                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  EatoBiotics expresses microbiome-supporting foods crafted from county-grown
                  ingredients — fermented vegetables, fibre-rich grains, roots, sea vegetables,
                  and cultured foods. Always food-first. Always traceable to place.
                </p>

                <div className="my-8 h-px w-full bg-border" />

                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Example Products
                </p>
                <div className="flex flex-col gap-2">
                  {eatobioticsProducts.map((product) => (
                    <ProductCard key={product.name} {...product} />
                  ))}
                </div>

                <div className="mt-8 rounded-xl bg-secondary/60 p-4">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-foreground">Focus: </span>
                    Fermented, fibre-rich, prebiotic, probiotic, and postbiotic foods.
                    Microbiome-first. County-grown.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Brand Principles */}
      <section className="bg-secondary/40 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[1200px]">
          <ScrollReveal className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-orange">
              The Standard
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Four principles.{" "}
              <GradientText>No exceptions.</GradientText>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-muted-foreground">
              Every product that carries the Eato or EatoBiotics name is held to the same
              non-negotiable standard — regardless of county, season, or scale.
            </p>
          </ScrollReveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {principles.map((principle, index) => (
              <ScrollReveal key={principle.number} delay={index * 100}>
                <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 transition-shadow hover:shadow-lg">
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: principle.gradient }}
                  />
                  <p
                    className="font-serif text-5xl font-bold"
                    style={{ color: principle.accent }}
                  >
                    {principle.number}
                  </p>
                  <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">
                    {principle.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {principle.description}
                  </p>
                  <div
                    className="mt-6 h-0.5 w-full rounded-full opacity-30"
                    style={{ backgroundColor: principle.accent }}
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Gradient divider */}
      <div className="section-divider" />

      {/* Revenue Model */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-[680px]">
          <ScrollReveal>
            <p className="text-xs font-semibold uppercase tracking-widest text-icon-green">
              The Revenue Model
            </p>
            <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              Profit that{" "}
              <GradientText>serves place.</GradientText>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <p className="mt-8 text-base leading-relaxed text-foreground md:text-lg">
              Revenue generated through Eato and EatoBiotics flows back into the system
              that produced it. Farm transition support. Soil regeneration programmes.
              Community development funds. The brand is not the end — it is the mechanism.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <p className="mt-6 text-base leading-relaxed text-foreground md:text-lg">
              Eato is the master brand. EatoBiotics is the internal ecosystem expression.
              County provenance gives each product its identity. Together, they represent
              a new model for food — one where the act of eating well rebuilds the system
              that makes eating well possible.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <blockquote className="mt-10 border-l-4 border-icon-green pl-6">
              <p className="font-serif text-xl font-medium italic text-icon-green md:text-2xl">
                &ldquo;Build the food system inside you… and help build the food system around you.&rdquo;
              </p>
            </blockquote>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="/eatosystem"
                className="inline-flex items-center gap-2 rounded-full border-2 border-icon-green px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-green hover:text-white"
              >
                Explore EatoSystem
                <ArrowUpRight size={14} />
              </a>
              <a
                href="https://www.eatosystem.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
              >
                EatoSystem.com
                <ArrowUpRight size={14} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </>
  )
}
