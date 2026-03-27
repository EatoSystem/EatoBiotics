import type { Metadata } from "next"
import { SportsAssessmentClient } from "./assessment-client"

export const metadata: Metadata = {
  title: "EatoSports Assessment — Find Your Performance Food Profile | EatoBiotics",
  description:
    "12 questions. Your sport, your level. A personalised performance food profile built around the 4 Systems of Performance.",
}

export default function EatoSportsAssessmentPage() {
  return <SportsAssessmentClient />
}
