import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { DEV_COOKIE, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"

export const metadata: Metadata = {
  title: "EatoBiotics — The Food System Inside You",
  description:
    "Discover your gut health score, analyse every meal with AI, and get a personalised weekly food system report. Build the microbiome that powers your energy, digestion, and immunity.",
  openGraph: {
    title: "EatoBiotics — The Food System Inside You",
    description:
      "Discover your gut health score, analyse every meal with AI, and get a personalised weekly food system report.",
    url: "https://eatobiotics.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "EatoBiotics — The Food System Inside You",
    description: "Discover your gut health score, analyse every meal with AI, and get a personalised weekly food system report.",
  },
  keywords: [
    "gut health", "microbiome", "prebiotic", "probiotic", "postbiotic",
    "food system", "gut health score", "weekly gut report", "AI meal analysis",
    "digestive health", "gut bacteria", "biotics",
  ],
}
import { Pathways } from "@/components/home/pathways"
import { TheThreeBiotics } from "@/components/home/the-three-biotics"
import { HowItWorks } from "@/components/home/how-it-works"
import { ThePlate } from "@/components/home/the-plate"
import { ScorePreview } from "@/components/home/score-preview"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { Testimonials } from "@/components/home/testimonials"
import { TrustDisclaimer } from "@/components/home/trust-disclaimer"
import { FAQ } from "@/components/home/faq"
import { StickyCta } from "@/components/start/sticky-cta"

async function requirePreviewAccess() {
  if (!isPasswordGateEnabled()) return

  const password = getDevPassword()
  if (!password) redirect("/enter?from=%2F")

  const cookieStore = await cookies()
  const expectedToken = await devPasswordToken(password)
  const hasAccess = cookieStore.get(DEV_COOKIE)?.value === expectedToken

  if (!hasAccess) redirect("/enter?from=%2F")
}

export default async function Home() {
  await requirePreviewAccess()

  return (
    <>
      <Suspense fallback={null}><Hero /></Suspense>
      <div style={{ height: "2px", background: "linear-gradient(90deg, var(--icon-lime), var(--icon-green), var(--icon-teal), var(--icon-yellow), var(--icon-orange))" }} />
      <Pathways />
      <TheThreeBiotics />
      <HowItWorks />
      <ThePlate />
      <div className="section-divider" />
      <ScorePreview />
      <div className="section-divider" />
      <MembershipTeaser />
      <div className="section-divider" />
      <Testimonials />
      <div className="section-divider" />
      <TrustDisclaimer />
      <FAQ />
      <StickyCta />
    </>
  )
}
