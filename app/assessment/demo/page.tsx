import type { Metadata } from "next"
import { DemoClient } from "@/components/assessment/demo-client"

export const metadata: Metadata = {
  title: "Report Demo — EatoBiotics",
  description:
    "See exactly what you get at each report tier before you buy — Starter €20, Full €40, Premium €50. Explore using real sample data.",
}

export default function DemoPage() {
  return <DemoClient />
}
