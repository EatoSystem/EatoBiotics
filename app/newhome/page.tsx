import type { Metadata } from "next"
import { Suspense } from "react"
import { Hero } from "@/components/home/hero"
import { ScorePreview } from "@/components/home/score-preview"
import { PowersEverything } from "@/components/home/powers-everything"
import { HowItWorks } from "@/components/home/how-it-works"
import { DigitalTwinSection } from "@/components/home/digital-twin-section"
import { TheFramework } from "@/components/home/the-framework"
import { MembershipTeaser } from "@/components/home/membership-teaser"
import { Ecosystem } from "@/components/home/ecosystem"
import { StateOfProduct } from "@/components/home/state-of-product"
import { GlobalDirection } from "@/components/home/global-direction"
import { ClosingCta } from "@/components/home/closing-cta"
import { PreviewBadge } from "@/components/dev/preview-badge"
import { requirePreviewAccess } from "@/lib/preview-access"

/**
 * Staging route for a homepage redesign.
 *
 * Composes exactly the same sections as `app/page.tsx` in a different order, so a
 * side-by-side comparison isolates sequence as the only variable. No component is
 * modified — promoting the winner means reordering the JSX in `app/page.tsx` and
 * deleting this directory.
 *
 * The running order is hook → proof → explanation → ask → trust:
 * `ScorePreview` moves up to second so the hero's "scan a meal in ~30 seconds"
 * promise pays off immediately rather than behind four explainer sections, and
 * `MembershipTeaser` moves ahead of the brand/philosophy sections so the ask lands
 * at peak intent instead of after it.
 */
export const metadata: Metadata = {
  title: "New Homepage (preview) — EatoBiotics",
  description: "Staging preview of a homepage redesign. Not a public page.",
  // Near-duplicate of "/" — must never be indexed or the two compete in search.
  robots: { index: false, follow: false },
}

export default async function NewHome() {
  await requirePreviewAccess("/newhome")

  return (
    <>
      <PreviewBadge />

      {/* Hook */}
      <Suspense fallback={null}>
        <Hero />
      </Suspense>
      <SoftDivider />

      {/* Proof — deliver the hero's promise before explaining anything */}
      <ScorePreview />
      <SoftDivider />

      {/* Explanation */}
      <PowersEverything />
      <HowItWorks />
      <DigitalTwinSection />
      <TheFramework />
      <SoftDivider />

      {/* Ask, at peak intent */}
      <MembershipTeaser />
      <SoftDivider />

      {/* Breadth, then trust and philosophy as objection-handling */}
      <Ecosystem />
      <SoftDivider />
      <StateOfProduct />
      <GlobalDirection />

      <ClosingCta />
    </>
  )
}

function SoftDivider() {
  return (
    <div
      aria-hidden
      className="mx-auto h-px w-full max-w-[1100px]"
      style={{
        background:
          "linear-gradient(90deg, transparent, color-mix(in srgb, var(--icon-green) 18%, transparent), transparent)",
      }}
    />
  )
}
