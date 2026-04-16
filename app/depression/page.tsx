import type { Metadata } from "next"
import { DepressionHero } from "@/components/depression/depression-hero"
import { DepressionBody } from "@/components/depression/depression-body"
import { DepressionScience } from "@/components/depression/depression-science"
import { DepressionPathway } from "@/components/depression/depression-pathway"
import { DepressionFoodSupport } from "@/components/depression/depression-food-support"
import { DepressionFoods } from "@/components/depression/depression-foods"
import { DepressionCta } from "@/components/depression/depression-cta"
import { DepressionDisclaimer } from "@/components/depression/depression-disclaimer"

export const metadata: Metadata = {
  title: "Depression & Your Food System | EatoBiotics",
  description:
    "Learn how the gut-brain connection, serotonin production, inflammation, and microbial diversity may influence depression. Explore the EatoBiotics approach to supporting the food system inside you.",
  openGraph: {
    title: "Depression & Your Food System — EatoBiotics",
    description:
      "How gut health, serotonin, inflammation, and food patterns may play a role in supporting mood and mental wellbeing.",
  },
}

export default function DepressionPage() {
  return (
    <>
      <DepressionHero />
      <div className="section-divider" />
      <DepressionBody />
      <div className="section-divider" />
      <DepressionScience />
      <div className="section-divider" />
      <DepressionPathway />
      <div className="section-divider" />
      <DepressionFoodSupport />
      <div className="section-divider" />
      <DepressionFoods />
      <div className="section-divider" />
      <DepressionCta />
      <div className="section-divider" />
      <DepressionDisclaimer />
    </>
  )
}
