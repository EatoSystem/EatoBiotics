import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { DEV_COOKIE, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"

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
import { FeedSeedHeal } from "@/components/home/feed-seed-heal"
import { HowItWorks } from "@/components/home/how-it-works"
import { DigitalTwinSection } from "@/components/home/digital-twin-section"
import { ScorePreview } from "@/components/home/score-preview"
import { GlobalDirection } from "@/components/home/global-direction"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { ClosingCta } from "@/components/home/closing-cta"

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
      {/* Seven sections, in the order #177 and #178 independently arrived at:
          the score and the global/local difference move above the fold, the
          platform explanation moves below it, and the tail is one block.

          PowersEverything and Ecosystem are dropped from the homepage — both
          still render on /c/[country] and /enter, so they leave this page, not
          the codebase. */}
      <Suspense fallback={null}><Hero /></Suspense>
      <SoftDivider />
      <HowItWorks />
      <ScorePreview />
      <SoftDivider />
      <GlobalDirection />
      <SoftDivider />
      <FeedSeedHeal />
      <DigitalTwinSection />
      <SoftDivider />
      {/* The closing block: pricing then the final CTA, deliberately with no
          divider between them so they read as one. */}
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
