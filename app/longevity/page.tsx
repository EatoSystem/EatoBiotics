import type { Metadata } from "next"
import { SystemLanding } from "@/components/systems/system-landing"
import { SYSTEMS } from "@/lib/systems"

const system = SYSTEMS.longevity

export const metadata: Metadata = {
  title: `${system.productName} | EatoBiotics`,
  description: system.description,
}

export default function LongevityPage() {
  return <SystemLanding system={system} />
}
