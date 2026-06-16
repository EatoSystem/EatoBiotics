import { Zap, Sprout, Utensils } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const outcomes = [
  {
    icon: Zap,
    label: "Steady energy",
    line: "Fewer crashes and more stable days.",
    stat: "+14 energy score",
    accent: "var(--icon-yellow)",
  },
  {
    icon: Sprout,
    label: "Easy digestion",
    line: "Calmer digestion and less discomfort.",
    stat: "3 fewer bloating days/week",
    accent: "var(--icon-lime)",
  },
  {
    icon: Utensils,
    label: "Food confidence",
    line: "Know what to eat and build better plates.",
    stat: "30+ plants/week",
    accent: "var(--icon-teal)",
  },
]

export function TheVibrantYou() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Upside</p>
            <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              This is what a thriving{" "}
              <span className="brand-gradient-text">food system feels like.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              When the living food system inside you is well fed, you feel it everywhere — steadier
              energy, easier digestion, and real confidence about what to eat.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {outcomes.map((o, index) => (
            <ScrollReveal key={o.label} delay={index * 100}>
              <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-8 transition-all hover:-translate-y-1 hover:shadow-xl">
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ background: `linear-gradient(90deg, ${o.accent}, color-mix(in srgb, ${o.accent} 40%, transparent))` }}
                />
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: `color-mix(in srgb, ${o.accent} 14%, transparent)` }}
                >
                  <o.icon size={26} style={{ color: o.accent }} />
                </div>
                <h3 className="mt-6 font-serif text-2xl font-semibold text-foreground">{o.label}</h3>
                <p className="mt-2 flex-1 text-base leading-relaxed text-muted-foreground">{o.line}</p>
                <span
                  className="mt-6 inline-flex w-fit items-center rounded-full px-3.5 py-1.5 text-sm font-bold"
                  style={{
                    background: `color-mix(in srgb, ${o.accent} 16%, transparent)`,
                    color: `color-mix(in srgb, ${o.accent} 75%, var(--foreground))`,
                  }}
                >
                  {o.stat}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Gradient unifier strip */}
        <ScrollReveal delay={360}>
          <div className="brand-gradient mt-6 flex items-center justify-center rounded-2xl px-6 py-4 text-center shadow-md">
            <p className="font-serif text-base font-semibold text-white sm:text-lg">
              One thriving food system powers them all.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
