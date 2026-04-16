import type { Metadata } from "next"
import { AnxietyHero } from "@/components/anxiety/anxiety-hero"
import { AnxietyBody } from "@/components/anxiety/anxiety-body"
import { AnxietyScience } from "@/components/anxiety/anxiety-science"
import { AnxietyPathway } from "@/components/anxiety/anxiety-pathway"
import { AnxietyFoodSupport } from "@/components/anxiety/anxiety-food-support"
import { AnxietyFoods } from "@/components/anxiety/anxiety-foods"
import { AnxietyCta } from "@/components/anxiety/anxiety-cta"
import { AnxietyDisclaimer } from "@/components/anxiety/anxiety-disclaimer"

export const metadata: Metadata = {
  title: "Anxiety & Your Food System | EatoBiotics",
  description:
    "Learn how the gut-brain connection, the HPA axis, GABA production, and the vagus nerve may influence anxiety. Explore the EatoBiotics approach to supporting the food system inside you.",
  openGraph: {
    title: "Anxiety & Your Food System — EatoBiotics",
    description:
      "How gut health, cortisol, GABA, and food patterns may play a role in supporting the body's stress response.",
  },
}

export default function AnxietyPage() {
  return (
    <>
      <AnxietyHero />
      <div className="section-divider" />
      <AnxietyBody />
      <div className="section-divider" />
      <AnxietyScience />
      <div className="section-divider" />
      <AnxietyPathway />
      <div className="section-divider" />
      <AnxietyFoodSupport />
      <div className="section-divider" />
      <AnxietyFoods />
      <div className="section-divider" />
      <AnxietyCta />
      <div className="section-divider" />
      <AnxietyDisclaimer />
    </>
  )
}
