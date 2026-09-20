import type { Metadata } from "next"
import { TodayShowcase } from "@/components/app-concept/TodayShowcase"

export const metadata: Metadata = {
  title: "App Concept — Today",
  robots: { index: false, follow: false },
}

export default function AppHomeConceptPage() {
  return <TodayShowcase />
}
