import Link from "next/link"
import { ScrollReveal } from "@/components/scroll-reveal"
import { ArrowUpRight } from "lucide-react"

const counties = [
  "Antrim", "Armagh", "Carlow", "Cavan", "Clare", "Cork", "Derry",
  "Donegal", "Down", "Dublin", "Fermanagh", "Galway", "Kerry", "Kildare",
  "Kilkenny", "Laois", "Leitrim", "Limerick", "Longford", "Louth",
  "Mayo", "Meath", "Monaghan", "Offaly", "Roscommon", "Sligo",
  "Tipperary", "Tyrone", "Waterford", "Westmeath", "Wexford", "Wicklow",
]

export function EatoSystemTeaser() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-16 lg:flex-row lg:items-start lg:gap-20">

          {/* Left: text */}
          <div className="lg:w-[460px] lg:shrink-0">
            <ScrollReveal>
              <p className="text-xs font-semibold uppercase tracking-widest text-icon-yellow">
                EatoSystem
              </p>
              <h2 className="mt-4 font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
                The food system{" "}
                <span className="brand-gradient-text">around you.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                Personal health only goes so far if the food system around you keeps
                producing the wrong food. EatoSystem is Ireland&apos;s regenerative food
                transformation initiative — rebuilding how food is grown, processed,
                and distributed, county by county.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                32 counties. 32 local food networks. One national transformation.
                Seeded in Ireland. Licensed globally.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={150}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/eatosystem"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-icon-yellow px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-icon-yellow hover:text-white"
                >
                  Explore EatoSystem
                  <ArrowUpRight size={14} />
                </Link>
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

            <ScrollReveal delay={200}>
              <div className="mt-10 grid grid-cols-3 gap-4">
                {[
                  { number: "32", label: "Counties" },
                  { number: "1", label: "Nation" },
                  { number: "∞", label: "Impact" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border p-4 text-center">
                    <p className="font-serif text-3xl font-bold brand-gradient-text">{stat.number}</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>

          {/* Right: county tags + video */}
          <div className="flex-1">
            <ScrollReveal delay={100}>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                All 32 Counties
              </p>
              <div className="flex flex-wrap gap-2">
                {counties.map((county, index) => (
                  <span
                    key={county}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-icon-green hover:text-icon-green"
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    {county}
                  </span>
                ))}
              </div>
            </ScrollReveal>

            {/* Ireland network video */}
            <ScrollReveal delay={200}>
              <div className="mt-8 overflow-hidden rounded-2xl bg-white">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-auto w-full mix-blend-multiply"
                >
                  <source src="/videos/ireland-network.mp4" type="video/mp4" />
                </video>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  )
}
