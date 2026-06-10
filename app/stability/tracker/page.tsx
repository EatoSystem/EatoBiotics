import type { Metadata } from "next"
import { StabilitySubnav } from "@/components/stability/StabilitySubnav"
import { StabilityTrackerForm } from "@/components/stability/StabilityTrackerForm"
import { MedicalDisclaimer } from "@/components/stability/MedicalDisclaimer"

export const metadata: Metadata = {
  title: "Daily Stability Tracker — EatoBiotics Stability™",
  robots: { index: false, follow: false },
}

export default function StabilityTrackerPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="px-5 pt-24 pb-16 md:pt-28">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-1 text-center font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Track Today&apos;s Gut Stability</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">Under a minute a day. Your logs stay on this device.</p>
        </div>
        <StabilitySubnav />
        <div className="mx-auto max-w-2xl">
          <StabilityTrackerForm />
        </div>
      </section>
      <MedicalDisclaimer />
    </main>
  )
}
