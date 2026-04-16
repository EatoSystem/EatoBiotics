import { Info } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function AnxietyDisclaimer() {
  return (
    <section className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-[760px]">
        <ScrollReveal>
          <div className="rounded-3xl border border-border bg-secondary/40 p-7 md:p-9">
            <div className="mb-3 flex items-center gap-2.5">
              <Info size={16} className="text-muted-foreground shrink-0" />
              <p className="text-sm font-semibold text-foreground">Important note</p>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This page is for educational purposes only and does not constitute medical advice,
              diagnosis, or treatment. Anxiety is a complex condition with many contributing factors
              and should be assessed and managed with the support of a qualified healthcare
              professional. Food can support the body&apos;s internal systems, but it is one factor
              among many and is not a substitute for evidence-based psychological or medical care.
              If you are experiencing significant anxiety, please seek professional support.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
