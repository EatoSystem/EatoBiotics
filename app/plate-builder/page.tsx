import type { Metadata } from "next"
import { PlateBuilderClient } from "@/components/plate-builder/plate-builder-client"

export const metadata: Metadata = {
  title: "Plate Builder - EatoBiotics",
  description:
    "Choose one of the four EatoBiotics plates, localise it to your country, and create a personalised recipe concept with an EatoBiotics score.",
  openGraph: {
    title: "Plate Builder - EatoBiotics",
    description: "Build your plate. Feed your food system.",
  },
}

export default function PlateBuilderPage() {
  return <PlateBuilderClient />
}
