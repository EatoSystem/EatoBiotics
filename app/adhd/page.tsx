import type { Metadata } from "next"
import { AdhdHero } from "@/components/adhd/adhd-hero"
import { AdhdBody } from "@/components/adhd/adhd-body"
import { AdhdScience } from "@/components/adhd/adhd-science"
import { AdhdPathway } from "@/components/adhd/adhd-pathway"
import { AdhdFoodSupport } from "@/components/adhd/adhd-food-support"
import { AdhdFoods } from "@/components/adhd/adhd-foods"
import { AdhdCta } from "@/components/adhd/adhd-cta"
import { AdhdDisclaimer } from "@/components/adhd/adhd-disclaimer"

export const metadata: Metadata = {
  title: "ADHD & Your Food System | EatoBiotics",
  description:
    "Learn how the gut-brain connection, dopamine pathways, omega-3s, and microbial diversity may influence focus and attention. Explore the EatoBiotics approach to supporting the food system inside you.",
  openGraph: {
    title: "ADHD & Your Food System — EatoBiotics",
    description:
      "How gut health, dopamine, omega-3 fatty acids, and food patterns may play a role in supporting focus and cognitive function.",
  },
}

export default function AdhdPage() {
  return (
    <>
      <AdhdHero />
      <div className="section-divider" />
      <AdhdBody />
      <div className="section-divider" />
      <AdhdScience />
      <div className="section-divider" />
      <AdhdPathway />
      <div className="section-divider" />
      <AdhdFoodSupport />
      <div className="section-divider" />
      <AdhdFoods />
      <div className="section-divider" />
      <AdhdCta />
      <div className="section-divider" />
      <AdhdDisclaimer />
    </>
  )
}
