import type { Metadata } from "next"
import { GlucoseAssessmentClient } from "@/components/eatobetics/glucose-assessment-client"
import { FoundationGuard } from "@/components/assessment/foundation-guard"

export const metadata: Metadata = {
  title: { absolute: "Glucose Assessment — Your Glucose Intelligence Score" },
  description:
    "A free EatoBiotics assessment of how your meals, rhythm, strength habits, and daily routine support steady energy and glucose. Get your Glucose Score and full report in about 4 minutes.",
  robots: { index: false },
  openGraph: {
    title: "Glucose Assessment — Your Glucose Intelligence Score",
    description:
      "See how your meals, rhythm, and daily habits support steady energy and glucose. Free, about 3 minutes.",
  },
}

export default function GlucoseAssessmentPage() {
  return (
    <FoundationGuard addon="glucose">
      <GlucoseAssessmentClient />
    </FoundationGuard>
  )
}
