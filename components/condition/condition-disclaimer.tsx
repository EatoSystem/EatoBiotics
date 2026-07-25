import { Info } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"
import type { ConditionDef } from "@/lib/conditions"

export function ConditionDisclaimer({ condition }: { condition: ConditionDef }) {
  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-[760px]">
        <ScrollReveal>
          <div className="rounded-3xl border border-border bg-secondary/40 p-7 md:p-9">
            <div className="mb-3 flex items-center gap-2.5">
              <Info size={16} className="text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold text-foreground">Important note</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{condition.disclaimer}</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
