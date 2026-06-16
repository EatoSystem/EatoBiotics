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

        <div className="mt-16 grid gap-7 md:grid-cols-3">
          {outcomes.map((o, index) => (
            <ScrollReveal key={o.label} delay={index * 100}>
              <div
                className="group relative flex h-full min-h-[340px] flex-col overflow-hidden rounded-[1.75rem] border border-border p-9 shadow-lg transition-all hover:-translate-y-1.5 hover:shadow-2xl"
                style={{ background: `linear-gradient(165deg, color-mix(in srgb, ${o.accent} 9%, var(--card)) 0%, var(--card) 55%)` }}
              >
                <div
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ background: `linear-gradient(90deg, ${o.accent}, color-mix(in srgb, ${o.accent} 40%, transparent))` }}
                />
                {/* soft accent glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
                  style={{ background: `radial-gradient(circle, color-mix(in srgb, ${o.accent} 30%, transparent), transparent 70%)` }}
                />
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm"
                  style={{ background: `color-mix(in srgb, ${o.accent} 16%, transparent)` }}
                >
                  <o.icon size={30} style={{ color: o.accent }} />
                </div>
                <h3 className="relative mt-7 font-serif text-2xl font-semibold text-foreground">{o.label}</h3>
                <p className="relative mt-3 flex-1 text-base leading-relaxed text-muted-foreground">{o.line}</p>
                <span
                  className="relative mt-7 inline-flex w-fit items-center rounded-full px-4 py-2 text-base font-bold shadow-sm"
                  style={{
                    background: `color-mix(in srgb, ${o.accent} 18%, transparent)`,
                    color: `color-mix(in srgb, ${o.accent} 78%, var(--foreground))`,
                  }}
                >
                  {o.stat}
                </span>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
