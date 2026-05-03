import type { Metadata } from "next"
import { MindAssessmentClient } from "@/components/mind-assessment/mind-assessment-client"

export const metadata: Metadata = {
  title: "Gut-Brain Assessment | EatoBiotics",
  description:
    "Discover how your food habits are supporting your gut-brain connection — a free assessment covering mood, focus, stress, and mental clarity through the lens of the microbiome.",
  openGraph: {
    title: "Gut-Brain Assessment | EatoBiotics",
    description:
      "90–95% of serotonin is made in your gut. Find out how your diet is supporting your mind.",
  },
}

export default function MindAssessmentPage() {
  return <MindAssessmentClient />
}
