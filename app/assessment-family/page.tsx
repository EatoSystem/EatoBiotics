import type { Metadata } from "next"
import { FamilyAssessmentClient } from "@/components/family-assessment/family-assessment-client"

export const metadata: Metadata = {
  title: "The Family Food System Assessment | EatoBiotics",
  description:
    "Discover how well your family's food system supports gut health. 15 questions. One score. A clear picture of what's working and where to start.",
  openGraph: {
    title: "The Family Food System Assessment | EatoBiotics",
    description:
      "Discover how well your family's food system supports gut health. 15 questions. One score. A clear picture of what's working and where to start.",
  },
}

export default function AssessmentFamilyPage() {
  return <FamilyAssessmentClient />
}
