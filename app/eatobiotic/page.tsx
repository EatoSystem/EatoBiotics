import type { Metadata } from "next"
import { EatobioticClient } from "./eatobiotic-client"

export const metadata: Metadata = {
  title: "Your Food System Expert — EatoBiotics",
  description:
    "Speak or text with your EatoBiotics Food System Expert. Explore your plate, gut health, Biotics Score, and the foods that help you thrive.",
  openGraph: {
    title: "Your Food System Expert — EatoBiotics",
    description:
      "Understand and improve the food system inside you. Get personalised guidance on your plate, gut health, Biotics Score, and weekly food choices.",
  },
}

export default function EatobioticPage() {
  return <EatobioticClient />
}
