import type { Metadata } from "next"
import { SystemLanding } from "@/components/systems/system-landing"
import { SYSTEMS } from "@/lib/systems"

const system = SYSTEMS.birth

// Sensitive Life system — kept out of the index until clinical/legal sign-off.
export const metadata: Metadata = {
  title: `${system.productName} | EatoBiotics`,
  description: system.description,
  robots: { index: false },
}

export default function BirthPage() {
  return <SystemLanding system={system} />
}
