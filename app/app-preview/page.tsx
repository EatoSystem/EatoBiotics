import type { Metadata } from "next"
import { AppLanding } from "@/components/app-concept/AppLanding"

// Concept preview — kept out of search + AI crawlers, same as /newhome.
// NOTE: distinct from the live /app marketing page; this is the dark-mode
// companion-app screen concept.
export const metadata: Metadata = {
  title: "EatoBiotics App — Concept Preview",
  description: "A concept preview of the EatoBiotics mobile companion app.",
  robots: { index: false, follow: false },
}

export default function AppConceptLandingPage() {
  return <AppLanding />
}
