import type { Metadata } from "next"
import { GlucoseAssessmentClient } from "@/components/eatobetics/glucose-assessment-client"

export const metadata: Metadata = {
  title: { absolute: "EatoBetics Assessment — Your Glucose Intelligence Score" },
  description:
    "A free EatoBetics assessment of how your meals, rhythm, strength habits, and daily routine support steady energy and glucose. Get your EatoBetics Score and full report in about 4 minutes.",
  robots: { index: false },
  openGraph: {
    title: "EatoBetics Assessment — Your Glucose Intelligence Score",
    description:
      "See how your meals, rhythm, and daily habits support steady energy and glucose. Free, about 3 minutes.",
  },
}

export default function EatoBeticsAssessmentPage() {
  return <GlucoseAssessmentClient />
}
