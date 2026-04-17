import type { Metadata } from "next"
import { YouHero } from "@/components/you/you-hero"
import { YouIntro } from "@/components/you/you-intro"
import { YouBiotics } from "@/components/you/you-biotics"
import { YouPlate } from "@/components/you/you-plate"
import { YouHow } from "@/components/you/you-how"
import { YouCta } from "@/components/you/you-cta"
import { NewsletterCta } from "@/components/home/newsletter-cta"

export const metadata: Metadata = {
  title: "The Food System Inside You | EatoBiotics",
  description:
    "Your gut is home to 100 trillion microbes — a living system shaped entirely by what you eat. Learn how to build the food system inside you.",
  openGraph: {
    title: "The Food System Inside You | EatoBiotics",
    description:
      "Your gut is home to 100 trillion microbes — a living system shaped entirely by what you eat. Learn how to build the food system inside you.",
  },
}

export default function YouPage() {
  return (
    <>
      <YouHero />
      <div
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
        }}
      />
      <YouIntro />
      <div className="section-divider" />
      <YouBiotics />
      <div className="section-divider" />
      <YouPlate />
      <div className="section-divider" />
      <YouHow />
      <div className="section-divider" />
      <YouCta />
      <div className="section-divider" />
      <NewsletterCta />
    </>
  )
}
