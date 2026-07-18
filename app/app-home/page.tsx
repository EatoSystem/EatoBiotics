import type { Metadata } from "next"
import { ScreenShowcase } from "@/components/app-concept/ScreenShowcase"

export const metadata: Metadata = {
  title: "App Concept — Home",
  robots: { index: false, follow: false },
}

export default function AppHomeConceptPage() {
  return <ScreenShowcase slug="app-home" />
}
