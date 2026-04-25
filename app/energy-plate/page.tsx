import type { Metadata } from "next"
import { PLATES } from "@/lib/plates"
import { PlatePage } from "@/components/plates/plate-page"

const plate = PLATES[1]

export const metadata: Metadata = {
  title: "The Immunity, Mood & Energy Plate — 1.2 Function",
  description:
    "A vibrant EatoBiotics plate designed to support immunity, steadier energy, emotional resilience, and recovery. The microbiome affects far more than digestion.",
  openGraph: {
    title: "1.2 The Immunity, Mood & Energy Plate · EatoBiotics",
    description: "Support the system, and the system supports more of you.",
  },
}

export default function EnergyPlatePage() {
  return <PlatePage plate={plate} />
}
