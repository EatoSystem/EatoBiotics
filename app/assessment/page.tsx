import type { Metadata } from "next"
import { FoundationChooser } from "@/components/assessment/foundation-chooser"

export const metadata: Metadata = {
  title: "Food System Assessment",
  description:
    "Every EatoBiotics journey starts with your Food System foundation. Choose You or Family, then add Stability, Glucose, Mind, or Performance for a deeper combined report.",
  openGraph: {
    title: "Food System Assessment | EatoBiotics",
    description:
      "Start with your Food System foundation — You or Family — then layer on a focused add-on assessment for a deeper combined report.",
  },
}

export default function AssessmentPage() {
  return <FoundationChooser />
}
