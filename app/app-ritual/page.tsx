import type { Metadata } from "next"
import { ScreenShowcase } from "@/components/app-concept/ScreenShowcase"

export const metadata: Metadata = {
  title: "App Concept — Daily Ritual",
  robots: { index: false, follow: false },
}

export default function AppRitualConceptPage() {
  return <ScreenShowcase slug="app-ritual" />
}
