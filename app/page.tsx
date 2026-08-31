import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { DEV_COOKIE, devPasswordToken, getDevPassword, isPasswordGateEnabled } from "@/lib/dev-password-gate"

export const metadata: Metadata = {
  title: "EatoBiotics — The Food System Inside You",
  description:
    "Take your free Food System Assessment and discover your Biotics Score™ across Prebiotics, Probiotics and Postbiotics. Then go deeper with your Personal Food System Consultation.",
  openGraph: {
    title: "EatoBiotics — The Food System Inside You",
    description:
      "Take your free Food System Assessment and discover your Biotics Score™ across Prebiotics, Probiotics and Postbiotics.",
    url: "https://eatobiotics.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "EatoBiotics — The Food System Inside You",
    description: "Take your free Food System Assessment and discover your Biotics Score™ across Prebiotics, Probiotics and Postbiotics.",
  },
  keywords: [
    "gut health", "microbiome", "prebiotic", "probiotic", "postbiotic",
    "food system", "food system assessment", "biotics score", "AI meal analysis",
    "digestive health", "gut bacteria", "biotics",
  ],
}
import { FeedSeedHeal } from "@/components/home/feed-seed-heal"
import { HowItWorks } from "@/components/home/how-it-works"
import { DigitalTwinSection } from "@/components/home/digital-twin-section"
import { EatoxMissionSection } from "@/components/home/eatox-mission-section"
import { ScorePreview } from "@/components/home/score-preview"
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
      {/* Eight sections, built on the order #177 and #178 independently arrived
          at: the score moves above the fold, the platform explanation below it,
          and the tail is one block. Two changes since: EatoX (#188) was added
          before the tail, and the global/local section was dropped.

          PowersEverything, Ecosystem and GlobalDirection are all off the
          homepage but still render on /c/[country] and /enter — they left this
          page, not the codebase. */}
      <Suspense fallback={null}><Hero /></Suspense>
      <SoftDivider />
      <HowItWorks />
      <ScorePreview />
      {/* One divider, not two: GlobalDirection sat between these with a divider
          on each side, and keeping both would stack two rules with nothing in
          between. It still renders on /enter, so the component stays. */}
      <SoftDivider />
      <FeedSeedHeal />
      <DigitalTwinSection />
      <SoftDivider />
      {/* Turns "this helps me" into "this helps build something bigger", while
          the reader is still in the product story and before pricing asks for
          anything. */}
      <EatoxMissionSection />
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
