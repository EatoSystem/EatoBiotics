import type { Metadata } from "next"
import { FamilyAssessmentClient } from "@/components/family-assessment/family-assessment-client"

export const metadata: Metadata = {
  title: "Family Food System Assessment | EatoBiotics",
  description:
    "Discover your family's food system score — a free 15-question assessment that reveals how well your household's eating habits support gut health for everyone at the table.",
  openGraph: {
    title: "Family Food System Assessment | EatoBiotics",
    description:
      "Find out how your family's diet is supporting gut health — and get a personalised plan to improve it together.",
  },
}

export default function FamilyAssessmentPage() {
  return <FamilyAssessmentClient />
}
