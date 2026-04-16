import { Info } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function BipolarDisclaimer() {
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
              diagnosis, or treatment. Bipolar disorder is a complex condition that requires
              professional assessment and, in most cases, evidence-based treatment managed by a
              qualified healthcare professional. Food can support the body&apos;s internal systems,
              but it is one factor among many. Nothing on this page should be interpreted as a
              recommendation to change, reduce, or discontinue any prescribed medication or
              professional care plan.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
