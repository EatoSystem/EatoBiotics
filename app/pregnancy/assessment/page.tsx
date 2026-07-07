import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { FoundationGuard } from "@/components/assessment/foundation-guard"
import { PregnancyAssessmentForm } from "@/components/pregnancy/PregnancyAssessmentForm"
import { SystemDisclaimer } from "@/components/systems/system-disclaimer"

export const metadata: Metadata = {
  title: "Pregnancy Assessment — The Pregnancy Food System | EatoBiotics",
  description: "A short, food-first questionnaire about your general-wellbeing food patterns during pregnancy. Not antenatal care or a diagnosis.",
  robots: { index: false },
}

export default function PregnancyAssessmentPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="px-5 pt-24 pb-16 md:pt-28">
        <div className="mx-auto mb-6 max-w-2xl">
          <Link href="/pregnancy" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={14} /> The Pregnancy Food System
          </Link>
          <h1 className="mt-4 text-center font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Pregnancy Food Assessment</h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">
            A few gentle questions about your everyday food patterns. Nothing here is antenatal care or a diagnosis.
          </p>
        </div>
        <FoundationGuard addon="pregnancy">
          <PregnancyAssessmentForm />
        </FoundationGuard>
      </section>
      <SystemDisclaimer level="sensitive" />
    </main>
  )
}
