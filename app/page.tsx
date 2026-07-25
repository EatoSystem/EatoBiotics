import type { Metadata } from "next"
import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { requirePreviewAccess } from "@/lib/preview-access"

export const metadata: Metadata = {
  title: "EatoBiotics — The Food System Inside You",
  description:
    "Discover your Food System Score, analyse every meal with AI, and get a personalised weekly food system report. Build the microbiome that powers your energy, digestion, and immunity.",
  openGraph: {
    title: "EatoBiotics — The Food System Inside You",
    description:
      "Discover your Food System Score, analyse every meal with AI, and get a personalised weekly food system report.",
    url: "https://eatobiotics.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "EatoBiotics — The Food System Inside You",
    description: "Discover your Food System Score, analyse every meal with AI, and get a personalised weekly food system report.",
  },
  keywords: [
    "gut health", "microbiome", "prebiotic", "probiotic", "postbiotic",
    "food system", "gut health score", "weekly gut report", "AI meal analysis",
    "digestive health", "gut bacteria", "biotics",
  ],
}
import { PowersEverything } from "@/components/home/powers-everything"
import { TheFramework } from "@/components/home/the-framework"
import { HowItWorks } from "@/components/home/how-it-works"
import { DigitalTwinSection } from "@/components/home/digital-twin-section"
import { ScorePreview } from "@/components/home/score-preview"
import { Ecosystem } from "@/components/home/ecosystem"
import { StateOfProduct } from "@/components/home/state-of-product"
import { GlobalDirection } from "@/components/home/global-direction"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { ClosingCta } from "@/components/home/closing-cta"

export default async function Home() {
  await requirePreviewAccess("/")

  return (
    <>
      <Suspense fallback={null}><Hero /></Suspense>
      <SoftDivider />
      <PowersEverything />
      <HowItWorks />
      <DigitalTwinSection />
      <TheFramework />
      <ScorePreview />
      <SoftDivider />
      <Ecosystem />
      <SoftDivider />
      <StateOfProduct />
      <GlobalDirection />
      <SoftDivider />
      <MembershipTeaser />
      <ClosingCta />
    </>
  )
}

function SoftDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px w-full max-w-[1100px]"
      style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, var(--icon-green) 18%, transparent), transparent)" }}
    />
  )
}
