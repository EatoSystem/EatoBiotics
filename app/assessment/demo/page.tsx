import type { Metadata } from "next"
import { Suspense } from "react"
import { DemoClient } from "@/components/assessment/demo-client"

export const metadata: Metadata = {
  title: "Report Demo — EatoBiotics",
  description:
    "See exactly what you get in the EatoBiotics Food System Report (€49) before you buy. Explore using real sample data.",
}

export default function DemoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DemoClient />
    </Suspense>
  )
}
