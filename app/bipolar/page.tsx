import type { Metadata } from "next"
import { BipolarHero } from "@/components/bipolar/bipolar-hero"
import { BipolarBody } from "@/components/bipolar/bipolar-body"
import { BipolarScience } from "@/components/bipolar/bipolar-science"
import { BipolarPathway } from "@/components/bipolar/bipolar-pathway"
import { BipolarFoodSupport } from "@/components/bipolar/bipolar-food-support"
import { BipolarFoods } from "@/components/bipolar/bipolar-foods"
import { BipolarCta } from "@/components/bipolar/bipolar-cta"
import { BipolarDisclaimer } from "@/components/bipolar/bipolar-disclaimer"

export const metadata: Metadata = {
  title: "Bipolar & Your Food System | EatoBiotics",
  description:
    "Learn how the gut-brain connection, inflammation, microbial diversity, and food patterns may influence mood stability. Explore the EatoBiotics approach to supporting the food system inside you.",
  openGraph: {
    title: "Bipolar & Your Food System — EatoBiotics",
    description:
      "How the gut-brain connection, inflammation, and food patterns may play a role in supporting mood stability.",
  },
}

export default function BipolarPage() {
  return (
    <>
      <BipolarHero />
      <div className="section-divider" />
      <BipolarBody />
      <div className="section-divider" />
      <BipolarScience />
      <div className="section-divider" />
      <BipolarPathway />
      <div className="section-divider" />
      <BipolarFoodSupport />
      <div className="section-divider" />
      <BipolarFoods />
      <div className="section-divider" />
      <BipolarCta />
      <div className="section-divider" />
      <BipolarDisclaimer />
    </>
  )
}
