import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { AddonGate } from "@/components/assessment/addon-gate"
import { isAddonKey } from "@/lib/assessment/registry"

export const metadata: Metadata = {
  title: "Add a focus to your assessment | EatoBiotics",
  description:
    "Add Stability, Glucose, Mind, or Performance to your Food System foundation for a deeper combined report.",
  robots: { index: false },
}

export default async function AddonGatePage({ params }: { params: Promise<{ addon: string }> }) {
  const { addon } = await params
  if (!isAddonKey(addon)) notFound()
  return <AddonGate addon={addon} />
}
