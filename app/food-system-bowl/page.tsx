import type { Metadata } from "next"
import { PLATES } from "@/lib/plates"
import { PlatePage } from "@/components/plates/plate-page"

const plate = PLATES[0]

export const metadata: Metadata = {
  title: "The Food System Bowl — 1.1 Foundation",
  description:
    "The entry point of the EatoBiotics weekly system. Clear, balanced, and welcoming — built to introduce the idea of feeding the ecosystem inside you.",
  openGraph: {
    title: "1.1 The Food System Bowl · EatoBiotics",
    description: "This is how EatoBiotics begins. The foundation plate of the weekly system.",
  },
}

export default function FoodSystemBowlPage() {
  return <PlatePage plate={plate} />
}
