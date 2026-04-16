import { ScrollReveal } from "@/components/scroll-reveal"
import { Check, Minus } from "lucide-react"

const INCREASE = [
  "Omega-3 rich foods — oily fish, walnuts, flaxseed, chia seeds",
  "Protein-rich meals — support dopamine and norepinephrine production",
  "Plant diversity — 30+ different plants weekly for microbiome depth",
  "Fermented foods — kefir, yogurt, kimchi, sauerkraut",
  "Structured, regular meal timing — reduces glucose variability",
]

const REDUCE = [
  "Food additives and artificial colours — some linked to hyperactivity in children",
  "Excess sugar and refined carbohydrates — spikes and crashes impair focus",
  "Ultra-processed snacks — low in fibre, disruptive to the gut microbiome",
  "Skipping breakfast — impairs morning cognitive function and glucose stability",
  "Highly inflammatory dietary patterns — may worsen neuroinflammation",
]

export function AdhdFoodSupport() {
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
              Food is not a treatment for ADHD. But building a diet rich in omega-3s, plant
              diversity, and structured eating patterns may support the neurological and gut
              systems connected to focus, attention, and cognitive flexibility.
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
