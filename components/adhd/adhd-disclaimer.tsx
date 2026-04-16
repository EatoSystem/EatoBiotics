import { Info } from "lucide-react"
import { ScrollReveal } from "@/components/scroll-reveal"

export function AdhdDisclaimer() {
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
              diagnosis, or treatment. ADHD is a neurodevelopmental condition that should be
              assessed and managed with the support of a qualified healthcare professional.
              Dietary changes are not a substitute for evidence-based treatment, which may include
              medication, behavioural therapy, and structured support. Food can support the body&apos;s
              internal systems, but it is one factor among many. Nothing on this page should be
              interpreted as a recommendation to change or discontinue any prescribed treatment.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
