import { ScrollReveal } from "@/components/scroll-reveal"
import { Check, Minus } from "lucide-react"

const INCREASE = [
  "Fermented foods — support GABA-producing bacteria",
  "Magnesium-rich foods — dark leafy greens, seeds, legumes",
  "Omega-3 rich foods — oily fish, walnuts, flaxseed",
  "Complex carbohydrates — steady glucose supports a calm baseline",
  "Consistent meal timing — regularity calms the gut-brain rhythm",
]

const REDUCE = [
  "Excess caffeine — can amplify cortisol and heighten reactivity",
  "High-sugar foods — blood sugar spikes worsen the stress response",
  "Alcohol — disrupts the gut microbiome and sleep architecture",
  "Ultra-processed foods — low in fibre, high in inflammatory potential",
  "Skipping meals — erratic glucose creates physiological stress signals",
]

export function AnxietyFoodSupport() {
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[1000px]">
        <ScrollReveal>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--icon-teal)] mb-3">
              Practical Guidance
            </p>
            <h2 className="font-serif text-4xl font-semibold text-foreground sm:text-5xl text-balance">
              How food can support your system
            </h2>
            <p className="mt-4 mx-auto max-w-xl text-base text-muted-foreground leading-relaxed">
              Food is not a treatment for anxiety. But building a more stable gut ecosystem may
              support the HPA axis, GABA signalling, and the body&apos;s capacity to return to calm
              after stress.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-5 sm:grid-cols-2">
          <ScrollReveal delay={80}>
            <div
              className="h-full overflow-hidden rounded-3xl border bg-background"
              style={{ borderColor: "color-mix(in srgb, var(--icon-green) 30%, transparent)" }}
            >
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green))" }} />
              <div className="p-7">
                <p className="mb-5 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-green)" }}>
                  What to increase
                </p>
                <ul className="space-y-3.5">
                  {INCREASE.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--icon-green) 15%, transparent)" }}
                      >
                        <Check size={11} style={{ color: "var(--icon-green)" }} strokeWidth={2.5} />
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={160}>
            <div
              className="h-full overflow-hidden rounded-3xl border bg-background"
              style={{ borderColor: "color-mix(in srgb, var(--icon-orange) 30%, transparent)" }}
            >
              <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--icon-yellow), var(--icon-orange))" }} />
              <div className="p-7">
                <p className="mb-5 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--icon-orange)" }}>
                  What to reduce
                </p>
                <ul className="space-y-3.5">
                  {REDUCE.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{ background: "color-mix(in srgb, var(--icon-orange) 15%, transparent)" }}
                      >
                        <Minus size={11} style={{ color: "var(--icon-orange)" }} strokeWidth={2.5} />
                      </span>
                      <span className="text-sm leading-relaxed text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
