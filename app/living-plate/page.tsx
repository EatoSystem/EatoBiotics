import type { Metadata } from "next"
import { PLATES } from "@/lib/plates"
import { PlatePage } from "@/components/plates/plate-page"

const plate = PLATES[2]

export const metadata: Metadata = {
  title: "The Living Plate — 1.3 Richness",
  description:
    "A fibre-rich, plant-diverse EatoBiotics plate expressing the full range of what a thriving microbiome needs — colour, abundance, variety, and nourishment.",
  openGraph: {
    title: "1.3 The Living Plate · EatoBiotics",
    description: "The system thrives when it is fed with richness and variety.",
  },
}

export default function LivingPlatePage() {
  return <PlatePage plate={plate} />
}
