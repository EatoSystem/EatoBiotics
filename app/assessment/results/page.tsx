import type { Metadata } from "next"
import { CombinedReport } from "@/components/assessment/combined-report"

export const metadata: Metadata = {
  title: "Your Food System Report | EatoBiotics",
  description:
    "Your Food System foundation report — and, when added, your combined report with a focused system assessment.",
  robots: { index: false },
}

export default function AssessmentResultsPage() {
  return <CombinedReport />
}
