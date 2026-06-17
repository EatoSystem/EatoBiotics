import type { Metadata } from "next"
import { AssessmentClient } from "@/components/assessment/assessment-client"

export const metadata: Metadata = {
  title: "You — Food System Assessment | EatoBiotics",
  description:
    "The You Assessment creates your individual Food System baseline — habits, rhythm, diversity, digestion — with your personal score and priorities.",
  openGraph: {
    title: "You — Food System Assessment | EatoBiotics",
    description:
      "Build your individual Food System baseline: your score, strengths, priority areas, and first recommendations.",
  },
}

export default function AssessmentYouPage() {
  return <AssessmentClient />
}
