import { ScrollReveal } from "@/components/scroll-reveal"
import { Check, Minus } from "lucide-react"
import type { ConditionDef } from "@/lib/conditions"

export function ConditionFoodSupport({ condition }: { condition: ConditionDef }) {
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
              {condition.foodSupport.intro}
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
                  {condition.foodSupport.increase.map((item) => (
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
                  {condition.foodSupport.reduce.map((item) => (
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
