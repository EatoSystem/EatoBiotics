import type { Metadata } from "next"
import { FamilyHero } from "@/components/family/family-hero"
import { FamilyBenefits } from "@/components/family/family-benefits"
import { FamilyWhy } from "@/components/family/family-why"
import { FamilyBiotics } from "@/components/family/family-biotics"
import { FamilyPlate } from "@/components/family/family-plate"
import { FamilyManifesto } from "@/components/family/family-manifesto"
import { NewsletterCta } from "@/components/home/newsletter-cta"

export const metadata: Metadata = {
  title: "The Food System Inside Your Family",
  description:
    "A practical framework any family can follow — one weekly plate, three types of food, and daily habits that build gut health for every person at the table.",
  openGraph: {
    title: "The Food System Inside Your Family | EatoBiotics",
    description:
      "A practical framework any family can follow — one weekly plate, three types of food, and daily habits that build gut health for every person at the table.",
  },
}

export default function FamilyPage() {
  return (
    <>
      <FamilyHero />
      <div
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))",
        }}
      />
      <FamilyBenefits />
      <FamilyWhy />
      <FamilyBiotics />
      <FamilyPlate />
      <FamilyManifesto />
      <div className="section-divider" />
      <NewsletterCta />
    </>
  )
}
