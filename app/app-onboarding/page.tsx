import type { Metadata } from "next"
import { ScreenShowcase } from "@/components/app-concept/ScreenShowcase"

export const metadata: Metadata = {
  title: "App Concept — Sign in",
  robots: { index: false, follow: false },
}

export default function AppOnboardingConceptPage() {
  return <ScreenShowcase slug="app-onboarding" />
}
