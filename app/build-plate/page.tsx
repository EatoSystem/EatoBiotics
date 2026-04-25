import type { Metadata } from "next"
import { PLATES } from "@/lib/plates"
import { PlatePage } from "@/components/plates/plate-page"

const plate = PLATES[3]

export const metadata: Metadata = {
  title: "The Rebuild Plate — 1.4 Restoration",
  description:
    "The closing plate of the EatoBiotics weekly sequence. Resilience, recovery, and restoration — calm, purposeful, and hopeful. Not perfection. Rebuilding.",
  openGraph: {
    title: "1.4 The Rebuild Plate · EatoBiotics",
    description: "Not perfection. Rebuilding.",
  },
}

export default function BuildPlatePage() {
  return <PlatePage plate={plate} />
}
