import type { Metadata } from "next"
import { MindAssessmentClient } from "@/components/mind-assessment/mind-assessment-client"

export const metadata: Metadata = {
  title: "The Mind Assessment | EatoBiotics",
  description:
    "Discover how well your food habits are supporting your gut-brain connection. 15 questions across 5 pillars. Your mental clarity score, brain profile, and personalised food plan — sent to your inbox.",
  openGraph: {
    title: "The Mind Assessment — EatoBiotics",
    description:
      "See how your food habits score for mental clarity, mood stability, and focus.",
  },
}

export default function AssessmentMindPage() {
  return <MindAssessmentClient />
}
