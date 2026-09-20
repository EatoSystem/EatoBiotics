import type { Metadata } from "next"
import { ScreenShowcase } from "@/components/app-concept/ScreenShowcase"

export const metadata: Metadata = {
  title: "App Concept — Meal",
  robots: { index: false, follow: false },
}

export default function AppMealConceptPage() {
  return <ScreenShowcase slug="app-meal" />
}
