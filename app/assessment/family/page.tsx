import type { Metadata } from "next"
import { FamilyAssessmentClient } from "@/components/family-assessment/family-assessment-client"

export const metadata: Metadata = {
  title: "Family — Food System Assessment | EatoBiotics",
  description:
    "The Family Assessment creates your household Food System baseline — shared meals, routines, and priorities that support everyone at the table.",
  openGraph: {
    title: "Family — Food System Assessment | EatoBiotics",
    description:
      "Build your household Food System baseline: your family score, strengths, priority areas, and first recommendations.",
  },
}

export default function AssessmentFamilyFoundationPage() {
  return <FamilyAssessmentClient />
}
