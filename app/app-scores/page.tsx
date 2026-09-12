import type { Metadata } from "next"
import { ScreenShowcase } from "@/components/app-concept/ScreenShowcase"

export const metadata: Metadata = {
  title: "App Concept — Progress",
  robots: { index: false, follow: false },
}

export default function AppScoresConceptPage() {
  return <ScreenShowcase slug="app-scores" />
}
