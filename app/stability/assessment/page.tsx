import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { StabilityAssessmentForm } from "@/components/stability/StabilityAssessmentForm"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"

export const metadata: Metadata = {
  title: "Stability Assessment — EatoBiotics Stability™",
  description: "A short, calm questionnaire to set your digestive Stability Score baseline.",
}

export default function StabilityAssessmentPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="px-5 pt-24 pb-16 md:pt-28">
        <div className="mx-auto mb-6 max-w-2xl">
          <Link href="/stability" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft size={14} /> EatoBiotics Stability
          </Link>
          <h1 className="mt-4 text-center font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Stability Assessment</h1>
          <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground">A few calm questions about your gut, food, and lifestyle. Nothing here is a diagnosis.</p>
        </div>
        <StabilityAssessmentForm />
      </section>
      <MedicalDisclaimer />
    </main>
  )
}
