import type { Metadata } from "next"
import { Suspense } from "react"
import { DemoAssessmentClient } from "./demo-assessment-client"

export const metadata: Metadata = {
  title: "Assessment Demo — EatoBiotics",
  description: "See what your EatoBiotics food system assessment results look like — with a sample Emerging Balance profile.",
  robots: "noindex",
}

export default function DemoAssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DemoAssessmentClient />
    </Suspense>
  )
}
