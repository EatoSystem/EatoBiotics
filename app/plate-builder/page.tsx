import type { Metadata } from "next"
import { Suspense } from "react"
import { PlateBuilderTabs } from "@/components/plate-builder/plate-builder-tabs"

export const metadata: Metadata = {
  title: "Plate Builder — EatoBiotics",
  description:
    "Build a recipe, plan a week of meals, or design your own plate. Save your favourites to your personal cookbook.",
  openGraph: {
    title: "Plate Builder — EatoBiotics",
    description: "Build your plate. Feed your food system.",
  },
}

export default function PlateBuilderPage() {
  // useSearchParams inside PlateBuilderTabs requires a Suspense boundary
  // for static optimisation to work cleanly.
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PlateBuilderTabs />
    </Suspense>
  )
}
