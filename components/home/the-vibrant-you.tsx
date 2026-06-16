import { Zap, Sprout, Brain, ShieldCheck } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

const outcomes = [
  {
    icon: Zap,
    label: "Steady energy",
    line: "Even fuel through the day — no 3pm crash.",
    accent: "var(--icon-yellow)",
  },
  {
    icon: Sprout,
    label: "Easy digestion",
    line: "Calm, regular, comfortable — gut at ease.",
    accent: "var(--icon-lime)",
  },
  {
    icon: Brain,
    label: "Clear mind",
    line: "Sharper focus and a steadier mood.",
    accent: "var(--icon-teal)",
  },
  {
    icon: ShieldCheck,
    label: "Strong immunity",
    line: "A resilient system that defends itself.",
    accent: "var(--icon-green)",
  },
]

export function TheVibrantYou() {
  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">

          {/* Left: the hook */}
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-icon-green">The Upside</p>
            <h2 className="mt-4 text-pretty font-serif text-3xl font-semibold text-foreground sm:text-4xl md:text-5xl">
              This is what a thriving{" "}
              <span className="brand-gradient-text">food system feels like.</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-muted-foreground">
              When the living food system inside you is well fed, you feel it everywhere — steady
              energy, easy digestion, a clear mind, and an immune system that holds the line.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              EatoBiotics makes that system visible and gives you{" "}
              <span className="font-semibold text-foreground">one score, one framework, one plate</span>{" "}
              — a clear, food-first way to build it and feel the difference, starting today.
            </p>
          </ScrollReveal>

          {/* Right: the vibrant payoff */}
          <div>
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              {outcomes.map((o, index) => (
                <ScrollReveal key={o.label} delay={index * 80}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg sm:p-6">
                    <div
                      aria-hidden
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${o.accent}, color-mix(in srgb, ${o.accent} 40%, transparent))` }}
                    />
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: `color-mix(in srgb, ${o.accent} 14%, transparent)` }}
                    >
                      <o.icon size={22} style={{ color: o.accent }} />
                    </div>
                    <h3 className="mt-4 font-serif text-lg font-semibold text-foreground">{o.label}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{o.line}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            {/* Gradient unifier strip */}
            <ScrollReveal delay={320}>
              <div className="brand-gradient mt-4 flex items-center justify-center rounded-2xl px-6 py-4 text-center shadow-md sm:mt-5">
                <p className="font-serif text-base font-semibold text-white sm:text-lg">
                  One thriving food system powers them all.
                </p>
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  )
}
