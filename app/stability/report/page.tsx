import type { Metadata } from "next"
import { StabilitySubnav } from "@/components/stability/StabilitySubnav"
import { StabilityReport } from "@/components/stability/StabilityReport"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"

export const metadata: Metadata = {
  title: "Monthly Stability Report — EatoBiotics Stability™",
  robots: { index: false, follow: false },
}

export default function StabilityReportPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="px-5 pt-24 pb-16 md:pt-28">
        <h1 className="mb-6 text-center font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Monthly Stability Report</h1>
        <StabilitySubnav />
        <div className="mx-auto max-w-3xl">
          <StabilityReport />
        </div>
      </section>
      <MedicalDisclaimer />
    </main>
  )
}
