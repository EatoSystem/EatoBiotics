import type { Metadata } from "next"
import { AssessmentClient } from "@/components/assessment/assessment-client"

export const metadata: Metadata = {
  title: "Food System Assessment",
  description:
    "Discover your food system type with the EatoBiotics 15-question assessment. Get your personalised 5-pillar gut health score and a 7-day action plan.",
  openGraph: {
    title: "Food System Assessment | EatoBiotics",
    description:
      "Find out how your diet is really supporting your gut — across diversity, fibre, fermented foods, consistency, and how you feel.",
  },
}

export default function AssessmentPage() {
  return <AssessmentClient />
}
