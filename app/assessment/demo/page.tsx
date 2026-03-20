import type { Metadata } from "next"
import { DemoClient } from "@/components/assessment/demo-client"

export const metadata: Metadata = {
  title: "Report Demo — EatoBiotics",
  description: "See what each EatoBiotics report tier includes — Starter, Full, and Premium.",
}

export default function DemoPage() {
  return <DemoClient />
}
